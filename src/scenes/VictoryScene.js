import Phaser from 'phaser'
import { screenSize, audioConfig } from '../gameConfig.json'

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' })
  }

  preload() {
    this.load.image('button_normal', 'https://cdn-game-mcp.gambo.ai/53ea91d9-082a-4d85-a7b6-f5530b90dfa3/images/button_normal.png')
    this.load.audio('ui_click', 'https://cdn-game-mcp.gambo.ai/57fc23da-9ff4-420e-9481-481da6820432/sound_effects/ui_click.mp3')
  }

  create() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value

    // Create magnificent victory background
    this.createVictoryBackground()

    // Create Tom and Jerry style victory panel
    this.createVictoryPanel()

    this.setupInputs()
  }

  createVictoryBackground() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value

    // Semi-transparent black background overlay
    this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.8)

    // Create celebration particle effects
    this.createCelebrationEffects()
  }

  createCelebrationEffects() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value

    // Create colorful star blinking effects
    const stars = ['⭐', '✨', '🌟', '💫', '🎉', '🎊', '🏆', '👑']
    for (let i = 0; i < 20; i++) {
      const star = this.add.text(
        Phaser.Math.Between(50, screenWidth - 50),
        Phaser.Math.Between(50, screenHeight - 50),
        stars[Math.floor(Math.random() * stars.length)],
        {
          fontSize: Phaser.Math.Between(20, 40) + 'px',
          color: ['#FFD700', '#FF69B4', '#00FF00', '#00BFFF', '#FF6347'][Math.floor(Math.random() * 5)]
        }
      ).setOrigin(0.5, 0.5).setDepth(100)

      // Star blinking animation
      this.tweens.add({
        targets: star,
        alpha: { from: 1, to: 0.3 },
        scaleX: { from: 1, to: 1.5 },
        scaleY: { from: 1, to: 1.5 },
        rotation: Math.PI * 2,
        duration: Phaser.Math.Between(1000, 2000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000)
      })
    }
  }

  createVictoryPanel() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2
    
    // Calculate panel size (responsive)
    const panelWidth = Math.min(500, screenWidth * 0.8)
    const panelHeight = Math.min(600, screenHeight * 0.8)
    
    // Create main panel background - gold theme, fits victory atmosphere
    const panelBg = this.add.graphics()
    // Outer shadow
    panelBg.fillStyle(0x000000, 0.4)
    panelBg.fillRoundedRect(centerX - panelWidth/2 + 5, centerY - panelHeight/2 + 5, panelWidth, panelHeight, 20)
    // Main background - gold gradient
    panelBg.fillGradientStyle(0xFFD700, 0xFFD700, 0xFFA500, 0xFFA500, 0.95)
    panelBg.fillRoundedRect(centerX - panelWidth/2, centerY - panelHeight/2, panelWidth, panelHeight, 20)
    // Outer border - dark gold
    panelBg.lineStyle(4, 0xB8860B, 1)
    panelBg.strokeRoundedRect(centerX - panelWidth/2, centerY - panelHeight/2, panelWidth, panelHeight, 20)
    // Inner border - light gold
    panelBg.lineStyle(2, 0xFFFF99, 0.8)
    panelBg.strokeRoundedRect(centerX - panelWidth/2 + 8, centerY - panelHeight/2 + 8, panelWidth - 16, panelHeight - 16, 15)
    
    panelBg.setDepth(200)
    
    // Victory title - Tom and Jerry style
    this.add.text(centerX, centerY - 180, '🏆 VICTORY! 🏆', {
      fontSize: '40px',
      fontFamily: window.getGameFont(),
      color: '#8B4513',  // Dark brown
      stroke: '#FFD700',  // Gold stroke
      strokeThickness: 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(300)

    // Jerry successful escape celebration text
    this.add.text(centerX, centerY - 120, '🐭 Jerry successfully escaped!\nTom\'s chaos has been organized! 🧀', {
      fontSize: '18px',
      fontFamily: window.getGameFont(),
      color: '#8B4513',  // Dark brown
      stroke: '#FFF8DC',  // Light stroke
      strokeThickness: 2,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5, 0.5).setDepth(300)

    // Create button area
    this.createVictoryButtons(centerX, centerY)
  }

  createVictoryButtons(centerX, centerY) {
    const buttonWidth = 280
    const buttonHeight = 50
    const buttonSpacing = 100
    
    const buttonAreaY = centerY + 20
    
    // Continue button (green theme)
    this.createContinueButton(centerX, buttonAreaY - buttonSpacing/2, buttonWidth, buttonHeight)
    
    // Main Menu button (blue theme)
    this.createMainMenuButton(centerX, buttonAreaY + buttonSpacing/2, buttonWidth, buttonHeight)
  }

  createContinueButton(x, y, width, height) {
    // Button background
    const buttonBg = this.add.graphics()
    buttonBg.fillGradientStyle(0x32CD32, 0x32CD32, 0x228B22, 0x228B22, 0.95)
    buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 12)
    buttonBg.lineStyle(3, 0xFFFFFF, 0.9)
    buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 12)
    buttonBg.setDepth(250)
    
    // Create interaction area
    const buttonZone = this.add.zone(x, y, width, height).setInteractive()
    buttonZone.setDepth(251)
    
    // Button text
    const buttonText = this.add.text(x, y, '🎮 PLAY AGAIN', {
      fontSize: '20px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#006400',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(300)
    
    // Store references
    this.continueButton = { bg: buttonBg, text: buttonText, zone: buttonZone }
    
    // Button interaction effects
    buttonZone.on('pointerover', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x3CB371, 0x3CB371, 0x32CD32, 0x32CD32, 0.98)
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 12)
      buttonBg.lineStyle(3, 0xFFFFFF, 1)
      buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 12)
      
      this.tweens.add({
        targets: buttonText,
        y: y - 3,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerout', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x32CD32, 0x32CD32, 0x228B22, 0x228B22, 0.95)
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 12)
      buttonBg.lineStyle(3, 0xFFFFFF, 0.9)
      buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 12)
      
      this.tweens.add({
        targets: buttonText,
        y: y,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerdown', () => {
      this.tweens.add({
        targets: buttonText,
        y: y + 2,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50
      })
    })
    
    buttonZone.on('pointerup', () => {
      this.tweens.add({
        targets: buttonText,
        y: y - 3,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Back.easeOut'
      })
      this.nextLevel()
    })
  }

  createMainMenuButton(x, y, width, height) {
    // Button background
    const buttonBg = this.add.graphics()
    buttonBg.fillGradientStyle(0x4169E1, 0x4169E1, 0x6495ED, 0x6495ED, 0.95)
    buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 12)
    buttonBg.lineStyle(3, 0xFFFFFF, 0.9)
    buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 12)
    buttonBg.setDepth(250)
    
    // Create interaction area
    const buttonZone = this.add.zone(x, y, width, height).setInteractive()
    buttonZone.setDepth(251)
    
    // Button text
    const buttonText = this.add.text(x, y, '🏠 MAIN MENU', {
      fontSize: '20px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#191970',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(300)
    
    // Store references
    this.mainMenuButton = { bg: buttonBg, text: buttonText, zone: buttonZone }
    
    // Button interaction effects
    buttonZone.on('pointerover', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x6495ED, 0x6495ED, 0x87CEEB, 0x87CEEB, 0.98)
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 12)
      buttonBg.lineStyle(3, 0xFFFFFF, 1)
      buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 12)
      
      this.tweens.add({
        targets: buttonText,
        y: y - 3,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerout', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x4169E1, 0x4169E1, 0x6495ED, 0x6495ED, 0.95)
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 12)
      buttonBg.lineStyle(3, 0xFFFFFF, 0.9)
      buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 12)
      
      this.tweens.add({
        targets: buttonText,
        y: y,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerdown', () => {
      this.tweens.add({
        targets: buttonText,
        y: y + 2,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50
      })
    })
    
    buttonZone.on('pointerup', () => {
      this.tweens.add({
        targets: buttonText,
        y: y - 3,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Back.easeOut'
      })
      this.goToMainMenu()
    })
  }

  setupInputs() {
    // Listen for keyboard input
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.enterKey.on('down', () => {
      this.nextLevel()
    })

    this.spaceKey.on('down', () => {
      this.nextLevel()
    })
  }

  nextLevel() {
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
    
    // Stop game music before restarting
    const gameScene = this.scene.get('GameScene')
    if (gameScene && gameScene.backgroundMusic && gameScene.backgroundMusic.isPlaying) {
      gameScene.backgroundMusic.stop()
    }
    
    // Close current scene
    this.scene.stop('GameScene')
    this.scene.stop()
    
    // Start new game scene - pass reset flag
    this.scene.start('GameScene', { reset: true })
  }

  goToMainMenu() {
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
    
    // Stop game music before returning to menu
    const gameScene = this.scene.get('GameScene')
    if (gameScene && gameScene.backgroundMusic && gameScene.backgroundMusic.isPlaying) {
      gameScene.backgroundMusic.stop()
    }
    
    // Close all game scenes
    this.scene.stop('GameScene')
    this.scene.stop()
    
    // Return to title scene
    this.scene.start('TitleScene')
  }
}