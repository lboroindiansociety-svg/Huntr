import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Mail, Lock, User, ArrowLeft, Eye, EyeOff, Sun, Moon,
  CheckCircle2, AlertCircle, ChevronRight, BarChart3, Tag,
  TrendingUp, Shield,
} from 'lucide-react'
import HuntrLogo from './HuntrLogo'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { cn } from '@/lib/utils'

const SIDE_FEATURES = [
  { icon: CheckCircle2, text: 'Full application pipeline tracking' },
  { icon: BarChart3,    text: 'Analytics & success metrics' },
  { icon: Tag,          text: 'Tags, filters, and smart search' },
  { icon: TrendingUp,   text: 'Interview round logging' },
  { icon: Shield,       text: 'Secure — your data, always' },
]

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsSuccess(false)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: username } },
        })
        if (error) throw error
        setIsSuccess(true)
        setMessage('Check your email for the confirmation link.')
      }
    } catch (err) {
      setIsSuccess(false)
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsLogin((v) => !v)
    setMessage('')
    setIsSuccess(false)
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground flex transition-opacity duration-500',
        mounted ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[420px] shrink-0 border-r border-border bg-muted/30 p-10 relative overflow-hidden">
        {/* grid bg */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative flex flex-col h-full">
          <HuntrLogo size="md" className="mb-auto" />

          <div className="my-auto">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">What you get</p>
            <h2 className="text-2xl font-bold tracking-tight mb-8 leading-tight">
              Hunt smarter.<br />Track everything_
            </h2>
            <ul className="space-y-4">
              {SIDE_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="p-1.5 rounded border border-border bg-secondary shrink-0">
                    <Icon className="h-3.5 w-3.5 text-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-auto">
            Free forever · No card required
          </p>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* top bar */}
        <header className="border-b border-border">
          <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              {/* mobile logo */}
              <HuntrLogo size="sm" className="lg:hidden" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleDarkMode} aria-label="Toggle theme">
                {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </header>

        {/* form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-16">
          <div className="w-full max-w-md">

            {/* heading */}
            <div className="mb-10">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                {isLogin ? '// sign_in' : '// create_account'}
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                {isLogin ? 'Welcome back_' : 'Get started_'}
              </h1>
              <p className="text-sm text-muted-foreground mt-3">
                {isLogin
                  ? 'Sign in to continue tracking your applications.'
                  : 'Create a free account and start your hunt.'}
              </p>
            </div>

            {/* form */}
            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="username"
                      type="text"
                      autoComplete="username"
                      required={!isLogin}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                      className="pl-10 h-11 text-sm font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 h-11 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {message && (
                <div
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-md border text-sm',
                    isSuccess
                      ? 'bg-secondary border-border text-foreground'
                      : 'bg-destructive/10 border-destructive/30 text-destructive'
                  )}
                >
                  {isSuccess
                    ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    : <AlertCircle  className="h-4 w-4 mt-0.5 shrink-0" />
                  }
                  <span>{message}</span>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full gap-2 text-sm uppercase tracking-wide mt-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? 'Sign in' : 'Create account'}
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <Separator className="my-8" />

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={switchMode}
                className="text-foreground font-medium hover:underline underline-offset-2 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* bottom */}
        <div className="border-t border-border px-6 py-3">
          <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest">
            huntr_ · secure · free
          </p>
        </div>
      </div>
    </div>
  )
}

export default Auth
