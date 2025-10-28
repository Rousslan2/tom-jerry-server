# 🌐 Online Multiplayer Setup Guide

This game uses Socket.io for real-time online multiplayer. To make it work, you need a Socket.io server.

## Option 1: Use Glitch (FREE & EASY) ⭐

Glitch provides free hosting for Node.js apps, perfect for a Socket.io server!

### Step-by-Step Instructions:

1. **Go to Glitch.com**
   - Visit: https://glitch.com
   - Click "New Project" → "glitch-hello-node"

2. **Replace server.js with this code:**

```javascript
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Store active game rooms
const rooms = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create a new game room
  socket.on('createRoom', () => {
    const roomCode = generateRoomCode();
    rooms.set(roomCode, {
      host: socket.id,
      players: [socket.id],
      gameState: null
    });
    
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode });
    console.log(`Room ${roomCode} created by ${socket.id}`);
  });

  // Join existing room
  socket.on('joinRoom', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('roomError', { message: 'Room not found' });
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('roomError', { message: 'Room is full' });
      return;
    }
    
    room.players.push(socket.id);
    socket.join(roomCode);
    
    socket.emit('roomJoined', { roomCode });
    
    // Notify host that opponent joined
    socket.to(roomCode).emit('opponentJoined', {
      opponentId: socket.id
    });
    
    console.log(`Player ${socket.id} joined room ${roomCode}`);
  });

  // Update game state
  socket.on('updateGameState', ({ roomCode, gameState }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.gameState = gameState;
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
    console.log('Player disconnected:', socket.id);
    
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
    console.log(`Room ${roomCode} deleted`);
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

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    activeRooms: rooms.size,
    players: Array.from(rooms.values()).reduce((total, room) => total + room.players.length, 0)
  });
});

server.listen(PORT, () => {
  console.log(`🎮 Game server running on port ${PORT}`);
});
```

3. **Update package.json:**

Make sure `package.json` includes:
```json
{
  "name": "game-multiplayer-server",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1"
  }
}
```

4. **Get your Glitch URL:**
   - Glitch will give you a URL like: `https://your-project-name.glitch.me`
   - Copy this URL

5. **Update the game code:**
   - Open `src/services/MultiplayerService.js`
   - Change line 31:
   ```javascript
   connect(serverUrl = 'https://YOUR-PROJECT-NAME.glitch.me') {
   ```

6. **Test it!**
   - Your game should now connect to your Glitch server
   - Open the game in 2 different browsers
   - Create room in one, join with the code in the other
   - Play together online! 🎉

## Option 2: Use Other Free Services

### Railway.app
- Free tier: https://railway.app
- Deploy the same Socket.io server code

### Render.com
- Free tier: https://render.com
- Deploy as Web Service

### Heroku (Limited Free)
- https://heroku.com
- May require credit card verification

## Option 3: Use Gambo's Built-in Server (Coming Soon)

We're working on providing a built-in multiplayer server directly in Gambo AI!

---

## Troubleshooting

### "Connection timeout"
- Make sure your Glitch project is running (visit the URL in browser)
- Check that CORS is enabled in server code
- Glitch free tier sleeps after inactivity - visit the URL to wake it up

### "Room not found"
- Room codes are case-sensitive
- Rooms expire when all players leave
- Make sure both players are connected to the same server

### Still not working?
- Check browser console for errors
- Verify Socket.io versions match (client & server)
- Test server health by visiting the URL directly

---

## Current Configuration

The game is currently configured to connect to:
```
https://tom-jerry-multiplayer.glitch.me
```

### How It Works:

1. **Automatic Fallback System** ✨
   - The game **automatically tries to connect** to the online server
   - If connection **succeeds** → **ONLINE MODE** 🌍 (Play from anywhere!)
   - If connection **fails** → **LOCAL MODE** 📱 (2 tabs in same browser)

2. **Visual Indicator**
   - **Green "✅ ONLINE MODE"** = Real online multiplayer active
   - **Orange "📱 LOCAL MODE"** = Fallback to same-browser mode

3. **No Configuration Needed!**
   - Just deploy the server to Glitch
   - Game will automatically detect and use it
   - Users don't need to change anything

### Setting Up Your Own Server:

You need to either:
1. **Create your own Glitch project** with the code above, OR
2. **Change the server URL** in `src/services/MultiplayerService.js` line 36:
   ```javascript
   const defaultServerUrl = 'https://YOUR-PROJECT-NAME.glitch.me'
   ```

### Testing Different Modes:

**Test ONLINE mode:**
- Deploy server to Glitch
- Open game on 2 different computers/phones
- Create room → Share code → Join → Play! 🎮

**Test LOCAL mode:**
- Turn off server (or change URL to invalid)
- Open game in 2 tabs of same browser
- Create room → Join from other tab → Play! 🎮

---

Enjoy playing Tom vs Jerry online with friends! 🐭🐱
