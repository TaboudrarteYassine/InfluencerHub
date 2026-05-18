import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/services/api'
import { motion } from 'framer-motion'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationApi.list({ per_page: 30 }),
    select:   (res) => res.data.data,
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAll(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      toast.success('All notifications marked as read')
    },
  })

  const notifications = data?.data || []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Notifications</h1>
          <p className="text-slate-500 text-sm">{notifications.filter((n) => !n.is_read).length} unread</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button onClick={() => markAllMutation.mutate()}
            className="glass border border-white/8 px-3 py-2 rounded-xl text-slate-400 hover:text-white text-sm transition-all flex items-center gap-2">
            <CheckCheck className="w-4 h-4" />Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass border border-white/5 rounded-2xl p-16 text-center">
          <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No notifications yet</p>
          <p className="text-slate-600 text-sm mt-1">We'll notify you about new messages, requests, and updates</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <motion.div key={notif.id}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className={`glass border rounded-2xl p-4 transition-all ${
                !notif.is_read ? 'border-brand-500/20 bg-brand-600/5' : 'border-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  !notif.is_read ? 'bg-brand-600/20 text-brand-400' : 'bg-white/5 text-slate-500'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold mb-0.5 ${!notif.is_read ? 'text-white' : 'text-slate-300'}`}>
                    {notif.title}
                  </p>
                  {notif.body && <p className="text-slate-500 text-xs leading-relaxed">{notif.body}</p>}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-slate-600 text-xs">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                  {!notif.is_read && <div className="w-2 h-2 bg-brand-400 rounded-full ml-auto mt-1" />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
