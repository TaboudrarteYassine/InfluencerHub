import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { Search, Loader2, Download } from 'lucide-react'
import { format } from 'date-fns'
import PageHeader from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'

export default function AdminActivity() {
  const [filters, setFilters] = useState({ admin_name: '', action: 'all', page: 1 })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, admin_name: debouncedSearch, page: 1 }))
    }, 500)
    return () => clearTimeout(handler)
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity', filters],
    queryFn: () => adminApi.activityLogs(filters),
    select: (res) => res.data.data
  })

  const logs = data?.data || []
  const meta = data || {}

  const handleExport = () => {
    if (!logs.length) return
    const headers = ['Admin', 'Action', 'Target', 'Target ID', 'Details', 'IP Address', 'Date']
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        `"${log.user?.name || 'System'}"`,
        `"${log.action}"`,
        `"${log.target_type}"`,
        log.target_id,
        `"${(log.description || '').replace(/"/g, '""')}"`,
        `"${log.ip_address || ''}"`,
        `"${new Date(log.created_at).toISOString()}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `activity_log_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      header: 'Admin',
      cell: (row) => <span className="text-white font-medium">{row.user?.name || 'System'}</span>
    },
    {
      header: 'Action',
      cell: (row) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#1f1f1f] text-slate-300 border border-[#2a2a2a]">
          {row.action}
        </span>
      )
    },
    {
      header: 'Target',
      cell: (row) => <span className="text-slate-400 text-sm">{row.target_type} <span className="text-violet-400 font-mono">#{row.target_id}</span></span>
    },
    {
      header: 'Details',
      cell: (row) => <div className="text-xs text-slate-400 max-w-xs truncate" title={row.description}>{row.description || '-'}</div>
    },
    {
      header: 'IP Address',
      cell: (row) => <span className="text-xs font-mono text-slate-500">{row.ip_address || '-'}</span>
    },
    {
      header: 'Date',
      cell: (row) => (
        <span className="text-right text-xs text-slate-500 whitespace-nowrap block">
          {format(new Date(row.created_at), 'MMM d, yyyy HH:mm:ss')}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Activity Log" 
        subtitle="Immutable audit trail of all administrative and system actions."
        action={
          <button
            onClick={handleExport}
            className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 border border-[#2a2a2a] px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by admin name..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600"
          />
        </div>
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all min-w-[180px]"
        >
          <option value="all">All Actions</option>
          <option value="ban_user">Ban User</option>
          <option value="suspend_user">Suspend User</option>
          <option value="verify_influencer">Verify Influencer</option>
          <option value="force_cancel_campaign">Cancel Campaign</option>
          <option value="flag_campaign_suspicious">Flag Campaign</option>
          <option value="hide_review">Hide Review</option>
          <option value="delete_review">Delete Review</option>
          <option value="flag_fake_review">Flag Fake Review</option>
          <option value="adjust_trust_score">Adjust Trust Score</option>
          <option value="approve_kyc">Approve KYC</option>
          <option value="reject_kyc">Reject KYC</option>
        </select>
        <input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
          title="Filter from date"
        />
      </div>

      <DataTable 
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyMessage="No activity logs found."
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
