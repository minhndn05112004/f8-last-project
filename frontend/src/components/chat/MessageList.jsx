import { useEffect, useRef } from 'react'

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const MessageItem = ({ message, currentUser }) => {
  const isOwn = message.user.username === currentUser

  return (
    <div className={`flex gap-2.5 px-4 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-1">
          {message.user.username.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider">
            {message.user.username}
          </span>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
          isOwn
            ? 'bg-red-800 text-white rounded-tr-sm'
            : 'bg-white text-slate-700 rounded-tl-sm border border-slate-100'
        }`}>
          {message.content}
        </div>
        <span className="text-[10px] text-slate-400 px-1">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  )
}

const MessageList = ({ messages, currentUser, loading }) => {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-red-800 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-40">
        <div className="text-4xl mb-2">🍖</div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Chưa có tin nhắn nào</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pt-4 flex flex-col" id="message-list">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} currentUser={currentUser} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
