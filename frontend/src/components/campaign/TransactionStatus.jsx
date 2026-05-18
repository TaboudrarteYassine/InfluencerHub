import { useState } from 'react'
import { paymentApi } from '@/services/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, CheckCircle, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TransactionStatus({ collaboration }) {
  const queryClient = useQueryClient()
  const [isReleasing, setIsReleasing] = useState(false)

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', collaboration.id],
    queryFn: () => paymentApi.getTransaction(collaboration.id).then(res => res.data.data.transaction),
    enabled: !!collaboration.id,
    retry: false,
  })

  if (isLoading) return <div className="skeleton h-20 rounded-xl" />
  if (!transaction) return null

  const handleRelease = async () => {
    if (!window.confirm("Are you sure you want to release funds to the influencer? This action cannot be undone.")) return
    
    setIsReleasing(true)
    try {
      await paymentApi.release(transaction.id)
      toast.success("Payment successfully released!")
      queryClient.invalidateQueries(['transaction', collaboration.id])
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to release payment")
    } finally {
      setIsReleasing(false)
    }
  }

  const statusConfig = {
    pending:  { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', text: 'Awaiting Payment' },
    held:     { icon: Lock, color: 'text-brand-400', bg: 'bg-brand-500/10', text: 'Payment in Escrow 🔒' },
    released: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', text: 'Payment Released ✅' },
    refunded: { icon: RotateCcw, color: 'text-slate-400', bg: 'bg-slate-500/10', text: 'Payment Refunded' },
    failed:   { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', text: 'Payment Failed' },
  }

  const conf = statusConfig[transaction.status] || statusConfig.pending
  const Icon = conf.icon

  return (
    <div className="glass border border-white/5 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
            Transaction Status
          </h3>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${conf.bg} ${conf.color}`}>
            <Icon className="w-4 h-4" />
            {conf.text}
          </div>
        </div>
        
        {transaction.status === 'held' && collaboration.status === 'completed' && (
          <button
            onClick={handleRelease}
            disabled={isReleasing}
            className="btn-glow px-4 py-2 rounded-xl text-white font-medium flex items-center gap-2"
          >
            {isReleasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Release Payment
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
        <div>
          <p className="text-xs text-slate-500 mb-1">Total Amount</p>
          <p className="text-white font-mono font-medium">MAD {Number(transaction.amount).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Platform Fee</p>
          <p className="text-slate-300 font-mono">MAD {Number(transaction.platform_commission).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Influencer Share</p>
          <p className="text-brand-400 font-mono font-medium">MAD {Number(transaction.influencer_amount).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Date</p>
          <p className="text-slate-300 text-sm">
            {new Date(transaction.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
