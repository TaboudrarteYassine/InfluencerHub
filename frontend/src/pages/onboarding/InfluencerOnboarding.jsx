import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { onboardingApi, kycApi } from '@/services/api'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { ArrowRight, ArrowLeft, CheckCircle, Loader2, Sparkles, UploadCloud, X, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'

const STEPS_LABELS = ['Basic Info', 'Creator Profile', 'Identity Verification']
const NICHES  = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Lifestyle', 'Business', 'Education', 'Health', 'Music']
const LANGUAGES = ['Arabic', 'French', 'English', 'Darija', 'Spanish']

export default function InfluencerOnboarding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isResubmit = searchParams.get('resubmit') === 'true'
  
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState(isResubmit ? 2 : 0)
  
  // Basic Info
  const [basicInfo, setBasicInfo] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
    username: user?.username || '',
    country: 'Morocco',
    city: '',
  })
  
  // Creator Profile
  const [profile, setProfile] = useState({
    bio: '', niches: [], languages: ['Arabic'],
    price_min: '', price_max: '',
    instagram_url: '', tiktok_url: '', followers_count: ''
  })
  
  // KYC Files
  const [kyc, setKyc] = useState({ cin_front: null, selfie: null })
  
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const debouncedUsername = useDebounce(basicInfo.username, 500)
  
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      setShowCamera(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (err) {
      toast.error("Camera access denied. Please allow camera access and try again.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1) // Mirror the captured image to match video feed
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
      setKyc({ ...kyc, selfie: file })
      stopCamera()
    }, 'image/jpeg', 0.9)
  }
  
  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      setCheckingUsername(true)
      api.get(`/auth/check-username?username=${debouncedUsername}`)
        .then(res => setUsernameAvailable(res.data.data.available))
        .catch(() => setUsernameAvailable(false))
        .finally(() => setCheckingUsername(false))
    } else {
      setUsernameAvailable(null)
    }
  }, [debouncedUsername])

  const profileMutation = useMutation({
    mutationFn: (data) => onboardingApi.updateInfluencer(data),
    onError: (err) => toast.error(err.response?.data?.message || 'Error saving profile'),
  })
  
  const socialMutation = useMutation({
    mutationFn: (data) => onboardingApi.addSocialAccount(data),
    onError: (err) => toast.error(err.response?.data?.message || 'Error adding social account'),
  })
  
  const completeMutation = useMutation({
    mutationFn: () => onboardingApi.complete(),
  })
  
  const kycMutation = useMutation({
    mutationFn: (data) => isResubmit ? kycApi.resubmit(data) : kycApi.submit(data),
    onSuccess: () => {
      updateUser({ 
        ...user, 
        influencer_profile: { 
          ...(user.influencer_profile || {}), 
          verification_status: 'pending' 
        } 
      })
      toast.success('Documents submitted successfully!')
      navigate('/dashboard')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error submitting documents'),
  })

  const toggleNiche = (val) => setProfile(p => ({
    ...p, niches: p.niches.includes(val) ? p.niches.filter(x => x !== val) : [...p.niches, val],
  }))

  const handleNext = async () => {
    if (step === 0) {
      if (!basicInfo.full_name || !basicInfo.phone_number || !basicInfo.username || !basicInfo.city) {
        return toast.error('Please fill all required fields.')
      }
      if (usernameAvailable === false && basicInfo.username !== user?.username) {
        return toast.error('Username is not available.')
      }
      setStep(1)
    }
    else if (step === 1) {
      if (!profile.bio || profile.niches.length === 0 || !profile.instagram_url || !profile.followers_count || !profile.price_min) {
        return toast.error('Please fill all required fields in this step.')
      }
      
      // Save profile
      await profileMutation.mutateAsync({
        display_name: basicInfo.full_name, // fallback for display name
        bio: profile.bio,
        country: basicInfo.country,
        city: basicInfo.city,
        niches: profile.niches,
        languages: profile.languages,
        price_min: profile.price_min,
        price_max: profile.price_max,
        availability: 'available'
      })
      
      // Save primary social account
      await socialMutation.mutateAsync({
        platform: 'instagram',
        username: profile.instagram_url.split('/').pop() || profile.instagram_url,
        followers_count: profile.followers_count,
        engagement_rate: 0
      })
      
      if (!isResubmit) {
        await completeMutation.mutateAsync()
        updateUser({ is_onboarded: true })
      }
      
      setStep(2)
    }
    else if (step === 2) {
      if (!kyc.cin_front || !kyc.selfie) {
        return toast.error('Please upload both required documents.')
      }
      
      const formData = new FormData()
      formData.append('full_name', basicInfo.full_name)
      formData.append('phone_number', basicInfo.phone_number)
      formData.append('username', basicInfo.username)
      formData.append('cin_front', kyc.cin_front)
      formData.append('selfie', kyc.selfie)
      
      kycMutation.mutate(formData)
    }
  }

  const progress = Math.round((step / (STEPS_LABELS.length - 1)) * 100)

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Step {step + 1} of {STEPS_LABELS.length}</span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"
            />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS_LABELS.map((l, i) => (
              <span key={l} className={`text-xs font-medium ${i <= step ? 'text-brand-400' : 'text-slate-600'}`}>{l}</span>
            ))}
          </div>
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          className="glass border border-white/8 rounded-3xl p-8"
        >
          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-2xl text-white">Basic Info</h2>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Full Legal Name *</label>
                <input value={basicInfo.full_name} onChange={(e) => setBasicInfo({ ...basicInfo, full_name: e.target.value })}
                  className="input-base" placeholder="As it appears on your ID" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Username *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                  <input value={basicInfo.username} onChange={(e) => setBasicInfo({ ...basicInfo, username: e.target.value.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase() })}
                    className={`input-base pl-8 ${usernameAvailable === false ? 'border-red-500/50' : usernameAvailable === true ? 'border-green-500/50' : ''}`} placeholder="your.name" />
                  {checkingUsername && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
                </div>
                {usernameAvailable === false && basicInfo.username !== user?.username && <p className="text-red-400 text-xs mt-1">Username is taken.</p>}
                {usernameAvailable === true && <p className="text-green-400 text-xs mt-1">Username available!</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">Phone Number *</label>
                  <input value={basicInfo.phone_number} onChange={(e) => setBasicInfo({ ...basicInfo, phone_number: e.target.value })}
                    className="input-base" placeholder="+212 6XX..." />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">City *</label>
                  <input value={basicInfo.city} onChange={(e) => setBasicInfo({ ...basicInfo, city: e.target.value })}
                    className="input-base" placeholder="Casablanca" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Creator Profile */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-2xl text-white">Creator Profile</h2>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Bio *</label>
                <textarea rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="input-base resize-none" placeholder="Tell brands about your content…" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-2 block">Your Niches *</label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((n) => (
                    <button key={n} onClick={() => toggleNiche(n)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        profile.niches.includes(n) ? 'bg-brand-600/20 border-brand-500/50 text-brand-400' : 'glass border-white/8 text-slate-400'
                      }`}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">Instagram URL or @ *</label>
                  <input value={profile.instagram_url} onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value })}
                    className="input-base" placeholder="@username" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">Followers Count *</label>
                  <input type="number" value={profile.followers_count} onChange={(e) => setProfile({ ...profile, followers_count: e.target.value })}
                    className="input-base" placeholder="10000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">Min Price (MAD) *</label>
                  <input type="number" value={profile.price_min} onChange={(e) => setProfile({ ...profile, price_min: e.target.value })}
                    className="input-base" placeholder="500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">Max Price (MAD)</label>
                  <input type="number" value={profile.price_max} onChange={(e) => setProfile({ ...profile, price_max: e.target.value })}
                    className="input-base" placeholder="10000" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: KYC */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-2xl text-white mb-1">Verify Your Identity</h2>
                <p className="text-slate-500 text-sm">Your information is secure and will never be shared publicly.</p>
              </div>

              {/* CIN Upload */}
              <div>
                <label className="text-white text-sm font-semibold mb-2 block">1. CIN Front Photo *</label>
                <div className="relative">
                  <input type="file" onChange={e => setKyc({...kyc, cin_front: e.target.files[0]})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" />
                  <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all ${kyc.cin_front ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                    {kyc.cin_front ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-brand-400 mb-2" />
                        <p className="text-brand-400 font-medium text-sm">{kyc.cin_front.name}</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-slate-300 font-medium text-sm mb-1">Click or drag photo here</p>
                        <p className="text-slate-500 text-xs">Clear, readable, under 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Selfie Upload */}
              <div>
                <label className="text-white text-sm font-semibold mb-1 block">2. Selfie Photo *</label>
                <p className="text-slate-500 text-xs mb-3">Take a clear live selfie. No sunglasses, no filters, good lighting.</p>
                
                {kyc.selfie ? (
                  <div className="border-2 border-brand-500 rounded-2xl p-4 bg-brand-500/10 flex flex-col items-center text-center">
                    <img src={URL.createObjectURL(kyc.selfie)} alt="Selfie preview" className="w-32 h-32 object-cover rounded-xl border border-white/20 mb-3 shadow-lg" />
                    <p className="text-brand-400 font-medium text-sm mb-3 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Photo Captured</p>
                    <button onClick={() => { setKyc({...kyc, selfie: null}); startCamera(); }} className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      Retake
                    </button>
                  </div>
                ) : (
                  <button onClick={startCamera} className="w-full relative group">
                    <div className="p-6 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center bg-white/5 group-hover:bg-white/10 group-hover:border-brand-500/50 transition-all">
                      <Camera className="w-8 h-8 text-slate-400 mb-2 group-hover:text-brand-400 transition-colors" />
                      <span className="text-white font-medium text-sm">Open Camera & Take Photo</span>
                      <p className="text-slate-500 text-xs mt-1">Uses your device's front camera directly</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            {!isResubmit ? (
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                className="flex items-center gap-2 glass border border-white/8 px-4 py-2.5 rounded-xl text-slate-400 text-sm font-medium disabled:opacity-40">
                <ArrowLeft className="w-4 h-4" />Back
              </button>
            ) : <div />}
            <button onClick={handleNext} disabled={profileMutation.isPending || socialMutation.isPending || kycMutation.isPending}
              className="btn-glow flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold">
              {(profileMutation.isPending || socialMutation.isPending || kycMutation.isPending)
                ? <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                : null
              }
              <span className="relative z-10">{step === 2 ? 'Submit for Verification' : 'Continue'}</span>
              {step < 2 && <ArrowRight className="w-4 h-4 relative z-10" />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[var(--color-surface-900)] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/20">
                <h3 className="text-white font-semibold">Take Selfie</h3>
                <button onClick={stopCamera} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative bg-black aspect-[3/4] sm:aspect-square w-full flex items-center justify-center overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="absolute inset-0 w-full h-full object-cover -scale-x-100" 
                />
              </div>
              
              <div className="p-6 bg-black/40 flex justify-center border-t border-white/5">
                <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white/20 p-1 group transition-all">
                  <div className="w-full h-full bg-brand-500 rounded-full group-hover:bg-brand-400 group-hover:scale-95 transition-all"></div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
