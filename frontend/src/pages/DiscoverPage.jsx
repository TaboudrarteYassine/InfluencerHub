import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X, MapPin, Star, Shield, Users } from 'lucide-react'
import { influencerApi } from '@/services/api'
import { Link } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import SaveButton from '@/components/SaveButton'

const PLATFORMS = ['tiktok', 'instagram', 'youtube']
const NICHES    = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Lifestyle', 'Business']

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
        <SaveButton influencerId={profile.user_id} className="absolute top-3 left-3" />
      </div>

      <div className="p-5 -mt-8">
        {/* Avatar */}
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
            <span className="text-slate-500 text-xs">({profile.rating_count})</span>
          </div>
        </div>

        {/* Niches */}
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
            <div className="flex flex-wrap gap-1 mb-3">
              {nichesArr.slice(0, 3).map((n) => (
                <span key={n} className="glass border border-white/8 text-slate-400 text-xs px-2 py-0.5 rounded-full">{n}</span>
              ))}
            </div>
          );
        })()}

        {/* Social stats */}
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

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            {profile.price_min ? (
              <span className="text-brand-400 text-sm font-semibold">
                From {profile.price_min.toLocaleString()} MAD
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

export default function DiscoverPage() {
  const [filters, setFilters] = useState({
    country: '', platform: '', niche: '', price_min: '', price_max: '',
    trust_score_min: '', is_verified: '', sort: 'trust_score', direction: 'desc',
  })
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['influencers', filters, debouncedSearch],
    queryFn: () => influencerApi.list({ ...filters, search: debouncedSearch, per_page: 18 }),
    select: (res) => res.data.data,
  })

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const resetFilters = () => setFilters({ country: '', platform: '', niche: '', price_min: '', price_max: '', trust_score_min: '', is_verified: '', sort: 'trust_score', direction: 'desc' })

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'trust_score' && v !== 'desc').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white mb-1">Discover Creators</h1>
          <p className="text-slate-500">Find the perfect influencer for your next campaign</p>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, niche, or location…"
            className="input-base pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilters || activeFilterCount > 0
              ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
              : 'glass border-white/8 text-slate-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-brand-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="glass border border-white/8 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm transition-all">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#050505]/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 w-full bg-[#0a0a0a] rounded-t-3xl border-t border-white/10 p-6 z-50 md:relative md:bg-transparent md:border md:border-white/8 md:rounded-2xl md:p-5 md:mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-2xl md:shadow-none"
            >
              <div className="col-span-2 md:hidden flex justify-between items-center mb-2">
                <h3 className="text-white font-semibold">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              {/* Platform */}
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Platform</label>
                <select value={filters.platform} onChange={(e) => setFilter('platform', e.target.value)} className="input-base">
                  <option value="">All Platforms</option>
                  {PLATFORMS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </div>

              {/* Niche */}
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Niche</label>
                <select value={filters.niche} onChange={(e) => setFilter('niche', e.target.value)} className="input-base">
                  <option value="">All Niches</option>
                  {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Budget min */}
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Budget Min (MAD)</label>
                <input type="number" value={filters.price_min} onChange={(e) => setFilter('price_min', e.target.value)}
                  placeholder="0" className="input-base" />
              </div>

              {/* Budget max */}
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Budget Max (MAD)</label>
                <input type="number" value={filters.price_max} onChange={(e) => setFilter('price_max', e.target.value)}
                  placeholder="50,000" className="input-base" />
              </div>

              {/* Trust score */}
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Min Trust Score</label>
                <select value={filters.trust_score_min} onChange={(e) => setFilter('trust_score_min', e.target.value)} className="input-base">
                  <option value="">Any</option>
                  <option value="30">30+</option>
                  <option value="50">50+</option>
                  <option value="70">70+ (High)</option>
                  <option value="90">90+ (Elite)</option>
                </select>
              </div>

              {/* Verified */}
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Verification</label>
                <select value={filters.is_verified} onChange={(e) => setFilter('is_verified', e.target.value)} className="input-base">
                  <option value="">All</option>
                  <option value="1">Verified Only</option>
                </select>
              </div>

              {/* Sort */}
              <div className="col-span-2 md:col-span-1">
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Sort By</label>
                <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} className="input-base">
                  <option value="trust_score">Trust Score</option>
                  <option value="rating_avg">Rating</option>
                  <option value="completed_campaigns">Experience</option>
                  <option value="price_min">Price (Low)</option>
                  <option value="created_at">Newest</option>
                </select>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Results count */}
      {data && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-500 text-sm">
            {isFetching ? 'Searching…' : `${data.total || data.data?.length || 0} creators found`}
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : (data?.data || []).map((profile) => <InfluencerCard key={profile.id} profile={profile} />)
        }
      </div>

      {/* Pagination */}
      {data?.last_page > 1 && (
        <div className="flex justify-center mt-10 gap-2">
          {Array.from({ length: data.last_page }, (_, i) => i + 1).map((page) => (
            <button key={page}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                data.current_page === page
                  ? 'bg-brand-600 text-white'
                  : 'glass border border-white/8 text-slate-400 hover:text-white'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
