import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { CreditCard, Search, Filter, RotateCcw, CheckCircle, Loader2, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPayments() {
  const [filterStatus, setFilterStatus] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', filterStatus],
    queryFn: () => adminApi.getTransactions({ status: filterStatus }).then(res => res.data.data.transactions),
  })

  const refundMutation = useMutation({
    mutationFn: (id) => adminApi.forceRefund(id),
    onSuccess: () => {
      toast.success('Transaction refunded.')
      queryClient.invalidateQueries(['admin-transactions'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Refund failed')
  })

  const releaseMutation = useMutation({
    mutationFn: (id) => adminApi.forceRelease(id),
    onSuccess: () => {
      toast.success('Transaction released.')
      queryClient.invalidateQueries(['admin-transactions'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Release failed')
  })

  const handleForceRefund = (id) => {
    if (window.confirm('Are you sure you want to FORCE REFUND this transaction back to the client?')) {
      refundMutation.mutate(id)
    }
  }

  const handleForceRelease = (id) => {
    if (window.confirm('Are you sure you want to FORCE RELEASE funds to the influencer?')) {
      releaseMutation.mutate(id)
    }
  }

  const transactions = data || []

  // Stats
  const totalCommissions = transactions.filter(t => t.status === 'released' || t.status === 'held').reduce((sum, t) => sum + Number(t.platform_commission), 0)
  const totalHeld = transactions.filter(t => t.status === 'held').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalReleased = transactions.filter(t => t.status === 'released').reduce((sum, t) => sum + Number(t.influencer_amount), 0)
  const totalRefunded = transactions.filter(t => t.status === 'refunded').reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">Payments & Escrow</h1>
        <p className="text-slate-400 text-sm">Manage platform transactions, escrows, and commissions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-white/5">
          <p className="text-slate-500 text-sm mb-1">Total Commissions</p>
          <p className="text-2xl font-bold text-brand-400">MAD {totalCommissions.toLocaleString()}</p>
        </div>
        <div className="glass p-5 rounded-2xl border border-white/5">
          <p className="text-slate-500 text-sm mb-1">Held in Escrow</p>
          <p className="text-2xl font-bold text-white">MAD {totalHeld.toLocaleString()}</p>
        </div>
        <div className="glass p-5 rounded-2xl border border-white/5">
          <p className="text-slate-500 text-sm mb-1">Total Released</p>
          <p className="text-2xl font-bold text-green-400">MAD {totalReleased.toLocaleString()}</p>
        </div>
        <div className="glass p-5 rounded-2xl border border-white/5">
          <p className="text-slate-500 text-sm mb-1">Total Refunded</p>
          <p className="text-2xl font-bold text-slate-400">MAD {totalRefunded.toLocaleString()}</p>
        </div>
      </div>

      <div className="glass border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#111] border border-white/10 rounded-lg text-sm px-3 py-1.5 text-white outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="held">Held in Escrow</option>
              <option value="released">Released</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="p-4 font-medium">ID / Date</th>
                <th className="p-4 font-medium">Client → Influencer</th>
                <th className="p-4 font-medium">Campaign</th>
                <th className="p-4 font-medium text-right">Amounts</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    <Loader2 className="w-6 h-6 text-brand-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No transactions found.</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 align-top">
                      <p className="text-white text-sm">#{tx.id}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 align-top">
                      <p className="text-white text-sm font-medium">{tx.client?.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">to {tx.influencer?.name}</p>
                    </td>
                    <td className="p-4 align-top">
                      <p className="text-white text-sm truncate max-w-[200px]">
                        {tx.collaboration_request?.campaign?.title || `Collab #${tx.collaboration_request_id}`}
                      </p>
                    </td>
                    <td className="p-4 align-top text-right">
                      <p className="text-white text-sm font-medium font-mono">MAD {Number(tx.amount).toLocaleString()}</p>
                      <p className="text-brand-400 text-xs mt-0.5">Fee: MAD {Number(tx.platform_commission).toLocaleString()}</p>
                    </td>
                    <td className="p-4 align-top">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        tx.status === 'released' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        tx.status === 'held' ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' :
                        tx.status === 'refunded' ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' :
                        'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 align-top text-right space-y-2">
                      {tx.status === 'held' && (
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            onClick={() => handleForceRelease(tx.id)}
                            disabled={releaseMutation.isPending}
                            className="text-xs text-green-400 hover:text-green-300 font-medium px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            Force Release
                          </button>
                          <button
                            onClick={() => handleForceRefund(tx.id)}
                            disabled={refundMutation.isPending}
                            className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            Force Refund
                          </button>
                        </div>
                      )}
                      {tx.status !== 'held' && <span className="text-slate-600 text-xs">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
