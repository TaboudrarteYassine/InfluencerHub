import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Send } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { campaignApi } from '@/services/api'
import toast from 'react-hot-toast'

export default function ApplyModal({ isOpen, onClose, campaign }) {
  const [proposedAmount, setProposedAmount] = useState('')
  const [message, setMessage] = useState('')

  const applyMutation = useMutation({
    mutationFn: () => campaignApi.applyToCampaign(campaign.id, { proposed_amount: proposedAmount, message }),
    onSuccess: () => {
      toast.success('Application sent successfully!')
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to apply')
    }
  })

  return (
    <AnimatePresence>
      {isOpen && campaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass border border-white/10 rounded-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                Apply to Campaign
              </h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <p className="text-white font-semibold mb-1">{campaign.title}</p>
                <p className="text-slate-500 text-sm">{campaign.client_profile?.company_name}</p>
              </div>
              
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Proposed Rate (MAD)</label>
                <input type="number" value={proposedAmount} onChange={(e) => setProposedAmount(e.target.value)} className="input-base w-full" placeholder="e.g. 5000" />
                {campaign.budget_min && (
                  <p className="text-xs text-slate-500 mt-1">Client budget: {campaign.budget_min} - {campaign.budget_max} MAD</p>
                )}
              </div>
              
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Cover Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-base w-full min-h-[120px] resize-y" placeholder="Why are you a good fit for this campaign?" />
              </div>
            </div>

            <div className="p-5 border-t border-white/5 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-medium transition-colors">Cancel</button>
              <button onClick={() => applyMutation.mutate()} disabled={!proposedAmount || !message || applyMutation.isPending} className="btn-glow px-6 py-2 rounded-xl text-white font-semibold flex items-center gap-2">
                {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Application
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
