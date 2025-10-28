// Socket.io Game Server for Tom vs Jerry Online Multiplayer
// ES Module version for Railway deployment

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Store active game rooms
const rooms = new Map();

console.log('🎮 Tom vs Jerry Game Server Starting...');

// ⭐ IMPORTANT: Servir les fichiers statiques du jeu
// Vite build génère les fichiers dans le dossier 'dist'
app.use(express.static(join(__dirname, 'dist')));

// ⭐ Route catch-all pour servir index.html (SPA)
app.get('*', (req, res, next) => {
  // Ne pas intercepter les routes API
  if (req.path.startsWith('/rooms') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ Player connected:', socket.id);

  // Create a new game room
  socket.on('createRoom', () => {
    const roomCode = generateRoomCode();
    rooms.set(roomCode, {
      host: socket.id,
      players: [socket.id],
      gameState: null,
      createdAt: Date.now()
    });
    
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode });
    console.log(`🎮 Room ${roomCode} created by ${socket.id}`);
  });

  // Join existing room
  socket.on('joinRoom', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('roomError', { message: 'Room not found' });
      console.log(`❌ Room ${roomCode} not found`);
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('roomError', { message: 'Room is full' });
      console.log(`❌ Room ${roomCode} is full`);
      return;
    }
    
    room.players.push(socket.id);
    socket.join(roomCode);
    
    socket.emit('roomJoined', { roomCode });
    
    // Notify host that opponent joined
    socket.to(roomCode).emit('opponentJoined', {
      opponentId: socket.id
    });
    
    console.log(`👥 Player ${socket.id} joined room ${roomCode}`);
  });

  // Update game state
  socket.on('updateGameState', ({ roomCode, gameState }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.gameState = gameState;
      room.lastUpdate = Date.now();
      socket.to(roomCode).emit('gameStateUpdate', gameState);
    }
  });

  // Send game action
  socket.on('gameAction', ({ roomCode, action }) => {
    socket.to(roomCode).emit('gameAction', action);
  });

  // Leave room
  socket.on('leaveRoom', ({ roomCode }) => {
    handleLeaveRoom(socket, roomCode);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('❌ Player disconnected:', socket.id);
    
    // Find and clean up rooms
    rooms.forEach((room, roomCode) => {
      if (room.players.includes(socket.id)) {
        handleLeaveRoom(socket, roomCode);
      }
    });
  });
});

// Helper function to handle leaving rooms
function handleLeaveRoom(socket, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  
  socket.to(roomCode).emit('opponentLeft');
  
  // Remove player from room
  room.players = room.players.filter(id => id !== socket.id);
  
  // Delete room if empty
  if (room.players.length === 0) {
    rooms.delete(roomCode);
    console.log(`🗑️  Room ${roomCode} deleted (empty)`);
  }
}

// Generate random 4-letter room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Make sure code is unique
  return rooms.has(code) ? generateRoomCode() : code;
}

// Clean up old rooms every 30 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  rooms.forEach((room, roomCode) => {
    if (now - room.createdAt > maxAge) {
      rooms.delete(roomCode);
      console.log(`🧹 Cleaned up old room ${roomCode}`);
    }
  });
}, 30 * 60 * 1000);

// API endpoint to get room info (for debugging)
app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([code, room]) => ({
    code,
    players: room.players.length,
    host: room.host,
    age: Math.floor((Date.now() - room.createdAt) / 1000) + 's'
  }));
  
  res.json({
    total: rooms.size,
    rooms: roomList
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Tom vs Jerry Game Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
});
