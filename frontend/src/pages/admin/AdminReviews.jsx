import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { Loader2, EyeOff, Eye, Flag, AlertTriangle, Trash2, MoreVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import PageHeader from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'

export default function AdminReviews() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ rating: 'all', is_visible: 'all', page: 1 })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', filters],
    queryFn: () => adminApi.reviews(filters),
    select: (res) => res.data.data
  })

  const actionMutation = useMutation({
    mutationFn: ({ action, id, data }) => adminApi[action](id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      toast.success(res.data.message || 'Action successful')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed')
    }
  })

  const handleAction = (action, id, params = {}) => {
    if (confirm("Are you sure you want to perform this action?")) {
      actionMutation.mutate({ action, id, data: params })
    }
  }

  const reviews = data?.data || []
  const meta = data || {}

  const ActionMenu = ({ review }) => (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="p-1.5 rounded-lg hover:bg-[#2a2a2a] text-slate-400 hover:text-white transition-colors">
        <MoreVertical className="w-4 h-4" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-2xl focus:outline-none z-10 overflow-hidden p-1.5">
          {review.is_visible ? (
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleAction('toggleReviewVisibility', review.id, { is_visible: false })} className={`${active ? 'bg-[#1a1a1a] text-white' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}>
                  <EyeOff className="w-4 h-4" /> Hide Review
                </button>
              )}
            </Menu.Item>
          ) : (
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleAction('toggleReviewVisibility', review.id, { is_visible: true })} className={`${active ? 'bg-[#1a1a1a] text-white' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}>
                  <Eye className="w-4 h-4" /> Restore Review
                </button>
              )}
            </Menu.Item>
          )}
          <Menu.Item>
            {({ active }) => (
              <button onClick={() => handleAction('flagFakeReview', review.id)} className={`${active ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}>
                <Flag className="w-4 h-4" /> Flag as Fake
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button onClick={() => handleAction('sendReviewWarning', review.id)} className={`${active ? 'bg-orange-500/10 text-orange-400' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}>
                <AlertTriangle className="w-4 h-4" /> Warn Reviewer
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button onClick={() => handleAction('deleteReview', review.id)} className={`${active ? 'bg-red-500/10 text-red-400' : 'text-slate-300'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm border-t border-[#1f1f1f] mt-1 pt-2 transition-colors`}>
                <Trash2 className="w-4 h-4" /> Delete Permanently
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )

  const columns = [
    {
      header: 'Review',
      cell: (row) => (
        <div className={`transition-opacity ${!row.is_visible ? 'opacity-50' : ''}`}>
          <div className="text-white mb-1 max-w-md line-clamp-2 italic">"{row.comment || 'No comment provided'}"</div>
          <div className="text-xs text-slate-500 mt-1">
            By <span className="text-slate-300 font-medium">{row.reviewer?.name || 'Unknown'}</span> for <span className="text-slate-300 font-medium">{row.influencer_profile?.user?.name || 'Unknown'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Rating',
      cell: (row) => (
        <span className={`flex items-center gap-1 text-yellow-400 font-bold ${!row.is_visible ? 'opacity-50' : ''}`}>
          ★ {row.rating}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row) => (
        row.is_visible ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Visible</span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">Hidden</span>
        )
      )
    },
    {
      header: '',
      cell: (row) => <div className="text-right"><ActionMenu review={row} /></div>
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Review Moderation" 
        subtitle="Manage platform reviews, flag fake feedback, and moderate content."
      />

      {/* Filters */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <select
          value={filters.rating}
          onChange={(e) => setFilters({ ...filters, rating: e.target.value, page: 1 })}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all min-w-[140px]"
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
        <select
          value={filters.is_visible}
          onChange={(e) => setFilters({ ...filters, is_visible: e.target.value, page: 1 })}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all min-w-[140px]"
        >
          <option value="all">All Visibility</option>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
      </div>

      <DataTable 
        columns={columns}
        data={reviews}
        isLoading={isLoading}
        emptyMessage="No reviews found matching your criteria."
      />
      
      {meta?.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400 mt-4 px-2">
          <span>Showing page {meta.current_page} of {meta.last_page}</span>
          <div className="flex gap-2">
            <button 
              disabled={meta.current_page === 1}
              onClick={() => setFilters({...filters, page: filters.page - 1})}
              className="px-3 py-1.5 bg-[#111111] border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={meta.current_page === meta.last_page}
              onClick={() => setFilters({...filters, page: filters.page + 1})}
              className="px-3 py-1.5 bg-[#111111] border border-[#2a2a2a] rounded-lg hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
