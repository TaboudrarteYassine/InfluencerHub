import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignApi, reviewApi, chatApi } from '@/services/api'
import { motion } from 'framer-motion'
import {
  Calendar, DollarSign, MapPin, Tag, Briefcase,
  CheckCircle, Loader2, MessageSquare, Star
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import ReviewModal from '@/components/ReviewModal'
import NegotiationPanel from '@/components/NegotiationPanel'
import PaymentModal from '@/components/modals/PaymentModal'
import TransactionStatus from '@/components/campaign/TransactionStatus'

// ─── Status badge ─────────────────────────────────────────────────────────────
function CampaignBadge({ status }) {
  const map = {
    draft:     'bg-slate-500/10 text-slate-400 border-slate-500/20',
    published: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    active:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border capitalize ${map[status] || map.draft}`}>
      {status}
    </span>
  )
}

export default function CampaignDetailPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuthStore()
  const queryClient  = useQueryClient()

  const [showReviewModal, setShowReviewModal]         = useState(false)
  const [activePaymentCollab, setActivePaymentCollab] = useState(null)

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn:  () => campaignApi.show(id),
    select:   (res) => res.data.data?.campaign,
  })

  const { data: canReviewData } = useQuery({
    queryKey: ['can-review', id],
    queryFn:  () => reviewApi.canReview(id),
    enabled:  !!campaign && campaign.status === 'completed',
    select:   (res) => res.data.data?.can_review,
  })

  useEffect(() => {
    if (campaign?.status === 'completed' && canReviewData) {
      setShowReviewModal(true)
    }
  }, [campaign?.status, canReviewData])

  const completeMutation = useMutation({
    mutationFn: () => campaignApi.markCompleted(id),
    onSuccess: () => {
      toast.success('Campaign marked as completed!')
      queryClient.invalidateQueries(['campaign', id])
      queryClient.invalidateQueries(['can-review', id])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  // ─── Navigate to campaign conversation or fallback to direct chat ──────────
  const openChat = (collab) => {
    const convId = collab.conversation?.id
    if (convId) {
      navigate(`/chat/${convId}`)
      return
    }
    const recipientId = isClientOwner ? collab.influencer_id : collab.client_id
    chatApi.startDirect(recipientId)
      .then((res) => navigate(`/chat/${res.data.data.conversation.id}`))
      .catch(() => toast.error('Could not open conversation'))
  }

  // ─── Loading / empty states ────────────────────────────────────────────────
  if (isLoading) return (
    <div className="max-w-3xl mx-auto py-12 space-y-4">
      <div className="skeleton h-10 w-3/4 rounded-xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  )

  if (!campaign) return (
    <div className="text-center py-20 text-slate-500">Campaign not found.</div>
  )

  const isClientOwner   = user?.id === campaign.client?.user_id
  const collabRequests  = campaign.collaboration_requests || []
  const hasAgreedCollab = collabRequests.some(
    (r) => ['active', 'completed', 'agreed'].includes(r.status)
  )

  // Only show collab section if the viewer is the client owner OR
  // there's a request belonging to the current influencer
  const myCollab = collabRequests.find((r) => r.influencer_id === user?.id)
  const showCollabSection = isClientOwner
    ? collabRequests.length > 0
    : !!myCollab

  // Which requests to render
  const visibleRequests = isClientOwner ? collabRequests : (myCollab ? [myCollab] : [])

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Campaign Header Card ── */}
        <div className="glass border border-white/8 rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-2xl text-white mb-1 truncate">
                {campaign.title}
              </h1>
              <p className="text-slate-500 text-sm">
                by {campaign.client?.company_name || 'Client'}
              </p>
            </div>
            <CampaignBadge status={campaign.status} />
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {campaign.budget_min && (
              <div className="glass border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <DollarSign className="w-3 h-3" /> Budget
                </div>
                <p className="text-white text-sm font-semibold">
                  {Number(campaign.budget_min).toLocaleString()}–{Number(campaign.budget_max).toLocaleString()} MAD
                </p>
              </div>
            )}
            {campaign.deadline && (
              <div className="glass border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <Calendar className="w-3 h-3" /> Deadline
                </div>
                <p className="text-white text-sm font-semibold">
                  {new Date(campaign.deadline).toLocaleDateString('en-GB')}
                </p>
              </div>
            )}
            {campaign.country && (
              <div className="glass border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <MapPin className="w-3 h-3" /> Location
                </div>
                <p className="text-white text-sm font-semibold">{campaign.country}</p>
              </div>
            )}
            {campaign.platforms?.length > 0 && (
              <div className="glass border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <Tag className="w-3 h-3" /> Platforms
                </div>
                <p className="text-white text-sm font-semibold capitalize">
                  {campaign.platforms.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Description & deliverables */}
          <div className="space-y-5">
            <div>
              <h3 className="text-slate-400 text-sm font-semibold mb-2">Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {campaign.description}
              </p>
            </div>
            {campaign.deliverables && (
              <div>
                <h3 className="text-slate-400 text-sm font-semibold mb-2">Deliverables</h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {campaign.deliverables}
                </p>
              </div>
            )}
            {campaign.target_niches?.length > 0 && (
              <div>
                <h3 className="text-slate-400 text-sm font-semibold mb-2">Target Niches</h3>
                <div className="flex flex-wrap gap-2">
                  {campaign.target_niches.map((n) => (
                    <span key={n} className="glass border border-white/8 text-slate-400 text-xs px-3 py-1 rounded-full">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Review Button ── */}
        {campaign.status === 'completed' && canReviewData && (
          <div className="glass border border-white/8 rounded-2xl p-6 mb-6 text-center">
            <p className="text-slate-300 text-sm mb-4">How was your experience working on this campaign?</p>
            <button
              onClick={() => setShowReviewModal(true)}
              className="btn-glow px-6 py-2.5 rounded-xl text-white font-medium inline-flex items-center gap-2"
            >
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              Write a Review
            </button>
          </div>
        )}

        {/* ── Collaboration Section ── */}
        {showCollabSection && (
          <div className="glass border border-white/8 rounded-2xl p-6 md:p-8">
            <h2 className="font-display font-bold text-xl text-white mb-5">
              Collaboration{visibleRequests.length > 1 ? 's' : ' Status'}
            </h2>

            <div className="space-y-6">
              {visibleRequests.map((collab) => (
                <div
                  key={collab.id}
                  className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 flex flex-col gap-4"
                >
                  {/* Collab header */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(collab.influencer?.display_name || collab.influencer?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {collab.influencer?.display_name || collab.influencer?.name || 'Influencer'}
                        </p>
                        {collab.agreed_amount && (
                          <p className="text-xs text-brand-400 font-medium">
                            Agreed: {Number(collab.agreed_amount).toLocaleString()} MAD
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Message button */}
                    <button
                      onClick={() => openChat(collab)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/10 hover:border-white/20 flex items-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                      Message
                    </button>
                  </div>

                  {/* Negotiation Panel — handles all workflow stages + pay button for client */}
                  {!['rejected', 'cancelled'].includes(collab.status) && (
                    <NegotiationPanel
                      request={collab}
                      invalidateKey="campaign"
                      onPayClick={
                        collab.status === 'agreed' && isClientOwner
                          ? () => setActivePaymentCollab(collab)
                          : undefined
                      }
                    />
                  )}

                  {/* Transaction / Escrow Status */}
                  {['agreed', 'active', 'completed'].includes(collab.status) && (
                    <div className="border-t border-white/5 pt-4">
                      <TransactionStatus collaboration={collab} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mark as Completed (client only, when there's an active collab) */}
            {isClientOwner && campaign.status === 'published' && hasAgreedCollab && (
              <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
                <button
                  onClick={() =>
                    window.confirm('Mark campaign as completed? This will trigger the review phase.') &&
                    completeMutation.mutate()
                  }
                  disabled={completeMutation.isPending}
                  className="btn-glow px-6 py-2.5 rounded-xl text-white font-medium flex items-center gap-2"
                >
                  {completeMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle className="w-4 h-4" />
                  }
                  Mark as Completed
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        campaignId={campaign.id}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!activePaymentCollab}
        onClose={() => {
          setActivePaymentCollab(null)
          queryClient.invalidateQueries(['campaign', id])
        }}
        collaboration={activePaymentCollab}
      />
    </div>
  )
}
