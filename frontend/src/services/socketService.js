import { io } from 'socket.io-client'

let socket = null

// Đọc từ env → fallback về production server
const SOCKET_SERVER_URL =
  import.meta.env.VITE_API_URL ||
  'https://f8-last-project.onrender.com'

/**
 * Lấy socket instance (singleton)
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
  }
  return socket
}

/**
 * Ngắt kết nối socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
