import Phaser from 'phaser'
import { screenSize, audioConfig } from '../gameConfig.json'

export class ModeSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ModeSelectionScene' })
  }

  create() {
    // Check if mobile device
    this.isMobile = window.isMobileDevice || false
    
    this.createBackground()
    this.createUI()
    this.setupInputs()
    this.playBackgroundMusic()
    
    // Show mobile indicator if on mobile
    if (this.isMobile) {
      this.showMobileIndicator()
    }
  }

  playBackgroundMusic() {
    // Only play if not already playing
    if (!this.backgroundMusic || !this.backgroundMusic.isPlaying) {
      this.backgroundMusic = this.sound.add('tom_jerry_80s_retro_theme', {
        volume: audioConfig.musicVolume.value,
        loop: true
      })
      this.backgroundMusic.play()
    }
  }

  shutdown() {
    // Stop music when leaving this scene
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop()
      this.backgroundMusic.destroy()
      this.backgroundMusic = null
    }
  }

  showMobileIndicator() {
    const screenWidth = this.cameras.main.width
    
    // Add mobile mode indicator
    this.mobileIndicator = this.add.text(screenWidth / 2, 30, '📱 MOBILE MODE', {
      fontSize: `${window.getResponsiveFontSize(18)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(3000)
    
    // Blinking animation
    this.tweens.add({
      targets: this.mobileIndicator,
      alpha: { from: 0.6, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    })
  }

  createBackground() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Create main background color
    const backgroundGraphics = this.add.graphics()
    backgroundGraphics.fillStyle(0x6B8E8E, 1)
    backgroundGraphics.fillRect(0, 0, screenWidth, screenHeight)
    backgroundGraphics.setDepth(-200)
    
    // Add decorative border
    const backgroundBorder = this.add.graphics()
    backgroundBorder.lineStyle(6, 0x000000, 0.3)
    backgroundBorder.strokeRoundedRect(20, 20, screenWidth - 40, screenHeight - 40, 15)
    backgroundBorder.lineStyle(3, 0xFFFFFF, 0.4)
    backgroundBorder.strokeRoundedRect(30, 30, screenWidth - 60, screenHeight - 60, 10)
    backgroundBorder.setDepth(-150)
    
    // Create Tom and Jerry style background
    this.background = this.add.image(screenWidth / 2, screenHeight / 2, 'title_background')
    
    const scaleX = screenWidth / this.background.width
    const scaleY = screenHeight / this.background.height
    const scale = Math.max(scaleX, scaleY)
    
    this.background.setScale(scale)
    this.background.setDepth(-100)
    this.background.setAlpha(0.7)
  }

  createUI() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Title
    this.modeTitle = this.add.text(screenWidth / 2, screenHeight * 0.2, '🎮 SELECT GAME MODE 🎮', {
      fontSize: `${window.getResponsiveFontSize(42)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 8 : 6,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(1000)
    
    // Add title animation
    this.tweens.add({
      targets: this.modeTitle,
      y: this.modeTitle.y - 8,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    // Create mode selection buttons
    this.createSinglePlayerButton()
    this.createOnlineMultiPlayerButton()
    this.createBackButton()
    this.createSettingsButton()
  }

  createSinglePlayerButton() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    const buttonY = screenHeight * 0.45
    
    // Button background
    const buttonBg = this.add.graphics()
    buttonBg.fillGradientStyle(0xFF8C00, 0xFF8C00, 0xFFA500, 0xFFA500, 0.95)
    buttonBg.fillRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
    buttonBg.lineStyle(4, 0xFFFFFF, 0.9)
    buttonBg.strokeRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
    buttonBg.setDepth(100)
    
    // Create interaction zone
    const buttonZone = this.add.zone(screenWidth / 2, buttonY, 400, 80).setInteractive()
    buttonZone.setDepth(101)
    
    // Button text
    const buttonText = this.add.text(screenWidth / 2, buttonY, '👤 SINGLE PLAYER', {
      fontSize: `${window.getResponsiveFontSize(32)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 7 : 5,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Button description
    const buttonDesc = this.add.text(screenWidth / 2, buttonY + 50, 'Play alone and complete objectives!', {
      fontSize: `${window.getResponsiveFontSize(16)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 4 : 3,
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Store references
    this.singlePlayerButton = { bg: buttonBg, text: buttonText, desc: buttonDesc, zone: buttonZone }
    
    // Interactions
    buttonZone.on('pointerover', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0xFFA500, 0xFFA500, 0xFFB52E, 0xFFB52E, 1)
      buttonBg.fillRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      buttonBg.lineStyle(4, 0xFFFFFF, 1)
      buttonBg.strokeRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      
      this.tweens.add({
        targets: buttonText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerout', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0xFF8C00, 0xFF8C00, 0xFFA500, 0xFFA500, 0.95)
      buttonBg.fillRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      buttonBg.lineStyle(4, 0xFFFFFF, 0.9)
      buttonBg.strokeRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      
      this.tweens.add({
        targets: buttonText,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerdown', () => {
      buttonText.setScale(0.95)
    })
    
    buttonZone.on('pointerup', () => {
      buttonText.setScale(1.1)
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      
      // 🎮 NEW: Go to game mode selection menu!
      this.scene.start('GameModeMenuScene')
    })
  }



  createOnlineMultiPlayerButton() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    const buttonY = screenHeight * 0.60
    
    // Button background - orange for online
    const buttonBg = this.add.graphics()
    buttonBg.fillGradientStyle(0xFF8C00, 0xFF8C00, 0xFFA500, 0xFFA500, 0.95)
    buttonBg.fillRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
    buttonBg.lineStyle(4, 0xFFFFFF, 0.9)
    buttonBg.strokeRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
    buttonBg.setDepth(100)
    
    // Create interaction zone
    const buttonZone = this.add.zone(screenWidth / 2, buttonY, 400, 80).setInteractive()
    buttonZone.setDepth(101)
    
    // Button text
    const buttonText = this.add.text(screenWidth / 2, buttonY, '🌐 ONLINE MULTIPLAYER', {
      fontSize: `${window.getResponsiveFontSize(26)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 7 : 5,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Button description
    const buttonDesc = this.add.text(screenWidth / 2, buttonY + 50, 'Play online with different devices!', {
      fontSize: `${window.getResponsiveFontSize(16)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 4 : 3,
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Store references
    this.onlineMultiPlayerButton = { bg: buttonBg, text: buttonText, desc: buttonDesc, zone: buttonZone }
    
    // Interactions
    buttonZone.on('pointerover', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0xFFA500, 0xFFA500, 0xFFB52E, 0xFFB52E, 1)
      buttonBg.fillRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      buttonBg.lineStyle(4, 0xFFFFFF, 1)
      buttonBg.strokeRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      
      this.tweens.add({
        targets: buttonText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerout', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0xFF8C00, 0xFF8C00, 0xFFA500, 0xFFA500, 0.95)
      buttonBg.fillRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      buttonBg.lineStyle(4, 0xFFFFFF, 0.9)
      buttonBg.strokeRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      
      this.tweens.add({
        targets: buttonText,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerdown', () => {
      buttonText.setScale(0.95)
    })
    
    buttonZone.on('pointerup', () => {
      buttonText.setScale(1.1)
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      
      // Stop music before starting lobby
      if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
        this.backgroundMusic.stop()
      }
      
      this.scene.start('OnlineLobbyScene')
    })
  }

  createBackButton() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Small back button in corner
    const backButton = this.add.text(50, screenHeight - 50, '⬅️ BACK', {
      fontSize: `${window.getResponsiveFontSize(24)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 6 : 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0, 1).setDepth(1000).setInteractive()
    
    backButton.on('pointerover', () => {
      backButton.setScale(1.1)
      backButton.setTint(0xFFFF88)
    })
    
    backButton.on('pointerout', () => {
      backButton.setScale(1)
      backButton.clearTint()
    })
    
    backButton.on('pointerdown', () => {
      backButton.setScale(0.95)
    })
    
    backButton.on('pointerup', () => {
      backButton.setScale(1.1)
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      
      // Stop music before going back
      if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
        this.backgroundMusic.stop()
      }
      
      this.scene.start('TitleScene')
    })
  }

  createSettingsButton() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    const buttonY = screenHeight * 0.75
    
    // Button background - pink/purple for settings
    const buttonBg = this.add.graphics()
    buttonBg.fillGradientStyle(0xFF69B4, 0xFF69B4, 0xFF1493, 0xFF1493, 0.95)
    buttonBg.fillRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
    buttonBg.lineStyle(4, 0xFFFFFF, 0.9)
    buttonBg.strokeRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
    buttonBg.setDepth(100)
    
    // Create interaction zone
    const buttonZone = this.add.zone(screenWidth / 2, buttonY, 400, 80).setInteractive()
    buttonZone.setDepth(101)
    
    // Button text
    const buttonText = this.add.text(screenWidth / 2, buttonY, '⚙️ SETTINGS', {
      fontSize: `${window.getResponsiveFontSize(32)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 7 : 5,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Button description
    const buttonDesc = this.add.text(screenWidth / 2, buttonY + 50, 'Adjust music and sound effects!', {
      fontSize: `${window.getResponsiveFontSize(16)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 4 : 3,
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Store references
    this.settingsButton = { bg: buttonBg, text: buttonText, desc: buttonDesc, zone: buttonZone }
    
    // Interactions
    buttonZone.on('pointerover', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0xFF1493, 0xFF1493, 0xC71585, 0xC71585, 1)
      buttonBg.fillRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      buttonBg.lineStyle(4, 0xFFFFFF, 1)
      buttonBg.strokeRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      
      this.tweens.add({
        targets: buttonText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerout', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0xFF69B4, 0xFF69B4, 0xFF1493, 0xFF1493, 0.95)
      buttonBg.fillRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      buttonBg.lineStyle(4, 0xFFFFFF, 0.9)
      buttonBg.strokeRoundedRect(screenWidth / 2 - 200, buttonY - 40, 400, 80, 15)
      
      this.tweens.add({
        targets: buttonText,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerdown', () => {
      buttonText.setScale(0.95)
    })
    
    buttonZone.on('pointerup', () => {
      buttonText.setScale(1.1)
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      this.scene.launch('SettingsScene')
    })
  }

  setupInputs() {
    // ESC key to go back
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    
    this.escKey.on('down', () => {
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      
      // Stop music before going back
      if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
        this.backgroundMusic.stop()
      }
      
      this.scene.start('TitleScene')
    })
  }
}
