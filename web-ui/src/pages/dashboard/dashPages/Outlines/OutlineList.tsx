import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Layers, ArrowRight, CompassIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { challengeApi } from '@/lib/api';
import api from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OutlinePhaseSnap {
  checklist_items: { is_complete: boolean }[];
  habits: { logs: unknown[] }[];
  check_in_prompts: { responded_at: string | null }[];
}

interface OutlineSummary {
  id: number;
  challenge_id: number;
  title: string;
  why: string;
  status: string;
  updated_at: string;
  phases: OutlinePhaseSnap[];
}

interface ChallengeGroup {
  id: number;
  title: string;
  category: string;
  outlines: OutlineSummary[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function checklistProgress(outline: OutlineSummary): number {
  let total = 0;
  let done = 0;
  for (const phase of outline.phases) {
    total += phase.checklist_items.length;
    done += phase.checklist_items.filter(i => i.is_complete).length;
  }
  return total > 0 ? done / total : 0;
}

function totalPhases(outline: OutlineSummary): number {
  return outline.phases.length;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function OutlineRow({ outline, challengeId }: { outline: OutlineSummary; challengeId: number }) {
  const navigate = useNavigate();
  const progress = checklistProgress(outline);
  const pct = Math.round(progress * 100);

  return (
    <div
      className="nm-raised rounded-2xl px-5 py-4 bg-background flex items-center gap-4 hover:brightness-[0.97] dark:hover:brightness-110 transition-all cursor-pointer group"
      onClick={() => navigate(`/dashboard/challenges/${challengeId}/outlines/${outline.id}`)}
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-semibold text-foreground text-sm truncate">{outline.title}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
            outline.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
              : outline.status === 'COMPLETED'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                : 'bg-muted text-muted-foreground'
          }`}>
            {outline.status}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Layers className="w-3 h-3" />
            {totalPhases(outline)} {totalPhases(outline) === 1 ? 'phase' : 'phases'}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Updated {formatRelative(outline.updated_at)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex-1 bg-muted rounded-full h-1.5"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-foreground w-8 text-right flex-shrink-0">{pct}%</span>
        </div>
      </div>

      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OutlineList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ChallengeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) loadOutlines();
  }, [user]);

  const loadOutlines = async () => {
    try {
      const challenges = await challengeApi.getAll(user!.id);
      const outlineResults = await Promise.all(
        challenges.map(c =>
          api.get(`/challenges/${c.id}/outlines`)
            .then(r => r.data.outlines as OutlineSummary[])
            .catch(() => [] as OutlineSummary[])
        )
      );
      setGroups(
        challenges
          .map((c, i) => ({ id: c.id, title: c.title, category: c.category, outlines: outlineResults[i] }))
          .filter(g => g.outlines.length > 0)
      );
    } catch (err) {
      console.error('Failed to load outlines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CompassIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Solution Outlines</h1>
            <p className="text-sm text-muted-foreground">Structured plans Simon has created with you</p>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="nm-raised rounded-2xl p-12 text-center bg-background">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No outlines yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Ask Simon for a structured action plan in any challenge chat — he'll create a trackable outline for you.
            </p>
            <Button onClick={() => navigate('/dashboard/challenges')}>
              Go to Challenges
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(group => (
              <section key={group.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {group.title}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{group.category}</span>
                </div>
                <div className="space-y-3">
                  {group.outlines.map(outline => (
                    <OutlineRow key={outline.id} outline={outline} challengeId={group.id} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
