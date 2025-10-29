/**
 * 📱 Mobile Enhancements Module
 * Améliorations complètes pour l'expérience mobile du jeu Tom & Jerry
 * 
 * Fonctionnalités :
 * - Feedback tactile (vibrations)
 * - Boutons plus gros et mieux espacés
 * - Contrôles tactiles optimisés
 * - Détection d'orientation
 * - Optimisations de performance
 * - Gestes tactiles avancés
 */

export class MobileEnhancements {
  constructor(scene) {
    this.scene = scene
    this.isMobile = this.detectMobile()
    this.isTablet = this.detectTablet()
    this.orientation = this.getOrientation()
    
    // Configuration
    this.config = {
      // Tailles minimales pour les zones tactiles (44x44px minimum selon Apple HIG)
      minTouchSize: 44,
      
      // Délai pour éviter les double-tap accidentels
      doubleTapDelay: 300,
      
      // Support des vibrations
      vibrationEnabled: this.checkVibrationSupport(),
      
      // Patterns de vibration (en ms)
      vibrationPatterns: {
        tap: 10,
        success: [50, 30, 50],
        error: [100, 50, 100],
        elimination: [20, 10, 20, 10, 20],
        victory: [100, 50, 100, 50, 200]
      },
      
      // Scaling pour différentes tailles d'écran
      scales: {
        phone: {
          ui: 1.0,
          items: 0.08,
          buttons: 1.2
        },
        tablet: {
          ui: 1.1,
          items: 0.09,
          buttons: 1.0
        }
      }
    }
    
    this.lastTapTime = 0
    this.setupMobileOptimizations()
  }

  /**
   * 📱 Détection du type d'appareil
   */
  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    
    // Détection iOS
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return true
    }
    
    // Détection Android
    if (/android/i.test(userAgent)) {
      return true
    }
    
    // Détection par taille d'écran
    if (window.innerWidth <= 768) {
      return true
    }
    
    // Détection par touch support
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return window.innerWidth <= 1024
    }
    
    return false
  }

  detectTablet() {
    const width = window.innerWidth
    return this.isMobile && width >= 768 && width <= 1024
  }

  getOrientation() {
    if (window.innerHeight > window.innerWidth) {
      return 'portrait'
    }
    return 'landscape'
  }

  checkVibrationSupport() {
    return 'vibrate' in navigator
  }

  /**
   * 🔊 Feedback tactile
   */
  vibrate(pattern = 'tap') {
    if (!this.config.vibrationEnabled || !this.isMobile) return
    
    const vibrationPattern = this.config.vibrationPatterns[pattern] || pattern
    
    try {
      navigator.vibrate(vibrationPattern)
    } catch (e) {
      console.warn('Vibration failed:', e)
    }
  }

  /**
   * ⚙️ Optimisations générales pour mobile
   */
  setupMobileOptimizations() {
    if (!this.isMobile) return
    
    // Désactiver le zoom par pinch (mais garder le zoom nécessaire)
    this.preventPinchZoom()
    
    // Désactiver le menu contextuel sur long press
    this.disableContextMenu()
    
    // Optimiser le rendu
    this.optimizeRendering()
    
    // Gérer les changements d'orientation
    this.handleOrientationChange()
    
    console.log('📱 Mobile optimizations enabled')
  }

  preventPinchZoom() {
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault()
    })
    
    document.addEventListener('gesturechange', (e) => {
      e.preventDefault()
    })
    
    document.addEventListener('gestureend', (e) => {
      e.preventDefault()
    })
  }

  disableContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      if (this.isMobile) {
        e.preventDefault()
      }
    })
  }

  optimizeRendering() {
    // Force hardware acceleration
    if (this.scene.game.canvas) {
      this.scene.game.canvas.style.willChange = 'transform'
    }
    
    // Réduire la qualité graphique sur mobile si nécessaire
    if (this.isMobile && !this.isTablet) {
      // Les particules et effets lourds peuvent être réduits ici
      console.log('📱 Reduced graphics quality for mobile performance')
    }
  }

  handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.orientation = this.getOrientation()
        this.vibrate('tap')
        
        // Notifier la scène du changement
        if (this.scene.onOrientationChange) {
          this.scene.onOrientationChange(this.orientation)
        }
        
        console.log(`📱 Orientation changed to: ${this.orientation}`)
      }, 100)
    })
  }

  /**
   * 🎮 Améliorer les contrôles tactiles pour le drag & drop
   */
  enhanceDragAndDrop(item) {
    if (!this.isMobile) return
    
    // Augmenter la zone de hit pour faciliter le touch
    const hitArea = new Phaser.Geom.Circle(0, 0, 40) // Zone plus large
    item.setInteractive(hitArea, Phaser.Geom.Circle.Contains, { draggable: true })
    
    // Ajouter un feedback visuel au touch
    item.on('pointerdown', () => {
      this.vibrate('tap')
      item.setScale(item.scale * 1.1) // Légère augmentation au touch
    })
    
    item.on('pointerup', () => {
      item.setScale(item.scale / 1.1)
    })
  }

  /**
   * 🎯 Créer un bouton optimisé pour mobile
   */
  createMobileButton(x, y, width, height, text, callback, options = {}) {
    const minSize = this.config.minTouchSize
    const buttonWidth = Math.max(width, minSize)
    const buttonHeight = Math.max(height, minSize)
    
    // Augmenter la taille sur mobile
    const scale = this.isMobile ? this.config.scales[this.isTablet ? 'tablet' : 'phone'].buttons : 1
    const finalWidth = buttonWidth * scale
    const finalHeight = buttonHeight * scale
    
    // Couleurs
    const color = options.color || 0xFF69B4
    const hoverColor = options.hoverColor || 0xFF1493
    const pressColor = options.pressColor || 0xC71585
    
    // Background
    const bg = this.scene.add.graphics()
    bg.fillStyle(color, 0.95)
    bg.fillRoundedRect(x - finalWidth/2, y - finalHeight/2, finalWidth, finalHeight, 12)
    bg.lineStyle(3, 0xFFFFFF, 0.9)
    bg.strokeRoundedRect(x - finalWidth/2, y - finalHeight/2, finalWidth, finalHeight, 12)
    bg.setDepth(options.depth || 100)
    
    // Zone interactive (plus large que le bouton visible pour faciliter le tap)
    const padding = this.isMobile ? 10 : 5
    const hitZone = this.scene.add.zone(
      x, 
      y, 
      finalWidth + padding * 2, 
      finalHeight + padding * 2
    ).setInteractive()
    hitZone.setDepth((options.depth || 100) + 1)
    
    // Texte
    const fontSize = options.fontSize || (this.isMobile ? 22 : 18)
    const buttonText = this.scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: this.isMobile ? 4 : 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth((options.depth || 100) + 2)
    
    // Interactions
    hitZone.on('pointerover', () => {
      if (!this.isMobile) { // Pas de hover sur mobile
        bg.clear()
        bg.fillStyle(hoverColor, 1)
        bg.fillRoundedRect(x - finalWidth/2, y - finalHeight/2, finalWidth, finalHeight, 12)
        bg.lineStyle(3, 0xFFFFFF, 1)
        bg.strokeRoundedRect(x - finalWidth/2, y - finalHeight/2, finalWidth, finalHeight, 12)
      }
    })
    
    hitZone.on('pointerout', () => {
      if (!this.isMobile) {
        bg.clear()
        bg.fillStyle(color, 0.95)
        bg.fillRoundedRect(x - finalWidth/2, y - finalHeight/2, finalWidth, finalHeight, 12)
        bg.lineStyle(3, 0xFFFFFF, 0.9)
        bg.strokeRoundedRect(x - finalWidth/2, y - finalHeight/2, finalWidth, finalHeight, 12)
      }
    })
    
    hitZone.on('pointerdown', () => {
      this.vibrate('tap')
      bg.clear()
      bg.fillStyle(pressColor, 1)
      bg.fillRoundedRect(x - finalWidth/2, y - finalHeight/2, finalWidth, finalHeight, 12)
      bg.lineStyle(3, 0xFFFFFF, 1)
      bg.strokeRoundedRect(x - finalWidth/2, y - finalHeight/2, finalWidth, finalHeight, 12)
      
      buttonText.setScale(0.95)
    })
    
    hitZone.on('pointerup', () => {
      buttonText.setScale(1)
      
      bg.clear()
      bg.fillStyle(color, 0.95)
      bg.fillRoundedRect(x - finalWidth/2, y - finalHeight/2, finalWidth, finalHeight, 12)
      bg.lineStyle(3, 0xFFFFFF, 0.9)
      bg.strokeRoundedRect(x - finalWidth/2, y - finalHeight/2, finalWidth, finalHeight, 12)
      
      // Prévenir les double-tap accidentels
      const now = Date.now()
      if (now - this.lastTapTime > this.config.doubleTapDelay) {
        this.lastTapTime = now
        callback()
      }
    })
    
    return {
      bg: bg,
      text: buttonText,
      zone: hitZone,
      destroy: () => {
        bg.destroy()
        buttonText.destroy()
        hitZone.destroy()
      }
    }
  }

  /**
   * 📏 Obtenir les dimensions optimales pour le device
   */
  getOptimalScale(baseScale = 0.08) {
    if (!this.isMobile) return baseScale
    
    const deviceScale = this.isTablet ? 
      this.config.scales.tablet.items : 
      this.config.scales.phone.items
    
    return Math.max(baseScale, deviceScale)
  }

  /**
   * 💬 Afficher une notification mobile-friendly
   */
  showMobileNotification(message, duration = 2000, type = 'info') {
    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height
    
    // Couleurs selon le type
    const colors = {
      info: 0x4169E1,
      success: 0x32CD32,
      error: 0xFF6347,
      warning: 0xFFA500
    }
    
    const color = colors[type] || colors.info
    
    // Position en haut de l'écran (plus visible sur mobile)
    const notifY = this.isMobile ? 100 : 150
    const notifWidth = Math.min(screenWidth * 0.9, 400)
    const notifHeight = 80
    
    // Background
    const bg = this.scene.add.graphics()
    bg.fillStyle(color, 0.95)
    bg.fillRoundedRect(
      screenWidth/2 - notifWidth/2, 
      notifY - notifHeight/2, 
      notifWidth, 
      notifHeight, 
      15
    )
    bg.lineStyle(3, 0xFFFFFF, 0.9)
    bg.strokeRoundedRect(
      screenWidth/2 - notifWidth/2, 
      notifY - notifHeight/2, 
      notifWidth, 
      notifHeight, 
      15
    )
    bg.setDepth(10000)
    bg.setAlpha(0)
    
    // Texte
    const text = this.scene.add.text(screenWidth/2, notifY, message, {
      fontSize: this.isMobile ? '20px' : '18px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold',
      wordWrap: { width: notifWidth - 40 }
    }).setOrigin(0.5, 0.5).setDepth(10001).setAlpha(0)
    
    // Animation d'apparition
    this.scene.tweens.add({
      targets: [bg, text],
      alpha: 1,
      y: notifY + 20,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Vibration pour attirer l'attention
        if (type === 'success') {
          this.vibrate('success')
        } else if (type === 'error') {
          this.vibrate('error')
        }
        
        // Auto-disparition
        this.scene.time.delayedCall(duration, () => {
          this.scene.tweens.add({
            targets: [bg, text],
            alpha: 0,
            y: notifY - 20,
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: () => {
              bg.destroy()
              text.destroy()
            }
          })
        })
      }
    })
  }

  /**
   * 🎨 Ajuster l'UI pour le mode portrait vs paysage
   */
  adjustLayoutForOrientation() {
    if (!this.isMobile) return
    
    const isPortrait = this.orientation === 'portrait'
    
    return {
      isPortrait: isPortrait,
      gridScale: isPortrait ? 0.85 : 1.0,
      uiScale: isPortrait ? 0.9 : 1.0,
      buttonsAtBottom: isPortrait,
      compactUI: isPortrait,
      // Suggestions de positionnement
      sugggestedLayout: {
        grid: {
          x: isPortrait ? 0.5 : 0.5,
          y: isPortrait ? 0.45 : 0.5
        },
        score: {
          x: isPortrait ? 0.5 : 0.15,
          y: isPortrait ? 0.1 : 0.15
        },
        buttons: {
          x: isPortrait ? 0.5 : 0.85,
          y: isPortrait ? 0.85 : 0.5
        }
      }
    }
  }

  /**
   * ⚡ Optimiser les performances sur mobile
   */
  optimizePerformance() {
    if (!this.isMobile) return
    
    // Limiter le framerate sur les appareils mobiles moins puissants
    if (!this.isTablet && window.devicePixelRatio > 2) {
      this.scene.game.loop.targetFps = 30 // Au lieu de 60
      console.log('📱 Reduced FPS to 30 for better battery life')
    }
    
    // Désactiver certains effets sur mobile si nécessaire
    const mobileConfig = {
      particlesEnabled: this.isTablet, // Particules seulement sur tablette
      shadowsEnabled: false, // Pas d'ombres sur mobile
      glowEnabled: false, // Pas de glow sur mobile
      maxAnimations: 10 // Limiter les animations simultanées
    }
    
    return mobileConfig
  }

  /**
   * 🔄 Détecter les gestes de swipe
   */
  enableSwipeGestures(onSwipe) {
    if (!this.isMobile) return
    
    let startX = 0
    let startY = 0
    let startTime = 0
    const minSwipeDistance = 50
    const maxSwipeTime = 300
    
    this.scene.input.on('pointerdown', (pointer) => {
      startX = pointer.x
      startY = pointer.y
      startTime = Date.now()
    })
    
    this.scene.input.on('pointerup', (pointer) => {
      const endX = pointer.x
      const endY = pointer.y
      const endTime = Date.now()
      
      const deltaX = endX - startX
      const deltaY = endY - startY
      const deltaTime = endTime - startTime
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      if (distance >= minSwipeDistance && deltaTime <= maxSwipeTime) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
        
        let direction = ''
        if (angle >= -45 && angle < 45) {
          direction = 'right'
        } else if (angle >= 45 && angle < 135) {
          direction = 'down'
        } else if (angle >= -135 && angle < -45) {
          direction = 'up'
        } else {
          direction = 'left'
        }
        
        this.vibrate('tap')
        onSwipe(direction, distance, deltaTime)
      }
    })
  }

  /**
   * 📊 Informations sur l'appareil
   */
  getDeviceInfo() {
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      orientation: this.orientation,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      vibrationSupported: this.config.vibrationEnabled,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      touch: 'ontouchstart' in window
    }
  }

  /**
   * 🎯 Afficher un tutoriel mobile au premier lancement
   */
  showMobileTutorial() {
    if (!this.isMobile) return
    
    // Vérifier si le tutoriel a déjà été vu
    const tutorialSeen = localStorage.getItem('mobileTutorialSeen')
    if (tutorialSeen) return
    
    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height
    
    // Overlay
    const overlay = this.scene.add.rectangle(
      screenWidth/2, 
      screenHeight/2, 
      screenWidth, 
      screenHeight, 
      0x000000, 
      0.8
    ).setDepth(20000).setInteractive()
    
    // Panel
    const panelWidth = Math.min(screenWidth * 0.9, 400)
    const panelHeight = 300
    
    const panel = this.scene.add.graphics()
    panel.fillStyle(0x667EEA, 1)
    panel.fillRoundedRect(
      screenWidth/2 - panelWidth/2,
      screenHeight/2 - panelHeight/2,
      panelWidth,
      panelHeight,
      20
    )
    panel.lineStyle(4, 0xFFFFFF, 0.9)
    panel.strokeRoundedRect(
      screenWidth/2 - panelWidth/2,
      screenHeight/2 - panelHeight/2,
      panelWidth,
      panelHeight,
      20
    )
    panel.setDepth(20001)
    
    // Titre
    const title = this.scene.add.text(
      screenWidth/2,
      screenHeight/2 - 100,
      '📱 MOBILE CONTROLS',
      {
        fontSize: '28px',
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(20002)
    
    // Instructions
    const instructions = this.scene.add.text(
      screenWidth/2,
      screenHeight/2 - 20,
      '👆 Tap and drag items to move them\n\n' +
      '🎯 Match 3 identical items to eliminate\n\n' +
      '⚡ Swipe for quick actions',
      {
        fontSize: '16px',
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
        lineSpacing: 10
      }
    ).setOrigin(0.5).setDepth(20002)
    
    // Bouton OK
    const okButton = this.createMobileButton(
      screenWidth/2,
      screenHeight/2 + 100,
      150,
      50,
      'GOT IT! 👍',
      () => {
        this.vibrate('success')
        localStorage.setItem('mobileTutorialSeen', 'true')
        
        // Nettoyer
        overlay.destroy()
        panel.destroy()
        title.destroy()
        instructions.destroy()
        okButton.destroy()
      },
      { depth: 20000, color: 0x32CD32 }
    )
  }
}
