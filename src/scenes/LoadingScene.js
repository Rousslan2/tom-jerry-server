import Phaser from 'phaser'
import { screenSize } from '../gameConfig.json'
import { SettingsScene } from './SettingsScene.js'
import { AssetManager } from '../utils/AssetManager.js'

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' })
    this.loadingProgress = 0
  }

  preload() {
    // Load saved settings from localStorage
    SettingsScene.loadSettings()

    // Initialize Asset Manager for optimized loading
    this.assetManager = new AssetManager(this)

    // Setup loading progress UI
    this.setupLoadingProgressUI(this)

    // Setup resource loading event listeners
    this.load.on('progress', this.updateProgressBar, this)
    this.load.on('complete', this.onRealLoadComplete, this)

    // Ensure loading progress starts displaying from 0
    this.actualProgress = 0
    this.displayProgress = 0
    this.loadingComplete = false

    // Load asset pack by type with optimization
    this.load.pack('assetPack', 'assets/asset-pack.json')

    // Précharger des assets stratégiques
    this.assetManager.preloadStrategicAssets()
  }

  create() {
    // Progress UI is already created in setupLoadingProgressUI
    // Start smooth progress animation
    this.startProgressAnimation()
  }

  setupLoadingProgressUI() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    // Create Tom and Jerry style loading interface background
    this.createLoadingBackground()
    
    // Create loading title
    this.loadingTitle = this.add.text(screenWidth / 2, screenHeight * 0.3, 'Loading...', {
      fontSize: '48px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5)
    
    // Add title animation
    this.tweens.add({
      targets: this.loadingTitle,
      scale: { from: 0.95, to: 1.05 },
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    // Create progress bar container
    this.createProgressBar()
    
    // Create Jerry avatar
    this.createJerryIcon()
    
    // Create loading hint text
    this.createLoadingTips()
  }

  createLoadingBackground() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    // Create gradient background
    const bgGraphics = this.add.graphics()
    bgGraphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xFFF8DC, 0xFFF8DC, 0.9)
    bgGraphics.fillRect(0, 0, screenWidth, screenHeight)
    
    // Add some decorative dots - Tom and Jerry style
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, screenWidth - 50)
      const y = Phaser.Math.Between(50, screenHeight - 50)
      const size = Phaser.Math.Between(3, 8)
      
      const dot = this.add.graphics()
      dot.fillStyle(0xFFFFFF, 0.3)
      dot.fillCircle(x, y, size)
      
      // Add blinking animation
      this.tweens.add({
        targets: dot,
        alpha: { from: 0.2, to: 0.6 },
        duration: Phaser.Math.Between(1000, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000)
      })
    }
  }

  createProgressBar() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    this.progressBarY = screenHeight * 0.55
    this.progressBarWidth = screenWidth * 0.6
    this.progressBarHeight = 30
    this.progressBarX = (screenWidth - this.progressBarWidth) / 2
    
    // Progress bar background - dark border
    this.progressBg = this.add.graphics()
    this.progressBg.fillStyle(0x8B4513, 0.8) // Brown background
    this.progressBg.fillRoundedRect(this.progressBarX - 5, this.progressBarY - 5, this.progressBarWidth + 10, this.progressBarHeight + 10, 10)
    
    // Progress bar border - gold
    this.progressBg.lineStyle(3, 0xFFD700, 1)
    this.progressBg.strokeRoundedRect(this.progressBarX - 5, this.progressBarY - 5, this.progressBarWidth + 10, this.progressBarHeight + 10, 10)
    
    // Progress bar inner background
    this.progressInnerBg = this.add.graphics()
    this.progressInnerBg.fillStyle(0xF5F5DC, 0.9) // Beige inner
    this.progressInnerBg.fillRoundedRect(this.progressBarX, this.progressBarY, this.progressBarWidth, this.progressBarHeight, 5)
    
    // Progress bar fill
    this.progressBar = this.add.graphics()
    
    // Progress text
    this.progressText = this.add.text(screenWidth / 2, this.progressBarY + 50, '0%', {
      fontSize: '24px',
      fontFamily: window.getGameFont(),
      color: '#8B4513',
      stroke: '#FFFFFF',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5)
  }

  createJerryIcon() {
    // Jerry avatar will be created and updated in updateProgressBar
    this.jerryIcon = null
  }

  createLoadingTips() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    const tips = [
      "🧀 Match 3 cheese to score points!",
      "🏃 Help Jerry escape from Tom!",
      "⭐ Create special combos for bonus points!",
      "🎯 Complete objectives to win!",
      "🔥 Use power-ups strategically!"
    ]
    
    this.currentTip = 0
    this.tipText = this.add.text(screenWidth / 2, screenHeight * 0.75, tips[this.currentTip], {
      fontSize: '20px',
      fontFamily: window.getGameFont(),
      color: '#8B4513',
      stroke: '#FFFFFF',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    
    // Timed hint switching
    this.tipTimer = this.time.addEvent({
      delay: 2000,
      callback: () => {
        this.currentTip = (this.currentTip + 1) % tips.length
        
        // Fade out effect
        this.tweens.add({
          targets: this.tipText,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            this.tipText.setText(tips[this.currentTip])
            // Fade in effect
            this.tweens.add({
              targets: this.tipText,
              alpha: 1,
              duration: 300
            })
          }
        })
      },
      loop: true
    })
  }

  updateProgressBar(value) {
    // Record real loading progress
    this.actualProgress = value
    
    // Ensure UI elements have been created
    if (!this.progressBar || !this.progressText) {
      return
    }
    
    // Use display progress to update UI (will be updated by smooth animation)
    const displayValue = this.displayProgress || 0
    
    // Update progress bar fill
    this.progressBar.clear()
    this.progressBar.fillGradientStyle(0xFF6347, 0xFF6347, 0xFFD700, 0xFFD700, 1) // Orange-red to gold gradient
    this.progressBar.fillRoundedRect(
      this.progressBarX, 
      this.progressBarY, 
      this.progressBarWidth * displayValue, 
      this.progressBarHeight, 
      5
    )
    
    // Update progress text
    this.progressText.setText(Math.round(displayValue * 100) + '%')
    
    // Update Jerry avatar position
    this.updateJerryPosition(displayValue)
  }

  updateJerryPosition(progress) {
    // Ensure progress bar position parameters have been set
    if (typeof this.progressBarX === 'undefined' || typeof this.progressBarY === 'undefined') {
      return
    }
    
    if (!this.jerryIcon && this.textures.exists('jerry_head')) {
      // Create Jerry avatar
      this.jerryIcon = this.add.image(0, 0, 'jerry_head')
      this.jerryIcon.setScale(0.08) // Adjust size to fit progress bar
      this.jerryIcon.clearTint() // Remove dark tint, keep Jerry original bright colors
      
      // Add Jerry running animation - more lively swing
      this.tweens.add({
        targets: this.jerryIcon,
        angle: { from: -8, to: 8 },
        duration: 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
      // Add up-down bounce animation - reduce bounce height
      this.jerryBounceY = this.progressBarY - 25 // Reduce base height
      this.jerryIcon.setY(this.jerryBounceY) // Set initial position
      this.jerryBounceAnimation = this.tweens.add({
        targets: this.jerryIcon,
        y: this.jerryBounceY - 3, // Only bounce 3 pixels, more gentle
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
    
    if (this.jerryIcon) {
      // Jerry avatar moves with progress bar progress
      const jerryX = this.progressBarX + (this.progressBarWidth * progress)
      
      // Only update X coordinate, Y coordinate controlled by bounce animation
      this.jerryIcon.setX(jerryX)
      
      // Adjust Jerry animation speed and size based on progress
      if (progress < 0.2) {
        // Start phase - jog
        this.jerryIcon.setScale(0.08)
      } else if (progress < 0.5) {
        // Middle phase - normal run
        this.jerryIcon.setScale(0.09)
      } else if (progress < 0.8) {
        // Later phase - accelerated run
        this.jerryIcon.setScale(0.10)
      } else {
        // Sprint phase - fastest speed
        this.jerryIcon.setScale(0.11)
      }
      
      // Add excitement effect when approaching completion
      if (progress > 0.9) {
        this.jerryIcon.setTint(0xFFFFAA) // Slight glow effect
      }
    }
  }

  // Start smooth progress animation
  startProgressAnimation() {
    // Create smooth progress animation
    this.progressTween = this.tweens.add({
      targets: this,
      displayProgress: 1,
      duration: 3000, // 3 second loading animation, ensure user can see complete process
      ease: 'Power2.easeOut',
      onUpdate: () => {
        this.updateProgressBar(this.displayProgress)
      },
      onComplete: () => {
        // Only execute completion logic when real loading is also complete
        if (this.loadingComplete) {
          this.loadComplete()
        }
      }
    })
  }

  // Real loading complete callback
  onRealLoadComplete() {
    this.loadingComplete = true
    
    // If display progress is already complete, immediately execute completion logic
    if (this.displayProgress >= 1) {
      this.loadComplete()
    }
  }

  loadComplete() {
    // Ensure progress reaches 100%
    this.displayProgress = 1
    this.updateProgressBar(1)
    
    // Complete loading animation
    this.time.delayedCall(500, () => {
      // Create completion effect
      this.loadingTitle.setText('Loading Complete!')
      this.loadingTitle.setTint(0x32CD32) // Green
      
      // Jerry reaching endpoint celebration animation
      if (this.jerryIcon) {
        // Stop bounce animation
        if (this.jerryBounceAnimation) {
          this.jerryBounceAnimation.stop()
        }
        
        // Celebration animation - jump high first then fall back above progress bar
        const finalY = this.progressBarY - 25 // Final position above progress bar
        this.tweens.add({
          targets: this.jerryIcon,
          scaleX: 0.15,
          scaleY: 0.15,
          angle: 360,
          y: finalY - 15, // First jump to higher position
          duration: 400,
          ease: 'Back.easeOut',
          onComplete: () => {
            // Then fall back to appropriate position above progress bar
            this.tweens.add({
              targets: this.jerryIcon,
              y: finalY,
              duration: 400,
              ease: 'Bounce.easeOut'
            })
          }
        })
        
        // Blinking effect
        this.tweens.add({
          targets: this.jerryIcon,
          alpha: { from: 1, to: 0.5 },
          duration: 100,
          yoyo: true,
          repeat: 5
        })
      }
      
      // Force LINEAR filtering on ALL loaded textures to reduce pixelation from large assets
      this.applyLinearFilteringToAllTextures()
      
      // Switch to title scene after 1.5 seconds
      this.time.delayedCall(1500, () => {
        this.scene.start('TitleScene')
      })
    })
  }

  applyLinearFilteringToAllTextures() {
    let textureCount = 0

    // Iterate through all loaded textures
    this.textures.each((texture) => {
      if (texture.key && texture.key !== '__DEFAULT' && texture.key !== '__MISSING') {
        // Apply LINEAR filtering to each texture source
        if (texture.source && texture.source[0]) {
          texture.source[0].setFilter(1) // 1 = Phaser.Textures.FilterMode.LINEAR
          textureCount++

          // Also set scaleMode for WebGL rendering
          if (texture.source[0].scaleMode !== undefined) {
            texture.source[0].scaleMode = 1 // LINEAR
          }
        }
      }
    })

    console.log(`✅ Applied LINEAR filtering to ${textureCount} textures for smooth scaling`)

    // Utiliser l'AssetManager pour les optimisations supplémentaires
    if (this.assetManager) {
      this.assetManager.postLoadOptimization()
    }
  }

}