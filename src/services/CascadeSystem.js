/**
 * 🌊 Cascade System
 * Système de chute et combos en cascade
 */

export class CascadeSystem {
  constructor(scene) {
    this.scene = scene
    this.enabled = false // Activé uniquement en mode cascade
    this.cascading = false
  }
  
  /**
   * Activer/désactiver le système de cascade
   */
  setEnabled(enabled) {
    this.enabled = enabled
  }
  
  /**
   * Après élimination, faire tomber les items
   */
  async handleCascade() {
    if (!this.enabled || this.cascading) return
    
    this.cascading = true
    let cascadeHappened = false
    
    do {
      cascadeHappened = false
      
      // Étape 1: Faire tomber les items
      const dropped = await this.dropItems()
      if (dropped) cascadeHappened = true
      
      // Étape 2: Vérifier les nouveaux matchs
      await this.scene.time.delayedCall(300, () => {})
      
      const newMatches = this.checkForMatches()
      if (newMatches.length > 0) {
        await this.eliminateMatches(newMatches)
        cascadeHappened = true
      }
      
    } while (cascadeHappened)
    
    this.cascading = false
  }
  
  /**
   * Faire tomber tous les items vers le bas
   */
  async dropItems() {
    let itemsDropped = false
    const rows = this.scene.gridData.length
    const cols = this.scene.gridData[0].length
    
    // Parcourir de bas en haut
    for (let row = rows - 1; row >= 0; row--) {
      for (let col = 0; col < cols; col++) {
        const cell = this.scene.gridData[row][col]
        
        // Si la case a moins de 3 items, essayer de faire tomber depuis le haut
        while (cell.items.length < 3) {
          const itemAbove = this.findItemAbove(row, col)
          
          if (!itemAbove) break
          
          // Déplacer l'item vers le bas
          await this.moveItemDown(itemAbove.row, itemAbove.col, row, col)
          itemsDropped = true
        }
      }
    }
    
    return itemsDropped
  }
  
  /**
   * Trouver un item au-dessus
   */
  findItemAbove(targetRow, targetCol) {
    for (let row = targetRow - 1; row >= 0; row--) {
      const cell = this.scene.gridData[row][targetCol]
      
      if (cell.items && cell.items.length > 0) {
        return { row, col: targetCol, item: cell.items[0] }
      }
    }
    
    return null
  }
  
  /**
   * Déplacer un item vers le bas
   */
  async moveItemDown(fromRow, fromCol, toRow, toCol) {
    const fromCell = this.scene.gridData[fromRow][fromCol]
    const toCell = this.scene.gridData[toRow][toCol]
    const toSlot = this.scene.gridSlots[toRow][toCol]
    
    if (!fromCell.items || fromCell.items.length === 0) return
    
    const item = fromCell.items.shift() // Retirer de la case source
    
    // Calculer la position dans le slot de destination
    const position = toCell.items.length
    const targetY = toSlot.y + this.getYOffset(position)
    
    // Animation de chute
    return new Promise(resolve => {
      this.scene.tweens.add({
        targets: item,
        y: targetY,
        duration: 300,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          toCell.items.push(item)
          item.row = toRow
          item.col = toCol
          item.position = position
          resolve()
        }
      })
    })
  }
  
  /**
   * Calculer l'offset Y selon la position
   */
  getYOffset(position) {
    const offsets = [-20, 0, 20]
    return offsets[position] || 0
  }
  
  /**
   * Vérifier les matchs après cascade
   */
  checkForMatches() {
    const matches = []
    const rows = this.scene.gridData.length
    const cols = this.scene.gridData[0].length
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = this.scene.gridData[row][col]
        
        if (!cell.items || cell.items.length < 3) continue
        
        // Vérifier si les 3 items sont du même type
        const firstType = cell.items[0]?.itemType
        if (!firstType) continue
        
        const allSameType = cell.items.every(item => item.itemType === firstType)
        
        if (allSameType) {
          matches.push({ row, col, itemType: firstType })
        }
      }
    }
    
    return matches
  }
  
  /**
   * Éliminer les matchs trouvés
   */
  async eliminateMatches(matches) {
    const eliminationPromises = matches.map(match => {
      return new Promise(resolve => {
        this.scene.eliminateItems(match.row, match.col, match.itemType)
        
        // Attendre la fin de l'animation
        this.scene.time.delayedCall(500, resolve)
      })
    })
    
    await Promise.all(eliminationPromises)
  }
  
  /**
   * Générer de nouveaux items en haut
   */
  generateNewItems(col) {
    const itemTypes = Object.keys(this.scene.itemConfigs || {})
    if (itemTypes.length === 0) return null
    
    const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)]
    
    // Créer l'item hors écran en haut
    const slot = this.scene.gridSlots[0][col]
    const startY = slot.y - 300
    
    const item = this.scene.add.image(slot.x, startY, randomType)
      .setScale(0.08)
      .setDepth(100)
    
    item.itemType = randomType
    item.row = -1 // Temporaire
    item.col = col
    
    return item
  }
  
  /**
   * Nettoyer
   */
  destroy() {
    this.enabled = false
    this.cascading = false
  }
}
