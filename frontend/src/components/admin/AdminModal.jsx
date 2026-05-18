import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function AdminModal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`bg-[#111111] border border-[#2a2a2a] shadow-2xl rounded-2xl w-full ${maxWidth} overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]`}
            >
              <div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center justify-between shrink-0 bg-[#151515]">
                <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors bg-[#1a1a1a] hover:bg-[#2a2a2a] p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
