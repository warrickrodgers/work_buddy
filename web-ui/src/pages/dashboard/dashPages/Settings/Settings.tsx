import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Plug,
  CheckCircle2,
  Circle,
  Settings2,
  Users,
  CreditCard,
  Sliders,
  ExternalLink,
  Sparkles,
  Trash2,
  Plus,
  Brain,
  MessageSquare,
  BarChart3,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import slackLogo  from '@/assets/logos/slack.png';
import driveLogo  from '@/assets/logos/google-drive.png';
import notionLogo from '@/assets/logos/notion.png';
import githubLogo from '@/assets/logos/github.png';
import jiraLogo   from '@/assets/logos/jira.png';
import linearLogo from '@/assets/logos/linear-icon.png';

// ── Tab config ────────────────────────────────────────────────────────────────

type TabId = 'general' | 'ai' | 'connectors' | 'team' | 'billing';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'general',    label: 'General',    icon: Settings2 },
  { id: 'ai',         label: 'AI',         icon: Sparkles  },
  { id: 'connectors', label: 'Connectors', icon: Plug      },
  { id: 'team',       label: 'Team',       icon: Users     },
  { id: 'billing',    label: 'Billing',    icon: CreditCard },
];

// ── AI tab ────────────────────────────────────────────────────────────────────

type ToneId = 'direct' | 'coaching' | 'analytical' | 'warm';

interface TonePreset {
  id: ToneId;
  label: string;
  description: string;
  example: string;
  icon: React.ElementType;
}

const TONE_PRESETS: TonePreset[] = [
  {
    id: 'direct',
    label: 'Direct',
    description: 'Clear and concise. Gets to the point without unnecessary preamble.',
    example: '"Your check-in rate dropped 40% this week. Here\'s what to fix."',
    icon: MessageSquare,
  },
  {
    id: 'coaching',
    label: 'Coaching',
    description: 'Guides with questions. Encourages reflection and self-discovery.',
    example: '"What do you think got in the way this week? Let\'s work through it."',
    icon: Brain,
  },
  {
    id: 'analytical',
    label: 'Analytical',
    description: 'Data-led and structured. Breaks down patterns with detail.',
    example: '"Based on 3 weeks of data, your peak focus window is 9–11am."',
    icon: BarChart3,
  },
  {
    id: 'warm',
    label: 'Warm',
    description: 'Empathetic and personal. Acknowledges the human side of work.',
    example: '"That sounds like a tough week. You\'re making progress — let\'s keep going."',
    icon: Heart,
  },
];

interface Memory {
  id: string;
  content: string;
  createdAt: string;
}

const SAMPLE_MEMORIES: Memory[] = [
  { id: '1', content: 'Prefers async communication over live meetings when possible.', createdAt: 'Jun 8' },
  { id: '2', content: 'Finds accountability check-ins most useful on Monday mornings.', createdAt: 'Jun 5' },
  { id: '3', content: 'Working on a team culture challenge with a 6-week timeline.', createdAt: 'Jun 1' },
  { id: '4', content: 'Tends to set ambitious goals — benefits from being anchored to smaller milestones.', createdAt: 'May 28' },
];

function AITab() {
  const [tone, setTone]         = useState<ToneId>('coaching');
  const [memoryOn, setMemoryOn] = useState(true);
  const [memories, setMemories] = useState<Memory[]>(SAMPLE_MEMORIES);
  const [aboutYou, setAboutYou] = useState('');

  const deleteMemory = (id: string) => setMemories(prev => prev.filter(m => m.id !== id));

  return (
    <div className="space-y-10 max-w-2xl">

      {/* ── Communication style ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Communication style</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            How Work Buddy talks to you during coaching and challenges.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TONE_PRESETS.map(preset => {
            const Icon = preset.icon;
            const isSelected = tone === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setTone(preset.id)}
                className={cn(
                  'group flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/40 hover:bg-muted/40'
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <div className={cn(
                    'flex size-7 items-center justify-center rounded-md',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="size-3.5" />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="size-4 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{preset.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {preset.description}
                  </p>
                </div>
                <p className="text-xs italic text-muted-foreground/70 leading-relaxed">
                  {preset.example}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Memory ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Memory</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Work Buddy remembers things about you across challenges and conversations.
            </p>
          </div>
          {/* Toggle */}
          <button
            role="switch"
            aria-checked={memoryOn}
            onClick={() => setMemoryOn(v => !v)}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
              memoryOn ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
                memoryOn ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {memoryOn ? (
          <div className="space-y-2">
            {memories.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
                <Brain className="size-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No memories yet. They'll appear here as you chat.
                </p>
              </div>
            ) : (
              memories.map(memory => (
                <div
                  key={memory.id}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{memory.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{memory.createdAt}</p>
                  </div>
                  <button
                    onClick={() => deleteMemory(memory.id)}
                    className="mt-0.5 shrink-0 text-muted-foreground/50 transition-colors hover:text-destructive"
                    aria-label="Delete memory"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="mt-1 gap-1.5">
              <Plus className="size-3.5" />
              Add memory
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Memory is off. Work Buddy won't retain anything between sessions.
            </p>
          </div>
        )}
      </section>

      {/* ── About you ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">About you</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Anything you want Work Buddy to always know — your role, context, working style, or goals.
            This is included in every conversation.
          </p>
        </div>
        <Textarea
          placeholder="e.g. I'm a team lead at a 40-person SaaS company. I manage 6 engineers and I'm focused on improving how we run retros and communicate blockers early."
          value={aboutYou}
          onChange={e => setAboutYou(e.target.value)}
          className="min-h-28 resize-none text-sm"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{aboutYou.length} / 500 characters</p>
          <Button size="sm" disabled={aboutYou.length === 0}>Save</Button>
        </div>
      </section>

    </div>
  );
}

// ── MCP Connector types ───────────────────────────────────────────────────────

type ConnectorStatus = 'connected' | 'disconnected' | 'coming_soon';

interface MCPConnector {
  id: string;
  name: string;
  description: string;
  category: string;
  status: ConnectorStatus;
  icon: string;
  iconBg: string;
}

const MCP_CONNECTORS: MCPConnector[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect to your workspace to pull messages, threads, and channel activity into your analysis.',
    category: 'Communication',
    status: 'disconnected',
    icon: slackLogo,
    iconBg: 'bg-white',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Access Docs, Sheets, and Slides directly so Work Buddy can reference company documents.',
    category: 'Documents',
    status: 'disconnected',
    icon: driveLogo,
    iconBg: 'bg-white',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Pull in wiki pages, databases, and project notes to give the AI richer context.',
    category: 'Documents',
    status: 'disconnected',
    icon: notionLogo,
    iconBg: 'bg-white',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect repositories to surface PR activity, issues, and code health signals.',
    category: 'Engineering',
    status: 'coming_soon',
    icon: githubLogo,
    iconBg: 'bg-white',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Sync tickets and sprint data so challenges can track delivery metrics automatically.',
    category: 'Project Management',
    status: 'coming_soon',
    icon: jiraLogo,
    iconBg: 'bg-white',
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Stream issue updates and cycle progress into your challenge and coaching context.',
    category: 'Project Management',
    status: 'coming_soon',
    icon: linearLogo,
    iconBg: 'bg-[#5E6AD2]',
  },
];

// ── ConnectorCard ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConnectorStatus }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle2 className="size-3" />
        Connected
      </span>
    );
  }
  if (status === 'coming_soon') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <Sliders className="size-3" />
        Coming soon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Circle className="size-3" />
      Not connected
    </span>
  );
}

function ConnectorCard({ connector }: { connector: MCPConnector }) {
  const isComingSoon = connector.status === 'coming_soon';
  const isConnected  = connector.status === 'connected';

  return (
    <Card className={cn('flex flex-col', isComingSoon && 'opacity-60')}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <div className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg overflow-hidden p-1.5',
          connector.iconBg
        )}>
          <img src={connector.icon} alt={`${connector.name} logo`} className="size-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base">{connector.name}</CardTitle>
            <StatusBadge status={connector.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{connector.category}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4">
        <CardDescription className="text-sm leading-relaxed flex-1">
          {connector.description}
        </CardDescription>
        <div className="flex items-center gap-2">
          {isComingSoon ? (
            <Button size="sm" variant="outline" disabled>Coming soon</Button>
          ) : isConnected ? (
            <>
              <Button size="sm" variant="outline">
                Configure
                <ExternalLink className="ml-1 size-3" />
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm">
              <Plug className="mr-1 size-3" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Tab content panels ────────────────────────────────────────────────────────

function ConnectorsTab() {
  const categories = [...new Set(MCP_CONNECTORS.map(c => c.category))];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">MCP Server Connectors</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Work Buddy to the tools your team already uses. Data flows through the Model
          Context Protocol (MCP), keeping it secure and scoped to what you authorise.
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {category}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {MCP_CONNECTORS.filter(c => c.category === category).map(connector => (
              <ConnectorCard key={connector.id} connector={connector} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
      <p className="text-sm text-muted-foreground">{title} settings coming soon.</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('ai');

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace configuration and integrations.
        </p>
      </div>

      {/* Mini subnav */}
      <div className="flex gap-1 border-b pb-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'general'    && <PlaceholderTab title="General" />}
        {activeTab === 'ai'         && <AITab />}
        {activeTab === 'connectors' && <ConnectorsTab />}
        {activeTab === 'team'       && <PlaceholderTab title="Team" />}
        {activeTab === 'billing'    && <PlaceholderTab title="Billing" />}
      </div>
    </div>
  );
}
