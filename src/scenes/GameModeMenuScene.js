import Phaser from 'phaser'
import { screenSize, audioConfig } from '../gameConfig.json'

/**
 * 🎮 NEW: Game Mode Selection Menu
 * Choose between different game modes!
 */
export class GameModeMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameModeMenuScene' })
  }

  create() {
    this.isMobile = window.isMobileDevice || false
    this.lastMode = localStorage.getItem('lastGameMode') || null
    this.recommendedMode = this.detectRecommendedMode()
    
    this.createBackground()
    this.createUI()
    this.setupInputs()
  }

  createBackground() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Background color
    const backgroundGraphics = this.add.graphics()
    backgroundGraphics.fillStyle(0x7B8B6B, 1)
    backgroundGraphics.fillRect(0, 0, screenWidth, screenHeight)
    backgroundGraphics.setDepth(-200)
    
    // Border
    const backgroundBorder = this.add.graphics()
    backgroundBorder.lineStyle(6, 0x000000, 0.3)
    backgroundBorder.strokeRoundedRect(20, 20, screenWidth - 40, screenHeight - 40, 15)
    backgroundBorder.lineStyle(3, 0xFFFFFF, 0.4)
    backgroundBorder.strokeRoundedRect(30, 30, screenWidth - 60, screenHeight - 60, 10)
    backgroundBorder.setDepth(-150)
    
    // Background image
    this.background = this.add.image(screenWidth / 2, screenHeight / 2, 'tom_jerry_garden_background')
    const scaleX = screenWidth / this.background.width
    const scaleY = screenHeight / this.background.height
    const scale = Math.max(scaleX, scaleY)
    this.background.setScale(scale)
    this.background.setDepth(-100)
    this.background.setAlpha(0.6)
  }

  createUI() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Title
    this.modeTitle = this.add.text(screenWidth / 2, 80, '🎯 GAME MODES 🎯', {
      fontSize: `${window.getResponsiveFontSize(48)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 8 : 6,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(1000)
    
    // Mode buttons (store for badges)
    this.modeButtons = {}
    this.modeButtons.classic = this.createModeButton('🏃 CLASSIC MODE', 'Complete objectives in 50 moves!', screenHeight * 0.25, 'classic', 0x4169E1)
    this.modeButtons.time_attack = this.createModeButton('⏱️ TIME ATTACK', 'Race against time! 2 minutes!', screenHeight * 0.40, 'time_attack', 0xFF6347)
    this.modeButtons.endless = this.createModeButton('♾️ ENDLESS MODE', 'No limits! Score as much as you can!', screenHeight * 0.55, 'endless', 0x9370DB)
    this.modeButtons.zen = this.createModeButton('🏆 ZEN MODE', 'Relax! No moves/time limit!', screenHeight * 0.70, 'zen', 0x32CD32)
    
    // Badges for last selected and recommended
    this.applyModeBadges()
    
    // Back button
    this.createBackButton()
  }

  createModeButton(title, description, y, mode, color) {
    const screenWidth = this.cameras.main.width
    
    // Button background
    const buttonBg = this.add.graphics()
    const darkerColor = Phaser.Display.Color.IntegerToColor(color).darken(20).color
    buttonBg.fillGradientStyle(color, color, darkerColor, darkerColor, 0.95)
    buttonBg.fillRoundedRect(screenWidth / 2 - 300, y - 35, 600, 70, 15)
    buttonBg.lineStyle(4, 0xFFFFFF, 0.9)
    buttonBg.strokeRoundedRect(screenWidth / 2 - 300, y - 35, 600, 70, 15)
    buttonBg.setDepth(100)
    
    // Interaction zone
    const buttonZone = this.add.zone(screenWidth / 2, y, 600, 70).setInteractive()
    buttonZone.setDepth(101)
    
    // Button text
    const buttonText = this.add.text(screenWidth / 2, y - 8, title, {
      fontSize: `${window.getResponsiveFontSize(28)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 6 : 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Description
    const buttonDesc = this.add.text(screenWidth / 2, y + 18, description, {
      fontSize: `${window.getResponsiveFontSize(14)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 3 : 2,
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    // Badge container
    const badgeText = this.add.text(screenWidth / 2 + 300 - 70, y - 35, '', {
      fontSize: `${window.getResponsiveFontSize(12)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(1, 0).setDepth(250)
    
    // Interactions
    buttonZone.on('pointerover', () => {
      const lighterColor = Phaser.Display.Color.IntegerToColor(color).lighten(20).color
      buttonBg.clear()
      buttonBg.fillGradientStyle(lighterColor, lighterColor, color, color, 1)
      buttonBg.fillRoundedRect(screenWidth / 2 - 300, y - 35, 600, 70, 15)
      buttonBg.lineStyle(4, 0xFFFFFF, 1)
      buttonBg.strokeRoundedRect(screenWidth / 2 - 300, y - 35, 600, 70, 15)
      
      this.tweens.add({
        targets: [buttonText, buttonDesc],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerout', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(color, color, darkerColor, darkerColor, 0.95)
      buttonBg.fillRoundedRect(screenWidth / 2 - 300, y - 35, 600, 70, 15)
      buttonBg.lineStyle(4, 0xFFFFFF, 0.9)
      buttonBg.strokeRoundedRect(screenWidth / 2 - 300, y - 35, 600, 70, 15)
      
      this.tweens.add({
        targets: [buttonText, buttonDesc],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeOut'
      })
    })
    
    buttonZone.on('pointerdown', () => {
      buttonText.setScale(0.95)
      buttonDesc.setScale(0.95)
    })
    
    buttonZone.on('pointerup', () => {
      buttonText.setScale(1.05)
      buttonDesc.setScale(1.05)
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      
      // Start game with selected mode
      const safeMode = this.sanitizeMode(mode)
      try { localStorage.setItem('lastGameMode', safeMode) } catch (e) {}
      this.scene.start('GameScene', { mode: 'single', gameMode: safeMode })
    })
    
    return { bg: buttonBg, zone: buttonZone, title: buttonText, desc: buttonDesc, badge: badgeText, mode }
  }

  createBackButton() {
    const screenWidth = this.cameras.main.width
    
    const buttonY = 50
    
    // Button background
    const buttonBg = this.add.graphics()
    buttonBg.fillGradientStyle(0x696969, 0x696969, 0x808080, 0x808080, 0.9)
    buttonBg.fillRoundedRect(30, buttonY - 20, 140, 40, 10)
    buttonBg.lineStyle(3, 0xFFFFFF, 0.8)
    buttonBg.strokeRoundedRect(30, buttonY - 20, 140, 40, 10)
    buttonBg.setDepth(100)
    
    const buttonZone = this.add.zone(100, buttonY, 140, 40).setInteractive()
    buttonZone.setDepth(101)
    
    const buttonText = this.add.text(100, buttonY, '← BACK', {
      fontSize: `${window.getResponsiveFontSize(18)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(200)
    
    buttonZone.on('pointerover', () => {
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x808080, 0x808080, 0x969696, 0x969696, 1)
      buttonBg.fillRoundedRect(30, buttonY - 20, 140, 40, 10)
      buttonBg.lineStyle(3, 0xFFFFFF, 1)
      buttonBg.strokeRoundedRect(30, buttonY - 20, 140, 40, 10)
      
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
      buttonBg.fillGradientStyle(0x696969, 0x696969, 0x808080, 0x808080, 0.9)
      buttonBg.fillRoundedRect(30, buttonY - 20, 140, 40, 10)
      buttonBg.lineStyle(3, 0xFFFFFF, 0.8)
      buttonBg.strokeRoundedRect(30, buttonY - 20, 140, 40, 10)
      
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
      this.scene.start('ModeSelectionScene')
    })
  }

  setupInputs() {
    // ESC to go back
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.escKey.on('down', () => {
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      this.scene.start('ModeSelectionScene')
    })
    
    // Quick keyboard shortcuts for modes
    this.oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
    this.twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
    this.threeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
    this.fourKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)
    
    this.oneKey.on('down', () => this.launchMode('classic'))
    this.twoKey.on('down', () => this.launchMode('time_attack'))
    this.threeKey.on('down', () => this.launchMode('endless'))
    this.fourKey.on('down', () => this.launchMode('zen'))
  }

  applyModeBadges() {
    // Last selected badge
    if (this.lastMode && this.modeButtons[this.lastMode]) {
      const btn = this.modeButtons[this.lastMode]
      btn.badge.setText('LAST PLAYED')
    }
    // Recommended badge
    if (this.recommendedMode && this.modeButtons[this.recommendedMode]) {
      const btn = this.modeButtons[this.recommendedMode]
      const current = btn.badge.text
      btn.badge.setText(current ? current + ' | RECOMMENDED' : 'RECOMMENDED')
    }
  }

  detectRecommendedMode() {
    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const width = window.innerWidth
      const height = window.innerHeight
      const isSmallScreen = Math.min(width, height) < 720
      const isHighDpr = dpr > 2
      
      if (this.isMobile && (isSmallScreen || isHighDpr)) {
        return 'zen' // le plus doux pour devices modestes
      }
      // Desktop ou mobile correct -> classic par défaut
      return 'classic'
    } catch (e) {
      return 'classic'
    }
  }

  sanitizeMode(mode) {
    const allowed = { classic: true, time_attack: true, endless: true, zen: true }
    return allowed[mode] ? mode : 'classic'
  }

  launchMode(mode) {
    const safeMode = this.sanitizeMode(mode)
    try { localStorage.setItem('lastGameMode', safeMode) } catch (e) {}
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
    this.scene.start('GameScene', { mode: 'single', gameMode: safeMode })
  }
}
