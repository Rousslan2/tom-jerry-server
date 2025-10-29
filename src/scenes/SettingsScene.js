import Phaser from 'phaser'
import { screenSize, audioConfig } from '../gameConfig.json'

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' })
  }

  create() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height

    // Create semi-transparent overlay
    this.overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setDepth(2000)
      .setInteractive() // Block clicks from passing through

    // Create settings panel background
    const panelWidth = 600
    const panelHeight = 500
    const panelX = screenWidth / 2
    const panelY = screenHeight / 2

    this.panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xFFFFFF, 1)
      .setDepth(2001)
      .setStrokeStyle(8, 0x000000)

    // Add decorative border
    const borderGraphics = this.add.graphics()
    borderGraphics.lineStyle(4, 0xFF69B4, 1)
    borderGraphics.strokeRoundedRect(
      panelX - panelWidth / 2 + 10, 
      panelY - panelHeight / 2 + 10, 
      panelWidth - 20, 
      panelHeight - 20, 
      10
    )
    borderGraphics.setDepth(2002)

    // Title
    this.titleText = this.add.text(panelX, panelY - 200, '⚙️ SETTINGS ⚙️', {
      fontSize: `${window.getResponsiveFontSize(48)}px`,
      fontFamily: window.getGameFont(),
      color: '#FF1493',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2003)

    // Music volume section
    this.createVolumeSlider(
      panelX, 
      panelY - 80, 
      'MUSIC VOLUME', 
      audioConfig.musicVolume.value,
      (value) => {
        audioConfig.musicVolume.value = value
        this.updateAllMusicVolumes()
        this.saveSettings()  // 💾 Save immediately!
      }
    )

    // Sound effects volume section
    this.createVolumeSlider(
      panelX, 
      panelY + 40, 
      'SOUND EFFECTS', 
      audioConfig.sfxVolume.value,
      (value) => {
        audioConfig.sfxVolume.value = value
        this.saveSettings()  // 💾 Save immediately!
        // Play test sound
        this.sound.play('ui_click', { volume: value })
      }
    )

    // Back button
    this.createBackButton(panelX, panelY + 180)

    // Scale in animation
    this.panel.setScale(0)
    this.titleText.setScale(0)
    
    this.tweens.add({
      targets: [this.panel, borderGraphics],
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    })

    this.tweens.add({
      targets: this.titleText,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Elastic.easeOut',
      delay: 100
    })
  }

  createVolumeSlider(x, y, label, initialValue, onChange) {
    // Label
    const labelText = this.add.text(x, y - 40, label, {
      fontSize: `${window.getResponsiveFontSize(24)}px`,
      fontFamily: window.getGameFont(),
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2003)

    // Slider track
    const trackWidth = 400
    const trackHeight = 12
    const track = this.add.rectangle(x, y, trackWidth, trackHeight, 0xCCCCCC)
      .setDepth(2003)
      .setStrokeStyle(2, 0x000000)

    // Slider fill (shows current volume)
    const fill = this.add.rectangle(
      x - trackWidth / 2, 
      y, 
      trackWidth * initialValue, 
      trackHeight, 
      0xFF69B4
    ).setOrigin(0, 0.5).setDepth(2004)

    // Slider handle
    const handleSize = 30
    const handle = this.add.circle(
      x - trackWidth / 2 + trackWidth * initialValue, 
      y, 
      handleSize / 2, 
      0xFFFFFF
    ).setDepth(2005)
      .setStrokeStyle(4, 0xFF1493)
      .setInteractive({ draggable: true })

    // Volume percentage text
    const percentText = this.add.text(x, y + 30, `${Math.round(initialValue * 100)}%`, {
      fontSize: `${window.getResponsiveFontSize(20)}px`,
      fontFamily: window.getGameFont(),
      color: '#FF1493',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2003)

    // Drag interaction
    handle.on('drag', (pointer, dragX, dragY) => {
      // Constrain handle to track
      const minX = x - trackWidth / 2
      const maxX = x + trackWidth / 2
      const clampedX = Phaser.Math.Clamp(dragX, minX, maxX)
      
      handle.x = clampedX

      // Update fill width
      const fillWidth = clampedX - (x - trackWidth / 2)
      fill.width = fillWidth

      // Calculate volume (0-1)
      const volume = (clampedX - minX) / trackWidth
      percentText.setText(`${Math.round(volume * 100)}%`)

      // Call onChange callback
      onChange(volume)
    })

    // Click on track to jump to position
    track.setInteractive()
    track.on('pointerdown', (pointer) => {
      const localX = pointer.x - (x - trackWidth / 2)
      const volume = Phaser.Math.Clamp(localX / trackWidth, 0, 1)
      
      handle.x = x - trackWidth / 2 + trackWidth * volume
      fill.width = trackWidth * volume
      percentText.setText(`${Math.round(volume * 100)}%`)
      
      onChange(volume)
    })

    // Hover effect
    handle.on('pointerover', () => {
      handle.setScale(1.2)
    })

    handle.on('pointerout', () => {
      handle.setScale(1)
    })

    // Store references for animations
    labelText.setScale(0)
    this.tweens.add({
      targets: labelText,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
      delay: 200
    })
  }

  createBackButton(x, y) {
    // Back button
    const button = this.add.rectangle(x, y, 200, 60, 0xFF69B4)
      .setDepth(2003)
      .setStrokeStyle(4, 0x000000)
      .setInteractive()

    const buttonText = this.add.text(x, y, 'BACK', {
      fontSize: `${window.getResponsiveFontSize(28)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2004)

    // Interactions
    button.on('pointerover', () => {
      button.setFillStyle(0xFF1493)
      button.setScale(1.05)
      buttonText.setScale(1.05)
    })

    button.on('pointerout', () => {
      button.setFillStyle(0xFF69B4)
      button.setScale(1)
      buttonText.setScale(1)
    })

    button.on('pointerdown', () => {
      button.setScale(0.95)
      buttonText.setScale(0.95)
    })

    button.on('pointerup', () => {
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      this.closeSettings()
    })

    // Animation
    button.setScale(0)
    buttonText.setScale(0)
    
    this.tweens.add({
      targets: [button, buttonText],
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
      delay: 300
    })
  }

  updateAllMusicVolumes() {
    // 🎵 Update volume for ALL scenes that might have background music playing
    const scenesWithMusic = [
      'TitleScene',
      'ModeSelectionScene',
      'GameModeMenuScene',
      'OnlineLobbyScene',
      'GameScene'
    ]
    
    scenesWithMusic.forEach(sceneKey => {
      const scene = this.scene.get(sceneKey)
      if (scene && scene.backgroundMusic && scene.backgroundMusic.isPlaying) {
        scene.backgroundMusic.setVolume(audioConfig.musicVolume.value)
        console.log(`🔊 Updated music volume in ${sceneKey} to ${Math.round(audioConfig.musicVolume.value * 100)}%`)
      }
    })
  }

  saveSettings() {
    // 💾 Save settings to localStorage immediately
    localStorage.setItem('gameSettings', JSON.stringify({
      musicVolume: audioConfig.musicVolume.value,
      sfxVolume: audioConfig.sfxVolume.value
    }))
    console.log('💾 Settings saved:', {
      music: Math.round(audioConfig.musicVolume.value * 100) + '%',
      sfx: Math.round(audioConfig.sfxVolume.value * 100) + '%'
    })
  }

  closeSettings() {
    // Settings are already saved in real-time, just close
    this.scene.stop()
  }

  // Load settings from localStorage on game start
  static loadSettings() {
    const saved = localStorage.getItem('gameSettings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        audioConfig.musicVolume.value = settings.musicVolume || 0.3
        audioConfig.sfxVolume.value = settings.sfxVolume || 0.5
      } catch (e) {
        console.warn('Failed to load settings:', e)
      }
    }
  }
}
