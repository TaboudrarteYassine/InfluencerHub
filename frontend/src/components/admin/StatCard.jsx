import { motion } from 'framer-motion'

export default function StatCard({ label, value, icon: Icon, colorClass = "text-violet-400 bg-violet-500/10", trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111111] border border-[#1f1f1f] hover:border-[#2a2a2a] rounded-xl p-6 transition-all duration-300 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
            trend >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <h3 className="font-display font-bold text-3xl text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
      </div>
    </motion.div>
  )
}
