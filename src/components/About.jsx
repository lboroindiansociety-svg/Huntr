import { useState, useEffect } from 'react'
import { Mail, Users, Target, Heart, Award, Globe, ArrowLeft, Sparkles, Star, Zap, TrendingUp, Building, Users2, Lightbulb, Shield, Rocket, MessageCircle, Github, Twitter, Linkedin, Sun, Moon } from 'lucide-react'
import HuntrLogo from './HuntrLogo'

function About({ onBack }) {
  const [isVisible, setIsVisible] = useState(false)
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

  const team = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      bio: "Former software engineer who experienced the chaos of tracking 100+ internship applications. Built Huntr to help students hunt down every opportunity.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      social: { linkedin: "#", twitter: "#", github: "#" }
    },
    {
      name: "Sarah Kim",
      role: "Head of Product",
      bio: "Product manager with a passion for user experience. Believes that great tools should be both powerful and delightful to use.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      social: { linkedin: "#", twitter: "#" }
    },
    {
      name: "David Rodriguez",
      role: "Lead Developer",
      bio: "Full-stack developer who loves building tools that make people's lives easier. Focused on creating robust, scalable solutions.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      social: { linkedin: "#", github: "#" }
    }
  ]

  const values = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Student-First",
      description: "Everything we build is designed with students' needs in mind, ensuring every feature serves their success.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Empowering",
      description: "We believe every student deserves the tools to succeed in their career journey, regardless of background.",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Quality",
      description: "We're committed to building reliable, intuitive tools that students can depend on throughout their journey.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Accessible",
      description: "Making career tools available to students from all backgrounds and circumstances worldwide.",
      color: "from-green-500 to-emerald-500"
    }
  ]

  const stats = [
    { number: "10K+", label: "Students", icon: <Users2 className="h-6 w-6" /> },
    { number: "500+", label: "Universities", icon: <Building className="h-6 w-6" /> },
    { number: "50K+", label: "Applications", icon: <Target className="h-6 w-6" /> },
    { number: "95%", label: "Success Rate", icon: <TrendingUp className="h-6 w-6" /> }
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
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="group flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back to Home</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 mb-8 shadow-lg">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Our Story
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-8">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                About
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Our Mission
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Our mission is to empower students and job seekers to track and optimize their internship applications with confidence and ease.
            </p>
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
                <div className="text-primary-600 mb-4 flex justify-center">
                  {stat.icon}
                </div>
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

      {/* Story Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
                Why we were
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> created</span>
              </h2>
              <div className="space-y-6 text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                <p>
                  During my senior year of college, I applied to over 100 internship positions.
                  What started as an exciting journey quickly became a nightmare of spreadsheets,
                  sticky notes, and forgotten follow-ups.
                </p>
                <p>
                  I found myself losing track of which companies I had applied to, when I had
                  applied, and what the next steps were. The stress of managing multiple
                  applications was taking away from my ability to prepare for interviews and
                  focus on my studies.
                </p>
                <p>
                  That's when I realized there had to be a better way. I built this platform to
                  solve this exact problem - to help students stay organized, track their
                  progress, and ultimately land their dream internships.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-700 rounded-3xl p-8 shadow-2xl">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Join thousands of students
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Students from over 500 universities worldwide trust our platform to manage their
                    internship applications and advance their careers with confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Our
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Values</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              The principles that guide everything we do and every decision we make
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-white dark:bg-gray-700 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-200 dark:border-gray-600"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${value.color} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className={`text-center mb-6`}>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${value.color} inline-block`}>
                      <div className="text-white">
                        {value.icon}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Meet Our
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Team</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              The passionate people behind our platform who are dedicated to your success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-white dark:bg-gray-700 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-200 dark:border-gray-600"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center">
                  <div className="mb-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <img
                        src={member.image}
                        alt={member.name}
                        className="relative w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700"
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 dark:text-primary-400 font-medium mb-4">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                    {member.bio}
                  </p>
                  <div className="flex justify-center space-x-3">
                    {member.social.linkedin && (
                      <a href={member.social.linkedin} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a href={member.social.twitter} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300">
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {member.social.github && (
                      <a href={member.social.github} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-300">
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 rounded-3xl blur"></div>
            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <MessageCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Get in Touch
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Have questions, feedback, or just want to say hello? We'd love to hear from you and help you on your journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <a
                  href="mailto:hello@huntr.app"
                  className="group px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3"
                >
                  <Mail className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  <span>hello@huntr.app</span>
                </a>
                <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl text-lg border border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                  Join Our Community
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <HuntrLogo size="md" variant="light" />
            </div>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Hunt smarter. Track every application. Land the role you want.
            </p>
            <div className="flex justify-center space-x-6">
              <a href="mailto:hello@huntr.app" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              <a href="https://github.com" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
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

export default About
