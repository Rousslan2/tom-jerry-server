/**
 * ♿ Accessibility Module
 * Améliorations d'accessibilité pour le jeu Tom & Jerry
 *
 * Fonctionnalités :
 * - Navigation clavier
 * - Support lecteur d'écran
 * - Contraste élevé
 * - Réduction du mouvement
 * - Tailles de texte ajustables
 * - Indicateurs visuels pour les interactions
 */

export class Accessibility {
  constructor(scene) {
    this.scene = scene
    this.isEnabled = this.checkAccessibilitySupport()
    this.settings = this.loadAccessibilitySettings()

    if (this.isEnabled) {
      this.setupAccessibility()
    }
  }

  /**
   * 🔍 Vérifier le support d'accessibilité
   */
  checkAccessibilitySupport() {
    // Vérifier si l'utilisateur a activé des préférences d'accessibilité
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    const prefersLargeText = window.matchMedia('(prefers-reduced-transparency: reduce)').matches

    return prefersReducedMotion || prefersHighContrast || prefersLargeText
  }

  /**
   * ⚙️ Charger les paramètres d'accessibilité
   */
  loadAccessibilitySettings() {
    const defaultSettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      audioCues: true,
      visualIndicators: true
    }

    // Charger depuis localStorage
    const saved = localStorage.getItem('accessibilitySettings')
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  }

  /**
   * 💾 Sauvegarder les paramètres
   */
  saveAccessibilitySettings() {
    localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings))
  }

  /**
   * 🔧 Configuration générale d'accessibilité
   */
  setupAccessibility() {
    if (this.settings.reducedMotion) {
      this.disableAnimations()
    }

    if (this.settings.highContrast) {
      this.enableHighContrast()
    }

    if (this.settings.largeText) {
      this.enableLargeText()
    }

    if (this.settings.keyboardNavigation) {
      this.enableKeyboardNavigation()
    }

    if (this.settings.screenReader) {
      this.enableScreenReaderSupport()
    }

    console.log('♿ Accessibility features enabled')
  }

  /**
   * 🎯 Désactiver les animations pour reduced motion
   */
  disableAnimations() {
    // Ajouter une classe CSS pour désactiver les animations
    document.body.classList.add('reduced-motion')

    // Désactiver les tweens de Phaser si nécessaire
    this.scene.tweens.pauseAll()
  }

  /**
   * 🌓 Activer le contraste élevé
   */
  enableHighContrast() {
    document.body.classList.add('high-contrast')

    // Modifier les couleurs du jeu
    this.scene.cameras.main.setBackgroundColor('#000000')

    // Ajuster les couleurs des éléments UI
    if (this.scene.children) {
      this.scene.children.each(child => {
        if (child.type === 'Text') {
          child.setColor('#FFFFFF')
          child.setStroke('#000000', 2)
        }
      })
    }
  }

  /**
   * 📝 Activer le texte agrandi
   */
  enableLargeText() {
    document.body.classList.add('large-text')

    // Augmenter la taille des polices dans le jeu
    if (this.scene.children) {
      this.scene.children.each(child => {
        if (child.type === 'Text' && child.style) {
          const currentSize = parseInt(child.style.fontSize)
          child.setFontSize(currentSize * 1.5)
        }
      })
    }
  }

  /**
   * ⌨️ Activer la navigation clavier
   */
  enableKeyboardNavigation() {
    this.focusableElements = []
    this.currentFocusIndex = 0

    // Ajouter les gestionnaires d'événements clavier
    this.scene.input.keyboard.on('keydown-TAB', this.handleTabNavigation, this)
    this.scene.input.keyboard.on('keydown-SPACE', this.handleSpaceActivation, this)
    this.scene.input.keyboard.on('keydown-ENTER', this.handleEnterActivation, this)
    this.scene.input.keyboard.on('keydown-ARROW_KEYS', this.handleArrowNavigation, this)

    // Identifier les éléments focusables
    this.findFocusableElements()
  }

  /**
   * 🔍 Identifier les éléments focusables
   */
  findFocusableElements() {
    this.focusableElements = []

    // Boutons, éléments interactifs, etc.
    this.scene.children.each(child => {
      if (child.input && child.input.enabled) {
        this.focusableElements.push(child)
        child.accessible = true
        child.tabIndex = this.focusableElements.length - 1
      }
    })

    // Ajouter des indicateurs visuels pour les éléments focusés
    this.focusableElements.forEach((element, index) => {
      element.focusIndicator = this.scene.add.graphics()
      element.focusIndicator.lineStyle(3, 0xFFFF00, 1)
      element.focusIndicator.strokeRect(
        element.x - element.width/2 - 5,
        element.y - element.height/2 - 5,
        element.width + 10,
        element.height + 10
      )
      element.focusIndicator.setVisible(false)
      element.focusIndicator.setDepth(1000)
    })
  }

  /**
   * ⇥ Gestion de la navigation par tabulation
   */
  handleTabNavigation(event) {
    event.preventDefault()

    // Masquer l'indicateur de focus actuel
    if (this.focusableElements[this.currentFocusIndex]) {
      this.focusableElements[this.currentFocusIndex].focusIndicator.setVisible(false)
    }

    // Passer à l'élément suivant
    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length

    // Afficher l'indicateur de focus
    if (this.focusableElements[this.currentFocusIndex]) {
      this.focusableElements[this.currentFocusIndex].focusIndicator.setVisible(true)

      // Annoncer l'élément pour les lecteurs d'écran
      this.announceToScreenReader(`Focused: ${this.focusableElements[this.currentFocusIndex].name || 'Interactive element'}`)
    }
  }

  /**
   * 🎯 Gestion de l'activation par espace
   */
  handleSpaceActivation(event) {
    event.preventDefault()

    const focusedElement = this.focusableElements[this.currentFocusIndex]
    if (focusedElement && focusedElement.emit) {
      focusedElement.emit('pointerdown')
      focusedElement.emit('pointerup')
    }
  }

  /**
   * 🚀 Gestion de l'activation par entrée
   */
  handleEnterActivation(event) {
    event.preventDefault()
    this.handleSpaceActivation(event)
  }

  /**
   * ➡️ Gestion de la navigation par flèches
   */
  handleArrowNavigation(event) {
    // Navigation dans les grilles ou menus
    const focusedElement = this.focusableElements[this.currentFocusIndex]
    if (focusedElement && focusedElement.gridNavigation) {
      // Logique de navigation dans la grille
      this.navigateGrid(event)
    }
  }

  /**
   * 🔲 Navigation dans la grille de jeu
   */
  navigateGrid(event) {
    const directions = {
      'UP': { row: -1, col: 0 },
      'DOWN': { row: 1, col: 0 },
      'LEFT': { row: 0, col: -1 },
      'RIGHT': { row: 0, col: 1 }
    }

    const key = event.key.toUpperCase()
    if (directions[key]) {
      const focusedElement = this.focusableElements[this.currentFocusIndex]
      if (focusedElement.gridRow !== undefined && focusedElement.gridCol !== undefined) {
        const newRow = focusedElement.gridRow + directions[key].row
        const newCol = focusedElement.gridCol + directions[key].col

        // Vérifier les limites de la grille
        if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 4) {
          // Trouver l'élément à cette position
          const targetElement = this.findElementAtGridPosition(newRow, newCol)
          if (targetElement) {
            this.setFocusToElement(targetElement)
          }
        }
      }
    }
  }

  /**
   * 🎯 Trouver un élément à une position de grille donnée
   */
  findElementAtGridPosition(row, col) {
    return this.focusableElements.find(element =>
      element.gridRow === row && element.gridCol === col
    )
  }

  /**
   * 🎯 Définir le focus sur un élément spécifique
   */
  setFocusToElement(element) {
    // Masquer l'indicateur actuel
    if (this.focusableElements[this.currentFocusIndex]) {
      this.focusableElements[this.currentFocusIndex].focusIndicator.setVisible(false)
    }

    // Trouver l'index du nouvel élément
    const newIndex = this.focusableElements.indexOf(element)
    if (newIndex !== -1) {
      this.currentFocusIndex = newIndex
      element.focusIndicator.setVisible(true)
      this.announceToScreenReader(`Focused: ${element.name || 'Grid item at row ${element.gridRow + 1}, column ${element.gridCol + 1}'}`)
    }
  }

  /**
   * 🗣️ Support lecteur d'écran
   */
  enableScreenReaderSupport() {
    // Créer une région ARIA live pour les annonces
    this.liveRegion = document.createElement('div')
    this.liveRegion.setAttribute('aria-live', 'polite')
    this.liveRegion.setAttribute('aria-atomic', 'true')
    this.liveRegion.style.position = 'absolute'
    this.liveRegion.style.left = '-10000px'
    this.liveRegion.style.width = '1px'
    this.liveRegion.style.height = '1px'
    this.liveRegion.style.overflow = 'hidden'
    document.body.appendChild(this.liveRegion)

    // Ajouter des labels ARIA aux éléments interactifs
    this.addAriaLabels()
  }

  /**
   * 🏷️ Ajouter des labels ARIA
   */
  addAriaLabels() {
    this.scene.children.each(child => {
      if (child.input && child.input.enabled) {
        // Déterminer le type d'élément et ajouter un label approprié
        if (child.itemType) {
          child.setAttribute('aria-label', `${child.itemType} item`)
          child.setAttribute('role', 'button')
        } else if (child.name && child.name.includes('button')) {
          child.setAttribute('aria-label', child.name)
          child.setAttribute('role', 'button')
        }
      }
    })
  }

  /**
   * 📢 Annoncer aux lecteurs d'écran
   */
  announceToScreenReader(message) {
    if (this.liveRegion && this.settings.screenReader) {
      this.liveRegion.textContent = message

      // Effacer après un court délai
      setTimeout(() => {
        this.liveRegion.textContent = ''
      }, 1000)
    }
  }

  /**
   * 🔊 Indices audio pour l'accessibilité
   */
  playAudioCue(type) {
    if (!this.settings.audioCues) return

    const cues = {
      'focus': 'ui_click',
      'select': 'item_pickup',
      'error': 'game_over',
      'success': 'level_complete',
      'navigation': 'item_drop'
    }

    const soundKey = cues[type]
    if (soundKey && this.scene.sound) {
      this.scene.sound.play(soundKey, { volume: 0.3 })
    }
  }

  /**
   * 👁️ Indicateurs visuels pour l'accessibilité
   */
  addVisualIndicators() {
    if (!this.settings.visualIndicators) return

    // Ajouter des indicateurs visuels pour les interactions
    this.scene.children.each(child => {
      if (child.input && child.input.enabled) {
        // Ajouter un halo subtil autour des éléments interactifs
        const indicator = this.scene.add.graphics()
        indicator.lineStyle(2, 0xFFFFFF, 0.5)
        indicator.strokeCircle(child.x, child.y, Math.max(child.width, child.height) / 2 + 5)
        indicator.setDepth(child.depth - 1)
        child.accessibilityIndicator = indicator
      }
    })
  }

  /**
   * ⚙️ Interface de paramètres d'accessibilité
   */
  showAccessibilitySettings() {
    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height

    // Overlay
    const overlay = this.scene.add.rectangle(
      screenWidth/2, screenHeight/2, screenWidth, screenHeight, 0x000000, 0.8
    ).setDepth(10000).setInteractive()

    // Panel
    const panel = this.scene.add.graphics()
    panel.fillStyle(0x4A90E2, 1)
    panel.fillRoundedRect(screenWidth/2 - 300, screenHeight/2 - 200, 600, 400, 20)
    panel.setDepth(10001)

    // Titre
    const title = this.scene.add.text(screenWidth/2, screenHeight/2 - 160, '♿ ACCESSIBILITY SETTINGS', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5).setDepth(10002)

    // Options
    const options = [
      { key: 'highContrast', label: 'High Contrast Mode', y: screenHeight/2 - 100 },
      { key: 'largeText', label: 'Large Text', y: screenHeight/2 - 50 },
      { key: 'reducedMotion', label: 'Reduced Motion', y: screenHeight/2 },
      { key: 'screenReader', label: 'Screen Reader Support', y: screenHeight/2 + 50 },
      { key: 'keyboardNavigation', label: 'Keyboard Navigation', y: screenHeight/2 + 100 }
    ]

    const checkboxes = []

    options.forEach(option => {
      // Label
      const label = this.scene.add.text(screenWidth/2 - 100, option.y, option.label, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#FFFFFF'
      }).setOrigin(0, 0.5).setDepth(10002)

      // Checkbox
      const checkbox = this.createAccessibilityCheckbox(
        screenWidth/2 + 150, option.y, this.settings[option.key], (checked) => {
          this.settings[option.key] = checked
          this.applySettingChange(option.key, checked)
        }
      )
      checkbox.setDepth(10002)
      checkboxes.push(checkbox)
    })

    // Bouton Close
    const closeButton = this.scene.add.text(screenWidth/2, screenHeight/2 + 160, 'CLOSE', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#FF6B6B',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive().setDepth(10002)

    closeButton.on('pointerdown', () => {
      this.saveAccessibilitySettings()
      overlay.destroy()
      panel.destroy()
      title.destroy()
      options.forEach(() => {}) // Cleanup
      checkboxes.forEach(cb => cb.destroy())
      closeButton.destroy()
    })
  }

  /**
   * ☑️ Créer une checkbox d'accessibilité
   */
  createAccessibilityCheckbox(x, y, checked, callback) {
    const checkbox = this.scene.add.graphics()
    checkbox.lineStyle(2, 0xFFFFFF, 1)
    checkbox.strokeRect(x - 10, y - 10, 20, 20)
    checkbox.setInteractive(new Phaser.Geom.Rectangle(x - 10, y - 10, 20, 20), Phaser.Geom.Rectangle.Contains)

    if (checked) {
      checkbox.fillStyle(0xFFFFFF, 1)
      checkbox.fillRect(x - 8, y - 8, 16, 16)
    }

    checkbox.on('pointerdown', () => {
      const newChecked = !checked
      checkbox.clear()

      checkbox.lineStyle(2, 0xFFFFFF, 1)
      checkbox.strokeRect(x - 10, y - 10, 20, 20)

      if (newChecked) {
        checkbox.fillStyle(0xFFFFFF, 1)
        checkbox.fillRect(x - 8, y - 8, 16, 16)
      }

      callback(newChecked)
    })

    return checkbox
  }

  /**
   * 🔄 Appliquer un changement de paramètre
   */
  applySettingChange(setting, value) {
    switch (setting) {
      case 'highContrast':
        value ? this.enableHighContrast() : this.disableHighContrast()
        break
      case 'largeText':
        value ? this.enableLargeText() : this.disableLargeText()
        break
      case 'reducedMotion':
        value ? this.disableAnimations() : this.enableAnimations()
        break
      case 'screenReader':
        value ? this.enableScreenReaderSupport() : this.disableScreenReaderSupport()
        break
      case 'keyboardNavigation':
        value ? this.enableKeyboardNavigation() : this.disableKeyboardNavigation()
        break
    }
  }

  /**
   * 🚫 Désactiver les fonctionnalités (pour les méthodes inverses)
   */
  disableHighContrast() {
    document.body.classList.remove('high-contrast')
    // Recharger les couleurs normales
    this.scene.cameras.main.setBackgroundColor('#808080')
  }

  disableLargeText() {
    document.body.classList.remove('large-text')
    // Recharger les tailles de police normales
  }

  enableAnimations() {
    document.body.classList.remove('reduced-motion')
    this.scene.tweens.resumeAll()
  }

  disableScreenReaderSupport() {
    if (this.liveRegion) {
      document.body.removeChild(this.liveRegion)
      this.liveRegion = null
    }
  }

  disableKeyboardNavigation() {
    this.scene.input.keyboard.off('keydown-TAB', this.handleTabNavigation, this)
    this.scene.input.keyboard.off('keydown-SPACE', this.handleSpaceActivation, this)
    this.scene.input.keyboard.off('keydown-ENTER', this.handleEnterActivation, this)
    this.scene.input.keyboard.off('keydown-ARROW_KEYS', this.handleArrowNavigation, this)

    // Masquer tous les indicateurs de focus
    this.focusableElements.forEach(element => {
      if (element.focusIndicator) {
        element.focusIndicator.setVisible(false)
      }
    })
  }

  /**
   * 📊 Obtenir les informations d'accessibilité
   */
  getAccessibilityInfo() {
    return {
      enabled: this.isEnabled,
      settings: this.settings,
      focusableElementsCount: this.focusableElements ? this.focusableElements.length : 0,
      currentFocusIndex: this.currentFocusIndex
    }
  }

  /**
   * 🧹 Nettoyer les ressources
   */
  destroy() {
    this.disableKeyboardNavigation()
    this.disableScreenReaderSupport()

    if (this.liveRegion) {
      document.body.removeChild(this.liveRegion)
    }

    // Supprimer les indicateurs visuels
    this.scene.children.each(child => {
      if (child.accessibilityIndicator) {
        child.accessibilityIndicator.destroy()
      }
      if (child.focusIndicator) {
        child.focusIndicator.destroy()
      }
    })
  }
}