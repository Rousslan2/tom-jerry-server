import { io } from 'socket.io-client'

/**
 * Online Multiplayer Service
 * Uses public Socket.io server for game rooms
 */
class MultiplayerService {
  constructor() {
    this.socket = null
    this.roomCode = null
    this.playerId = null
    this.isHost = false
    this.connected = false
    this.opponent = null
    
    // Event callbacks
    this.onConnected = null
    this.onRoomCreated = null
    this.onRoomJoined = null
    this.onOpponentJoined = null
    this.onOpponentLeft = null
    this.onGameStateUpdate = null
    this.onGameAction = null
    this.onError = null
  }

  /**
   * Connect to Socket.io server
   * Works with any standard Socket.io server or uses built-in P2P fallback
   */
  connect(serverUrl = null) {
    return new Promise((resolve) => {
      console.log('🎮 Initializing online multiplayer...')
      
      // Default server URL - try online server first
      const defaultServerUrl = 'https://tom-jerry-server-production.up.railway.app'
      const url = serverUrl || defaultServerUrl
      
      console.log('🌐 Connecting to server:', url)
      
      try {
        // Try to connect to real Socket.io server
        this.socket = io(url, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 3,
          timeout: 5000
        })
        
        // Connection successful
        this.socket.on('connect', () => {
          this.connected = true
          this.playerId = this.socket.id
          this.useOnlineServer = true
          
          console.log('✅ Connected to online server! Player ID:', this.playerId)
          
          if (this.onConnected) {
            this.onConnected()
          }
          
          this.setupEventListeners()
          resolve(this.playerId)
        })
        
        // Connection failed - fallback to local mode
        this.socket.on('connect_error', (error) => {
          console.warn('⚠️ Cannot connect to online server:', error.message)
          console.log('📱 Falling back to LOCAL mode (same browser only)')
          
          // Cleanup socket
          if (this.socket) {
            this.socket.close()
            this.socket = null
          }
          
          // Fallback to local P2P mode
          this.useOnlineServer = false
          this.connected = true
          this.playerId = 'player_' + Math.random().toString(36).substr(2, 9)
          
          console.log('✅ Local multiplayer ready! Player ID:', this.playerId)
          
          if (this.onConnected) {
            this.onConnected()
          }
          
          this.setupP2PRooms()
          resolve(this.playerId)
        })
        
        // Timeout fallback
        setTimeout(() => {
          if (!this.connected) {
            console.warn('⏱️ Connection timeout - using local mode')
            
            if (this.socket) {
              this.socket.close()
              this.socket = null
            }
            
            this.useOnlineServer = false
            this.connected = true
            this.playerId = 'player_' + Math.random().toString(36).substr(2, 9)
            
            if (this.onConnected) {
              this.onConnected()
            }
            
            this.setupP2PRooms()
            resolve(this.playerId)
          }
        }, 6000)
        
      } catch (error) {
        console.error('❌ Error initializing socket:', error)
        
        // Fallback to local mode
        this.useOnlineServer = false
        this.connected = true
        this.playerId = 'player_' + Math.random().toString(36).substr(2, 9)
        
        if (this.onConnected) {
          this.onConnected()
        }
        
        this.setupP2PRooms()
        resolve(this.playerId)
      }
    })
  }

  /**
   * Setup peer-to-peer room system (works without external server)
   */
  setupP2PRooms() {
    // Use localStorage for persistence
    this.roomStorage = window.localStorage
    
    // Use BroadcastChannel for reliable cross-tab communication
    try {
      this.broadcastChannel = new BroadcastChannel('tom_jerry_multiplayer')
      
      this.broadcastChannel.onmessage = (event) => {
        console.log('📡 Received broadcast:', event.data)
        this.handleBroadcastMessage(event.data)
      }
      
      console.log('✅ BroadcastChannel created successfully')
    } catch (error) {
      console.warn('⚠️ BroadcastChannel not supported, falling back to localStorage')
      
      // Fallback to storage events
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('gameRoom_')) {
          this.handleRoomUpdate(e)
        }
      })
    }
  }
  
  /**
   * Handle broadcast messages from other tabs
   */
  handleBroadcastMessage(data) {
    if (!data || !data.type) return
    
    switch(data.type) {
      case 'roomCreated':
        console.log('🔔 Room created broadcast:', data.roomCode)
        // Store in localStorage so JOIN can find it
        if (!this.roomStorage.getItem(`gameRoom_${data.roomCode}`)) {
          this.roomStorage.setItem(`gameRoom_${data.roomCode}`, JSON.stringify(data.roomData))
        }
        break
        
      case 'opponentJoined':
        if (this.roomCode === data.roomCode && this.isHost) {
          console.log('🔔 Opponent joined:', data.playerId)
          this.opponent = data.playerId
          if (this.onOpponentJoined) {
            this.onOpponentJoined({ opponentId: data.playerId })
          }
        }
        break
        
      case 'gameState':
        if (this.roomCode === data.roomCode && data.playerId !== this.playerId) {
          if (this.onGameStateUpdate) {
            this.onGameStateUpdate(data.state)
          }
        }
        break
        
      case 'gameAction':
        if (this.roomCode === data.roomCode && data.playerId !== this.playerId) {
          if (this.onGameAction) {
            this.onGameAction(data.actionData)
          }
        }
        break
        
      case 'opponentLeft':
        if (this.roomCode === data.roomCode) {
          console.log('👋 Opponent left')
          this.opponent = null
          if (this.onOpponentLeft) {
            this.onOpponentLeft()
          }
        }
        break
    }
  }

  /**
   * Handle room updates from other tabs/windows
   */
  handleRoomUpdate(event) {
    if (!event.newValue) return
    
    try {
      // Check for notification triggers
      if (event.key && event.key.includes('_notification')) {
        const data = JSON.parse(event.newValue)
        
        if (data.action === 'opponentJoined') {
          console.log('🔔 Notification: Opponent joined!', data.playerId)
          this.opponent = data.playerId
          if (this.onOpponentJoined) {
            this.onOpponentJoined({ opponentId: data.playerId })
          }
        }
        return
      }
      
      // Handle game state and action updates
      const data = JSON.parse(event.newValue)
      
      if (data.action === 'gameState') {
        if (data.playerId !== this.playerId && this.onGameStateUpdate) {
          this.onGameStateUpdate(data.state)
        }
      } else if (data.action === 'gameAction') {
        if (data.playerId !== this.playerId && this.onGameAction) {
          this.onGameAction(data.actionData)
        }
      } else if (data.action === 'opponentLeft') {
        console.log('👋 Opponent left the game')
        this.opponent = null
        if (this.onOpponentLeft) {
          this.onOpponentLeft()
        }
      }
    } catch (error) {
      console.warn('⚠️ Error handling room update:', error)
    }
  }

  /**
   * Setup all socket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return
    
    // Room created successfully
    this.socket.on('roomCreated', (data) => {
      console.log('🎮 Room created:', data.roomCode)
      this.roomCode = data.roomCode
      this.isHost = true
      
      if (this.onRoomCreated) {
        this.onRoomCreated(data.roomCode)
      }
    })

    // Successfully joined room
    this.socket.on('roomJoined', (data) => {
      console.log('🎮 Joined room:', data.roomCode)
      this.roomCode = data.roomCode
      this.isHost = false
      
      if (this.onRoomJoined) {
        this.onRoomJoined(data)
      }
    })

    // Opponent joined
    this.socket.on('opponentJoined', (data) => {
      console.log('👥 Opponent joined:', data.opponentId)
      this.opponent = data.opponentId
      
      if (this.onOpponentJoined) {
        this.onOpponentJoined(data)
      }
    })

    // Opponent left
    this.socket.on('opponentLeft', () => {
      console.log('👋 Opponent left')
      this.opponent = null
      
      if (this.onOpponentLeft) {
        this.onOpponentLeft()
      }
    })

    // Receive game state update
    this.socket.on('gameStateUpdate', (data) => {
      if (this.onGameStateUpdate) {
        this.onGameStateUpdate(data)
      }
    })

    // Receive game action
    this.socket.on('gameAction', (data) => {
      if (this.onGameAction) {
        this.onGameAction(data)
      }
    })

    // Room error
    this.socket.on('roomError', (data) => {
      console.error('Room error:', data.message)
      
      if (this.onError) {
        this.onError(data.message)
      }
    })
  }

  /**
   * Create a new game room
   */
  createRoom() {
    if (!this.connected) {
      console.error('Not connected')
      return
    }

    // Use online server if available
    if (this.useOnlineServer && this.socket && this.socket.connected) {
      console.log('🌐 Creating room on ONLINE server...')
      this.socket.emit('createRoom')
      return
    }

    // Fallback to local mode
    console.log('📱 Creating room in LOCAL mode (same browser only)...')
    
    // Generate room code
    const roomCode = this.generateRoomCode()
    this.roomCode = roomCode
    this.isHost = true
    
    // Save to localStorage
    const roomData = {
      host: this.playerId,
      players: [this.playerId],
      createdAt: Date.now()
    }
    
    this.roomStorage.setItem(`gameRoom_${roomCode}`, JSON.stringify(roomData))
    
    console.log('🎮 Room created:', roomCode)
    console.log('📦 Room data saved to localStorage')
    
    // Broadcast to other tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'roomCreated',
        roomCode: roomCode,
        roomData: roomData,
        timestamp: Date.now()
      })
      console.log('📡 Broadcast sent: roomCreated')
    }
    
    if (this.onRoomCreated) {
      this.onRoomCreated(roomCode)
    }
  }

  /**
   * Join existing room with code
   */
  joinRoom(roomCode) {
    if (!this.connected) {
      console.error('Not connected')
      return
    }

    roomCode = roomCode.toUpperCase()
    
    // Use online server if available
    if (this.useOnlineServer && this.socket && this.socket.connected) {
      console.log('🌐 Joining room on ONLINE server:', roomCode)
      this.socket.emit('joinRoom', { roomCode })
      return
    }

    // Fallback to local mode
    console.log('📱 Joining room in LOCAL mode:', roomCode)
    
    const roomKey = `gameRoom_${roomCode}`
    const roomDataStr = this.roomStorage.getItem(roomKey)
    
    console.log('🔍 Looking for room:', roomCode)
    console.log('📦 Room data:', roomDataStr)
    
    if (!roomDataStr) {
      console.warn('⚠️ Room not found in this browser tab')
      
      // Show available rooms for debugging
      console.log('📋 Available rooms in this tab:')
      let hasRooms = false
      for (let i = 0; i < this.roomStorage.length; i++) {
        const key = this.roomStorage.key(i)
        if (key && key.startsWith('gameRoom_')) {
          console.log('  -', key.replace('gameRoom_', ''))
          hasRooms = true
        }
      }
      if (!hasRooms) {
        console.log('  (No rooms found)')
      }
      
      // Important: For P2P multiplayer to work, both players need to be in SAME BROWSER
      // Different tabs = Different localStorage access
      console.log('💡 TIP: For local multiplayer, open TWO TABS in the SAME BROWSER')
      
      if (this.onError) {
        this.onError('Room code not found.\n\nFor local play:\n• Both players must use the SAME browser\n• Open 2 tabs in the same browser window')
      }
      return
    }
    
    try {
      const roomData = JSON.parse(roomDataStr)
      
      if (roomData.players.length >= 2) {
        if (this.onError) {
          this.onError('Room is full')
        }
        return
      }
      
      // Add player to room
      roomData.players.push(this.playerId)
      this.roomStorage.setItem(roomKey, JSON.stringify(roomData))
      
      this.roomCode = roomCode
      this.isHost = false
      this.opponent = roomData.host
      
      console.log('✅ Joined room:', roomCode)
      console.log('👥 Opponent:', this.opponent)
      
      if (this.onRoomJoined) {
        this.onRoomJoined({ roomCode })
      }
      
      // Notify host via BroadcastChannel
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'opponentJoined',
          roomCode: roomCode,
          playerId: this.playerId,
          timestamp: Date.now()
        })
        console.log('📡 Broadcast sent: opponentJoined')
      } else {
        // Fallback: Notify via localStorage
        const notificationKey = `gameRoom_${roomCode}_notification`
        const notification = {
          action: 'opponentJoined',
          playerId: this.playerId,
          timestamp: Date.now()
        }
        this.roomStorage.setItem(notificationKey, JSON.stringify(notification))
      }
      
    } catch (error) {
      console.error('❌ Error joining room:', error)
      if (this.onError) {
        this.onError('Failed to join room')
      }
    }
  }

  /**
   * Generate random 4-letter room code
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    // Check if exists
    if (this.roomStorage.getItem(`gameRoom_${code}`)) {
      return this.generateRoomCode()
    }
    return code
  }

  /**
   * Send game state update to opponent
   */
  sendGameState(gameState) {
    if (!this.connected || !this.roomCode) {
      return
    }

    // Use online server if available
    if (this.useOnlineServer && this.socket && this.socket.connected) {
      this.socket.emit('updateGameState', {
        roomCode: this.roomCode,
        gameState: gameState
      })
      return
    }

    // Fallback to local mode
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'gameState',
        roomCode: this.roomCode,
        playerId: this.playerId,
        state: gameState,
        timestamp: Date.now()
      })
    } else {
      // Fallback to localStorage
      const roomKey = `gameRoom_${this.roomCode}`
      const updateData = {
        action: 'gameState',
        playerId: this.playerId,
        state: gameState,
        timestamp: Date.now()
      }
      this.roomStorage.setItem(`${roomKey}_state`, JSON.stringify(updateData))
    }
  }

  /**
   * Send game action to opponent
   */
  sendGameAction(action) {
    if (!this.connected || !this.roomCode) {
      return
    }

    // Use online server if available
    if (this.useOnlineServer && this.socket && this.socket.connected) {
      this.socket.emit('gameAction', {
        roomCode: this.roomCode,
        action: action
      })
      return
    }

    // Fallback to local mode
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'gameAction',
        roomCode: this.roomCode,
        playerId: this.playerId,
        actionData: action,
        timestamp: Date.now()
      })
    } else {
      // Fallback to localStorage
      const roomKey = `gameRoom_${this.roomCode}`
      const actionData = {
        action: 'gameAction',
        playerId: this.playerId,
        actionData: action,
        timestamp: Date.now()
      }
      this.roomStorage.setItem(`${roomKey}_action`, JSON.stringify(actionData))
    }
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    if (this.roomCode) {
      const roomCode = this.roomCode
      
      // Use online server if available
      if (this.useOnlineServer && this.socket && this.socket.connected) {
        this.socket.emit('leaveRoom', { roomCode })
      } else {
        // Local mode - notify via BroadcastChannel
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'opponentLeft',
            roomCode: roomCode,
            playerId: this.playerId,
            timestamp: Date.now()
          })
        }
        
        // Clean up room data
        const roomKey = `gameRoom_${roomCode}`
        this.roomStorage.removeItem(roomKey)
        this.roomStorage.removeItem(`${roomKey}_state`)
        this.roomStorage.removeItem(`${roomKey}_action`)
        this.roomStorage.removeItem(`${roomKey}_notification`)
        this.roomStorage.removeItem(`${roomKey}_leave`)
      }
      
      this.roomCode = null
      this.opponent = null
      this.isHost = false
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    this.leaveRoom()
    
    // Disconnect from online server
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    // Close broadcast channel
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }
    
    this.connected = false
    this.useOnlineServer = false
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected
  }

  /**
   * Check if in a room
   */
  inRoom() {
    return this.roomCode !== null
  }

  /**
   * Check if opponent is connected
   */
  hasOpponent() {
    return this.opponent !== null
  }
}

// Export singleton instance
export const multiplayerService = new MultiplayerService()
