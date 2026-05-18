import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Heart, Search, MapPin, Shield, Star, Users } from 'lucide-react'
import { savedApi } from '@/services/api'
import { Link } from 'react-router-dom'
import SaveButton from '@/components/SaveButton'

function SkeletonCard() {
  return (
    <div className="glass border border-white/5 rounded-2xl overflow-hidden">
      <div className="skeleton h-28 w-full" />
      <div className="p-5 -mt-8">
        <div className="skeleton w-16 h-16 rounded-2xl mb-3" />
        <div className="skeleton h-4 w-32 mb-2 rounded" />
        <div className="skeleton h-3 w-20 mb-4 rounded" />
        <div className="flex gap-2 mb-3">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
        <div className="skeleton h-8 w-full rounded-lg" />
      </div>
    </div>
  )
}

function InfluencerCard({ profile }) {
  const trustClass = profile.trust_score >= 70 ? 'trust-high' : profile.trust_score >= 40 ? 'trust-mid' : 'trust-low'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="glass border border-white/5 rounded-2xl overflow-hidden card-hover"
    >
      {/* Cover */}
      <div className="h-28 bg-gradient-to-br from-brand-600/30 to-accent-500/20 relative">
        {profile.cover_image && (
          <img src={`/storage/${profile.cover_image}`} alt="" className="w-full h-full object-cover" />
        )}
        <div className={`absolute top-3 right-3 trust-badge ${trustClass}`}>
          <Shield className="w-3 h-3" />
          {parseFloat(profile.trust_score || 0).toFixed(0)}
        </div>
        {/* Save button top-left */}
        <SaveButton influencerId={profile.user_id} className="absolute top-3 left-3" />
      </div>

      <div className="p-5 -mt-8">
        <div className="w-16 h-16 rounded-2xl border-4 border-[var(--color-surface-800)] bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl mb-3 overflow-hidden">
          {profile.profile_picture
            ? <img src={`/storage/${profile.profile_picture}`} alt={profile.display_name} className="w-full h-full object-cover" />
            : (profile.user?.name?.charAt(0) || '?')
          }
        </div>

        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-white font-semibold text-sm">
              {profile.display_name || profile.user?.name}
              {profile.is_verified && <span className="ml-1 text-brand-400">✓</span>}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              {profile.city || profile.country || 'Morocco'}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-xs font-semibold">{profile.rating_avg ? parseFloat(profile.rating_avg).toFixed(1) : '—'}</span>
            <span className="text-slate-500 text-xs">({profile.rating_count || 0})</span>
          </div>
        </div>

        {profile.niches?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {profile.niches.slice(0, 3).map((n) => (
              <span key={n} className="glass border border-white/8 text-slate-400 text-xs px-2 py-0.5 rounded-full">{n}</span>
            ))}
          </div>
        )}

        {profile.social_accounts?.length > 0 && (
          <div className="flex gap-3 mb-4">
            {profile.social_accounts.slice(0, 2).map((acc) => (
              <div key={acc.id} className="text-center">
                <p className="text-white text-xs font-semibold">
                  {acc.followers_count >= 1000000
                    ? `${(acc.followers_count / 1000000).toFixed(1)}M`
                    : acc.followers_count >= 1000
                    ? `${(acc.followers_count / 1000).toFixed(0)}K`
                    : acc.followers_count
                  }
                </p>
                <p className="text-slate-500 text-xs capitalize">{acc.platform}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            {profile.price_min ? (
              <span className="text-brand-400 text-sm font-semibold">
                From {Number(profile.price_min).toLocaleString()} MAD
              </span>
            ) : (
              <span className="text-slate-500 text-sm">Price on request</span>
            )}
          </div>
          <Link
            to={`/influencers/${profile.user_id}`}
            className="glass border border-brand-500/30 hover:border-brand-500 px-3 py-1.5 rounded-lg text-brand-400 text-xs font-semibold transition-all hover:bg-brand-500/10"
          >
            View Profile
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default function SavedInfluencersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['saved-influencers', page],
    queryFn: () => savedApi.list({ page, per_page: 18 }).then(r => r.data.data),
  })

  const profiles = data?.data || []
  const filtered = search
    ? profiles.filter(p =>
        (p.display_name || p.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.niches || []).some(n => n.toLowerCase().includes(search.toLowerCase()))
      )
    : profiles

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white mb-1 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-400 fill-red-400" />
            Saved Creators
          </h1>
          <p className="text-slate-500">Your shortlisted influencers, ready to collaborate.</p>
        </div>
        <Link
          to="/discover"
          className="btn-glow px-5 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Search className="w-4 h-4" /> Browse Influencers
        </Link>
      </div>

      {/* Local search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name or niche…"
          className="input-base pl-10 w-full"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
            <Heart className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">No saved influencers yet</h3>
          <p className="text-slate-500 mb-6">Browse creators and click the heart icon to save them here.</p>
          <Link
            to="/discover"
            className="btn-glow px-6 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Browse Influencers
          </Link>
        </div>
      ) : (
        <>
          <p className="text-slate-500 text-sm mb-5">{filtered.length} creator{filtered.length !== 1 ? 's' : ''} saved</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((profile) => (
              <InfluencerCard key={profile.id} profile={profile} />
            ))}
          </div>

          {/* Pagination */}
          {data?.last_page > 1 && (
            <div className="flex justify-center mt-10 gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 glass border border-white/8 text-slate-400 rounded-xl text-sm hover:text-white disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-slate-500 text-sm">Page {page} of {data.last_page}</span>
              <button
                disabled={page === data.last_page}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 glass border border-white/8 text-slate-400 rounded-xl text-sm hover:text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
