/**
 * 🚨 Error Handler Module
 * Gestion centralisée des erreurs et cas limites pour le jeu Tom & Jerry
 *
 * Fonctionnalités :
 * - Capture et logging des erreurs
 * - Gestion gracieuse des échecs
 * - Validation des données d'entrée
 * - Récupération automatique des états corrompus
 * - Notifications utilisateur pour les erreurs récupérables
 */

export class ErrorHandler {
  constructor(scene) {
    this.scene = scene
    this.errorLog = []
    this.maxLogSize = 50
    this.recoveryStrategies = new Map()

    this.setupGlobalErrorHandling()
    this.setupRecoveryStrategies()
  }

  /**
   * 🌐 Configuration de la gestion globale des erreurs
   */
  setupGlobalErrorHandling() {
    // Intercepter les erreurs JavaScript non gérées
    window.addEventListener('error', (event) => {
      this.handleJavaScriptError(event.error, event.message, event.filename, event.lineno, event.colno)
    })

    // Intercepter les promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event.reason, event.promise)
    })

    // Intercepter les erreurs Phaser spécifiques
    if (this.scene.game) {
      this.scene.game.events.on('error', (error) => {
        this.handlePhaserError(error)
      })
    }

    console.log('🚨 Global error handling enabled')
  }

  /**
   * 🛠️ Configuration des stratégies de récupération
   */
  setupRecoveryStrategies() {
    // Stratégie pour les erreurs de chargement d'assets
    this.recoveryStrategies.set('ASSET_LOAD_ERROR', (error) => {
      return this.recoverFromAssetLoadError(error)
    })

    // Stratégie pour les erreurs de réseau
    this.recoveryStrategies.set('NETWORK_ERROR', (error) => {
      return this.recoverFromNetworkError(error)
    })

    // Stratégie pour les erreurs de données corrompues
    this.recoveryStrategies.set('DATA_CORRUPTION', (error) => {
      return this.recoverFromDataCorruption(error)
    })

    // Stratégie pour les erreurs de mémoire
    this.recoveryStrategies.set('MEMORY_ERROR', (error) => {
      return this.recoverFromMemoryError(error)
    })

    // Stratégie pour les erreurs de rendu
    this.recoveryStrategies.set('RENDER_ERROR', (error) => {
      return this.recoverFromRenderError(error)
    })
  }

  /**
   * 🚨 Gestion des erreurs JavaScript
   */
  handleJavaScriptError(error, message, filename, lineno, colno) {
    const errorInfo = {
      type: 'JAVASCRIPT_ERROR',
      message: message,
      stack: error ? error.stack : 'No stack trace',
      file: filename,
      line: lineno,
      column: colno,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.logError(errorInfo)
    this.attemptRecovery('JAVASCRIPT_ERROR', errorInfo)

    // Ne pas afficher d'alerte intrusive, mais logger
    console.error('🚨 JavaScript Error:', errorInfo)
  }

  /**
   * 🔄 Gestion des promesses rejetées
   */
  handleUnhandledRejection(reason, promise) {
    const errorInfo = {
      type: 'UNHANDLED_REJECTION',
      reason: reason,
      promise: promise,
      timestamp: Date.now()
    }

    this.logError(errorInfo)
    console.error('🚨 Unhandled Promise Rejection:', errorInfo)
  }

  /**
   * 🎮 Gestion des erreurs Phaser
   */
  handlePhaserError(error) {
    const errorInfo = {
      type: 'PHASER_ERROR',
      error: error,
      timestamp: Date.now(),
      scene: this.scene.scene.key
    }

    this.logError(errorInfo)
    console.error('🚨 Phaser Error:', errorInfo)
  }

  /**
   * 📝 Logging des erreurs
   */
  logError(errorInfo) {
    this.errorLog.push(errorInfo)

    // Garder seulement les N dernières erreurs
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    // Sauvegarder dans localStorage pour debug
    try {
      localStorage.setItem('gameErrorLog', JSON.stringify(this.errorLog))
    } catch (e) {
      // Ignorer les erreurs de localStorage
    }
  }

  /**
   * 🔧 Tentative de récupération automatique
   */
  attemptRecovery(errorType, errorInfo) {
    const strategy = this.recoveryStrategies.get(errorType)
    if (strategy) {
      try {
        const recovered = strategy(errorInfo)
        if (recovered) {
          console.log('✅ Error recovery successful for:', errorType)
          return true
        }
      } catch (recoveryError) {
        console.error('❌ Error recovery failed:', recoveryError)
      }
    }

    // Si la récupération échoue, afficher une notification utilisateur
    this.showUserFriendlyError(errorType, errorInfo)
    return false
  }

  /**
   * 🖼️ Récupération des erreurs de chargement d'assets
   */
  recoverFromAssetLoadError(error) {
    // Essayer de charger un asset de fallback
    const fallbackAssets = {
      'missing_texture': 'default_item',
      'missing_audio': 'default_sound'
    }

    // Pour les textures manquantes, créer une texture par défaut
    if (error.assetType === 'texture') {
      const graphics = this.scene.add.graphics()
      graphics.fillStyle(0xFF0000, 1)
      graphics.fillRect(0, 0, 64, 64)
      graphics.generateTexture('fallback_texture', 64, 64)
      graphics.destroy()

      console.log('🔧 Created fallback texture for missing asset')
      return true
    }

    return false
  }

  /**
   * 🌐 Récupération des erreurs réseau
   */
  recoverFromNetworkError(error) {
    // Pour les jeux en ligne, basculer en mode solo
    if (this.scene.gameMode === 'online') {
      console.log('🔧 Switching to single player mode due to network error')
      this.scene.gameMode = 'single'
      this.scene.showNetworkErrorNotification()
      return true
    }

    return false
  }

  /**
   * 💾 Récupération des corruptions de données
   */
  recoverFromDataCorruption(error) {
    // Réinitialiser les données corrompues avec des valeurs par défaut
    if (error.dataType === 'gameState') {
      console.log('🔧 Resetting corrupted game state')
      this.scene.logic.initializeGameState()
      return true
    }

    if (error.dataType === 'grid') {
      console.log('🔧 Rebuilding corrupted grid')
      this.scene.logic.initializeGrid()
      return true
    }

    return false
  }

  /**
   * 🧠 Récupération des erreurs de mémoire
   */
  recoverFromMemoryError(error) {
    // Forcer le garbage collection si disponible
    if (window.gc) {
      window.gc()
    }

    // Désactiver les effets gourmands en ressources
    this.disableResourceIntensiveFeatures()

    // Reduire la qualité graphique
    this.reduceGraphicsQuality()

    console.log('🔧 Memory optimization applied')
    return true
  }

  /**
   * 🎨 Récupération des erreurs de rendu
   */
  recoverFromRenderError(error) {
    // Désactiver les effets de particules
    this.scene.effects.disableParticles()

    // Simplifier les animations
    this.scene.tweens.pauseAll()

    // Recharger la scène si nécessaire
    if (error.severity === 'critical') {
      console.log('🔧 Reloading scene due to render error')
      this.scene.scene.restart()
      return true
    }

    return false
  }

  /**
   * ⚡ Désactiver les fonctionnalités gourmandes
   */
  disableResourceIntensiveFeatures() {
    // Désactiver les effets de particules
    if (this.scene.effects) {
      this.scene.effects.disableParticles()
    }

    // Réduire la fréquence des événements
    if (this.scene.eventsManager) {
      this.scene.eventsManager.reduceFrequency()
    }

    // Désactiver les animations non essentielles
    this.scene.tweens.pauseAll()
  }

  /**
   * 📊 Réduire la qualité graphique
   */
  reduceGraphicsQuality() {
    // Réduire la résolution de rendu
    this.scene.cameras.main.setZoom(0.8)

    // Désactiver les effets de post-processing
    if (this.scene.renderer) {
      this.scene.renderer.config.antialias = false
    }
  }

  /**
   * 👤 Afficher une erreur conviviale à l'utilisateur
   */
  showUserFriendlyError(errorType, errorInfo) {
    const messages = {
      'JAVASCRIPT_ERROR': 'Oops! Something went wrong. The game will continue.',
      'NETWORK_ERROR': 'Connection lost. Playing in offline mode.',
      'ASSET_LOAD_ERROR': 'Some graphics failed to load. Using defaults.',
      'MEMORY_ERROR': 'Running low on memory. Performance optimized.',
      'RENDER_ERROR': 'Display error detected. Graphics simplified.',
      'DATA_CORRUPTION': 'Game data was corrupted. Resetting level.'
    }

    const message = messages[errorType] || 'An error occurred. Please try again.'

    // Afficher une notification non-intrusive
    this.showErrorNotification(message, errorType === 'critical')
  }

  /**
   * 🔔 Afficher une notification d'erreur
   */
  showErrorNotification(message, isCritical = false) {
    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height

    const bgColor = isCritical ? 0xFF4444 : 0xFFAA44
    const textColor = '#FFFFFF'

    // Background
    const bg = this.scene.add.graphics()
    bg.fillStyle(bgColor, 0.9)
    bg.fillRoundedRect(20, screenHeight - 100, screenWidth - 40, 80, 10)
    bg.setDepth(10000)

    // Texte
    const text = this.scene.add.text(screenWidth / 2, screenHeight - 60, message, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: textColor,
      align: 'center',
      wordWrap: { width: screenWidth - 80 }
    }).setOrigin(0.5).setDepth(10001)

    // Auto-disparition après 5 secondes
    this.scene.time.delayedCall(5000, () => {
      bg.destroy()
      text.destroy()
    })
  }

  /**
   * 🔍 Validation des données d'entrée
   */
  validateInput(data, schema) {
    try {
      // Validation basique des types
      for (const [key, type] of Object.entries(schema)) {
        if (data[key] !== undefined) {
          if (typeof data[key] !== type) {
            throw new Error(`Invalid type for ${key}: expected ${type}, got ${typeof data[key]}`)
          }
        }
      }
      return true
    } catch (error) {
      this.logError({
        type: 'VALIDATION_ERROR',
        message: error.message,
        data: data,
        schema: schema,
        timestamp: Date.now()
      })
      return false
    }
  }

  /**
   * 🛡️ Validation de l'état du jeu
   */
  validateGameState() {
    const issues = []

    // Vérifier la grille
    if (!this.scene.logic.gridData || !Array.isArray(this.scene.logic.gridData)) {
      issues.push('Grid data is corrupted')
    } else {
      this.scene.logic.gridData.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) {
          issues.push(`Grid row ${rowIndex} is corrupted`)
        } else {
          row.forEach((cell, colIndex) => {
            if (!cell || typeof cell !== 'object') {
              issues.push(`Grid cell ${rowIndex},${colIndex} is corrupted`)
            }
          })
        }
      })
    }

    // Vérifier les compteurs
    if (typeof this.scene.logic.score !== 'number' || this.scene.logic.score < 0) {
      issues.push('Score is corrupted')
    }

    if (typeof this.scene.logic.currentMoves !== 'number' || this.scene.logic.currentMoves < 0) {
      issues.push('Move counter is corrupted')
    }

    // Signaler les problèmes
    if (issues.length > 0) {
      this.logError({
        type: 'STATE_VALIDATION_ERROR',
        issues: issues,
        timestamp: Date.now()
      })

      // Tenter une récupération automatique
      this.attemptRecovery('DATA_CORRUPTION', { dataType: 'gameState' })
    }

    return issues.length === 0
  }

  /**
   * 📊 Obtenir les statistiques d'erreur
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByType: {},
      recentErrors: this.errorLog.slice(-10),
      recoveryAttempts: 0,
      successfulRecoveries: 0
    }

    this.errorLog.forEach(error => {
      stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1
    })

    return stats
  }

  /**
   * 🧹 Nettoyer le log d'erreurs
   */
  clearErrorLog() {
    this.errorLog = []
    localStorage.removeItem('gameErrorLog')
  }

  /**
   * 📤 Exporter le log d'erreurs pour debug
   */
  exportErrorLog() {
    const data = {
      errorLog: this.errorLog,
      stats: this.getErrorStats(),
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        gameVersion: '1.0.0'
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `game-error-log-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 🧹 Nettoyer les ressources
   */
  destroy() {
    // Supprimer les event listeners
    window.removeEventListener('error', this.handleJavaScriptError)
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)

    if (this.scene.game) {
      this.scene.game.events.off('error', this.handlePhaserError)
    }

    this.clearErrorLog()
  }
}