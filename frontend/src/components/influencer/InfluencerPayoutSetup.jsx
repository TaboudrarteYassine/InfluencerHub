import { useQuery, useMutation } from '@tanstack/react-query'
import { paymentApi } from '@/services/api'
import { CreditCard, CheckCircle, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function InfluencerPayoutSetup() {
  const [isRedirecting, setIsRedirecting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['stripe-onboard-status'],
    queryFn: () => paymentApi.stripeOnboardStatus().then(res => res.data.data),
  })

  const onboardMutation = useMutation({
    mutationFn: () => paymentApi.stripeOnboard(),
    onSuccess: (res) => {
      window.location.href = res.data.data.url
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not start Stripe onboarding')
      setIsRedirecting(false)
    }
  })

  const handleSetup = () => {
    setIsRedirecting(true)
    onboardMutation.mutate()
  }

  if (isLoading) return <div className="skeleton h-48 rounded-xl" />

  const isComplete = data?.is_complete

  return (
    <div className="glass border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Payout Settings</h2>
          <p className="text-sm text-slate-400">Manage how you get paid for campaigns</p>
        </div>
      </div>

      <div className="mt-6 border-t border-white/5 pt-6">
        {isComplete ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-3 rounded-xl border border-green-500/20">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Payouts Enabled. You are ready to receive funds.</span>
            </div>

            <div className="bg-[#111111] p-5 rounded-xl border border-white/5">
              <p className="text-slate-400 text-sm mb-1">Total Lifetime Earnings</p>
              <p className="text-3xl font-display font-bold text-white">
                MAD {Number(data.total_earnings || 0).toLocaleString()}
              </p>
            </div>

            <button
              onClick={handleSetup}
              disabled={isRedirecting}
              className="text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              Update Stripe Account details <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start gap-3 text-yellow-500 bg-yellow-500/10 px-4 py-3 rounded-xl border border-yellow-500/20">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Setup Required</p>
                <p className="text-sm mt-1 opacity-90">
                  You must connect a Stripe account to receive payouts from clients. Funds are held in escrow and transferred automatically when campaigns are completed.
                </p>
              </div>
            </div>

            <button
              onClick={handleSetup}
              disabled={isRedirecting}
              className="btn-glow px-6 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Redirecting to Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> Setup Payouts via Stripe
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
