import Phaser from 'phaser'
import { screenSize, gameConfig, levelConfig, audioConfig } from '../gameConfig.json'

export class PlayerProfileScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerProfileScene' })
  }

  init(data) {
    // Get player stats from localStorage or initialize defaults
    this.playerStats = this.loadPlayerStats()
  }

  preload() {
    // Resources are loaded in LoadingScene
  }

  create() {
    // 🎵 Stop other music
    this.stopAllOtherMusic()

    // Create background
    this.createBackground()

    // Create UI elements
    this.createProfileUI()

    // Create back button
    this.createBackButton()

    // Play background music
    this.playBackgroundMusic()
  }

  createBackground() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height

    // Gray background
    this.backgroundGraphics = this.add.graphics()
    this.backgroundGraphics.fillStyle(0x808080, 1)
    this.backgroundGraphics.fillRect(0, 0, screenWidth, screenHeight)
    this.backgroundGraphics.setDepth(-200)

    // Decorative borders
    this.backgroundWalls = this.add.graphics()
    this.backgroundWalls.lineStyle(6, 0x000000, 0.3)
    this.backgroundWalls.strokeRoundedRect(20, 20, screenWidth - 40, screenHeight - 40, 15)
    this.backgroundWalls.lineStyle(3, 0xFFFFFF, 0.4)
    this.backgroundWalls.strokeRoundedRect(30, 30, screenWidth - 60, screenHeight - 60, 10)
    this.backgroundWalls.setDepth(-150)
  }

  createProfileUI() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height

    // Profile title
    this.titleText = this.add.text(screenWidth / 2, 50, '👤 PLAYER PROFILE', {
      fontSize: `${window.getResponsiveFontSize(32)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2000)

    // Stats panel background
    this.statsBg = this.add.graphics()
    this.statsBg.fillGradientStyle(0xFFFACD, 0xFFFACD, 0xF5DEB3, 0xF5DEB3, 0.95)
    this.statsBg.fillRoundedRect(50, 100, screenWidth - 100, screenHeight - 200, 20)
    this.statsBg.lineStyle(4, 0xFFFFFF, 0.9)
    this.statsBg.strokeRoundedRect(50, 100, screenWidth - 100, screenHeight - 200, 20)
    this.statsBg.setDepth(1990)

    // Stats title
    this.statsTitle = this.add.text(screenWidth / 2, 130, '📊 GAME STATISTICS', {
      fontSize: `${window.getResponsiveFontSize(24)}px`,
      fontFamily: window.getGameFont(),
      color: '#8B4513',
      stroke: '#DEB887',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2000)

    // Display stats
    this.displayStats()
  }

  displayStats() {
    const screenWidth = this.cameras.main.width
    const startY = 180
    const lineHeight = 35
    let currentY = startY

    const stats = [
      { label: '🎮 Games Played:', value: this.playerStats.gamesPlayed },
      { label: '🏆 Games Won:', value: this.playerStats.gamesWon },
      { label: '📈 Win Rate:', value: this.calculateWinRate() + '%' },
      { label: '⭐ Total Score:', value: this.playerStats.totalScore.toLocaleString() },
      { label: '🎯 Best Score:', value: this.playerStats.bestScore.toLocaleString() },
      { label: '🔥 Best Combo:', value: this.playerStats.bestCombo },
      { label: '💡 Hints Used:', value: this.playerStats.totalHintsUsed },
      { label: '🆘 Tom Helps:', value: this.playerStats.totalTomHelps },
      { label: '⏱️ Time Played:', value: this.formatPlayTime() },
      { label: '🎪 Tom Events Seen:', value: this.playerStats.tomEventsSeen }
    ]

    this.statsTexts = []

    stats.forEach((stat, index) => {
      // Label
      const labelText = this.add.text(80, currentY, stat.label, {
        fontSize: `${window.getResponsiveFontSize(18)}px`,
        fontFamily: window.getGameFont(),
        color: '#8B4513',
        stroke: '#DEB887',
        strokeThickness: 2,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(2000)

      // Value
      const valueText = this.add.text(screenWidth - 80, currentY, stat.value, {
        fontSize: `${window.getResponsiveFontSize(18)}px`,
        fontFamily: window.getGameFont(),
        color: '#4169E1',
        stroke: '#1E90FF',
        strokeThickness: 2,
        fontStyle: 'bold'
      }).setOrigin(1, 0.5).setDepth(2000)

      this.statsTexts.push({ label: labelText, value: valueText })
      currentY += lineHeight
    })

    // Mode-specific stats
    currentY += 20
    this.add.text(screenWidth / 2, currentY, '🎯 MODE STATISTICS', {
      fontSize: `${window.getResponsiveFontSize(22)}px`,
      fontFamily: window.getGameFont(),
      color: '#8B4513',
      stroke: '#DEB887',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2000)

    currentY += 40

    const modeStats = [
      { label: 'Classic Mode:', value: `${this.playerStats.classicGamesWon}/${this.playerStats.classicGamesPlayed}` },
      { label: 'Time Attack:', value: `${this.playerStats.timeAttackGamesWon}/${this.playerStats.timeAttackGamesPlayed}` },
      { label: 'Endless Mode:', value: `${this.playerStats.endlessGamesWon}/${this.playerStats.endlessGamesPlayed}` },
      { label: 'Zen Mode:', value: `${this.playerStats.zenGamesWon}/${this.playerStats.zenGamesPlayed}` }
    ]

    modeStats.forEach((stat, index) => {
      const labelText = this.add.text(80, currentY, stat.label, {
        fontSize: `${window.getResponsiveFontSize(16)}px`,
        fontFamily: window.getGameFont(),
        color: '#8B4513',
        stroke: '#DEB887',
        strokeThickness: 2
      }).setOrigin(0, 0.5).setDepth(2000)

      const valueText = this.add.text(screenWidth - 80, currentY, stat.value, {
        fontSize: `${window.getResponsiveFontSize(16)}px`,
        fontFamily: window.getGameFont(),
        color: '#32CD32',
        stroke: '#228B22',
        strokeThickness: 2,
        fontStyle: 'bold'
      }).setOrigin(1, 0.5).setDepth(2000)

      this.statsTexts.push({ label: labelText, value: valueText })
      currentY += lineHeight - 5
    })
  }

  createBackButton() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height

    // Back button
    this.backButtonBg = this.add.graphics()
    this.backButtonBg.fillGradientStyle(0xFF8C00, 0xFF8C00, 0xFFA500, 0xFFA500, 0.95)
    this.backButtonBg.fillRoundedRect(50, screenHeight - 80, 120, 45, 22)

    this.backButtonBg.lineStyle(3, 0xFFFFFF, 0.95)
    this.backButtonBg.strokeRoundedRect(50, screenHeight - 80, 120, 45, 22)
    this.backButtonBg.setDepth(2000)

    this.backButtonBg.setInteractive(new Phaser.Geom.Rectangle(50, screenHeight - 80, 120, 45), Phaser.Geom.Rectangle.Contains)

    this.backButtonText = this.add.text(110, screenHeight - 58, '⬅️ BACK', {
      fontSize: `${window.getResponsiveFontSize(16)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#FF4500',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)

    // Button hover effects
    this.backButtonBg.on('pointerover', () => {
      this.tweens.add({
        targets: this.backButtonText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Back.easeOut'
      })
      this.backButtonText.setTint(0xFFFF88)
    })

    this.backButtonBg.on('pointerout', () => {
      this.tweens.add({
        targets: this.backButtonText,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeOut'
      })
      this.backButtonText.clearTint()
    })

    this.backButtonBg.on('pointerdown', () => {
      this.backButtonText.setScale(0.95)
      this.backButtonText.setTint(0xCCCC44)
    })

    this.backButtonBg.on('pointerup', () => {
      this.backButtonText.setScale(1.1)
      this.backButtonText.setTint(0xFFFF88)
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      this.scene.start('TitleScene')
    })
  }

  loadPlayerStats() {
    const defaultStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      bestScore: 0,
      bestCombo: 0,
      totalHintsUsed: 0,
      totalTomHelps: 0,
      playTimeSeconds: 0,
      tomEventsSeen: 0,
      classicGamesPlayed: 0,
      classicGamesWon: 0,
      timeAttackGamesPlayed: 0,
      timeAttackGamesWon: 0,
      endlessGamesPlayed: 0,
      endlessGamesWon: 0,
      zenGamesPlayed: 0,
      zenGamesWon: 0
    }

    const savedStats = localStorage.getItem('playerStats')
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats)
        return { ...defaultStats, ...parsedStats }
      } catch (error) {
        console.warn('Failed to parse player stats, using defaults')
        return defaultStats
      }
    }

    return defaultStats
  }

  calculateWinRate() {
    if (this.playerStats.gamesPlayed === 0) return 0
    return Math.round((this.playerStats.gamesWon / this.playerStats.gamesPlayed) * 100)
  }

  formatPlayTime() {
    const hours = Math.floor(this.playerStats.playTimeSeconds / 3600)
    const minutes = Math.floor((this.playerStats.playTimeSeconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  stopAllOtherMusic() {
    const allScenes = ['TitleScene', 'ModeSelectionScene', 'GameModeMenuScene', 'OnlineLobbyScene', 'GameScene']

    allScenes.forEach(sceneKey => {
      const scene = this.scene.get(sceneKey)
      if (scene && scene.backgroundMusic) {
        if (scene.backgroundMusic.isPlaying) {
          scene.backgroundMusic.stop()
          console.log(`🎵 Stopped music from ${sceneKey}`)
        }
      }
    })
  }

  playBackgroundMusic() {
    // Don't play music in profile scene - let it be silent for better focus on stats
    // This prevents double music playback
    return
  }

  shutdown() {
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop()
      this.backgroundMusic.destroy()
      this.backgroundMusic = null
    }
  }
}