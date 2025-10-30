import Phaser from 'phaser'
import { GAME_CONSTANTS } from './Constants.js'

export class PowerUps {
  constructor(scene) {
    this.scene = scene
    this.activePowerUps = new Map()
    this.powerUpInventory = new Map()
    this.cooldowns = new Map()

    this.initializePowerUps()
  }

  /**
   * 🎯 Initialisation des power-ups disponibles
   */
  initializePowerUps() {
    this.powerUps = {
      // Power-up de base - gratuit
      'shuffle': {
        name: '🔀 Shuffle Board',
        description: 'Rearrange all items on the board',
        icon: '🔀',
        cost: 0,
        cooldown: 30000, // 30 secondes
        effect: this.shuffleBoard.bind(this),
        available: true
      },

      // Power-ups achetables avec des pièces
      'bomb': {
        name: '💣 Bomb',
        description: 'Destroy all items in a 3x3 area',
        icon: '💣',
        cost: 50,
        cooldown: 15000, // 15 secondes
        effect: this.activateBomb.bind(this),
        available: false
      },

      'lightning': {
        name: '⚡ Lightning',
        description: 'Destroy all items in a row or column',
        icon: '⚡',
        cost: 75,
        cooldown: 20000, // 20 secondes
        effect: this.activateLightning.bind(this),
        available: false
      },

      'freeze': {
        name: '🧊 Freeze Time',
        description: 'Pause all timers for 10 seconds',
        icon: '🧊',
        cost: 100,
        cooldown: 60000, // 1 minute
        effect: this.activateFreeze.bind(this),
        available: false
      },

      'magnet': {
        name: '🧲 Magnet',
        description: 'Attract nearby items to empty slots',
        icon: '🧲',
        cost: 30,
        cooldown: 10000, // 10 secondes
        effect: this.activateMagnet.bind(this),
        available: false
      },

      'rainbow': {
        name: '🌈 Rainbow Wildcard',
        description: 'Create a wildcard that matches any item',
        icon: '🌈',
        cost: 150,
        cooldown: 45000, // 45 secondes
        effect: this.activateRainbow.bind(this),
        available: false
      }
    }

    // Charger l'inventaire depuis le stockage local
    this.loadInventory()
  }

  /**
   * 💰 Charger l'inventaire des power-ups
   */
  loadInventory() {
    const saved = localStorage.getItem('powerUpInventory')
    if (saved) {
      const inventory = JSON.parse(saved)
      Object.keys(inventory).forEach(powerUpId => {
        this.powerUpInventory.set(powerUpId, inventory[powerUpId])
      })
    }

    // Débloquer les power-ups de base
    this.unlockPowerUp('shuffle')
  }

  /**
   * 💾 Sauvegarder l'inventaire
   */
  saveInventory() {
    const inventory = {}
    this.powerUpInventory.forEach((data, powerUpId) => {
      inventory[powerUpId] = data
    })
    localStorage.setItem('powerUpInventory', JSON.stringify(inventory))
  }

  /**
   * 🔓 Débloquer un power-up
   */
  unlockPowerUp(powerUpId) {
    if (this.powerUps[powerUpId]) {
      this.powerUps[powerUpId].available = true
      this.powerUpInventory.set(powerUpId, {
        unlocked: true,
        uses: 0,
        lastUsed: 0
      })
      this.saveInventory()
    }
  }

  /**
   * 🎯 Utiliser un power-up
   */
  usePowerUp(powerUpId, targetPosition = null) {
    const powerUp = this.powerUps[powerUpId]
    if (!powerUp || !powerUp.available) {
      this.showMessage('Power-up not available!', 'error')
      return false
    }

    // Vérifier le cooldown
    const now = Date.now()
    const lastUsed = this.powerUpInventory.get(powerUpId)?.lastUsed || 0
    if (now - lastUsed < powerUp.cooldown) {
      const remainingTime = Math.ceil((powerUp.cooldown - (now - lastUsed)) / 1000)
      this.showMessage(`Cooldown: ${remainingTime}s`, 'warning')
      return false
    }

    // Vérifier le coût (pour les power-ups payants)
    if (powerUp.cost > 0) {
      if (!this.hasEnoughCoins(powerUp.cost)) {
        this.showMessage('Not enough coins!', 'error')
        return false
      }
      this.spendCoins(powerUp.cost)
    }

    // Activer l'effet
    try {
      const success = powerUp.effect(targetPosition)

      if (success) {
        // Mettre à jour les statistiques
        const inventory = this.powerUpInventory.get(powerUpId) || { uses: 0, lastUsed: 0 }
        inventory.uses++
        inventory.lastUsed = now
        this.powerUpInventory.set(powerUpId, inventory)
        this.saveInventory()

        // Démarrer le cooldown
        this.cooldowns.set(powerUpId, now + powerUp.cooldown)

        // Effet visuel et sonore
        this.playPowerUpEffect(powerUpId)
        this.showMessage(`${powerUp.name} activated!`, 'success')

        return true
      }
    } catch (error) {
      console.error('Power-up activation failed:', error)
      this.showMessage('Power-up failed to activate', 'error')
    }

    return false
  }

  /**
   * 🔀 Effet Shuffle Board
   */
  shuffleBoard() {
    // Mélanger tous les items sur le plateau
    const allItems = []

    // Collecter tous les items
    this.scene.logic.gridData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        cell.items.forEach(item => {
          allItems.push({
            item: item,
            originalRow: rowIndex,
            originalCol: colIndex
          })
        })
      })
    })

    // Mélanger le tableau
    Phaser.Utils.Array.Shuffle(allItems)

    // Redistribuer les items
    let itemIndex = 0
    this.scene.logic.gridData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        // Vider la cellule
        cell.positions = [null, null, null]
        cell.items.forEach(item => item.destroy())
        cell.items = []

        // Ajouter de nouveaux items
        for (let pos = 0; pos < 3 && itemIndex < allItems.length; pos++) {
          const itemData = allItems[itemIndex++]
          this.scene.logic.addItemToSlot(rowIndex, colIndex, itemData.item.itemType, pos)
        }
      })
    })

    return true
  }

  /**
   * 💣 Effet Bomb
   */
  activateBomb(targetPosition) {
    if (!targetPosition) {
      this.showMessage('Select a target position for the bomb!', 'warning')
      return false
    }

    const { row, col } = targetPosition
    const affectedCells = []

    // Zone 3x3 autour de la cible
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < GAME_CONSTANTS.GRID_ROWS &&
            c >= 0 && c < GAME_CONSTANTS.GRID_COLS) {
          affectedCells.push({ row: r, col: c })
        }
      }
    }

    // Détruire tous les items dans la zone
    affectedCells.forEach(({ row, col }) => {
      const cell = this.scene.logic.gridData[row][col]
      cell.items.forEach(item => {
        this.createExplosionEffect(item.x, item.y)
        item.destroy()
      })
      cell.positions = [null, null, null]
      cell.items = []
    })

    // Refill les cellules affectées
    affectedCells.forEach(({ row, col }) => {
      this.scene.time.delayedCall(500, () => {
        this.scene.logic.refillSlot(row, col)
      })
    })

    return true
  }

  /**
   * ⚡ Effet Lightning
   */
  activateLightning(targetPosition) {
    if (!targetPosition) {
      this.showMessage('Select a row or column for lightning!', 'warning')
      return false
    }

    // Pour cet exemple, on détruit toute la ligne
    const { row } = targetPosition

    for (let col = 0; col < GAME_CONSTANTS.GRID_COLS; col++) {
      const cell = this.scene.logic.gridData[row][col]
      cell.items.forEach(item => {
        this.createLightningEffect(item.x, item.y)
        item.destroy()
      })
      cell.positions = [null, null, null]
      cell.items = []

      // Refill après un délai
      this.scene.time.delayedCall(300, () => {
        this.scene.logic.refillSlot(row, col)
      })
    }

    return true
  }

  /**
   * 🧊 Effet Freeze Time
   */
  activateFreeze(targetPosition) {
    // Geler tous les timers pour 10 secondes
    const freezeDuration = 10000

    // Geler les timers du jeu
    if (this.scene.logic.gameTimer) {
      this.scene.logic.gameTimer.paused = true
    }

    // Geler les timers d'événements
    if (this.scene.eventsManager) {
      this.scene.eventsManager.pauseTimers()
    }

    // Effet visuel de gel
    this.createFreezeEffect()

    // Dégeler après la durée
    this.scene.time.delayedCall(freezeDuration, () => {
      if (this.scene.logic.gameTimer) {
        this.scene.logic.gameTimer.paused = false
      }
      if (this.scene.eventsManager) {
        this.scene.eventsManager.resumeTimers()
      }
      this.showMessage('Freeze effect ended!', 'info')
    })

    return true
  }

  /**
   * 🧲 Effet Magnet
   */
  activateMagnet(targetPosition) {
    // Attirer les items vers les emplacements vides
    const emptySlots = []

    // Trouver les emplacements vides
    this.scene.logic.gridData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        cell.positions.forEach((pos, posIndex) => {
          if (pos === null) {
            emptySlots.push({ row: rowIndex, col: colIndex, pos: posIndex })
          }
        })
      })
    })

    if (emptySlots.length === 0) {
      this.showMessage('No empty slots to fill!', 'warning')
      return false
    }

    // Pour chaque emplacement vide, trouver un item proche et l'attirer
    emptySlots.forEach((slot, index) => {
      this.scene.time.delayedCall(index * 200, () => {
        const nearbyItem = this.findNearbyItem(slot.row, slot.col)
        if (nearbyItem) {
          // Déplacer l'item vers l'emplacement vide
          this.scene.logic.moveItemToPosition(
            nearbyItem,
            slot.row,
            slot.col,
            slot.pos
          )
        }
      })
    })

    return true
  }

  /**
   * 🌈 Effet Rainbow Wildcard
   */
  activateRainbow(targetPosition) {
    if (!targetPosition) {
      this.showMessage('Select a position for the rainbow wildcard!', 'warning')
      return false
    }

    const { row, col } = targetPosition

    // Créer un item spécial "rainbow" qui peut correspondre à n'importe quoi
    const rainbowItem = this.scene.add.image(0, 0, 'rainbow_wildcard')
      .setScale(GAME_CONSTANTS.ITEM_SCALE_NORMAL)
      .setInteractive({ draggable: true })

    if (this.scene.mobileHelper) {
      this.scene.mobileHelper.enhanceDragAndDrop(rainbowItem)
    }

    this.scene.applyTomJerryItemEnhancement(rainbowItem)
    this.scene.applyHighQualityRendering(rainbowItem)

    // Stocker les données de l'item
    rainbowItem.itemType = 'rainbow_wildcard'
    rainbowItem.gridRow = row
    rainbowItem.gridCol = col
    rainbowItem.positionIndex = 0 // Position du haut

    // Ajouter à la grille
    const cell = this.scene.logic.gridData[row][col]
    const slot = this.scene.logic.gridSlots[row][col]
    const offset = slot.positionOffsets[0]

    rainbowItem.x = slot.x + offset.x
    rainbowItem.y = slot.y + offset.y
    rainbowItem.setDepth(GAME_CONSTANTS.DEPTH_ITEMS)

    cell.positions[0] = 'rainbow_wildcard'
    cell.items.push(rainbowItem)

    // Effet spécial pour le rainbow
    this.createRainbowEffect(rainbowItem.x, rainbowItem.y)

    return true
  }

  /**
   * 🔍 Trouver un item proche d'une position
   */
  findNearbyItem(targetRow, targetCol) {
    // Chercher dans un rayon de 2 cases
    for (let radius = 1; radius <= 2; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const r = targetRow + dr
          const c = targetCol + dc

          if (r >= 0 && r < GAME_CONSTANTS.GRID_ROWS &&
              c >= 0 && c < GAME_CONSTANTS.GRID_COLS) {
            const cell = this.scene.logic.gridData[r][c]
            if (cell.items.length > 0) {
              return cell.items[0] // Retourner le premier item trouvé
            }
          }
        }
      }
    }
    return null
  }

  /**
   * 💰 Vérifier si le joueur a assez de pièces
   */
  hasEnoughCoins(amount) {
    // Pour cet exemple, on utilise un système simple de pièces
    const coins = parseInt(localStorage.getItem('playerCoins') || '0')
    return coins >= amount
  }

  /**
   * 💸 Dépenser des pièces
   */
  spendCoins(amount) {
    const currentCoins = parseInt(localStorage.getItem('playerCoins') || '0')
    localStorage.setItem('playerCoins', (currentCoins - amount).toString())
  }

  /**
   * 🎆 Effets visuels pour les power-ups
   */
  createExplosionEffect(x, y) {
    // Effet d'explosion avec particules
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.graphics()
      particle.fillStyle(0xFF4500, 1)
      particle.fillCircle(0, 0, 3)
      particle.setPosition(x, y)

      const angle = (i / 8) * Math.PI * 2
      const distance = 50

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      })
    }
  }

  createLightningEffect(x, y) {
    // Effet d'éclair
    const lightning = this.scene.add.graphics()
    lightning.lineStyle(4, 0xFFFF00, 1)
    lightning.strokeLineShape(new Phaser.Geom.Line(x - 30, y - 50, x + 30, y + 50))

    this.scene.tweens.add({
      targets: lightning,
      alpha: 0,
      duration: 300,
      onComplete: () => lightning.destroy()
    })
  }

  createFreezeEffect() {
    // Effet de gel sur l'écran
    const freezeOverlay = this.scene.add.graphics()
    freezeOverlay.fillStyle(0x87CEEB, 0.3)
    freezeOverlay.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height)
    freezeOverlay.setDepth(GAME_CONSTANTS.DEPTH_OVERLAY)

    // Particules de neige
    for (let i = 0; i < 20; i++) {
      const snowflake = this.scene.add.text(
        Math.random() * this.scene.cameras.main.width,
        Math.random() * this.scene.cameras.main.height,
        '❄️',
        { fontSize: '20px' }
      ).setDepth(GAME_CONSTANTS.DEPTH_OVERLAY + 1)

      this.scene.tweens.add({
        targets: snowflake,
        y: snowflake.y + 100,
        alpha: 0,
        duration: 3000,
        onComplete: () => snowflake.destroy()
      })
    }

    // Supprimer l'effet après 10 secondes
    this.scene.time.delayedCall(10000, () => {
      freezeOverlay.destroy()
    })
  }

  createRainbowEffect(x, y) {
    // Effet arc-en-ciel
    const colors = [0xFF0000, 0xFF8000, 0xFFFF00, 0x00FF00, 0x0080FF, 0x8000FF]

    colors.forEach((color, index) => {
      const ring = this.scene.add.graphics()
      ring.lineStyle(3, color, 1)
      ring.strokeCircle(x, y, 20 + index * 5)
      ring.setDepth(GAME_CONSTANTS.DEPTH_OVERLAY)

      this.scene.tweens.add({
        targets: ring,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 1000,
        delay: index * 100,
        onComplete: () => ring.destroy()
      })
    })
  }

  /**
   * 🎵 Effets sonores pour les power-ups
   */
  playPowerUpEffect(powerUpId) {
    const sounds = {
      'shuffle': 'item_pickup',
      'bomb': 'game_over',
      'lightning': 'combo_mega',
      'freeze': 'level_complete',
      'magnet': 'item_drop',
      'rainbow': 'score_gain'
    }

    if (this.scene.audio && sounds[powerUpId]) {
      this.scene.audio.playSound(sounds[powerUpId])
    }
  }

  /**
   * 💬 Afficher un message
   */
  showMessage(message, type = 'info') {
    if (this.scene.ui) {
      this.scene.ui.showHelpMessage(message)
    }
  }

  /**
   * 🎮 Obtenir la liste des power-ups disponibles
   */
  getAvailablePowerUps() {
    return Object.keys(this.powerUps).filter(id => {
      const powerUp = this.powerUps[id]
      return powerUp.available && this.canUsePowerUp(id)
    })
  }

  /**
   * ✅ Vérifier si un power-up peut être utilisé
   */
  canUsePowerUp(powerUpId) {
    const powerUp = this.powerUps[powerUpId]
    if (!powerUp) return false

    // Vérifier le cooldown
    const now = Date.now()
    const lastUsed = this.powerUpInventory.get(powerUpId)?.lastUsed || 0
    if (now - lastUsed < powerUp.cooldown) {
      return false
    }

    // Vérifier le coût
    if (powerUp.cost > 0 && !this.hasEnoughCoins(powerUp.cost)) {
      return false
    }

    return true
  }

  /**
   * ⏰ Obtenir le temps de recharge restant
   */
  getCooldownRemaining(powerUpId) {
    const powerUp = this.powerUps[powerUpId]
    if (!powerUp) return 0

    const now = Date.now()
    const lastUsed = this.powerUpInventory.get(powerUpId)?.lastUsed || 0
    const remaining = powerUp.cooldown - (now - lastUsed)

    return Math.max(0, remaining)
  }

  /**
   * 📊 Obtenir les statistiques d'utilisation
   */
  getPowerUpStats() {
    const stats = {}
    this.powerUpInventory.forEach((data, powerUpId) => {
      stats[powerUpId] = {
        uses: data.uses || 0,
        unlocked: data.unlocked || false,
        cooldown: this.getCooldownRemaining(powerUpId)
      }
    })
    return stats
  }

  /**
   * 🧹 Nettoyer les ressources
   */
  destroy() {
    this.activePowerUps.clear()
    this.powerUpInventory.clear()
    this.cooldowns.clear()
  }
}