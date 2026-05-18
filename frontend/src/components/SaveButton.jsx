import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { savedApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

/**
 * SaveButton — heart toggle for influencer cards.
 * Only visible to logged-in clients.
 * @param {number} influencerId - the influencer's user ID
 * @param {string} [className]  - extra CSS classes for positioning
 */
export default function SaveButton({ influencerId, className = '' }) {
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  // Only show to clients
  if (!isAuthenticated || user?.role !== 'client') return null

  return <SaveButtonInner influencerId={influencerId} className={className} queryClient={queryClient} />
}

function SaveButtonInner({ influencerId, className, queryClient }) {
  const [optimistic, setOptimistic] = useState(null)

  const { data } = useQuery({
    queryKey: ['saved-check', influencerId],
    queryFn: () => savedApi.check(influencerId).then(r => r.data.data.saved),
    staleTime: 30_000,
  })

  const isSaved = optimistic !== null ? optimistic : (data ?? false)

  const mutation = useMutation({
    mutationFn: () => savedApi.toggle(influencerId),
    onMutate: () => {
      setOptimistic(!isSaved)
    },
    onSuccess: (res) => {
      const newSaved = res.data.data.saved
      setOptimistic(newSaved)
      toast.success(newSaved ? 'Saved to favorites ❤️' : 'Removed from favorites')
      queryClient.invalidateQueries({ queryKey: ['saved-check', influencerId] })
      queryClient.invalidateQueries({ queryKey: ['saved-influencers'] })
      queryClient.invalidateQueries({ queryKey: ['saved-count'] })
    },
    onError: () => {
      setOptimistic(!isSaved) // revert
      toast.error('Could not update favorites')
    },
  })

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        mutation.mutate()
      }}
      title={isSaved ? 'Remove from favorites' : 'Save to favorites'}
      className={`group p-2 rounded-full transition-all duration-200 ${
        isSaved
          ? 'bg-red-500/20 hover:bg-red-500/30'
          : 'bg-black/30 hover:bg-white/10'
      } backdrop-blur-sm ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-200 ${
          isSaved
            ? 'fill-red-500 text-red-500 scale-110'
            : 'text-white/70 group-hover:text-white group-hover:scale-110'
        }`}
      />
    </button>
  )
}
