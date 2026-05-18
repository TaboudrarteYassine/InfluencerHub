export default function StatusBadge({ status, type = 'default' }) {
  const getColors = () => {
    const s = status?.toLowerCase() || ''
    
    // Statuses
    if (['active', 'completed', 'published', 'accepted', 'approved'].includes(s)) return 'bg-green-500/10 text-green-400 border border-green-500/20'
    if (['pending', 'draft', 'negotiating', 'suspended'].includes(s)) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    if (['cancelled', 'rejected', 'banned', 'flagged'].includes(s)) return 'bg-red-500/10 text-red-400 border border-red-500/20'
    
    // Roles
    if (s === 'influencer') return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
    if (s === 'client') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    if (s === 'admin') return 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
    
    return 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase inline-flex items-center justify-center whitespace-nowrap ${getColors()}`}>
      {status}
    </span>
  )
}
