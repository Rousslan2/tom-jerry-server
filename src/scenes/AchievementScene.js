/**
 * 🏆 Achievement Scene
 * Affiche tous les trophées et leur progression
 */

import Phaser from 'phaser'
import { achievementManager } from '../services/AchievementManager.js'

export default class AchievementScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AchievementScene' })
  }
  
  create() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Background semi-transparent
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    bg.fillRect(0, 0, screenWidth, screenHeight)
    bg.setDepth(0)
    
    // Titre
    this.add.text(screenWidth / 2, 60, '🏆 ACHIEVEMENTS', {
      fontSize: '48px',
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(1)
    
    // Stats globales
    const completion = achievementManager.getCompletionPercentage()
    const stats = achievementManager.getStats()
    
    const statsText = `Complétion: ${completion}% | Victoires: ${stats.totalWins} | Meilleur Combo: x${stats.bestCombo}`
    this.add.text(screenWidth / 2, 110, statsText, {
      fontSize: '18px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(1)
    
    // Tabs pour filtrer par catégorie
    this.currentCategory = 'all'
    this.createCategoryTabs()
    
    // Container scrollable pour les achievements
    this.createAchievementsList()
    
    // Bouton retour
    this.createBackButton()
  }
  
  createCategoryTabs() {
    const screenWidth = this.cameras.main.width
    const categories = [
      { id: 'all', name: 'Tous', emoji: '🎯' },
      { id: 'beginner', name: 'Débutant', emoji: '🥇' },
      { id: 'intermediate', name: 'Intermédiaire', emoji: '🥈' },
      { id: 'expert', name: 'Expert', emoji: '🥉' }
    ]
    
    const tabWidth = 150
    const spacing = 20
    const totalWidth = (tabWidth * categories.length) + (spacing * (categories.length - 1))
    const startX = (screenWidth - totalWidth) / 2
    
    categories.forEach((cat, index) => {
      const x = startX + (index * (tabWidth + spacing))
      const y = 160
      
      // Background du tab
      const tabBg = this.add.graphics()
      const isActive = this.currentCategory === cat.id
      tabBg.fillStyle(isActive ? 0x4169E1 : 0x2C3E50, 0.9)
      tabBg.fillRoundedRect(x, y, tabWidth, 50, 10)
      tabBg.lineStyle(2, isActive ? 0xFFD700 : 0x7F8C8D, 1)
      tabBg.strokeRoundedRect(x, y, tabWidth, 50, 10)
      tabBg.setDepth(1)
      
      // Texte du tab
      const tabText = this.add.text(x + tabWidth / 2, y + 25, `${cat.emoji} ${cat.name}`, {
        fontSize: '16px',
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(2)
      
      // Zone interactive
      const zone = this.add.zone(x, y, tabWidth, 50)
        .setOrigin(0)
        .setInteractive()
        .setDepth(3)
      
      zone.on('pointerup', () => {
        this.currentCategory = cat.id
        this.scene.restart()
      })
      
      zone.on('pointerover', () => {
        if (!isActive) {
          tabBg.clear()
          tabBg.fillStyle(0x34495E, 0.9)
          tabBg.fillRoundedRect(x, y, tabWidth, 50, 10)
          tabBg.lineStyle(2, 0x7F8C8D, 1)
          tabBg.strokeRoundedRect(x, y, tabWidth, 50, 10)
        }
      })
    })
  }
  
  createAchievementsList() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Obtenir les achievements selon la catégorie
    let achievements = this.currentCategory === 'all' 
      ? achievementManager.getAllAchievements()
      : achievementManager.getByCategory(this.currentCategory)
    
    // Trier par débloqué/verrouillé
    achievements.sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1
      if (!a.unlocked && b.unlocked) return 1
      return 0
    })
    
    const startY = 240
    const itemHeight = 120
    const padding = 10
    
    achievements.forEach((achievement, index) => {
      const y = startY + (index * (itemHeight + padding))
      
      // Ne pas afficher si hors écran
      if (y > screenHeight - 100) return
      
      this.createAchievementCard(achievement, screenWidth / 2, y, screenWidth - 100)
    })
  }
  
  createAchievementCard(achievement, x, y, width) {
    const height = 100
    const isUnlocked = achievement.unlocked
    
    // Background
    const cardBg = this.add.graphics()
    cardBg.fillStyle(isUnlocked ? 0x27AE60 : 0x2C3E50, 0.9)
    cardBg.fillRoundedRect(x - width/2, y, width, height, 12)
    cardBg.lineStyle(3, isUnlocked ? 0xFFD700 : 0x7F8C8D, 0.8)
    cardBg.strokeRoundedRect(x - width/2, y, width, height, 12)
    cardBg.setDepth(1)
    
    // Icône
    const icon = this.add.text(x - width/2 + 50, y + height/2, achievement.icon, {
      fontSize: '48px'
    }).setOrigin(0.5).setDepth(2)
    
    // Lock icon si verrouillé
    if (!isUnlocked) {
      const lock = this.add.text(x - width/2 + 50, y + height/2, '🔒', {
        fontSize: '30px'
      }).setOrigin(0.5).setDepth(3)
    }
    
    // Nom
    const name = this.add.text(x - width/2 + 100, y + 25, achievement.name, {
      fontSize: '22px',
      fontFamily: window.getGameFont(),
      color: isUnlocked ? '#FFFFFF' : '#95A5A6',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(2)
    
    // Description
    const desc = this.add.text(x - width/2 + 100, y + 50, achievement.description, {
      fontSize: '16px',
      fontFamily: window.getGameFont(),
      color: isUnlocked ? '#ECF0F1' : '#7F8C8D'
    }).setOrigin(0, 0.5).setDepth(2)
    
    // Progression
    if (!isUnlocked && achievement.target > 1) {
      const progressPercent = Math.round((achievement.progress / achievement.target) * 100)
      const progressText = `${achievement.progress}/${achievement.target} (${progressPercent}%)`
      
      this.add.text(x - width/2 + 100, y + 75, progressText, {
        fontSize: '14px',
        fontFamily: window.getGameFont(),
        color: '#3498DB'
      }).setOrigin(0, 0.5).setDepth(2)
      
      // Barre de progression
      const barWidth = 200
      const barHeight = 8
      const barX = x - width/2 + 300
      const barY = y + 75
      
      // Background de la barre
      const barBg = this.add.graphics()
      barBg.fillStyle(0x34495E, 0.8)
      barBg.fillRoundedRect(barX, barY - barHeight/2, barWidth, barHeight, 4)
      barBg.setDepth(2)
      
      // Progression
      const progressWidth = (barWidth * progressPercent) / 100
      const progressBar = this.add.graphics()
      progressBar.fillStyle(0x3498DB, 1)
      progressBar.fillRoundedRect(barX, barY - barHeight/2, progressWidth, barHeight, 4)
      progressBar.setDepth(3)
    }
    
    // Récompense
    const reward = this.add.text(x + width/2 - 80, y + height/2, `+${achievement.reward} 🧀`, {
      fontSize: '20px',
      fontFamily: window.getGameFont(),
      color: isUnlocked ? '#F39C12' : '#95A5A6',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2)
    
    // Checkmark si débloqué
    if (isUnlocked) {
      this.add.text(x + width/2 - 30, y + height/2, '✅', {
        fontSize: '32px'
      }).setOrigin(0.5).setDepth(2)
    }
  }
  
  createBackButton() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    const buttonWidth = 150
    const buttonHeight = 60
    const x = screenWidth / 2
    const y = screenHeight - 50
    
    // Background
    const btnBg = this.add.graphics()
    btnBg.fillStyle(0xE74C3C, 0.95)
    btnBg.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
    btnBg.lineStyle(3, 0xC0392B, 1)
    btnBg.strokeRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
    btnBg.setDepth(1)
    
    // Texte
    const btnText = this.add.text(x, y, '← Retour', {
      fontSize: '24px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2)
    
    // Zone interactive
    const zone = this.add.zone(x, y, buttonWidth, buttonHeight)
      .setInteractive()
      .setDepth(3)
    
    zone.on('pointerup', () => {
      this.sound.play('ui_click', { volume: 0.5 })
      this.scene.stop()
      this.scene.resume('MenuScene')
    })
    
    zone.on('pointerover', () => {
      btnBg.clear()
      btnBg.fillStyle(0xFF5C4C, 1)
      btnBg.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
      btnBg.lineStyle(3, 0xC0392B, 1)
      btnBg.strokeRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
      
      btnText.setScale(1.1)
    })
    
    zone.on('pointerout', () => {
      btnBg.clear()
      btnBg.fillStyle(0xE74C3C, 0.95)
      btnBg.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
      btnBg.lineStyle(3, 0xC0392B, 1)
      btnBg.strokeRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
      
      btnText.setScale(1)
    })
  }
}
