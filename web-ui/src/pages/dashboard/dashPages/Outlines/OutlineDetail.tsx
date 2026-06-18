import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, BookOpen, ChevronDown, CheckSquare, Square,
  Flame, Calendar, Loader2, Edit2, Check, Layers
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import api from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface HabitLog {
  id: number;
  habit_id: number;
  logged_for: string;
  notes?: string;
  created_at: string;
}

interface ChecklistItem {
  id: number;
  phase_id: number;
  order_index: number;
  description: string;
  why_it_matters?: string;
  is_complete: boolean;
  completed_at?: string;
}

interface Habit {
  id: number;
  phase_id: number;
  order_index: number;
  description: string;
  cadence: 'DAILY' | 'WEEKLY';
  why_it_matters?: string;
  logs: HabitLog[];
}

interface CheckInPrompt {
  id: number;
  phase_id: number;
  order_index: number;
  question: string;
  scheduled_for?: string;
  response?: string;
  responded_at?: string;
}

interface OutlinePhase {
  id: number;
  outline_id: number;
  order_index: number;
  title: string;
  timeframe?: string;
  purpose: string;
  checklist_items: ChecklistItem[];
  habits: Habit[];
  check_in_prompts: CheckInPrompt[];
}

interface SolutionOutline {
  id: number;
  challenge_id: number;
  title: string;
  why: string;
  status: string;
  created_at: string;
  phases: OutlinePhase[];
}

// ── Utility functions ─────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function isLoggedForCurrentPeriod(habit: Habit): boolean {
  if (habit.logs.length === 0) return false;

  if (habit.cadence === 'DAILY') {
    const today = todayStr();
    return habit.logs.some(l => l.logged_for.split('T')[0] === today);
  }

  // WEEKLY — any log this Mon–Sun week
  const weekStart = getMondayOfWeek(new Date());
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
  return habit.logs.some(l => {
    const d = new Date(l.logged_for);
    return d >= weekStart && d < weekEnd;
  });
}

function computeStreak(logs: HabitLog[], cadence: 'DAILY' | 'WEEKLY'): number {
  if (logs.length === 0) return 0;

  if (cadence === 'DAILY') {
    const loggedDays = new Set(logs.map(l => l.logged_for.split('T')[0]));
    const today = todayStr();
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

    if (!loggedDays.has(today) && !loggedDays.has(yesterday)) return 0;

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!loggedDays.has(today)) cursor.setDate(cursor.getDate() - 1);

    while (loggedDays.has(cursor.toISOString().split('T')[0])) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  // WEEKLY
  const loggedWeeks = new Set(
    logs.map(l => getMondayOfWeek(new Date(l.logged_for)).toISOString().split('T')[0])
  );
  const thisWeek = getMondayOfWeek(new Date()).toISOString().split('T')[0];
  const lastWeek = getMondayOfWeek(new Date(Date.now() - 7 * 86_400_000)).toISOString().split('T')[0];

  if (!loggedWeeks.has(thisWeek) && !loggedWeeks.has(lastWeek)) return 0;

  let streak = 0;
  let cursor = getMondayOfWeek(new Date());
  if (!loggedWeeks.has(thisWeek)) cursor = getMondayOfWeek(new Date(Date.now() - 7 * 86_400_000));

  while (loggedWeeks.has(cursor.toISOString().split('T')[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

function computePhaseProgress(phase: OutlinePhase, createdAt: string): number {
  const categories: { ratio: number; weight: number }[] = [];

  if (phase.checklist_items.length > 0) {
    const completed = phase.checklist_items.filter(i => i.is_complete).length;
    categories.push({ ratio: completed / phase.checklist_items.length, weight: 0.4 });
  }

  if (phase.habits.length > 0) {
    const daysSince = Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000));
    const totalLogs = phase.habits.reduce((s, h) => s + h.logs.length, 0);
    const expected = phase.habits.reduce(
      (s, h) => s + (h.cadence === 'DAILY' ? daysSince : Math.max(1, Math.floor(daysSince / 7))),
      0
    );
    categories.push({ ratio: Math.min(1, totalLogs / expected), weight: 0.4 });
  }

  if (phase.check_in_prompts.length > 0) {
    const responded = phase.check_in_prompts.filter(p => p.responded_at).length;
    categories.push({ ratio: responded / phase.check_in_prompts.length, weight: 0.2 });
  }

  if (categories.length === 0) return 0;

  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
  return categories.reduce((s, c) => s + c.ratio * c.weight, 0) / totalWeight;
}

function computeOutlineProgress(outline: SolutionOutline): number {
  if (outline.phases.length === 0) return 0;
  const sum = outline.phases.reduce((s, p) => s + computePhaseProgress(p, outline.created_at), 0);
  return sum / outline.phases.length;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const pct = Math.round(value * 100);
  return (
    <div
      className={`w-full bg-muted rounded-full h-1.5 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="bg-primary h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OutlineDetail() {
  const { id: challengeId, outlineId } = useParams<{ id: string; outlineId: string }>();
  const navigate = useNavigate();

  const [outline, setOutline] = useState<SolutionOutline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([0]));
  const [checkInDrafts, setCheckInDrafts] = useState<Record<number, string>>({});
  const [editingCheckIns, setEditingCheckIns] = useState<Set<number>>(new Set());
  const [loggingHabits, setLoggingHabits] = useState<Set<number>>(new Set());
  const [savingCheckIns, setSavingCheckIns] = useState<Set<number>>(new Set());

  useEffect(() => { loadOutline(); }, [outlineId]);

  const loadOutline = async () => {
    try {
      const res = await api.get(`/outlines/${outlineId}`);
      setOutline(res.data.outline);
    } catch (err) {
      console.error('Failed to load outline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => navigate(`/dashboard/challenges/${challengeId}`);

  const togglePhase = (index: number) => {
    setOpenPhases(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  // ── Checklist ──────────────────────────────────────────────────────────────

  const toggleChecklistItem = async (phaseId: number, itemId: number, current: boolean) => {
    const next = !current;
    setOutline(prev => prev && ({
      ...prev,
      phases: prev.phases.map(p => p.id !== phaseId ? p : {
        ...p,
        checklist_items: p.checklist_items.map(i => i.id !== itemId ? i : {
          ...i, is_complete: next, completed_at: next ? new Date().toISOString() : undefined,
        }),
      }),
    }));
    try {
      await api.patch(`/checklist-items/${itemId}`, { is_complete: next });
    } catch {
      // Revert
      setOutline(prev => prev && ({
        ...prev,
        phases: prev.phases.map(p => p.id !== phaseId ? p : {
          ...p,
          checklist_items: p.checklist_items.map(i => i.id !== itemId ? i : {
            ...i, is_complete: current, completed_at: current ? i.completed_at : undefined,
          }),
        }),
      }));
    }
  };

  // ── Habits ─────────────────────────────────────────────────────────────────

  const logHabit = async (phaseId: number, habitId: number) => {
    setLoggingHabits(prev => new Set([...prev, habitId]));
    try {
      const res = await api.post(`/habits/${habitId}/log`, { logged_for: todayStr() });
      const newLog: HabitLog = res.data.log;
      setOutline(prev => prev && ({
        ...prev,
        phases: prev.phases.map(p => p.id !== phaseId ? p : {
          ...p,
          habits: p.habits.map(h => h.id !== habitId ? h : {
            ...h,
            logs: [...h.logs.filter(l => l.logged_for.split('T')[0] !== todayStr()), newLog],
          }),
        }),
      }));
    } catch (err) {
      console.error('Failed to log habit:', err);
    } finally {
      setLoggingHabits(prev => { const n = new Set(prev); n.delete(habitId); return n; });
    }
  };

  // ── Check-ins ──────────────────────────────────────────────────────────────

  const saveCheckIn = async (phaseId: number, promptId: number) => {
    const text = checkInDrafts[promptId]?.trim();
    if (!text) return;
    setSavingCheckIns(prev => new Set([...prev, promptId]));
    try {
      const res = await api.patch(`/check-in-prompts/${promptId}/respond`, { response: text });
      const updated: CheckInPrompt = res.data.prompt;
      setOutline(prev => prev && ({
        ...prev,
        phases: prev.phases.map(p => p.id !== phaseId ? p : {
          ...p,
          check_in_prompts: p.check_in_prompts.map(c => c.id !== promptId ? c : updated),
        }),
      }));
      setCheckInDrafts(prev => { const n = { ...prev }; delete n[promptId]; return n; });
      setEditingCheckIns(prev => { const n = new Set(prev); n.delete(promptId); return n; });
    } catch (err) {
      console.error('Failed to save check-in:', err);
    } finally {
      setSavingCheckIns(prev => { const n = new Set(prev); n.delete(promptId); return n; });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!outline) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Outline not found</h2>
          <Button onClick={goBack}>Back to challenge</Button>
        </div>
      </div>
    );
  }

  const overallProgress = computeOutlineProgress(outline);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="font-bold text-foreground text-lg truncate">{outline.title}</h1>
          </div>
          <StatusBadge status={outline.status} className="flex-shrink-0" />
        </div>

        {/* Why callout */}
        <div className="nm-inset rounded-xl px-4 py-3 mb-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Purpose</p>
          <p className="text-sm text-foreground leading-relaxed">{outline.why}</p>
        </div>

        {/* Overall progress */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Overall progress</span>
          <ProgressBar value={overallProgress} className="flex-1" />
          <span className="text-xs font-semibold text-foreground w-8 text-right">
            {Math.round(overallProgress * 100)}%
          </span>
        </div>
      </div>

      {/* Phase list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {outline.phases.map((phase) => {
          const isOpen = openPhases.has(phase.order_index);
          const phaseProgress = computePhaseProgress(phase, outline.created_at);
          const totalItems = phase.checklist_items.length + phase.habits.length + phase.check_in_prompts.length;

          return (
            <div key={phase.id} className="nm-raised rounded-2xl overflow-hidden bg-background">
              {/* Phase header — clickable */}
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
                onClick={() => togglePhase(phase.order_index)}
                aria-expanded={isOpen}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">
                      Phase {phase.order_index + 1}: {phase.title}
                    </span>
                    {phase.timeframe && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        <Calendar className="w-3 h-3" />
                        {phase.timeframe}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <ProgressBar value={phaseProgress} />
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Phase content */}
              {isOpen && (
                <div className="px-5 pb-5 space-y-6 border-t border-border/50 pt-4">
                  {/* Purpose */}
                  <p className="text-xs text-muted-foreground italic leading-relaxed">{phase.purpose}</p>

                  {/* Checklist */}
                  {phase.checklist_items.length > 0 && (
                    <section>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Checklist</h4>
                      <ul className="space-y-2">
                        {phase.checklist_items.map(item => (
                          <li key={item.id}>
                            <button
                              className="flex items-start gap-3 w-full text-left group"
                              onClick={() => toggleChecklistItem(phase.id, item.id, item.is_complete)}
                            >
                              {item.is_complete
                                ? <CheckSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                : <Square className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                              }
                              <div className="flex-1 min-w-0">
                                <span className={`text-sm leading-snug ${item.is_complete ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {item.description}
                                </span>
                                {item.is_complete && item.completed_at && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Completed {formatDate(item.completed_at)}
                                  </p>
                                )}
                                {item.why_it_matters && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.why_it_matters}</p>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Habits */}
                  {phase.habits.length > 0 && (
                    <section>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Habits</h4>
                      <ul className="space-y-3">
                        {phase.habits.map(habit => {
                          const alreadyLogged = isLoggedForCurrentPeriod(habit);
                          const streak = computeStreak(habit.logs, habit.cadence);
                          const isLogging = loggingHabits.has(habit.id);

                          return (
                            <li key={habit.id} className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  <span className="text-sm text-foreground leading-snug">{habit.description}</span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    habit.cadence === 'DAILY'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                                      : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                                  }`}>
                                    {habit.cadence === 'DAILY' ? 'Daily' : 'Weekly'}
                                  </span>
                                </div>
                                {habit.why_it_matters && (
                                  <p className="text-[11px] text-muted-foreground leading-snug">{habit.why_it_matters}</p>
                                )}
                                {streak > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Flame className="w-3 h-3 text-orange-500" />
                                    <span
                                      className="text-[11px] font-medium text-orange-600 dark:text-orange-400"
                                      aria-label={`${streak}-${habit.cadence === 'DAILY' ? 'day' : 'week'} streak`}
                                    >
                                      {streak}-{habit.cadence === 'DAILY' ? 'day' : 'week'} streak
                                    </span>
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant={alreadyLogged ? 'secondary' : 'default'}
                                disabled={alreadyLogged || isLogging}
                                className="flex-shrink-0 h-8 text-xs rounded-xl"
                                onClick={() => logHabit(phase.id, habit.id)}
                              >
                                {isLogging
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : alreadyLogged
                                    ? <><Check className="w-3.5 h-3.5 mr-1" />Logged</>
                                    : habit.cadence === 'DAILY' ? 'Log today' : 'Log this week'
                                }
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}

                  {/* Check-ins */}
                  {phase.check_in_prompts.length > 0 && (
                    <section>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Check-ins</h4>
                      <ul className="space-y-4">
                        {phase.check_in_prompts.map(prompt => {
                          const isEditing = editingCheckIns.has(prompt.id);
                          const isSaving = savingCheckIns.has(prompt.id);
                          const hasResponse = !!prompt.responded_at;
                          const showInput = !hasResponse || isEditing;

                          return (
                            <li key={prompt.id} className="space-y-2">
                              <p className="text-sm font-medium text-foreground leading-snug">{prompt.question}</p>

                              {hasResponse && !isEditing && (
                                <div className="nm-inset rounded-xl px-4 py-3">
                                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{prompt.response}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-[10px] text-muted-foreground">
                                      Saved {formatDate(prompt.responded_at!)}
                                    </p>
                                    <button
                                      className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                                      onClick={() => {
                                        setEditingCheckIns(prev => new Set([...prev, prompt.id]));
                                        setCheckInDrafts(prev => ({ ...prev, [prompt.id]: prompt.response ?? '' }));
                                      }}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      Edit
                                    </button>
                                  </div>
                                </div>
                              )}

                              {showInput && (
                                <div className="space-y-2">
                                  <Textarea
                                    value={checkInDrafts[prompt.id] ?? ''}
                                    onChange={e => setCheckInDrafts(prev => ({ ...prev, [prompt.id]: e.target.value }))}
                                    placeholder="Write your reflection here…"
                                    className="text-sm min-h-[80px] resize-none"
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      disabled={!checkInDrafts[prompt.id]?.trim() || isSaving}
                                      className="h-8 text-xs rounded-xl"
                                      onClick={() => saveCheckIn(phase.id, prompt.id)}
                                    >
                                      {isSaving
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : 'Save reflection'
                                      }
                                    </Button>
                                    {isEditing && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 text-xs rounded-xl"
                                        onClick={() => {
                                          setEditingCheckIns(prev => { const n = new Set(prev); n.delete(prompt.id); return n; });
                                          setCheckInDrafts(prev => { const n = { ...prev }; delete n[prompt.id]; return n; });
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
