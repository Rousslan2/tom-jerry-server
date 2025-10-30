// GameLogic.js - Handles all game logic separately from rendering
import { gameConfig, levelConfig } from '../gameConfig.json'

export class GameLogic {
  constructor(scene) {
    this.scene = scene
    this.initializeGameState()
  }

  initializeGameState() {
    // Game mode
    this.gameMode = 'single'
    this.isHost = false
    
    // Game mode type
    this.selectedGameMode = 'classic'
    
    // Game state
    this.gameOver = false
    this.levelComplete = false
    this.currentMoves = 0
    
    // Timer for Time Attack
    this.timeRemaining = 120
    this.gameTimer = null
    
    // Grid system
    this.gridData = []
    this.gridSlots = []
    
    // Score & Combo
    this.score = 0
    this.combo = 0
    this.comboTimer = null
    this.comboResetDelay = 2000
    this.lastEliminationTime = 0

    // 🌊 CASCADE MODE: Cascade system
    this.cascadeLevel = 0
    this.cascadeChain = []
    this.maxCascadeLevel = 0
    
    // Item types
    this.itemTypes = [
      'milk_box',
      'chips_bag', 
      'cola_bottle',
      'cookie_box',
      'detergent_bottle',
      'tissue_pack',
      'toothpaste',
      'bread',
      'towel',
      'yogurt_cups',
      'energy_drinks',
      'coffee_cans',
      'soap_dispensers',
      'instant_noodles',
      'shampoo_bottles',
      'juice_bottles',
      'candy_jars'
    ]
    
    // Target tracking
    this.eliminatedCounts = {
      'milk_box': 0,
      'chips_bag': 0,
      'cola_bottle': 0,
      'cookie_box': 0,
      'detergent_bottle': 0,
      'tissue_pack': 0,
      'toothpaste': 0,
      'bread': 0,
      'towel': 0,
      'yogurt_cups': 0,
      'energy_drinks': 0,
      'coffee_cans': 0,
      'soap_dispensers': 0,
      'instant_noodles': 0,
      'shampoo_bottles': 0,
      'juice_bottles': 0,
      'candy_jars': 0
    }
  }

  generateRandomTargets() {
    const possibleTargets = levelConfig.possibleTargets.value
    const targetCounts = levelConfig.targetCounts.value
    
    let shuffled
    if (this.gameMode === 'online' && this.isHost) {
      shuffled = Phaser.Utils.Array.Shuffle([...possibleTargets])
      const targetTypes = [shuffled[0], shuffled[1], shuffled[2]]
      localStorage.setItem('currentRoomTargets', JSON.stringify(targetTypes))
      console.log('🎯 Host generated targets:', targetTypes)
    } else if (this.gameMode === 'online' && !this.isHost) {
      const storedTargets = localStorage.getItem('currentRoomTargets')
      if (storedTargets) {
        const targetTypes = JSON.parse(storedTargets)
        shuffled = [...targetTypes, ...possibleTargets.filter(t => !targetTypes.includes(t))]
        console.log('🎯 Guest loaded targets:', targetTypes)
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
    
    console.log('🎯 Random Targets:', this.levelTargets)
  }

  initializeGrid() {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
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
          positionIndicators: [],
          x: slotX,
          y: slotY,
          width: slotWidth,
          height: slotHeight,
          positionOffsets: positionOffsets
        }
      }
    }
    
    // Create watching cat
    this.scene.createWatchingCat(startX, startY, gridWidth)
    
    return {
      startX,
      startY,
      gridWidth,
      gridHeight,
      rows,
      cols,
      slotWidth,
      slotHeight,
      slotSpacing
    }
  }

  getRandomItemType() {
    if (Math.random() < gameConfig.obstacleSpawnChance.value / 100) {
      const obstacles = ['anvil_obstacle', 'safe_obstacle', 'piano_obstacle']
      return obstacles[Phaser.Math.Between(0, obstacles.length - 1)]
    }
    
    return this.itemTypes[Phaser.Math.Between(0, this.itemTypes.length - 1)]
  }

  addItemToSlot(row, col, itemType, targetPosition = null) {
    return this.scene.addItemToSlot(row, col, itemType, targetPosition)
  }

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

  moveItemToPosition(item, newRow, newCol, newPosition) {
    const oldRow = item.gridRow
    const oldCol = item.gridCol
    const oldPosition = item.positionIndex
    const oldGridCell = this.gridData[oldRow][oldCol]
    
    oldGridCell.positions[oldPosition] = null
    const itemIndex = oldGridCell.items.indexOf(item)
    if (itemIndex > -1) {
      oldGridCell.items.splice(itemIndex, 1)
    }
    
    this.scene.updatePositionIndicator(oldRow, oldCol, oldPosition, null)
    
    const newSlot = this.gridSlots[newRow][newCol]
    const newGridCell = this.gridData[newRow][newCol]
    
    item.gridRow = newRow
    item.gridCol = newCol
    item.positionIndex = newPosition
    
    newGridCell.positions[newPosition] = item.itemType
    newGridCell.items.push(item)
    
    const offset = newSlot.positionOffsets[newPosition]
    item.x = newSlot.x + offset.x
    item.y = newSlot.y + offset.y
    item.setDepth(100 + newPosition)
    
    this.scene.updatePositionIndicator(newRow, newCol, newPosition, item.itemType)
    
    this.scene.time.delayedCall(gameConfig.eliminateDelay.value, () => {
      this.checkForElimination(newRow, newCol)
    })
  }

  returnItemToOriginalPosition(item) {
    const slot = this.gridSlots[item.gridRow][item.gridCol]
    const offset = slot.positionOffsets[item.positionIndex]
    
    item.x = slot.x + offset.x
    item.y = slot.y + offset.y
    item.setDepth(100 + item.positionIndex)
    item.setAlpha(1.0)
  }

  checkForElimination(row, col) {
    const gridCell = this.gridData[row][col]
    const positions = gridCell.positions
    
    if (gridCell.items.length !== positions.filter(p => p !== null).length) {
      console.warn(`⚠️ Mismatch at (${row},${col})`)
      this.resyncGridCell(row, col)
    }
    
    const allPositionsFilled = positions.every(pos => pos !== null)
    
    if (allPositionsFilled) {
      const firstItemType = positions[0]
      const allSameType = positions.every(pos => pos === firstItemType)
      
      if (allSameType) {
        console.log(`✅ Match found at (${row},${col}): 3x ${firstItemType}`)
        
        // For cascade mode, use special elimination
        if (this.selectedGameMode === 'cascade') {
          return this.eliminateItemsCascade(row, col, firstItemType)
        } else {
          this.scene.eliminateItems(row, col, firstItemType)
        }
      }
    }
  }

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
    
    console.log(`🔄 Resynced (${row},${col}):`, gridCell.positions)
  }

  // 🌊 CASCADE MODE: Special elimination with cascade tracking
  eliminateItemsCascade(row, col, itemType) {
    const gridCell = this.gridData[row][col]
    
    if (gridCell.isEliminating) {
      console.log(`⚠️ Skip (${row},${col}) - Already eliminating`)
      return { cascade: 0, earnedPoints: 0 }
    }
    
    gridCell.isEliminating = true
    
    // Increment cascade level
    this.cascadeLevel++
    
    // Track max cascade level
    if (this.cascadeLevel > this.maxCascadeLevel) {
      this.maxCascadeLevel = this.cascadeLevel
    }
    
    // Add to cascade chain
    this.cascadeChain.push({
      row,
      col,
      itemType,
      level: this.cascadeLevel
    })
    
    console.log(`🌊 CASCADE LEVEL ${this.cascadeLevel} at (${row},${col})`)
    
    // Calculate points with cascade multiplier
    const basePoints = 100
    const cascadeMultiplier = Math.pow(1.5, this.cascadeLevel - 1) // 1x, 1.5x, 2.25x, 3.375x, etc.
    const earnedPoints = Math.floor(basePoints * cascadeMultiplier)
    
    this.score += earnedPoints
    
    // Play appropriate sound
    if (this.cascadeLevel >= 5) {
      this.scene.sound.play('combo_mega', { volume: 0.5 })
    } else if (this.cascadeLevel >= 3) {
      this.scene.sound.play('combo_x3', { volume: 0.5 })
    } else {
      this.scene.sound.play('match_eliminate', { volume: 0.5 })
    }
    
    // Mark for refilling
    this.scene.time.delayedCall(100, () => {
      gridCell.isEliminating = false
    })
    
    return {
      cascade: this.cascadeLevel,
      earnedPoints: earnedPoints
    }
  }

  // 🌊 CASCADE MODE: Apply gravity - make items fall down
  cascadeItemsWithGravity() {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    let itemsMoved = 0
    
    // Start from bottom row and move upward
    for (let row = rows - 2; row >= 0; row--) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]
        
        // Check each position in this slot
        for (let pos = 0; pos < 3; pos++) {
          if (gridCell.positions[pos] !== null) {
            // Try to move this item down
            if (this.canItemFallCascade(row, col, pos)) {
              this.makeItemFallCascade(row, col, pos)
              itemsMoved++
            }
          }
        }
      }
    }
    
    console.log(`🌊 Gravity applied: ${itemsMoved} items moved`)
    return itemsMoved
  }

  // 🌊 CASCADE MODE: Check if item can fall
  canItemFallCascade(row, col, position) {
    const rows = gameConfig.gridRows.value
    if (row >= rows - 1) return false // Already at bottom
    
    const belowCell = this.gridData[row + 1][col]
    return belowCell.positions.some(pos => pos === null)
  }

  // 🌊 CASCADE MODE: Make item fall
  makeItemFallCascade(fromRow, fromCol, fromPosition) {
    const item = this.gridData[fromRow][fromCol].items[fromPosition]
    if (!item) return
    
    const belowCell = this.gridData[fromRow + 1][fromCol]
    const emptyPos = belowCell.positions.findIndex(pos => pos === null)
    
    if (emptyPos !== -1) {
      // Remove from current position
      const oldGridCell = this.gridData[fromRow][fromCol]
      oldGridCell.positions[fromPosition] = null
      const itemIndex = oldGridCell.items.indexOf(item)
      if (itemIndex > -1) {
        oldGridCell.items.splice(itemIndex, 1)
      }
      
      // Add to new position
      const newGridCell = this.gridData[fromRow + 1][fromCol]
      item.gridRow = fromRow + 1
      item.gridCol = fromCol
      item.positionIndex = emptyPos
      
      newGridCell.positions[emptyPos] = item.itemType
      newGridCell.items.push(item)
      
      // Animate falling
      const newSlot = this.gridSlots[fromRow + 1][fromCol]
      const offset = newSlot.positionOffsets[emptyPos]
      const newY = newSlot.y + offset.y
      
      this.scene.tweens.add({
        targets: item,
        y: newY,
        duration: 400,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          // Check for new matches after falling
          this.checkForElimination(fromRow + 1, fromCol)
        }
      })
      
      this.scene.updatePositionIndicator(fromRow, fromCol, fromPosition, null)
      this.scene.updatePositionIndicator(fromRow + 1, fromCol, emptyPos, item.itemType)
      
      console.log(`🌊 Item fell from (${fromRow},${fromCol}) to (${fromRow + 1},${fromCol})`)
    }
  }

  // 🌊 CASCADE MODE: Reset cascade chain and award bonus
  resetCascadeChain() {
    if (this.cascadeChain.length === 0) {
      return null
    }
    
    const maxLevel = this.maxCascadeLevel
    
    // Award chain completion bonus
    let bonusPoints = 0
    if (maxLevel >= 5) {
      bonusPoints = 5000 // MEGA CASCADE
    } else if (maxLevel >= 4) {
      bonusPoints = 2000
    } else if (maxLevel >= 3) {
      bonusPoints = 1000
    } else if (maxLevel >= 2) {
      bonusPoints = 500
    }
    
    if (bonusPoints > 0) {
      this.score += bonusPoints
      console.log(`🎉 CASCADE CHAIN BONUS: ${maxLevel} levels = +${bonusPoints} points!`)
    }
    
    // Reset cascade tracking
    this.cascadeLevel = 0
    this.maxCascadeLevel = 0
    this.cascadeChain = []
    
    return {
      maxLevel,
      bonus: bonusPoints
    }
  }

  startGameTimer() {
    this.timeRemaining = 120
    
    this.gameTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
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
        }
      },
      callbackScope: this,
      loop: true
    })
  }

  checkGameEnd() {
    // Endless/Zen/Cascade mode - no game over
    if (this.selectedGameMode === 'endless' || this.selectedGameMode === 'zen' || this.selectedGameMode === 'cascade') {
      return
    }
    
    // Check victory
    const target1Met = this.eliminatedCounts[this.levelTargets[0].type] >= this.levelTargets[0].count
    const target2Met = this.eliminatedCounts[this.levelTargets[1].type] >= this.levelTargets[1].count
    const target3Met = this.eliminatedCounts[this.levelTargets[2].type] >= this.levelTargets[2].count
    const victoryConditionMet = target1Met && target2Met && target3Met
    
    if (victoryConditionMet && !this.levelComplete) {
      this.levelComplete = true
      this.scene.sound.play('level_complete', { volume: 0.5 })
      
      if (this.selectedGameMode === 'time_attack' && this.gameTimer) {
        this.gameTimer.remove()
      }
      
      this.scene.updatePlayerStats(true)
      
      if (this.scene.gameMode === 'online') {
        const multiplayerService = this.scene.registry.get('multiplayerService')
        if (multiplayerService) {
          multiplayerService.sendGameEnd('win')
        }
      }
      
      this.scene.scene.launch('VictoryScene', {
        score: this.score,
        moves: this.currentMoves,
        maxMoves: levelConfig.maxMoves.value,
        mode: this.scene.gameMode
      })
      return
    }
    
    // Check failure (classic mode only)
    if (this.selectedGameMode === 'classic' && this.currentMoves >= levelConfig.maxMoves.value && !this.levelComplete) {
      this.gameOver = true
      this.scene.sound.play('game_over', { volume: 0.5 })
      
      this.scene.updatePlayerStats(false)
      
      if (this.scene.gameMode === 'online') {
        const multiplayerService = this.scene.registry.get('multiplayerService')
        if (multiplayerService) {
          multiplayerService.sendGameEnd('lose')
        }
      }
      
      this.scene.scene.launch('GameOverScene', {
        score: this.score,
        moves: this.currentMoves,
        mode: this.scene.gameMode
      })
    }
  }

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
}
