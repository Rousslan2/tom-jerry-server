import Phaser from 'phaser'
import { gameConfig, audioConfig } from '../gameConfig.json'

export class GameEvents {
  constructor(scene) {
    this.scene = scene
    this.obstacleSpawnTimer = null
    this.tomEventTimer = null
    this.periodicMatchTimer = null
    this.noMovesTimer = null
  }

  // Start obstacle spawn timer
  startObstacleSpawnTimer() {
    const minDelay = gameConfig.obstacleFirstSpawnDelayMin.value * 1000
    const maxDelay = gameConfig.obstacleFirstSpawnDelayMax.value * 1000
    const initialDelay = Phaser.Math.Between(minDelay, maxDelay)

    console.log(`🎬 First obstacle will spawn in ${initialDelay / 1000} seconds`)

    this.scene.time.delayedCall(initialDelay, () => {
      this.spawnRandomObstacle()

      const minInterval = gameConfig.obstacleSpawnIntervalMin.value * 1000
      const maxInterval = gameConfig.obstacleSpawnIntervalMax.value * 1000

      this.obstacleSpawnTimer = this.scene.time.addEvent({
        delay: Phaser.Math.Between(minInterval, maxInterval),
        callback: () => {
          this.spawnRandomObstacle()
          this.obstacleSpawnTimer.delay = Phaser.Math.Between(minInterval, maxInterval)
          console.log(`⏰ Next obstacle in ${this.obstacleSpawnTimer.delay / 1000} seconds`)
        },
        loop: true
      })
    })
  }

  // Spawn random obstacle
  spawnRandomObstacle() {
    if (this.scene.gameOver || this.scene.levelComplete) {
      return
    }

    const obstacles = ['anvil_obstacle', 'safe_obstacle', 'piano_obstacle']
    const obstacleType = obstacles[Phaser.Math.Between(0, obstacles.length - 1)]

    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value

    const availableSlots = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.scene.gridData[row][col]
        if (gridCell.positions.some(pos => pos === null)) {
          availableSlots.push({ row, col })
        }
      }
    }

    if (availableSlots.length === 0) {
      console.log('⚠️ No available slots for obstacle spawn')
      return
    }

    const targetSlot = availableSlots[Phaser.Math.Between(0, availableSlots.length - 1)]
    const success = this.scene.logic.addItemToSlot(targetSlot.row, targetSlot.col, obstacleType)

    if (success) {
      console.log(`🎬 ${obstacleType} spawned from sky at (${targetSlot.row}, ${targetSlot.col})`)
    }
  }

  // Start Tom event timer
  startTomEventTimer() {
    const minDelay = gameConfig.tomEventFirstDelayMin.value * 1000
    const maxDelay = gameConfig.tomEventFirstDelayMax.value * 1000
    const initialDelay = Phaser.Math.Between(minDelay, maxDelay)

    console.log(`🎪 First Tom event will happen in ${initialDelay / 1000} seconds`)

    this.scene.time.delayedCall(initialDelay, () => {
      this.triggerRandomTomEvent()

      const minInterval = gameConfig.tomEventIntervalMin.value * 1000
      const maxInterval = gameConfig.tomEventIntervalMax.value * 1000

      this.tomEventTimer = this.scene.time.addEvent({
        delay: Phaser.Math.Between(minInterval, maxInterval),
        callback: () => {
          this.triggerRandomTomEvent()
          this.tomEventTimer.delay = Phaser.Math.Between(minInterval, maxInterval)
          console.log(`⏰ Next Tom event in ${this.tomEventTimer.delay / 1000} seconds`)
        },
        loop: true
      })
    })
  }

  // Trigger random Tom event
  triggerRandomTomEvent() {
    if (this.scene.gameOver || this.scene.levelComplete) {
      return
    }

    const randomValue = Math.random() * 100

    if (randomValue < 50) {
      this.tomJerryChaseEvent()
    } else if (randomValue < 75) {
      this.tomDropsObstaclesEvent()
    } else {
      this.tomShakesScreenEvent()
    }
  }

  // Tom & Jerry chase event
  tomJerryChaseEvent() {
    console.log('🏃 Tom & Jerry chase event!')

    const screenWidth = this.scene.cameras.main.width
    const screenHeight = this.scene.cameras.main.height
    const yPosition = Phaser.Math.Between(screenHeight * 0.3, screenHeight * 0.7)

    // Jerry runs first
    const jerry = this.scene.add.image(-150, yPosition, 'jerry_running_scared')
      .setDepth(10000)
      .setScale(0.15)

    this.scene.effects.applyHighQualityRendering(jerry)

    this.scene.tweens.add({
      targets: jerry,
      x: screenWidth + 150,
      duration: 2500,
      ease: 'Linear',
      onComplete: () => jerry.destroy()
    })

    this.scene.sound.play('whoosh_fast', { volume: audioConfig.sfxVolume.value })

    // Tom chases 400ms later
    this.scene.time.delayedCall(400, () => {
      const tom = this.scene.add.image(-150, yPosition, 'tom_chasing_jerry')
        .setDepth(10000)
        .setScale(0.15)

      this.scene.effects.applyHighQualityRendering(tom)

      this.scene.tweens.add({
        targets: tom,
        x: screenWidth + 150,
        duration: 2500,
        ease: 'Linear',
        onComplete: () => tom.destroy()
      })

      this.scene.sound.play('tom_running_footsteps', { volume: audioConfig.sfxVolume.value * 0.7 })
      this.scene.effects.createDustTrail(yPosition)
    })
  }

  // Tom drops obstacles event
  tomDropsObstaclesEvent() {
    console.log('🎬 Tom drops obstacles event!')

    const screenWidth = this.scene.cameras.main.width

    const tom = this.scene.add.image(screenWidth / 2, -150, 'tom_carrying_sack')
      .setDepth(10000)
      .setScale(0.2)

    this.scene.effects.applyHighQualityRendering(tom)

    this.scene.tweens.add({
      targets: tom,
      y: 100,
      duration: 800,
      ease: 'Bounce.easeOut'
    })

    this.scene.time.delayedCall(500, () => {
      this.scene.sound.play('tom_evil_laugh', { volume: audioConfig.sfxVolume.value })
    })

    this.scene.time.delayedCall(1500, () => {
      tom.setTexture('tom_tripping')
      tom.setRotation(-0.3)

      this.scene.tweens.add({
        targets: tom,
        y: this.scene.cameras.main.height + 150,
        rotation: Math.PI * 2,
        duration: 1000,
        ease: 'Cubic.easeIn',
        onComplete: () => tom.destroy()
      })

      this.scene.time.delayedCall(800, () => {
        this.scene.sound.play('tom_crash_fall', { volume: audioConfig.sfxVolume.value })
      })

      const obstacleCount = Phaser.Math.Between(2, 3)
      for (let i = 0; i < obstacleCount; i++) {
        this.scene.time.delayedCall(i * 300, () => {
          this.spawnRandomObstacle()
        })
      }
    })
  }

  // Tom shakes screen event
  tomShakesScreenEvent() {
    console.log('🌍 Tom shakes screen event!')

    const screenWidth = this.scene.cameras.main.width

    const tom = this.scene.add.image(screenWidth * 0.8, -150, 'tom_with_hammer')
      .setDepth(10000)
      .setScale(0.18)

    this.scene.effects.applyHighQualityRendering(tom)

    this.scene.tweens.add({
      targets: tom,
      y: 120,
      duration: 600,
      ease: 'Back.easeOut'
    })

    this.scene.time.delayedCall(1000, () => {
      this.scene.tweens.add({
        targets: tom,
        scaleY: 0.22,
        scaleX: 0.16,
        duration: 100,
        yoyo: true,
        repeat: 2
      })

      this.scene.cameras.main.shake(2000, 0.01)
      this.scene.sound.play('screen_shake_rumble', { volume: audioConfig.sfxVolume.value })

      // All items vibrate
      this.scene.gridSlots.forEach((row, rowIndex) => {
        row.forEach((slot, colIndex) => {
          const gridCell = this.scene.gridData[rowIndex][colIndex]
          if (gridCell && gridCell.items && gridCell.items.length > 0) {
            gridCell.items.forEach((item) => {
              this.scene.tweens.add({
                targets: item,
                x: item.x + Phaser.Math.Between(-5, 5),
                y: item.y + Phaser.Math.Between(-5, 5),
                duration: 50,
                yoyo: true,
                repeat: 40,
                ease: 'Sine.easeInOut'
              })
            })
          }
        })
      })

      this.scene.time.delayedCall(2500, () => {
        this.scene.tweens.add({
          targets: tom,
          y: -150,
          alpha: 0,
          duration: 500,
          ease: 'Back.easeIn',
          onComplete: () => tom.destroy()
        })
      })
    })
  }

  // Start periodic match checker
  startPeriodicMatchChecker() {
    this.periodicMatchTimer = this.scene.time.addEvent({
      delay: 3000,
      callback: () => {
        if (!this.scene.gameOver && !this.scene.levelComplete) {
          this.scanAllSlotsForMissedMatches()
        }
      },
      loop: true
    })
    console.log('🔍 Periodic match checker started (every 3 seconds)')
  }

  // Scan for missed matches
  scanAllSlotsForMissedMatches() {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value

    let missedMatches = 0

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.scene.gridData[row][col]

        if (gridCell.items.length !== gridCell.positions.filter(p => p !== null).length) {
          console.warn(`🔄 Auto-resync (${row},${col}): items=${gridCell.items.length}, positions=${gridCell.positions.filter(p => p !== null).length}`)
          this.scene.logic.resyncGridCell(row, col)
        }

        const positions = gridCell.positions
        const allPositionsFilled = positions.every(pos => pos !== null)

        if (allPositionsFilled) {
          const firstItemType = positions[0]
          const allSameType = positions.every(pos => pos === firstItemType)

          if (allSameType && !gridCell.isEliminating) {
            missedMatches++
            console.log(`🎯 MISSED MATCH DETECTED at (${row},${col}): 3x ${firstItemType} - Auto-eliminating!`)

            this.scene.time.delayedCall(missedMatches * 200, () => {
              this.scene.logic.eliminateItems(row, col, firstItemType)
            })
          }
        }
      }
    }

    if (missedMatches > 0) {
      console.log(`✅ Periodic scan found ${missedMatches} missed match(es) - Fixed!`)
    }
  }

  // Start no-moves detection
  startNoMovesDetection() {
    this.noMovesTimer = this.scene.time.addEvent({
      delay: 5000,
      callback: () => {
        this.checkForPossibleMoves()
      },
      loop: true
    })
  }

  // Check for possible moves
  checkForPossibleMoves() {
    if (this.scene.gameOver || this.scene.levelComplete) {
      return
    }

    const itemCounts = {}

    this.scene.gridSlots.forEach((row, rowIndex) => {
      row.forEach((slot, colIndex) => {
        const gridCell = this.scene.gridData[rowIndex][colIndex]
        if (gridCell && gridCell.items) {
          gridCell.items.forEach((item) => {
            const itemType = item.itemType
            if (itemType !== 'anvil_obstacle' && itemType !== 'safe_obstacle' && itemType !== 'piano_obstacle') {
              itemCounts[itemType] = (itemCounts[itemType] || 0) + 1
            }
          })
        }
      })
    })

    let hasPossibleMatch = false
    for (let itemType in itemCounts) {
      if (itemCounts[itemType] >= 3) {
        hasPossibleMatch = true
        break
      }
    }

    if (!hasPossibleMatch) {
      console.log('🚨 NO POSSIBLE MOVES DETECTED! Adding helpful items...')
      this.addHelpfulItems()
    }
  }

  // Add helpful items when stuck
  addHelpfulItems() {
    const targetTypes = this.scene.levelTargets.map(t => t.type)
    const helpItemType = targetTypes[Phaser.Math.Between(0, targetTypes.length - 1)]

    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value

    const emptyPositions = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.scene.gridData[row][col]
        for (let posIndex = 0; posIndex < 3; posIndex++) {
          if (gridCell.positions[posIndex] === null) {
            emptyPositions.push({ row, col, posIndex })
          }
        }
      }
    }

    Phaser.Utils.Array.Shuffle(emptyPositions)
    const positionsToFill = emptyPositions.slice(0, 3)

    positionsToFill.forEach((pos, index) => {
      this.scene.time.delayedCall(index * 200, () => {
        const slot = this.scene.gridSlots[pos.row][pos.col]
        const gridCell = this.scene.gridData[pos.row][pos.col]

        const item = this.scene.add.image(slot.x, -100, helpItemType)
          .setScale(0)
          .setAlpha(0)

        item.setInteractive({ draggable: true })

        if (this.scene.mobileHelper) {
          this.scene.mobileHelper.enhanceDragAndDrop(item)
        }

        this.scene.effects.applyTomJerryItemEnhancement(item)

        const offset = slot.positionOffsets[pos.posIndex]
        item.setDepth(100 + pos.posIndex)
        this.scene.effects.applyHighQualityRendering(item)

        item.setTint(0xFFD700)

        this.scene.tweens.add({
          targets: item,
          y: slot.y + offset.y,
          x: slot.x + offset.x,
          scale: 0.075,
          alpha: 1,
          duration: 600,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.scene.tweens.add({
              targets: item,
              alpha: 0.5,
              duration: 200,
              yoyo: true,
              repeat: 3,
              onComplete: () => {
                item.clearTint()
              }
            })
          }
        })

        item.itemType = helpItemType
        item.gridRow = pos.row
        item.gridCol = pos.col
        item.positionIndex = pos.posIndex

        gridCell.positions[pos.posIndex] = helpItemType
        gridCell.items.push(item)

        this.scene.updatePositionIndicator(pos.row, pos.col, pos.posIndex, helpItemType)
      })
    })

    this.scene.ui.showHelpMessage("✨ TOM HELPED YOU! ✨")
    this.scene.sound.play('item_pickup', { volume: audioConfig.sfxVolume.value })
  }

  // Unlock adjacent obstacles
  unlockAdjacentObstacles(row, col) {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ]

    directions.forEach(([dRow, dCol]) => {
      const adjRow = row + dRow
      const adjCol = col + dCol

      if (adjRow >= 0 && adjRow < rows && adjCol >= 0 && adjCol < cols) {
        const adjCell = this.scene.gridData[adjRow][adjCol]

        adjCell.items.forEach((item, index) => {
          if (item.itemType === 'anvil_obstacle' || item.itemType === 'safe_obstacle' || item.itemType === 'piano_obstacle') {
            this.unlockObstacle(item, adjRow, adjCol, index)
          }
        })
      }
    })
  }

  // Unlock single obstacle
  unlockObstacle(item, row, col, position) {
    const oldType = item.itemType
    const newItemType = this.scene.logic.itemTypes[Phaser.Math.Between(0, this.scene.logic.itemTypes.length - 1)]

    this.scene.tweens.add({
      targets: item,
      scale: 0.09,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        item.setTexture(newItemType)
        item.itemType = newItemType
        item.clearTint()
        item.setInteractive({ draggable: true })

        if (this.scene.mobileHelper) {
          this.scene.mobileHelper.enhanceDragAndDrop(item)
        }

        this.scene.gridData[row][col].positions[position] = newItemType
        this.scene.effects.applyTomJerryItemEnhancement(item)

        const sparkles = ['✨', '💫', '⭐', '🌟']
        for (let i = 0; i < 5; i++) {
          const sparkle = this.scene.add.text(item.x, item.y, sparkles[Math.floor(Math.random() * sparkles.length)], {
            fontSize: '20px',
            color: '#FFD700'
          }).setOrigin(0.5, 0.5).setDepth(10000)

          this.scene.tweens.add({
            targets: sparkle,
            y: sparkle.y - 30,
            alpha: 0,
            duration: 600,
            delay: i * 100,
            onComplete: () => sparkle.destroy()
          })
        }
      }
    })

    this.scene.sound.play('item_drop', { volume: audioConfig.sfxVolume.value })
  }

  // Cleanup timers
  shutdown() {
    if (this.obstacleSpawnTimer) {
      this.obstacleSpawnTimer.remove()
      this.obstacleSpawnTimer = null
    }

    if (this.tomEventTimer) {
      this.tomEventTimer.remove()
      this.tomEventTimer = null
    }

    if (this.periodicMatchTimer) {
      this.periodicMatchTimer.remove()
      this.periodicMatchTimer = null
    }

    if (this.noMovesTimer) {
      this.noMovesTimer.remove()
      this.noMovesTimer = null
    }
  }
}