import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { authApi, notificationApi } from '@/services/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, MessageCircle, Bell, Settings, LogOut,
  Search, Users, Briefcase, Star, ChevronDown, Menu, X, Inbox, BarChart3, Heart
} from 'lucide-react'
import { savedApi } from '@/services/api'

export default function DashboardLayout() {
  const { user, isInfluencer, isClient, isAdmin, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const location = useLocation()
  const navigate  = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Show sidebar by default on desktop, hide on mobile
  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats-nav'],
    queryFn: () => authApi.dashboardStats(),
    select: res => res.data.data,
    refetchInterval: 30000,
  })

  const { data: savedCount } = useQuery({
    queryKey: ['saved-count'],
    queryFn: () => savedApi.count().then(r => r.data.data.count),
    enabled: isClient(),
    staleTime: 60_000,
  })

  const queryClient = useQueryClient()

  // Fetch initial unread count
  useEffect(() => {
    notificationApi.getUnreadCount()
      .then(res => useNotificationStore.getState().setUnreadCount(res.data.data.unread_count))
      .catch(() => {})

    if (!user || !window.Echo) return

    const channel = window.Echo.private(`notifications.${user.id}`)
      .listen('.NotificationSent', (e) => {
        const notif = e.notification
        toast.success(`New notification: ${notif.title}`)
        useNotificationStore.getState().incrementUnread()
        queryClient.invalidateQueries(['notifications'])
      })

    return () => {
      window.Echo.leave(`notifications.${user.id}`)
    }
  }, [user, queryClient])

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast.success('Signed out successfully')
  }

  const influencerNav = [
    { to: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/influencer/analytics',   icon: BarChart3,       label: 'Analytics' },
    { to: '/campaigns/discover',     icon: Briefcase,       label: 'Find Campaigns' },
    { to: '/influencer/requests',    icon: Inbox,           label: 'My Requests', badge: stats?.pending_requests || 0 },
    { to: '/chat',                   icon: MessageCircle,   label: 'Messages', badge: 0 },
    { to: '/notifications',          icon: Bell,            label: 'Notifications', badge: unreadCount },
    { to: '/settings/influencer',    icon: Settings,        label: 'Profile & Settings' },
  ]

  const clientNav = [
    { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns',       icon: Briefcase,       label: 'My Campaigns' },
    { to: '/client/requests', icon: Inbox,           label: 'My Requests', badge: stats?.pending_requests || 0 },
    { to: '/discover',        icon: Search,          label: 'Find Influencers' },
    { to: '/saved',           icon: Heart,           label: 'Saved', badge: savedCount || 0 },
    { to: '/chat',            icon: MessageCircle,   label: 'Messages', badge: 0 },
    { to: '/notifications',   icon: Bell,            label: 'Notifications', badge: unreadCount },
    { to: '/settings/client', icon: Settings,        label: 'Settings' },
  ]

  const navItems = isInfluencer() ? influencerNav : clientNav

  return (
    <div className="flex h-screen bg-[var(--color-surface-900)] overflow-hidden">
      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#050505]/80 backdrop-blur-sm z-30"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`w-64 flex-shrink-0 glass border-r border-white/5 flex flex-col z-40 ${isMobile ? 'fixed inset-y-0 left-0' : ''}`}
            >
            {/* Logo */}
            <div className="p-5 border-b border-white/5">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg btn-glow flex items-center justify-center">
                  <span className="relative z-10 text-white font-bold text-sm">IH</span>
                </div>
                <span className="font-display font-bold text-white text-lg">
                  Influence<span className="gradient-text">Hub</span>
                </span>
              </Link>
            </div>

            {/* User card */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                  <p className="text-slate-500 text-xs capitalize">{user?.role}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = location.pathname === item.to
                const Icon   = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group
                      ${active
                        ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    {item.badge > 0 && (
                      <span className="ml-auto bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {active && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-xl bg-brand-600/10 -z-10"
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 glass border-b border-white/5 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex-1" />

          <Link to="/notifications" className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
            )}
          </Link>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
