import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { Send, MessageSquare, Clock, User, X, Loader2 } from 'lucide-react'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, socket, connected } = useAuth()
  const [request, setRequest] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!socket || !user || !connected) return

    // Auto-request support state if user is authenticated (only check, do not create)
    if (user.role === 'USER') {
      socket.emit('request_support', { userId: user.id, create: false })
    }

    socket.on('support_request_status', (data) => {
      setRequest(data)
      setMessages(data.messages || [])
    })

    socket.on('support_request_accepted', (data) => {
      setRequest(data)
    })

    socket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message])
    })

    socket.on('support_request_closed', () => {
      setRequest(null)
      setMessages([])
    })

    return () => {
      socket.off('support_request_status')
      socket.off('support_request_accepted')
      socket.off('receive_message')
      socket.off('support_request_closed')
    }
  }, [socket, user, connected])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleRequestSupport = () => {
    if (!user) {
      return alert('Vui lòng đăng nhập để yêu cầu hỗ trợ.')
    }
    if (!socket || !connected) {
      return alert('Đang kết nối đến máy chủ hỗ trợ. Vui lòng đợi trong giây lát!')
    }
    setLoading(true)
    socket.emit('request_support', { userId: user.id })
    setTimeout(() => setLoading(false), 1000)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim() || !request || request.status !== 'ACTIVE') return
    if (!socket || !connected) {
      return alert('Mất kết nối với máy chủ. Không thể gửi tin nhắn lúc này!')
    }

    socket.emit('send_message', {
      requestId: request.id,
      senderId: user.id,
      content: inputText
    })
    setInputText('')
  }

  if (user && (user.role === 'STAFF' || user.role === 'ADMIN')) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[380px] h-[550px] max-h-[80vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-red-800 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                  🥩
                </div>
                <div>
                  <h4 className="font-bold text-sm">Hỗ trợ khách hàng</h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`} />
                    <span className="text-[10px] text-white/70">
                      {connected ? 'Trực tuyến' : 'Đang kết nối...'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
              {!user ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <User size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-6">Bạn cần đăng nhập để bắt đầu trò chuyện hỗ trợ.</p>
                  <a href="/login" className="w-full py-3 bg-red-800 text-white font-bold rounded-xl hover:bg-red-900 transition shadow-lg">
                    Đăng nhập ngay
                  </a>
                </div>
              ) : !request ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare size={48} className="text-red-100 mb-4" />
                  <h5 className="font-bold text-gray-800 mb-2">Xin chào {user.fullName}!</h5>
                  <p className="text-sm text-gray-500 mb-8">
                    Chúng tôi luôn sẵn sàng hỗ trợ bạn. Nhấn nút bên dưới để bắt đầu.
                  </p>
                  <button
                    onClick={handleRequestSupport}
                    disabled={loading}
                    className="w-full py-3 bg-red-800 text-white font-bold rounded-xl hover:bg-red-900 transition shadow-lg disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : 'YÊU CẦU HỖ TRỢ'}
                  </button>
                </div>
              ) : request.status === 'WAITING' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="relative mb-6">
                    <Clock size={64} className="text-red-100" />
                    <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                  </div>
                  <h5 className="font-bold text-gray-800 mb-2">Đang kết nối...</h5>
                  <p className="text-sm text-gray-500">
                    Vui lòng đợi trong giây lát, nhân viên sẽ hỗ trợ bạn ngay.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-2 bg-white border-b flex items-center gap-2 px-4">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[10px] text-green-700 font-bold">
                      {request.assignedStaff?.fullName[0]}
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      Nhân viên <strong>{request.assignedStaff?.fullName}</strong> đang trả lời
                    </span>
                  </div>
                  <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          msg.senderId === user.id 
                            ? 'bg-red-800 text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 rounded-tl-none border shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập nội dung..."
                      className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <button type="submit" className="w-10 h-10 rounded-full bg-red-800 text-white flex items-center justify-center hover:bg-red-900 transition">
                      <Send size={18} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-red-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-red-900 transition-colors"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </motion.button>
    </div>
  )
}

export default ChatWidget
