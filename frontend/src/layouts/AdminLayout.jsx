import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { 
  LayoutDashboard, Users, Settings, LogOut, Shield, 
  Target, ShieldCheck, MessageSquare, Tags, Activity, 
  Bell, BarChart3, ChevronLeft, ChevronRight, Search, Menu, Megaphone, Star, Tag, Lock, Flag, ScrollText, BadgeCheck, CreditCard
} from 'lucide-react'
import GlobalSearch from '@/components/GlobalSearch'

const navigationGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/analytics', icon: BarChart3,       label: 'Analytics' },
    ]
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/users',      icon: Users,     label: 'Users' },
      { to: '/admin/campaigns',  icon: Megaphone, label: 'Campaigns' },
      { to: '/admin/reviews',    icon: Star,      label: 'Reviews' },
      { to: '/admin/categories', icon: Tag,       label: 'Categories' },
      { to: '/admin/payments',   icon: CreditCard,label: 'Payments' },
    ]
  },
  {
    label: 'Trust & Safety',
    items: [
      { to: '/admin/trust',      icon: ShieldCheck, label: 'Trust Scores' },
      { to: '/admin/kyc',        icon: BadgeCheck,  label: 'KYC Queue' },
      { to: '/admin/reports',    icon: Flag,        label: 'Reports & Moderation' },
      { to: '/admin/security',   icon: Lock,        label: 'Security' },
    ]
  },
  {
    label: 'Communication',
    items: [
      { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', icon: Settings,   label: 'Settings' },
      { to: '/admin/activity', icon: ScrollText, label: 'Activity Log' },
    ]
  }
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const getPageTitle = () => {
    const path = location.pathname
    for (const group of navigationGroups) {
      for (const item of group.items) {
        if (item.to === path) return item.label
      }
    }
    return 'Admin Dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex text-slate-200 selection:bg-purple-500/30">
      {/* Sidebar */}
      <div 
        className={`bg-[#111111] border-r border-[#1f1f1f] flex flex-col z-20 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'} hidden md:flex shrink-0`}
      >
        <div className="h-16 px-4 border-b border-[#1f1f1f] flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <h1 className="font-semibold text-white tracking-wide truncate">Influence<span className="text-violet-400">Hub</span></h1>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {navigationGroups.map((group, i) => (
            <div key={i} className="mb-6 px-3">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.to
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center rounded-lg transition-all duration-200 group relative
                        ${collapsed ? 'justify-center p-2' : 'px-3 py-2 gap-3'}
                        ${isActive 
                          ? 'bg-violet-500/10 text-violet-400 font-medium' 
                          : 'text-slate-400 hover:bg-[#1a1a1a] hover:text-slate-200'}
                      `}
                    >
                      {isActive && !collapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-violet-500 rounded-r-full shadow-[0_0_8px_var(--tw-shadow-color)] shadow-violet-500/50"></div>
                      )}
                      {isActive && collapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-violet-500 rounded-r-full shadow-[0_0_8px_var(--tw-shadow-color)] shadow-violet-500/50"></div>
                      )}
                      <item.icon className={`shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200 transition-colors'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#1f1f1f] bg-[#0a0a0a]/50">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center flex-col' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-[#2a2a2a] flex items-center justify-center font-bold text-white shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-violet-400 text-[10px] font-bold uppercase tracking-wider">Super Admin</p>
              </div>
            )}
            <button 
              onClick={handleLogout} 
              title={collapsed ? "Logout" : undefined}
              className={`text-slate-500 hover:text-red-400 transition-colors ${collapsed ? 'mt-2' : ''}`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        {/* Top Header */}
        <header className="h-16 bg-[#0a0a0a] border-b border-[#1f1f1f] flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex text-slate-400 hover:text-white transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-white tracking-tight">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden md:flex items-center gap-2 bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-4 py-1.5 text-sm text-slate-400 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Search...</span>
              <kbd className="hidden sm:inline-block bg-[#1f1f1f] border border-[#2a2a2a] rounded text-[10px] px-1.5 font-mono ml-2">⌘K</kbd>
            </button>
            
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      <GlobalSearch />
    </div>
  )
}
