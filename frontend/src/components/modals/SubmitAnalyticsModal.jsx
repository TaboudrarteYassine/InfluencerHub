import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Loader2, X, Link as LinkIcon, Users, Eye, Heart, MessageCircle, Share2, MousePointerClick } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsApi } from '@/services/api'
import toast from 'react-hot-toast'

export default function SubmitAnalyticsModal({ isOpen, onClose, collaboration }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    reach: '',
    impressions: '',
    likes: '',
    comments: '',
    shares: '',
    clicks: '',
    post_url: '',
  })

  const mutation = useMutation({
    mutationFn: (data) => analyticsApi.submitAnalytics({
      collaboration_request_id: collaboration.id,
      ...data
    }),
    onSuccess: () => {
      toast.success('Analytics submitted successfully!')
      queryClient.invalidateQueries(['my-stats'])
      queryClient.invalidateQueries(['influencer-requests'])
      queryClient.invalidateQueries(['campaign', collaboration.campaign_id])
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit analytics')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Convert strings to numbers
    const payload = {
      reach: Number(form.reach),
      impressions: Number(form.impressions),
      likes: Number(form.likes),
      comments: Number(form.comments),
      shares: Number(form.shares),
      clicks: Number(form.clicks),
      post_url: form.post_url,
    }
    mutation.mutate(payload)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog static as={motion.div} open={isOpen} onClose={onClose} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Report Performance</h2>
                      <p className="text-xs text-slate-400">For {collaboration?.campaign?.title}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Total Reach
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.reach}
                        onChange={e => setForm({ ...form, reach: e.target.value })}
                        className="input-base"
                        placeholder="e.g. 50000"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Impressions
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.impressions}
                        onChange={e => setForm({ ...form, impressions: e.target.value })}
                        className="input-base"
                        placeholder="e.g. 75000"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5" /> Likes
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.likes}
                        onChange={e => setForm({ ...form, likes: e.target.value })}
                        className="input-base"
                        placeholder="e.g. 2500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" /> Comments
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.comments}
                        onChange={e => setForm({ ...form, comments: e.target.value })}
                        className="input-base"
                        placeholder="e.g. 150"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5" /> Shares
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.shares}
                        onChange={e => setForm({ ...form, shares: e.target.value })}
                        className="input-base"
                        placeholder="e.g. 50"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                        <MousePointerClick className="w-3.5 h-3.5" /> Link Clicks
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.clicks}
                        onChange={e => setForm({ ...form, clicks: e.target.value })}
                        className="input-base"
                        placeholder="e.g. 300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5" /> Post/Content URL
                    </label>
                    <input
                      type="url"
                      value={form.post_url}
                      onChange={e => setForm({ ...form, post_url: e.target.value })}
                      className="input-base"
                      placeholder="https://instagram.com/p/..."
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 glass text-white px-4 py-2.5 rounded-xl font-medium hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="flex-1 btn-glow text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
