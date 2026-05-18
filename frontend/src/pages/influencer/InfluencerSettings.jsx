import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { influencerApi } from '@/services/api'
import {
  Camera, Plus, Trash2, Loader2, CheckCircle,
  Share2, Globe, MapPin, Tag, DollarSign,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PortfolioManager from '@/components/PortfolioManager'
import InfluencerPayoutSetup from '@/components/influencer/InfluencerPayoutSetup'

const PLATFORMS  = ['tiktok', 'instagram', 'youtube', 'twitter', 'facebook']
const NICHES_LIST = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Lifestyle', 'Business', 'Education', 'Health', 'Sports', 'Music', 'Comedy', 'Art']
const LANGUAGES  = ['Arabic', 'French', 'English', 'Darija', 'Spanish', 'German', 'Italian']

export default function InfluencerSettings() {
  const { user, setAvatar } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn:  () => influencerApi.myProfile(),
    select:   (res) => res.data.data.profile,
  })

  const [form, setForm]   = useState(null)
  const [tab, setTab]     = useState('profile')
  const [newSocial, setNewSocial] = useState({
    platform: 'instagram', username: '', followers_count: '', engagement_rate: '',
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await influencerApi.updateAvatar(formData)
      setAvatar(res.data.data.avatar)
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  // Initialize form from loaded data
  const profile = profileData
  if (profile && !form) {
    setForm({
      display_name: profile.display_name || '',
      bio: profile.bio || '',
      country: profile.country || '',
      city: profile.city || '',
      price_min: profile.price_min || '',
      price_max: profile.price_max || '',
      availability: profile.availability || 'available',
      languages: profile.languages || [],
      niches: profile.niches || [],
    })
  }

  const updateMutation = useMutation({
    mutationFn: (data) => influencerApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-profile'])
      toast.success('Profile updated!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const socialMutation = useMutation({
    mutationFn: (data) => influencerApi.addSocialAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-profile'])
      setNewSocial({ platform: 'instagram', username: '', followers_count: '', engagement_rate: '' })
      toast.success('Social account added!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add account'),
  })

  const toggleNiche = (niche) => {
    if (!form) return
    const niches = form.niches.includes(niche)
      ? form.niches.filter((n) => n !== niche)
      : [...form.niches, niche]
    setForm({ ...form, niches })
  }

  const toggleLanguage = (lang) => {
    if (!form) return
    const languages = form.languages.includes(lang)
      ? form.languages.filter((l) => l !== lang)
      : [...form.languages, lang]
    setForm({ ...form, languages })
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    )
  }

  const tabs = ['profile', 'social', 'pricing', 'portfolio', 'payouts']

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Profile & Settings</h1>
        <p className="text-slate-500 text-sm">Manage your creator profile to attract more brands</p>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col sm:flex-row items-center gap-5 mb-8 p-6 glass border border-white/8 rounded-2xl">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <label className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
          </label>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-white font-semibold mb-1">Profile Picture</h3>
          <p className="text-slate-400 text-xs max-w-xs">Upload a professional photo to build trust. Recommended 400x400px. JPG, PNG or WEBP. Max 2MB.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-brand-600 text-white' : 'glass border border-white/8 text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/8 rounded-2xl p-6 space-y-5"
        >
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Display Name</label>
              <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="input-base" placeholder="Your creator name" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Availability</label>
              <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="input-base">
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Not Available</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs font-medium mb-1.5 block">Bio</label>
            <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="input-base resize-none" placeholder="Tell brands about yourself, your content, and your audience…" />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
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

          {/* Niches */}
          <div>
            <label className="text-slate-400 text-xs font-medium mb-2 block">
              <Tag className="w-3 h-3 inline mr-1" />Niches (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {NICHES_LIST.map((n) => (
                <button key={n} onClick={() => toggleNiche(n)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.niches.includes(n)
                      ? 'bg-brand-600/20 border-brand-500/50 text-brand-400'
                      : 'glass border-white/8 text-slate-400 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="text-slate-400 text-xs font-medium mb-2 block">Languages</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button key={l} onClick={() => toggleLanguage(l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.languages.includes(l)
                      ? 'bg-accent-600/20 border-accent-500/50 text-accent-400'
                      : 'glass border-white/8 text-slate-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}
            className="btn-glow w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
            {updateMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
              : <><CheckCircle className="w-4 h-4" /><span>Save Changes</span></>
            }
          </button>
        </motion.div>
      )}

      {/* ── Social tab ── */}
      {tab === 'social' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Existing accounts */}
          {profile?.social_accounts?.length > 0 && (
            <div className="glass border border-white/8 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Connected Accounts</h3>
              <div className="space-y-3">
                {profile.social_accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                        <Share2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium capitalize">{acc.platform} · @{acc.username}</p>
                        <p className="text-slate-500 text-xs">
                          {acc.followers_count?.toLocaleString()} followers · {acc.engagement_rate}% engagement
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {acc.fake_follower_score < 30 && (
                        <span className="trust-badge trust-high text-xs">Authentic</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new */}
          <div className="glass border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Add Social Account</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Platform</label>
                <select value={newSocial.platform} onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })} className="input-base">
                  {PLATFORMS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Username</label>
                <input value={newSocial.username} onChange={(e) => setNewSocial({ ...newSocial, username: e.target.value })}
                  placeholder="@username" className="input-base" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Followers Count</label>
                <input type="number" value={newSocial.followers_count} onChange={(e) => setNewSocial({ ...newSocial, followers_count: e.target.value })}
                  placeholder="125000" className="input-base" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Engagement Rate (%)</label>
                <input type="number" step="0.1" value={newSocial.engagement_rate} onChange={(e) => setNewSocial({ ...newSocial, engagement_rate: e.target.value })}
                  placeholder="3.5" className="input-base" />
              </div>
            </div>
            <button onClick={() => socialMutation.mutate(newSocial)} disabled={socialMutation.isPending}
              className="btn-glow mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
              {socialMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Account
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Pricing tab ── */}
      {tab === 'pricing' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/8 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-start gap-3 p-4 bg-brand-600/10 border border-brand-500/20 rounded-xl">
            <DollarSign className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-300 text-sm">
              Set your price range to help brands understand your rates.
              These are starting points — you can always negotiate in the chat.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Minimum Price (MAD)</label>
              <input type="number" value={form.price_min} onChange={(e) => setForm({ ...form, price_min: e.target.value })}
                placeholder="500" className="input-base" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Maximum Price (MAD)</label>
              <input type="number" value={form.price_max} onChange={(e) => setForm({ ...form, price_max: e.target.value })}
                placeholder="10000" className="input-base" />
            </div>
          </div>

          <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}
            className="btn-glow w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
            {updateMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
              : <><CheckCircle className="w-4 h-4" /><span>Save Pricing</span></>
            }
          </button>
        </motion.div>
      )}

      {/* ── Portfolio tab ── */}
      {tab === 'portfolio' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
          <PortfolioManager />
        </motion.div>
      )}

      {/* ── Payouts tab ── */}
      {tab === 'payouts' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
          <InfluencerPayoutSetup />
        </motion.div>
      )}
    </div>
  )
}
