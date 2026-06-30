import { Github, Mail, ArrowUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import HuntrLogo from './HuntrLogo'
import { Separator } from './ui/separator'
import { Button } from './ui/button'

function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <footer className="border-t border-border bg-background/95 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HuntrLogo size="sm" showCursor={false} />
            <p className="text-sm text-muted-foreground">
              Hunt smarter. Land faster.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="mailto:support@huntr.app"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-9 w-9 rounded-full shadow-md"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </footer>
  )
}

export default Footer
