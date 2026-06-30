import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Homepage from './components/Homepage'
import About from './components/About'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HuntrLogo from './components/HuntrLogo'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState(false)

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setSupabaseError(true)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      setSupabaseError(true)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return null
  }

  if (supabaseError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <HuntrLogo size="lg" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Configuration Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please set up your Supabase environment variables in the .env file:
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <code className="text-sm text-gray-700 dark:text-gray-300">
                VITE_SUPABASE_URL=your_supabase_url<br/>
                VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
              </code>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col">
        {user ? (
          <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto margin-lined-dots">
            <Navbar user={user} />
            <main className="flex-1">
              <Routes>
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        ) : (
          <Routes>
            <Route path="/" element={
              <Homepage
                onGetStarted={() => window.location.href = '/auth'}
                onAbout={() => window.location.href = '/about'}
              />
            } />
            <Route path="/about" element={
              <About onBack={() => window.location.href = '/'} />
            } />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  )
}

export default App
