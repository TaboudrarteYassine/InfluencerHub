import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { Search, Loader2, RefreshCw, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'
import ScoreBadge from '@/components/admin/ScoreBadge'

export default function AdminTrust() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ search: '', page: 1 })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }))
    }, 500)
    return () => clearTimeout(handler)
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-trust', filters],
    queryFn: () => adminApi.trustScores(filters),
    select: (res) => res.data.data
  })

  const bulkMutation = useMutation({
    mutationFn: () => adminApi.bulkRecalculateTrust(),
    onSuccess: (res) => toast.success(res.data.message),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  })

  const handleAdjust = (id, currentScore) => {
    const score = prompt(`Enter new score (current: ${currentScore}):`, currentScore)
    if (score === null || score === String(currentScore)) return
    const reason = prompt("Reason for manual adjustment:")
    if (!reason) return toast.error("Reason is required")
    
    adminApi.adjustTrustScore(id, { score: parseInt(score), reason })
      .then(res => {
        toast.success(res.data.message)
        queryClient.invalidateQueries({ queryKey: ['admin-trust'] })
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed'))
  }

  const handleRecalculate = (id) => {
    adminApi.recalculateTrust(id)
      .then(res => {
        toast.success(res.data.message)
        queryClient.invalidateQueries({ queryKey: ['admin-trust'] })
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed'))
  }

  const influencers = data?.data || []
  const meta = data || {}

  const columns = [
    {
      header: 'Influencer',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0 border border-[#2a2a2a]">
            {row.user?.avatar ? (
              <img src={row.user.avatar} className="w-full h-full object-cover" />
            ) : (
              row.user?.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="min-w-0">
            <div className="text-white font-medium truncate">{row.user?.name || 'Unknown'}</div>
            <div className="text-xs text-slate-500 truncate">{row.user?.email || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Total Score',
      cell: (row) => <ScoreBadge score={row.trust_score} />
    },
    {
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleRecalculate(row.id)}
            className="p-1.5 bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Recalculate Score"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAdjust(row.id, row.trust_score)}
            className="p-1.5 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 rounded-lg transition-colors"
            title="Manual Adjustment"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Trust Scores" 
        subtitle="Manage and monitor influencer trust ratings."
        action={
          <button
            onClick={() => bulkMutation.mutate()}
            disabled={bulkMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-[0_0_15px_var(--tw-shadow-color)] shadow-violet-500/20 disabled:opacity-50"
          >
            {bulkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Bulk Recalculate
          </button>
        }
      />

      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by influencer name..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={influencers}
        isLoading={isLoading}
        emptyMessage="No influencers found."
      />
      
      {meta?.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400 mt-4 px-2">
          <span>Showing page {meta.current_page} of {meta.last_page}</span>
          <div className="flex gap-2">
            <button 
              disabled={meta.current_page === 1}
              onClick={() => setFilters({...filters, page: filters.page - 1})}
              className="px-3 py-1.5 bg-[#111111] border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={meta.current_page === meta.last_page}
              onClick={() => setFilters({...filters, page: filters.page + 1})}
              className="px-3 py-1.5 bg-[#111111] border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
