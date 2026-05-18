export default function ScoreBadge({ score, suffix = '' }) {
  const numScore = Number(score)
  
  let colorClass = 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
  
  if (numScore >= 70) {
    colorClass = 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_var(--tw-shadow-color)] shadow-green-500/10'
  } else if (numScore >= 40) {
    colorClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  } else {
    colorClass = 'bg-red-500/10 text-red-400 border border-red-500/20'
  }

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono inline-flex items-center justify-center min-w-[3rem] ${colorClass}`}>
      {numScore.toFixed(0)}{suffix}
    </span>
  )
}
