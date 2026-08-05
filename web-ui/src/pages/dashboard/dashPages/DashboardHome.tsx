import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Plus,
  Zap,
  Lightbulb,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import api from '@/lib/api';

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  start_date: string;
  end_date?: string;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  source_type: 'challenge' | 'system';
  source_id?: number;
}

const RULE_ICONS: Record<string, React.ElementType> = {
  overdue:       Clock,
  'due-soon':    Clock,
  'stale-checkin': MessageSquare,
  'no-end-date': Calendar,
  behind:        TrendingDown,
  'no-documents': FileText,
};

function iconForItem(item: ActionItem): React.ElementType {
  const prefix = item.id.replace(/-\d+$/, '');
  return RULE_ICONS[prefix] ?? Target;
}


const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-blue-400',
};

const PRIORITY_BADGE: Record<string, string> = {
  high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
  low: 'text-accent-foreground bg-accent',
};

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function greeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges,   setChallenges]   = useState<Challenge[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [docCount,     setDocCount]     = useState<number | null>(null);
  const [actionItems,  setActionItems]  = useState<ActionItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    api.get(`/challenges/user/${user.id}`)
      .then(res => setChallenges(res.data))
      .catch(err => console.error('Failed to load challenges:', err))
      .finally(() => setIsLoading(false));

    api.get('/documents')
      .then(res => {
        const docs: any[] = res.data.documents ?? [];
        setDocCount(docs.filter(d => d.status === 'COMPLETE').length);
      })
      .catch(() => setDocCount(0));

    api.get('/dashboard/action-items')
      .then(res => setActionItems(res.data.action_items ?? []))
      .catch(() => setActionItems([]))
      .finally(() => setItemsLoading(false));
  }, [user?.id]);

  const active = challenges.filter(c => c.status === 'ACTIVE');
  const completed = challenges.filter(c => c.status === 'COMPLETED');
  const avgProgress = active.length
    ? Math.round(active.reduce((sum, c) => sum + c.progress, 0) / active.length)
    : 0;
  const dueSoon = active.filter(c => c.end_date && daysUntil(c.end_date) <= 7).length;
  const upcomingDeadlines = active
    .filter(c => c.end_date)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
    .slice(0, 5);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto w-full px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {user ? greeting(user.first_name) : 'Dashboard'}
            </h1>
            <p className="text-muted-foreground mt-1">{today}</p>
          </div>
          <Button onClick={() => navigate('/dashboard/challenges/createchallenge')}>
            <Plus className="w-4 h-4 mr-2" />
            New Challenge
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="nm-raised border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Challenges</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {isLoading ? '—' : active.length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-accent">
                  <Target className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="nm-raised border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Progress</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {isLoading ? '—' : `${avgProgress}%`}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-[hsl(var(--status-active)/0.12)]">
                  <TrendingUp className="w-5 h-5 text-[hsl(var(--status-active))]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="nm-raised border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {isLoading ? '—' : completed.length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-[hsl(var(--status-completed)/0.12)]">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-completed))]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="nm-raised border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Due This Week</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {isLoading ? '—' : dueSoon}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${dueSoon > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-muted'}`}>
                  <Clock className={`w-5 h-5 ${dueSoon > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="nm-raised border-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard/uploads')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Indexed Documents</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {docCount === null ? '—' : docCount}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-sky-50 dark:bg-sky-950">
                  <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Challenges + Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Active Challenges */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Active Challenges</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/challenges/')}>
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {isLoading ? (
              <Card className="nm-raised border-0">
                <CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent>
              </Card>
            ) : active.length === 0 ? (
              <Card className="nm-raised border-0">
                <CardContent className="py-10 text-center">
                  <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No active challenges yet.</p>
                  <Button className="mt-4" size="sm" onClick={() => navigate('/dashboard/challenges/createchallenge')}>
                    <Plus className="w-4 h-4 mr-1" /> Create your first challenge
                  </Button>
                </CardContent>
              </Card>
            ) : (
              active.slice(0, 5).map(challenge => (
                <Card
                  key={challenge.id}
                  className="nm-raised border-0 cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all"
                  onClick={() => navigate(`/dashboard/challenges/${challenge.id}`)}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={challenge.status} />
                          <span className="text-xs text-muted-foreground capitalize">
                            {challenge.category.toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-medium text-foreground truncate">{challenge.title}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground shrink-0">{challenge.progress}%</span>
                    </div>
                    <ProgressBar value={challenge.progress} />
                    {challenge.end_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Due {new Date(challenge.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {daysUntil(challenge.end_date) <= 7 && daysUntil(challenge.end_date) >= 0 && (
                          <span className="ml-1 text-red-500 font-medium">
                            · {daysUntil(challenge.end_date) === 0 ? 'Due today' : `${daysUntil(challenge.end_date)}d left`}
                          </span>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Deadlines</h2>
            <Card className="nm-raised border-0">
              <CardContent className="pt-5 pb-2">
                {isLoading ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
                ) : upcomingDeadlines.length === 0 ? (
                  <div className="py-6 text-center">
                    <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No deadlines set</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {upcomingDeadlines.map(c => {
                      const days = daysUntil(c.end_date!);
                      return (
                        <li
                          key={c.id}
                          className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                          onClick={() => navigate(`/dashboard/challenges/${c.id}`)}
                        >
                          <div className={`p-1.5 rounded-full ${days <= 3 ? 'bg-red-50 dark:bg-red-950' : 'bg-muted'}`}>
                            <Clock className={`w-3.5 h-3.5 ${days <= 3 ? 'text-red-500' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                            <p className={`text-xs ${days <= 3 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                              {days === 0 ? 'Due today' : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Items + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Action Items */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Action Items</h2>
            <div className="space-y-3">
              {itemsLoading ? (
                [1, 2, 3].map(n => (
                  <Card key={n} className="nm-raised border-0">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start gap-3 animate-pulse">
                        <div className="size-7 rounded-md bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : actionItems.length === 0 ? (
                <Card className="nm-raised border-0">
                  <CardContent className="py-10 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-[hsl(var(--status-active))] mb-2" />
                    <p className="text-sm text-muted-foreground">No action items right now — you're on track.</p>
                  </CardContent>
                </Card>
              ) : (
                actionItems.map(item => {
                  const Icon = iconForItem(item);
                  const isClickable = item.source_type === 'challenge' && item.source_id;
                  return (
                    <Card
                      key={item.id}
                      className={`nm-raised border-0 border-l-4 ${PRIORITY_STYLES[item.priority]} ${isClickable ? 'cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all' : ''}`}
                      onClick={isClickable ? () => navigate(`/dashboard/challenges/${item.source_id}`) : undefined}
                    >
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-md bg-muted shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-foreground">{item.title}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${PRIORITY_BADGE[item.priority]}`}>
                                {item.priority}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Insights</h2>
            <Card className="nm-raised border-0">
              <CardContent className="py-10 text-center flex flex-col items-center gap-3">
                <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-950">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Weekly insights coming in Phase 6B</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Simon will analyse your challenge progress and conversations to surface patterns and coaching nudges.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4">
          <Card
            className="nm-raised border-0 cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all"
            onClick={() => navigate('/dashboard/workbuddychats/workbuddychat')}
          >
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent">
                <MessageSquare className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Ask your AI coach</p>
                <p className="text-xs text-muted-foreground">Get advice on team efficiency</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="nm-raised border-0 cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all"
            onClick={() => navigate('/dashboard/challenges/createchallenge')}
          >
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-[hsl(var(--status-active)/0.12)]">
                <Plus className="w-5 h-5 text-[hsl(var(--status-active))]" />
              </div>
              <div>
                <p className="font-medium text-foreground">New challenge</p>
                <p className="text-xs text-muted-foreground">Set a goal for your team</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="nm-raised border-0 cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all"
            onClick={() => navigate('/dashboard/uploads/new-upload')}
          >
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-[hsl(var(--status-completed)/0.12)]">
                <Zap className="w-5 h-5 text-[hsl(var(--status-completed))]" />
              </div>
              <div>
                <p className="font-medium text-foreground">Upload data</p>
                <p className="text-xs text-muted-foreground">Share datasets for analysis</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
