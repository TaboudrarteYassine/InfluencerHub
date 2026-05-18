import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { chatApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { initEcho } from '@/lib/echo'
import { Send, Paperclip, Loader2, MessageCircle, Check, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import ReportModal from '@/components/modals/ReportModal'
import { MoreVertical, AlertTriangle } from 'lucide-react'

function MessageBubble({ msg, isMe }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 mb-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 self-end">
        {msg.sender?.name?.charAt(0) || '?'}
      </div>

      {/* Bubble */}
      <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMe
            ? 'bg-brand-600 text-white rounded-br-sm'
            : 'glass border border-white/8 text-slate-200 rounded-bl-sm'
        }`}>
          {msg.is_flagged ? (
            <span className="text-slate-500 italic text-xs">Message removed by moderation</span>
          ) : (
            <div className="space-y-2">
              {msg.attachment_path && msg.attachment_type === 'image' && (
                <a href={msg.attachment_path} target="_blank" rel="noreferrer">
                  <img src={msg.attachment_path} alt="Attachment" className="max-w-xs rounded-xl" />
                </a>
              )}
              {msg.attachment_path && msg.attachment_type !== 'image' && (
                <a href={msg.attachment_path} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg text-xs hover:bg-black/30 transition">
                  <Paperclip className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{msg.metadata?.original_name || 'File attachment'}</span>
                  <span className="text-slate-400">({Math.round((msg.metadata?.size || 0) / 1024)}KB)</span>
                </a>
              )}
              {msg.body && <p>{msg.body}</p>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-600 text-xs">
            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
          </span>
          {isMe && (
            msg.read_at
              ? <CheckCheck className="w-3 h-3 text-brand-400" />
              : <Check className="w-3 h-3 text-slate-600" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function ChatPage() {
  const { id: conversationId } = useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [remoteTyping, setRemoteTyping] = useState(false)
  const endRef = useRef(null)
  const typingTimeout = useRef(null)
  const remoteTypingTimeout = useRef(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // WebSockets and Read Receipt
  useEffect(() => {
    if (!conversationId) return

    // Mark as read when opened
    chatApi.markRead(conversationId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    })

    const echo = initEcho()
    const channel = echo.private(`conversation.${conversationId}`)

    channel.listen('.message.sent', (e) => {
      // Add message to cache if it's not ours
      if (e.message.sender_id !== user.id) {
        queryClient.setQueryData(['messages', conversationId], (old) => {
          if (!old) return old
          // Backend returns descending order usually, so we prepend
          // Let's check how it's handled. The API returns it, we just invalidate to be safe.
        })
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        
        // Mark as read immediately since we have it open
        chatApi.markRead(conversationId)
      }
    })

    channel.listen('.typing', (e) => {
      if (e.user_id !== user.id) {
        setRemoteTyping(e.is_typing)
        if (e.is_typing) {
          if (remoteTypingTimeout.current) clearTimeout(remoteTypingTimeout.current)
          remoteTypingTimeout.current = setTimeout(() => setRemoteTyping(false), 3000)
        }
      }
    })

    return () => {
      channel.stopListening('.message.sent')
      channel.stopListening('.typing')
      echo.leave(`conversation.${conversationId}`)
    }
  }, [conversationId, queryClient, user.id])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB')
      return
    }

    setUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('conversation_id', conversationId)

    try {
      await chatApi.uploadAttachment(formData)
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed')
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  // List of conversations
  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn:  () => chatApi.conversations(),
    select:   (res) => res.data.data,
    refetchInterval: 30000,
  })

  // Messages for selected conversation
  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn:  () => chatApi.messages(conversationId),
    enabled:  !!conversationId,
    select:   (res) => res.data.data,
    refetchInterval: 5000,
  })

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgData])

  const sendMutation = useMutation({
    mutationFn: (data) => chatApi.send(conversationId, data),
    onSuccess: () => {
      setMessage('')
      queryClient.invalidateQueries(['messages', conversationId])
      queryClient.invalidateQueries(['conversations'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send'),
  })

  const handleSend = () => {
    if (!message.trim() || !conversationId) return
    const fd = new FormData()
    fd.append('body', message.trim())
    fd.append('type', 'text')
    sendMutation.mutate(fd)
  }

  const handleTyping = () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    chatApi.typing(conversationId, true).catch(() => {})
    typingTimeout.current = setTimeout(() => {
      chatApi.typing(conversationId, false).catch(() => {})
    }, 2000)
  }

  const conversations = convData?.data || []
  const messages      = (msgData?.data || []).slice().reverse()

  const showSidebar = !isMobile || !conversationId
  const showChatArea = !isMobile || conversationId

  return (
    <div className={`flex gap-5 ${isMobile ? 'h-[calc(100vh-4rem)] -m-6' : 'h-[calc(100vh-5rem)]'}`}>
      {/* ── Conversations sidebar ── */}
      {showSidebar && (
        <div className={`${isMobile ? 'w-full rounded-none border-0' : 'w-72 border border-white/5 rounded-2xl'} flex-shrink-0 glass overflow-hidden flex flex-col`}>
          <div className="p-4 border-b border-white/5">
            <h2 className="text-white font-semibold text-sm">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-24 rounded" />
                      <div className="skeleton h-3 w-36 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other    = conv.participants?.find((p) => p.id !== user?.id)
                const lastMsg  = conv.last_message
                const isActive = conversationId === String(conv.id)

                return (
                  <a key={conv.id} href={`/chat/${conv.id}`}
                    className={`flex items-center gap-3 p-4 transition-all cursor-pointer ${
                      isActive ? 'bg-brand-600/15 border-l-2 border-brand-500' : 'hover:bg-white/5 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {other?.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{other?.name || 'Unknown'}</p>
                      <p className="text-slate-500 text-xs truncate">
                        {lastMsg?.body || 'No messages yet'}
                      </p>
                    </div>
                    {conv.last_message_at && (
                      <span className="text-slate-600 text-xs flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                      </span>
                    )}
                  </a>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── Message area ── */}
      {showChatArea && (
        conversationId ? (
          <div className={`flex-1 glass flex flex-col overflow-hidden ${isMobile ? 'rounded-none border-0' : 'border border-white/5 rounded-2xl'}`}>
          {/* Header */}
          {(() => {
            const activeConv = conversations.find(c => String(c.id) === conversationId)
            const otherUser = activeConv?.participants?.find(p => p.id !== user?.id)
            
            return (
              <div className="p-4 border-b border-white/5 flex items-center gap-3 relative">
                {isMobile && (
                  <a href="/chat" className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </a>
                )}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                  {otherUser?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{otherUser?.name || 'Conversation'}</p>
                  <p className="text-green-400 text-xs">Online</p>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowMenu(!showMenu)} 
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 mt-2 w-48 bg-[#111111] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setShowMenu(false)
                            setIsReportModalOpen(true)
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition flex items-center gap-2"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Report User
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {otherUser && (
                  <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    reportedUserId={otherUser.id}
                  />
                )}
              </div>
            )
          })()}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5">
            {msgLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_id === user?.id} />
              ))
            )}
            
            <AnimatePresence>
              {remoteTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex gap-2 mb-3 items-end"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    ...
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 rounded-bl-sm text-xs flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    Typing...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <button disabled={uploadingFile} className="w-10 h-10 rounded-xl glass border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition">
                  {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </button>
                <input type="file" onChange={handleFileUpload} disabled={uploadingFile} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="flex-1 relative">
                <input
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); handleTyping() }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message…"
                  className="input-base pr-10"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending || uploadingFile}
                className="btn-glow w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50"
              >
                {sendMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                  : <Send className="w-4 h-4 relative z-10" />
                }
              </button>
            </div>
          </div>
        </div>
        ) : (
          <div className={`flex-1 glass flex flex-col items-center justify-center ${isMobile ? 'hidden' : 'border border-white/5 rounded-2xl'}`}>
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-slate-700 mb-4 mx-auto" />
              <p className="text-slate-500 font-medium">Select a conversation</p>
              <p className="text-slate-600 text-sm mt-1">Choose from the left to start chatting</p>
            </div>
          </div>
        )
      )}
    </div>
  )
}
