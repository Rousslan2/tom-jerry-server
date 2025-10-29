import Phaser from 'phaser'
import { audioConfig } from '../gameConfig.json'

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height

    // Background
    const bg = this.add.graphics()
    bg.fillStyle(0x808080, 1)
    bg.fillRect(0, 0, screenWidth, screenHeight)
    bg.setDepth(-10)

    // Titre
    this.add.text(screenWidth / 2, 80, 'TOM & JERRY CHASE', {
      fontSize: '56px',
      fontFamily: window.getGameFont ? window.getGameFont() : 'Arial',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(100)

    // Sous-titre
    this.add.text(screenWidth / 2, 140, 'Match-3 Adventure', {
      fontSize: '24px',
      fontFamily: window.getGameFont ? window.getGameFont() : 'Arial',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(100)

    // Boutons principaux
    this.createButton(screenWidth / 2, 220, 300, 70, '🎯 Classic', 0x3498DB, () => {
      this.sound.play('ui_click', { volume: audioConfig?.sfxVolume?.value || 0.5 })
      this.scene.start('GameScene', { mode: 'single', gameMode: 'classic' })
    })

    this.createButton(screenWidth / 2, 310, 300, 70, '⏱️ Time Attack', 0xE74C3C, () => {
      this.sound.play('ui_click', { volume: audioConfig?.sfxVolume?.value || 0.5 })
      this.scene.start('GameScene', { mode: 'single', gameMode: 'time_attack' })
    })

    this.createButton(screenWidth / 2, 400, 300, 70, '🌐 Online', 0x27AE60, () => {
      this.sound.play('ui_click', { volume: audioConfig?.sfxVolume?.value || 0.5 })
      this.scene.start('OnlineLobbyScene')
    })

    // 🆕 BOUTON ACHIEVEMENTS (en bas à gauche)
    const achievementsBtnX = screenWidth / 2 - 160
    const achievementsBtnY = screenHeight - 100

    const achievementsBtn = this.add.graphics()
    achievementsBtn.fillStyle(0xF39C12, 0.95)
    achievementsBtn.fillRoundedRect(
      achievementsBtnX - 100,
      achievementsBtnY - 35,
      200,
      70,
      15
    )
    achievementsBtn.lineStyle(4, 0xE67E22, 1)
    achievementsBtn.strokeRoundedRect(
      achievementsBtnX - 100,
      achievementsBtnY - 35,
      200,
      70,
      15
    )
    achievementsBtn.setDepth(100)

    const achievementsText = this.add.text(
      achievementsBtnX,
      achievementsBtnY,
      '🏆 Trophées',
      {
        fontSize: '24px',
        fontFamily: window.getGameFont ? window.getGameFont() : 'Arial',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5).setDepth(101)

    const achievementsZone = this.add.zone(
      achievementsBtnX,
      achievementsBtnY,
      200,
      70
    ).setInteractive().setDepth(102)

    achievementsZone.on('pointerup', () => {
      this.sound.play('ui_click', { volume: audioConfig?.sfxVolume?.value || 0.5 })
      this.scene.pause()
      this.scene.launch('AchievementScene')
    })

    achievementsZone.on('pointerover', () => {
      achievementsBtn.clear()
      achievementsBtn.fillStyle(0xFF9F1C, 1)
      achievementsBtn.fillRoundedRect(
        achievementsBtnX - 100,
        achievementsBtnY - 35,
        200,
        70,
        15
      )
      achievementsBtn.lineStyle(4, 0xE67E22, 1)
      achievementsBtn.strokeRoundedRect(
        achievementsBtnX - 100,
        achievementsBtnY - 35,
        200,
        70,
        15
      )
      achievementsText.setScale(1.05)
    })

    achievementsZone.on('pointerout', () => {
      achievementsBtn.clear()
      achievementsBtn.fillStyle(0xF39C12, 0.95)
      achievementsBtn.fillRoundedRect(
        achievementsBtnX - 100,
        achievementsBtnY - 35,
        200,
        70,
        15
      )
      achievementsBtn.lineStyle(4, 0xE67E22, 1)
      achievementsBtn.strokeRoundedRect(
        achievementsBtnX - 100,
        achievementsBtnY - 35,
        200,
        70,
        15
      )
      achievementsText.setScale(1)
    })

    // 🆕 BOUTON SKINS (en bas à droite)
    const skinsBtnX = screenWidth / 2 + 160
    const skinsBtnY = screenHeight - 100

    const skinsBtn = this.add.graphics()
    skinsBtn.fillStyle(0x9B59B6, 0.95)
    skinsBtn.fillRoundedRect(
      skinsBtnX - 100,
      skinsBtnY - 35,
      200,
      70,
      15
    )
    skinsBtn.lineStyle(4, 0x8E44AD, 1)
    skinsBtn.strokeRoundedRect(
      skinsBtnX - 100,
      skinsBtnY - 35,
      200,
      70,
      15
    )
    skinsBtn.setDepth(100)

    const skinsText = this.add.text(
      skinsBtnX,
      skinsBtnY,
      '🎨 Skins',
      {
        fontSize: '24px',
        fontFamily: window.getGameFont ? window.getGameFont() : 'Arial',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5).setDepth(101)

    const skinsZone = this.add.zone(
      skinsBtnX,
      skinsBtnY,
      200,
      70
    ).setInteractive().setDepth(102)

    skinsZone.on('pointerup', () => {
      this.sound.play('ui_click', { volume: audioConfig?.sfxVolume?.value || 0.5 })
      this.scene.pause()
      this.scene.launch('SkinScene')
    })

    skinsZone.on('pointerover', () => {
      skinsBtn.clear()
      skinsBtn.fillStyle(0xAB6FC6, 1)
      skinsBtn.fillRoundedRect(
        skinsBtnX - 100,
        skinsBtnY - 35,
        200,
        70,
        15
      )
      skinsBtn.lineStyle(4, 0x8E44AD, 1)
      skinsBtn.strokeRoundedRect(
        skinsBtnX - 100,
        skinsBtnY - 35,
        200,
        70,
        15
      )
      skinsText.setScale(1.05)
    })

    skinsZone.on('pointerout', () => {
      skinsBtn.clear()
      skinsBtn.fillStyle(0x9B59B6, 0.95)
      skinsBtn.fillRoundedRect(
        skinsBtnX - 100,
        skinsBtnY - 35,
        200,
        70,
        15
      )
      skinsBtn.lineStyle(4, 0x8E44AD, 1)
      skinsBtn.strokeRoundedRect(
        skinsBtnX - 100,
        skinsBtnY - 35,
        200,
        70,
        15
      )
      skinsText.setScale(1)
    })

    // Bouton Settings (petit, coin en haut à droite)
    this.createSmallButton(screenWidth - 60, 40, 50, 50, '⚙️', () => {
      this.sound.play('ui_click', { volume: audioConfig?.sfxVolume?.value || 0.5 })
      this.scene.pause()
      this.scene.launch('SettingsScene')
    })
  }

  createButton(x, y, width, height, text, color, callback) {
    const btn = this.add.graphics()
    btn.fillStyle(color, 0.95)
    btn.fillRoundedRect(x - width / 2, y - height / 2, width, height, 15)
    btn.lineStyle(4, color - 0x222222, 1)
    btn.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 15)
    btn.setDepth(100)

    const btnText = this.add.text(x, y, text, {
      fontSize: '28px',
      fontFamily: window.getGameFont ? window.getGameFont() : 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(101)

    const zone = this.add.zone(x, y, width, height)
      .setInteractive()
      .setDepth(102)

    zone.on('pointerup', callback)

    zone.on('pointerover', () => {
      btn.clear()
      btn.fillStyle(color + 0x111111, 1)
      btn.fillRoundedRect(x - width / 2, y - height / 2, width, height, 15)
      btn.lineStyle(4, color - 0x222222, 1)
      btn.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 15)
      btnText.setScale(1.05)
    })

    zone.on('pointerout', () => {
      btn.clear()
      btn.fillStyle(color, 0.95)
      btn.fillRoundedRect(x - width / 2, y - height / 2, width, height, 15)
      btn.lineStyle(4, color - 0x222222, 1)
      btn.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 15)
      btnText.setScale(1)
    })

    return { btn, text: btnText, zone }
  }

  createSmallButton(x, y, width, height, icon, callback) {
    const btn = this.add.graphics()
    btn.fillStyle(0x7F8C8D, 0.9)
    btn.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10)
    btn.lineStyle(3, 0x34495E, 1)
    btn.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10)
    btn.setDepth(100)

    const btnText = this.add.text(x, y, icon, {
      fontSize: '28px'
    }).setOrigin(0.5).setDepth(101)

    const zone = this.add.zone(x, y, width, height)
      .setInteractive()
      .setDepth(102)

    zone.on('pointerup', callback)

    zone.on('pointerover', () => {
      btn.clear()
      btn.fillStyle(0x95A5A6, 1)
      btn.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10)
      btn.lineStyle(3, 0x34495E, 1)
      btn.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10)
      btnText.setScale(1.1)
    })

    zone.on('pointerout', () => {
      btn.clear()
      btn.fillStyle(0x7F8C8D, 0.9)
      btn.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10)
      btn.lineStyle(3, 0x34495E, 1)
      btn.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10)
      btnText.setScale(1)
    })

    return { btn, text: btnText, zone }
  }
}
