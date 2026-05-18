import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { Shield, ShieldAlert, LogOut, Loader2, Ban, CheckCircle, Activity, Lock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import PageHeader from '@/components/admin/PageHeader'
import StatCard from '@/components/admin/StatCard'
import SectionCard from '@/components/admin/SectionCard'
import DataTable from '@/components/admin/DataTable'

export default function AdminSecurity() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('active_sessions')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-security'],
    queryFn: () => adminApi.securityStats(),
    select: res => res.data.data
  })

  const actionMutation = useMutation({
    mutationFn: ({ action, data, id }) => id ? adminApi[action](id) : adminApi[action](data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-security'] })
      toast.success(res.data.message || 'Success')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  })

  const handleBlockIp = () => {
    const ip = prompt("Enter IP Address to block:")
    if (!ip) return
    const reason = prompt("Reason for blocking:")
    if (!reason) return
    actionMutation.mutate({ action: 'blockIp', data: { ip, reason } })
  }

  const handleWhitelistIp = (ip) => {
    if (confirm(`Whitelist IP ${ip}?`)) {
      actionMutation.mutate({ action: 'whitelistIp', data: { ip } })
    }
  }

  const handleForceLogout = (id) => {
    if (confirm("Force logout this user?")) {
      actionMutation.mutate({ action: 'forceLogoutUser', id })
    }
  }

  const handleForceLogoutAll = () => {
    if (confirm("WARNING: Force logout ALL users across the entire platform?")) {
      actionMutation.mutate({ action: 'forceLogoutAll' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  const tabs = [
    { id: 'active_sessions', label: 'Active Sessions', count: stats?.active_sessions?.length || 0 },
    { id: 'failed_logins', label: 'Failed Logins', count: stats?.failed_logins?.length || 0 },
    { id: 'blocked_ips', label: 'Blocked IPs', count: stats?.blocked_ips?.length || 0 },
  ]

  const activeSessionsColumns = [
    {
      header: 'User',
      cell: (row) => (
        <div>
          <div className="font-medium text-white">{row.tokenable?.name || 'Unknown User'}</div>
          <div className="text-xs text-slate-500 capitalize">{row.tokenable?.role || 'Unknown Role'}</div>
        </div>
      )
    },
    {
      header: 'Last Active',
      cell: (row) => (
        <span className="font-mono text-slate-400 text-sm">
          {format(new Date(row.last_used_at || row.created_at), 'MMM d, yyyy HH:mm:ss')}
        </span>
      )
    },
    {
      header: '',
      cell: (row) => (
        <div className="text-right">
          <button 
            onClick={() => handleForceLogout(row.tokenable_id)} 
            className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors inline-flex items-center gap-1.5 font-medium border border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" /> Force Logout
          </button>
        </div>
      )
    }
  ]

  const failedLoginsColumns = [
    {
      header: 'IP Address',
      cell: (row) => <span className="font-mono text-white tracking-wide">{row.ip_address}</span>
    },
    {
      header: 'Attempt Info',
      cell: (row) => <span className="text-slate-400 text-sm">Email: {row.description}</span>
    },
    {
      header: 'Timestamp',
      cell: (row) => (
        <span className="font-mono text-slate-400 text-sm">
          {format(new Date(row.created_at), 'MMM d, yyyy HH:mm:ss')}
        </span>
      )
    }
  ]

  const blockedIpsColumns = [
    {
      header: 'IP Address',
      cell: (row) => <span className="font-mono text-red-400 font-medium tracking-wide">{row.ip_address}</span>
    },
    {
      header: 'Reason',
      cell: (row) => <span className="text-slate-400 text-sm">{row.reason}</span>
    },
    {
      header: '',
      cell: (row) => (
        <div className="text-right">
          <button 
            onClick={() => handleWhitelistIp(row.ip_address)} 
            className="text-xs bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors inline-flex items-center gap-1.5 font-medium border border-green-500/20"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Whitelist
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Security Monitoring" 
        subtitle="Manage active sessions, monitor failed logins, and block suspicious IPs."
        action={
          <button
            onClick={handleForceLogoutAll}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-[0_0_15px_var(--tw-shadow-color)] shadow-red-500/10"
          >
            <ShieldAlert className="w-4 h-4" /> Force Logout All Users
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Active Sessions" 
          value={stats?.active_sessions?.length || 0} 
          icon={Activity} 
          colorClass="text-green-400 bg-green-500/10" 
        />
        <StatCard 
          title="Failed Logins (24h)" 
          value={stats?.failed_logins?.length || 0} 
          icon={AlertTriangle} 
          colorClass="text-amber-400 bg-amber-500/10" 
        />
        <StatCard 
          title="Blocked IPs" 
          value={stats?.blocked_ips?.length || 0} 
          icon={Ban} 
          colorClass="text-red-400 bg-red-500/10" 
        />
      </div>

      <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-6 px-6 border-b border-[#1f1f1f] bg-[#151515] overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'border-violet-500 text-violet-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-[#2a2a2a]'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                activeTab === tab.id ? 'bg-violet-500/20' : 'bg-[#2a2a2a]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
          <div className="flex-1"></div>
          {activeTab === 'blocked_ips' && (
            <button 
              onClick={handleBlockIp} 
              className="text-sm bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] text-slate-300 px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2 shrink-0"
            >
              <Ban className="w-4 h-4 text-red-400" /> Add IP Block
            </button>
          )}
        </div>
        
        <div className="p-0 border-none bg-transparent">
          {activeTab === 'active_sessions' && (
            <DataTable 
              columns={activeSessionsColumns} 
              data={stats?.active_sessions || []} 
              emptyMessage="No active user sessions found." 
            />
          )}
          {activeTab === 'failed_logins' && (
            <DataTable 
              columns={failedLoginsColumns} 
              data={stats?.failed_logins || []} 
              emptyMessage="No failed logins recorded in the last 24 hours." 
            />
          )}
          {activeTab === 'blocked_ips' && (
            <DataTable 
              columns={blockedIpsColumns} 
              data={stats?.blocked_ips || []} 
              emptyMessage="No IPs are currently blocked." 
            />
          )}
        </div>
      </div>
    </div>
  )
}
