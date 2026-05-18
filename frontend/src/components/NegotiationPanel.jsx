import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, MessageSquare, Loader2, Handshake } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignApi } from '@/services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function NegotiationPanel({ request }) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [showCounter, setShowCounter] = useState(false)
  const [counterAmount, setCounterAmount] = useState('')
  const [counterMessage, setCounterMessage] = useState('')

  const isClient = user?.id === request.client_id
  const isInfluencer = user?.id === request.influencer_id

  const respondMutation = useMutation({
    mutationFn: (data) => campaignApi.respondToRequest(request.id, data),
    onSuccess: () => {
      toast.success('Response submitted!')
      setShowCounter(false)
      queryClient.invalidateQueries(['my-requests'])
      queryClient.invalidateQueries(['campaign', request.campaign_id])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit response')
  })

  const confirmMutation = useMutation({
    mutationFn: () => campaignApi.confirmDeal(request.id, { agreed_amount: request.proposed_amount }),
    onSuccess: () => {
      toast.success('Deal confirmed!')
      queryClient.invalidateQueries(['my-requests'])
      queryClient.invalidateQueries(['campaign', request.campaign_id])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to confirm deal')
  })

  // Determine if action buttons should be shown for the current user
  const negotiations = request.negotiations || []
  const lastNegotiation = negotiations.length > 0 ? negotiations[negotiations.length - 1] : null
  const pendingActionFromUser = lastNegotiation && lastNegotiation.sender_id !== user?.id && ['pending', 'negotiating'].includes(request.status)
  
  // If no negotiations exist yet (just created), the influencer needs to respond
  const needsInitialResponse = negotiations.length === 0 && isInfluencer && request.status === 'pending'

  const showActions = pendingActionFromUser || needsInitialResponse

  const handleRespond = (action) => {
    if (action === 'counter') {
      if (!counterAmount) return toast.error('Enter an amount')
      respondMutation.mutate({ action, amount: counterAmount, message: counterMessage })
    } else {
      respondMutation.mutate({ action })
    }
  }

  const needsConfirm = request.status === 'negotiating' && !pendingActionFromUser && lastNegotiation?.type === 'accepted'
  
  // Both agreed, but one hasn't confirmed
  const amIConfirmed = (isClient && request.client_confirmed_at) || (isInfluencer && request.influencer_confirmed_at)
  const canConfirmDeal = (request.status === 'negotiating' || request.status === 'pending') && !amIConfirmed && lastNegotiation?.type === 'accepted'

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mt-4">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
          <Handshake className="w-4 h-4 text-brand-400" /> Negotiation History
        </h3>
        <span className="badge">{request.status}</span>
      </div>

      <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
        {negotiations.map((neg) => {
          const isMe = neg.sender_id === user?.id
          return (
            <div key={neg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${
                isMe ? 'bg-brand-600/20 border-brand-500/30' : 'bg-white/10 border-white/10'
              } border`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">{neg.type.replace('_', ' ')}</span>
                  {neg.amount && <span className="text-brand-400 font-bold text-sm">{neg.amount} MAD</span>}
                </div>
                {neg.message && <p className="text-slate-200 text-sm">{neg.message}</p>}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">{new Date(neg.created_at).toLocaleString()}</span>
            </div>
          )
        })}
        {negotiations.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-4">
            Initial offer of <span className="font-semibold text-brand-400">{request.proposed_amount} MAD</span> pending.
          </div>
        )}
      </div>

      {(showActions || canConfirmDeal) && (
        <div className="p-4 border-t border-white/5 bg-black/20">
          <AnimatePresence mode="wait">
            {showCounter ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                <div className="flex gap-3">
                  <input type="number" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} placeholder="Counter amount (MAD)" className="input-base flex-1" />
                </div>
                <textarea value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)} placeholder="Add a message..." className="input-base w-full h-20 resize-none" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowCounter(false)} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-sm">Cancel</button>
                  <button onClick={() => handleRespond('counter')} disabled={respondMutation.isPending} className="btn-glow px-4 py-1.5 rounded-lg text-white text-sm font-semibold flex items-center gap-2">
                    {respondMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Submit Counter
                  </button>
                </div>
              </motion.div>
            ) : canConfirmDeal ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
                 <button onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending} className="btn-glow bg-green-600/80 hover:bg-green-600 border-green-500/50 px-6 py-2 rounded-xl text-white font-semibold flex items-center gap-2">
                  {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Confirm Deal at {request.proposed_amount} MAD
                </button>
              </motion.div>
            ) : showActions ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 justify-end flex-wrap">
                <button onClick={() => handleRespond('reject')} disabled={respondMutation.isPending} className="glass border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all">
                  <XCircle className="w-4 h-4" /> Decline
                </button>
                <button onClick={() => setShowCounter(true)} className="glass border-white/10 hover:border-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all">
                  <MessageSquare className="w-4 h-4" /> Counter Offer
                </button>
                <button onClick={() => handleRespond('accept')} disabled={respondMutation.isPending} className="btn-glow px-6 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
                  {respondMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Accept {request.proposed_amount} MAD
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}
      {request.status === 'agreed' && (
        <div className="p-4 border-t border-green-500/20 bg-green-500/5 flex items-center justify-center gap-2 text-green-400 font-semibold text-sm">
          <CheckCircle className="w-5 h-5" /> Deal Confirmed at {request.agreed_amount} MAD
        </div>
      )}
    </div>
  )
}
