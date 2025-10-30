import Phaser from 'phaser'
import { screenSize, audioConfig } from '../gameConfig.json'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
    this.isStarting = false
  }

  init() {
    this.isStarting = false
  }

  preload() {
    // Resources are now loaded in LoadingScene via asset-pack.json, no need to load any resources here
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
      this.setupMobileFullscreenPrompt()
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
    
    // Create main background color (light blue-gray, fits Tom and Jerry style)
    const backgroundGraphics = this.add.graphics()
    backgroundGraphics.fillStyle(0x6B8E8E, 1) // Soft blue-gray background
    backgroundGraphics.fillRect(0, 0, screenWidth, screenHeight)
    backgroundGraphics.setDepth(-200)
    
    // Add decorative border
    const backgroundBorder = this.add.graphics()
    backgroundBorder.lineStyle(6, 0x000000, 0.3) // Thick black border
    backgroundBorder.strokeRoundedRect(20, 20, screenWidth - 40, screenHeight - 40, 15)
    backgroundBorder.lineStyle(3, 0xFFFFFF, 0.4) // White inner border
    backgroundBorder.strokeRoundedRect(30, 30, screenWidth - 60, screenHeight - 60, 10)
    backgroundBorder.setDepth(-150)
    
    // Create Tom and Jerry style cartoon background
    this.background = this.add.image(screenWidth / 2, screenHeight / 2, 'title_background')
    
    // Calculate scale ratio to ensure background covers entire screen
    const scaleX = screenWidth / this.background.width
    const scaleY = screenHeight / this.background.height
    const scale = Math.max(scaleX, scaleY)
    
    this.background.setScale(scale)
    this.background.setDepth(-100)
    this.background.setAlpha(0.8) // Slightly transparent to make effect softer
    
    // Add decorative dots
    const backgroundOverlay = this.add.graphics()
    backgroundOverlay.fillStyle(0xFFFFFF, 0.1) // White decorative dots
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, screenWidth - 50)
      const y = Phaser.Math.Between(50, screenHeight - 50)
      backgroundOverlay.fillCircle(x, y, Phaser.Math.Between(3, 8))
    }
    backgroundOverlay.setDepth(-50)
    
    // Add Jerry animation effect
    this.createJerryAnimation()
  }
  
  // Add Jerry random appearance and escape animation
  createJerryAnimation() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Set timer to make Jerry appear randomly
    this.time.addEvent({
      delay: Phaser.Math.Between(3000, 6000),
      callback: () => {
        // Randomly select Jerry appearance position
        const x = Phaser.Math.Between(50, screenWidth - 50)
        const y = Phaser.Math.Between(screenHeight * 0.6, screenHeight - 50) // Mainly in lower half of screen
        
        // Create Jerry
        const jerry = this.add.image(x, y, 'mouse_run_away')
          .setOrigin(0.5, 0.5)
          .setScale(0) // Start from 0, pop effect
          .setDepth(100)
        
        // First let Jerry pop up
        this.tweens.add({
          targets: jerry,
          scale: 0.08, // First a bit larger than normal size
          duration: 150,
          ease: 'Back.easeOut.config(1.7)',
          onComplete: () => {
            // Let Jerry stay for a moment
            this.time.delayedCall(300, () => {
              // Start escape animation
              this.tweens.add({
                targets: jerry,
                x: x + Phaser.Math.Between(150, 250), // Escape to the right
                y: y - Phaser.Math.Between(20, 50),  // Run slightly upward
                scaleX: 0.05,
                scaleY: 0.05,
                rotation: 0.1,
                duration: 400,
                ease: 'Quad.easeOut',
                onComplete: () => {
                  jerry.destroy()
                  
                  // Create smoke cloud effect
                  const dustCloud = this.add.image(x + 150, y - 30, 'dust_cloud')
                    .setOrigin(0.5, 0.5)
                    .setScale(0.08)
                    .setAlpha(0.8)
                    .setDepth(99)
                  
                  // Smoke animation
                  this.tweens.add({
                    targets: dustCloud,
                    scaleX: 0.12,
                    scaleY: 0.12,
                    alpha: 0,
                    x: x + 250,
                    duration: 600,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                      dustCloud.destroy()
                    }
                  })
                }
              })
            })
          }
        })
      },
      loop: true
    })
  }

  createUI() {
    this.createGameTitle()
    this.createStartButton()
  }

  createGameTitle() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Create game title
    this.gameTitle = this.add.image(screenWidth / 2, screenHeight * 0.25, 'game_title')
    
    // Adapt title size - enlarge title
    const maxTitleWidth = screenWidth * 0.95  // Increase from 0.85 to 0.95
    const maxTitleHeight = screenHeight * 0.45  // Increase from 0.35 to 0.45
    
    if (this.gameTitle.width / this.gameTitle.height > maxTitleWidth / maxTitleHeight) {
      this.gameTitle.setScale(maxTitleWidth / this.gameTitle.width)
    } else {
      this.gameTitle.setScale(maxTitleHeight / this.gameTitle.height)
    }
    
    // Add title animation
    this.tweens.add({
      targets: this.gameTitle,
      y: this.gameTitle.y - 8,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    // Create game slogan
    this.gameTagline = this.add.text(screenWidth / 2, screenHeight * 0.45, 'Match 3 & Escape Tom!', {
      fontSize: `${window.getResponsiveFontSize(28)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 6 : 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(1000)
    
    // Add slogan animation effect
    this.tweens.add({
      targets: this.gameTagline,
      scale: { from: 0.95, to: 1.05 },
      duration: 1800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  createStartButton() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Create start game button
    this.startButton = this.add.image(screenWidth / 2, screenHeight * 0.7, 'cartoon_button')
      .setInteractive()
      .setScale(0.4)
    
    // Button text - use more cartoon style
    this.startButtonText = this.add.text(screenWidth / 2, screenHeight * 0.7, 'START GAME', {
      fontSize: `${window.getResponsiveFontSize(32)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 8 : 6,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5)
    
    // Add shadow to button text
    this.startButtonText.setShadow(3, 3, 'rgba(0,0,0,0.5)', 5)
    
    // Add hint text - adapt for mobile/desktop
    const hintMessage = this.isMobile 
      ? '(Tap button to start)' 
      : '(Press ENTER or SPACE to start)'
    
    this.hintText = this.add.text(screenWidth / 2, screenHeight * 0.8, hintMessage, {
      fontSize: `${window.getResponsiveFontSize(16)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 4 : 3,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    
    // Add blinking effect to hint text
    this.tweens.add({
      targets: this.hintText,
      alpha: { from: 0.5, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    })
    
    // Button interaction
    this.startButton.on('pointerover', () => {
      this.startButton.setScale(0.45)
      this.startButtonText.setScale(1.1)
    })
    
    this.startButton.on('pointerout', () => {
      this.startButton.setScale(0.4)
      this.startButtonText.setScale(1)
    })
    
    this.startButton.on('pointerdown', () => {
      this.startButton.setScale(0.35)
      this.startButtonText.setScale(0.9)
    })
    
    this.startButton.on('pointerup', () => {
      this.startButton.setScale(0.45)
      this.startButtonText.setScale(1.1)
      this.tryEnterFullscreenThenStart()
    })
  }

  setupInputs() {
    // Listen for enter key
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    
    this.enterKey.on('down', () => {
      this.tryEnterFullscreenThenStart()
    })
    
    this.spaceKey.on('down', () => {
      this.tryEnterFullscreenThenStart()
    })
  }

  // Prompt and handle fullscreen on mobile (must be user-gesture)
  setupMobileFullscreenPrompt() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // If already fullscreen-capable and mobile, show a small hint button
    this.fullscreenBtn = this.add.text(screenWidth - 20, screenHeight - 20, '⛶', {
      fontSize: `${window.getResponsiveFontSize(22)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1,1).setDepth(2000).setInteractive({ useHandCursor: true })
    
    this.fullscreenBtn.on('pointerup', async () => {
      await this.requestFullscreenSafe()
    })
  }

  async tryEnterFullscreenThenStart() {
    try {
      if (this.isMobile) {
        await this.requestFullscreenSafe()
      }
    } catch (e) {
      // Ignore failures (user denied or not available)
    }
    this.startGame()
  }

  async requestFullscreenSafe() {
    const canvas = this.game.canvas
    if (!canvas) return
    
    const doc = document
    const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement
    if (isFs) return
    
    const el = doc.documentElement
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen
    if (req) {
      try {
        await req.call(el, { navigationUI: 'hide' })
      } catch (e) {
        // Some browsers need fallback on the canvas element
        const reqCanvas = canvas.requestFullscreen || canvas.webkitRequestFullscreen || canvas.msRequestFullscreen
        if (reqCanvas) {
          try { await reqCanvas.call(canvas) } catch (_) { /* noop */ }
        }
      }
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

  startGame() {
    if (this.isStarting) return
    
    this.isStarting = true
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
    
    // Stop background music before switching scenes
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop()
    }
    
    // Switch to mode selection scene
    this.scene.start('ModeSelectionScene')
  }

  update() {
    // Title screen does not need special update logic
  }
}