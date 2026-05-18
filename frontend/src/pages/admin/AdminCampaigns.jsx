import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { Search, Loader2, XCircle, CheckCircle, Flag, MoreVertical, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import PageHeader from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'
import StatusBadge from '@/components/admin/StatusBadge'

export default function AdminCampaigns() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ status: 'all', platform: 'all', search: '', page: 1 })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }))
    }, 500)
    return () => clearTimeout(handler)
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-campaigns', filters],
    queryFn: () => adminApi.campaigns(filters),
    select: (res) => res.data.data
  })

  const actionMutation = useMutation({
    mutationFn: ({ action, id, data }) => adminApi[action](id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] })
      toast.success(res.data.message || 'Action successful')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed')
    }
  })

  const handleAction = (action, id) => {
    const reason = prompt("Please provide a reason for this action:")
    if (reason === null) return // cancelled
    if (reason.trim() === '') return toast.error("Reason is required")
    
    actionMutation.mutate({ action, id, data: { reason } })
  }

  const campaigns = data?.data ?? []
  const meta = data ?? {}

  const ActionMenu = ({ campaign }) => (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="p-1.5 rounded-lg hover:bg-[#2a2a2a] text-slate-400 hover:text-white transition-colors">
        <MoreVertical className="w-4 h-4" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-2xl focus:outline-none z-10 overflow-hidden p-1.5">
          <Menu.Item>
            {({ active }) => (
              <a href={`/campaigns/${campaign.id}`} target="_blank" rel="noreferrer" className={`${active ? 'bg-[#1a1a1a] text-white' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}>
                <ExternalLink className="w-4 h-4" /> View Details
              </a>
            )}
          </Menu.Item>
          {campaign.status !== 'cancelled' && (
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleAction('cancelCampaign', campaign.id)} className={`${active ? 'bg-red-500/10 text-red-400' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm border-t border-[#1f1f1f] mt-1 pt-2 transition-colors`}>
                  <XCircle className="w-4 h-4" /> Force Cancel
                </button>
              )}
            </Menu.Item>
          )}
          {campaign.status === 'active' && (
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleAction('completeCampaign', campaign.id)} className={`${active ? 'bg-green-500/10 text-green-400' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}>
                  <CheckCircle className="w-4 h-4" /> Mark Completed
                </button>
              )}
            </Menu.Item>
          )}
          {campaign.status !== 'suspended' && (
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleAction('flagCampaign', campaign.id)} className={`${active ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}>
                  <Flag className="w-4 h-4" /> Flag Suspicious
                </button>
              )}
            </Menu.Item>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )

  const columns = [
    {
      header: 'Campaign',
      cell: (row) => (
        <div className="min-w-0 max-w-[200px]">
          <div className="text-white font-medium truncate">{row.title}</div>
          <div className="text-xs text-slate-500 truncate mt-0.5">
            {row.category?.name || 'Uncategorized'}
          </div>
        </div>
      )
    },
    { 
      header: 'Client', 
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] shrink-0 border border-[#2a2a2a]">
            {row.client?.name?.charAt(0) || '?'}
          </div>
          <span className="truncate text-slate-300">{row.client?.name || 'Unknown'}</span>
        </div>
      )
    },
    { 
      header: 'Platform', 
      cell: (row) => <span className="text-slate-300 font-medium">{Array.isArray(row.platforms) ? row.platforms.join(', ') : 'N/A'}</span> 
    },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Budget', 
      cell: (row) => <span className="font-mono text-white tracking-tight">MAD {Number(row.budget_min || 0).toLocaleString()}</span> 
    },
    { 
      header: 'Date', 
      cell: (row) => <span className="text-xs text-slate-400">{new Date(row.created_at).toLocaleDateString()}</span> 
    },
    { 
      header: '', 
      cell: (row) => <div className="text-right"><ActionMenu campaign={row} /></div> 
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Campaign Management" 
        subtitle="Monitor and moderate client campaigns across the platform."
      />

      {/* Filters */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all min-w-[140px]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          value={filters.platform}
          onChange={(e) => setFilters({ ...filters, platform: e.target.value, page: 1 })}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all min-w-[140px]"
        >
          <option value="all">All Platforms</option>
          <option value="Instagram">Instagram</option>
          <option value="YouTube">YouTube</option>
          <option value="TikTok">TikTok</option>
        </select>
      </div>

      <DataTable 
        columns={columns}
        data={campaigns}
        isLoading={isLoading}
        emptyMessage="No campaigns found."
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
