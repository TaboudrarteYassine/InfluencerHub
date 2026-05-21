import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { campaignApi, influencerApi, authApi } from '@/services/api'
import {
  Briefcase, Users, Star, TrendingUp, Plus, ArrowRight,
  Shield, MessageCircle, Eye, Zap, DollarSign, Handshake
} from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass border border-white/5 rounded-2xl p-5 card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
            }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="font-display font-bold text-2xl text-white mb-1">{value}</p>
      <p className="text-slate-500 text-sm">{label}</p>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user, isInfluencer, isClient } = useAuthStore()

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => authApi.dashboardStats(),
    select: res => res.data.data
  })

  const { data: campaigns } = useQuery({
    queryKey: ['my-campaigns-dash'],
    queryFn: () => campaignApi.myCampaigns({ per_page: 5 }),
    enabled: isClient(),
    select: (res) => res.data.data,
  })

  const { data: profile } = useQuery({
    queryKey: ['my-profile-dash'],
    queryFn: () => influencerApi.myProfile(),
    enabled: isInfluencer(),
    select: (res) => res.data.data?.profile,
  })

  const { data: featured } = useQuery({
    queryKey: ['featured'],
    queryFn: () => influencerApi.featured(),
    select: (res) => res.data.data?.influencers,
  })

  const statusBadge = (status) => {
    const map = {
      draft: 'badge badge-pending', published: 'badge badge-active',
      active: 'badge badge-active', completed: 'badge badge-completed',
      cancelled: 'badge badge-cancelled', negotiating: 'badge badge-negotiating',
    }
    return <span className={map[status] || 'badge'}>{status}</span>
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">
            Good day, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm">
            {isInfluencer() ? "Here's your creator overview" : "Here's your campaign overview"}
          </p>
        </div>
        {isClient() && (
          <Link to="/campaigns/create" className="btn-glow px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="w-4 h-4" />New Campaign
            </span>
          </Link>
        )}
        {isInfluencer() && (
          <Link to="/settings/influencer" className="glass border border-white/8 hover:border-brand-500/40 px-4 py-2.5 rounded-xl text-slate-300 text-sm font-semibold transition-all flex items-center gap-2">
            Edit Profile
          </Link>
        )}
      </div>

      {/* ── Influencer Stats ── */}
      {isInfluencer() && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending Requests" value={stats.pending_requests || 0} icon={Handshake} color="bg-accent-500/20 text-accent-400" />
          <StatCard label="Active Campaigns" value={stats.active_campaigns || 0} icon={Zap} color="bg-green-500/20 text-green-400" />
          <StatCard label="Total Earnings" value={`${Number(stats.total_earnings || 0).toLocaleString()} MAD`} icon={DollarSign} color="bg-brand-600/20 text-brand-400" />
          <StatCard label="Avg Rating" value={stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '—'} icon={Star} color="bg-yellow-500/20 text-yellow-400" />
        </div>
      )}

      {/* ── Client Stats ── */}
      {isClient() && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Campaigns" value={stats.total_campaigns || 0} icon={Briefcase} color="bg-brand-600/20 text-brand-400" />
          <StatCard label="Active" value={stats.active_campaigns || 0} icon={Zap} color="bg-green-500/20 text-green-400" />
          <StatCard label="Total Spent" value={`${Number(stats.total_spent || 0).toLocaleString()} MAD`} icon={DollarSign} color="bg-yellow-500/20 text-yellow-400" />
          <StatCard label="Pending Requests" value={stats.pending_requests || 0} icon={Handshake} color="bg-accent-500/20 text-accent-400" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Client: Recent Campaigns ── */}
        {isClient() && (
          <div className="glass border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Recent Campaigns</h2>
              <Link to="/campaigns" className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {campaigns?.data && campaigns.data.length > 0 ? (
                campaigns.data.slice(0, 5).map((camp) => (
                  <div key={camp.id} className="flex items-center justify-between p-4 hover:bg-white/3 transition-all">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{camp.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Budget: {camp.budget_min ? `${camp.budget_min.toLocaleString()}–${camp.budget_max?.toLocaleString()} MAD` : 'Open'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {statusBadge(camp.status)}
                      <Link to={`/campaigns/${camp.id}/matches`} className="text-slate-500 hover:text-brand-400 transition-colors">
                        <Zap className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No campaigns yet.{' '}
                  <Link to="/campaigns/create" className="text-brand-400 hover:text-brand-300">Create one →</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Influencer: Profile Completion ── */}
        {isInfluencer() && profile && (
          <div className="glass border border-white/5 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-5">Profile Completeness</h2>
            {[
              { label: 'Bio', done: !!profile.bio },
              { label: 'Location', done: !!(profile.country && profile.city) },
              { label: 'Niches', done: profile.niches?.length > 0 },
              { label: 'Social Accounts', done: profile.social_accounts?.length > 0 },
              { label: 'Pricing', done: !!(profile.price_min && profile.price_max) },
              { label: 'Profile Picture', done: !!profile.profile_picture },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <span className="text-slate-400 text-sm">{item.label}</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${item.done ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-slate-600'
                  }`}>
                  {item.done ? '✓' : '○'}
                </span>
              </div>
            ))}
            <Link to="/settings/influencer" className="mt-4 block text-center text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
              Complete Profile →
            </Link>
          </div>
        )}

        {/* ── Client: Recent Requests ── */}
        {isClient() && (
          <div className="glass border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Recent Requests</h2>
              <Link to="/campaigns" className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {stats?.recent_requests && stats.recent_requests.length > 0 ? (
                stats.recent_requests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 hover:bg-white/3 transition-all">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {req.influencer?.display_name || req.influencer?.user?.name || req.influencer?.name || 'Influencer'}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">{req.campaign?.title}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {statusBadge(req.status)}
                      <span className="text-slate-400 text-xs">{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">No recent requests.</div>
              )}
            </div>
          </div>
        )}

        {/* ── Influencer: Recent Requests & Reviews ── */}
        {isInfluencer() && (
          <div className="space-y-6">
            <div className="glass border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm">Recent Requests</h2>
                <Link to="/influencer/requests" className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {stats?.recent_requests && stats.recent_requests.length > 0 ? (
                  stats.recent_requests.slice(0, 5).map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 hover:bg-white/3 transition-all">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{req.campaign?.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{req.campaign?.client_profile?.company_name || req.campaign?.clientProfile?.company_name}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {statusBadge(req.status)}
                        <span className="text-white text-sm font-bold">{Number(req.agreed_amount || req.campaign?.budget_min || 0).toLocaleString()} MAD</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">No recent requests.</div>
                )}
              </div>
            </div>

            <div className="glass border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm">Recent Reviews</h2>
              </div>
              <div className="divide-y divide-white/5">
                {stats?.recent_reviews && stats.recent_reviews.length > 0 ? (
                  stats.recent_reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="p-4 hover:bg-white/3 transition-all">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-white text-sm font-medium">{review.reviewer?.name}</p>
                        <div className="flex text-yellow-400"><Star className="w-3 h-3 fill-current" /> <span className="text-xs ml-1">{review.rating}</span></div>
                      </div>
                      <p className="text-slate-500 text-xs truncate">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">No reviews yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
