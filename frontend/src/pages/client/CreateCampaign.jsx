import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { campaignApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, Briefcase, Target, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, label: 'Basics',      icon: Briefcase },
  { id: 2, label: 'Targeting',   icon: Target },
  { id: 3, label: 'Budget',      icon: DollarSign },
  { id: 4, label: 'Review',      icon: CheckCircle },
]

const PLATFORMS = ['tiktok', 'instagram', 'youtube', 'twitter']
const NICHES    = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Lifestyle', 'Business']

const defaultForm = {
  title: '', description: '', deliverables: '',
  platforms: [], target_niches: [],
  budget_min: '', budget_max: '', deadline: '',
  country: 'Morocco', min_followers: '', min_engagement_rate: '',
}

export default function CreateCampaign() {
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState(defaultForm)
  const [errors, setErrors] = useState({})

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => campaignApi.create(data),
    onSuccess: ({ data }) => {
      toast.success('Campaign created!')
      navigate(`/campaigns`)
    },
    onError: (err) => {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {})
      else toast.error('Failed to create campaign')
    },
  })

  const toggle = (key, val) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val],
    }))
  }

  const nextStep = () => setStep((s) => Math.min(s + 1, 4))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const publish = () => mutate({ ...form, status: 'published' })
  const saveDraft = () => mutate({ ...form, status: 'draft' })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Create a Campaign</h1>
        <p className="text-slate-500 text-sm">Find the perfect creator for your brand</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon    = s.icon
          const active  = step === s.id
          const done    = step > s.id
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                active ? 'bg-brand-600 text-white' : done ? 'bg-brand-600/20 text-brand-400' : 'glass border border-white/8 text-slate-500'
              }`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${done ? 'bg-brand-600/40' : 'bg-white/8'}`} />}
            </div>
          )
        })}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="glass border border-white/8 rounded-2xl p-6"
      >
        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-white font-semibold text-lg">Campaign Basics</h2>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Campaign Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-base" placeholder="Summer fashion campaign 2026" />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title[0]}</p>}
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Description *</label>
              <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-base resize-none" placeholder="Describe your campaign goals, what you're promoting, and what kind of content you expect…" />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description[0]}</p>}
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Deliverables</label>
              <textarea rows={3} value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
                className="input-base resize-none" placeholder="e.g. 2 TikTok videos, 3 Instagram stories, 1 reel…" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">Platforms</label>
              <div className="flex gap-2 flex-wrap">
                {PLATFORMS.map((p) => (
                  <button key={p} onClick={() => toggle('platforms', p)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize border transition-all ${
                      form.platforms.includes(p)
                        ? 'bg-brand-600/20 border-brand-500/50 text-brand-400'
                        : 'glass border-white/8 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Targeting */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-white font-semibold text-lg">Influencer Targeting</h2>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">Target Niches</label>
              <div className="flex flex-wrap gap-2">
                {NICHES.map((n) => (
                  <button key={n} onClick={() => toggle('target_niches', n)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.target_niches.includes(n)
                        ? 'bg-brand-600/20 border-brand-500/50 text-brand-400'
                        : 'glass border-white/8 text-slate-400 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Min Followers</label>
                <input type="number" value={form.min_followers} onChange={(e) => setForm({ ...form, min_followers: e.target.value })}
                  className="input-base" placeholder="10000" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Min Engagement Rate (%)</label>
                <input type="number" step="0.1" value={form.min_engagement_rate} onChange={(e) => setForm({ ...form, min_engagement_rate: e.target.value })}
                  className="input-base" placeholder="2.5" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Country</label>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="input-base" placeholder="Morocco" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="input-base" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-white font-semibold text-lg">Budget</h2>
            <div className="p-4 bg-brand-600/10 border border-brand-500/20 rounded-xl text-sm text-slate-300">
              💡 Setting a realistic budget increases your match rate by 3x. Morocco average per post: 500–5,000 MAD.
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Minimum Budget (MAD)</label>
                <input type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                  className="input-base" placeholder="500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Maximum Budget (MAD)</label>
                <input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                  className="input-base" placeholder="10000" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg">Review & Launch</h2>
            {[
              { label: 'Title',       value: form.title },
              { label: 'Platforms',   value: form.platforms.join(', ') || 'Not set' },
              { label: 'Niches',      value: form.target_niches.join(', ') || 'Not set' },
              { label: 'Budget',      value: form.budget_min && form.budget_max ? `${form.budget_min}–${form.budget_max} MAD` : 'Not set' },
              { label: 'Deadline',    value: form.deadline || 'Not set' },
              { label: 'Country',     value: form.country },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-2.5 border-b border-white/5">
                <span className="text-slate-500 text-sm">{row.label}</span>
                <span className="text-white text-sm font-medium">{row.value}</span>
              </div>
            ))}
            <div className="flex gap-3 pt-4">
              <button onClick={saveDraft} disabled={isPending}
                className="flex-1 glass border border-white/8 hover:border-white/20 py-3 rounded-xl text-slate-300 text-sm font-semibold transition-all">
                Save as Draft
              </button>
              <button onClick={publish} disabled={isPending}
                className="flex-1 btn-glow py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Publish Campaign</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between mt-6 pt-5 border-t border-white/5">
            <button onClick={prevStep} disabled={step === 1}
              className="flex items-center gap-2 glass border border-white/8 px-4 py-2.5 rounded-xl text-slate-400 text-sm font-medium disabled:opacity-40 hover:text-white transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={nextStep}
              className="btn-glow flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold">
              <span>Next</span><ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
