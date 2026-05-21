import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, MessageSquare, Loader2, Handshake,
  Clock, CreditCard, ShieldCheck, ArrowRight, RotateCcw
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignApi } from '@/services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

// ─── Stage Badge ──────────────────────────────────────────────────────────────
function StagePill({ label, color }) {
  const colors = {
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green:  'bg-green-500/10 text-green-400 border-green-500/20',
    brand:  'bg-brand-500/10 text-brand-400 border-brand-500/20',
    slate:  'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${colors[color] || colors.slate}`}>
      {label}
    </span>
  )
}

// ─── Negotiation Timeline Entry ───────────────────────────────────────────────
function NegEntry({ neg, isMe }) {
  const typeConfig = {
    offer:         { label: 'Initial Offer',  color: 'text-brand-400' },
    counter_offer: { label: 'Counter Offer',  color: 'text-yellow-400' },
    accepted:      { label: 'Accepted ✓',     color: 'text-green-400' },
    rejected:      { label: 'Declined ✗',     color: 'text-red-400' },
  }
  const cfg = typeConfig[neg.type] || { label: neg.type, color: 'text-slate-400' }

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] border ${
        isMe
          ? 'bg-brand-600/15 border-brand-500/25'
          : 'bg-white/5 border-white/8'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
            {cfg.label}
          </span>
          {neg.amount && (
            <span className="text-white font-bold text-sm">
              {Number(neg.amount).toLocaleString()} MAD
            </span>
          )}
        </div>
        {neg.message && (
          <p className="text-slate-300 text-sm leading-relaxed">{neg.message}</p>
        )}
      </div>
      <span className="text-[10px] text-slate-600 mt-1 px-1">
        {isMe ? 'You' : 'Other party'} · {new Date(neg.created_at).toLocaleString()}
      </span>
    </div>
  )
}

// ─── Confirmation Progress ────────────────────────────────────────────────────
function ConfirmProgress({ request }) {
  const clientDone     = !!request.client_confirmed_at
  const influencerDone = !!request.influencer_confirmed_at

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className={`flex items-center gap-1.5 ${clientDone ? 'text-green-400' : 'text-slate-500'}`}>
        {clientDone
          ? <CheckCircle className="w-4 h-4" />
          : <Clock className="w-4 h-4 animate-pulse" />}
        Client
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
      <div className={`flex items-center gap-1.5 ${influencerDone ? 'text-green-400' : 'text-slate-500'}`}>
        {influencerDone
          ? <CheckCircle className="w-4 h-4" />
          : <Clock className="w-4 h-4 animate-pulse" />}
        Influencer
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * NegotiationPanel
 * @param {object} request         — Collaboration request object (with .negotiations)
 * @param {function} onPayClick    — Callback when client clicks "Pay & Start Campaign"
 * @param {string} invalidateKey   — React Query key to invalidate on mutation success
 */
export default function NegotiationPanel({ request, onPayClick, invalidateKey = 'my-requests' }) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [showCounter, setShowCounter]       = useState(false)
  const [counterAmount, setCounterAmount]   = useState('')
  const [counterMessage, setCounterMessage] = useState('')

  const isClient     = user?.id === request.client_id
  const isInfluencer = user?.id === request.influencer_id

  // ─── Derived state ──────────────────────────────────────────────────────────
  const negotiations  = request.negotiations || []
  const lastNeg       = negotiations.length > 0 ? negotiations[negotiations.length - 1] : null
  const status        = request.status

  // Was the last negotiation entry an offer/counter that came from the OTHER party?
  const isOfferFromOther = lastNeg
    && ['offer', 'counter_offer'].includes(lastNeg.type)
    && lastNeg.sender_id !== user?.id
    && ['pending', 'negotiating'].includes(status)

  // No negotiations yet and I'm the recipient of the initial request
  const isInitialRecipient = negotiations.length === 0
    && isInfluencer
    && status === 'pending'

  // Show Accept/Reject/Counter buttons
  const showRespondActions = isOfferFromOther || isInitialRecipient

  // Deal is "accepted" — now we're in confirmation step
  const isAcceptedPhase   = status === 'negotiating' && lastNeg?.type === 'accepted'
  const amIConfirmed      = (isClient && !!request.client_confirmed_at)
                         || (isInfluencer && !!request.influencer_confirmed_at)
  const canConfirmDeal    = isAcceptedPhase && !amIConfirmed
  const waitingForOther   = isAcceptedPhase && amIConfirmed

  // Stage label
  const stageLabel = () => {
    if (status === 'agreed')       return { label: 'Deal Agreed', color: 'green' }
    if (status === 'active')       return { label: 'In Progress', color: 'brand' }
    if (status === 'completed')    return { label: 'Completed',   color: 'green' }
    if (status === 'rejected')     return { label: 'Declined',    color: 'slate' }
    if (isAcceptedPhase)           return { label: 'Confirming',  color: 'blue'  }
    if (status === 'negotiating')  return { label: 'Negotiating', color: 'yellow'}
    return { label: 'Pending', color: 'yellow' }
  }
  const { label: stageText, color: stageColor } = stageLabel()

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries([invalidateKey])
    queryClient.invalidateQueries(['client-requests'])
    queryClient.invalidateQueries(['my-requests'])
    queryClient.invalidateQueries(['campaign', request.campaign_id])
    queryClient.invalidateQueries(['dashboard-stats-nav'])
  }

  const respondMutation = useMutation({
    mutationFn: (data) => campaignApi.respondToRequest(request.id, data),
    onSuccess: () => {
      toast.success('Response submitted!')
      setShowCounter(false)
      setCounterAmount('')
      setCounterMessage('')
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit response'),
  })

  const confirmMutation = useMutation({
    mutationFn: () => campaignApi.confirmDeal(request.id, {
      agreed_amount: lastNeg?.amount ?? request.proposed_amount,
    }),
    onSuccess: () => {
      toast.success('Deal confirmed! Waiting for the other party.')
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to confirm deal'),
  })

  const handleRespond = (action) => {
    if (action === 'counter') {
      if (!counterAmount || isNaN(Number(counterAmount))) {
        return toast.error('Please enter a valid counter amount')
      }
      respondMutation.mutate({ action, amount: Number(counterAmount), message: counterMessage })
    } else {
      respondMutation.mutate({ action })
    }
  }

  // ─── Don't render for terminal/irrelevant statuses ──────────────────────────
  if (['rejected', 'cancelled'].includes(status) && negotiations.length === 0) return null

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden mt-4">

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-black/20">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
          <Handshake className="w-4 h-4 text-brand-400" />
          Negotiation
        </h3>
        <StagePill label={stageText} color={stageColor} />
      </div>

      {/* Timeline */}
      <div className="p-5 space-y-3 max-h-72 overflow-y-auto">
        {/* Initial offer row when no negotiation records yet */}
        {negotiations.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-2">
            Initial offer of{' '}
            <span className="font-semibold text-brand-400">
              {Number(request.proposed_amount).toLocaleString()} MAD
            </span>{' '}
            is pending a response.
          </div>
        )}

        {negotiations.map((neg) => (
          <NegEntry key={neg.id} neg={neg} isMe={neg.sender_id === user?.id} />
        ))}

        {/* Rejected terminal state */}
        {status === 'rejected' && (
          <div className="flex items-center justify-center gap-2 text-red-400 text-sm py-2">
            <XCircle className="w-4 h-4" /> This collaboration was declined.
          </div>
        )}
      </div>

      {/* Action Area */}
      <AnimatePresence mode="wait">

        {/* ── Counter offer form ── */}
        {showCounter && (
          <motion.div
            key="counter-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/5 bg-black/20 p-5 space-y-3"
          >
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Send Counter Offer</p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="Amount"
                  className="input-base w-full pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-semibold">MAD</span>
              </div>
            </div>
            <textarea
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              placeholder="Add a message explaining your counter (optional)..."
              className="input-base w-full h-20 resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCounter(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespond('counter')}
                disabled={respondMutation.isPending}
                className="btn-glow px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
              >
                {respondMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <RotateCcw className="w-3.5 h-3.5" />
                Submit Counter
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Accept / Reject / Counter actions ── */}
        {!showCounter && showRespondActions && (
          <motion.div
            key="respond-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-t border-white/5 bg-black/20 p-4 flex items-center gap-2 justify-end flex-wrap"
          >
            <button
              onClick={() => handleRespond('reject')}
              disabled={respondMutation.isPending}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <XCircle className="w-4 h-4" /> Decline
            </button>
            <button
              onClick={() => setShowCounter(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-yellow-400" /> Counter Offer
            </button>
            <button
              onClick={() => handleRespond('accept')}
              disabled={respondMutation.isPending}
              className="flex-1 sm:flex-none px-5 py-2.5 btn-glow rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              {respondMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle className="w-4 h-4" />
              }
              Accept {Number(lastNeg?.amount ?? request.proposed_amount).toLocaleString()} MAD
            </button>
          </motion.div>
        )}

        {/* ── Confirm deal (after accept, before both confirmed) ── */}
        {!showCounter && canConfirmDeal && (
          <motion.div
            key="confirm-deal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-t border-white/5 bg-black/20 p-4 space-y-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-medium">Confirm the agreed terms to lock in the deal</p>
                <ConfirmProgress request={request} />
              </div>
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="btn-glow bg-green-600/80 hover:bg-green-600 border-green-500/40 px-6 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 text-sm"
              >
                {confirmMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ShieldCheck className="w-4 h-4" />
                }
                Confirm Deal · {Number(lastNeg?.amount ?? request.proposed_amount).toLocaleString()} MAD
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Waiting for other party to confirm ── */}
        {!showCounter && waitingForOther && status !== 'agreed' && (
          <motion.div
            key="waiting-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-t border-white/5 bg-black/20 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">You've confirmed ✅</p>
                <p className="text-slate-500 text-xs">
                  Waiting for {isClient ? 'influencer' : 'client'} to confirm the deal…
                </p>
              </div>
              <ConfirmProgress request={request} />
            </div>
          </motion.div>
        )}

        {/* ── Agreed: client sees Pay button ── */}
        {status === 'agreed' && isClient && (
          <motion.div
            key="pay-action"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-t border-green-500/20 bg-green-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-green-400 font-semibold text-sm">
                  Deal agreed at {Number(request.agreed_amount).toLocaleString()} MAD
                </p>
                <p className="text-slate-500 text-xs">Fund the escrow to start the campaign</p>
              </div>
            </div>
            {onPayClick && (
              <button
                onClick={onPayClick}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-600/20 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                Pay & Start Campaign
              </button>
            )}
          </motion.div>
        )}

        {/* ── Agreed: influencer sees waiting banner ── */}
        {status === 'agreed' && isInfluencer && (
          <motion.div
            key="inf-waiting-payment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-t border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="text-green-400 font-semibold text-sm">
                Deal agreed at {Number(request.agreed_amount).toLocaleString()} MAD
              </p>
              <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 animate-pulse" />
                Awaiting client payment to start the campaign
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
