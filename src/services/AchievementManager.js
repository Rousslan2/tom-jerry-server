/**
 * 🏆 Achievement Manager
 * Gère tous les trophées/succès du jeu
 */

export class AchievementManager {
  constructor() {
    this.achievements = {
      // 🥇 Débutant
      first_win: {
        id: 'first_win',
        name: 'Première Victoire',
        description: 'Gagne ta première partie',
        icon: '🏆',
        reward: 100,
        unlocked: false,
        progress: 0,
        target: 1,
        category: 'beginner'
      },
      first_combo: {
        id: 'first_combo',
        name: 'Premier Combo',
        description: 'Fais ton premier combo x2',
        icon: '🔥',
        reward: 50,
        unlocked: false,
        progress: 0,
        target: 1,
        category: 'beginner'
      },
      ten_games: {
        id: 'ten_games',
        name: 'Joueur Régulier',
        description: 'Joue 10 parties',
        icon: '🎮',
        reward: 150,
        unlocked: false,
        progress: 0,
        target: 10,
        category: 'beginner'
      },
      
      // 🥈 Intermédiaire
      combo_master: {
        id: 'combo_master',
        name: 'Maître du Combo',
        description: 'Fais un combo x5',
        icon: '⚡',
        reward: 300,
        unlocked: false,
        progress: 0,
        target: 1,
        category: 'intermediate'
      },
      speed_demon: {
        id: 'speed_demon',
        name: 'Démon de Vitesse',
        description: 'Gagne en moins de 2 minutes',
        icon: '💨',
        reward: 250,
        unlocked: false,
        progress: 0,
        target: 1,
        category: 'intermediate'
      },
      economical: {
        id: 'economical',
        name: 'Économe',
        description: 'Gagne avec moins de 30 moves',
        icon: '💰',
        reward: 200,
        unlocked: false,
        progress: 0,
        target: 1,
        category: 'intermediate'
      },
      fifty_wins: {
        id: 'fifty_wins',
        name: '50 Victoires',
        description: 'Gagne 50 parties',
        icon: '🌟',
        reward: 500,
        unlocked: false,
        progress: 0,
        target: 50,
        category: 'intermediate'
      },
      
      // 🥉 Expert
      perfectionist: {
        id: 'perfectionist',
        name: 'Perfectionniste',
        description: 'Complète tous les objectifs sans obstacles',
        icon: '✨',
        reward: 1000,
        unlocked: false,
        progress: 0,
        target: 1,
        category: 'expert'
      },
      hundred_wins: {
        id: 'hundred_wins',
        name: '100 Victoires',
        description: 'Gagne 100 parties',
        icon: '👑',
        reward: 1500,
        unlocked: false,
        progress: 0,
        target: 100,
        category: 'expert'
      },
      online_legend: {
        id: 'online_legend',
        name: 'Légende Online',
        description: 'Gagne 50 parties en multijoueur',
        icon: '🌐',
        reward: 2000,
        unlocked: false,
        progress: 0,
        target: 50,
        category: 'expert'
      },
      mega_combo: {
        id: 'mega_combo',
        name: 'Mega Combo',
        description: 'Fais un combo x10',
        icon: '🚀',
        reward: 1200,
        unlocked: false,
        progress: 0,
        target: 1,
        category: 'expert'
      },
      collector: {
        id: 'collector',
        name: 'Collectionneur',
        description: 'Élimine 1000 items au total',
        icon: '📦',
        reward: 800,
        unlocked: false,
        progress: 0,
        target: 1000,
        category: 'expert'
      }
    }
    
    // Charger la progression depuis localStorage
    this.loadProgress()
    
    // Statistiques globales
    this.stats = {
      totalGames: 0,
      totalWins: 0,
      totalItemsEliminated: 0,
      bestCombo: 0,
      fastestWin: Infinity,
      onlineWins: 0
    }
    this.loadStats()
  }
  
  /**
   * Charger la progression depuis localStorage
   */
  loadProgress() {
    const saved = localStorage.getItem('achievements')
    if (saved) {
      const savedAchievements = JSON.parse(saved)
      Object.keys(savedAchievements).forEach(key => {
        if (this.achievements[key]) {
          this.achievements[key].unlocked = savedAchievements[key].unlocked
          this.achievements[key].progress = savedAchievements[key].progress
        }
      })
    }
  }
  
  /**
   * Sauvegarder la progression
   */
  saveProgress() {
    const toSave = {}
    Object.keys(this.achievements).forEach(key => {
      toSave[key] = {
        unlocked: this.achievements[key].unlocked,
        progress: this.achievements[key].progress
      }
    })
    localStorage.setItem('achievements', JSON.stringify(toSave))
  }
  
  /**
   * Charger les stats
   */
  loadStats() {
    const saved = localStorage.getItem('achievementStats')
    if (saved) {
      this.stats = JSON.parse(saved)
    }
  }
  
  /**
   * Sauvegarder les stats
   */
  saveStats() {
    localStorage.setItem('achievementStats', JSON.stringify(this.stats))
  }
  
  /**
   * Incrémenter la progression d'un achievement
   */
  incrementProgress(achievementId, amount = 1) {
    const achievement = this.achievements[achievementId]
    if (!achievement || achievement.unlocked) return null
    
    achievement.progress += amount
    
    // Vérifier si débloqu é
    if (achievement.progress >= achievement.target) {
      return this.unlock(achievementId)
    }
    
    this.saveProgress()
    return null
  }
  
  /**
   * Débloquer un achievement
   */
  unlock(achievementId) {
    const achievement = this.achievements[achievementId]
    if (!achievement || achievement.unlocked) return null
    
    achievement.unlocked = true
    achievement.progress = achievement.target
    
    this.saveProgress()
    
    console.log(`🏆 Achievement unlocked: ${achievement.name}`)
    
    // Ajouter la récompense
    const currentCoins = parseInt(localStorage.getItem('playerCoins') || '0')
    localStorage.setItem('playerCoins', (currentCoins + achievement.reward).toString())
    
    return achievement
  }
  
  /**
   * Événements de jeu
   */
  
  onGameStart() {
    this.stats.totalGames++
    this.saveStats()
    this.incrementProgress('ten_games')
  }
  
  onGameWin(data) {
    this.stats.totalWins++
    
    // Première victoire
    this.incrementProgress('first_win')
    
    // 50 victoires
    this.incrementProgress('fifty_wins')
    
    // 100 victoires
    this.incrementProgress('hundred_wins')
    
    // Speed demon (moins de 2 minutes)
    if (data.duration && data.duration < 120000) {
      this.incrementProgress('speed_demon')
    }
    
    // Économe (moins de 30 moves)
    if (data.moves && data.moves < 30) {
      this.incrementProgress('economical')
    }
    
    // Fastest win
    if (data.duration && data.duration < this.stats.fastestWin) {
      this.stats.fastestWin = data.duration
    }
    
    // Online wins
    if (data.mode === 'online') {
      this.stats.onlineWins++
      this.incrementProgress('online_legend')
    }
    
    // Perfectionniste (sans obstacles)
    if (data.noObstacles) {
      this.incrementProgress('perfectionist')
    }
    
    this.saveStats()
  }
  
  onCombo(comboLevel) {
    // Premier combo
    if (comboLevel >= 2) {
      this.incrementProgress('first_combo')
    }
    
    // Combo master (x5)
    if (comboLevel >= 5) {
      this.incrementProgress('combo_master')
    }
    
    // Mega combo (x10)
    if (comboLevel >= 10) {
      this.incrementProgress('mega_combo')
    }
    
    // Best combo
    if (comboLevel > this.stats.bestCombo) {
      this.stats.bestCombo = comboLevel
      this.saveStats()
    }
  }
  
  onItemsEliminated(count) {
    this.stats.totalItemsEliminated += count
    this.incrementProgress('collector', count)
    this.saveStats()
  }
  
  /**
   * Obtenir tous les achievements
   */
  getAllAchievements() {
    return Object.values(this.achievements)
  }
  
  /**
   * Obtenir les achievements par catégorie
   */
  getByCategory(category) {
    return Object.values(this.achievements).filter(a => a.category === category)
  }
  
  /**
   * Obtenir le pourcentage de complétion
   */
  getCompletionPercentage() {
    const total = Object.keys(this.achievements).length
    const unlocked = Object.values(this.achievements).filter(a => a.unlocked).length
    return Math.round((unlocked / total) * 100)
  }
  
  /**
   * Obtenir le nombre total de fromages gagnés
   */
  getTotalRewards() {
    return Object.values(this.achievements)
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.reward, 0)
  }
  
  /**
   * Obtenir les stats
   */
  getStats() {
    return this.stats
  }
}

// Instance globale
export const achievementManager = new AchievementManager()
