import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/services/api'
import { MapPin, Globe, Star, ShieldCheck, Mail, Link as LinkIcon, Share2, ExternalLink, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import InviteToCampaignModal from '@/components/modals/InviteToCampaignModal'
import ReportModal from '@/components/modals/ReportModal'
import SaveButton from '@/components/SaveButton'
import toast from 'react-hot-toast'

export default function PublicInfluencerProfile() {
  const { username } = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-influencer', username],
    queryFn: () => authApi.publicInfluencerProfile(username),
    select: res => res.data.data.profile,
    retry: false
  })

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Profile link copied!')
  }

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-slate-500 animate-pulse">Loading profile...</div>
  if (error || !data) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-400">Profile not found.</div>

  const profile = data

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 selection:bg-brand-500/30">
      {/* Top Navbar specifically for public view */}
      <nav className="h-16 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-500" />
          <span className="font-display font-bold text-white">Influence<span className="text-brand-400">Hub</span></span>
        </Link>
        {!isAuthenticated && (
          <Link to="/register" className="btn-glow px-4 py-1.5 rounded-lg text-sm font-semibold text-white">Join Platform</Link>
        )}
        {isAuthenticated && (
          <Link to="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white">Go to Dashboard</Link>
        )}
      </nav>

      {/* Cover Image */}
      <div className="h-64 md:h-80 w-full relative bg-[#111111] overflow-hidden">
        {profile.cover_image ? (
          <img src={`/storage/${profile.cover_image}`} alt="Cover" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/40 to-purple-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20 relative -mt-24">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 md:items-end mb-8 items-center md:items-end text-center md:text-left">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-[#0a0a0a] bg-[#1a1a1a] overflow-hidden shrink-0 shadow-xl z-10">
            {profile.avatar ? (
              <img src={`/storage/${profile.avatar}`} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-600 bg-[#111111]">
                {profile.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3 z-10 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col items-center sm:items-start">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center gap-3">
                  {profile.name}
                  {profile.is_verified && <ShieldCheck className="w-6 h-6 text-brand-400" title="Verified" />}
                </h1>
                <p className="text-brand-400 font-medium tracking-wide">@{profile.username}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <SaveButton influencerId={profile.id} className="" />
                <button onClick={copyLink} className="glass px-4 py-2 rounded-xl text-sm font-medium border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 text-white">
                  <Share2 className="w-4 h-4" /> Share
                </button>

                {isAuthenticated && user?.id !== profile.id && (
                  <button onClick={() => setIsReportModalOpen(true)} className="glass px-4 py-2 rounded-xl text-sm font-medium border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 text-white">
                    <AlertTriangle className="w-4 h-4" /> Report
                  </button>
                )}

                {!isAuthenticated ? (
                  <Link to="/register?role=client" className="btn-glow px-6 py-2 rounded-xl text-white font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Contact
                  </Link>
                ) : user?.role === 'client' ? (
                  <button onClick={() => setIsInviteModalOpen(true)} className="btn-glow px-6 py-2 rounded-xl text-white font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Invite to Campaign
                  </button>
                ) : null}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-slate-400 mt-4">
              {profile.city && profile.country && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-brand-400" /> {profile.city}, {profile.country}</span>
              )}
              {profile.price_min && (
                <span className="flex items-center gap-1 font-mono text-white tracking-tight">
                  MAD {profile.price_min} - {profile.price_max}
                </span>
              )}
              {profile.avg_rating > 0 && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-current" /> {Number(profile.avg_rating).toFixed(1)} <span className="text-slate-500">({profile.total_reviews})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-8 md:col-span-2">
            <div className="glass p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">About Me</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{profile.bio || "No bio provided."}</p>
              
              {(() => {
                let nichesArr = [];
                try {
                  nichesArr = Array.isArray(profile.niches)
                    ? profile.niches
                    : (typeof profile.niches === 'string'
                        ? (profile.niches.startsWith('[') ? JSON.parse(profile.niches) : profile.niches.split(',').map(s => s.trim()))
                        : []);
                } catch (e) {
                  nichesArr = [];
                }
                return nichesArr.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {nichesArr.map((niche, i) => (
                      <span key={i} className="px-3 py-1 text-xs font-medium bg-white/5 text-slate-300 rounded-full border border-white/10">
                        {niche}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Portfolio */}
            {profile.portfolio_items?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Portfolio</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {profile.portfolio_items.map(item => (
                    <div key={item.id} className="glass rounded-2xl border border-white/5 overflow-hidden group">
                      {item.media_type === 'image' && item.media_url ? (
                        <div className="aspect-video bg-[#111111] overflow-hidden">
                          <img src={`/storage/${item.media_url}`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-[#111111] flex items-center justify-center border-b border-white/5">
                          <LinkIcon className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="text-white font-medium mb-1 truncate">{item.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                        {item.external_url && (
                          <a href={item.external_url} target="_blank" rel="noreferrer" className="text-brand-400 text-xs mt-3 inline-flex items-center gap-1 hover:text-brand-300">
                            View Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {profile.reviews?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Recent Reviews ({profile.total_reviews})</h3>
                <div className="space-y-3">
                  {profile.reviews.map(review => (
                    <div key={review.id} className="glass p-5 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-slate-300">
                            {review.reviewer?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{review.reviewer?.name}</p>
                            <div className="flex gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-white/5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Social Accounts</h3>
              {profile.social_accounts?.length === 0 ? (
                <p className="text-sm text-slate-500">No linked accounts.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {profile.social_accounts?.map(acc => (
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
            
            {profile.languages?.length > 0 && (
              <div className="glass p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map(lang => (
                    <span key={lang} className="text-sm text-white">{lang}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isInviteModalOpen && <InviteToCampaignModal influencerId={profile.id} onClose={() => setIsInviteModalOpen(false)} />}
      
      {isAuthenticated && user?.id !== profile.id && (
        <ReportModal 
          isOpen={isReportModalOpen} 
          onClose={() => setIsReportModalOpen(false)} 
          reportedUserId={profile.id} 
        />
      )}
    </div>
  )
}
