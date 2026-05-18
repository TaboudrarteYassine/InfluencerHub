import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '@/services/api'
import { Search, Command, User, Target, MessageSquare, Loader2 } from 'lucide-react'

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true)
        try {
          const res = await adminApi.search(query)
          setResults(res.data.data || [])
          setSelectedIndex(0)
        } catch (error) {
          console.error(error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleKeyDown = (e) => {
    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    }
  }

  const handleSelect = (item) => {
    setIsOpen(false)
    navigate(item.link)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 sm:px-0">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-[#111111] border border-[#2a2a2a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col transform transition-all">
        <div className="flex items-center px-4 py-4 border-b border-[#1f1f1f] bg-[#0a0a0a]">
          <Search className="w-5 h-5 text-slate-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search users, campaigns, reviews..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-600 text-lg"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-violet-500 animate-spin mr-3" />}
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-slate-400 font-mono">
            <Command className="w-3 h-3" /> K
          </div>
        </div>

        {query.length >= 2 && results.length === 0 && !isLoading && (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <Search className="w-8 h-8 opacity-20" />
            <p>No results found for "{query}"</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {results.map((item, index) => {
              const Icon = item.type === 'user' ? User : item.type === 'campaign' ? Target : MessageSquare
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex ? 'bg-violet-500/10 text-violet-400 border-l-2 border-violet-500' : 'text-slate-300 hover:bg-[#1a1a1a] border-l-2 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-4 opacity-70" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="text-xs opacity-60 truncate mt-0.5">{item.subtitle}</div>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-40 ml-4 px-2 py-1 rounded bg-[#1f1f1f]">
                    {item.type}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
