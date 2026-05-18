import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X, MapPin, DollarSign, Calendar, Briefcase, Zap, Star } from 'lucide-react'
import { campaignApi } from '@/services/api'
import { Link } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import ApplyModal from '@/components/modals/ApplyModal'

const PLATFORMS = ['tiktok', 'instagram', 'youtube', 'twitter']
const NICHES    = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Lifestyle', 'Business']

function CampaignCard({ campaign, onApply }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="glass border border-white/5 rounded-2xl overflow-hidden card-hover flex flex-col h-full"
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
          <div className="w-12 h-12 rounded-xl border border-white/10 bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden mb-3">
            {campaign.client_profile?.user?.avatar ? (
              <img src={campaign.client_profile.user.avatar} alt={campaign.client_profile?.company_name} className="w-full h-full object-cover" />
            ) : (
              <Briefcase className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <span className="badge badge-active">{campaign.status}</span>
        </div>

        <h3 className="text-white font-semibold text-lg line-clamp-1 mb-1">{campaign.title}</h3>
        <p className="text-slate-400 text-sm mb-3 font-medium">{campaign.client_profile?.company_name}</p>
        
        <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
          {campaign.description}
        </p>

        {campaign.requirements?.niches && campaign.requirements.niches.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {campaign.requirements.niches.slice(0, 3).map((n) => (
              <span key={n} className="glass border border-white/8 text-slate-300 text-xs px-2 py-0.5 rounded-full">{n}</span>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 border-t border-white/5 bg-white/[0.02] mt-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-brand-400" />
            <span className="text-white font-semibold text-sm">
              {campaign.budget_min ? `${campaign.budget_min.toLocaleString()} MAD` : 'Open Budget'}
            </span>
          </div>
          {campaign.requirements?.platforms && campaign.requirements.platforms.length > 0 && (
            <div className="flex gap-1.5">
              {campaign.requirements.platforms.slice(0, 2).map(p => (
                <span key={p} className="text-slate-400 text-xs capitalize bg-white/5 px-2 py-1 rounded-md">{p}</span>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => onApply(campaign)}
          className="w-full btn-glow px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" /> Apply Now
        </button>
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="glass border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[380px]">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
          <div className="skeleton w-12 h-12 rounded-xl mb-3" />
          <div className="skeleton w-16 h-6 rounded-full" />
        </div>
        <div className="skeleton h-6 w-3/4 mb-2 rounded" />
        <div className="skeleton h-4 w-1/2 mb-4 rounded" />
        <div className="skeleton h-10 w-full mb-4 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
      </div>
      <div className="p-5 border-t border-white/5 bg-white/[0.02]">
        <div className="skeleton h-6 w-1/2 mb-4 rounded" />
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}

export default function DiscoverCampaigns() {
  const [filters, setFilters] = useState({
    platform: '', niche: '', budget_min: '', status: 'active', sort: 'created_at', direction: 'desc',
  })
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['campaigns-discover', filters, debouncedSearch],
    queryFn: () => campaignApi.publicCampaigns({ ...filters, search: debouncedSearch, per_page: 12 }),
    select: (res) => res.data.data,
  })

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const resetFilters = () => setFilters({ platform: '', niche: '', budget_min: '', status: 'active', sort: 'created_at', direction: 'desc' })

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'created_at' && v !== 'desc' && v !== 'active').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white mb-1">Discover Campaigns</h1>
          <p className="text-slate-500">Find the perfect brand collaboration for your audience</p>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by campaign title, brand name, or keywords…"
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
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass border border-white/8 rounded-2xl p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden"
          >
            {/* Platform */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Required Platform</label>
              <select value={filters.platform} onChange={(e) => setFilter('platform', e.target.value)} className="input-base">
                <option value="">Any</option>
                {PLATFORMS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>

            {/* Niche */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Campaign Category</label>
              <select value={filters.niche} onChange={(e) => setFilter('niche', e.target.value)} className="input-base">
                <option value="">All Categories</option>
                {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Minimum Budget (MAD)</label>
              <input type="number" value={filters.budget_min} onChange={(e) => setFilter('budget_min', e.target.value)}
                placeholder="e.g. 1000" className="input-base" />
            </div>

            {/* Sort */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Sort By</label>
              <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} className="input-base">
                <option value="created_at">Newest First</option>
                <option value="budget_min">Highest Budget</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      {data && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-500 text-sm">
            {isFetching ? 'Searching…' : `${data.total || data.data?.length || 0} campaigns found`}
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : (data?.data || []).map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} onApply={setSelectedCampaign} />)
        }
      </div>

      {/* Pagination */}
      {data?.last_page > 1 && (
        <div className="flex justify-center mt-10 gap-2">
          {Array.from({ length: data.last_page }, (_, i) => i + 1).map((page) => (
            <button key={page}
              onClick={() => { /* Should ideally handle page state here */ }}
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

      <ApplyModal 
        isOpen={!!selectedCampaign} 
        onClose={() => setSelectedCampaign(null)} 
        campaign={selectedCampaign} 
      />
    </div>
  )
}
