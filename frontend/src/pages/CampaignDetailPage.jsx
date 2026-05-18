import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignApi, reviewApi } from '@/services/api'
import { motion } from 'framer-motion'
import { Calendar, DollarSign, MapPin, Tag, Briefcase, CheckCircle, Handshake, Loader2, MessageSquare, CreditCard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import ReviewModal from '@/components/ReviewModal'
import NegotiationPanel from '@/components/NegotiationPanel'
import PaymentModal from '@/components/modals/PaymentModal'
import TransactionStatus from '@/components/campaign/TransactionStatus'

export default function CampaignDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [activePaymentCollab, setActivePaymentCollab] = useState(null)

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn:  () => campaignApi.show(id),
    select:   (res) => res.data.data?.campaign,
  })

  const { data: canReviewData } = useQuery({
    queryKey: ['can-review', id],
    queryFn: () => reviewApi.canReview(id),
    enabled: !!campaign && campaign.status === 'completed',
    select: res => res.data.data?.can_review
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
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  })

  if (isLoading) return (
    <div className="max-w-3xl mx-auto py-12 space-y-4">
      <div className="skeleton h-10 w-3/4 rounded-xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  )

  if (!campaign) return (
    <div className="text-center py-20 text-slate-500">Campaign not found.</div>
  )

  const isClientOwner = user?.id === campaign.client?.user_id
  const collabRequests = campaign.collaboration_requests || []
  const hasAgreedCollab = collabRequests.some(r => r.status === 'accepted' || r.status === 'completed')

  // Make sure we have the relations we need (like negotiations) in the collab requests
  const campaignWithRequests = collabRequests.length > 0 ? campaign : null

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass border border-white/8 rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white mb-1">{campaign.title}</h1>
              <p className="text-slate-500 text-sm">by {campaign.client?.company_name || 'Client'}</p>
            </div>
            <span className={`badge ml-auto ${campaign.status === 'published' ? 'badge-active' : campaign.status === 'completed' ? 'badge-success' : 'badge-pending'}`}>
              {campaign.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {campaign.budget_min && (
              <div className="glass border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1"><DollarSign className="w-3 h-3" />Budget</div>
                <p className="text-white text-sm font-semibold">{Number(campaign.budget_min).toLocaleString()}–{Number(campaign.budget_max).toLocaleString()} MAD</p>
              </div>
            )}
            {campaign.deadline && (
              <div className="glass border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1"><Calendar className="w-3 h-3" />Deadline</div>
                <p className="text-white text-sm font-semibold">{new Date(campaign.deadline).toLocaleDateString('en-GB')}</p>
              </div>
            )}
            {campaign.country && (
              <div className="glass border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1"><MapPin className="w-3 h-3" />Location</div>
                <p className="text-white text-sm font-semibold">{campaign.country}</p>
              </div>
            )}
            {campaign.platforms?.length > 0 && (
              <div className="glass border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1"><Tag className="w-3 h-3" />Platforms</div>
                <p className="text-white text-sm font-semibold capitalize">{campaign.platforms.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-slate-400 text-sm font-semibold mb-2">Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
            </div>
            {campaign.deliverables && (
              <div>
                <h3 className="text-slate-400 text-sm font-semibold mb-2">Deliverables</h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{campaign.deliverables}</p>
              </div>
            )}
            {campaign.target_niches?.length > 0 && (
              <div>
                <h3 className="text-slate-400 text-sm font-semibold mb-2">Target Niches</h3>
                <div className="flex flex-wrap gap-2">
                  {campaign.target_niches.map((n) => (
                     <span key={n} className="glass border border-white/8 text-slate-400 text-xs px-3 py-1 rounded-full">{n}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collab Section */}
        {(isClientOwner || collabRequests.some(r => r.influencer?.user_id === user?.id)) && collabRequests.length > 0 && (
          <div className="glass border border-white/8 rounded-2xl p-8">
            <h2 className="font-display font-bold text-xl text-white mb-4">Collaboration Status</h2>
            <div className="space-y-4">
              {collabRequests.map(collab => {
                if (!isClientOwner && collab.influencer?.user_id !== user?.id) return null
                return (
                  <div key={collab.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Handshake className="w-4 h-4 text-brand-400" />
                          <span className="font-medium text-white">{collab.influencer?.display_name || 'Influencer'}</span>
                        </div>
                        {collab.agreed_amount && (
                          <div className="text-sm text-slate-400 mt-1">Agreed Amount: {Number(collab.agreed_amount).toLocaleString()} MAD</div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs uppercase ${collab.status === 'accepted' || collab.status === 'completed' || collab.status === 'agreed' ? 'bg-green-500/20 text-green-400' : collab.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-400'}`}>
                        {collab.status}
                      </span>
                    </div>

                    {collab.status !== 'rejected' && (
                      <NegotiationPanel request={collab} />
                    )}

                    {collab.status === 'agreed' && isClientOwner && (
                      <div className="mt-3 pt-3 border-t border-white/10 text-right">
                        <button
                          onClick={() => setActivePaymentCollab(collab)}
                          className="btn-glow px-4 py-2 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" /> Pay & Start Campaign
                        </button>
                      </div>
                    )}

                    {(collab.status === 'active' || collab.status === 'completed' || collab.status === 'agreed') && (
                      <div className="mt-4">
                        <TransactionStatus collaboration={collab} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {isClientOwner && campaign.status === 'published' && hasAgreedCollab && (
              <div className="mt-6 pt-6 border-t border-white/10 text-right">
                <button 
                  onClick={() => confirm("Mark campaign as completed? This will trigger the review phase.") && completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                  className="btn-glow px-6 py-2 rounded-xl text-white font-medium flex items-center justify-center gap-2 ml-auto"
                >
                  {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Mark as Completed
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <ReviewModal 
        isOpen={showReviewModal} 
        onClose={() => setShowReviewModal(false)} 
        campaignId={campaign.id} 
      />

      <PaymentModal
        isOpen={!!activePaymentCollab}
        onClose={() => setActivePaymentCollab(null)}
        collaboration={activePaymentCollab}
      />
    </div>
  )
}
