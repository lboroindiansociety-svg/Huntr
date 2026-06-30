import { useState, useEffect } from 'react'
import {
  Mail, Target, Heart, Award, Globe, ArrowLeft,
  Sun, Moon, Users2, Building, TrendingUp, Github,
  Twitter, Linkedin, MessageCircle, Lightbulb, Shield, FileText,
} from 'lucide-react'

const ROLLING_WORDS = ['job search', 'internship hunt', 'grad scheme', 'co-op hunt', 'career move', 'next chapter']

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
        minWidth: '7ch',
      }}
    >
      {ROLLING_WORDS[index]}
    </span>
  )
}
import HuntrLogo from './HuntrLogo'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { cn } from '@/lib/utils'

const VALUES = [
  {
    icon: Target,
    title: 'Candidate-First',
    description: 'Every feature is built around the person juggling applications, deadlines, and 50 open tabs of job boards.',
    tag: 'mission',
  },
  {
    icon: Heart,
    title: 'Empowering',
    description: 'Great career tools should not be gated behind paywalls or prestige. Everyone deserves a fair shot.',
    tag: 'belief',
  },
  {
    icon: Award,
    title: 'Quality',
    description: 'Reliable, fast, and intentional. We do not ship things that get in your way.',
    tag: 'craft',
  },
  {
    icon: Globe,
    title: 'Accessible',
    description: 'Built for job seekers from every background, country, and career stage.',
    tag: 'access',
  },
]

const STATS = [
  { value: '10K+', label: 'users',           icon: Users2 },
  { value: '500+', label: 'universities',    icon: Building },
  { value: '50K+', label: 'applications',    icon: Target },
  { value: '95%',  label: 'offer rate',      icon: TrendingUp },
]

const FOUNDER = {
  name: 'Krishna Raman',
  role: 'Founder and sole developer',
  bio: 'CS and AI student who applied to 100 plus roles and built Huntr so no one else has to manage that chaos in a spreadsheet. Designs it, codes it, ships it.',
  initials: 'KR',
  social: { linkedin: 'https://www.linkedin.com/in/krishnavraman/', twitter: '#', github: '#' },
}

function About({ onBack }) {
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

      {/* Status bar + Nav — sticky as a unit */}
      <div className="sticky top-0 z-50">
        {/* Online status bar */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-7 items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                v1.0.0 #{__GIT_COMMIT__}
              </span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">online</span>
              </div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <HuntrLogo size="md" />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onBack} className="text-xs uppercase tracking-wide gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleDarkMode} aria-label="Toggle theme">
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </header>
      </div>

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
              <Lightbulb className="h-3 w-3" />
              Our story
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Built for every<br />
              <span className="text-muted-foreground">kind of</span><br />
              <RollingWord />_
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Huntr started because tracking roles in spreadsheets is a full-time job on its own.
              We built the tool we wished existed.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="px-8 py-10 text-center">
                <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1">{value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Origin</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Why we exist_
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p>
                During my final year of university, I applied to over 100 positions across
                internships, graduate schemes, and full-time roles. What started as an exciting
                search quickly became a mess of spreadsheets, sticky notes, and missed follow-ups.
              </p>
              <p>
                I was losing track of where I had applied, when, and what came next. The overhead
                of managing the pipeline was eating into time I should have spent preparing for
                interviews and writing better cover letters.
              </p>
              <p>
                So I built this. A focused, no-nonsense tracker that handles the logistics so
                you can focus on getting the role.
              </p>
            </div>

            <div className="border border-border rounded-md p-8 bg-muted/20">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">By the numbers</p>
              <div className="space-y-5">
                {[
                  { label: 'Applications tracked per active user on average', value: '47' },
                  { label: 'Time saved vs spreadsheet tracking per week',      value: '3 hrs' },
                  { label: 'Universities represented in our user base',         value: '500+' },
                  { label: 'Offer rate among users who track consistently',     value: '95%' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-bold tabular-nums shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Principles</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              What drives us_
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {VALUES.map(({ icon: Icon, title, description, tag }) => (
              <div key={title} className="bg-background p-8 hover:bg-muted/40 transition-colors duration-200">
                <div className="p-2 rounded-md bg-secondary border border-border inline-flex mb-4">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest px-1.5 py-0">{tag}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder
      <section className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">People</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              The person behind it_
            </h2>
          </div>

          <div className="flex items-start gap-8 max-w-2xl">
            <div className="h-16 w-16 rounded-md bg-secondary border border-border flex items-center justify-center text-base font-bold shrink-0">
              {FOUNDER.initials}
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">{FOUNDER.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 mb-5">{FOUNDER.role}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{FOUNDER.bio}</p>
              <div className="flex items-center gap-2">
                {FOUNDER.social.linkedin && (
                  <a href={FOUNDER.social.linkedin} target="_blank" rel="noreferrer" className="p-1.5 rounded border border-border bg-secondary hover:bg-accent transition-colors">
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                )}
                {FOUNDER.social.twitter && (
                  <a href={FOUNDER.social.twitter} target="_blank" rel="noreferrer" className="p-1.5 rounded border border-border bg-secondary hover:bg-accent transition-colors">
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                )}
                {FOUNDER.social.github && (
                  <a href={FOUNDER.social.github} target="_blank" rel="noreferrer" className="p-1.5 rounded border border-border bg-secondary hover:bg-accent transition-colors">
                    <Github className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Contact */}
      <section className="py-24 border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Contact</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Say hello_
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Questions, feedback, bug reports, feature ideas. We read everything.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="gap-2 text-xs uppercase tracking-wide">
              <a href="mailto:hello@huntr.app">
                <Mail className="h-4 w-4" />
                hello@huntr.app
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-xs uppercase tracking-wide">
              <MessageCircle className="h-4 w-4" />
              Join the community
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <HuntrLogo size="sm" className="mb-2" />
              <p className="text-xs text-muted-foreground">Hunt smarter. Track everything. Land the role.</p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { href: 'mailto:hello@huntr.app', icon: Mail },
                { href: 'https://github.com',     icon: Github },
                { href: 'https://twitter.com',    icon: Twitter },
                { href: 'https://linkedin.com',   icon: Linkedin },
              ].map(({ href, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  className="p-2 rounded border border-border bg-secondary hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              © {new Date().getFullYear()} huntr_ · all rights reserved
            </p>
            <div className="flex items-center gap-4">
              {[
                { label: 'Privacy Policy', icon: Shield },
                { label: 'Terms of Service', icon: FileText },
              ].map(({ label, icon: Icon }) => (
                <button key={label} className="text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default About
