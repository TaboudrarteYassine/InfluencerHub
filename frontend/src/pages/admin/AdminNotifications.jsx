import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import PageHeader from '@/components/admin/PageHeader'
import SectionCard from '@/components/admin/SectionCard'
import DataTable from '@/components/admin/DataTable'

export default function AdminNotifications() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [formData, setFormData] = useState({ target: 'all', title: '', body: '', link: '', user_id: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', page],
    queryFn: () => adminApi.notifications({ page }),
    select: res => res.data.data
  })

  const sendMutation = useMutation({
    mutationFn: (data) => adminApi.sendNotification(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      toast.success(res.data.message)
      setFormData({ target: 'all', title: '', body: '', link: '', user_id: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.body) return toast.error("Title and body are required")
    if (formData.target === 'specific_user' && !formData.user_id) return toast.error("User ID is required")
    sendMutation.mutate(formData)
  }

  const logs = data?.data || []
  const meta = data || {}

  const columns = [
    {
      header: 'Message',
      cell: (row) => {
        const d = JSON.parse(row.data || '{}')
        return (
          <div>
            <div className="text-white font-medium mb-1 truncate">{d.title}</div>
            <div className="text-xs text-slate-500 truncate">{d.body}</div>
          </div>
        )
      }
    },
    {
      header: 'Target',
      cell: (row) => {
        const d = JSON.parse(row.data || '{}')
        return (
          <div>
            <span className="px-2 py-1 rounded-md bg-[#2a2a2a] text-slate-300 text-xs font-medium capitalize border border-[#3a3a3a]">{d.target}</span>
            <div className="text-xs text-slate-500 mt-1.5">{d.delivery_count || 0} recipients</div>
          </div>
        )
      }
    },
    {
      header: 'Sent Date',
      cell: (row) => (
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {format(new Date(row.created_at), 'MMM d, yyyy HH:mm')}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Notification Broadcast" 
        subtitle="Compose and send platform-wide announcements and targeted alerts."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SectionCard title="Compose Message" description="Target specific user groups or individuals.">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Target Audience</label>
                <select 
                  value={formData.target} 
                  onChange={e => setFormData({...formData, target: e.target.value})} 
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                >
                  <option value="all">All Users</option>
                  <option value="influencers">All Influencers</option>
                  <option value="clients">All Clients</option>
                  <option value="specific_user">Specific User ID</option>
                </select>
              </div>
              
              {formData.target === 'specific_user' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400">User ID</label>
                  <input 
                    type="text" 
                    value={formData.user_id} 
                    onChange={e => setFormData({...formData, user_id: e.target.value})} 
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600" 
                    placeholder="e.g. 123" 
                  />
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600" 
                  placeholder="Announcement Title" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Message Body</label>
                <textarea 
                  rows={4} 
                  value={formData.body} 
                  onChange={e => setFormData({...formData, body: e.target.value})} 
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600 resize-none" 
                  placeholder="Write your message here..."
                ></textarea>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Optional Action Link</label>
                <input 
                  type="text" 
                  value={formData.link} 
                  onChange={e => setFormData({...formData, link: e.target.value})} 
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600 font-mono text-xs" 
                  placeholder="https://..." 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={sendMutation.isPending} 
                className="w-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all shadow-[0_0_15px_var(--tw-shadow-color)] shadow-violet-500/20 disabled:opacity-50 mt-2"
              >
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Broadcast
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Broadcast History" description="Previously sent notifications and delivery stats.">
            <DataTable 
              columns={columns} 
              data={logs} 
              isLoading={isLoading} 
              emptyMessage="No broadcast history found." 
            />
            {meta?.last_page > 1 && (
              <div className="flex items-center justify-between text-sm text-slate-400 mt-4">
                <span>Page {meta.current_page} of {meta.last_page}</span>
                <div className="flex gap-2">
                  <button 
                    disabled={meta.current_page === 1} 
                    onClick={() => setPage(page - 1)} 
                    className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={meta.current_page === meta.last_page} 
                    onClick={() => setPage(page + 1)} 
                    className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
