import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '',
    role: params.get('role') || 'influencer',
  })
  const [errors, setErrors] = useState({})

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.token)
      toast.success('Welcome to InfluenceHub! 🎉')
      const role = data.data.user.role
      navigate(role === 'influencer' ? '/onboarding/influencer' : '/onboarding/client')
    },
    onError: (err) => {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else {
        toast.error(err.response?.data?.message || 'Registration failed')
      }
    },
  })

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  const submit = (e) => {
    e.preventDefault()
    mutate(form)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="glass border border-white/8 rounded-3xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg btn-glow flex items-center justify-center">
                <span className="relative z-10 text-white font-bold text-sm">IH</span>
              </div>
            </Link>
            <h1 className="font-display font-bold text-2xl text-white mb-1">Create your account</h1>
            <p className="text-slate-500 text-sm">Join Morocco's #1 influencer marketplace</p>
          </div>

          {/* Role selector */}
          <div className="flex rounded-xl overflow-hidden border border-white/8 mb-6">
            {['influencer', 'client'].map((r) => (
              <button
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-all ${
                  form.role === r
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white bg-transparent'
                }`}
              >
                {r === 'influencer' ? '🎬 Creator' : '🏢 Brand'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Full Name</label>
              <input name="name" value={form.name} onChange={change} placeholder="Ahmed El Mansouri"
                className="input-base" required />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={change} placeholder="ahmed@example.com"
                className="input-base" required />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email[0]}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Phone (optional)</label>
              <input name="phone" value={form.phone} onChange={change} placeholder="+212 6XX XXX XXX"
                className="input-base" />
            </div>

            {/* Password */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={change} placeholder="Min. 8 characters" className="input-base pr-10" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password[0]}</p>}
            </div>

            {/* Confirm */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Confirm Password</label>
              <input name="password_confirmation" type="password" value={form.password_confirmation}
                onChange={change} placeholder="Repeat password" className="input-base" required />
            </div>

            <button type="submit" disabled={isPending}
              className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold mt-2 flex items-center justify-center gap-2">
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating account…</span></>
                : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
