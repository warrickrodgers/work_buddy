import { Link } from 'react-router-dom';
import {
  Target,
  BrainCircuit,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle,
  Zap,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  Quote,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const PRIMARY = 'oklch(21% 0.034 264.665)';
const PRIMARY_LIGHT = 'oklch(26% 0.04 264.665)';
const ACCENT = 'oklch(62% 0.18 245)';

const FEATURES = [
  {
    icon: Target,
    title: 'Structured Challenges',
    desc: 'Turn vague intentions into trackable commitments. Define goals with clear success criteria, timelines, and measurable outcomes.',
  },
  {
    icon: BrainCircuit,
    title: 'AI Coaching on Demand',
    desc: "Your personal AI leadership coach is available at every step — asking the right questions, surfacing blind spots, and keeping you accountable.",
  },
  {
    icon: BarChart3,
    title: 'Actionable Insights',
    desc: "Surface patterns in your team's progress before they become problems. Know what's working and where to double down.",
  },
  {
    icon: Users,
    title: 'Team Accountability',
    desc: 'Build a culture where accountability is a practice, not a punishment. Track habits across individuals, teams, and the whole organisation.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Define what matters',
    desc: 'Work with your AI coach to frame a challenge that is meaningful, measurable, and grounded in what your team actually needs right now.',
  },
  {
    num: '02',
    title: 'Lead with intention',
    desc: 'Check in regularly, log observations, and let your AI coach help you adapt. Leadership is a practice — WorkBuddy makes it a daily one.',
  },
  {
    num: '03',
    title: 'Measure real progress',
    desc: "Watch progress metrics shift over time. Identify what drives change and build on it — no more guessing what's working.",
  },
];

const TESTIMONIALS = [
  {
    quote: "WorkBuddy changed how I think about leadership. I used to react to problems. Now I'm ahead of them.",
    name: 'Sarah Mitchell',
    role: 'Head of Engineering, Nexlane',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
  },
  {
    quote: "The AI coach doesn't just give answers — it asks better questions than I would have thought to ask myself.",
    name: 'James Okafor',
    role: 'VP Operations, Meridian Group',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  },
  {
    quote: 'We went from 40% challenge completion to over 80% in two quarters. The structure made all the difference.',
    name: 'Priya Sharma',
    role: 'Director of People, Tethys Co.',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
  },
];

const STATS = [
  { value: '3×', label: 'faster team alignment on new initiatives' },
  { value: '80%', label: 'of challenges completed when tracked in WorkBuddy' },
  { value: '2 weeks', label: 'average time to first measurable team behaviour shift' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">WorkBuddy</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#why" className="hover:text-white transition-colors">Our Purpose</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="text-white font-medium" style={{ backgroundColor: ACCENT }}>
                Get started free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden" style={{ backgroundColor: PRIMARY }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, oklch(35% 0.08 245 / 0.4), transparent 70%)` }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/60 mb-8 backdrop-blur-sm"
              style={{ backgroundColor: 'oklch(30% 0.05 264 / 0.5)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
              AI-powered team leadership — now available
            </div>
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-8">
              Great teams don't{' '}
              <span className="italic" style={{ color: ACCENT }}>happen.</span>
              <br />
              They're built.
            </h1>
            <p className="text-lg text-white/60 leading-relaxed max-w-lg mb-10">
              WorkBuddy gives workplace leaders the structure, AI coaching, and clarity to guide their teams
              through uncertainty — and out the other side stronger.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto text-white font-semibold px-8 gap-2" style={{ backgroundColor: ACCENT }}>
                  Start building your team
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white/80 hover:bg-white/10 hover:text-white">
                  See how it works
                </Button>
              </a>
            </div>
            <div className="mt-12 flex flex-wrap gap-6">
              {['No credit card required', 'Setup in under 5 minutes', 'Cancel any time'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle className="w-3.5 h-3.5 text-white/30" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="absolute inset-0 rounded-2xl" style={{ background: `radial-gradient(ellipse at center, oklch(35% 0.08 245 / 0.3), transparent 70%)` }} />
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=85"
              alt="Team collaborating"
              className="rounded-2xl w-full object-cover aspect-[4/3] opacity-80"
              style={{ boxShadow: `0 0 80px oklch(40% 0.12 245 / 0.25)` }}
            />
            <div className="absolute inset-0 rounded-2xl" style={{ background: `linear-gradient(to top, ${PRIMARY} 0%, transparent 40%)` }} />
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10" style={{ backgroundColor: PRIMARY_LIGHT }}>
          <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {STATS.map(s => (
              <div key={s.value} className="sm:px-10 first:pl-0 last:pr-0 flex flex-col gap-1">
                <span className="text-3xl font-bold text-white">{s.value}</span>
                <span className="text-sm text-white/50">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why / Purpose ───────────────────────────────────────────── */}
      <section id="why" className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-6">Our Purpose</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-8">
            Most teams don't fail because of a lack of talent.
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed mb-6">
            They fail because their leaders lack the tools to guide them through change. Not because they don't
            care — but because the complexity of leading people in hard times has never been harder.
          </p>
          <p className="text-xl text-gray-500 leading-relaxed mb-6">
            Economic pressure. Remote friction. Shifting expectations. Leaders are being asked to do more with
            less, faster than ever — while keeping their people motivated, aligned, and growing.
          </p>
          <p className="text-xl font-medium leading-relaxed" style={{ color: ACCENT }}>
            WorkBuddy exists because we believe every team deserves a leader who has the clarity, tools, and
            support to bring out their best.
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="features" className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-20">
            <p className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">What we give you</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Everything a leader needs. Nothing they don't.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: `oklch(62% 0.18 245 / 0.1)` }}>
                    <Icon className="w-5 h-5" style={{ color: ACCENT }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section id="how" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">How it works</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-16">
              A practice, not a product.
            </h2>
            <div className="space-y-12">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex gap-8">
                  <div className="shrink-0 flex flex-col items-center">
                    <span className="text-xs font-bold w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: PRIMARY }}>
                      {s.num}
                    </span>
                    {i < STEPS.length - 1 && <div className="w-px flex-1 mt-3 bg-gray-100 min-h-[48px]" />}
                  </div>
                  <div className="pt-1 pb-4">
                    <h3 className="font-semibold text-gray-900 text-xl mb-3">{s.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <Link to="/signup">
                <Button size="lg" className="text-white gap-2" style={{ backgroundColor: PRIMARY }}>
                  Start your first challenge
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block relative rounded-2xl overflow-hidden aspect-[3/4]">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=85"
              alt="Modern office environment"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, transparent 60%)`, opacity: 0.6 }} />
            <div className="absolute bottom-0 left-0 right-0 p-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold text-sm">Team progress this week</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full bg-white w-[72%]" />
                </div>
                <p className="text-white/70 text-xs">72% average across 4 active challenges</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────── */}
      <section className="py-32" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-sm font-semibold tracking-widest uppercase text-white/40 mb-4">From the field</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Leaders who chose clarity over chaos
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl p-8 border border-white/10" style={{ backgroundColor: PRIMARY_LIGHT }}>
                <Quote className="w-8 h-8 text-white/20 mb-6" />
                <p className="text-white/80 leading-relaxed mb-8 text-base">{t.quote}</p>
                <div className="flex items-center gap-4">
                  <img src={t.img} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-8" style={{ backgroundColor: `oklch(62% 0.18 245 / 0.1)` }}>
            <ShieldCheck className="w-7 h-7" style={{ color: ACCENT }} />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Your team's best chapter starts with one decision.
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            The leaders who build great teams don't wait for the right moment. They create it. WorkBuddy is
            ready when you are.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="text-white font-semibold px-10 gap-2" style={{ backgroundColor: PRIMARY }}>
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-10">
                Log in to your account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight">WorkBuddy</span>
          </div>
          <p className="text-sm text-white/30">© {new Date().getFullYear()} WorkBuddy. Built to help teams thrive.</p>
          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/70 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}