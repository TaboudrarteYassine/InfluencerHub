import { useState } from 'react'
import { reviewApi } from '@/services/api'
import { Star, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export default function ReviewModal({ campaignId, isOpen, onClose }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => reviewApi.submit(data),
    onSuccess: () => {
      toast.success("Review submitted successfully!")
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['influencer-reviews'] })
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit review")
    }
  })

  if (!isOpen) return null

  const handleSubmit = () => {
    if (rating === 0) return toast.error("Please select a rating")
    mutation.mutate({ campaign_id: campaignId, rating, comment })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass border border-white/10 rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-display font-bold text-white mb-2">Leave a Review</h2>
        <p className="text-slate-400 text-sm mb-6">How was your experience working on this campaign?</p>
        
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className="focus:outline-none"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star 
                className={`w-10 h-10 transition-colors ${
                  star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'
                }`} 
              />
            </button>
          ))}
        </div>
        
        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-400 mb-1">Comment (optional)</label>
          <textarea 
            rows="4" 
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
          ></textarea>
        </div>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">Skip</button>
          <button 
            onClick={handleSubmit} 
            disabled={mutation.isPending || rating === 0}
            className="flex-1 btn-glow py-2 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
