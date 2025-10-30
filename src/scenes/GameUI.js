import Phaser from 'phaser'
import { screenSize, levelConfig, audioConfig } from '../gameConfig.json'

export class GameUI {
  constructor(scene) {
    this.scene = scene
    this.uiContainer = null
    this.targetDisplays = []
    this.moveCounterText = null
    this.scoreText = null
    this.pauseButton = null
    this.opponentStatsPanel = null
  }

  createUI() {
    this.uiContainer = this.scene.add.container(0, 0)
    this.createTargetDisplay()
    this.createMoveCounter()
    this.createScoreDisplay()
    this.createPauseButton()

    if (this.scene.gameMode === 'online') {
      this.createOpponentStatsPanel()
    }
  }

  createTargetDisplay() {
    const screenWidth = this.scene.cameras.main.width

    // Background
    this.targetBg = this.scene.add.graphics()
    this.targetBg.fillGradientStyle(0xFFFACD, 0xFFFACD, 0xF5DEB3, 0xF5DEB3, 0.95)
    this.targetBg.fillRoundedRect(20, 20, screenWidth * 0.3, 120, 20)
    this.targetBg.lineStyle(4, 0xFFFFFF, 0.9)
    this.targetBg.strokeRoundedRect(20, 20, screenWidth * 0.3, 120, 20)
    this.targetBg.setDepth(2000)

    // Title
    this.targetText = this.scene.add.text(screenWidth * 0.15, 35, '🧀 TOM & JERRY CHASE 🐭', {
      fontSize: `${window.getResponsiveFontSize(20)}px`,
      fontFamily: window.getGameFont(),
      color: '#8B4513',
      stroke: '#DEB887',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)

    // Targets
    const targets = [
      { type: this.scene.levelTargets[0].type, target: this.scene.levelTargets[0].count, x: screenWidth * 0.08 },
      { type: this.scene.levelTargets[1].type, target: this.scene.levelTargets[1].count, x: screenWidth * 0.15 },
      { type: this.scene.levelTargets[2].type, target: this.scene.levelTargets[2].count, x: screenWidth * 0.22 }
    ]

    this.targetDisplays = []

    targets.forEach((target, index) => {
      const icon = this.scene.add.image(target.x, 80, target.type).setScale(0.050).setDepth(2100)
      this.scene.applyTomJerryItemEnhancement(icon)
      this.scene.applyHighQualityRendering(icon)

      this.scene.tweens.add({
        targets: icon,
        scaleX: 0.050 * 1.1,
        scaleY: 0.050 * 1.1,
        duration: 1000 + (index * 200),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      })

      const text = this.scene.add.text(target.x, 115, `0/${target.target}`, {
        fontSize: `${window.getResponsiveFontSize(16)}px`,
        fontFamily: window.getGameFont(),
        color: '#8B4513',
        stroke: '#DEB887',
        strokeThickness: 2,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(2100)

      this.targetDisplays.push({ icon, text, type: target.type, target: target.target })
    })
  }

  createMoveCounter() {
    const screenWidth = this.scene.cameras.main.width

    if (this.scene.selectedGameMode === 'endless' || this.scene.selectedGameMode === 'zen') {
      this.moveCounterBg = this.scene.add.graphics()
      this.moveCounterBg.fillGradientStyle(0x9370DB, 0x9370DB, 0xBA55D3, 0xBA55D3, 0.95)
      this.moveCounterBg.fillRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
      this.moveCounterBg.lineStyle(3, 0xFFFFFF, 0.9)
      this.moveCounterBg.strokeRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
      this.moveCounterBg.setDepth(2000)

      const modeIcon = this.scene.selectedGameMode === 'endless' ? '♾️' : '🏆'
      this.moveCounterText = this.scene.add.text(screenWidth * 0.8, 50, `${modeIcon} Moves: 0`, {
        fontSize: `${window.getResponsiveFontSize(18)}px`,
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#4B0082',
        strokeThickness: 2,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(2100)
      return
    }

    if (this.scene.selectedGameMode === 'time_attack') {
      this.moveCounterBg = this.scene.add.graphics()
      this.moveCounterBg.fillGradientStyle(0xFF6347, 0xFF6347, 0xFF7F50, 0xFF7F50, 0.95)
      this.moveCounterBg.fillRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
      this.moveCounterBg.lineStyle(3, 0xFFFFFF, 0.9)
      this.moveCounterBg.strokeRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
      this.moveCounterBg.setDepth(2000)

      this.moveCounterText = this.scene.add.text(screenWidth * 0.8, 50, `⏱️ Time: 2:00`, {
        fontSize: `${window.getResponsiveFontSize(18)}px`,
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#8B0000',
        strokeThickness: 2,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(2100)
      return
    }

    // Classic mode
    this.moveCounterBg = this.scene.add.graphics()
    this.moveCounterBg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xADD8E6, 0xADD8E6, 0.95)
    this.moveCounterBg.fillRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
    this.moveCounterBg.lineStyle(3, 0xFFFFFF, 0.9)
    this.moveCounterBg.strokeRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
    this.moveCounterBg.setDepth(2000)

    this.moveCounterText = this.scene.add.text(screenWidth * 0.8, 50, `✨ Moves: 0/${levelConfig.maxMoves.value} ✨`, {
      fontSize: `${window.getResponsiveFontSize(18)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#4169E1',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
  }

  createScoreDisplay() {
    const screenWidth = this.scene.cameras.main.width

    this.scoreBg = this.scene.add.graphics()
    this.scoreBg.fillGradientStyle(0x9370DB, 0x9370DB, 0xBA55D3, 0xBA55D3, 0.95)
    this.scoreBg.fillRoundedRect(screenWidth * 0.35, 20, screenWidth * 0.25, 60, 15)
    this.scoreBg.lineStyle(3, 0xFFFFFF, 0.9)
    this.scoreBg.strokeRoundedRect(screenWidth * 0.35, 20, screenWidth * 0.25, 60, 15)
    this.scoreBg.setDepth(2000)

    this.scoreText = this.scene.add.text(screenWidth * 0.475, 50, `🏆 Score: 0`, {
      fontSize: `${window.getResponsiveFontSize(18)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#4B0082',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
  }

  createPauseButton() {
    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height

    this.pauseButtonBg = this.scene.add.graphics()
    this.pauseButtonBg.fillGradientStyle(0xFF8C00, 0xFF8C00, 0xFFA500, 0xFFA500, 0.95)
    this.pauseButtonBg.fillRoundedRect(screenWidth - 120, 100, 100, 45, 22)
    this.pauseButtonBg.lineStyle(3, 0xFFFFFF, 0.9)
    this.pauseButtonBg.strokeRoundedRect(screenWidth - 120, 100, 100, 45, 22)
    this.pauseButtonBg.setDepth(2000)

    this.pauseButtonBg.setInteractive(new Phaser.Geom.Rectangle(screenWidth - 120, 100, 100, 45), Phaser.Geom.Rectangle.Contains)

    this.pauseButtonText = this.scene.add.text(screenWidth - 70, 122, '⏸️ PAUSE', {
      fontSize: `${window.getResponsiveFontSize(16)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#FF4500',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)

    // Hover effects
    this.pauseButtonBg.on('pointerover', () => {
      this.scene.tweens.add({
        targets: this.pauseButtonText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Back.easeOut'
      })
      this.pauseButtonText.setTint(0xFFFF88)
    })

    this.pauseButtonBg.on('pointerout', () => {
      this.scene.tweens.add({
        targets: this.pauseButtonText,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeOut'
      })
      this.pauseButtonText.clearTint()
    })

    this.pauseButtonBg.on('pointerdown', () => {
      this.pauseButtonText.setScale(0.95)
      this.pauseButtonText.setTint(0xCCCC44)
    })

    this.pauseButtonBg.on('pointerup', () => {
      this.pauseButtonText.setScale(1.1)
      this.pauseButtonText.setTint(0xFFFF88)
      this.scene.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      this.scene.scene.pause()
      this.scene.scene.launch('PauseScene')
    })
  }

  createOpponentStatsPanel() {
    const screenWidth = this.scene.cameras.main.width

    this.opponentBg = this.scene.add.graphics()
    this.opponentBg.fillGradientStyle(0xFF6B6B, 0xFF6B6B, 0xFF8E8E, 0xFF8E8E, 0.95)
    this.opponentBg.fillRoundedRect(screenWidth * 0.68, 90, screenWidth * 0.27, 80, 15)
    this.opponentBg.lineStyle(3, 0xFFFFFF, 0.9)
    this.opponentBg.strokeRoundedRect(screenWidth * 0.68, 90, screenWidth * 0.27, 80, 15)
    this.opponentBg.setDepth(2000)

    this.opponentTitle = this.scene.add.text(screenWidth * 0.815, 103, '👤 OPPONENT', {
      fontSize: `${window.getResponsiveFontSize(14)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)

    const baseX = screenWidth * 0.735
    const itemSpacing = screenWidth * 0.06
    const iconY = 138

    this.opponentTarget1Icon = this.scene.add.image(baseX, iconY, this.scene.levelTargets[0].type).setScale(0.042).setDepth(2100)
    this.scene.applyTomJerryItemEnhancement(this.opponentTarget1Icon)
    this.scene.applyHighQualityRendering(this.opponentTarget1Icon)
    this.opponentTarget1Text = this.scene.add.text(baseX, iconY + 26, `0/${this.scene.levelTargets[0].count}`, {
      fontSize: `${window.getResponsiveFontSize(12)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)

    this.opponentTarget2Icon = this.scene.add.image(baseX + itemSpacing, iconY, this.scene.levelTargets[1].type).setScale(0.042).setDepth(2100)
    this.scene.applyTomJerryItemEnhancement(this.opponentTarget2Icon)
    this.scene.applyHighQualityRendering(this.opponentTarget2Icon)
    this.opponentTarget2Text = this.scene.add.text(baseX + itemSpacing, iconY + 26, `0/${this.scene.levelTargets[1].count}`, {
      fontSize: `${window.getResponsiveFontSize(12)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)

    this.opponentTarget3Icon = this.scene.add.image(baseX + itemSpacing * 2, iconY, this.scene.levelTargets[2].type).setScale(0.042).setDepth(2100)
    this.scene.applyTomJerryItemEnhancement(this.opponentTarget3Icon)
    this.scene.applyHighQualityRendering(this.opponentTarget3Icon)
    this.opponentTarget3Text = this.scene.add.text(baseX + itemSpacing * 2, iconY + 26, `0/${this.scene.levelTargets[2].count}`, {
      fontSize: `${window.getResponsiveFontSize(12)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
  }

  updateTargetDisplay() {
    this.targetDisplays.forEach(display => {
      const current = this.scene.eliminatedCounts[display.type]
      const target = display.target

      if (current >= target) {
        display.text.setText(`✅ ${current}/${target}`)
        display.text.setColor('#32CD32')

        if (!display.completed) {
          display.completed = true
          this.scene.tweens.add({
            targets: [display.icon, display.text],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            ease: 'Back.easeOut',
            yoyo: true,
            repeat: 2
          })
        }
      } else {
        display.text.setText(`${current}/${target}`)
      }
    })
  }

  updateMoveCounter() {
    if (this.scene.selectedGameMode === 'endless' || this.scene.selectedGameMode === 'zen') {
      const modeIcon = this.scene.selectedGameMode === 'endless' ? '♾️' : '🏆'
      this.moveCounterText.setText(`${modeIcon} Moves: ${this.scene.currentMoves}`)
      return
    }

    if (this.scene.selectedGameMode === 'time_attack') {
      return // Timer is updated separately
    }

    this.moveCounterText.setText(`✨ Moves: ${this.scene.currentMoves}/${levelConfig.maxMoves.value} ✨`)

    if (this.scene.currentMoves >= levelConfig.maxMoves.value) {
      this.moveCounterText.setColor('#FF6347')
      this.moveCounterText.setText(`⚠️ Moves: ${this.scene.currentMoves}/${levelConfig.maxMoves.value} ⚠️`)
    }
  }

  updateScoreDisplay() {
    this.scoreText.setText(`🏆 Score: ${this.scene.score.toLocaleString()}`)

    this.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      ease: 'Back.easeOut',
      yoyo: true
    })
  }

  updateGameTimerDisplay(timeRemaining) {
    const minutes = Math.floor(timeRemaining / 60)
    const seconds = timeRemaining % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

    this.moveCounterText.setText(`⏱️ Time: ${timeString}`)

    if (timeRemaining <= 10) {
      this.moveCounterText.setColor('#FF0000')
    } else if (timeRemaining <= 30) {
      this.moveCounterText.setColor('#FF6347')
    }
  }

  updateOpponentStats(opponentData) {
    if (this.scene.gameMode !== 'online') return

    if (opponentData.levelTargets) {
      this.scene.opponentLevelTargets = opponentData.levelTargets
      this.updateOpponentUI()
    }

    const targetsToUse = this.scene.opponentLevelTargets || this.scene.levelTargets

    targetsToUse.forEach((target, index) => {
      const itemType = target.type
      const targetCount = target.count

      if (opponentData.eliminatedCounts && opponentData.eliminatedCounts[itemType] !== undefined) {
        this.scene.opponentStats[itemType] = opponentData.eliminatedCounts[itemType]

        let textElement = null
        if (index === 0 && this.opponentTarget1Text) {
          textElement = this.opponentTarget1Text
        } else if (index === 1 && this.opponentTarget2Text) {
          textElement = this.opponentTarget2Text
        } else if (index === 2 && this.opponentTarget3Text) {
          textElement = this.opponentTarget3Text
        }

        if (textElement) {
          textElement.setText(`${opponentData.eliminatedCounts[itemType]}/${targetCount}`)

          this.scene.tweens.add({
            targets: textElement,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            ease: 'Back.easeOut',
            yoyo: true
          })
        }
      }
    })
  }

  updateOpponentUI() {
    if (!this.scene.opponentLevelTargets) return

    if (this.opponentTarget1Icon && this.scene.opponentLevelTargets[0]) {
      this.opponentTarget1Icon.setTexture(this.scene.opponentLevelTargets[0].type)
      this.scene.applyTomJerryItemEnhancement(this.opponentTarget1Icon)
      this.scene.applyHighQualityRendering(this.opponentTarget1Icon)

      if (this.opponentTarget1Text) {
        const currentCount = this.scene.opponentStats[this.scene.opponentLevelTargets[0].type] || 0
        this.opponentTarget1Text.setText(`${currentCount}/${this.scene.opponentLevelTargets[0].count}`)
      }
    }

    if (this.opponentTarget2Icon && this.scene.opponentLevelTargets[1]) {
      this.opponentTarget2Icon.setTexture(this.scene.opponentLevelTargets[1].type)
      this.scene.applyTomJerryItemEnhancement(this.opponentTarget2Icon)
      this.scene.applyHighQualityRendering(this.opponentTarget2Icon)

      if (this.opponentTarget2Text) {
        const currentCount = this.scene.opponentStats[this.scene.opponentLevelTargets[1].type] || 0
        this.opponentTarget2Text.setText(`${currentCount}/${this.scene.opponentLevelTargets[1].count}`)
      }
    }

    if (this.opponentTarget3Icon && this.scene.opponentLevelTargets[2]) {
      this.opponentTarget3Icon.setTexture(this.scene.opponentLevelTargets[2].type)
      this.scene.applyTomJerryItemEnhancement(this.opponentTarget3Icon)
      this.scene.applyHighQualityRendering(this.opponentTarget3Icon)

      if (this.opponentTarget3Text) {
        const currentCount = this.scene.opponentStats[this.scene.opponentLevelTargets[2].type] || 0
        this.opponentTarget3Text.setText(`${currentCount}/${this.scene.opponentLevelTargets[2].count}`)
      }
    }
  }

  showHelpMessage(message) {
    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height

    const helpText = this.scene.add.text(screenWidth / 2, screenHeight / 2, message, {
      fontSize: `${window.getResponsiveFontSize(28)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(10001).setAlpha(0).setScale(0)

    this.scene.tweens.add({
      targets: helpText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: helpText,
            alpha: 0,
            scale: 0.5,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
              helpText.destroy()
            }
          })
        })
      }
    })
  }

  showOpponentLeftNotification() {
    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height

    const overlay = this.scene.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      screenWidth,
      screenHeight,
      0x000000,
      0.5
    ).setDepth(9999)

    const panel = this.scene.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      400,
      150,
      0xFF6347,
      1
    ).setDepth(10000).setStrokeStyle(6, 0x8B0000)

    const notificationText = this.scene.add.text(
      screenWidth / 2,
      screenHeight / 2 - 20,
      '👋 OPPONENT DISCONNECTED',
      {
        fontSize: '24px',
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5).setDepth(10001)

    const subText = this.scene.add.text(
      screenWidth / 2,
      screenHeight / 2 + 25,
      'You win by default!',
      {
        fontSize: '18px',
        fontFamily: window.getGameFont(),
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }
    ).setOrigin(0.5, 0.5).setDepth(10001)

    panel.setScale(0)
    notificationText.setScale(0)
    subText.setScale(0)

    this.scene.tweens.add({
      targets: overlay,
      alpha: { from: 0, to: 0.5 },
      duration: 300,
      ease: 'Power2'
    })

    this.scene.tweens.add({
      targets: panel,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    })

    this.scene.tweens.add({
      targets: [notificationText, subText],
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Elastic.easeOut',
      delay: 200
    })

    this.scene.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
  }
}