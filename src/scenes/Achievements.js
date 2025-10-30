/**
 * 🏆 Achievements System
 * Système de succès et récompenses pour le jeu Tom & Jerry
 *
 * Fonctionnalités :
 * - Succès débloquables
 * - Récompenses en pièces
 * - Progression et statistiques
 * - Notifications de déblocage
 */

export class Achievements {
  constructor(scene) {
    this.scene = scene
    this.achievements = new Map()
    this.unlockedAchievements = new Set()
    this.progress = new Map()

    this.initializeAchievements()
    this.loadProgress()
  }

  /**
   * 🏆 Initialisation des succès disponibles
   */
  initializeAchievements() {
    this.achievementsList = {
      // Succès de base
      'first_match': {
        id: 'first_match',
        name: 'First Match!',
        description: 'Make your first match-3',
        icon: '🎯',
        reward: 10,
        type: 'progress',
        target: 1,
        category: 'basic'
      },

      'combo_master': {
        id: 'combo_master',
        name: 'Combo Master',
        description: 'Achieve a 5x combo',
        icon: '⚡',
        reward: 50,
        type: 'progress',
        target: 1,
        category: 'combos'
      },

      'speed_demon': {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a level in under 30 seconds',
        icon: '💨',
        reward: 75,
        type: 'time',
        target: 30,
        category: 'speed'
      },

      'perfectionist': {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete a level without using power-ups',
        icon: '✨',
        reward: 100,
        type: 'progress',
        target: 1,
        category: 'skill'
      },

      // Succès de progression
      'match_maker': {
        id: 'match_maker',
        name: 'Match Maker',
        description: 'Make 100 matches',
        icon: '🎪',
        reward: 25,
        type: 'progress',
        target: 100,
        category: 'progression'
      },

      'high_scorer': {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Score 10,000 points in a single game',
        icon: '🏆',
        reward: 50,
        type: 'score',
        target: 10000,
        category: 'scoring'
      },

      'survivor': {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive for 5 minutes in endless mode',
        icon: '⏰',
        reward: 150,
        type: 'time',
        target: 300,
        category: 'endurance'
      },

      // Succès spéciaux
      'social_butterfly': {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Play 10 multiplayer games',
        icon: '👥',
        reward: 75,
        type: 'progress',
        target: 10,
        category: 'multiplayer'
      },

      'power_user': {
        id: 'power_user',
        name: 'Power User',
        description: 'Use each power-up at least once',
        icon: '🔥',
        reward: 100,
        type: 'collection',
        target: ['shuffle', 'bomb', 'lightning', 'freeze', 'magnet', 'rainbow'],
        category: 'powerups'
      },

      'tom_hunter': {
        id: 'tom_hunter',
        name: 'Tom Hunter',
        description: 'Trigger Tom events 25 times',
        icon: '🐱',
        reward: 60,
        type: 'progress',
        target: 25,
        category: 'events'
      },

      // Succès cachés
      'lucky_player': {
        id: 'lucky_player',
        name: 'Lucky Player',
        description: 'Get a rainbow wildcard naturally',
        icon: '🍀',
        reward: 200,
        type: 'progress',
        target: 1,
        category: 'hidden',
        hidden: true
      },

      'speedrunner': {
        id: 'speedrunner',
        name: 'Speedrunner',
        description: 'Complete 10 levels in under 10 seconds each',
        icon: '🚀',
        reward: 300,
        type: 'progress',
        target: 10,
        category: 'hidden',
        hidden: true
      }
    }

    // Organiser par catégories
    this.categories = {
      basic: [],
      combos: [],
      speed: [],
      skill: [],
      progression: [],
      scoring: [],
      endurance: [],
      multiplayer: [],
      powerups: [],
      events: [],
      hidden: []
    }

    Object.values(this.achievementsList).forEach(achievement => {
      this.categories[achievement.category].push(achievement.id)
    })
  }

  /**
   * 💾 Charger la progression depuis le stockage local
   */
  loadProgress() {
    const saved = localStorage.getItem('achievementProgress')
    if (saved) {
      const data = JSON.parse(saved)
      this.unlockedAchievements = new Set(data.unlocked || [])
      this.progress = new Map(Object.entries(data.progress || {}))
    }
  }

  /**
   * 💾 Sauvegarder la progression
   */
  saveProgress() {
    const data = {
      unlocked: Array.from(this.unlockedAchievements),
      progress: Object.fromEntries(this.progress)
    }
    localStorage.setItem('achievementProgress', JSON.stringify(data))
  }

  /**
   * 📊 Mettre à jour la progression d'un succès
   */
  updateProgress(achievementId, value = 1, context = {}) {
    if (!this.achievementsList[achievementId]) return

    const achievement = this.achievementsList[achievementId]
    const currentProgress = this.progress.get(achievementId) || 0

    // Calculer la nouvelle progression selon le type
    let newProgress = currentProgress

    switch (achievement.type) {
      case 'progress':
        newProgress = Math.min(currentProgress + value, achievement.target)
        break
      case 'score':
        if (context.score && context.score >= achievement.target) {
          newProgress = achievement.target
        }
        break
      case 'time':
        if (context.time && context.time <= achievement.target) {
          newProgress = achievement.target
        }
        break
      case 'collection':
        // Pour les succès de collection, vérifier si tous les éléments sont présents
        const collectedItems = context.collected || []
        const hasAllItems = achievement.target.every(item => collectedItems.includes(item))
        if (hasAllItems) {
          newProgress = achievement.target.length
        }
        break
    }

    // Mettre à jour si la progression a changé
    if (newProgress !== currentProgress) {
      this.progress.set(achievementId, newProgress)

      // Vérifier si le succès est débloqué
      if (newProgress >= achievement.target && !this.unlockedAchievements.has(achievementId)) {
        this.unlockAchievement(achievementId)
      }

      this.saveProgress()
    }
  }

  /**
   * 🔓 Débloquer un succès
   */
  unlockAchievement(achievementId) {
    if (this.unlockedAchievements.has(achievementId)) return

    const achievement = this.achievementsList[achievementId]
    if (!achievement) return

    this.unlockedAchievements.add(achievementId)

    // Ajouter les pièces de récompense
    this.addCoins(achievement.reward)

    // Notification
    this.showUnlockNotification(achievement)

    // Effets spéciaux pour les succès cachés
    if (achievement.hidden) {
      this.showHiddenAchievementEffect(achievement)
    }

    // Sauvegarder
    this.saveProgress()

    console.log(`🏆 Achievement unlocked: ${achievement.name}`)
  }

  /**
   * 💰 Ajouter des pièces
   */
  addCoins(amount) {
    const currentCoins = parseInt(localStorage.getItem('playerCoins') || '0')
    localStorage.setItem('playerCoins', (currentCoins + amount).toString())
  }

  /**
   * 🔔 Afficher la notification de déblocage
   */
  showUnlockNotification(achievement) {
    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height

    // Panel de notification
    const panel = this.scene.add.graphics()
    panel.fillStyle(0xFFD700, 1)
    panel.fillRoundedRect(screenWidth/2 - 200, screenHeight/2 - 100, 400, 200, 20)
    panel.lineStyle(4, 0xFFA500, 1)
    panel.strokeRoundedRect(screenWidth/2 - 200, screenHeight/2 - 100, 400, 200, 20)
    panel.setDepth(10000)

    // Icône
    const icon = this.scene.add.text(screenWidth/2 - 150, screenHeight/2 - 60, achievement.icon, {
      fontSize: '48px'
    }).setDepth(10001)

    // Titre
    const title = this.scene.add.text(screenWidth/2, screenHeight/2 - 70, 'ACHIEVEMENT UNLOCKED!', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center'
    }).setOrigin(0.5).setDepth(10001)

    // Nom du succès
    const name = this.scene.add.text(screenWidth/2, screenHeight/2 - 40, achievement.name, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10001)

    // Description
    const description = this.scene.add.text(screenWidth/2, screenHeight/2 - 10, achievement.description, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#333333',
      align: 'center'
    }).setOrigin(0.5).setDepth(10001)

    // Récompense
    const reward = this.scene.add.text(screenWidth/2, screenHeight/2 + 20, `+${achievement.reward} coins!`, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#008000',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10001)

    // Bouton OK
    const okButton = this.scene.add.text(screenWidth/2, screenHeight/2 + 60, 'AWESOME!', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#FF4500',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive().setDepth(10001)

    okButton.on('pointerdown', () => {
      // Animation de disparition
      this.scene.tweens.add({
        targets: [panel, icon, title, name, description, reward, okButton],
        alpha: 0,
        scale: 0.8,
        duration: 300,
        ease: 'Back.easeIn',
        onComplete: () => {
          panel.destroy()
          icon.destroy()
          title.destroy()
          name.destroy()
          description.destroy()
          reward.destroy()
          okButton.destroy()
        }
      })
    })

    // Animation d'apparition
    panel.setScale(0)
    icon.setScale(0)
    title.setScale(0)
    name.setScale(0)
    description.setScale(0)
    reward.setScale(0)
    okButton.setScale(0)

    this.scene.tweens.add({
      targets: panel,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    })

    this.scene.tweens.add({
      targets: [icon, title, name, description, reward, okButton],
      scale: 1,
      duration: 400,
      ease: 'Elastic.easeOut',
      delay: 200
    })

    // Son de succès
    if (this.scene.audio) {
      this.scene.audio.playSound('level_complete')
    }

    // Auto-disparition après 10 secondes
    this.scene.time.delayedCall(10000, () => {
      if (panel.active) {
        okButton.emit('pointerdown')
      }
    })
  }

  /**
   * ✨ Effet spécial pour les succès cachés
   */
  showHiddenAchievementEffect(achievement) {
    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height

    // Particules dorées
    for (let i = 0; i < 30; i++) {
      const particle = this.scene.add.text(
        screenWidth/2 + (Math.random() - 0.5) * 400,
        screenHeight/2 + (Math.random() - 0.5) * 300,
        '⭐',
        { fontSize: '24px', color: '#FFD700' }
      ).setDepth(10002)

      this.scene.tweens.add({
        targets: particle,
        y: particle.y - 100,
        alpha: 0,
        rotation: Math.PI * 2,
        duration: 2000,
        delay: i * 50,
        onComplete: () => particle.destroy()
      })
    }

    // Texte "HIDDEN ACHIEVEMENT!"
    const hiddenText = this.scene.add.text(screenWidth/2, screenHeight/2 - 150, '🎉 HIDDEN ACHIEVEMENT! 🎉', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#FF4500',
      stroke: '#FFD700',
      strokeThickness: 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10002).setAlpha(0)

    this.scene.tweens.add({
      targets: hiddenText,
      alpha: 1,
      scale: 1.5,
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 2,
      onComplete: () => hiddenText.destroy()
    })
  }

  /**
   * 🎯 Vérifier les succès automatiquement
   */
  checkAchievements(context = {}) {
    // Succès de premier match
    if (context.firstMatch) {
      this.updateProgress('first_match')
    }

    // Succès de combo
    if (context.combo >= 5) {
      this.updateProgress('combo_master')
    }

    // Succès de score élevé
    if (context.score) {
      this.updateProgress('high_scorer', 1, { score: context.score })
    }

    // Succès de vitesse
    if (context.levelTime && context.levelTime < 30) {
      this.updateProgress('speed_demon', 1, { time: context.levelTime })
    }

    // Succès de survie
    if (context.endlessTime && context.endlessTime >= 300) {
      this.updateProgress('survivor', 1, { time: context.endlessTime })
    }

    // Succès de matches cumulés
    if (context.totalMatches) {
      this.updateProgress('match_maker', context.totalMatches)
    }

    // Succès d'événements Tom
    if (context.tomEvents) {
      this.updateProgress('tom_hunter', context.tomEvents)
    }

    // Succès de parties multijoueurs
    if (context.multiplayerGames) {
      this.updateProgress('social_butterfly', context.multiplayerGames)
    }

    // Succès de power-ups
    if (context.usedPowerUps) {
      this.updateProgress('power_user', 1, { collected: context.usedPowerUps })
    }

    // Succès de perfection
    if (context.noPowerUpsUsed) {
      this.updateProgress('perfectionist')
    }

    // Succès cachés
    if (context.rainbowWildcard) {
      this.updateProgress('lucky_player')
    }

    if (context.fastLevels) {
      this.updateProgress('speedrunner', context.fastLevels)
    }
  }

  /**
   * 📊 Obtenir les statistiques des succès
   */
  getAchievementStats() {
    const stats = {
      totalAchievements: Object.keys(this.achievementsList).length,
      unlockedCount: this.unlockedAchievements.size,
      totalCoinsEarned: 0,
      completionPercentage: 0,
      categoryStats: {}
    }

    // Calculer les pièces gagnées
    this.unlockedAchievements.forEach(achievementId => {
      const achievement = this.achievementsList[achievementId]
      if (achievement) {
        stats.totalCoinsEarned += achievement.reward
      }
    })

    // Pourcentage de completion
    stats.completionPercentage = (stats.unlockedCount / stats.totalAchievements) * 100

    // Statistiques par catégorie
    Object.keys(this.categories).forEach(category => {
      const categoryAchievements = this.categories[category]
      const unlockedInCategory = categoryAchievements.filter(id => this.unlockedAchievements.has(id)).length

      stats.categoryStats[category] = {
        total: categoryAchievements.length,
        unlocked: unlockedInCategory,
        percentage: (unlockedInCategory / categoryAchievements.length) * 100
      }
    })

    return stats
  }

  /**
   * 📋 Obtenir la liste des succès avec leur statut
   */
  getAchievementsList() {
    const list = {}

    Object.keys(this.achievementsList).forEach(id => {
      const achievement = this.achievementsList[id]
      const progress = this.progress.get(id) || 0
      const unlocked = this.unlockedAchievements.has(id)

      list[id] = {
        ...achievement,
        progress: progress,
        unlocked: unlocked,
        progressPercentage: (progress / achievement.target) * 100
      }
    })

    return list
  }

  /**
   * 🎯 Obtenir les succès récents (débloqués récemment)
   */
  getRecentAchievements(limit = 5) {
    const recent = Array.from(this.unlockedAchievements)
      .slice(-limit)
      .map(id => this.achievementsList[id])
      .filter(Boolean)

    return recent.reverse() // Plus récent en premier
  }

  /**
   * 🏅 Obtenir les succès proches du déblocage
   */
  getCloseToUnlocking(limit = 3) {
    const closeAchievements = []

    Object.keys(this.achievementsList).forEach(id => {
      if (!this.unlockedAchievements.has(id)) {
        const achievement = this.achievementsList[id]
        const progress = this.progress.get(id) || 0
        const percentage = (progress / achievement.target) * 100

        if (percentage >= 75) { // Plus de 75% de completion
          closeAchievements.push({
            ...achievement,
            progress: progress,
            progressPercentage: percentage
          })
        }
      }
    })

    // Trier par pourcentage décroissant
    closeAchievements.sort((a, b) => b.progressPercentage - a.progressPercentage)

    return closeAchievements.slice(0, limit)
  }

  /**
   * 🎮 Intégration avec le système de jeu
   */
  onGameEvent(eventType, data = {}) {
    switch (eventType) {
      case 'match_made':
        this.checkAchievements({
          firstMatch: data.firstMatch,
          totalMatches: data.totalMatches
        })
        break

      case 'combo_achieved':
        this.checkAchievements({ combo: data.combo })
        break

      case 'level_completed':
        this.checkAchievements({
          score: data.score,
          levelTime: data.levelTime,
          noPowerUpsUsed: data.noPowerUpsUsed
        })
        break

      case 'endless_mode':
        this.checkAchievements({ endlessTime: data.time })
        break

      case 'multiplayer_game':
        this.checkAchievements({ multiplayerGames: data.totalGames })
        break

      case 'tom_event':
        this.checkAchievements({ tomEvents: data.totalEvents })
        break

      case 'powerup_used':
        this.checkAchievements({ usedPowerUps: data.allUsedPowerUps })
        break

      case 'rainbow_spawned':
        this.checkAchievements({ rainbowWildcard: true })
        break

      case 'fast_level':
        this.checkAchievements({ fastLevels: data.fastLevelCount })
        break
    }
  }

  /**
   * 🧹 Nettoyer les ressources
   */
  destroy() {
    this.achievements.clear()
    this.unlockedAchievements.clear()
    this.progress.clear()
  }
}