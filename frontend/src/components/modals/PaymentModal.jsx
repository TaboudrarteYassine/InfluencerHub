import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ShieldCheck } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { paymentApi } from '@/services/api'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_test_xxx')

function CheckoutForm({ clientSecret, transactionData, onSuccess, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setErrorMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // If redirect required
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(error.message)
      setIsProcessing(false)
    } else {
      toast.success('Payment successfully held in escrow!')
      setIsProcessing(false)
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#111111] p-4 rounded-xl border border-white/5 space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Campaign Amount:</span>
          <span className="text-white font-medium">MAD {Number(transactionData.amount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Platform Escrow Fee:</span>
          <span className="text-white font-medium">MAD {Number(transactionData.commission).toLocaleString()}</span>
        </div>
        <div className="h-px w-full bg-white/5" />
        <div className="flex justify-between text-base font-semibold">
          <span className="text-white">Total to Pay:</span>
          <span className="text-brand-400">MAD {Number(transactionData.amount).toLocaleString()}</span>
        </div>
      </div>

      <div className="stripe-dark-theme rounded-xl overflow-hidden p-1 bg-white">
        <PaymentElement options={{ theme: 'stripe' }} />
      </div>

      {errorMessage && <div className="text-red-400 text-sm mt-2">{errorMessage}</div>}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 glass text-white px-4 py-3 rounded-xl font-medium hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 btn-glow text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay & Start Campaign'}
        </button>
      </div>
      <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1 mt-2">
        <ShieldCheck className="w-4 h-4" /> Secure Escrow Payment
      </p>
    </form>
  )
}

function MockCheckoutForm({ clientSecret, transactionData, onSuccess, onCancel }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/28')
  const [cvv, setCvv] = useState('123')
  const [cardholder, setCardholder] = useState('MAROC FASHION BRAND')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      await paymentApi.confirmMock({ 
        payment_intent_id: transactionData?.stripe_payment_intent_id || transactionData?.payment_intent_id,
        transaction_id: transactionData?.transaction_id || transactionData?.id
      })
      toast.success('Simulated payment successfully held in escrow!')
      setIsProcessing(false)
      onSuccess()
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Mock payment confirmation failed.')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Premium Gradient Card Simulation */}
      <div className="relative h-40 w-full bg-gradient-to-br from-[#7c3aed] via-[#4f46e5] to-[#2563eb] rounded-2xl p-5 shadow-2xl overflow-hidden border border-white/10 flex flex-col justify-between">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -z-10" />
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[9px] text-white/60 font-semibold tracking-widest">ESCROW SECURED</p>
            <h4 className="text-white font-bold text-xs tracking-wide mt-0.5">InfluencerHub Test Card</h4>
          </div>
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-white font-mono text-base tracking-widest">{cardNumber}</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[7px] text-white/40">CARD HOLDER</p>
              <p className="text-white font-semibold text-[10px] tracking-wider uppercase">{cardholder}</p>
            </div>
            <div className="text-right">
              <p className="text-[7px] text-white/40">EXPIRES</p>
              <p className="text-white font-semibold text-[10px]">{expiry}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#111111] p-4 rounded-xl border border-white/5 space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Campaign Amount:</span>
          <span className="text-white font-medium">MAD {Number(transactionData.amount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Platform Escrow Fee:</span>
          <span className="text-white font-medium">MAD {Number(transactionData.commission).toLocaleString()}</span>
        </div>
        <div className="h-px w-full bg-white/5" />
        <div className="flex justify-between text-base font-semibold">
          <span className="text-white">Total to Pay:</span>
          <span className="text-brand-400">MAD {Number(transactionData.amount).toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[11px] text-slate-400 font-medium block mb-1">Card Number</label>
          <input 
            type="text" 
            value={cardNumber} 
            onChange={(e) => setCardNumber(e.target.value)} 
            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" 
            placeholder="4242 4242 4242 4242"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Expiration Date</label>
            <input 
              type="text" 
              value={expiry} 
              onChange={(e) => setExpiry(e.target.value)} 
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" 
              placeholder="MM/YY"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">CVC / CVV</label>
            <input 
              type="password" 
              value={cvv} 
              onChange={(e) => setCvv(e.target.value)} 
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" 
              placeholder="123"
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-slate-400 font-medium block mb-1">Cardholder Name</label>
          <input 
            type="text" 
            value={cardholder} 
            onChange={(e) => setCardholder(e.target.value)} 
            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-brand-500 focus:outline-none uppercase" 
            placeholder="Your Name"
          />
        </div>
      </div>

      {errorMessage && <div className="text-red-400 text-sm mt-2">{errorMessage}</div>}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 glass text-white px-4 py-3 rounded-xl font-medium hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="flex-1 btn-glow text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay & Start Campaign (Simulated)'}
        </button>
      </div>
      <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1 mt-2">
        <ShieldCheck className="w-4 h-4 text-green-400" /> Simulated Escrow Payment Mode Enabled
      </p>
    </form>
  )
}

export default function PaymentModal({ isOpen, onClose, collaboration }) {
  const [clientSecret, setClientSecret] = useState('')
  const [transactionData, setTransactionData] = useState(null)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isOpen && collaboration?.id) {
      setLoading(true)
      paymentApi.createIntent({ collaboration_request_id: collaboration.id })
        .then(res => {
          setClientSecret(res.data.data.client_secret)
          setTransactionData(res.data.data)
        })
        .catch(err => {
          toast.error(err.response?.data?.message || 'Could not initialize payment')
          onClose()
        })
        .finally(() => setLoading(false))
    } else {
      setClientSecret('')
      setTransactionData(null)
    }
  }, [isOpen, collaboration, onClose])

  const handleSuccess = () => {
    queryClient.invalidateQueries(['campaign', collaboration.campaign_id])
    queryClient.invalidateQueries(['influencer-requests'])
    queryClient.invalidateQueries(['client-requests'])
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog static as={motion.div} open={isOpen} onClose={() => {}} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl relative"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">Fund Campaign Escrow</h2>
                  <p className="text-sm text-slate-400">
                    Your payment will be held securely in escrow until the campaign is completed.
                  </p>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center py-10">
                    <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
                    <p className="text-slate-400 text-sm">Initializing secure payment...</p>
                  </div>
                ) : clientSecret && transactionData ? (
                  clientSecret.startsWith('pi_mock_secret_') ? (
                    <MockCheckoutForm 
                      clientSecret={clientSecret} 
                      transactionData={transactionData} 
                      onSuccess={handleSuccess}
                      onCancel={onClose}
                    />
                  ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                      <CheckoutForm 
                        clientSecret={clientSecret} 
                        transactionData={transactionData} 
                        onSuccess={handleSuccess}
                        onCancel={onClose}
                      />
                    </Elements>
                  )
                ) : null}
              </motion.div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
