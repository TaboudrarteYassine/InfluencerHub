import { useAuthStore } from '@/store/authStore'
import { ShieldX, LogOut, RefreshCcw } from 'lucide-react'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'
import { useNavigate, Link } from 'react-router-dom'

export default function RejectedVerificationPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast.success('Signed out successfully')
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-900)] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass border border-red-500/20 rounded-3xl p-8 text-center">
        <div className="w-20 h-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10" />
        </div>
        
        <h1 className="font-display font-bold text-2xl text-white mb-2">Verification Rejected</h1>
        <p className="text-slate-400 mb-6">
          Unfortunately, we could not verify your identity with the provided documents.
        </p>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-red-400 mb-1">Reason for Rejection:</p>
          <p className="text-sm text-red-200">{user?.influencer_profile?.verification_note || 'Documents were unclear or did not match.'}</p>
        </div>

        <div className="space-y-3">
          <Link to="/onboarding/influencer?resubmit=true" className="btn-glow flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-white font-medium text-sm">
            <RefreshCcw className="w-4 h-4" />
            Resubmit Documents
          </Link>

          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-sm">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
