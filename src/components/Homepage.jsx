import { useState, useEffect } from 'react'
import {
  ArrowRight, BarChart3, Tag, Download, Shield, FileText, Sparkles,
  Rocket, Sun, Moon, CheckCircle2, TrendingUp, Zap,
  Mail, ChevronRight, Database, Layout,
} from 'lucide-react'
import HuntrLogo from './HuntrLogo'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { cn } from '@/lib/utils'

const ROLLING_WORDS = ['job', 'internship', 'co-op', 'grad role', 'placement', 'new role', 'opportunity']

function RollingWord() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % ROLLING_WORDS.length)
        setVisible(true)
      }, 280)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      style={{
        display: 'inline-block',
        transition: 'opacity 0.28s ease, transform 0.28s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-10px)',
        minWidth: '6ch',
      }}
    >
      {ROLLING_WORDS[index]}
    </span>
  )
}

const FEATURES = [
  {
    icon: CheckCircle2,
    title: 'Application Tracking',
    description: 'Status pipeline from saved to applied to interviewing to offer. Every state, every update, one place.',
    tag: 'core',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Charts and metrics that show exactly where your pipeline stands and where to focus next.',
    tag: 'insights',
  },
  {
    icon: Tag,
    title: 'Smart Tags and Filters',
    description: 'Label roles by tech stack, location, deadline. Slice your pipeline any way you need.',
    tag: 'organize',
  },
  {
    icon: Zap,
    title: 'Auto-fill from URL',
    description: 'Paste a job listing URL. We extract the company, role, and details automatically.',
    tag: 'auto',
  },
  {
    icon: TrendingUp,
    title: 'Interview Rounds',
    description: 'Log every round: OA, phone screen, technical, final. Add notes and outcomes as you go.',
    tag: 'track',
  },
  {
    icon: Download,
    title: 'Export and Share',
    description: 'Export your full application history as CSV or JSON. Your data, always.',
    tag: 'export',
  },
]

const STATS = [
  { value: '10K+', label: 'users' },
  { value: '50K+', label: 'applications tracked' },
  { value: '6',    label: 'status stages' },
  { value: '100%', label: 'free' },
]

const TESTIMONIALS = [
  {
    quote: 'Huntr is the first tracker that actually feels like a dev tool. It just gets out of the way.',
    author: 'Sarah Chen',
    role: 'CS at Stanford',
    co: 'Now at Google',
  },
  {
    quote: 'The analytics tab alone is worth it. I figured out I was ghosting myself on follow-ups.',
    author: 'Michael Rodriguez',
    role: 'SWE Graduate',
    co: 'Now at Microsoft',
  },
  {
    quote: 'Finally something that does not look like it was built in 2012. Clean, fast, does the job.',
    author: 'Emily Johnson',
    role: 'Business at Wharton',
    co: 'Now at Amazon',
  },
]

function Homepage({ onGetStarted, onAbout }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const toggleDarkMode = () => {
    const next = !isDarkMode
    setIsDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <div className={cn('min-h-screen bg-background text-foreground transition-opacity duration-500 relative', mounted ? 'opacity-100' : 'opacity-0')}>
      {/* dotted margin guides matching dashboard width */}
      <div className="pointer-events-none fixed inset-0 z-50">
        <div className="max-w-7xl mx-auto h-full margin-lined-dots" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <HuntrLogo size="md" />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onAbout} className="text-xs uppercase tracking-wide">
                About
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleDarkMode} aria-label="Toggle theme">
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button size="sm" onClick={onGetStarted} className="text-xs uppercase tracking-wide gap-1.5">
                Get started
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-border">
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 gap-1.5 text-[10px] uppercase tracking-widest font-medium">
              <Sparkles className="h-3 w-3" />
              Job application tracker
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Hunt down<br />
              <span className="text-muted-foreground">your next</span><br />
              <RollingWord />_
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
              One dashboard for every application, every round, every offer.
              Built for anyone serious about their search.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={onGetStarted} className="gap-2 text-sm uppercase tracking-wide">
                Start tracking free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onAbout} className="text-sm uppercase tracking-wide">
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
            {STATS.map((s) => (
              <div key={s.label} className="px-8 py-10 text-center">
                <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1">{s.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything in one place_
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="bg-background p-8 group hover:bg-muted/40 transition-colors duration-200">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 p-2 rounded-md bg-secondary border border-border shrink-0">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold">{f.title}</h3>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest px-1.5 py-0">{f.tag}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Process</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              From search to offer_
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Database,
                title: 'Add your applications',
                desc: 'Paste a URL or manually add any role. Import from LinkedIn, Greenhouse, or anywhere you find listings.',
              },
              {
                step: '02',
                icon: Layout,
                title: 'Track every stage',
                desc: 'Move applications through your pipeline. Log rounds, notes, deadlines, and contacts along the way.',
              },
              {
                step: '03',
                icon: TrendingUp,
                title: 'Optimize and win',
                desc: 'Use analytics to spot patterns. Focus your energy where it converts. Land the offer.',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="relative">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-4">{item.step}</div>
                  <div className="p-2 rounded-md bg-secondary border border-border inline-flex mb-4">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Social proof</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              People ship with huntr_
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.author} className="rounded-md border-border">
                <CardContent className="p-6">
                  <p className="text-sm text-foreground leading-relaxed mb-6 italic">"{t.quote}"</p>
                  <Separator className="mb-4" />
                  <div>
                    <p className="text-xs font-semibold">{t.author}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{t.role}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.co}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Ready?</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Start your search_
          </h2>
          <p className="text-muted-foreground text-sm mb-10 max-w-md mx-auto leading-relaxed">
            Free forever. No credit card. A cleaner way to run your job search from first application to signed offer.
          </p>
          <Button size="lg" onClick={onGetStarted} className="gap-2 text-sm uppercase tracking-wide">
            Get started for free
            <Rocket className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <HuntrLogo size="sm" className="mb-3" />
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Hunt down your next role. Track every application,<br />every lead, every offer.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-3">Navigation</p>
                <ul className="space-y-2">
                  {['Dashboard', 'About', 'Privacy Policy', 'Contact'].map((item) => (
                    <li key={item}>
                      <button
                        onClick={item === 'About' ? onAbout : undefined}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-3">Legal</p>
                <ul className="space-y-2">
                  {[
                    { label: 'Privacy Policy', icon: Shield },
                    { label: 'Terms of Service', icon: FileText },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.label}>
                        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                          <Icon className="h-3 w-3" />
                          {item.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
          <Separator className="mt-10 mb-6" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            © {new Date().getFullYear()} huntr_ · all rights reserved
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Homepage
