import { useState } from 'react'
import useChat from '../hooks/useChat'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'

const ChatPage = () => {
  const { messages, loading, connected, error, sendMessage } = useChat()
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('chat_username') || ''
  })
  const [usernameInput, setUsernameInput] = useState('')
  const [sending, setSending] = useState(false)

  // Nếu chưa có username thì hiện form nhập tên
  if (!username) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-slide-up">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👤</div>
            <h2 className="text-xl font-bold text-white">Chào mừng bạn!</h2>
            <p className="text-slate-400 text-sm mt-1">Nhập tên của bạn để bắt đầu chat</p>
          </div>

          <form
            id="username-form"
            onSubmit={(e) => {
              e.preventDefault()
              const name = usernameInput.trim()
              if (!name) return
              localStorage.setItem('chat_username', name)
              setUsername(name)
            }}
          >
            <input
              id="username-input"
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Tên của bạn..."
              maxLength={30}
              autoFocus
              className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all mb-4"
            />
            <button
              id="username-submit"
              type="submit"
              disabled={!usernameInput.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold hover:from-sky-400 hover:to-indigo-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              Vào Chat 🚀
            </button>
          </form>
        </div>
      </div>
    )
  }

  const handleSend = async (content) => {
    if (sending) return
    setSending(true)
    try {
      await sendMessage(content, username)
    } catch (_) {
      // error đã được handle trong hook
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Chat Header */}
      <div className="glass border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-lg">
            💬
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">Chat Chung</h2>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 pulse-dot' : 'bg-red-500'}`} />
              <span className={`text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                {connected ? 'Đang kết nối' : 'Mất kết nối'}
              </span>
            </div>
          </div>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="text-slate-300 text-sm font-medium">{username}</span>
          </div>
          <button
            id="logout-button"
            onClick={() => {
              localStorage.removeItem('chat_username')
              setUsername('')
            }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-700/50"
          >
            Đổi tên
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-3 px-4 py-2.5 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} currentUser={username} loading={loading} />

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={sending || !connected} />
    </div>
  )
}

export default ChatPage
