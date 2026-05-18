import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { campaignApi } from '@/services/api'
import { motion } from 'framer-motion'
import { Plus, Zap, Eye, Trash2, BarChart2 } from 'lucide-react'
import { useState } from 'react'

const STATUS_TABS = ['all', 'draft', 'published', 'active', 'completed', 'cancelled']

export default function ClientCampaigns() {
  const [status, setStatus] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['my-campaigns', status],
    queryFn:  () => campaignApi.myCampaigns({ status: status === 'all' ? '' : status }),
    select:   (res) => res.data.data,
  })

  const campaigns = data?.data || []

  const statusColor = {
    draft: 'badge badge-pending', published: 'badge badge-active',
    active: 'badge badge-active', completed: 'badge badge-completed',
    cancelled: 'badge badge-cancelled', negotiating: 'badge badge-negotiating',
    agreed: 'badge badge-negotiating',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">My Campaigns</h1>
          <p className="text-slate-500 text-sm">{data?.total || 0} total campaigns</p>
        </div>
        <Link to="/campaigns/create"
          className="btn-glow px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
          <span className="relative z-10 flex items-center gap-2">
            <Plus className="w-4 h-4" />New Campaign
          </span>
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize flex-shrink-0 transition-all ${
              status === s ? 'bg-brand-600 text-white' : 'glass border border-white/8 text-slate-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            {[1,2,3].map((i) => (
              <div key={i} className="flex gap-4 mb-4">
                <div className="skeleton h-12 flex-1 rounded-xl" />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-16 text-center">
            <BarChart2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 font-medium mb-2">No campaigns found</p>
            <p className="text-slate-600 text-sm mb-6">Create your first campaign to start finding creators</p>
            <Link to="/campaigns/create" className="btn-glow px-6 py-3 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2">
              <span className="relative z-10 flex items-center gap-2"><Plus className="w-4 h-4" />Create Campaign</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">
              <div className="col-span-5">Campaign</div>
              <div className="col-span-2">Budget</div>
              <div className="col-span-2">Deadline</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Actions</div>
            </div>

            {campaigns.map((camp) => (
              <motion.div key={camp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/3 transition-all items-center"
              >
                <div className="col-span-5 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{camp.title}</p>
                  <div className="flex gap-1 mt-1">
                    {(camp.platforms || []).slice(0, 2).map((p) => (
                      <span key={p} className="glass border border-white/8 text-slate-500 text-xs px-1.5 py-0.5 rounded capitalize">{p}</span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 text-slate-400 text-sm">
                  {camp.budget_min
                    ? `${Number(camp.budget_min).toLocaleString()}–${Number(camp.budget_max).toLocaleString()}`
                    : '—'}
                </div>
                <div className="col-span-2 text-slate-400 text-sm">
                  {camp.deadline ? new Date(camp.deadline).toLocaleDateString('en-GB') : '—'}
                </div>
                <div className="col-span-2">
                  <span className={statusColor[camp.status] || 'badge'}>{camp.status}</span>
                </div>
                <div className="col-span-1 flex gap-2">
                  <Link to={`/campaigns/${camp.id}/matches`}
                    className="p-1.5 text-slate-500 hover:text-brand-400 transition-colors" title="AI Matches">
                    <Zap className="w-4 h-4" />
                  </Link>
                  <Link to={`/campaigns/${camp.id}`}
                    className="p-1.5 text-slate-500 hover:text-white transition-colors" title="View">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
