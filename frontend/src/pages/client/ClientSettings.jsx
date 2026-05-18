import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { clientApi } from '@/services/api'
import { Camera, Loader2, Save } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function ClientSettings() {
  const { user, setAvatar } = useAuthStore()
  const queryClient = useQueryClient()

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [formData, setFormData] = useState({
    company_name: user?.client_profile?.company_name || '',
    description: user?.client_profile?.description || '',
    industry: user?.client_profile?.industry || '',
    company_size: user?.client_profile?.company_size || '',
    website: user?.client_profile?.website || ''
  })

  useEffect(() => {
    if (user?.client_profile) {
      setFormData({
        company_name: user.client_profile.company_name || '',
        description: user.client_profile.description || '',
        industry: user.client_profile.industry || '',
        company_size: user.client_profile.company_size || '',
        website: user.client_profile.website || ''
      })
    }
  }, [user])

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
      const res = await clientApi.updateAvatar(formData)
      setAvatar(res.data.data.avatar)
      toast.success('Company logo updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const profileMutation = useMutation({
    mutationFn: (data) => clientApi.updateProfile(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['auth-me'])
      toast.success('Profile updated successfully!')
      // Optionally update the authStore with new profile data if returned
      if (res.data.data.profile) {
         useAuthStore.setState({ user: { ...user, client_profile: res.data.data.profile } })
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  })

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    profileMutation.mutate(formData)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Company Profile & Settings</h1>
        <p className="text-slate-500 text-sm">Manage your brand profile</p>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col sm:flex-row items-center gap-5 p-6 glass border border-white/8 rounded-2xl">
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
          <h3 className="text-white font-semibold mb-1">Company Logo</h3>
          <p className="text-slate-400 text-xs max-w-xs">Upload your company logo. Recommended 400x400px. JPG, PNG or WEBP. Max 2MB.</p>
        </div>
      </div>
      
      {/* Profile Form */}
      <div className="glass border border-white/8 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
              <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500" required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Business Description</label>
              <textarea rows={4} name="description" value={formData.description} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500" required></textarea>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Industry</label>
              <select name="industry" value={formData.industry} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500" required>
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Fashion">Fashion</option>
                <option value="Beauty">Beauty</option>
                <option value="Gaming">Gaming</option>
                <option value="Fitness">Fitness</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Travel">Travel</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Company Size</label>
              <select name="company_size" value={formData.company_size} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500" required>
                <option value="">Select Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="10-50">10-50 employees</option>
                <option value="50-200">50-200 employees</option>
                <option value="200+">200+ employees</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Website URL</label>
              <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500" placeholder="https://" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button type="submit" disabled={profileMutation.isPending} className="btn-glow px-6 py-2 rounded-xl flex items-center gap-2 text-sm font-medium">
              {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
