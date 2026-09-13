import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plug, CheckCircle2, Circle, Settings2, Users, CreditCard,
  Sliders, ExternalLink, Sparkles, Trash2, Plus, Brain,
  MessageSquare, BarChart3, Heart, Building2, Copy, RefreshCw,
  UserCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import slackLogo  from '@/assets/logos/slack.png';
import driveLogo  from '@/assets/logos/google-drive.png';
import notionLogo from '@/assets/logos/notion.png';
import githubLogo from '@/assets/logos/github.png';
import jiraLogo   from '@/assets/logos/jira.png';
import linearLogo from '@/assets/logos/linear-icon.png';

// ── Tab config ────────────────────────────────────────────────────────────────

type TabId = 'general' | 'ai' | 'connectors' | 'team' | 'billing';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'general',    label: 'General',    icon: Settings2  },
  { id: 'ai',         label: 'AI',         icon: Sparkles   },
  { id: 'connectors', label: 'Connectors', icon: Plug       },
  { id: 'team',       label: 'Team',       icon: Users      },
  { id: 'billing',    label: 'Billing',    icon: CreditCard },
];

// Staggered section reveal — each section in a tab fades in sequentially
function Section({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

// ── General tab ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  member: 'Member',
  individual: 'Personal Workspace',
};

function GeneralTab() {
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName,  setLastName]  = useState(user?.last_name  ?? '');
  const [jobTitle,  setJobTitle]  = useState(user?.job_title  ?? '');
  const [company,   setCompany]   = useState(user?.company    ?? '');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [feedback,  setFeedback]  = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [orgName,   setOrgName]   = useState('');

  useEffect(() => {
    api.get('/org/me')
      .then(r => setOrgName(r.data.organisation?.name ?? ''))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.patch('/users/me', { first_name: firstName, last_name: lastName, job_title: jobTitle, company });
      updateUser({
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        job_title: res.data.job_title,
        company: res.data.company,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setFeedback({ type: 'success', msg: 'Profile saved.' });
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    firstName !== (user?.first_name ?? '') ||
    lastName  !== (user?.last_name  ?? '') ||
    jobTitle  !== (user?.job_title  ?? '') ||
    company   !== (user?.company    ?? '');

  return (
    <div className="space-y-10 max-w-2xl">
      <Section index={0}>
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Profile</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Your personal details.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input id="jobTitle" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Team Lead" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
                <AnimatePresence mode="wait" initial={false}>
                  {saved ? (
                    <motion.span
                      key="saved"
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <CheckCircle2 className="size-3.5" /> Saved
                    </motion.span>
                  ) : (
                    <motion.span
                      key="save"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
            <AnimatePresence>
              {feedback && !saved && (
                <motion.p
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn('text-sm', feedback.type === 'success' ? 'text-green-600' : 'text-red-500')}
                >
                  {feedback.msg}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>
      </Section>

      <Section index={1}>
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Workspace</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Your current organisation and role.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <Building2 className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{orgName || 'Personal Workspace'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
              user?.role === 'admin'  ? 'bg-primary/10 text-primary' :
              user?.role === 'member' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-muted text-muted-foreground'
            )}>
              {ROLE_LABELS[user?.role ?? 'individual']}
            </span>
          </div>
        </section>
      </Section>
    </div>
  );
}

// ── Team tab ──────────────────────────────────────────────────────────────────

interface OrgMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

interface OrgData {
  id: number;
  name: string;
  is_personal: boolean;
  invite_token: string | null;
  email_domain: string | null;
}

function TeamTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isIndividual = user?.role === 'individual';
  const isAdmin = user?.role === 'admin';

  const [org,          setOrg]          = useState<OrgData | null>(null);
  const [members,      setMembers]      = useState<OrgMember[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [orgName,      setOrgName]      = useState('');
  const [emailDomain,  setEmailDomain]  = useState('');
  const [orgSaving,    setOrgSaving]    = useState(false);
  const [orgSaved,     setOrgSaved]     = useState(false);
  const [orgFeedback,  setOrgFeedback]  = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [tokenCopied,  setTokenCopied]  = useState(false);
  const [regen,        setRegen]        = useState(false);

  useEffect(() => {
    if (isIndividual) { setLoading(false); return; }
    Promise.all([
      api.get('/org/me'),
      api.get('/org/members'),
    ]).then(([orgRes, membersRes]) => {
      const o = orgRes.data.organisation as OrgData;
      setOrg(o);
      setOrgName(o.name);
      setEmailDomain(o.email_domain ?? '');
      setMembers(membersRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isIndividual]);

  const handleSaveOrg = async () => {
    setOrgSaving(true);
    setOrgFeedback(null);
    try {
      const res = await api.patch('/org/me', {
        name: orgName,
        email_domain: emailDomain || null,
      });
      setOrg(res.data.organisation);
      setOrgSaved(true);
      setTimeout(() => setOrgSaved(false), 2000);
      setOrgFeedback({ type: 'success', msg: 'Organisation updated.' });
    } catch (err: any) {
      setOrgFeedback({ type: 'error', msg: err.response?.data?.error ?? 'Failed to update.' });
    } finally {
      setOrgSaving(false);
    }
  };

  const handleCopyToken = () => {
    if (!org?.invite_token) return;
    navigator.clipboard.writeText(org.invite_token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const handleRegenToken = async () => {
    setRegen(true);
    try {
      const res = await api.post('/org/regenerate-token');
      setOrg(prev => prev ? { ...prev, invite_token: res.data.invite_token } : prev);
    } catch {
      // silent — token stays
    } finally {
      setRegen(false);
    }
  };

  if (isIndividual) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Section index={0}>
          <div className="rounded-lg border bg-muted/30 px-4 py-5 flex items-start gap-3">
            <UserCircle2 className="size-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">You're using a personal workspace.</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Create or join an organisation to collaborate with your team.
              </p>
            </div>
          </div>
        </Section>
        <Section index={1}>
          <div className="grid gap-4 sm:grid-cols-2">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <Card
                className="cursor-pointer hover:border-primary transition-colors h-full"
                onClick={() => navigate('/onboarding?step=create')}
              >
                <CardHeader>
                  <CardTitle className="text-base">Create an Organisation</CardTitle>
                  <CardDescription>Set up a shared workspace and invite your team.</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <Card
                className="cursor-pointer hover:border-primary transition-colors h-full"
                onClick={() => navigate('/onboarding?step=join')}
              >
                <CardHeader>
                  <CardTitle className="text-base">Join an Organisation</CardTitle>
                  <CardDescription>Enter an invite token from your team admin.</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </div>
        </Section>
      </div>
    );
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-10 max-w-2xl">
      {isAdmin && (
        <Section index={0}>
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Organisation settings</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Visible to admins only.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="orgName">Organisation name</Label>
                <Input id="orgName" value={orgName} onChange={e => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emailDomain">
                  Email domain{' '}
                  <span className="text-muted-foreground font-normal">(mock SSO only)</span>
                </Label>
                <Input
                  id="emailDomain"
                  value={emailDomain}
                  onChange={e => setEmailDomain(e.target.value)}
                  placeholder="acme.com"
                />
                <p className="text-xs text-muted-foreground">
                  Users signing in with this domain via "Sign in with SSO" will be auto-enrolled. Dev/demo use only.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button size="sm" onClick={handleSaveOrg} disabled={orgSaving}>
                    <AnimatePresence mode="wait" initial={false}>
                      {orgSaved ? (
                        <motion.span
                          key="saved"
                          className="flex items-center gap-1.5"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <CheckCircle2 className="size-3.5" /> Saved
                        </motion.span>
                      ) : (
                        <motion.span
                          key="save"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          {orgSaving ? 'Saving…' : 'Save'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
                <AnimatePresence>
                  {orgFeedback && !orgSaved && (
                    <motion.p
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn('text-sm', orgFeedback.type === 'success' ? 'text-green-600' : 'text-red-500')}
                    >
                      {orgFeedback.msg}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </Section>
      )}

      {isAdmin && org?.invite_token && (
        <Section index={1}>
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Invite token</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Share this with teammates so they can join your organisation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted px-4 py-2 font-mono text-sm tracking-widest text-center">
                {org.invite_token}
              </code>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm" onClick={handleCopyToken}>
                  <Copy className="size-3.5 mr-1" />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={tokenCopied ? 'copied' : 'copy'}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                    >
                      {tokenCopied ? 'Copied!' : 'Copy'}
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </motion.div>
              <Button variant="ghost" size="sm" onClick={handleRegenToken} disabled={regen} title="Regenerate token">
                <RefreshCw className={cn('size-3.5', regen && 'animate-spin')} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Regenerating will invalidate the current token. Anyone who hasn't joined yet will need the new one.
            </p>
          </section>
        </Section>
      )}

      <Section index={isAdmin ? 2 : 0}>
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Members</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {members.length} {members.length === 1 ? 'member' : 'members'} in {org?.name ?? 'your organisation'}.
            </p>
          </div>
          <div className="divide-y rounded-lg border overflow-hidden">
            {members.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold shrink-0">
                  {m.first_name?.[0]}{m.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.first_name} {m.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <span className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  m.role === 'admin'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {m.role === 'admin' ? 'Admin' : 'Member'}
                </span>
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                  Joined {new Date(m.created_at).toLocaleDateString()}
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      </Section>
    </div>
  );
}

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
  const [tone,       setTone]       = useState<ToneId>('coaching');
  const [memoryOn,   setMemoryOn]   = useState(true);
  const [insightsOn, setInsightsOn] = useState(true);
  const [memories,   setMemories]   = useState<Memory[]>(SAMPLE_MEMORIES);
  const [aboutYou,   setAboutYou]   = useState('');

  const deleteMemory = (id: string) => setMemories(prev => prev.filter(m => m.id !== id));

  return (
    <div className="space-y-10 max-w-2xl">
      <Section index={0}>
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
                <motion.button
                  key={preset.id}
                  onClick={() => setTone(preset.id)}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={cn(
                    'group flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground/40 hover:bg-muted/40'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className={cn(
                      'flex size-7 items-center justify-center rounded-md transition-colors',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="size-3.5" />
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <CheckCircle2 className="size-4 text-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{preset.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{preset.description}</p>
                  </div>
                  <p className="text-xs italic text-muted-foreground/70 leading-relaxed">{preset.example}</p>
                </motion.button>
              );
            })}
          </div>
        </section>
      </Section>

      <Section index={1}>
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Memory</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Work Buddy remembers things about you across challenges and conversations.
              </p>
            </div>
            <motion.button
              role="switch"
              aria-checked={memoryOn}
              onClick={() => setMemoryOn(v => !v)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
                memoryOn ? 'bg-primary' : 'bg-muted'
              )}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 600, damping: 35 }}
                className={cn(
                  'pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0',
                  memoryOn ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </motion.button>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {memoryOn ? (
              <motion.div
                key="memories-on"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  {memories.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
                      <Brain className="size-6 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No memories yet. They'll appear here as you chat.</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {memories.map(memory => (
                        <motion.div
                          key={memory.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm leading-relaxed">{memory.content}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{memory.createdAt}</p>
                            </div>
                            <motion.button
                              onClick={() => deleteMemory(memory.id)}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              className="mt-0.5 shrink-0 text-muted-foreground/50 transition-colors hover:text-destructive"
                              aria-label="Delete memory"
                            >
                              <Trash2 className="size-3.5" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                  <Button variant="outline" size="sm" className="mt-1 gap-1.5">
                    <Plus className="size-3.5" />
                    Add memory
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="memories-off"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-dashed px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">Memory is off. Work Buddy won't retain anything between sessions.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </Section>

      <Section index={2}>
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Weekly insights</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Simon analyses your challenge progress each week and surfaces coaching nudges on your dashboard.
              </p>
            </div>
            <motion.button
              role="switch"
              aria-checked={insightsOn}
              onClick={() => setInsightsOn(v => !v)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
                insightsOn ? 'bg-primary' : 'bg-muted'
              )}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 600, damping: 35 }}
                className={cn(
                  'pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0',
                  insightsOn ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </motion.button>
          </div>
          <AnimatePresence initial={false}>
            {!insightsOn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-dashed px-4 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Insights are off. The Insights section on your dashboard will show a disabled state.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </Section>

      <Section index={4}>
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">About you</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Anything you want Work Buddy to always know — your role, context, working style, or goals.
            </p>
          </div>
          <Textarea
            placeholder="e.g. I'm a team lead at a 40-person SaaS company..."
            value={aboutYou}
            onChange={e => setAboutYou(e.target.value)}
            className="min-h-28 resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{aboutYou.length} / 500 characters</p>
            <Button size="sm" disabled={aboutYou.length === 0}>Save</Button>
          </div>
        </section>
      </Section>
    </div>
  );
}

// ── Connectors tab ────────────────────────────────────────────────────────────

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
  { id: 'slack',        name: 'Slack',        description: 'Connect to your workspace to pull messages, threads, and channel activity into your analysis.', category: 'Communication',      status: 'disconnected', icon: slackLogo,  iconBg: 'bg-white' },
  { id: 'google-drive', name: 'Google Drive', description: 'Access Docs, Sheets, and Slides directly so Work Buddy can reference company documents.',        category: 'Documents',          status: 'disconnected', icon: driveLogo,  iconBg: 'bg-white' },
  { id: 'notion',       name: 'Notion',       description: 'Pull in wiki pages, databases, and project notes to give the AI richer context.',                category: 'Documents',          status: 'disconnected', icon: notionLogo, iconBg: 'bg-white' },
  { id: 'github',       name: 'GitHub',       description: 'Connect repositories to surface PR activity, issues, and code health signals.',                  category: 'Engineering',        status: 'coming_soon',  icon: githubLogo, iconBg: 'bg-white' },
  { id: 'jira',         name: 'Jira',         description: 'Sync tickets and sprint data so challenges can track delivery metrics automatically.',           category: 'Project Management', status: 'coming_soon',  icon: jiraLogo,   iconBg: 'bg-white' },
  { id: 'linear',       name: 'Linear',       description: 'Stream issue updates and cycle progress into your challenge and coaching context.',              category: 'Project Management', status: 'coming_soon',  icon: linearLogo, iconBg: 'bg-[#5E6AD2]' },
];

function ConnectorStatusBadge({ status }: { status: ConnectorStatus }) {
  if (status === 'connected') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <CheckCircle2 className="size-3" /> Connected
    </span>
  );
  if (status === 'coming_soon') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Sliders className="size-3" /> Coming soon
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Circle className="size-3" /> Not connected
    </span>
  );
}

function ConnectorCard({ connector, index }: { connector: MCPConnector; index: number }) {
  const isComingSoon = connector.status === 'coming_soon';
  const isConnected  = connector.status === 'connected';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      whileHover={isComingSoon ? undefined : { y: -2 }}
    >
      <Card className={cn('flex flex-col h-full', isComingSoon && 'opacity-60')}>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg overflow-hidden p-1.5', connector.iconBg)}>
            <img src={connector.icon} alt={`${connector.name} logo`} className="size-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{connector.name}</CardTitle>
              <ConnectorStatusBadge status={connector.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{connector.category}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 gap-4">
          <CardDescription className="text-sm leading-relaxed flex-1">{connector.description}</CardDescription>
          <div className="flex items-center gap-2">
            {isComingSoon ? (
              <Button size="sm" variant="outline" disabled>Coming soon</Button>
            ) : isConnected ? (
              <>
                <Button size="sm" variant="outline">Configure <ExternalLink className="ml-1 size-3" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">Disconnect</Button>
              </>
            ) : (
              <Button size="sm"><Plug className="mr-1 size-3" />Connect</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ConnectorsTab() {
  const categories = [...new Set(MCP_CONNECTORS.map(c => c.category))];
  let globalIndex = 0;
  return (
    <div className="space-y-8">
      <Section index={0}>
        <div>
          <h2 className="text-lg font-semibold">MCP Server Connectors</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect Work Buddy to the tools your team already uses.
          </p>
        </div>
      </Section>
      {categories.map((category, catIdx) => (
        <Section key={category} index={catIdx + 1}>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{category}</h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {MCP_CONNECTORS.filter(c => c.category === category).map(connector => (
                <ConnectorCard key={connector.id} connector={connector} index={globalIndex++} />
              ))}
            </div>
          </div>
        </Section>
      ))}
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <Section index={0}>
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">{title} settings coming soon.</p>
      </div>
    </Section>
  );
}

// ── Tab content wrapper with AnimatePresence ──────────────────────────────────

const TAB_ORDER: TabId[] = ['general', 'ai', 'connectors', 'team', 'billing'];

function TabContent({ activeTab }: { activeTab: TabId }) {
  const reduced = useReducedMotion();
  const prevTabRef = useRef<TabId>(activeTab);
  const direction = TAB_ORDER.indexOf(activeTab) > TAB_ORDER.indexOf(prevTabRef.current) ? 1 : -1;

  useEffect(() => {
    prevTabRef.current = activeTab;
  }, [activeTab]);

  const variants = {
    enter: (d: number) => ({
      opacity: 0,
      x: reduced ? 0 : d * 24,
    }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({
      opacity: 0,
      x: reduced ? 0 : d * -24,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={activeTab}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {activeTab === 'general'    && <GeneralTab />}
        {activeTab === 'ai'         && <AITab />}
        {activeTab === 'connectors' && <ConnectorsTab />}
        {activeTab === 'team'       && <TeamTab />}
        {activeTab === 'billing'    && <PlaceholderTab title="Billing" />}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  return (
    <div className="flex flex-col gap-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your workspace configuration and integrations.</p>
      </motion.div>

      {/* Tab bar with sliding indicator */}
      <div className="relative flex gap-1 border-b pb-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative inline-flex items-center gap-2 px-3 pb-3 text-sm font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <TabContent activeTab={activeTab} />
    </div>
  );
}
