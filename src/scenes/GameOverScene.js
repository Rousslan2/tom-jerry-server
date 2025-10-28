import Phaser from 'phaser'
import { screenSize, audioConfig } from '../gameConfig.json'

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data) {
    // Receive score and stats from GameScene
    this.finalScore = data.score || 0
    this.movesUsed = data.moves || 0
  }

  preload() {
    this.load.image('button_normal', 'https://cdn-game-mcp.gambo.ai/53ea91d9-082a-4d85-a7b6-f5530b90dfa3/images/button_normal.png')
    this.load.audio('ui_click', 'https://cdn-game-mcp.gambo.ai/57fc23da-9ff4-420e-9481-481da6820432/sound_effects/ui_click.mp3')
  }

  create() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value

    // Semi-transparent black background overlay
    this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.8)

    // Create centered Game Over panel
    this.createGameOverPanel()

    this.setupInputs()
  }

  createGameOverPanel() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2
    
    // Calculate panel size (responsive)
    const panelWidth = Math.min(450, screenWidth * 0.8)
    const panelHeight = Math.min(550, screenHeight * 0.8)
    
    // Create main panel background - dark red theme, fits Game Over atmosphere
    const panelBg = this.add.graphics()
    // Outer shadow
    panelBg.fillStyle(0x000000, 0.4)
    panelBg.fillRoundedRect(centerX - panelWidth/2 + 5, centerY - panelHeight/2 + 5, panelWidth, panelHeight, 20)
    // Main background - dark red gradient
    panelBg.fillGradientStyle(0x8B0000, 0x8B0000, 0xDC143C, 0xDC143C, 0.9)
    panelBg.fillRoundedRect(centerX - panelWidth/2, centerY - panelHeight/2, panelWidth, panelHeight, 20)
    // Outer border - gold
    panelBg.lineStyle(4, 0xFFD700, 1)
    panelBg.strokeRoundedRect(centerX - panelWidth/2, centerY - panelHeight/2, panelWidth, panelHeight, 20)
    // Inner border - dark gold
    panelBg.lineStyle(2, 0xB8860B, 0.8)
    panelBg.strokeRoundedRect(centerX - panelWidth/2 + 8, centerY - panelHeight/2 + 8, panelWidth - 16, panelHeight - 16, 15)
    
    panelBg.setDepth(100)
    
    // Game Over title
    this.add.text(centerX, centerY - 180, '💀 GAME OVER 💀', {
      fontSize: '32px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)

    // Failure reason text
    this.add.text(centerX, centerY - 100, 'You ran out of moves!\nTry organizing more efficiently next time.', {
      fontSize: '16px',
      fontFamily: window.getGameFont(),
      color: '#FFE4E1',  // Light pink
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5, 0.5).setDepth(200)

    // ⭐ NEW: Stats display
    this.createStatsDisplay(centerX, centerY)

    // Create button area
    this.createGameOverButtons(centerX, centerY)
  }

  createStatsDisplay(centerX, centerY) {
    // Stats panel
    const statY = centerY - 40
    
    // Score display
    this.add.text(centerX, statY, `🏆 Final Score: ${this.finalScore.toLocaleString()}`, {
      fontSize: '24px',
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#8B0000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Moves used
    this.add.text(centerX, statY + 40, `✨ Moves Used: ${this.movesUsed}`, {
      fontSize: '18px',
      fontFamily: window.getGameFont(),
      color: '#FFE4E1',
      stroke: '#8B0000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Encouragement message
    this.add.text(centerX, statY + 75, '💪 Try again to beat your score!', {
      fontSize: '16px',
      fontFamily: window.getGameFont(),
      color: '#32CD32',
      stroke: '#006400',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)
  }

  createGameOverButtons(centerX, centerY) {
    const buttonWidth = 280
    const buttonHeight = 50
    const buttonSpacing = 100  // Increase spacing
    
    const buttonAreaY = centerY + 150  // Move buttons further down to avoid covering stats
    
    // Try Again button (green theme) - move further down
    this.createTryAgainButton(centerX, buttonAreaY - buttonSpacing/2, buttonWidth, buttonHeight)
    
    // Main Menu button (blue theme)  
    this.createMainMenuButton(centerX, buttonAreaY + buttonSpacing/2, buttonWidth, buttonHeight)
  }

  createTryAgainButton(x, y, width, height) {
    // Button background
    const buttonBg = this.add.graphics()
    buttonBg.fillGradientStyle(0x228B22, 0x228B22, 0x32CD32, 0x32CD32, 0.9)
    buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 10)
    buttonBg.lineStyle(3, 0xFFFFFF, 0.8)
    buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 10)
    buttonBg.setDepth(150)
    
    // Create interaction area
    const buttonZone = this.add.zone(x, y, width, height).setInteractive()
    buttonZone.setDepth(151)
    
    // Button text
    const buttonText = this.add.text(x, y, '🔄 TRY AGAIN', {
      fontSize: '20px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#006400',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Store references for interaction use
    this.tryAgainButton = { bg: buttonBg, text: buttonText, zone: buttonZone }
    
    // Button interaction effects
    buttonZone.on('pointerover', () => {
      // Background brightens
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x32CD32, 0x32CD32, 0x3CB371, 0x3CB371, 0.95)
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 10)
      buttonBg.lineStyle(3, 0xFFFFFF, 1)
      buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 10)
      
      // Text floating effect
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
      // Restore original background
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x228B22, 0x228B22, 0x32CD32, 0x32CD32, 0.9)
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 10)
      buttonBg.lineStyle(3, 0xFFFFFF, 0.8)
      buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 10)
      
      // Text returns to original position
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
      // Press effect
      this.tweens.add({
        targets: buttonText,
        y: y + 2,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        ease: 'Power2'
      })
    })
    
    buttonZone.on('pointerup', () => {
      // Release effect
      this.tweens.add({
        targets: buttonText,
        y: y - 3,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Back.easeOut'
      })
      this.retryLevel()
    })
  }

  createMainMenuButton(x, y, width, height) {
    // Button background 
    const buttonBg = this.add.graphics()
    buttonBg.fillGradientStyle(0x4169E1, 0x4169E1, 0x6495ED, 0x6495ED, 0.9)
    buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 10)
    buttonBg.lineStyle(3, 0xFFFFFF, 0.8)
    buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 10)
    buttonBg.setDepth(150)
    
    // Create interaction area
    const buttonZone = this.add.zone(x, y, width, height).setInteractive()
    buttonZone.setDepth(151)
    
    // Button text
    const buttonText = this.add.text(x, y, '🏠 MAIN MENU', {
      fontSize: '20px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#191970',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Store references for interaction use
    this.mainMenuButton = { bg: buttonBg, text: buttonText, zone: buttonZone }
    
    // Button interaction effects
    buttonZone.on('pointerover', () => {
      // Background brightens
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x6495ED, 0x6495ED, 0x87CEEB, 0x87CEEB, 0.95)
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 10)
      buttonBg.lineStyle(3, 0xFFFFFF, 1)
      buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 10)
      
      // Text floating effect
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
      // Restore original background
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x4169E1, 0x4169E1, 0x6495ED, 0x6495ED, 0.9)
      buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 10)
      buttonBg.lineStyle(3, 0xFFFFFF, 0.8)
      buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 10)
      
      // Text returns to original position
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
      // Press effect
      this.tweens.add({
        targets: buttonText,
        y: y + 2,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        ease: 'Power2'
      })
    })
    
    buttonZone.on('pointerup', () => {
      // Release effect
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
      this.retryLevel()
    })

    this.spaceKey.on('down', () => {
      this.retryLevel()
    })
  }

  retryLevel() {
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
    
    // Stop game music before restarting
    const gameScene = this.scene.get('GameScene')
    if (gameScene && gameScene.backgroundMusic && gameScene.backgroundMusic.isPlaying) {
      gameScene.backgroundMusic.stop()
    }
    
    // Close current scene
    this.scene.stop('GameScene')
    this.scene.stop()
    
    // Restart game scene - pass reset flag
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