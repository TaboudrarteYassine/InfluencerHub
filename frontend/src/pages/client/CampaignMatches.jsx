import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { campaignApi } from '@/services/api'
import { motion } from 'framer-motion'
import { Zap, Shield, Star, MapPin, Users, Loader2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CampaignMatches() {
  const { id } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-matches', id],
    queryFn:  () => campaignApi.aiMatches(id),
    select:   (res) => res.data.data?.matches || [],
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <Zap className="w-10 h-10 text-brand-400" />
          <div className="absolute inset-0 animate-ping bg-brand-500/20 rounded-full" />
        </div>
        <p className="text-slate-400 text-sm">AI is finding the best matches for your campaign…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-white font-medium">Failed to load matches</p>
        <p className="text-slate-500 text-sm">{error.response?.data?.message || 'Please try again'}</p>
      </div>
    )
  }

  const matches = data || []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-brand-400" />
          <h1 className="font-display font-bold text-2xl text-white">AI Matches</h1>
        </div>
        <p className="text-slate-500 text-sm">
          {matches.length} influencers ranked by AI match score for this campaign
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="glass border border-white/8 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No matches found</p>
          <p className="text-slate-600 text-sm mt-2">Try relaxing your campaign targeting criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, i) => {
            const profile     = match.profile
            const score       = match.score
            const explanation = match.explanation || {}
            const pct         = Math.round((score > 1 ? score / 100 : score) * 100)

            return (
              <motion.div key={profile.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass border border-white/8 rounded-2xl p-5 card-hover"
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-slate-400/20 text-slate-300' :
                    i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-500'
                  }`}>
                    #{i + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                    {profile.profile_picture
                      ? <img src={`/storage/${profile.profile_picture}`} alt="" className="w-full h-full object-cover" />
                      : profile.user?.name?.charAt(0)
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-white font-semibold text-base">
                          {profile.display_name || profile.user?.name}
                          {profile.is_verified && <span className="ml-1.5 text-brand-400 text-sm">✓</span>}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {profile.country && (
                            <span className="flex items-center gap-1 text-slate-500 text-xs">
                              <MapPin className="w-3 h-3" />{profile.city || profile.country}
                            </span>
                          )}
                          {profile.rating_avg > 0 && (
                            <span className="flex items-center gap-1 text-slate-500 text-xs">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              {profile.rating_avg ? parseFloat(profile.rating_avg).toFixed(1) : '—'}
                            </span>
                          )}
                          <span className={`trust-badge ${
                            profile.trust_score >= 70 ? 'trust-high' : profile.trust_score >= 40 ? 'trust-mid' : 'trust-low'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {parseFloat(profile.trust_score || 0).toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="text-right flex-shrink-0">
                        <div className="font-display font-extrabold text-2xl gradient-text">{pct}%</div>
                        <div className="text-slate-500 text-xs">match score</div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.07 + 0.3, duration: 0.7 }}
                        className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"
                      />
                    </div>

                      <div className="flex items-center justify-between mt-3">
                      <div className="flex flex-wrap gap-1">
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
                          return nichesArr.slice(0, 3).map((n) => (
                            <span key={n} className="glass border border-white/8 text-slate-400 text-xs px-2 py-0.5 rounded-full">{n}</span>
                          ));
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        {profile.price_min && (
                          <span className="text-brand-400 text-sm font-semibold">
                            {Number(profile.price_min).toLocaleString()} MAD+
                          </span>
                        )}
                        <Link to={`/influencers/${profile.user_id}`}
                          className="glass border border-brand-500/30 hover:border-brand-500 px-3 py-1.5 rounded-lg text-brand-400 text-xs font-semibold transition-all hover:bg-brand-500/10">
                          View Profile
                        </Link>
                        <button
                          onClick={() => {
                            campaignApi.sendRequest(id, { influencer_id: profile.user_id, message: 'Hi! We think you are a great match for our campaign. Let\'s collaborate!' })
                              .then(() => alert('Collaboration request sent! Check your Messages.'))
                              .catch((err) => alert(err.response?.data?.message || 'Error sending request'));
                          }}
                          className="btn-glow px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all">
                          Send Request
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
