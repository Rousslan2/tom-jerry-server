import Phaser from 'phaser'
import { screenSize, audioConfig } from '../gameConfig.json'
import { multiplayerService } from '../services/MultiplayerService.js'

export class OnlineLobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OnlineLobbyScene' })
    this.isConnecting = false
    this.isWaitingForOpponent = false
    this.roomCodeInput = ''
    this.errorPanelElements = null
    this.virtualKeyboardOpen = false
    this.keyboardElements = null
  }

  create() {
    this.createBackground()
    this.createUI()
    this.setupMultiplayerCallbacks()
    this.connectToServer()
  }

  createBackground() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    // Modern gradient background - purple to blue
    const backgroundGraphics = this.add.graphics()
    backgroundGraphics.fillGradientStyle(0x667EEA, 0x764BA2, 0x667EEA, 0x764BA2, 1)
    backgroundGraphics.fillRect(0, 0, screenWidth, screenHeight)
    backgroundGraphics.setDepth(-200)
    
    // Animated floating circles decoration
    for (let i = 0; i < 15; i++) {
      const circle = this.add.circle(
        Phaser.Math.Between(0, screenWidth),
        Phaser.Math.Between(0, screenHeight),
        Phaser.Math.Between(20, 60),
        0xFFFFFF,
        0.05
      ).setDepth(-100)
      
      // Floating animation
      this.tweens.add({
        targets: circle,
        y: circle.y + Phaser.Math.Between(-30, 30),
        x: circle.x + Phaser.Math.Between(-20, 20),
        alpha: Phaser.Math.Between(0.03, 0.1),
        duration: Phaser.Math.Between(3000, 6000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      })
    }
    
    // Subtle grid pattern
    const gridGraphics = this.add.graphics()
    gridGraphics.lineStyle(1, 0xFFFFFF, 0.05)
    for (let x = 0; x < screenWidth; x += 40) {
      gridGraphics.lineBetween(x, 0, x, screenHeight)
    }
    for (let y = 0; y < screenHeight; y += 40) {
      gridGraphics.lineBetween(0, y, screenWidth, y)
    }
    gridGraphics.setDepth(-150)
  }

  createUI() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    // Modern Title Card with shadow
    const titleCardBg = this.add.graphics()
    titleCardBg.fillStyle(0x000000, 0.3)
    titleCardBg.fillRoundedRect(screenWidth / 2 - 280, 50, 560, 100, 20)
    titleCardBg.setDepth(98)
    
    const titleCard = this.add.graphics()
    titleCard.fillGradientStyle(0xFF6B9D, 0xC371F4, 0xFF6B9D, 0xC371F4, 1)
    titleCard.fillRoundedRect(screenWidth / 2 - 270, 45, 540, 90, 20)
    titleCard.lineStyle(4, 0xFFFFFF, 0.5)
    titleCard.strokeRoundedRect(screenWidth / 2 - 270, 45, 540, 90, 20)
    titleCard.setDepth(99)
    
    // Title with glow effect
    this.titleText = this.add.text(screenWidth / 2, 90, '🌐 ONLINE MULTIPLAYER', {
      fontSize: '38px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#4A148C',
      strokeThickness: 5,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(100)
    
    // Pulsing title animation
    this.tweens.add({
      targets: this.titleText,
      scale: 1.05,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    // Modern status badge
    this.statusBg = this.add.graphics()
    this.statusBg.setDepth(99)
    
    this.statusText = this.add.text(screenWidth / 2, 160, 'Connecting to server...', {
      fontSize: '16px',
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(100)
    
    this.updateStatusBadge('connecting')
    
    // Panel container
    const panelY = screenHeight / 2 + 40
    this.createOptionsPanel(panelY)
    
    // Back button
    this.createBackButton()
  }
  
  updateStatusBadge(status) {
    this.statusBg.clear()
    
    const screenWidth = screenSize.width.value
    const bounds = this.statusText.getBounds()
    const padding = 20
    
    let color = 0xFFA500 // Orange for connecting
    if (status === 'online') color = 0x4CAF50 // Green
    if (status === 'local') color = 0x9E9E9E // Gray
    if (status === 'error') color = 0xF44336 // Red
    
    this.statusBg.fillStyle(color, 0.9)
    this.statusBg.fillRoundedRect(
      bounds.x - padding,
      bounds.y - padding / 2,
      bounds.width + padding * 2,
      bounds.height + padding,
      15
    )
    this.statusBg.lineStyle(2, 0xFFFFFF, 0.7)
    this.statusBg.strokeRoundedRect(
      bounds.x - padding,
      bounds.y - padding / 2,
      bounds.width + padding * 2,
      bounds.height + padding,
      15
    )
  }

  createOptionsPanel(centerY) {
    const screenWidth = screenSize.width.value
    const centerX = screenWidth / 2
    
    // Main panel card with modern design
    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x000000, 0.3)
    panelBg.fillRoundedRect(centerX - 205, centerY - 165, 410, 420, 25)
    panelBg.setDepth(95)
    
    const panel = this.add.graphics()
    panel.fillStyle(0xFFFFFF, 0.15)
    panel.fillRoundedRect(centerX - 200, centerY - 160, 400, 410, 25)
    panel.lineStyle(3, 0xFFFFFF, 0.4)
    panel.strokeRoundedRect(centerX - 200, centerY - 160, 400, 410, 25)
    panel.setDepth(96)
    
    // Create Room Button - Modern card style
    this.createRoomButton = this.createGlassButton(
      centerX,
      centerY - 95,
      320,
      65,
      '🎮 CREATE ROOM',
      () => this.onCreateRoom(),
      0x10B981 // Emerald green
    )
    this.createRoomButton.setAlpha(0.5) // Disabled initially
    
    // Stylish separator with decorative lines
    const separatorY = centerY - 25
    const separatorLine1 = this.add.graphics()
    separatorLine1.lineStyle(2, 0xFFFFFF, 0.3)
    separatorLine1.lineBetween(centerX - 150, separatorY, centerX - 60, separatorY)
    separatorLine1.setDepth(100)
    
    const separatorLine2 = this.add.graphics()
    separatorLine2.lineStyle(2, 0xFFFFFF, 0.3)
    separatorLine2.lineBetween(centerX + 60, separatorY, centerX + 150, separatorY)
    separatorLine2.setDepth(100)
    
    this.add.text(centerX, separatorY, 'OR', {
      fontSize: '16px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#4A148C',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(100)
    
    // Join Room Section with modern styling
    this.joinRoomLabel = this.add.text(centerX, centerY + 30, '🔑 Enter Room Code', {
      fontSize: '18px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#4A148C',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(100)
    
    // Modern input box with glow effect
    const codeBoxShadow = this.add.graphics()
    codeBoxShadow.fillStyle(0x000000, 0.4)
    codeBoxShadow.fillRoundedRect(centerX - 128, centerY + 58, 256, 64, 15)
    codeBoxShadow.setDepth(98)
    
    const codeBoxBg = this.add.graphics()
    codeBoxBg.fillStyle(0x1E1E2E, 0.95)
    codeBoxBg.fillRoundedRect(centerX - 125, centerY + 55, 250, 60, 15)
    codeBoxBg.lineStyle(3, 0xC371F4, 1)
    codeBoxBg.strokeRoundedRect(centerX - 125, centerY + 55, 250, 60, 15)
    codeBoxBg.setDepth(99)
    
    // Make it interactive for mobile only
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      // Mobile: Add clickable zone for virtual keyboard
      const inputZone = this.add.zone(centerX, centerY + 85, 250, 60).setInteractive()
      inputZone.setDepth(100)
      
      // Click to open virtual keyboard on mobile
      inputZone.on('pointerdown', () => {
        this.openVirtualKeyboard()
      })
      
      // Add visual hint for mobile users with icon
      this.add.text(centerX, centerY + 130, '👆 Tap to enter code', {
        fontSize: '13px',
        fontFamily: window.getGameFont(),
        color: '#C371F4',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(100)
    } else {
      // PC: Add keyboard hint
      this.add.text(centerX, centerY + 130, '⌨️ Type with keyboard', {
        fontSize: '13px',
        fontFamily: window.getGameFont(),
        color: '#C371F4',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(100)
    }
    
    // Room code display with modern font
    this.roomCodeDisplay = this.add.text(centerX, centerY + 85, '____', {
      fontSize: '32px',
      fontFamily: 'Courier New, monospace',
      color: '#FFFFFF',
      stroke: '#C371F4',
      strokeThickness: 4,
      align: 'center',
      fontStyle: 'bold',
      letterSpacing: '12px'
    }).setOrigin(0.5, 0.5).setDepth(101)
    
    // Join button - Modern glass style
    this.joinRoomButton = this.createGlassButton(
      centerX,
      centerY + 175,
      320,
      65,
      '🚪 JOIN ROOM',
      () => this.onJoinRoom(),
      0x6366F1 // Indigo
    )
    this.joinRoomButton.setAlpha(0.5) // Disabled initially
    
    // Room code info
    this.roomCodeInfo = null
    
    // Setup keyboard input for room code
    this.setupRoomCodeInput()
  }

  setupRoomCodeInput() {
    // Desktop keyboard
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', (event) => {
        if (this.isWaitingForOpponent || this.virtualKeyboardOpen) return
        
        const key = event.key.toUpperCase()
        
        // Only accept letters and numbers
        if (/^[A-Z0-9]$/.test(key) && this.roomCodeInput.length < 4) {
          this.roomCodeInput += key
          this.updateRoomCodeDisplay()
          this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
        }
        
        // Backspace to delete
        if (event.key === 'Backspace' && this.roomCodeInput.length > 0) {
          this.roomCodeInput = this.roomCodeInput.slice(0, -1)
          this.updateRoomCodeDisplay()
          this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
        }
        
        // Enter to join
        if (event.key === 'Enter' && this.roomCodeInput.length === 4) {
          this.onJoinRoom()
        }
      })
    }
  }

  openVirtualKeyboard() {
    if (this.virtualKeyboardOpen || this.isWaitingForOpponent) return
    
    this.virtualKeyboardOpen = true
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    // Semi-transparent overlay
    this.keyboardOverlay = this.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      screenWidth,
      screenHeight,
      0x000000,
      0.7
    ).setDepth(500).setInteractive()
    
    // Keyboard panel
    const panelWidth = Math.min(400, screenWidth * 0.95)
    const panelHeight = Math.min(350, screenHeight * 0.7)
    
    this.keyboardPanel = this.add.graphics()
    this.keyboardPanel.fillStyle(0x2C3E50, 0.95)
    this.keyboardPanel.fillRoundedRect(
      screenWidth / 2 - panelWidth / 2,
      screenHeight / 2 - panelHeight / 2,
      panelWidth,
      panelHeight,
      15
    )
    this.keyboardPanel.lineStyle(3, 0xFFD700, 1)
    this.keyboardPanel.strokeRoundedRect(
      screenWidth / 2 - panelWidth / 2,
      screenHeight / 2 - panelHeight / 2,
      panelWidth,
      panelHeight,
      15
    )
    this.keyboardPanel.setDepth(501)
    
    // Title
    this.keyboardTitle = this.add.text(
      screenWidth / 2,
      screenHeight / 2 - panelHeight / 2 + 30,
      'Enter Room Code',
      {
        fontSize: '20px',
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5).setDepth(502)
    
    // Current input display
    this.keyboardDisplay = this.add.text(
      screenWidth / 2,
      screenHeight / 2 - panelHeight / 2 + 80,
      this.roomCodeInput.padEnd(4, '_'),
      {
        fontSize: '32px',
        fontFamily: 'Courier New, monospace',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3,
        fontStyle: 'bold',
        letterSpacing: '10px'
      }
    ).setOrigin(0.5, 0.5).setDepth(502)
    
    // Create keyboard buttons
    this.keyboardButtons = []
    const keys = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
      ['1', '2', '3', '4', '5', '6', '7'],
      ['8', '9', '0']
    ]
    
    const buttonSize = 35
    const buttonSpacing = 5
    const startY = screenHeight / 2 - panelHeight / 2 + 130
    
    keys.forEach((row, rowIndex) => {
      const rowWidth = row.length * (buttonSize + buttonSpacing)
      const startX = screenWidth / 2 - rowWidth / 2
      
      row.forEach((key, colIndex) => {
        const x = startX + colIndex * (buttonSize + buttonSpacing) + buttonSize / 2
        const y = startY + rowIndex * (buttonSize + buttonSpacing)
        
        this.createKeyButton(x, y, buttonSize, key)
      })
    })
    
    // Delete button
    this.createKeyButton(
      screenWidth / 2 - 80,
      startY + 5 * (buttonSize + buttonSpacing),
      80,
      '⌫ DEL',
      () => {
        if (this.roomCodeInput.length > 0) {
          this.roomCodeInput = this.roomCodeInput.slice(0, -1)
          this.keyboardDisplay.setText(this.roomCodeInput.padEnd(4, '_'))
          this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
        }
      }
    )
    
    // Done button
    this.createKeyButton(
      screenWidth / 2 + 80,
      startY + 5 * (buttonSize + buttonSpacing),
      80,
      '✓ OK',
      () => {
        this.closeVirtualKeyboard()
        this.updateRoomCodeDisplay()
      },
      0x32CD32
    )
    
    // Store elements for cleanup
    this.keyboardElements = [
      this.keyboardOverlay,
      this.keyboardPanel,
      this.keyboardTitle,
      this.keyboardDisplay,
      ...this.keyboardButtons
    ]
    
    // Click overlay to close
    this.keyboardOverlay.on('pointerdown', () => {
      this.closeVirtualKeyboard()
      this.updateRoomCodeDisplay()
    })
  }

  createKeyButton(x, y, size, label, customCallback = null, color = 0x4169E1) {
    const button = this.add.graphics()
    button.fillStyle(color, 0.9)
    button.fillRoundedRect(x - size / 2, y - size / 2, size, size, 5)
    button.lineStyle(2, 0xFFFFFF, 0.8)
    button.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 5)
    button.setDepth(502)
    button.setInteractive(
      new Phaser.Geom.Rectangle(x - size / 2, y - size / 2, size, size),
      Phaser.Geom.Rectangle.Contains
    )
    
    const text = this.add.text(x, y, label, {
      fontSize: label.length > 1 ? '12px' : '18px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(503)
    
    const callback = customCallback || (() => {
      if (this.roomCodeInput.length < 4) {
        this.roomCodeInput += label
        this.keyboardDisplay.setText(this.roomCodeInput.padEnd(4, '_'))
        this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
        
        // Auto-close when 4 characters entered
        if (this.roomCodeInput.length === 4) {
          this.time.delayedCall(300, () => {
            this.closeVirtualKeyboard()
            this.updateRoomCodeDisplay()
          })
        }
      }
    })
    
    button.on('pointerdown', () => {
      button.setScale(0.9)
      callback()
    })
    
    button.on('pointerup', () => {
      button.setScale(1)
    })
    
    button.on('pointerover', () => {
      button.setScale(1.05)
    })
    
    button.on('pointerout', () => {
      button.setScale(1)
    })
    
    this.keyboardButtons.push(button, text)
  }

  closeVirtualKeyboard() {
    if (this.keyboardElements) {
      this.keyboardElements.forEach(element => {
        if (element && element.active) element.destroy()
      })
      this.keyboardElements = null
    }
    
    this.virtualKeyboardOpen = false
  }

  updateRoomCodeDisplay() {
    let displayText = this.roomCodeInput
    while (displayText.length < 4) {
      displayText += '_'
    }
    this.roomCodeDisplay.setText(displayText)
    
    // Enable/disable join button
    if (this.roomCodeInput.length === 4 && multiplayerService.isConnected()) {
      this.joinRoomButton.setAlpha(1)
    } else {
      this.joinRoomButton.setAlpha(0.5)
    }
  }

  createGlassButton(x, y, width, height, text, callback, color = 0x32CD32) {
    // Shadow layer
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.4)
    shadow.fillRoundedRect(x - width/2 + 4, y - height/2 + 4, width, height, 18)
    shadow.setDepth(99)
    
    // Create graphics for button
    const button = this.add.graphics()
    button.x = x
    button.y = y
    button.setDepth(100)
    
    // Draw glassmorphism effect
    button.fillStyle(color, 0.85)
    button.fillRoundedRect(-width/2, -height/2, width, height, 18)
    
    // Gradient overlay for glass effect
    const gradient = this.add.graphics()
    gradient.fillGradientStyle(0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0.2, 0.05, 0.2, 0.05)
    gradient.fillRoundedRect(x - width/2, y - height/2, width, height, 18)
    gradient.setDepth(100)
    
    // Border with glow
    button.lineStyle(3, 0xFFFFFF, 0.6)
    button.strokeRoundedRect(-width/2, -height/2, width, height, 18)
    
    // Button text with larger font
    const buttonText = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(101)
    
    // Make button interactive
    button.setInteractive(
      new Phaser.Geom.Rectangle(-width/2, -height/2, width, height),
      Phaser.Geom.Rectangle.Contains
    )
    
    // Store references
    button.buttonText = buttonText
    button.buttonShadow = shadow
    button.buttonGradient = gradient
    button.originalY = y
    button.originalColor = color
    
    // Enhanced hover effects with glow
    button.on('pointerover', () => {
      if (button.alpha < 1) return
      
      this.tweens.add({
        targets: [button, buttonText, gradient],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Back.easeOut'
      })
      
      // Add glow effect
      button.clear()
      button.fillStyle(color, 0.85)
      button.fillRoundedRect(-width/2, -height/2, width, height, 18)
      button.lineStyle(4, 0xFFFFFF, 0.9)
      button.strokeRoundedRect(-width/2, -height/2, width, height, 18)
      
      buttonText.y = y - 2
    })
    
    button.on('pointerout', () => {
      if (button.alpha < 1) return
      
      this.tweens.add({
        targets: [button, buttonText, gradient],
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut'
      })
      
      // Remove glow
      button.clear()
      button.fillStyle(color, 0.85)
      button.fillRoundedRect(-width/2, -height/2, width, height, 18)
      button.lineStyle(3, 0xFFFFFF, 0.6)
      button.strokeRoundedRect(-width/2, -height/2, width, height, 18)
      
      buttonText.y = y
    })
    
    button.on('pointerdown', () => {
      if (button.alpha < 1) return
      button.setScale(0.97)
      buttonText.setScale(0.97)
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
    })
    
    button.on('pointerup', () => {
      if (button.alpha < 1) return
      button.setScale(1)
      buttonText.setScale(1)
      if (callback) callback()
    })
    
    return button
  }

  createBackButton() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    this.backButton = this.createGlassButton(
      screenWidth / 2,
      screenHeight - 50,
      200,
      50,
      '← BACK',
      () => this.goBack(),
      0xEF4444 // Red
    )
  }

  connectToServer() {
    this.statusText.setText('🌐 Connecting to online server...')
    this.updateStatusBadge('connecting')
    this.statusText.setColor('#FFFFFF')
    
    // Try to connect to online server
    multiplayerService.connect()
      .then((result) => {
        if (result) {
          // Check if using online server or local mode
          const isOnline = multiplayerService.useOnlineServer
          
          if (isOnline) {
            // Successfully connected to ONLINE server!
            this.statusText.setText('✅ ONLINE MODE - Play from anywhere! 🌍')
            this.statusText.setColor('#FFFFFF')
            this.statusText.setFontSize('18px')
            this.updateStatusBadge('online')
            console.log('🌐 ONLINE MODE: Players can connect from different devices/networks')
          } else {
            // Fallback to LOCAL mode
            this.statusText.setText('📱 LOCAL MODE - Open 2 tabs in same browser')
            this.statusText.setColor('#FFFFFF')
            this.statusText.setFontSize('16px')
            this.updateStatusBadge('local')
            console.log('📱 LOCAL MODE: Both players must use the same browser')
          }
          
          this.createRoomButton.setAlpha(1)
          this.joinRoomButton.setAlpha(1)
          this.updateRoomCodeDisplay()
        } else {
          // Connection failed - show friendly message
          this.statusText.setText('⚠️ Online server unavailable')
          this.statusText.setColor('#FFFFFF')
          this.statusText.setFontSize('16px')
          this.updateStatusBadge('error')
          
          // Disable online buttons
          this.createRoomButton.setAlpha(0.3)
          this.joinRoomButton.setAlpha(0.3)
          
          // Show info
          const infoText = this.add.text(
            screenSize.width.value / 2,
            screenSize.height.value / 2 - 50,
            'Could not connect to online server.\nPlease try LOCAL MULTIPLAYER instead!\n\n(2 players on same device)',
            {
              fontSize: '16px',
              fontFamily: window.getGameFont(),
              color: '#FFFFFF',
              stroke: '#000000',
              strokeThickness: 3,
              align: 'center',
              lineSpacing: 8
            }
          ).setOrigin(0.5, 0.5).setDepth(100)
          
          // Countdown redirect
          let countdown = 5
          const countdownText = this.add.text(
            screenSize.width.value / 2,
            screenSize.height.value / 2 + 80,
            `Returning to menu in ${countdown}...`,
            {
              fontSize: '14px',
              fontFamily: window.getGameFont(),
              color: '#FFD700',
              stroke: '#000000',
              strokeThickness: 2,
              align: 'center'
            }
          ).setOrigin(0.5, 0.5).setDepth(100)
          
          this.time.addEvent({
            delay: 1000,
            repeat: countdown - 1,
            callback: () => {
              countdown--
              countdownText.setText(`Returning to menu in ${countdown}...`)
            }
          })
          
          this.time.delayedCall(5000, () => {
            this.scene.start('ModeSelectionScene')
          })
        }
      })
      .catch((error) => {
        console.warn('Unexpected error:', error)
        this.statusText.setText('⚠️ Connection error')
        this.statusText.setColor('#FF0000')
        
        this.time.delayedCall(3000, () => {
          this.scene.start('ModeSelectionScene')
        })
      })
  }

  setupMultiplayerCallbacks() {
    multiplayerService.onRoomCreated = (roomCode) => {
      this.showWaitingForOpponent(roomCode)
    }
    
    multiplayerService.onRoomJoined = (data) => {
      this.statusText.setText('✅ Room joined! Starting game...')
      this.time.delayedCall(1000, () => {
        this.startOnlineGame(false)
      })
    }
    
    multiplayerService.onOpponentJoined = (data) => {
      this.statusText.setText('✅ Opponent joined! Starting game...')
      this.time.delayedCall(1000, () => {
        this.startOnlineGame(true)
      })
    }
    
    multiplayerService.onOpponentLeft = () => {
      this.showError('Opponent left the game')
    }
    
    multiplayerService.onError = (message) => {
      this.showError(message)
    }
  }

  onCreateRoom() {
    if (!multiplayerService.isConnected()) {
      this.showError('Not connected to server')
      return
    }
    
    this.statusText.setText('Creating room...')
    multiplayerService.createRoom()
  }

  onJoinRoom() {
    if (!multiplayerService.isConnected()) {
      this.showError('Not connected to server')
      return
    }
    
    if (this.roomCodeInput.length !== 4) {
      this.showError('Please enter a 4-character room code')
      return
    }
    
    this.statusText.setText('Joining room...')
    multiplayerService.joinRoom(this.roomCodeInput)
  }

  showWaitingForOpponent(roomCode) {
    this.isWaitingForOpponent = true
    
    // Hide main options
    this.createRoomButton.setVisible(false)
    this.joinRoomLabel.setVisible(false)
    this.roomCodeDisplay.setVisible(false)
    this.joinRoomButton.setVisible(false)
    
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    // Show room code
    this.roomCodeInfo = this.add.text(screenWidth / 2, screenHeight / 2 - 60, 'Your Room Code:', {
      fontSize: '24px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(100)
    
    this.roomCodeBig = this.add.text(screenWidth / 2, screenHeight / 2, roomCode, {
      fontSize: '64px',
      fontFamily: 'Courier New, monospace',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      fontStyle: 'bold',
      letterSpacing: '15px'
    }).setOrigin(0.5, 0.5).setDepth(100)
    
    // Pulsing effect
    this.tweens.add({
      targets: this.roomCodeBig,
      scale: { from: 1, to: 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    this.waitingText = this.add.text(screenWidth / 2, screenHeight / 2 + 80, 'Waiting for opponent...', {
      fontSize: '20px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(100)
    
    // Blinking effect
    this.tweens.add({
      targets: this.waitingText,
      alpha: { from: 0.5, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1
    })
  }

  startOnlineGame(isHost) {
    // Stop title music
    const titleScene = this.scene.get('TitleScene')
    if (titleScene && titleScene.backgroundMusic && titleScene.backgroundMusic.isPlaying) {
      titleScene.backgroundMusic.stop()
    }
    
    // Start online multiplayer game
    console.log('🎮 Starting multiplayer game as:', isHost ? 'HOST' : 'CLIENT')
    this.scene.start('GameScene', { mode: 'online', isHost: isHost })
  }

  showError(message) {
    // Close existing error panel if any
    this.closeErrorPanel()
    
    // For multiline messages, create a bigger error display
    if (message.includes('\n')) {
      const screenWidth = screenSize.width.value
      const screenHeight = screenSize.height.value
      
      // Create semi-transparent overlay
      const overlay = this.add.rectangle(
        screenWidth / 2,
        screenHeight / 2,
        screenWidth,
        screenHeight,
        0x000000,
        0.7
      ).setDepth(1000).setInteractive()
      
      // Create error panel
      const panelWidth = Math.min(500, screenWidth * 0.9)
      const panelHeight = Math.min(300, screenHeight * 0.6)
      
      const panel = this.add.graphics()
      panel.fillStyle(0x8B0000, 0.95)
      panel.fillRoundedRect(
        screenWidth / 2 - panelWidth / 2,
        screenHeight / 2 - panelHeight / 2,
        panelWidth,
        panelHeight,
        15
      )
      panel.lineStyle(4, 0xFF6347, 1)
      panel.strokeRoundedRect(
        screenWidth / 2 - panelWidth / 2,
        screenHeight / 2 - panelHeight / 2,
        panelWidth,
        panelHeight,
        15
      )
      panel.setDepth(1001)
      
      // Error message
      const errorText = this.add.text(
        screenWidth / 2,
        screenHeight / 2 - 30,
        message,
        {
          fontSize: '18px',
          fontFamily: window.getGameFont(),
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          lineSpacing: 8,
          wordWrap: { width: panelWidth - 40 }
        }
      ).setOrigin(0.5, 0.5).setDepth(1002)
      
      // OK button
      const okButton = this.add.text(
        screenWidth / 2,
        screenHeight / 2 + 80,
        '✓ OK',
        {
          fontSize: '24px',
          fontFamily: window.getGameFont(),
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5, 0.5).setDepth(1002).setInteractive()
      
      // Store references for cleanup
      this.errorPanelElements = { overlay, panel, errorText, okButton }
      
      // Close handler
      const closePanel = () => {
        this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
        this.closeErrorPanel()
      }
      
      // Button effects
      okButton.on('pointerover', () => {
        okButton.setScale(1.1)
        okButton.setColor('#FFD700')
      })
      
      okButton.on('pointerout', () => {
        okButton.setScale(1)
        okButton.setColor('#FFFFFF')
      })
      
      okButton.on('pointerdown', closePanel)
      
      // Also allow clicking overlay to close
      overlay.on('pointerdown', closePanel)
      
      // ESC key to close
      const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      escKey.once('down', () => {
        this.closeErrorPanel()
      })
      
    } else {
      // Simple inline error
      this.statusText.setText(`❌ ${message}`)
      this.statusText.setColor('#FF6347')
      
      this.time.delayedCall(3000, () => {
        if (multiplayerService.isConnected()) {
          this.statusText.setText('✅ Connected! Choose an option below')
          this.statusText.setColor('#FFD700')
        } else {
          this.statusText.setText('⚠️ Connection failed - Using local multiplayer mode')
          this.statusText.setColor('#FFD700')
        }
      })
    }
  }

  closeErrorPanel() {
    if (this.errorPanelElements) {
      const { overlay, panel, errorText, okButton } = this.errorPanelElements
      
      // Safely destroy each element
      if (overlay && overlay.active) overlay.destroy()
      if (panel && panel.active) panel.destroy()
      if (errorText && errorText.active) errorText.destroy()
      if (okButton && okButton.active) okButton.destroy()
      
      this.errorPanelElements = null
      
      // Reset status
      if (multiplayerService.isConnected()) {
        this.statusText.setText('✅ Connected! Choose an option below')
        this.statusText.setColor('#FFD700')
      }
    }
  }

  goBack() {
    // Close error panel if open
    this.closeErrorPanel()
    
    multiplayerService.disconnect()
    this.scene.start('ModeSelectionScene')
  }
  
  shutdown() {
    // Clean up error panel when scene shuts down
    this.closeErrorPanel()
    
    // Clean up virtual keyboard
    this.closeVirtualKeyboard()
  }
}
