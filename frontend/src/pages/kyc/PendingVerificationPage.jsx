import { useAuthStore } from '@/store/authStore'
import { ShieldAlert, LogOut } from 'lucide-react'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function PendingVerificationPage() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast.success('Signed out successfully')
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-900)] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass border border-white/5 rounded-3xl p-8 text-center">
        <div className="w-20 h-20 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        
        <h1 className="font-display font-bold text-2xl text-white mb-2">Account Under Review</h1>
        <p className="text-slate-400 mb-6">
          Your identity verification documents have been submitted and are currently being reviewed by our team.
        </p>

        <div className="bg-[#111111] border border-white/5 rounded-xl p-4 mb-8">
          <p className="text-sm font-medium text-white mb-1">Estimated Time</p>
          <p className="text-xs text-slate-500">24 - 48 hours</p>
        </div>

        <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-sm">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
