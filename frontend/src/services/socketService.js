import { io } from 'socket.io-client'

let socket = null

/**
 * Lấy socket instance (singleton)
 */
export const getSocket = () => {
  if (!socket) {
    socket = io('http://localhost:5000', {
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
