import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { reportApi } from '@/services/api'
import toast from 'react-hot-toast'

const REASONS = [
  "Fake account or impersonation",
  "Spam or misleading content",
  "Inappropriate behavior in chat",
  "Scam or fraud attempt",
  "Fake followers or engagement",
  "Other"
]

export default function ReportModal({ isOpen, onClose, reportedUserId }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')

  const submitMutation = useMutation({
    mutationFn: (data) => reportApi.submit(data),
    onSuccess: () => {
      toast.success('Thank you. Our team will review this report.')
      setTimeout(() => {
        onClose()
        setReason('')
        setDescription('')
      }, 1000)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to submit report'
      toast.error(msg)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason) {
      toast.error('Please select a reason')
      return
    }
    submitMutation.mutate({
      reported_user_id: reportedUserId,
      reason,
      description
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white">Report this user</h2>
                  <p className="text-sm text-slate-400">Help us keep InfluenceHub safe</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Reason for reporting</label>
                <select 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none"
                  required
                >
                  <option value="" disabled>Select a reason...</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Additional details <span className="text-slate-500">(Optional)</span></label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional context..."
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors h-32 resize-none"
                  maxLength={500}
                />
                <div className="text-right mt-1 text-xs text-slate-500">
                  {description.length}/500
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                  disabled={submitMutation.isPending || submitMutation.isSuccess}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitMutation.isPending || submitMutation.isSuccess}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
