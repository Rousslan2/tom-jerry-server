import Phaser from 'phaser'
import { screenSize, audioConfig } from '../gameConfig.json'

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' })
    this.callingScene = null
  }

  init(data) {
    // Detect which scene called the pause
    if (data && data.callingScene) {
      this.callingScene = data.callingScene
    } else {
      // Auto-detect from active scenes
      if (this.scene.isActive('GameScene')) {
        this.callingScene = 'GameScene'
      } else if (this.scene.isActive('MultiplayerGameScene')) {
        this.callingScene = 'MultiplayerGameScene'
      } else {
        this.callingScene = 'GameScene' // Default fallback
      }
    }
  }

  preload() {
    this.load.image('button_normal', 'https://cdn-game-mcp.gambo.ai/53ea91d9-082a-4d85-a7b6-f5530b90dfa3/images/button_normal.png')
    this.load.audio('ui_click', 'https://cdn-game-mcp.gambo.ai/57fc23da-9ff4-420e-9481-481da6820432/sound_effects/ui_click.mp3')
  }

  create() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value

    // Create background
    this.createPauseBackground()
    
    // Create pause panel
    this.createPausePanel()

    // Setup input
    this.setupInputs()
  }

  createPauseBackground() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value

    // Semi-transparent background
    this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.8)
    
    // Add some decorative Tom and Jerry style elements
    this.createBackgroundDecorations()
  }

  createBackgroundDecorations() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    // Create some decorative dots
    const decorationGraphics = this.add.graphics()
    decorationGraphics.fillStyle(0xFFD700, 0.1)
    
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(50, screenWidth - 50)
      const y = Phaser.Math.Between(50, screenHeight - 50)
      const radius = Phaser.Math.Between(8, 20)
      decorationGraphics.fillCircle(x, y, radius)
    }
    
    decorationGraphics.setDepth(1)
  }

  createPausePanel() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value

    // Calculate panel size and position
    const panelWidth = Math.min(400, screenWidth * 0.8)
    const panelHeight = Math.min(500, screenHeight * 0.7)
    const panelX = screenWidth / 2
    const panelY = screenHeight / 2

    // Create panel background
    this.panelBg = this.add.graphics()
    this.panelBg.fillStyle(0xF5DEB3, 0.95)  // Cream background
    this.panelBg.fillRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 20)
    
    // Add panel border
    this.panelBg.lineStyle(6, 0x8B4513, 1)  // Dark brown border
    this.panelBg.strokeRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 20)
    
    // Inner decorative border
    this.panelBg.lineStyle(3, 0xFFD700, 0.8)  // Gold inner border
    this.panelBg.strokeRoundedRect(panelX - panelWidth/2 + 10, panelY - panelHeight/2 + 10, panelWidth - 20, panelHeight - 20, 15)
    
    this.panelBg.setDepth(10)

    // Create title
    this.createPauseTitle(panelX, panelY - panelHeight/2 + 80)
    
    // Create button area
    this.createButtonArea(panelX, panelY, panelWidth, panelHeight)
  }

  createPauseTitle(x, y) {
    // Main title
    this.pauseTitle = this.add.text(x, y, '⏸️ GAME PAUSED', {
      fontSize: '32px',
      fontFamily: window.getGameFont(),
      color: '#8B4513',  // Dark brown
      stroke: '#FFD700',  // Gold stroke
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(20)

    // Subtitle
    this.pauseSubtitle = this.add.text(x, y + 40, 'Choose an option below:', {
      fontSize: '16px',
      fontFamily: window.getGameFont(),
      color: '#8B4513',
      align: 'center',
      fontStyle: 'italic'
    }).setOrigin(0.5, 0.5).setDepth(20)
  }

  createButtonArea(centerX, centerY, panelWidth, panelHeight) {
    // Button container starting Y position
    const buttonAreaY = centerY + 20
    const buttonSpacing = 80  // Button spacing
    const buttonWidth = 280
    const buttonHeight = 50

    // Create three buttons
    this.createModernButton(centerX, buttonAreaY - buttonSpacing, buttonWidth, buttonHeight, '▶️ RESUME', 'resume')
    this.createModernButton(centerX, buttonAreaY, buttonWidth, buttonHeight, '🔄 RESTART', 'restart') 
    this.createModernButton(centerX, buttonAreaY + buttonSpacing, buttonWidth, buttonHeight, '🏠 MAIN MENU', 'mainmenu')
  }

  createModernButton(x, y, width, height, text, action) {
    // Create button background
    const buttonBg = this.add.graphics()
    const buttonId = `${action}Button`
    
    // Set different button colors based on different actions
    let buttonColor, hoverColor, pressColor
    switch(action) {
      case 'resume':
        buttonColor = 0x32CD32  // Green
        hoverColor = 0x90EE90   // Light green
        pressColor = 0x228B22   // Dark green
        break
      case 'restart':
        buttonColor = 0xFF8C00  // Orange  
        hoverColor = 0xFFA500   // Light orange
        pressColor = 0xFF6600   // Dark orange
        break
      case 'mainmenu':
        buttonColor = 0x4682B4  // Steel blue
        hoverColor = 0x87CEEB   // Light blue
        pressColor = 0x2F4F4F   // Dark blue
        break
    }
    
    // Draw button background
    this.drawButtonBackground(buttonBg, x, y, width, height, buttonColor)
    buttonBg.setDepth(15)
    
    // Create button text
    const buttonText = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(20)
    
    // Create interaction area
    const hitArea = this.add.zone(x, y, width, height)
      .setOrigin(0.5, 0.5)
      .setInteractive()
      .setDepth(25)
    
    // Store button components
    this[buttonId] = { bg: buttonBg, text: buttonText, hitArea: hitArea }
    
    // Add interaction events
    hitArea.on('pointerover', () => {
      this.drawButtonBackground(buttonBg, x, y, width, height, hoverColor)
      buttonText.setScale(1.05)
      this.tweens.add({
        targets: buttonText,
        y: y - 2,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    hitArea.on('pointerout', () => {
      this.drawButtonBackground(buttonBg, x, y, width, height, buttonColor)
      buttonText.setScale(1)
      this.tweens.add({
        targets: buttonText,
        y: y,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    hitArea.on('pointerdown', () => {
      this.drawButtonBackground(buttonBg, x, y, width, height, pressColor)
      buttonText.setScale(0.95)
      this.tweens.add({
        targets: buttonText,
        y: y + 2,
        duration: 50,
        ease: 'Power2'
      })
    })
    
    hitArea.on('pointerup', () => {
      this.drawButtonBackground(buttonBg, x, y, width, height, hoverColor)
      buttonText.setScale(1.05)
      this.tweens.add({
        targets: buttonText,
        y: y - 2,
        duration: 100,
        ease: 'Back.easeOut'
      })
      
      // Execute corresponding action
      switch(action) {
        case 'resume':
          this.resumeGame()
          break
        case 'restart':
          this.restartGame()
          break
        case 'mainmenu':
          this.goToMainMenu()
          break
      }
    })
  }

  drawButtonBackground(graphics, x, y, width, height, color) {
    graphics.clear()
    
    // Draw button body
    graphics.fillStyle(color, 0.9)
    graphics.fillRoundedRect(x - width/2, y - height/2, width, height, 15)
    
    // Draw button border
    graphics.lineStyle(3, 0xFFFFFF, 0.8)
    graphics.strokeRoundedRect(x - width/2, y - height/2, width, height, 15)
    
    // Add inner shadow effect
    graphics.lineStyle(2, 0x000000, 0.3)
    graphics.strokeRoundedRect(x - width/2 + 2, y - height/2 + 2, width - 4, height - 4, 12)
  }

  setupInputs() {
    // Listen for keyboard input
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.escapeKey.on('down', () => {
      this.resumeGame()
    })

    this.spaceKey.on('down', () => {
      this.resumeGame()
    })
  }

  resumeGame() {
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
    
    // Close pause scene
    this.scene.stop()
    
    // Resume the calling scene
    this.scene.resume(this.callingScene)
  }

  restartGame() {
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
    
    // Stop game music before restarting
    const gameScene = this.scene.get(this.callingScene)
    if (gameScene && gameScene.backgroundMusic && gameScene.backgroundMusic.isPlaying) {
      gameScene.backgroundMusic.stop()
    }
    
    // Close current scene and pause scene
    this.scene.stop(this.callingScene)
    this.scene.stop()
    
    // Restart the calling scene
    this.scene.start(this.callingScene)
  }

  goToMainMenu() {
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
    
    // Stop game music before returning to menu
    const gameScene = this.scene.get(this.callingScene)
    if (gameScene && gameScene.backgroundMusic && gameScene.backgroundMusic.isPlaying) {
      gameScene.backgroundMusic.stop()
    }
    
    // Close all game scenes
    this.scene.stop(this.callingScene)
    this.scene.stop()
    
    // Return to title scene
    this.scene.start('TitleScene')
  }
}