import Phaser from 'phaser'
import { GAME_CONSTANTS } from './Constants.js'

export class UIManager {
  constructor(scene) {
    this.scene = scene
    this.animations = new Map()
    this.feedbackQueue = []
    this.isProcessingFeedback = false

    this.initializeUIEnhancements()
  }

  /**
   * 🎨 Initialisation des améliorations UI/UX
   */
  initializeUIEnhancements() {
    // Améliorer les animations de base
    this.enhanceBaseAnimations()

    // Système de feedback visuel
    this.setupVisualFeedback()

    // Animations de micro-interactions
    this.setupMicroInteractions()

    console.log('🎨 UI/UX enhancements initialized')
  }

  /**
   * ✨ Améliorer les animations de base
   */
  enhanceBaseAnimations() {
    // Configuration des easings améliorés
    this.customEasings = {
      bounceIn: 'Back.easeOut.config(1.7)',
      elasticOut: 'Elastic.easeOut.config(1, 0.3)',
      smooth: 'Sine.easeInOut',
      snappy: 'Back.easeOut.config(2)',
      gentle: 'Power2.easeOut'
    }

    // Durées d'animation optimisées
    this.animationDurations = {
      instant: 100,
      quick: 200,
      normal: 300,
      slow: 500,
      dramatic: 800
    }
  }

  /**
   * 👁️ Système de feedback visuel
   */
  setupVisualFeedback() {
    this.feedbackTypes = {
      success: {
        color: 0x32CD32,
        icon: '✅',
        sound: 'level_complete',
        animation: 'bounce'
      },
      error: {
        color: 0xFF6347,
        icon: '❌',
        sound: 'game_over',
        animation: 'shake'
      },
      warning: {
        color: 0xFFA500,
        icon: '⚠️',
        sound: 'ui_click',
        animation: 'pulse'
      },
      info: {
        color: 0x4169E1,
        icon: 'ℹ️',
        sound: null,
        animation: 'fade'
      },
      achievement: {
        color: 0xFFD700,
        icon: '🏆',
        sound: 'level_complete',
        animation: 'celebration'
      }
    }
  }

  /**
   * 🎯 Animations de micro-interactions
   */
  setupMicroInteractions() {
    // Hover effects améliorés
    this.hoverEffects = {
      scale: { x: 1.05, y: 1.05 },
      glow: { alpha: 0.8, tint: 0xFFFFAA },
      lift: { y: -2 }
    }

    // Click feedback
    this.clickEffects = {
      scale: { x: 0.95, y: 0.95 },
      press: { y: 1 },
      ripple: true
    }
  }

  /**
   * 🎬 Animation améliorée pour les boutons
   */
  animateButtonInteraction(button, type = 'hover') {
    const config = this.getAnimationConfig(type)

    if (type === 'hover') {
      this.scene.tweens.add({
        targets: button,
        scaleX: config.scale.x,
        scaleY: config.scale.y,
        duration: this.animationDurations.quick,
        ease: this.customEasings.snappy,
        onComplete: () => {
          if (config.glow) {
            button.setTint(config.glow.tint)
            button.glowEffect = config.glow
          }
        }
      })
    } else if (type === 'click') {
      // Feedback de clic
      this.scene.tweens.add({
        targets: button,
        scaleX: config.scale.x,
        scaleY: config.scale.y,
        y: button.y + (config.press?.y || 0),
        duration: this.animationDurations.instant,
        ease: this.customEasings.gentle,
        yoyo: true,
        onComplete: () => {
          // Créer un effet de ripple si activé
          if (config.ripple) {
            this.createRippleEffect(button.x, button.y)
          }
        }
      })
    } else if (type === 'unhover') {
      this.scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        y: button.y - (this.hoverEffects.lift?.y || 0),
        duration: this.animationDurations.quick,
        ease: this.customEasings.smooth,
        onComplete: () => {
          button.clearTint()
          if (button.glowEffect) {
            button.glowEffect = null
          }
        }
      })
    }
  }

  /**
   * 💫 Effet de ripple (vague)
   */
  createRippleEffect(x, y, color = 0xFFFFFF) {
    const ripple = this.scene.add.graphics()
    ripple.setPosition(x, y)
    ripple.lineStyle(2, color, 0.8)
    ripple.strokeCircle(0, 0, 20)
    ripple.setDepth(GAME_CONSTANTS.DEPTH_OVERLAY)

    this.scene.tweens.add({
      targets: ripple,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => ripple.destroy()
    })
  }

  /**
   * 🎨 Animation d'entrée élégante pour les éléments UI
   */
  animateUIEntrance(element, delay = 0, type = 'slideUp') {
    const startProps = this.getEntranceStartProps(element, type)

    // Position de départ
    element.setAlpha(0)
    Object.assign(element, startProps)

    this.scene.tweens.add({
      targets: element,
      alpha: 1,
      x: element.originalX || element.x,
      y: element.originalY || element.y,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      duration: this.animationDurations.normal,
      delay: delay,
      ease: this.customEasings.bounceIn
    })
  }

  /**
   * 📱 Animation de sortie élégante
   */
  animateUIExit(element, type = 'fade', onComplete = null) {
    const endProps = this.getExitEndProps(element, type)

    this.scene.tweens.add({
      targets: element,
      ...endProps,
      duration: this.animationDurations.normal,
      ease: this.customEasings.smooth,
      onComplete: () => {
        if (onComplete) onComplete()
        element.destroy()
      }
    })
  }

  /**
   * 🎯 Feedback visuel contextuel
   */
  showContextualFeedback(type, message, position = null, duration = 2000) {
    this.feedbackQueue.push({ type, message, position, duration })

    if (!this.isProcessingFeedback) {
      this.processFeedbackQueue()
    }
  }

  /**
   * 🔄 Traiter la file d'attente des feedbacks
   */
  processFeedbackQueue() {
    if (this.feedbackQueue.length === 0) {
      this.isProcessingFeedback = false
      return
    }

    this.isProcessingFeedback = true
    const feedback = this.feedbackQueue.shift()

    this.createFeedbackNotification(feedback, () => {
      // Traiter le feedback suivant après un petit délai
      this.scene.time.delayedCall(200, () => {
        this.processFeedbackQueue()
      })
    })
  }

  /**
   * 🔔 Créer une notification de feedback
   */
  createFeedbackNotification(feedback, onComplete) {
    const { type, message, position, duration } = feedback
    const config = this.feedbackTypes[type]

    if (!config) {
      console.warn(`Unknown feedback type: ${type}`)
      onComplete()
      return
    }

    // Position par défaut (centre haut)
    const x = position?.x || this.scene.cameras.main.width / 2
    const y = position?.y || 100

    // Background
    const bg = this.scene.add.graphics()
    bg.fillStyle(config.color, 0.9)
    bg.fillRoundedRect(x - 150, y - 25, 300, 50, 25)
    bg.setDepth(GAME_CONSTANTS.DEPTH_OVERLAY)

    // Icône
    const icon = this.scene.add.text(x - 120, y, config.icon, {
      fontSize: '24px'
    }).setDepth(GAME_CONSTANTS.DEPTH_OVERLAY + 1)

    // Texte
    const text = this.scene.add.text(x - 80, y, message, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0, 0.5).setDepth(GAME_CONSTANTS.DEPTH_OVERLAY + 1)

    // Animation d'entrée
    bg.setScale(0)
    icon.setScale(0)
    text.setScale(0)

    this.scene.tweens.add({
      targets: [bg, icon, text],
      scaleX: 1,
      scaleY: 1,
      duration: this.animationDurations.quick,
      ease: this.customEasings.elasticOut,
      onComplete: () => {
        // Jouer le son
        if (config.sound && this.scene.audio) {
          this.scene.audio.playSound(config.sound)
        }

        // Animation spéciale selon le type
        this.playFeedbackAnimation([bg, icon, text], config.animation)

        // Auto-disparition
        this.scene.time.delayedCall(duration, () => {
          this.animateUIExit(bg, 'fade')
          this.animateUIExit(icon, 'fade')
          this.animateUIExit(text, 'fade', onComplete)
        })
      }
    })
  }

  /**
   * 🎪 Jouer l'animation spécifique au feedback
   */
  playFeedbackAnimation(targets, animationType) {
    switch (animationType) {
      case 'bounce':
        this.scene.tweens.add({
          targets: targets,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 300,
          ease: 'Power2',
          yoyo: true,
          repeat: 2
        })
        break

      case 'shake':
        this.scene.tweens.add({
          targets: targets,
          x: '+=5',
          duration: 50,
          ease: 'Power2',
          yoyo: true,
          repeat: 6
        })
        break

      case 'pulse':
        this.scene.tweens.add({
          targets: targets,
          alpha: 0.7,
          duration: 400,
          ease: 'Power2',
          yoyo: true,
          repeat: 3
        })
        break

      case 'celebration':
        // Particules dorées
        for (let i = 0; i < 10; i++) {
          const particle = this.scene.add.text(
            targets[0].x + (Math.random() - 0.5) * 200,
            targets[0].y,
            '⭐',
            { fontSize: '20px', color: '#FFD700' }
          ).setDepth(GAME_CONSTANTS.DEPTH_OVERLAY + 2)

          this.scene.tweens.add({
            targets: particle,
            y: particle.y - 50,
            alpha: 0,
            rotation: Math.PI * 2,
            duration: 1000,
            delay: i * 100,
            onComplete: () => particle.destroy()
          })
        }
        break
    }
  }

  /**
   * 🎮 Indicateur de progression animé
   */
  createProgressIndicator(x, y, width, height, color = 0x00FF00) {
    const bg = this.scene.add.graphics()
    bg.fillStyle(0x333333, 0.8)
    bg.fillRoundedRect(x, y, width, height, height / 2)
    bg.setDepth(GAME_CONSTANTS.DEPTH_UI)

    const fill = this.scene.add.graphics()
    fill.fillStyle(color, 1)
    fill.setDepth(GAME_CONSTANTS.DEPTH_UI + 1)

    const indicator = {
      setProgress: (progress) => {
        fill.clear()
        fill.fillStyle(color, 1)
        fill.fillRoundedRect(x + 2, y + 2, (width - 4) * progress, height - 4, (height - 4) / 2)

        // Animation de remplissage fluide
        this.scene.tweens.add({
          targets: fill,
          alpha: 0.8,
          duration: 200,
          yoyo: true,
          repeat: 1
        })
      },

      setColor: (newColor) => {
        color = newColor
      },

      destroy: () => {
        bg.destroy()
        fill.destroy()
      }
    }

    return indicator
  }

  /**
   * 💫 Effet de particules pour les succès
   */
  createParticleEffect(x, y, type = 'sparkle', count = 20) {
    const particles = []

    for (let i = 0; i < count; i++) {
      let particle

      switch (type) {
        case 'sparkle':
          particle = this.scene.add.text(x, y, '✨', {
            fontSize: '16px',
            color: '#FFD700'
          })
          break

        case 'heart':
          particle = this.scene.add.text(x, y, '💖', {
            fontSize: '14px',
            color: '#FF69B4'
          })
          break

        case 'star':
          particle = this.scene.add.text(x, y, '⭐', {
            fontSize: '18px',
            color: '#FFFF00'
          })
          break

        default:
          particle = this.scene.add.graphics()
          particle.fillStyle(0xFFFFFF, 1)
          particle.fillCircle(0, 0, 2)
      }

      particle.setDepth(GAME_CONSTANTS.DEPTH_OVERLAY + 1)
      particles.push(particle)

      // Animation
      const angle = (i / count) * Math.PI * 2
      const distance = 50 + Math.random() * 50
      const duration = 800 + Math.random() * 400

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: Math.random() * 0.5 + 0.5,
        rotation: Math.random() * Math.PI * 2,
        duration: duration,
        delay: Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      })
    }

    return particles
  }

  /**
   * 🎨 Thème dynamique selon le contexte
   */
  applyDynamicTheme(context) {
    const themes = {
      victory: {
        primary: 0xFFD700,
        secondary: 0xFFA500,
        accent: 0xFF6347
      },
      defeat: {
        primary: 0x8B0000,
        secondary: 0xDC143C,
        accent: 0xFF6347
      },
      neutral: {
        primary: 0x4169E1,
        secondary: 0x6495ED,
        accent: 0x87CEEB
      }
    }

    const theme = themes[context] || themes.neutral

    // Appliquer le thème aux éléments UI existants
    if (this.scene.ui) {
      // Modifier les couleurs des barres de progression, boutons, etc.
      this.updateUITheme(theme)
    }

    return theme
  }

  /**
   * 🎭 Mise à jour du thème UI
   */
  updateUITheme(theme) {
    // Cette méthode serait étendue pour mettre à jour tous les éléments UI
    // Pour l'instant, c'est un placeholder pour la structure
    console.log('🎨 Applying theme:', theme)
  }

  /**
   * 🛠️ Utilitaires d'animation
   */
  getAnimationConfig(type) {
    const configs = {
      hover: this.hoverEffects,
      click: this.clickEffects,
      entrance: { alpha: 0, scale: 0 },
      exit: { alpha: 0, scale: 0.8 }
    }
    return configs[type] || {}
  }

  getEntranceStartProps(element, type) {
    const props = {
      slideUp: { y: element.y + 50 },
      slideDown: { y: element.y - 50 },
      slideLeft: { x: element.x + 50 },
      slideRight: { x: element.x - 50 },
      scale: { scaleX: 0, scaleY: 0 },
      fade: { alpha: 0 },
      rotate: { rotation: Math.PI / 4, scaleX: 0, scaleY: 0 }
    }
    return props[type] || { alpha: 0 }
  }

  getExitEndProps(element, type) {
    const props = {
      fade: { alpha: 0 },
      slideUp: { y: element.y - 50, alpha: 0 },
      slideDown: { y: element.y + 50, alpha: 0 },
      scale: { scaleX: 0, scaleY: 0, alpha: 0 },
      rotate: { rotation: -Math.PI / 4, scaleX: 0, scaleY: 0, alpha: 0 }
    }
    return props[type] || { alpha: 0 }
  }

  /**
   * 🧹 Nettoyer les ressources
   */
  destroy() {
    this.animations.clear()
    this.feedbackQueue = []

    // Supprimer tous les effets visuels restants
    this.scene.children.each(child => {
      if (child.uiEffect) {
        child.destroy()
      }
    })
  }
}