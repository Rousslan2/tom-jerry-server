/**
 * 🎨 Skin Selection Scene
 * Permet de voir et équiper différents skins
 */

import Phaser from 'phaser'
import { skinManager } from '../services/SkinManager.js'

export default class SkinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SkinScene' })
  }
  
  create() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Background
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    bg.fillRect(0, 0, screenWidth, screenHeight)
    bg.setDepth(0)
    
    // Titre
    this.add.text(screenWidth / 2, 60, '🎨 SKINS', {
      fontSize: '48px',
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(1)
    
    // Collection progress
    const collection = skinManager.getCollectionPercentage()
    const playerCoins = parseInt(localStorage.getItem('playerCoins') || '0')
    
    this.add.text(screenWidth / 2, 110, `Collection: ${collection}% | Fromages: ${playerCoins} 🧀`, {
      fontSize: '20px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(1)
    
    // Liste des skins
    this.createSkinsList()
    
    // Bouton retour
    this.createBackButton()
  }
  
  createSkinsList() {
    const screenWidth = this.cameras.main.width
    const skins = skinManager.getAllSkins()
    const currentSkin = skinManager.getCurrentSkin()
    
    const cardWidth = 280
    const cardHeight = 320
    const padding = 20
    const cols = 3
    
    const startX = (screenWidth - (cols * cardWidth) - ((cols - 1) * padding)) / 2
    const startY = 180
    
    skins.forEach((skin, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      
      const x = startX + (col * (cardWidth + padding))
      const y = startY + (row * (cardHeight + padding))
      
      this.createSkinCard(skin, x, y, cardWidth, cardHeight, skin.id === currentSkin.id)
    })
  }
  
  createSkinCard(skin, x, y, width, height, isEquipped) {
    const isUnlocked = skin.unlocked
    
    // Background
    const cardBg = this.add.graphics()
    const bgColor = isEquipped ? 0x27AE60 : (isUnlocked ? 0x3498DB : 0x2C3E50)
    cardBg.fillStyle(bgColor, 0.9)
    cardBg.fillRoundedRect(x, y, width, height, 15)
    cardBg.lineStyle(4, isEquipped ? 0xFFD700 : (isUnlocked ? 0x2980B9 : 0x7F8C8D), 1)
    cardBg.strokeRoundedRect(x, y, width, height, 15)
    cardBg.setDepth(1)
    
    // Icône du skin (grand)
    this.add.text(x + width/2, y + 80, skin.icon, {
      fontSize: '72px'
    }).setOrigin(0.5).setDepth(2)
    
    // Lock si verrouillé
    if (!isUnlocked) {
      this.add.text(x + width/2, y + 80, '🔒', {
        fontSize: '48px'
      }).setOrigin(0.5).setDepth(3)
    }
    
    // Nom
    this.add.text(x + width/2, y + 150, skin.name, {
      fontSize: '24px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(2)
    
    // Description
    this.add.text(x + width/2, y + 185, skin.description, {
      fontSize: '14px',
      fontFamily: window.getGameFont(),
      color: '#ECF0F1',
      align: 'center',
      wordWrap: { width: width - 40 }
    }).setOrigin(0.5).setDepth(2)
    
    // Preview des items avec ce skin
    this.createItemPreview(skin, x + width/2, y + 230)
    
    // Bouton action
    if (isEquipped) {
      // Badge "Équipé"
      const badge = this.add.graphics()
      badge.fillStyle(0xF39C12, 1)
      badge.fillRoundedRect(x + width/2 - 60, y + height - 50, 120, 40, 8)
      badge.setDepth(2)
      
      this.add.text(x + width/2, y + height - 30, '✓ Équipé', {
        fontSize: '18px',
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(3)
      
    } else if (isUnlocked) {
      // Bouton "Équiper"
      const btn = this.createButton(
        x + width/2,
        y + height - 30,
        120,
        40,
        'Équiper',
        0x3498DB,
        () => this.equipSkin(skin.id)
      )
      
    } else {
      // Afficher les conditions de déblocage
      let unlockText = ''
      if (skin.unlockLevel > 0) {
        const playerLevel = parseInt(localStorage.getItem('playerLevel') || '1')
        unlockText = `Niveau ${skin.unlockLevel}`
        
        if (playerLevel < skin.unlockLevel) {
          this.add.text(x + width/2, y + height - 50, `🔒 ${unlockText}`, {
            fontSize: '16px',
            fontFamily: window.getGameFont(),
            color: '#E74C3C',
            fontStyle: 'bold'
          }).setOrigin(0.5).setDepth(2)
        }
      }
      
      if (skin.unlockCost > 0) {
        const playerCoins = parseInt(localStorage.getItem('playerCoins') || '0')
        const canAfford = playerCoins >= skin.unlockCost
        
        const btn = this.createButton(
          x + width/2,
          y + height - 30,
          120,
          40,
          `${skin.unlockCost} 🧀`,
          canAfford ? 0x27AE60 : 0x95A5A6,
          () => this.buySkin(skin.id)
        )
        
        if (!canAfford) {
          btn.zone.removeInteractive()
        }
      }
    }
  }
  
  createItemPreview(skin, x, y) {
    // Afficher 3 items en preview
    const itemTypes = ['milk_box', 'chips_bag', 'cola_bottle']
    const spacing = 45
    const startX = x - (spacing * (itemTypes.length - 1)) / 2
    
    itemTypes.forEach((itemType, index) => {
      const itemX = startX + (index * spacing)
      const texture = skin.items[itemType]
      
      const item = this.add.image(itemX, y, texture)
        .setScale(0.06)
        .setDepth(2)
      
      // Appliquer la teinte si le skin en a une
      if (skin.tint) {
        item.setTint(skin.tint)
      }
    })
  }
  
  createButton(x, y, width, height, text, color, callback) {
    const btn = this.add.graphics()
    btn.fillStyle(color, 0.95)
    btn.fillRoundedRect(x - width/2, y - height/2, width, height, 8)
    btn.lineStyle(2, color - 0x222222, 1)
    btn.strokeRoundedRect(x - width/2, y - height/2, width, height, 8)
    btn.setDepth(2)
    
    const btnText = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3)
    
    const zone = this.add.zone(x, y, width, height)
      .setInteractive()
      .setDepth(4)
    
    zone.on('pointerup', () => {
      this.sound.play('ui_click', { volume: 0.5 })
      callback()
    })
    
    zone.on('pointerover', () => {
      btn.clear()
      btn.fillStyle(color + 0x111111, 1)
      btn.fillRoundedRect(x - width/2, y - height/2, width, height, 8)
      btn.lineStyle(2, color - 0x222222, 1)
      btn.strokeRoundedRect(x - width/2, y - height/2, width, height, 8)
      
      btnText.setScale(1.1)
    })
    
    zone.on('pointerout', () => {
      btn.clear()
      btn.fillStyle(color, 0.95)
      btn.fillRoundedRect(x - width/2, y - height/2, width, height, 8)
      btn.lineStyle(2, color - 0x222222, 1)
      btn.strokeRoundedRect(x - width/2, y - height/2, width, height, 8)
      
      btnText.setScale(1)
    })
    
    return { btn, text: btnText, zone }
  }
  
  equipSkin(skinId) {
    const success = skinManager.equipSkin(skinId)
    
    if (success) {
      this.showNotification(`Skin "${skinManager.getSkin(skinId).name}" équipé!`, 'success')
      
      // Rafraîchir la scène
      this.time.delayedCall(1000, () => {
        this.scene.restart()
      })
    }
  }
  
  buySkin(skinId) {
    const result = skinManager.unlockWithCoins(skinId)
    
    if (result.success) {
      this.showNotification(result.message, 'success')
      
      // Rafraîchir la scène
      this.time.delayedCall(1500, () => {
        this.scene.restart()
      })
    } else {
      this.showNotification(result.message, 'error')
    }
  }
  
  showNotification(text, type) {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    const color = type === 'success' ? '#27AE60' : '#E74C3C'
    
    const notif = this.add.text(screenWidth / 2, screenHeight / 2, text, {
      fontSize: '28px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: color,
      padding: { x: 30, y: 15 }
    }).setOrigin(0.5).setDepth(9999).setAlpha(0)
    
    this.tweens.add({
      targets: notif,
      alpha: 1,
      y: screenHeight / 2 - 50,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: notif,
            alpha: 0,
            duration: 300,
            onComplete: () => notif.destroy()
          })
        })
      }
    })
  }
  
  createBackButton() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    const btn = this.createButton(
      screenWidth / 2,
      screenHeight - 50,
      150,
      60,
      '← Retour',
      0xE74C3C,
      () => {
        this.scene.stop()
        this.scene.resume('MenuScene')
      }
    )
  }
}
