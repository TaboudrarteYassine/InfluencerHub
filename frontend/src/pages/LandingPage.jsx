import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Search, Send, Rocket, BadgeCheck, Camera, DollarSign, Shield, MessageSquare, Star, BarChart, Lock, ChevronRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 selection:bg-brand-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">Influence<span className="text-brand-400">Hub</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-white transition-colors">Log in</Link>
            <Link to="/register" className="btn-glow px-4 py-2 rounded-lg text-sm font-semibold text-white">Get Started</Link>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-300 hover:text-white">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 w-full bg-[#0a0a0a] border-b border-white/5 z-40 p-6 flex flex-col gap-6 md:hidden shadow-2xl"
          >
            <div className="flex flex-col gap-4 text-sm font-medium">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">How it works</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Features</a>
            </div>
            <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
              <Link to="/login" className="text-sm font-medium hover:text-white transition-colors">Log in</Link>
              <Link to="/register" className="btn-glow px-4 py-3 rounded-lg text-sm font-semibold text-white text-center">Get Started</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>🇲🇦</span> Morocco's #1 Influencer Marketplace
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-[1.1] tracking-tight">
            Connect Brands with the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">Right Creators</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Find verified influencers, launch campaigns, and grow your brand — all in one seamless, secure platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/register?role=client" className="btn-glow px-8 py-3.5 rounded-xl text-white font-semibold text-base w-full sm:w-auto flex items-center justify-center gap-2">
              Find Influencers <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/register?role=influencer" className="glass px-8 py-3.5 rounded-xl text-white font-semibold text-base border border-white/10 hover:bg-white/5 transition-all w-full sm:w-auto flex items-center justify-center">
              Join as Creator
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-white/5 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            {[
              { label: 'Verified Creators', value: '500+' },
              { label: 'Active Brands', value: '200+' },
              { label: 'Campaigns Launched', value: '1,000+' },
              { label: 'Satisfaction Rate', value: '98%' }
            ].map((stat, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-3xl md:text-4xl font-display font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">How InfluenceHub Works</h2>
            <p className="text-slate-400">A streamlined workflow designed for maximum efficiency.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-brand-500/10 text-brand-400 flex items-center justify-center">1</div>
                  For Brands
                </h3>
                <div className="pl-11 space-y-6">
                  <div className="flex gap-4">
                    <Search className="w-6 h-6 text-brand-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Find the right influencer</h4>
                      <p className="text-sm text-slate-400">Search by niche, location, and budget. Our AI matches you with the perfect creators.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Send className="w-6 h-6 text-brand-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Send a collaboration request</h4>
                      <p className="text-sm text-slate-400">Propose a budget and negotiate directly in our secure chat system.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Rocket className="w-6 h-6 text-brand-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Launch your campaign</h4>
                      <p className="text-sm text-slate-400">Track progress, review deliverables, and leave public feedback.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center">2</div>
                  For Creators
                </h3>
                <div className="pl-11 space-y-6">
                  <div className="flex gap-4">
                    <BadgeCheck className="w-6 h-6 text-purple-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Get verified</h4>
                      <p className="text-sm text-slate-400">Submit your identity for KYC verification to earn trust from top brands.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Camera className="w-6 h-6 text-purple-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Showcase your profile</h4>
                      <p className="text-sm text-slate-400">Build a stunning portfolio and connect your social accounts to show your real impact.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <DollarSign className="w-6 h-6 text-purple-400 shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Get paid</h4>
                      <p className="text-sm text-slate-400">Accept requests that match your rates and grow your income seamlessly.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Everything you need to collaborate</h2>
            <p className="text-slate-400">Tools designed to protect your brand and empower your creativity.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Rocket, title: 'AI Matching', desc: 'Smart influencer recommendations based on campaign requirements and audience data.' },
              { icon: Shield, title: 'KYC Verified', desc: 'Every creator is identity-verified. No fake accounts, no bots, just real influence.' },
              { icon: MessageSquare, title: 'Real-time Chat', desc: 'Negotiate and discuss campaign details directly in our secure messaging platform.' },
              { icon: Star, title: 'Reviews & Trust', desc: 'A transparent reputation system to ensure high-quality collaborations.' },
              { icon: BarChart, title: 'Campaign Tracking', desc: 'Monitor the status of your collaborations from proposal to completion.' },
              { icon: Lock, title: 'Secure Platform', desc: 'Your data, contracts, and communications are always encrypted and protected.' }
            ].map((feat, i) => (
              <div key={i} className="glass p-6 rounded-2xl border border-white/5 hover:border-brand-500/30 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                  <feat.icon className="w-5 h-5 text-slate-300 group-hover:text-brand-400 transition-colors" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{feat.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#0d0518] -z-10" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-brand-500/20 blur-[100px] rounded-t-full -z-10 pointer-events-none" />
        
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">Ready to grow?</h2>
          <p className="text-lg text-slate-400">Join thousands of creators and brands already launching successful campaigns on InfluenceHub.</p>
          <Link to="/register" className="btn-glow px-10 py-4 rounded-xl text-white font-semibold text-lg inline-flex items-center gap-2">
            Get Started Free <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            <span className="font-display font-bold text-white">Influence<span className="text-brand-400">Hub</span></span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 text-center md:text-left text-xs text-slate-600">
          © {new Date().getFullYear()} InfluenceHub. Made in Morocco 🇲🇦
        </div>
      </footer>
    </div>
  )
}
