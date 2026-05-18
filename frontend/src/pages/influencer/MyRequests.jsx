import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { influencerApi } from '@/services/api'
import { motion } from 'framer-motion'
import { Inbox, Zap, Search, Calendar, DollarSign, ExternalLink, MessageCircle, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import NegotiationPanel from '@/components/NegotiationPanel'
import SubmitAnalyticsModal from '@/components/modals/SubmitAnalyticsModal'

export default function MyRequests() {
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [activeAnalyticsCollab, setActiveAnalyticsCollab] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-requests', status, page],
    queryFn: () => influencerApi.myRequests({ status, page, per_page: 15 }),
    select: (res) => res.data.data
  })

  const getStatusBadge = (s) => {
    const map = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      negotiating: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      accepted: 'bg-green-500/10 text-green-500 border-green-500/20',
      active: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
      completed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    }
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${map[s] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{s}</span>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Requests</h1>
          <p className="text-slate-400 text-sm">Manage your collaboration requests and active campaigns.</p>
        </div>
        <div className="flex bg-[#111111] p-1 rounded-xl border border-[#2a2a2a]">
          {['all', 'pending', 'active', 'completed'].map(t => (
            <button
              key={t}
              onClick={() => { setStatus(t); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                status === t ? 'bg-[#2a2a2a] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
        ) : data?.data?.length > 0 ? (
          <div className="divide-y divide-[#2a2a2a]">
            {data.data.map(req => (
              <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center hover:bg-white/5 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {req.campaign?.client_profile?.user?.avatar ? (
                    <img src={req.campaign.client_profile.user.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <BriefcasePlaceholder />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium truncate">{req.campaign?.title}</h3>
                    {getStatusBadge(req.status)}
                  </div>
                  <p className="text-slate-400 text-sm truncate mb-2">{req.campaign?.client_profile?.company_name}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {Number(req.agreed_amount || req.campaign?.budget_min || 0).toLocaleString()} MAD</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link to={`/campaigns/${req.campaign_id}`} className="flex-1 sm:flex-none px-4 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white rounded-lg text-sm font-medium transition-colors text-center border border-[#333]">
                    View Details
                  </Link>
                  {req.status === 'completed' && (
                    <button
                      onClick={() => setActiveAnalyticsCollab(req)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 rounded-lg text-sm font-medium transition-colors text-center border border-brand-500/30 flex items-center justify-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" /> Report
                    </button>
                  )}
                </div>
                {req.status !== 'rejected' && (
                  <div className="w-full mt-4">
                    <NegotiationPanel request={req} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12">
            <div className="w-16 h-16 bg-[#1f1f1f] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#2a2a2a]">
              <Inbox className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-white font-medium mb-1">No requests found</h3>
            <p className="text-slate-500 text-sm">You don't have any collaboration requests matching this filter.</p>
          </div>
        )}

        {data?.last_page > 1 && (
          <div className="p-4 border-t border-[#2a2a2a] flex items-center justify-between bg-[#0a0a0a]">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-sm text-slate-400 disabled:opacity-50">Previous</button>
            <span className="text-sm text-slate-500">Page {page} of {data.last_page}</span>
            <button disabled={page === data.last_page} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-sm text-slate-400 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      <SubmitAnalyticsModal 
        isOpen={!!activeAnalyticsCollab} 
        onClose={() => setActiveAnalyticsCollab(null)} 
        collaboration={activeAnalyticsCollab} 
      />
    </div>
  )
}

function BriefcasePlaceholder() {
  return <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
}
