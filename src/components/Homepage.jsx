import { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle, BarChart3, Tag, Download, Users, Mail, Shield, FileText, Sparkles, Star, Zap, Target, TrendingUp, Globe, Award, Rocket, Sun, Moon } from 'lucide-react'
import HuntrLogo from './HuntrLogo'

function Homepage({ onGetStarted, onAbout }) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    setIsVisible(true)

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
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Smart Application Tracking",
      description: "Never lose track of your applications with intelligent status management and automated reminders."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Analytics",
      description: "Visualize your progress with beautiful charts and insights to optimize your application strategy."
    },
    {
      icon: <Tag className="h-8 w-8" />,
      title: "Smart Organization",
      description: "Use intelligent tags and filters to categorize and find your applications instantly."
    },
    {
      icon: <Download className="h-8 w-8" />,
      title: "Export & Share",
      description: "Export your data in multiple formats and share progress with mentors and advisors."
    }
  ]

  const stats = [
    { number: "10K+", label: "Students" },
    { number: "50K+", label: "Applications" },
    { number: "95%", label: "Success Rate" },
    { number: "24/7", label: "Support" }
  ]

  const testimonials = [
    {
      quote: "Huntr transformed my internship search. I applied to 50+ companies and landed my dream role at Google!",
      author: "Sarah Chen",
      role: "Computer Science Student",
      company: "Google",
      avatar: "👩‍💻"
    },
    {
      quote: "The analytics helped me understand my application patterns and improve my success rate significantly.",
      author: "Michael Rodriguez",
      role: "Software Engineering Graduate",
      company: "Microsoft",
      avatar: "👨‍💻"
    },
    {
      quote: "Finally, a tool that understands what students need during the internship application process.",
      author: "Emily Johnson",
      role: "Business Administration Student",
      company: "Amazon",
      avatar: "👩‍🎓"
    }
  ]

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 dark:bg-purple-600/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 dark:bg-yellow-600/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-600/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Navigation */}
        <nav className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 transition-all duration-300`}>
          <div className="flex justify-between items-center">
            <HuntrLogo size="lg" />

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <button
                onClick={onAbout}
                className="px-6 py-3 rounded-xl bg-gray-900/10 dark:bg-white/10 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-900/20 dark:hover:bg-white/20 transition-all duration-300 font-medium"
              >
                About
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 mb-8 shadow-lg">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Trusted by 10,000+ students worldwide
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-8">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Track Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Dream Internship
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              The ultimate platform for students to organize, track, and optimize their internship applications.
              <span className="font-semibold text-gray-800 dark:text-gray-200"> Land your dream role with confidence.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-3">
                  <span>Get Started Free</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>

              <button className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 font-semibold rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Everything you need to
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> succeed</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Powerful features designed to streamline your internship application process and maximize your success rate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-white dark:bg-gray-700 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-200 dark:border-gray-600"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center">
                  <div className="text-primary-600 mb-6 flex justify-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              What students are
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> saying</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of students who have transformed their internship search
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="absolute top-4 right-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to land your dream internship?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already using Huntr to track applications and land amazing opportunities.
          </p>
          <button
            onClick={onGetStarted}
            className="group px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-3">
              <span>Start Your Journey</span>
              <Rocket className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6 justify-center md:justify-start">
                <HuntrLogo size="md" variant="light" />
              </div>
              <p className="text-gray-300 mb-6 max-w-md mx-auto md:mx-0">
                Hunt down your dream internship. Track every application, every lead, every offer — all in one place.
              </p>
              <div className="flex space-x-4 justify-center md:justify-start">
                <button className="p-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all duration-300">
                  <Mail className="h-5 w-5" />
                </button>
                <button className="p-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all duration-300">
                  <Globe className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold mb-6">Navigation</h4>
              <ul className="space-y-3">
                <li>
                  <button className="text-gray-300 hover:text-white transition-colors">
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={onAbout}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button className="text-gray-300 hover:text-white transition-colors">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button className="text-gray-300 hover:text-white transition-colors">
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold mb-6">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <button className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2 justify-center md:justify-start">
                    <Shield className="h-4 w-4" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2 justify-center md:justify-start">
                    <FileText className="h-4 w-4" />
                    <span>Terms of Service</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Homepage
