import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { clientApi, chatApi } from '@/services/api'
import { motion } from 'framer-motion'
import {
  Inbox, Calendar, DollarSign, MessageSquare, Users, ExternalLink
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import NegotiationPanel from '@/components/NegotiationPanel'
import PaymentModal from '@/components/modals/PaymentModal'
import TransactionStatus from '@/components/campaign/TransactionStatus'
import toast from 'react-hot-toast'

// ─── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    negotiating: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    agreed:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    active:      'bg-brand-500/10 text-brand-400 border-brand-500/20',
    completed:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rejected:    'bg-red-500/10 text-red-400 border-red-500/20',
    cancelled:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }
  return (
    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border capitalize ${map[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {status}
    </span>
  )
}

// ─── Influencer Avatar ─────────────────────────────────────────────────────────
function InfluencerAvatar({ req }) {
  const name = req.influencer?.display_name || req.influencer?.name || '?'
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function ClientRequests() {
  const [status, setStatus] = useState('all')
  const [page, setPage]     = useState(1)
  const [activePaymentCollab, setActivePaymentCollab] = useState(null)

  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['client-requests', status, page],
    queryFn:  () => clientApi.myRequests({ status, page, per_page: 15 }),
    select:   (res) => res.data.data,
  })

  // ─── Navigate to the campaign conversation (auto-created on collab creation) ──
  const openChat = (req) => {
    // If the collaboration has a campaign conversation attached, use it
    const convId = req.conversation?.id
    if (convId) {
      navigate(`/chat/${convId}`)
      return
    }
    // Fallback: open/create a direct 1-to-1 conversation
    chatApi.startDirect(req.influencer_id)
      .then((res) => navigate(`/chat/${res.data.data.conversation.id}`))
      .catch(() => toast.error('Could not open conversation'))
  }

  const requests = data?.data || []

  const TABS = ['all', 'pending', 'negotiating', 'agreed', 'active', 'completed']

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">
            Collaboration Requests
          </h1>
          <p className="text-slate-500 text-sm">
            Negotiate rates, confirm terms, and fund campaigns with creators.
          </p>
        </div>

        {/* Tab filter */}
        <div className="flex flex-wrap glass border border-white/5 p-1 rounded-2xl self-start sm:self-auto gap-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setStatus(t); setPage(1) }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                status === t
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Card list */}
      <div className="glass border border-white/5 rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-16">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
        ) : requests.length > 0 ? (
          <div className="divide-y divide-white/5">
            {requests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 flex flex-col hover:bg-white/[0.015] transition-all gap-4"
              >
                {/* ── Top row ── */}
                <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between w-full">

                  {/* Influencer info */}
                  <div className="flex gap-4 items-center flex-1 min-w-0">
                    <InfluencerAvatar req={req} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-base truncate">
                          {req.influencer?.display_name || req.influencer?.name || 'Influencer'}
                        </h3>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-slate-400 text-sm truncate mb-2">
                        Campaign:{' '}
                        <span className="text-slate-300 font-medium">{req.campaign?.title}</span>
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-brand-400" />
                          {Number(req.agreed_amount || req.proposed_amount || 0).toLocaleString()} MAD
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                        {req.influencer?.name && (
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-600" />
                            @{req.influencer.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                    {/* Campaign chat / Message */}
                    <button
                      onClick={() => openChat(req)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all text-center border border-white/10 hover:border-white/20 flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4 text-brand-400" />
                      Message
                    </button>

                    {/* View campaign */}
                    <Link
                      to={`/campaigns/${req.campaign_id}`}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all text-center border border-white/10 hover:border-white/20 flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Campaign
                    </Link>
                  </div>
                </div>

                {/* ── Negotiation Panel ── */}
                {!['rejected', 'cancelled'].includes(req.status) && (
                  <div className="w-full">
                    <NegotiationPanel
                      request={req}
                      invalidateKey="client-requests"
                      onPayClick={
                        req.status === 'agreed'
                          ? () => setActivePaymentCollab(req)
                          : undefined
                      }
                    />
                  </div>
                )}

                {/* ── Escrow / Transaction status (agreed, active, completed) ── */}
                {['agreed', 'active', 'completed'].includes(req.status) && (
                  <div className="w-full border-t border-white/5 pt-4 mt-1">
                    <TransactionStatus collaboration={req} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-16">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Inbox className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-white font-semibold mb-1">No requests found</h3>
            <p className="text-slate-500 text-sm">
              No creators have sent requests or applied to your campaigns yet.
            </p>
          </div>
        )}

        {/* Pagination */}
        {data?.last_page > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-xl border border-white/5 text-sm text-slate-400 disabled:opacity-40 hover:bg-white/5 transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500 font-medium">
              Page {page} of {data.last_page}
            </span>
            <button
              disabled={page === data.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl border border-white/5 text-sm text-slate-400 disabled:opacity-40 hover:bg-white/5 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!activePaymentCollab}
        onClose={() => {
          setActivePaymentCollab(null)
          queryClient.invalidateQueries(['client-requests'])
        }}
        collaboration={activePaymentCollab}
      />
    </div>
  )
}
