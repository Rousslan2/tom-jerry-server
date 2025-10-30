import Phaser from 'phaser'
import { gameConfig, levelConfig } from '../gameConfig.json'

export class GameLogic {
  constructor(scene) {
    this.scene = scene
    this.initializeGameState()
  }

  initializeGameState() {
    this.gameMode = 'single'
    this.selectedGameMode = 'classic' // Can be 'classic', 'time_attack', 'endless', 'zen', 'cascade'
    this.gameOver = false
    this.levelComplete = false
    this.currentMoves = 0
    this.score = 0
    this.combo = 0
    this.comboTimer = null
    this.comboResetDelay = 2000
    this.lastEliminationTime = 0

    // Timer for Time Attack mode
    this.gameTimer = null
    this.timeRemaining = 120

    // Grid system
    this.gridData = []
    this.gridSlots = []

    // Drag system
    this.selectedItem = null
    this.isDragging = false

    // Opponent stats (for online mode)
    this.opponentStats = {
      'milk_box': 0,
      'chips_bag': 0,
      'cola_bottle': 0
    }

    // Item types
    this.itemTypes = [
      'milk_box', 'chips_bag', 'cola_bottle', 'cookie_box', 'detergent_bottle',
      'tissue_pack', 'toothpaste', 'bread', 'towel', 'yogurt_cups', 'energy_drinks',
      'coffee_cans', 'soap_dispensers', 'instant_noodles', 'shampoo_bottles',
      'juice_bottles', 'candy_jars'
    ]
  }

  // Generate random level targets
  generateRandomTargets() {
    const possibleTargets = levelConfig.possibleTargets.value
    const targetCounts = levelConfig.targetCounts.value

    let shuffled
    if (this.gameMode === 'online' && this.scene.isHost) {
      shuffled = Phaser.Utils.Array.Shuffle([...possibleTargets])
      const targetTypes = [shuffled[0], shuffled[1], shuffled[2]]
      localStorage.setItem('currentRoomTargets', JSON.stringify(targetTypes))
    } else if (this.gameMode === 'online' && !this.scene.isHost) {
      const storedTargets = localStorage.getItem('currentRoomTargets')
      if (storedTargets) {
        const targetTypes = JSON.parse(storedTargets)
        shuffled = [...targetTypes, ...possibleTargets.filter(t => !targetTypes.includes(t))]
      } else {
        shuffled = Phaser.Utils.Array.Shuffle([...possibleTargets])
      }
    } else {
      shuffled = Phaser.Utils.Array.Shuffle([...possibleTargets])
    }

    this.levelTargets = [
      { type: shuffled[0], count: targetCounts[0] },
      { type: shuffled[1], count: targetCounts[1] },
      { type: shuffled[2], count: targetCounts[2] }
    ]

    // Initialize eliminated counts
    this.eliminatedCounts = {}
    this.itemTypes.forEach(type => {
      this.eliminatedCounts[type] = 0
    })
  }

  // Initialize grid system
  initializeGrid() {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value

    // Calculate grid parameters
    const uiTopSpace = 160
    const uiBottomSpace = 80
    const uiSideSpace = 120

    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height

    const gridWidth = screenWidth - (uiSideSpace * 2)
    const gridHeight = screenHeight - uiTopSpace - uiBottomSpace

    const slotSpacing = 20
    const slotWidth = (gridWidth - (cols - 1) * slotSpacing) / cols
    const slotHeight = (gridHeight - (rows - 1) * slotSpacing) / rows

    const startX = uiSideSpace
    const startY = uiTopSpace

    // Initialize grid data
    this.gridData = []
    this.gridSlots = []

    for (let row = 0; row < rows; row++) {
      this.gridData[row] = []
      this.gridSlots[row] = []

      for (let col = 0; col < cols; col++) {
        this.gridData[row][col] = {
          positions: [null, null, null],
          items: []
        }

        const slotX = startX + col * (slotWidth + slotSpacing) + slotWidth / 2
        const slotY = startY + row * (slotHeight + slotSpacing) + slotHeight / 2

        const slot = this.scene.add.rectangle(slotX, slotY, slotWidth, slotHeight, 0xffffff, 0)

        const positionOffsets = [
          { x: -slotWidth * 0.25, y: slotHeight * 0.15 },
          { x: 0, y: slotHeight * 0.15 },
          { x: slotWidth * 0.25, y: slotHeight * 0.15 }
        ]

        this.gridSlots[row][col] = {
          sprite: slot,
          x: slotX,
          y: slotY,
          width: slotWidth,
          height: slotHeight,
          positionOffsets: positionOffsets
        }
      }
    }

    return { startX, startY, gridWidth, gridHeight, rows, cols, slotWidth, slotHeight, slotSpacing }
  }

  // Check for elimination in a slot
  checkForElimination(row, col) {
    const gridCell = this.gridData[row][col]
    const positions = gridCell.positions

    // Ensure grid sync
    if (gridCell.items.length !== positions.filter(p => p !== null).length) {
      this.resyncGridCell(row, col)
    }

    const allPositionsFilled = positions.every(pos => pos !== null)

    if (allPositionsFilled) {
      const firstItemType = positions[0]
      const allSameType = positions.every(pos => pos === firstItemType)

      if (allSameType) {
        this.eliminateItems(row, col, firstItemType)
      }
    }
  }

  // Eliminate items from a slot
  eliminateItems(row, col, itemType) {
    const gridCell = this.gridData[row][col]

    // Prevent double elimination
    if (gridCell.isEliminating) return
    gridCell.isEliminating = true

    // Calculate score with combo
    const currentTime = this.scene.time.now
    const timeSinceLastElimination = currentTime - this.lastEliminationTime

    if (timeSinceLastElimination < this.comboResetDelay && this.combo > 0) {
      this.combo++
    } else {
      this.combo = 1
    }

    this.lastEliminationTime = currentTime

    // Clear combo timer and create new one
    if (this.comboTimer) {
      this.comboTimer.remove()
    }

    this.comboTimer = this.scene.time.delayedCall(this.comboResetDelay, () => {
      this.combo = 0
    })

    const basePoints = 100
    const comboMultiplier = this.combo
    const earnedPoints = basePoints * comboMultiplier
    this.score += earnedPoints

    // Update elimination count
    const amountToAdd = gameConfig.maxItemsPerSlot.value
    this.eliminatedCounts[itemType] = (this.eliminatedCounts[itemType] || 0) + amountToAdd

    // Clear slot
    gridCell.positions = [null, null, null]
    gridCell.items.forEach(item => item.destroy())
    gridCell.items = []

    // Reset eliminating flag
    this.scene.time.delayedCall(100, () => {
      gridCell.isEliminating = false
    })

    // Refill slot
    this.scene.time.delayedCall(gameConfig.refillDelay.value, () => {
      this.refillSlot(row, col)
    })

    return { earnedPoints, combo: this.combo }
  }

  // Resync grid cell
  resyncGridCell(row, col) {
    const gridCell = this.gridData[row][col]
    gridCell.positions = [null, null, null]

    gridCell.items.forEach((item, index) => {
      if (item && item.active) {
        const posIndex = item.positionIndex
        if (posIndex >= 0 && posIndex < 3) {
          gridCell.positions[posIndex] = item.itemType
        }
      }
    })
  }

  // Refill a slot
  refillSlot(row, col) {
    const itemCount = 3
    const targetTypes = this.levelTargets.map(t => t.type)
    const incompleteTargets = targetTypes.filter(itemType => {
      const target = this.levelTargets.find(t => t.type === itemType)
      return target && this.eliminatedCounts[itemType] < target.count
    })

    for (let i = 0; i < itemCount; i++) {
      let itemType

      if (incompleteTargets.length > 0 && Math.random() < gameConfig.targetItemSpawnChanceRefill.value / 100) {
        itemType = incompleteTargets[Phaser.Math.Between(0, incompleteTargets.length - 1)]
      } else {
        itemType = this.getRandomItemType()
      }

      this.addItemToSlot(row, col, itemType)
    }
  }

  // Add item to slot
  addItemToSlot(row, col, itemType, targetPosition = null) {
    const slot = this.gridSlots[row][col]
    const gridCell = this.gridData[row][col]

    let positionIndex = targetPosition
    if (positionIndex === null) {
      positionIndex = gridCell.positions.findIndex(pos => pos === null)
      if (positionIndex === -1) return false
    } else {
      if (gridCell.positions[positionIndex] !== null) return false
    }

    const item = this.scene.add.image(slot.x, slot.y, itemType)
      .setScale(0)
      .setAlpha(0)

    const isObstacle = itemType === 'anvil_obstacle' || itemType === 'safe_obstacle' || itemType === 'piano_obstacle'
    if (!isObstacle) {
      item.setInteractive({ draggable: true })
      if (this.scene.mobileHelper) {
        this.scene.mobileHelper.enhanceDragAndDrop(item)
      }
    }

    this.scene.applyTomJerryItemEnhancement(item)

    const offset = slot.positionOffsets[positionIndex]
    item.x = slot.x + offset.x
    item.y = slot.y + offset.y
    item.setDepth(100 + positionIndex)
    this.scene.applyHighQualityRendering(item)

    // Animation
    if (isObstacle) {
      const startY = -100
      item.y = startY
      item.setScale(0.075)
      item.setAlpha(1)

      this.scene.tweens.add({
        targets: item,
        y: slot.y + offset.y,
        duration: 600,
        ease: 'Bounce.easeOut',
        delay: Phaser.Math.Between(0, 300)
      })

      this.scene.tweens.add({
        targets: item,
        rotation: Math.PI * 2,
        duration: 600,
        ease: 'Linear',
        delay: Phaser.Math.Between(0, 300)
      })
    } else {
      this.scene.tweens.add({
        targets: item,
        scale: 0.075,
        alpha: 1,
        duration: 300,
        ease: 'Back.easeOut.config(2)',
        delay: Phaser.Math.Between(0, 200)
      })
    }

    // Store item data
    item.itemType = itemType
    item.gridRow = row
    item.gridCol = col
    item.positionIndex = positionIndex

    gridCell.positions[positionIndex] = itemType
    gridCell.items.push(item)

    // Check for elimination
    this.scene.time.delayedCall(100, () => {
      this.checkForElimination(row, col)
    })

    return true
  }

  // Get random item type
  getRandomItemType() {
    if (Math.random() < gameConfig.obstacleSpawnChance.value / 100) {
      const obstacles = ['anvil_obstacle', 'safe_obstacle', 'piano_obstacle']
      return obstacles[Phaser.Math.Between(0, obstacles.length - 1)]
    }
    return this.itemTypes[Phaser.Math.Between(0, this.itemTypes.length - 1)]
  }

  // Move item to new position
  moveItemToPosition(item, newRow, newCol, newPosition) {
    const oldRow = item.gridRow
    const oldCol = item.gridCol
    const oldPosition = item.positionIndex
    const oldGridCell = this.gridData[oldRow][oldCol]

    // Clear old position
    oldGridCell.positions[oldPosition] = null
    const itemIndex = oldGridCell.items.indexOf(item)
    if (itemIndex > -1) {
      oldGridCell.items.splice(itemIndex, 1)
    }

    // Add to new position
    const newSlot = this.gridSlots[newRow][newCol]
    const newGridCell = this.gridData[newRow][newCol]

    item.gridRow = newRow
    item.gridCol = newCol
    item.positionIndex = newPosition

    const offset = newSlot.positionOffsets[newPosition]
    item.x = newSlot.x + offset.x
    item.y = newSlot.y + offset.y
    item.setDepth(100 + newPosition)

    newGridCell.positions[newPosition] = item.itemType
    newGridCell.items.push(item)

    // Check elimination
    this.scene.time.delayedCall(gameConfig.eliminateDelay.value, () => {
      this.checkForElimination(newRow, newCol)
    })
  }

  // Check game end conditions
  checkGameEnd() {
    if (this.selectedGameMode === 'endless' || this.selectedGameMode === 'zen' || this.selectedGameMode === 'cascade') {
      const target1Met = this.eliminatedCounts[this.levelTargets[0].type] >= this.levelTargets[0].count
      const target2Met = this.eliminatedCounts[this.levelTargets[1].type] >= this.levelTargets[1].count
      const target3Met = this.eliminatedCounts[this.levelTargets[2].type] >= this.levelTargets[2].count
      const victoryConditionMet = target1Met && target2Met && target3Met

      if (victoryConditionMet && !this.levelComplete) {
        this.levelComplete = true
        return { type: 'victory', mode: this.selectedGameMode }
      }
      return null
    }

    // Check victory
    const target1Met = this.eliminatedCounts[this.levelTargets[0].type] >= this.levelTargets[0].count
    const target2Met = this.eliminatedCounts[this.levelTargets[1].type] >= this.levelTargets[1].count
    const target3Met = this.eliminatedCounts[this.levelTargets[2].type] >= this.levelTargets[2].count
    const victoryConditionMet = target1Met && target2Met && target3Met

    if (victoryConditionMet && !this.levelComplete) {
      this.levelComplete = true
      return { type: 'victory', mode: this.gameMode }
    }

    // Check failure (only for classic mode)
    if (this.selectedGameMode === 'classic' && this.currentMoves >= levelConfig.maxMoves.value && !this.levelComplete) {
      this.gameOver = true
      return { type: 'gameOver', mode: this.gameMode }
    }

    return null
  }

  // Get slot and position at location
  getSlotAndPositionAtLocation(x, y) {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const slot = this.gridSlots[row][col]
        const bounds = {
          left: slot.x - slot.width / 2,
          right: slot.x + slot.width / 2,
          top: slot.y - slot.height / 2,
          bottom: slot.y + slot.height / 2
        }

        if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
          const relativeX = x - slot.x
          let position = 1

          if (relativeX < -slot.width * 0.2) {
            position = 0
          } else if (relativeX > slot.width * 0.2) {
            position = 2
          }

          return { row, col, position }
        }
      }
    }

    return null
  }

  // Check if position can accept item
  canPlaceItemAtPosition(row, col, position) {
    const gridCell = this.gridData[row][col]
    return gridCell.positions[position] === null
  }

  // Return item to original position
  returnItemToOriginalPosition(item) {
    const slot = this.gridSlots[item.gridRow][item.gridCol]
    const offset = slot.positionOffsets[item.positionIndex]

    item.x = slot.x + offset.x
    item.y = slot.y + offset.y
    item.setDepth(100 + item.positionIndex)
    item.setAlpha(1.0)
  }

  // Update game timer
  updateGameTimer() {
    if (this.gameOver || this.levelComplete) {
      if (this.gameTimer) {
        this.gameTimer.remove()
      }
      return
    }

    this.timeRemaining--

    if (this.timeRemaining <= 0) {
      this.gameTimer.remove()
      this.gameOver = true
      return { type: 'timeUp', mode: this.gameMode }
    }

    return this.timeRemaining
  }

  // Start game timer
  startGameTimer() {
    this.timeRemaining = 120
    this.gameTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: this.updateGameTimer,
      callbackScope: this,
      loop: true
    })
  }

  // Cleanup
  shutdown() {
    if (this.gameTimer) {
      this.gameTimer.remove()
      this.gameTimer = null
    }
    if (this.comboTimer) {
      this.comboTimer.remove()
      this.comboTimer = null
    }
  }

  // 🌊 CASCADE MODE: Enhanced elimination with cascade effects
  eliminateItemsCascade(row, col, itemType) {
    const gridCell = this.gridData[row][col]

    // Prevent double elimination
    if (gridCell.isEliminating) return
    gridCell.isEliminating = true

    // Calculate score with combo
    const currentTime = this.scene.time.now
    const timeSinceLastElimination = currentTime - this.lastEliminationTime

    if (timeSinceLastElimination < this.comboResetDelay && this.combo > 0) {
      this.combo++
    } else {
      this.combo = 1
    }

    this.lastEliminationTime = currentTime

    // Clear combo timer and create new one
    if (this.comboTimer) {
      this.comboTimer.remove()
    }

    this.comboTimer = this.scene.time.delayedCall(this.comboResetDelay, () => {
      this.combo = 0
    })

    // Enhanced scoring for cascade mode - bonus points for chain reactions
    const basePoints = 150 // Higher base points for cascade mode
    const cascadeBonus = this.combo * 50 // Extra bonus for combos in cascade
    const earnedPoints = basePoints * this.combo + cascadeBonus
    this.score += earnedPoints

    // Update elimination count
    const amountToAdd = gameConfig.maxItemsPerSlot.value
    this.eliminatedCounts[itemType] = (this.eliminatedCounts[itemType] || 0) + amountToAdd

    // Clear slot
    gridCell.positions = [null, null, null]
    gridCell.items.forEach(item => item.destroy())
    gridCell.items = []

    // Reset eliminating flag
    this.scene.time.delayedCall(100, () => {
      gridCell.isEliminating = false
    })

    // Refill slot with cascade-aware logic
    this.scene.time.delayedCall(gameConfig.refillDelay.value, () => {
      this.refillSlotCascade(row, col)
    })

    return { earnedPoints, combo: this.combo }
  }

  // 🌊 CASCADE MODE: Special refill that considers falling items
  refillSlotCascade(row, col) {
    const itemCount = 3
    const targetTypes = this.levelTargets.map(t => t.type)
    const incompleteTargets = targetTypes.filter(itemType => {
      const target = this.levelTargets.find(t => t.type === itemType)
      return target && this.eliminatedCounts[itemType] < target.count
    })

    for (let i = 0; i < itemCount; i++) {
      let itemType

      if (incompleteTargets.length > 0 && Math.random() < gameConfig.targetItemSpawnChanceRefill.value / 100) {
        itemType = incompleteTargets[Phaser.Math.Between(0, incompleteTargets.length - 1)]
      } else {
        itemType = this.getRandomItemType()
      }

      this.addItemToSlot(row, col, itemType)
    }

    // After refilling, trigger cascade check
    this.scene.time.delayedCall(200, () => {
      if (!this.scene.gameOver && !this.scene.levelComplete) {
        this.scene.triggerCascadeEffect(row, col)
      }
    })
  }
}