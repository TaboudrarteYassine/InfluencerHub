import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { Loader2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import PageHeader from '@/components/admin/PageHeader'
import SectionCard from '@/components/admin/SectionCard'

const COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#14b8a6', '#f59e0b']

export default function AdminAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminApi.analytics(),
    select: res => res.data.data
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  const customTooltipStyle = { 
    backgroundColor: '#111111', 
    borderColor: '#2a2a2a', 
    borderRadius: '0.5rem', 
    color: '#f8fafc' 
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Platform Analytics" 
        subtitle="Visual breakdown of platform growth, campaign engagement, and user activity."
      />

      <div className="grid grid-cols-1 gap-6">
        {/* User Growth (Full Width) */}
        <SectionCard 
          title="User Growth (Last 30 Days)" 
          description="Daily new user registrations across the platform."
        >
          <div style={{ width: '100%', minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.userGrowth ?? []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#8b5cf6' }} />
                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#0a0a0a', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Status (Half Width) */}
          <SectionCard 
            title="Campaign Status Distribution" 
            description="Current states of all platform campaigns."
          >
            <div style={{ width: '100%', minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.campaignStatus ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {(stats?.campaignStatus ?? []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Top Influencers (Half Width) */}
          <SectionCard 
            title="Top 10 Trusted Influencers" 
            description="Highest ranked users by Trust Score."
          >
            <div style={{ width: '100%', minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.topInfluencers ?? []} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#52525b" fontSize={12} domain={[0, 100]} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip cursor={{ fill: '#1f1f1f' }} contentStyle={customTooltipStyle} itemStyle={{ color: '#6366f1' }} />
                  <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Top Niches / New Campaigns Area Chart (Full Width) */}
        <SectionCard 
          title="Top Categories by Campaign Count" 
          description="Most popular niches based on active and completed campaigns."
        >
          <div style={{ width: '100%', minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats?.topCategories ?? []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#ec4899' }} />
                <Area type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

      </div>
    </div>
  )
}
