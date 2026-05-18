import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'

export default function PublicLayout() {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { to: '/discover', label: 'Discover' },
    { to: '/campaigns', label: 'Campaigns', hide: true },
  ]

  return (
    <div className="min-h-screen animated-gradient">
      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg btn-glow flex items-center justify-center">
                <span className="relative z-10 text-white font-bold text-sm">IH</span>
              </div>
              <span className="font-display font-bold text-white text-lg">
                Influence<span className="gradient-text">Hub</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/discover" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Discover
              </Link>
              <a href="#how-it-works" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Pricing
              </a>
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn-glow px-4 py-2 rounded-xl text-white text-sm font-semibold"
                >
                  <span>Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-3 py-2">
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn-glow px-4 py-2 rounded-xl text-white text-sm font-semibold"
                  >
                    <span>Get Started</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg btn-glow flex items-center justify-center">
              <span className="relative z-10 text-white font-bold text-xs">IH</span>
            </div>
            <span className="text-slate-400 text-sm font-display font-semibold">InfluenceHub</span>
          </div>
          <p className="text-slate-600 text-xs">© 2026 InfluenceHub. All rights reserved. Morocco 🇲🇦</p>
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'Contact'].map((l) => (
              <a key={l} href="#" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
