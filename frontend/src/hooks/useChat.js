import { useState, useEffect, useCallback } from 'react'
import messageService from '../services/messageService'
import { getSocket, disconnectSocket } from '../services/socketService'

/**
 * Custom hook quản lý messages + WebSocket realtime
 */
const useChat = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)

  // Tải messages ban đầu
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true)
        const data = await messageService.getMessages()
        setMessages(data)
      } catch (err) {
        setError('Không thể tải tin nhắn. Hãy kiểm tra backend!')
        console.error('fetchMessages error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [])

  // Thiết lập Socket.io
  useEffect(() => {
    const socket = getSocket()

    socket.on('connect', () => {
      setConnected(true)
      setError(null)
      console.log('✅ Socket connected:', socket.id)
    })

    socket.on('disconnect', () => {
      setConnected(false)
      console.log('❌ Socket disconnected')
    })

    socket.on('connect_error', (err) => {
      setConnected(false)
      setError('Mất kết nối realtime. Đang thử lại...')
      console.error('Socket connect error:', err)
    })

    // Nhận tin nhắn mới từ server
    socket.on('newMessage', (message) => {
      setMessages((prev) => {
        // Tránh duplicate nếu message đã tồn tại
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.off('newMessage')
      disconnectSocket()
    }
  }, [])

  // Gửi tin nhắn
  const sendMessage = useCallback(async (content, username) => {
    try {
      await messageService.sendMessage(content, username)
      // Không cần thêm vào state thủ công - socket sẽ broadcast về
    } catch (err) {
      setError('Gửi tin nhắn thất bại!')
      console.error('sendMessage error:', err)
      throw err
    }
  }, [])

  return { messages, loading, connected, error, sendMessage }
}

export default useChat
