import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { BadgeCheck, X, Check, Eye, Loader2, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '@/components/modals/Modal'
import { useEffect } from 'react'

const SecureImage = ({ src }) => {
  const [imgSrc, setImgSrc] = useState(null)
  
  useEffect(() => {
    if (!src) return;
    const token = localStorage.getItem('auth_token')
    fetch(src, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => {
      if (!r.ok) throw new Error("Image fetch failed");
      return r.blob();
    })
    .then(blob => setImgSrc(URL.createObjectURL(blob)))
    .catch(err => console.error("Failed to load image", err))
  }, [src])

  if (!imgSrc) {
    return <div className="w-full h-full flex items-center justify-center bg-black/50 text-slate-500 animate-pulse">Loading...</div>
  }
  return <img src={imgSrc} className="w-full h-full object-contain" />
}

export default function AdminKYC() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-kyc-queue', page],
    queryFn: () => adminApi.kycQueue({ per_page: 15, page }),
    select: res => res.data.data
  })

  const [reason, setReason] = useState('')
  const [checks, setChecks] = useState({ name: false, face: false, cin: false, social: false })
  const allChecked = Object.values(checks).every(v => v)

  const approveMutation = useMutation({
    mutationFn: (userId) => adminApi.approveKYC(userId),
    onSuccess: () => {
      toast.success('KYC Approved')
      queryClient.invalidateQueries(['admin-kyc-queue'])
      setSelectedUser(null)
      setChecks({ name: false, face: false, cin: false, social: false })
    }
  })

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }) => adminApi.rejectKYC(userId, reason),
    onSuccess: () => {
      toast.success('KYC Rejected')
      queryClient.invalidateQueries(['admin-kyc-queue'])
      setSelectedUser(null)
      setReason('')
    }
  })

  const reasons = [
    "CIN photo is blurry or unreadable",
    "Selfie does not match CIN photo",
    "Name does not match registration",
    "Instagram account appears fake",
    "Other"
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">KYC Verification Queue</h1>
          <p className="text-slate-400 text-sm">Review identity documents for new influencers.</p>
        </div>
      </div>

      <div className="glass border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-white/5 text-slate-300 border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Influencer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" /></td></tr>
              ) : (data?.data ?? []).length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Queue is empty.</td></tr>
              ) : (data?.data ?? []).map(user => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{user.full_name || 'N/A'}</span>
                      <span className="text-xs">@{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{user.phone || 'N/A'}</td>
                  <td className="px-6 py-4">{new Date(user.submitted_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedUser(user)} className="btn-glow px-4 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center justify-end gap-2 ml-auto">
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Review KYC Documents" size="4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">CIN Front</p>
              <div className="aspect-video bg-black rounded-xl border border-white/10 overflow-hidden relative group">
                <SecureImage src={selectedUser.cin_front_url} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Selfie</p>
              <div className="aspect-video bg-black rounded-xl border border-white/10 overflow-hidden relative group">
                <SecureImage src={selectedUser.selfie_url} />
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500 block text-xs">Full Name</span><span className="text-white font-medium">{selectedUser.full_name}</span></div>
              <div><span className="text-slate-500 block text-xs">Username</span><span className="text-white font-medium">@{selectedUser.username}</span></div>
              <div><span className="text-slate-500 block text-xs">Phone</span><span className="text-white font-medium">{selectedUser.phone}</span></div>
              <div><span className="text-slate-500 block text-xs">Submitted</span><span className="text-white font-medium">{new Date(selectedUser.submitted_at).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm font-semibold text-white mb-2">Verification Checklist</p>
            {[
              { id: 'name', label: 'Name on CIN matches registered name' },
              { id: 'face', label: 'Face in selfie matches CIN photo' },
              { id: 'cin', label: 'CIN is readable and valid' },
              { id: 'social', label: 'Social accounts look real (if provided)' }
            ].map(check => (
              <label key={check.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checks[check.id] ? 'bg-brand-500 border-brand-500' : 'border-white/20 group-hover:border-white/40'}`}>
                  {checks[check.id] && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={checks[check.id]} onChange={e => setChecks(c => ({...c, [check.id]: e.target.checked}))} />
                <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{check.label}</span>
              </label>
            ))}
          </div>

          {reason !== '' && (
            <div className="mb-6 space-y-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm font-semibold text-red-400">Rejection Reason</p>
              <div className="flex flex-wrap gap-2">
                {reasons.filter(r => r !== 'Other').map(r => (
                  <button key={r} onClick={() => setReason(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${reason === r ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'glass border-white/10 text-slate-400'}`}>{r}</button>
                ))}
              </div>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Type detailed reason for rejection..." className="input-base w-full mt-2 text-sm" rows="2" />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            {reason === '' ? (
              <button onClick={() => setReason(reasons[0])} className="px-6 py-2.5 rounded-xl border border-red-500/30 text-red-400 font-semibold flex items-center gap-2 hover:bg-red-500/10 transition-all">
                <UserX className="w-4 h-4" /> Reject
              </button>
            ) : (
              <>
                <button onClick={() => setReason('')} className="px-4 py-2 text-slate-400 hover:text-white font-medium text-sm">Cancel</button>
                <button onClick={() => rejectMutation.mutate({ userId: selectedUser.user_id, reason })} disabled={!reason || rejectMutation.isPending} className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-semibold flex items-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50">
                  {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />} Confirm Reject
                </button>
              </>
            )}

            {reason === '' && (
              <button onClick={() => approveMutation.mutate(selectedUser.user_id)} disabled={!allChecked || approveMutation.isPending} className="px-6 py-2.5 rounded-xl bg-brand-500 text-white font-semibold flex items-center gap-2 hover:bg-brand-600 transition-all disabled:opacity-50 disabled:grayscale">
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />} Approve User
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
