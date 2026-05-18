import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { influencerApi } from '@/services/api'
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Loader2, UploadCloud, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function PortfolioManager() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', media_type: 'image', external_url: '', media: null })

  const { data: items, isLoading } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: () => influencerApi.getPortfolio(user?.id),
    select: res => res.data.data?.items || []
  })

  const addMutation = useMutation({
    mutationFn: (data) => influencerApi.addPortfolioItem(data),
    onSuccess: () => {
      toast.success('Portfolio item added')
      queryClient.invalidateQueries(['portfolio', user?.id])
      setIsAdding(false)
      setFormData({ title: '', description: '', media_type: 'image', external_url: '', media: null })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add item')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => influencerApi.deletePortfolioItem(id),
    onSuccess: () => {
      toast.success('Item deleted')
      queryClient.invalidateQueries(['portfolio', user?.id])
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title) return toast.error('Title is required')
    
    const data = new FormData()
    data.append('title', formData.title)
    data.append('description', formData.description)
    data.append('media_type', formData.media_type)
    if (formData.external_url) data.append('external_url', formData.external_url)
    if (formData.media) data.append('media', formData.media)

    addMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Portfolio</h2>
          <p className="text-sm text-slate-400">Showcase your best past collaborations and content.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="btn-glow px-4 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        )}
      </div>

      {isAdding && (
        <div className="glass border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">New Portfolio Item</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData(f => ({...f, title: e.target.value}))} className="input-base w-full" placeholder="e.g. Nike Summer Campaign" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border ${formData.media_type === 'image' ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-white/10 glass text-slate-400 hover:text-white'}`}>
                <input type="radio" name="media_type" value="image" checked={formData.media_type === 'image'} onChange={() => setFormData(f => ({...f, media_type: 'image'}))} className="hidden" />
                <ImageIcon className="w-6 h-6 mb-2" />
                <span className="font-medium text-sm">Upload File</span>
              </label>
              <label className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border ${formData.media_type === 'link' ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-white/10 glass text-slate-400 hover:text-white'}`}>
                <input type="radio" name="media_type" value="link" checked={formData.media_type === 'link'} onChange={() => setFormData(f => ({...f, media_type: 'link'}))} className="hidden" />
                <LinkIcon className="w-6 h-6 mb-2" />
                <span className="font-medium text-sm">External Link</span>
              </label>
            </div>

            {(formData.media_type === 'image' || formData.media_type === 'video') && (
              <div>
                <label className="text-slate-400 text-sm mb-1.5 block">Upload Media (Image or Video)</label>
                <input type="file" ref={fileInputRef} onChange={e => setFormData(f => ({...f, media: e.target.files[0]}))} className="hidden" accept="image/*,video/*" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-4 border border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                  <UploadCloud className="w-5 h-5" />
                  {formData.media ? formData.media.name : 'Click to select file'}
                </button>
              </div>
            )}

            {formData.media_type === 'link' && (
              <div>
                <label className="text-slate-400 text-sm mb-1.5 block">External URL</label>
                <input type="url" value={formData.external_url} onChange={e => setFormData(f => ({...f, external_url: e.target.value}))} className="input-base w-full" placeholder="https://..." required />
              </div>
            )}

            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Description (Optional)</label>
              <textarea value={formData.description} onChange={e => setFormData(f => ({...f, description: e.target.value}))} className="input-base w-full h-24" placeholder="Describe your role in this project..." />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white font-medium">Cancel</button>
              <button type="submit" disabled={addMutation.isPending} className="btn-glow px-6 py-2 rounded-xl text-white font-semibold flex items-center gap-2">
                {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Save Item
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
        ) : items.map(item => (
          <div key={item.id} className="glass border border-white/10 rounded-2xl overflow-hidden group">
            <div className="aspect-video bg-black relative border-b border-white/10">
              {item.media_type === 'image' && <img src={item.media_url.startsWith('http') ? item.media_url : `/storage/${item.media_url}`} className="w-full h-full object-cover" />}
              {item.media_type === 'video' && <video src={item.media_url.startsWith('http') ? item.media_url : `/storage/${item.media_url}`} className="w-full h-full object-cover" />}
              {item.media_type === 'link' && <div className="w-full h-full flex items-center justify-center bg-slate-900"><LinkIcon className="w-8 h-8 text-brand-400" /></div>}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h4 className="text-white font-semibold line-clamp-1 flex-1">{item.title}</h4>
                <button onClick={() => confirm('Delete this item?') && deleteMutation.mutate(item.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 uppercase tracking-wider font-medium">
                {item.media_type === 'link' ? <LinkIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />} {item.media_type}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
