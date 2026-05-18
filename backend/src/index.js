require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { setupChatSocket } = require('./sockets/chat.socket');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── HTTP Server ─────────────────────────────────────────────────────────────

const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Setup chat namespace
setupChatSocket(io);

// ─── Start Server ─────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log('');
  console.log('🥩 ════════════════════════════════════════');
  console.log(`🚀  Meat Shop API running on port ${PORT}`);
  console.log(`📡  http://localhost:${PORT}`);
  console.log(`🔌  Socket.io chat: /chat namespace`);
  console.log('🥩 ════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});
