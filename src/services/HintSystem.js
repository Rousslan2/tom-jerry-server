/**
 * 💡 Hint System
 * Système d'indices pour aider les joueurs bloqués
 */

export class HintSystem {
  constructor(scene) {
    this.scene = scene
    this.hintsRemaining = 3 // 3 hints gratuits par partie
    this.lastHintTime = 0
    this.hintCooldown = 5000 // 5 secondes entre chaque hint
    
    // UI
    this.hintButton = null
    this.hintCountText = null
    
    // Animation
    this.currentHintAnimation = null
  }
  
  /**
   * Créer le bouton de hint dans l'UI
   */
  createHintButton(x, y) {
    const buttonWidth = 120
    const buttonHeight = 50
    
    // Background
    this.hintButton = this.scene.add.graphics()
    this.hintButton.fillStyle(0x4169E1, 0.95)
    this.hintButton.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
    this.hintButton.lineStyle(3, 0xFFD700, 0.9)
    this.hintButton.strokeRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
    this.hintButton.setDepth(1000)
    
    // Icône + Texte
    const icon = this.scene.add.text(x - 30, y, '💡', {
      fontSize: '28px'
    }).setOrigin(0.5).setDepth(1001)
    
    this.hintCountText = this.scene.add.text(x + 20, y, `${this.hintsRemaining}`, {
      fontSize: '24px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1001)
    
    // Zone interactive
    const hitZone = this.scene.add.zone(x, y, buttonWidth, buttonHeight)
      .setInteractive()
      .setDepth(1002)
    
    // Events
    hitZone.on('pointerover', () => {
      if (this.canUseHint()) {
        this.hintButton.clear()
        this.hintButton.fillStyle(0x5179F1, 1)
        this.hintButton.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
        this.hintButton.lineStyle(3, 0xFFD700, 1)
        this.hintButton.strokeRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
      }
    })
    
    hitZone.on('pointerout', () => {
      this.updateButtonStyle(x, y, buttonWidth, buttonHeight)
    })
    
    hitZone.on('pointerup', () => {
      this.useHint()
    })
    
    return { button: this.hintButton, icon, text: this.hintCountText, zone: hitZone }
  }
  
  /**
   * Mettre à jour le style du bouton
   */
  updateButtonStyle(x, y, buttonWidth, buttonHeight) {
    const canUse = this.canUseHint()
    
    this.hintButton.clear()
    this.hintButton.fillStyle(canUse ? 0x4169E1 : 0x808080, 0.95)
    this.hintButton.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
    this.hintButton.lineStyle(3, canUse ? 0xFFD700 : 0x666666, 0.9)
    this.hintButton.strokeRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 12)
  }
  
  /**
   * Vérifier si on peut utiliser un hint
   */
  canUseHint() {
    const now = Date.now()
    const cooldownOk = (now - this.lastHintTime) >= this.hintCooldown
    return this.hintsRemaining > 0 && cooldownOk && !this.scene.gameOver && !this.scene.levelComplete
  }
  
  /**
   * Utiliser un hint
   */
  useHint() {
    if (!this.canUseHint()) {
      if (this.hintsRemaining <= 0) {
        this.showMessage('❌ Plus d\'indices disponibles!')
      } else {
        this.showMessage('⏰ Attends quelques secondes...')
      }
      return
    }
    
    // Trouver un mouvement possible
    const hint = this.findPossibleMove()
    
    if (!hint) {
      this.showMessage('🔀 Aucun move possible - Mélange automatique!')
      this.scene.shuffleGrid()
      return
    }
    
    // Utiliser le hint
    this.hintsRemaining--
    this.lastHintTime = Date.now()
    this.hintCountText.setText(`${this.hintsRemaining}`)
    
    // Son
    if (this.scene.sound) {
      this.scene.sound.play('ui_click', { volume: 0.5 })
    }
    
    // Vibration mobile
    if (this.scene.mobileHelper) {
      this.scene.mobileHelper.vibrate('tap')
    }
    
    // Afficher l'animation du hint
    this.showHintAnimation(hint)
  }
  
  /**
   * Trouver un mouvement possible
   */
  findPossibleMove() {
    const rows = this.scene.gridData.length
    const cols = this.scene.gridData[0].length
    
    // Parcourir toute la grille
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = this.scene.gridData[row][col]
        
        // Vérifier si la case a des items
        if (!cell.items || cell.items.length === 0) continue
        
        const firstItem = cell.items[0]
        if (!firstItem || !firstItem.itemType) continue
        
        // Essayer de swap avec la case à droite
        if (col < cols - 1) {
          if (this.wouldCreateMatch(row, col, row, col + 1, firstItem.itemType)) {
            return {
              from: { row, col },
              to: { row, col: col + 1 }
            }
          }
        }
        
        // Essayer de swap avec la case en bas
        if (row < rows - 1) {
          if (this.wouldCreateMatch(row, col, row + 1, col, firstItem.itemType)) {
            return {
              from: { row, col },
              to: { row: row + 1, col }
            }
          }
        }
      }
    }
    
    return null
  }
  
  /**
   * Vérifier si un swap créerait un match
   */
  wouldCreateMatch(fromRow, fromCol, toRow, toCol, itemType) {
    const toCell = this.scene.gridData[toRow][toCol]
    
    // Vérifier si on peut placer l'item
    if (!toCell.items || toCell.items.length >= 3) return false
    
    // Simuler le placement
    const futureCount = toCell.items.filter(item => item.itemType === itemType).length + 1
    
    // Match de 3 ?
    return futureCount >= 3
  }
  
  /**
   * Afficher l'animation du hint
   */
  showHintAnimation(hint) {
    // Nettoyer l'animation précédente
    if (this.currentHintAnimation) {
      this.currentHintAnimation.destroy()
    }
    
    const fromSlot = this.scene.gridSlots[hint.from.row][hint.from.col]
    const toSlot = this.scene.gridSlots[hint.to.row][hint.to.col]
    
    if (!fromSlot || !toSlot) return
    
    // Récupérer le premier item de la case source
    const fromCell = this.scene.gridData[hint.from.row][hint.from.col]
    if (!fromCell.items || fromCell.items.length === 0) return
    
    const item = fromCell.items[0]
    
    // Animation de brillance sur l'item
    this.scene.tweens.add({
      targets: item,
      alpha: 0.3,
      scaleX: item.scaleX * 1.3,
      scaleY: item.scaleY * 1.3,
      duration: 400,
      yoyo: true,
      repeat: 3
    })
    
    // Créer une flèche
    const arrow = this.scene.add.graphics()
    arrow.lineStyle(6, 0xFFD700, 1)
    arrow.setDepth(999)
    
    // Angle de la flèche
    const angle = Math.atan2(toSlot.y - fromSlot.y, toSlot.x - fromSlot.x)
    
    // Position de départ et d'arrivée
    const startX = fromSlot.x + Math.cos(angle) * 40
    const startY = fromSlot.y + Math.sin(angle) * 40
    const endX = toSlot.x - Math.cos(angle) * 40
    const endY = toSlot.y - Math.sin(angle) * 40
    
    // Dessiner la flèche
    arrow.beginPath()
    arrow.moveTo(startX, startY)
    arrow.lineTo(endX, endY)
    arrow.strokePath()
    
    // Pointe de la flèche
    const arrowSize = 15
    const arrowAngle = angle + Math.PI
    arrow.beginPath()
    arrow.moveTo(endX, endY)
    arrow.lineTo(
      endX + Math.cos(arrowAngle - 0.5) * arrowSize,
      endY + Math.sin(arrowAngle - 0.5) * arrowSize
    )
    arrow.moveTo(endX, endY)
    arrow.lineTo(
      endX + Math.cos(arrowAngle + 0.5) * arrowSize,
      endY + Math.sin(arrowAngle + 0.5) * arrowSize
    )
    arrow.strokePath()
    
    this.currentHintAnimation = arrow
    
    // Animation de pulsation de la flèche
    this.scene.tweens.add({
      targets: arrow,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        arrow.destroy()
        this.currentHintAnimation = null
      }
    })
    
    // Cercle de highlight sur la destination
    const circle = this.scene.add.graphics()
    circle.lineStyle(4, 0xFFD700, 0.8)
    circle.strokeCircle(toSlot.x, toSlot.y, 60)
    circle.setDepth(998)
    
    this.scene.tweens.add({
      targets: circle,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => circle.destroy()
    })
  }
  
  /**
   * Afficher un message
   */
  showMessage(text) {
    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height
    
    const message = this.scene.add.text(screenWidth / 2, screenHeight / 2 - 100, text, {
      fontSize: '24px',
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      backgroundColor: '#000000AA',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(9999).setAlpha(0)
    
    this.scene.tweens.add({
      targets: message,
      alpha: 1,
      y: screenHeight / 2 - 50,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: message,
            alpha: 0,
            duration: 300,
            onComplete: () => message.destroy()
          })
        })
      }
    })
  }
  
  /**
   * Recharger les hints (nouvelle partie)
   */
  reset() {
    this.hintsRemaining = 3
    this.lastHintTime = 0
    if (this.hintCountText) {
      this.hintCountText.setText(`${this.hintsRemaining}`)
    }
    if (this.currentHintAnimation) {
      this.currentHintAnimation.destroy()
      this.currentHintAnimation = null
    }
  }
  
  /**
   * Nettoyer
   */
  destroy() {
    if (this.hintButton) this.hintButton.destroy()
    if (this.hintCountText) this.hintCountText.destroy()
    if (this.currentHintAnimation) this.currentHintAnimation.destroy()
  }
}
