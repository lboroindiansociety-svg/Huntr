import { useState, useEffect } from 'react'
import { Sparkles, Zap, Target, Heart } from 'lucide-react'
import HuntrLogo from './HuntrLogo'

function Loader({ type = 'spinner', size = 'md', text = '', className = '' }) {
  const [dots, setDots] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check initial dark mode
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className={`animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 ${sizeClasses[size]}`}></div>
        )

      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className={`w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        )

      case 'pulse':
        return (
          <div className={`animate-pulse bg-gradient-to-r from-blue-600 to-purple-600 rounded-full ${sizeClasses[size]}`}></div>
        )

      case 'wave':
        return (
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full animate-pulse`}
                style={{ animationDelay: `${i * 200}ms` }}
              ></div>
            ))}
          </div>
        )

      case 'ring':
        return (
          <div className="relative">
            <div className={`animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 ${sizeClasses[size]}`}></div>
            <div className={`absolute inset-1 animate-spin rounded-full border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 ${sizeClasses[size]}`} style={{ animationDirection: 'reverse' }}></div>
          </div>
        )

      case 'sparkle':
        return (
          <div className="relative">
            <Sparkles className={`${sizeClasses[size]} text-blue-600 dark:text-blue-400 animate-pulse`} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          </div>
        )

      case 'target':
        return (
          <div className="relative">
            <Target className={`${sizeClasses[size]} text-blue-600 dark:text-blue-400 animate-pulse`} />
            <div className="absolute inset-0 border-2 border-purple-600 dark:border-purple-400 rounded-full animate-ping"></div>
          </div>
        )

      case 'heart':
        return (
          <div className="relative">
            <Heart className={`${sizeClasses[size]} text-red-500 animate-pulse fill-current`} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-ping"></div>
          </div>
        )

      case 'gradient':
        return (
          <div className={`relative ${sizeClasses[size]}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full animate-spin"></div>
            <div className="absolute inset-1 bg-white dark:bg-gray-900 rounded-full"></div>
            <div className="absolute inset-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full animate-pulse"></div>
          </div>
        )

      case 'blob':
        return (
          <div className="relative">
            <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse`}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        )

      default:
        return (
          <div className={`animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 ${sizeClasses[size]}`}></div>
        )
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {renderLoader()}
      {text && (
        <div className={`text-gray-600 dark:text-gray-400 font-medium ${textSizes[size]}`}>
          {text}{dots}
        </div>
      )}
    </div>
  )
}

// Page Loader Component
export function PageLoader({ message = 'Loading your experience...' }) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check initial dark mode
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <HuntrLogo size="xl" className="animate-pulse" />
        </div>
        <Loader type="gradient" size="lg" text={message} />
      </div>
    </div>
  )
}

// Modal Loader Component
export function ModalLoader({ message = 'Processing...' }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
        <Loader type="sparkle" size="lg" text={message} />
      </div>
    </div>
  )
}

// Button Loader Component
export function ButtonLoader({ size = 'sm' }) {
  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader type="dots" size={size} />
    </div>
  )
}

// Inline Loader Component
export function InlineLoader({ type = 'dots', size = 'sm' }) {
  return <Loader type={type} size={size} />
}

export default Loader
