import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Briefcase } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { campaignApi } from '@/services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function InviteToCampaignModal({ isOpen, onClose, influencerId }) {
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [message, setMessage] = useState('Hi! We think you would be a great fit for our campaign. Let\'s collaborate!')

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['my-active-campaigns'],
    queryFn: () => campaignApi.myCampaigns({ status: 'published' }),
    select: res => res.data.data?.data || [],
    enabled: isOpen
  })

  const sendMutation = useMutation({
    mutationFn: () => campaignApi.sendRequest(selectedCampaignId, { influencer_id: influencerId, message }),
    onSuccess: () => {
      toast.success('Invitation sent successfully!')
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send invitation')
    }
  })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass border border-white/10 rounded-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-400" /> Invite to Campaign
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">You don't have any active campaigns.</p>
                <Link to="/campaigns/create" className="btn-glow px-4 py-2 rounded-xl text-white text-sm font-semibold">Create Campaign</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm font-medium mb-1.5 block">Select Campaign</label>
                  <select value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)} className="input-base w-full">
                    <option value="" disabled>-- Select a campaign --</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.budget_min ? `${c.budget_min} MAD` : 'Open Budget'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-sm font-medium mb-1.5 block">Invitation Message</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-base w-full min-h-[120px] resize-y" placeholder="Hi, we loved your profile..." />
                </div>
              </div>
            )}
          </div>

          {campaigns && campaigns.length > 0 && (
            <div className="p-5 border-t border-white/5 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-medium transition-colors">Cancel</button>
              <button onClick={() => sendMutation.mutate()} disabled={!selectedCampaignId || sendMutation.isPending} className="btn-glow px-6 py-2 rounded-xl text-white font-semibold flex items-center gap-2">
                {sendMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Send Invitation
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
