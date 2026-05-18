import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { Search, Shield, Ban, CheckCircle, XCircle, MoreVertical, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import PageHeader from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'
import StatusBadge from '@/components/admin/StatusBadge'
import ScoreBadge from '@/components/admin/ScoreBadge'

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ role: 'all', status: 'all', search: '', page: 1 })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }))
    }, 500)
    return () => clearTimeout(handler)
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => adminApi.users(filters),
    select: (res) => res.data.data
  })

  const actionMutation = useMutation({
    mutationFn: ({ action, id }) => adminApi[action](id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(res.data.message || 'Action successful')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed')
    }
  })

  const handleAction = (action, id) => {
    if (confirm(`Are you sure you want to perform this action?`)) {
      actionMutation.mutate({ action, id })
    }
  }

  const users = data?.data ?? []
  const meta = data ?? {}

  const ActionMenu = ({ user }) => (
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
          {user.status !== 'banned' && (
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleAction('banUser', user.id)} className={`${active ? 'bg-red-500/10 text-red-400' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}>
                  <Ban className="w-4 h-4" /> Ban User
                </button>
              )}
            </Menu.Item>
          )}
          {user.status !== 'suspended' && user.status !== 'banned' && (
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleAction('suspendUser', user.id)} className={`${active ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}>
                  <ShieldAlert className="w-4 h-4" /> Suspend
                </button>
              )}
            </Menu.Item>
          )}
          {user.status !== 'active' && (
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleAction('unbanUser', user.id)} className={`${active ? 'bg-green-500/10 text-green-400' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}>
                  <CheckCircle className="w-4 h-4" /> Reactivate
                </button>
              )}
            </Menu.Item>
          )}
          {user.role === 'influencer' && user.influencer_profile && !user.influencer_profile.is_verified && (
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleAction('verifyInfluencer', user.id)} className={`${active ? 'bg-violet-500/10 text-violet-400' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm border-t border-[#1f1f1f] mt-1 pt-2 transition-colors`}>
                  <CheckCircle className="w-4 h-4" /> Verify Influencer
                </button>
              )}
            </Menu.Item>
          )}
          {user.role === 'influencer' && user.influencer_profile && user.influencer_profile.is_verified && (
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleAction('rejectVerification', user.id)} className={`${active ? 'bg-[#1a1a1a] text-slate-300' : 'text-slate-400'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm border-t border-[#1f1f1f] mt-1 pt-2 transition-colors`}>
                  <XCircle className="w-4 h-4" /> Revoke Verification
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
      header: 'User',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0 border border-[#2a2a2a]">
            {row.avatar ? <img src={row.avatar} className="w-full h-full object-cover" /> : row.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-white font-medium flex items-center gap-2 truncate">
              {row.name}
              {row.role === 'influencer' && row.influencer_profile?.is_verified && (
                <Shield className="w-3.5 h-3.5 text-violet-500 fill-violet-500/20" />
              )}
            </div>
            <div className="text-xs text-slate-500 truncate">{row.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Role', cell: (row) => <StatusBadge status={row.role} /> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Trust Score', 
      cell: (row) => row.role === 'influencer' ? <ScoreBadge score={row.influencer_profile?.trust_score || 0} /> : <span className="text-slate-500 text-xs">—</span>
    },
    { header: 'Joined', cell: (row) => <span className="text-xs text-slate-400">{new Date(row.created_at).toLocaleDateString()}</span> },
    { 
      header: '', 
      cell: (row) => row.role !== 'admin' ? <div className="text-right"><ActionMenu user={row} /></div> : null
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        subtitle="View and manage all platform users, their roles, and statuses."
      />

      {/* Filters */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600"
          />
        </div>
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all min-w-[140px]"
        >
          <option value="all">All Roles</option>
          <option value="influencer">Influencers</option>
          <option value="client">Clients</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all min-w-[140px]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <DataTable 
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="No users found matching your criteria."
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
