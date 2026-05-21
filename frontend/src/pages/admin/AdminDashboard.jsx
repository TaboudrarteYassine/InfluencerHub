import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { 
  Users, Target, ShieldCheck, Flag, CheckCircle, XCircle, Loader2
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import StatCard from '@/components/admin/StatCard'
import SectionCard from '@/components/admin/SectionCard'
import PageHeader from '@/components/admin/PageHeader'
import ScoreBadge from '@/components/admin/ScoreBadge'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard(),
    select: (res) => res.data.data
  })

  const { data: pendingUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-pending-users'],
    queryFn: () => adminApi.users({ role: 'influencer', per_page: 50 }),
    select: (res) => res.data.data.data.filter(u => !u.influencer_profile?.is_verified).slice(0, 5)
  })

  const verifyMutation = useMutation({
    mutationFn: (id) => adminApi.verifyInfluencer(id),
    onSuccess: () => {
      toast.success('Influencer verified')
      queryClient.invalidateQueries(['admin-pending-users'])
      queryClient.invalidateQueries(['admin-dashboard'])
    }
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => adminApi.rejectVerification(id),
    onSuccess: () => {
      toast.success('Verification rejected')
      queryClient.invalidateQueries(['admin-pending-users'])
      queryClient.invalidateQueries(['admin-dashboard'])
    }
  })

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  const chartData = stats?.user_growth?.labels?.map((label, index) => ({
    name: label,
    users: stats.user_growth.data[index]
  })) ?? []

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Platform Overview" 
        subtitle="Monitor key metrics, user growth, and pending tasks."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats?.total_users ?? 0} 
          icon={Users} 
          colorClass="text-violet-400 bg-violet-500/10" 
          trend={12} 
        />
        <StatCard 
          title="Active Campaigns" 
          value={stats?.campaigns?.active ?? 0} 
          icon={Target} 
          colorClass="text-blue-400 bg-blue-500/10" 
          trend={5} 
        />
        <StatCard 
          title="Pending Verification" 
          value={stats?.pending_verifications ?? 0} 
          icon={ShieldCheck} 
          colorClass="text-amber-400 bg-amber-500/10" 
        />
        <Link to="/admin/reports">
          <StatCard 
            title="Open Reports" 
            value={stats?.open_reports ?? 0} 
            icon={Flag} 
            colorClass="text-red-400 bg-red-500/10" 
            trend={-2} 
          />
        </Link>
      </div>

      <SectionCard title="User Growth (Last 30 Days)">
        <div style={{ width: '100%', minHeight: 300 }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#111111', borderColor: '#2a2a2a', borderRadius: '0.5rem', color: '#f8fafc' }}
                itemStyle={{ color: '#a78bfa' }}
              />
              <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#0a0a0a', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Pending Verification Queue">
          {usersLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>
          ) : pendingUsers?.length > 0 ? (
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-[#151515] border border-[#1f1f1f] hover:border-[#2a2a2a] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold overflow-hidden shrink-0">
                      {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{user.name}</p>
                      <p className="text-slate-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => verifyMutation.mutate(user.id)}
                      disabled={verifyMutation.isPending}
                      className="p-1.5 rounded-md text-green-400 hover:bg-green-500/10 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => rejectMutation.mutate(user.id)}
                      disabled={rejectMutation.isPending}
                      className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Reject"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No pending verifications.</div>
          )}
        </SectionCard>

        <SectionCard title="Top 5 Influencers">
          {stats?.top_influencers?.length > 0 ? (
            <div className="space-y-4">
              {stats.top_influencers.map((profile, i) => (
                <div key={profile.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#151515] border border-[#1f1f1f]">
                  <div className="w-6 h-6 rounded-md bg-[#1f1f1f] flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold overflow-hidden shrink-0">
                    {profile.user?.avatar ? <img src={profile.user.avatar} className="w-full h-full object-cover" /> : profile.user?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{profile.user?.name}</p>
                    <p className="text-slate-500 text-xs truncate">
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
                        return nichesArr.slice(0, 2).join(', ');
                      })()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <ScoreBadge score={profile.trust_score} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No data available.</div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
