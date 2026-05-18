import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/api'
import { Loader2, Plus, EyeOff, Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'

export default function AdminCategories() {
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.categories(),
    select: (res) => res.data.data
  })

  const actionMutation = useMutation({
    mutationFn: ({ action, id, data }) => adminApi[action](id || data), 
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      toast.success(res.data.message || 'Action successful')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed')
    }
  })

  const handleToggle = (id) => {
    actionMutation.mutate({ action: 'toggleCategoryVisibility', id })
  }

  const handleDelete = (id) => {
    if (confirm("Delete this category? This might affect existing campaigns.")) {
      actionMutation.mutate({ action: 'deleteCategory', id })
    }
  }

  const handleCreate = () => {
    const name = prompt("Category Name:")
    if (!name) return
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    actionMutation.mutate({ action: 'createCategory', data: { name, slug, icon: 'Tag' } })
  }

  const columns = [
    {
      header: 'Name',
      cell: (row) => <span className="font-medium text-white">{row.name}</span>
    },
    {
      header: 'Slug',
      cell: (row) => <span className="text-slate-400 font-mono text-sm">{row.slug}</span>
    },
    {
      header: 'Campaigns',
      cell: (row) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
          {row.campaigns_count || 0} Campaigns
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row) => (
        row.is_active ? (
          <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400"></span> Active
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span> Hidden
          </span>
        )
      )
    },
    {
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => handleToggle(row.id)} 
            className="p-1.5 bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] text-slate-400 hover:text-white rounded-lg transition-colors" 
            title={row.is_active ? "Hide Category" : "Show Category"}
          >
            {row.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => handleDelete(row.id)} 
            className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors" 
            title="Delete Category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Categories" 
        subtitle="Manage campaign categories available on the platform."
        action={
          <button
            onClick={handleCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-[0_0_15px_var(--tw-shadow-color)] shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" /> New Category
          </button>
        }
      />

      <DataTable 
        columns={columns}
        data={categories}
        isLoading={isLoading}
        emptyMessage="No categories found."
      />
    </div>
  )
}
