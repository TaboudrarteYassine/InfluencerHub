import { useQuery } from '@tanstack/react-query'
import { influencerApi } from '@/services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Play, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function PortfolioGrid({ userId }) {
  const [selectedItem, setSelectedItem] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => influencerApi.getPortfolio(userId),
    select: res => res.data.data?.items || []
  })

  if (isLoading) return (
    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>
  )

  if (!data || data.length === 0) return (
    <div className="glass border border-white/8 rounded-2xl p-12 text-center">
      <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <p className="text-slate-400 font-medium">No portfolio items yet.</p>
    </div>
  )

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-white/10 bg-slate-900"
            onClick={() => setSelectedItem(item)}
          >
            {item.media_type === 'image' && (
              <img src={item.media_url.startsWith('http') ? item.media_url : `/storage/${item.media_url}`} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            )}
            {item.media_type === 'video' && (
              <div className="w-full h-full relative">
                <video src={item.media_url.startsWith('http') ? item.media_url : `/storage/${item.media_url}`} className="w-full h-full object-cover" muted loop playsInline />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="w-10 h-10 text-white opacity-80" />
                </div>
              </div>
            )}
            {item.media_type === 'link' && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-brand-900/50 to-slate-900">
                <ExternalLink className="w-8 h-8 text-brand-400 mb-2" />
                <span className="text-white font-medium line-clamp-2">{item.title}</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <h4 className="text-white font-semibold line-clamp-1">{item.title}</h4>
              {item.media_type !== 'link' && <p className="text-slate-300 text-xs flex items-center gap-1 mt-1 capitalize"><ImageIcon className="w-3 h-3" /> {item.media_type}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 max-w-4xl w-full">
              <div className="bg-black border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row">
                <div className="md:w-2/3 bg-black flex items-center justify-center min-h-[300px]">
                  {selectedItem.media_type === 'image' && (
                    <img src={selectedItem.media_url.startsWith('http') ? selectedItem.media_url : `/storage/${selectedItem.media_url}`} className="max-w-full max-h-[80vh] object-contain" />
                  )}
                  {selectedItem.media_type === 'video' && (
                    <video src={selectedItem.media_url.startsWith('http') ? selectedItem.media_url : `/storage/${selectedItem.media_url}`} controls className="w-full max-h-[80vh] object-contain" />
                  )}
                  {selectedItem.media_type === 'link' && (
                    <div className="p-12 text-center">
                      <ExternalLink className="w-16 h-16 text-brand-400 mx-auto mb-4" />
                      <a href={selectedItem.external_url || selectedItem.media_url} target="_blank" rel="noopener noreferrer" className="btn-glow px-6 py-2 rounded-xl text-white inline-block">Visit External Link</a>
                    </div>
                  )}
                </div>
                <div className="md:w-1/3 p-6 glass flex flex-col">
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedItem.title}</h3>
                  <p className="text-slate-400 text-sm whitespace-pre-wrap flex-1">{selectedItem.description}</p>
                  
                  {selectedItem.external_url && (
                    <a href={selectedItem.external_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10">
                      <ExternalLink className="w-4 h-4" /> View Live
                    </a>
                  )}
                  <button onClick={() => setSelectedItem(null)} className="mt-4 w-full py-3 text-slate-400 hover:text-white transition-colors">Close</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
