import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { ArrowRight, ArrowLeft, Loader2, Building2 } from 'lucide-react'
import { onboardingApi } from '@/services/api'
import toast from 'react-hot-toast'

const INDUSTRIES = ['Fashion', 'Beauty', 'Tech', 'Food & Beverage', 'Travel', 'Health', 'Sports', 'Entertainment', 'Finance', 'Education', 'Real Estate', 'Automotive']
const SIZES      = ['1-10', '11-50', '51-200', '201-500', '500+']

export default function ClientOnboarding() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    company_name: '', description: '', industry: '',
    company_size: '1-10', website: '', country: 'Morocco', city: '',
  })

  const mutation = useMutation({
    mutationFn: async (data) => {
      await onboardingApi.updateClient(data)
      await onboardingApi.complete()
    },
    onSuccess: () => {
      updateUser({ is_onboarded: true })
      toast.success('Welcome to InfluenceHub! 🎉')
      navigate('/dashboard')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error saving profile'),
  })

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div animate={{ width: step === 0 ? '33%' : '100%' }}
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full" />
          </div>
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          className="glass border border-white/8 rounded-3xl p-8"
        >
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-6 h-6 text-brand-400" />
                <h2 className="font-display font-bold text-xl text-white">Your Company</h2>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Company Name *</label>
                <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="input-base" placeholder="My Brand Inc." />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-base resize-none" placeholder="What does your company do?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">Country</label>
                  <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="input-base" placeholder="Morocco" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">City</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="input-base" placeholder="Casablanca" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-2 block">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button key={ind} onClick={() => setForm({ ...form, industry: ind })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.industry === ind ? 'bg-brand-600/20 border-brand-500/50 text-brand-400' : 'glass border-white/8 text-slate-400'
                      }`}>{ind}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-xl text-white">Final Details</h2>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Website</label>
                <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="input-base" placeholder="https://mybrand.com" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-2 block">Company Size</label>
                <div className="flex gap-2 flex-wrap">
                  {SIZES.map((s) => (
                    <button key={s} onClick={() => setForm({ ...form, company_size: s })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.company_size === s ? 'bg-brand-600/20 border-brand-500/50 text-brand-400' : 'glass border-white/8 text-slate-400'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
              className="flex items-center gap-2 glass border border-white/8 px-4 py-2.5 rounded-xl text-slate-400 text-sm font-medium disabled:opacity-40">
              <ArrowLeft className="w-4 h-4" />Back
            </button>
            <button
              onClick={() => step === 0 ? setStep(1) : mutation.mutate(form)}
              disabled={mutation.isPending}
              className="btn-glow flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin relative z-10" />}
              <span className="relative z-10">{step === 0 ? 'Continue' : 'Complete Setup'}</span>
              {step === 0 && <ArrowRight className="w-4 h-4 relative z-10" />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
