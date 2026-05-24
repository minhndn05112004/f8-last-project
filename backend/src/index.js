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

// Setup root namespace for general real-time events (like payments)
io.on('connection', (socket) => {
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
  });
  socket.on('join_staff_dashboard', () => {
    socket.join('staff_dashboard');
  });
});

// Setup chat namespace
app.set('io', io);
setupChatSocket(io);

// ─── Start Server ─────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log('');
  console.log('🥩 ════════════════════════════════════════');
  console.log(`🚀  Meat Shop API running on port ${PORT}`);
  console.log(`📡  http://localhost:${PORT}`);
  console.log(`🔌  Socket.io chat: /chat namespace`);
  
  const sepayKey = process.env.SEPAY_API_KEY;
  if (sepayKey === undefined) {
    console.log("SEPAY API: undefined");
  } else if (sepayKey.trim() === "") {
    console.log("SEPAY API: empty");
  } else {
    console.log(`SEPAY API: loaded (${sepayKey.substring(0, 8)}...)`);
  }
  
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
