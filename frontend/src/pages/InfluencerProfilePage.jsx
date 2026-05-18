import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { influencerApi, chatApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import {
  MapPin, Star, Shield, Share2, Globe, AlertTriangle,
  Calendar, DollarSign, CheckCircle, Loader2, MessageCircle, Briefcase
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import ReviewsList from '@/components/ReviewsList'
import PortfolioGrid from '@/components/PortfolioGrid'
import InviteToCampaignModal from '@/components/modals/InviteToCampaignModal'
import ReportModal from '@/components/modals/ReportModal'
import SaveButton from '@/components/SaveButton'

export default function InfluencerProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isClient } = useAuthStore()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['influencer', id],
    queryFn:  () => influencerApi.show(id),
    select:   (res) => res.data.data?.profile,
  })

  if (isLoading) return (
    <div className="max-w-4xl mx-auto py-12 space-y-4 px-4">
      <div className="skeleton h-48 rounded-2xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  )

  if (!profile) return (
    <div className="text-center py-20 text-slate-500">Influencer not found.</div>
  )

  const trustClass = profile.trust_score >= 70 ? 'trust-high' : profile.trust_score >= 40 ? 'trust-mid' : 'trust-low'

  const copyLink = () => {
    if (profile.user?.username) {
      navigator.clipboard.writeText(`${window.location.origin}/@${profile.user.username}`)
      toast.success('Public profile link copied!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Cover */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass border border-white/8 rounded-2xl overflow-hidden mb-6"
      >
        <div className="h-44 bg-gradient-to-br from-brand-600/30 to-accent-500/20 relative">
          {profile.cover_image && (
            <img src={`/storage/${profile.cover_image}`} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="px-8 pb-8 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 items-center md:items-end text-center md:text-left">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-[#0a0a0a] bg-[#1a1a1a] overflow-hidden shrink-0 shadow-xl z-10">
              {profile.profile_picture ? (
                <img src={`/storage/${profile.profile_picture}`} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-600 bg-[#111111]">
                  {profile.user?.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3 z-10 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col items-center sm:items-start">
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center gap-3">
                    {profile.display_name || profile.user?.name}
                    {profile.verification_status === 'approved' && <Shield className="w-6 h-6 text-brand-400" title="Verified" />}
                  </h1>
                  <p className="text-brand-400 font-medium tracking-wide">@{profile.user?.username}</p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                  <SaveButton influencerId={profile.user_id} className="" />
                  <button
                    onClick={copyLink}
                    className="glass border-white/10 hover:border-white/20 text-white flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>

                  {user && user.id !== profile.user_id && (
                    <>
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="glass border-white/10 hover:border-white/20 text-white flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      >
                        <AlertTriangle className="w-4 h-4" /> Report
                      </button>
                      
                      <button
                        onClick={() => {
                          chatApi.startDirect(profile.user_id)
                            .then((res) => navigate(`/chat/${res.data.data.conversation.id}`))
                            .catch(() => alert('Could not start conversation'));
                        }}
                        className="glass border-white/10 hover:border-white/20 text-white flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      >
                        <MessageCircle className="w-4 h-4" /> Message
                      </button>
                      
                      {isClient() && (
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="btn-glow flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                        >
                          <Briefcase className="w-4 h-4" /> Send Request
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
                  {(profile.city || profile.country) && (
                    <span className="flex items-center gap-1 text-slate-500 text-sm">
                      <MapPin className="w-3.5 h-3.5" />{profile.city || ''}{profile.city && profile.country ? ', ' : ''}{profile.country}
                    </span>
                  )}
                  {profile.rating_avg > 0 && (
                    <span className="flex items-center gap-1 text-slate-500 text-sm">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      {parseFloat(profile.rating_avg).toFixed(1)} ({profile.rating_count} reviews)
                    </span>
                  )}
                  <span className={`badge ${profile.availability === 'available' ? 'badge-active' : 'badge-pending'}`}>
                    {profile.availability}
                  </span>
                </div>
                
                {profile.price_min && (
                  <div className="text-center sm:text-right">
                    <p className="text-slate-500 text-xs mb-1">Starting from</p>
                    <p className="text-brand-400 font-display font-bold text-2xl">
                      {Number(profile.price_min).toLocaleString()} MAD
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-2xl">{profile.bio}</p>
          )}

          {/* Niches */}
          {profile.niches?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {profile.niches.map((n) => (
                <span key={n} className="glass border border-white/8 text-slate-300 text-xs px-3 py-1.5 rounded-full font-medium">{n}</span>
              ))}
            </div>
          )}

          {/* Social accounts */}
          {profile.social_accounts?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {profile.social_accounts.map((acc) => (
                <div key={acc.id} className="glass border border-white/5 rounded-xl p-4 text-center">
                  <p className="text-slate-500 text-xs capitalize mb-2">{acc.platform}</p>
                  <p className="font-display font-bold text-xl text-white">
                    {acc.followers_count >= 1000000
                      ? `${(acc.followers_count / 1000000).toFixed(1)}M`
                      : acc.followers_count >= 1000
                      ? `${(acc.followers_count / 1000).toFixed(0)}K`
                      : acc.followers_count
                    }
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">followers</p>
                  {acc.engagement_rate > 0 && (
                    <p className="text-brand-400 text-xs font-semibold mt-1">{acc.engagement_rate}% eng.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass border border-white/5 rounded-2xl p-5 text-center">
          <p className="font-display font-bold text-2xl text-white">{profile.completed_campaigns}</p>
          <p className="text-slate-500 text-sm mt-1">Completed Jobs</p>
        </div>
        <div className="glass border border-white/5 rounded-2xl p-5 text-center">
          <p className="font-display font-bold text-2xl text-white">{profile.rating_avg ? parseFloat(profile.rating_avg).toFixed(1) : '—'}</p>
          <p className="text-slate-500 text-sm mt-1">Avg Rating</p>
        </div>
        <div className="glass border border-white/5 rounded-2xl p-5 text-center">
          <p className="font-display font-bold text-2xl gradient-text">{parseFloat(profile.trust_score || 0).toFixed(0)}</p>
          <p className="text-slate-500 text-sm mt-1">Trust Score</p>
        </div>
      </div>

      {/* Portfolio */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Portfolio</h2>
        <PortfolioGrid userId={profile.user_id} />
      </div>

      {/* Reviews */}
      <ReviewsList userId={profile.user_id} type="influencer" />

      {isClient() && (
        <InviteToCampaignModal 
          isOpen={showInviteModal} 
          onClose={() => setShowInviteModal(false)} 
          influencerId={profile.id} 
        />
      )}

      {user && user.id !== profile.user_id && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={profile.user_id}
        />
      )}
    </div>
  )
}
