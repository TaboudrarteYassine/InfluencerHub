import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import PageHeader from '@/components/admin/PageHeader'
import SectionCard from '@/components/admin/SectionCard'
import StatCard from '@/components/admin/StatCard'
import DataTable from '@/components/admin/DataTable'
import { Flag, AlertTriangle, CheckCircle, XCircle, MoreVertical, Eye, FileText, Ban } from 'lucide-react'
import { Menu } from '@headlessui/react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminReports() {
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', status, page],
    queryFn: () => adminApi.reports({ status, page, per_page: 15 }),
    select: res => res.data.data
  })

  // Since we don't have a direct dashboard stats for just reports, we'll use a summary if available, 
  // or just skip it if it's not present. The user asked for stats, so we'll approximate based on the current page data.
  // Ideally, these would come from an endpoint.

  const invalidate = () => queryClient.invalidateQueries(['admin-reports'])

  const warnMutation = useMutation({ mutationFn: (id) => adminApi.warnReport(id), onSuccess: () => { toast.success('User warned'); invalidate(); } })
  const suspendMutation = useMutation({ mutationFn: (id) => adminApi.suspendUser(id), onSuccess: () => { toast.success('User suspended'); invalidate(); } })
  const banMutation = useMutation({ mutationFn: (id) => adminApi.banUser(id), onSuccess: () => { toast.success('User banned'); invalidate(); } })
  const dismissMutation = useMutation({ mutationFn: (id) => adminApi.dismissReport(id), onSuccess: () => { toast.success('Report dismissed'); invalidate(); } })
  const resolveMutation = useMutation({ mutationFn: (id) => adminApi.resolveReport(id), onSuccess: () => { toast.success('Report resolved'); invalidate(); } })

  const getStatusColor = (s) => {
    const map = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      reviewed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
      dismissed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    }
    return map[s] || 'bg-slate-500/10 text-slate-400'
  }

  const columns = [
    { header: 'ID', accessor: 'id' },
    { 
      header: 'Reporter',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
            {row.reporter?.avatar ? <img src={row.reporter.avatar} className="w-full h-full object-cover" /> : row.reporter?.name?.charAt(0)}
          </div>
          <span className="truncate">{row.reporter?.name}</span>
        </div>
      )
    },
    { 
      header: 'Reported User',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
            {row.reported_user?.avatar ? <img src={row.reported_user.avatar} className="w-full h-full object-cover" /> : row.reported_user?.name?.charAt(0)}
          </div>
          <span className="truncate">{row.reported_user?.name}</span>
        </div>
      )
    },
    { header: 'Reason', accessor: 'reason' },
    { 
      header: 'Status', 
      accessor: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    { header: 'Date', accessor: (row) => format(new Date(row.created_at), 'MMM d, yyyy') },
    {
      header: 'Actions',
      accessor: (row) => (
        <Menu as="div" className="relative">
          <Menu.Button className="p-1.5 hover:bg-[#2a2a2a] rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-1 w-48 bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl shadow-xl z-50 overflow-hidden outline-none">
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => alert(`Details: \n\n${row.description}`)} className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${active ? 'bg-violet-500/10 text-violet-400' : 'text-slate-300'}`}>
                  <Eye className="w-4 h-4" /> View Details
                </button>
              )}
            </Menu.Item>
            <div className="border-t border-[#2a2a2a]"></div>
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => warnMutation.mutate(row.id)} className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${active ? 'bg-yellow-500/10 text-yellow-400' : 'text-slate-300'}`}>
                  <AlertTriangle className="w-4 h-4" /> Warn User
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => resolveMutation.mutate(row.id)} className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${active ? 'bg-green-500/10 text-green-400' : 'text-slate-300'}`}>
                  <CheckCircle className="w-4 h-4" /> Resolve Report
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => dismissMutation.mutate(row.id)} className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${active ? 'bg-slate-500/10 text-slate-300' : 'text-slate-300'}`}>
                  <XCircle className="w-4 h-4" /> Dismiss Report
                </button>
              )}
            </Menu.Item>
            <div className="border-t border-[#2a2a2a]"></div>
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => suspendMutation.mutate(row.reported_id)} className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${active ? 'bg-orange-500/10 text-orange-400' : 'text-orange-400'}`}>
                  <Ban className="w-4 h-4" /> Suspend User
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => { if(window.confirm('Ban user permanently?')) banMutation.mutate(row.reported_id) }} className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${active ? 'bg-red-500/10 text-red-400' : 'text-red-400'}`}>
                  <Flag className="w-4 h-4" /> Ban User
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports & Moderation" 
        subtitle="Manage user reports, take moderation actions, and ensure platform safety."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={data?.total || 0} icon={FileText} colorClass="text-violet-400 bg-violet-500/10" />
        <StatCard title="Pending" value={data?.data?.filter(r => r.status === 'pending').length || 0} icon={AlertTriangle} colorClass="text-amber-400 bg-amber-500/10" />
        <StatCard title="Resolved" value={data?.data?.filter(r => r.status === 'resolved').length || 0} icon={CheckCircle} colorClass="text-green-400 bg-green-500/10" />
        <StatCard title="Dismissed" value={data?.data?.filter(r => r.status === 'dismissed').length || 0} icon={XCircle} colorClass="text-slate-400 bg-slate-500/10" />
      </div>

      <SectionCard title="Report History">
        <div className="flex bg-[#111111] p-1 rounded-xl border border-[#2a2a2a] w-fit mb-4">
          {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map(t => (
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

        <DataTable 
          columns={columns} 
          data={data?.data || []} 
          isLoading={isLoading} 
          emptyMessage="No reports found matching this filter."
        />

        {data?.last_page > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-sm text-slate-400 disabled:opacity-50 hover:bg-[#1a1a1a]">Previous</button>
            <span className="text-sm text-slate-500">Page {page} of {data.last_page}</span>
            <button disabled={page === data.last_page} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-sm text-slate-400 disabled:opacity-50 hover:bg-[#1a1a1a]">Next</button>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
