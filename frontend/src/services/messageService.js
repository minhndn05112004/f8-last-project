import axios from 'axios'

const BASE_URL = '/api'

const messageService = {
  /**
   * Lấy danh sách tin nhắn
   * @returns {Promise<Array>}
   */
  getMessages: async () => {
    const res = await axios.get(`${BASE_URL}/messages`)
    return res.data.data
  },

  /**
   * Gửi tin nhắn mới
   * @param {string} content - Nội dung tin nhắn
   * @param {string} username - Tên người dùng
   * @returns {Promise<Object>}
   */
  sendMessage: async (content, username) => {
    const res = await axios.post(`${BASE_URL}/messages`, { content, username })
    return res.data.data
  },
}

export default messageService
