import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/services/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Users, Eye, MousePointerClick, DollarSign, Award, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => analyticsApi.myStats().then(res => res.data.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (!stats) return null

  const chartData = stats.monthly_performance ? Object.entries(stats.monthly_performance).map(([month, data]) => ({
    name: month,
    ...data
  })) : []

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl text-white mb-2">Performance Analytics</h1>
        <p className="text-slate-400">Track your growth, engagement, and campaign earnings.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-500/20 rounded-lg"><Users className="w-5 h-5 text-brand-400" /></div>
            <p className="text-slate-400 text-sm font-medium">Total Reach</p>
          </div>
          <p className="text-3xl font-bold text-white">{Number(stats.total_reach).toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg"><Eye className="w-5 h-5 text-blue-400" /></div>
            <p className="text-slate-400 text-sm font-medium">Impressions</p>
          </div>
          <p className="text-3xl font-bold text-white">{Number(stats.total_impressions).toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-400" /></div>
            <p className="text-slate-400 text-sm font-medium">Avg Engagement</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.average_engagement_rate}%</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass p-6 rounded-2xl border border-brand-500/30 bg-brand-500/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-500/20 rounded-lg"><DollarSign className="w-5 h-5 text-brand-400" /></div>
            <p className="text-brand-300 text-sm font-medium">Lifetime Earnings</p>
          </div>
          <p className="text-3xl font-bold text-brand-400">MAD {Number(stats.total_earnings).toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6">Reach & Impressions Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="reach" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6">Engagement Rate by Month</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="engagement_rate" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Best Campaign Spotlight */}
      {stats.best_campaign && (
        <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-br from-[#111] to-brand-900/20 p-8">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Award className="w-48 h-48 text-brand-400" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-sm font-semibold mb-4">
              <Award className="w-4 h-4" /> Top Performing Campaign
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{stats.best_campaign.campaign?.title}</h2>
            <p className="text-slate-400 mb-6">Client: {stats.best_campaign.collaboration_request?.client?.name}</p>
            
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-slate-500 mb-1">Engagement</p>
                <p className="text-xl font-bold text-white">{stats.best_campaign.engagement_rate}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Reach</p>
                <p className="text-xl font-bold text-white">{Number(stats.best_campaign.reach).toLocaleString()}</p>
              </div>
              {stats.best_campaign.roi_estimate && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Est. Value Created</p>
                  <p className="text-xl font-bold text-green-400">MAD {Number(stats.best_campaign.roi_estimate).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
