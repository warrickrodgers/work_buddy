import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Plus,
  Zap,
  Lightbulb,
  AlertCircle,
  Users,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
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

const SAMPLE_ACTION_ITEMS = [
  {
    id: 1,
    title: 'Schedule weekly team retrospective',
    description: 'Set up a recurring 30-min session to review progress and blockers.',
    priority: 'high',
    icon: Users,
  },
  {
    id: 2,
    title: 'Review communication challenge metrics',
    description: 'Two challenges are past the halfway mark — check if success criteria still apply.',
    priority: 'medium',
    icon: BarChart3,
  },
  {
    id: 3,
    title: 'Log this week\'s coaching notes',
    description: 'Your AI coach is waiting for your latest observations to refine guidance.',
    priority: 'medium',
    icon: MessageSquare,
  },
  {
    id: 4,
    title: 'Update end dates for paused challenges',
    description: 'Two challenges have no end date set. Adding one helps track urgency.',
    priority: 'low',
    icon: Calendar,
  },
];

const SAMPLE_INSIGHTS = [
  {
    id: 1,
    title: 'Communication trends up',
    body: 'Team communication scores have improved 23% over the past 4 weeks based on check-in sentiment.',
    tag: 'Positive trend',
    tagColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950',
  },
  {
    id: 2,
    title: 'Peak productivity window',
    body: 'Most task completions happen Tuesday–Wednesday mornings. Consider protecting this time from meetings.',
    tag: 'Scheduling insight',
    tagColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950',
  },
  {
    id: 3,
    title: 'Habit challenges outperform',
    body: 'Habit-type challenges have a 40% higher completion rate than skill-based ones in your history.',
    tag: 'Pattern detected',
    tagColor: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950',
  },
];

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-blue-400',
};

const PRIORITY_BADGE: Record<string, string> = {
  high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
  low: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950',
  PAUSED: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
  COMPLETED: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950',
  CANCELLED: 'text-muted-foreground bg-muted',
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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      api.get(`/challenges/user/${user.id}`)
        .then(res => setChallenges(res.data))
        .catch(err => console.error('Failed to load challenges:', err))
        .finally(() => setIsLoading(false));
    }
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Challenges</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {isLoading ? '—' : active.length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-950">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Progress</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {isLoading ? '—' : `${avgProgress}%`}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-950">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {isLoading ? '—' : completed.length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-violet-50 dark:bg-violet-950">
                  <CheckCircle2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
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
              <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : active.length === 0 ? (
              <Card>
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
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/dashboard/challenges/${challenge.id}`)}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[challenge.status] ?? ''}`}>
                            {challenge.status}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {challenge.category.toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-medium text-foreground truncate">{challenge.title}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground shrink-0">{challenge.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${challenge.progress}%` }}
                      />
                    </div>
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
            <Card>
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Action Items</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Sample</span>
            </div>
            <div className="space-y-3">
              {SAMPLE_ACTION_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <Card key={item.id} className={`border-l-4 ${PRIORITY_STYLES[item.priority]}`}>
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
              })}
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Insights</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Sample</span>
            </div>
            <div className="space-y-3">
              {SAMPLE_INSIGHTS.map(insight => (
                <Card key={insight.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-md bg-muted shrink-0 mt-0.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">{insight.title}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${insight.tagColor}`}>
                            {insight.tag}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{insight.body}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/dashboard/workbuddychats/workbuddychat')}
          >
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-950">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">Ask your AI coach</p>
                <p className="text-xs text-muted-foreground">Get advice on team efficiency</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/dashboard/challenges/createchallenge')}
          >
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-950">
                <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">New challenge</p>
                <p className="text-xs text-muted-foreground">Set a goal for your team</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/dashboard/uploads/new-upload')}
          >
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-violet-50 dark:bg-violet-950">
                <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
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
