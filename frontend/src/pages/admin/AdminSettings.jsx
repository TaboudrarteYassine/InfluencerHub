import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { Settings, Save, Loader2, Server, Bot, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/admin/PageHeader'
import SectionCard from '@/components/admin/SectionCard'
import ToggleSwitch from '@/components/admin/ToggleSwitch'

export default function AdminSettings() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.settings(),
    select: res => res.data.data
  })

  useEffect(() => {
    if (data) {
      setFormData(data)
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: (newSettings) => adminApi.updateSettings(newSettings),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      toast.success(res.data.message)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleToggle = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Platform Settings" 
        subtitle="Configure global platform behavior, AI features, and scoring algorithms."
        action={
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-[0_0_15px_var(--tw-shadow-color)] shadow-violet-500/20 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <SectionCard 
          title={<span className="flex items-center gap-2"><Server className="w-4 h-4 text-violet-500" /> General Configuration</span>}
        >
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">Platform Name</label>
              <input 
                type="text" 
                name="platform_name" 
                value={formData.platform_name || ''} 
                onChange={handleChange} 
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">Support Email</label>
              <input 
                type="email" 
                name="support_email" 
                value={formData.support_email || ''} 
                onChange={handleChange} 
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600 font-mono" 
              />
            </div>
            
            <div className="pt-2 space-y-3">
              <ToggleSwitch 
                checked={formData.maintenance_mode === 'true' || formData.maintenance_mode === true}
                onChange={(checked) => handleToggle('maintenance_mode', checked)}
                label="Maintenance Mode"
                description="Blocks all non-admin access to the frontend."
              />
              <ToggleSwitch 
                checked={formData.open_registration === 'true' || formData.open_registration === true}
                onChange={(checked) => handleToggle('open_registration', checked)}
                label="Open Registration"
                description="Allow new users to sign up for accounts."
              />
            </div>
          </div>
        </SectionCard>

        {/* AI Features */}
        <SectionCard 
          title={<span className="flex items-center gap-2"><Bot className="w-4 h-4 text-blue-500" /> AI Capabilities</span>}
        >
          <div className="space-y-3">
            {[
              { key: 'ai_matching_enabled', label: 'AI Campaign Matching', desc: 'Auto-suggests influencers for campaigns.' },
              { key: 'ai_moderation_enabled', label: 'AI Content Moderation', desc: 'Auto-flags inappropriate messages & reviews.' },
              { key: 'ai_pricing_enabled', label: 'AI Price Suggestions', desc: 'Suggests fair budgets based on market data.' },
              { key: 'ai_fake_detection_enabled', label: 'Fake Review Detection', desc: 'Analyzes review sentiment and patterns.' }
            ].map(({ key, label, desc }) => (
              <ToggleSwitch 
                key={key}
                checked={formData[key] === 'true' || formData[key] === true}
                onChange={(checked) => handleToggle(key, checked)}
                label={label}
                description={desc}
              />
            ))}
          </div>
        </SectionCard>

        {/* Trust Score Weights */}
        <div className="lg:col-span-2">
          <SectionCard 
            title={<span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Trust Score Algorithm Weights</span>}
            description="Configure the exact percentage impact of each metric on the global Trust Score (Must sum to 100)."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: 'verification_weight', label: 'Verification' },
                { key: 'review_weight', label: 'Reviews' },
                { key: 'activity_weight', label: 'Activity' },
                { key: 'engagement_weight', label: 'Engagement' },
                { key: 'response_weight', label: 'Response Rate' }
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5 bg-[#0a0a0a] p-3 rounded-xl border border-[#1f1f1f]">
                  <label className="block text-xs font-medium text-slate-400 capitalize">{label} (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name={key} 
                      value={formData[key] || '0'} 
                      onChange={handleChange} 
                      min="0"
                      max="100"
                      className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-center" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
