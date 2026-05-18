import { useQuery } from '@tanstack/react-query'
import { reviewApi } from '@/services/api'
import { Star, Loader2, MessageSquareOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function ReviewsList({ userId, type }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', type, userId],
    queryFn: () => type === 'influencer' ? reviewApi.getInfluencerReviews(userId) : reviewApi.getClientReviews(userId),
    select: res => res.data.data
  })

  if (isLoading) return <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>

  const reviews = data?.data || []
  
  if (reviews.length === 0) return (
    <div className="py-10 text-center glass border border-white/5 rounded-2xl mt-6">
      <MessageSquareOff className="w-10 h-10 text-slate-500 mx-auto mb-3" />
      <p className="text-slate-400">No reviews yet.</p>
    </div>
  )

  const avgRating = (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)

  return (
    <div className="space-y-6 mt-8">
      <h3 className="font-display font-bold text-xl text-white">Reviews</h3>
      <div className="flex items-center gap-4">
        <div className="text-3xl font-display font-bold text-white">{avgRating}</div>
        <div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1">Based on {data.total} review{data.total !== 1 && 's'}</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="glass border border-white/5 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
                  {review.reviewer?.avatar ? (
                    <img src={review.reviewer.avatar} alt={review.reviewer.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400">
                      {review.reviewer?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-white text-sm">{review.reviewer?.name}</div>
                  <div className="text-xs text-slate-500">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-slate-300 leading-relaxed">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
