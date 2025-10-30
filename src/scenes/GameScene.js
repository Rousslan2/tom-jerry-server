import Phaser from 'phaser'
import { screenSize, gameConfig, levelConfig, audioConfig } from '../gameConfig.json'
import { multiplayerService } from '../services/MultiplayerService.js'
import { MobileEnhancements } from '../utils/MobileEnhancements.js'
import { AnimationManager } from '../utils/AnimationManager.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.initializeGameState()
  }

  // Initialize or reset game state
  initializeGameState() {
    // Game mode
    this.gameMode = 'single' // 'single' or 'online'
    this.isHost = false
    
    // 🎮 NEW: Game mode type (classic, time_attack, endless, zen, cascade)
    this.selectedGameMode = 'classic'
    
    // 🎯 NOTE: Random targets will be generated AFTER gameMode is set in init()
    
    // Game state
    this.gameOver = false
    this.levelComplete = false
    this.currentMoves = 0
    
    // ⏱️ NEW: Timer for Time Attack mode
    this.gameTimer = null
    this.timeRemaining = 120 // 2 minutes in seconds
    
    // Grid system
    this.gridData = []
    this.gridSlots = []
    
    // Drag system
    this.selectedItem = null
    this.isDragging = false
    
    // ⭐ NEW: Score & Combo System
    this.score = 0
    this.combo = 0
    this.comboTimer = null
    this.comboResetDelay = 2000 // Reset combo after 2 seconds of no elimination
    this.lastEliminationTime = 0

    // 💡 Hint System - Limited to 3 hints per game
    this.hintsUsed = 0
    this.maxHints = 3
    
    // Opponent stats (for online mode)
    this.opponentStats = {
      'milk_box': 0,
      'chips_bag': 0,
      'cola_bottle': 0
    }
    
    // Item type mapping - BEAUCOUP PLUS D'ITEMS ! 🎨
    this.itemTypes = [
      // Original items
      'milk_box',
      'chips_bag', 
      'cola_bottle',
      'cookie_box',
      'detergent_bottle',
      'tissue_pack',
      'toothpaste',
      'bread',
      'towel',
      // NEW: More variety! 🌟
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

  // 🎯 Generate random level targets from available items
  generateRandomTargets() {
    const possibleTargets = levelConfig.possibleTargets.value
    const targetCounts = levelConfig.targetCounts.value
    
    // 🌐 In online mode, synchronize targets between players!
    let shuffled
    if (this.gameMode === 'online' && this.isHost) {
      // Host generates and stores targets
      shuffled = Phaser.Utils.Array.Shuffle([...possibleTargets])
      const targetTypes = [shuffled[0], shuffled[1], shuffled[2]]
      localStorage.setItem('currentRoomTargets', JSON.stringify(targetTypes))
      console.log('🎯 Host generated targets:', targetTypes)
    } else if (this.gameMode === 'online' && !this.isHost) {
      // Guest uses the same targets as host
      const storedTargets = localStorage.getItem('currentRoomTargets')
      if (storedTargets) {
        const targetTypes = JSON.parse(storedTargets)
        shuffled = [...targetTypes, ...possibleTargets.filter(t => !targetTypes.includes(t))]
        console.log('🎯 Guest loaded targets:', targetTypes)
      } else {
        // Fallback if storage failed
        shuffled = Phaser.Utils.Array.Shuffle([...possibleTargets])
      }
    } else {
      // Single player mode - random selection
      shuffled = Phaser.Utils.Array.Shuffle([...possibleTargets])
    }
    
    this.levelTargets = [
      { type: shuffled[0], count: targetCounts[0] },
      { type: shuffled[1], count: targetCounts[1] },
      { type: shuffled[2], count: targetCounts[2] }
    ]
    
    console.log('🎯 Final Random Targets:', this.levelTargets)
  }

  // Receive scene startup parameters
  init(data) {
    // Always reinitialize game state when scene starts
    this.initializeGameState()
    
    // Set game mode (single/online)
    if (data && data.mode) {
      this.gameMode = data.mode
      this.isHost = data.isHost || false
    }
    
    // 🎮 NEW: Set game mode type (classic/time_attack/endless/zen)
    if (data && data.gameMode) {
      this.selectedGameMode = data.gameMode
      console.log('🎮 Game Mode:', this.selectedGameMode)
    }
    
    // 🎯 NOW generate random targets AFTER gameMode is set!
    this.generateRandomTargets()
  }

  preload() {
    // Resources are now loaded in LoadingScene via asset-pack.json, no need to load any resources here
  }

  create() {
    // 🎬 Initialize Animation Manager FIRST!
    this.animManager = new AnimationManager(this)
    console.log('✅ AnimationManager initialized!')
    
    // 🎵 Stop ALL other scene music to prevent overlap!
    this.stopAllOtherMusic()
    
    // Stop title scene music if playing
    const titleScene = this.scene.get('TitleScene')
    if (titleScene && titleScene.backgroundMusic && titleScene.backgroundMusic.isPlaying) {
      titleScene.backgroundMusic.stop()
    }
    
    // 📱 Initialize Mobile Enhancements
    this.mobileHelper = new MobileEnhancements(this)
    this.isMobile = this.mobileHelper.isMobile
    
    // Show mobile tutorial on first launch
    if (this.isMobile) {
      this.time.delayedCall(500, () => {
        this.mobileHelper.showMobileTutorial()
      })
      console.log('📱 Mobile mode activated - Touch controls enhanced')
    }
    
    this.createBackground()
    this.createShelf()
    this.initializeGrid()
    this.createUI()
    this.setupInputs()
    this.playBackgroundMusic()
    
    // Initialize shelf items
    this.populateInitialItems()
    
    // Setup multiplayer if in online mode
    if (this.gameMode === 'online') {
      this.setupMultiplayerSync()
    }
    
    // ⏱️ Start timer for Time Attack mode
    if (this.selectedGameMode === 'time_attack') {
      this.startGameTimer()
    }
    
    // 🎬 Start obstacle spawn timer - spawn Tom & Jerry obstacles regularly
    this.startObstacleSpawnTimer()
    
    // 🎪 Start Tom random event timer - Tom causes chaos!
    this.startTomEventTimer()
    
    // 🔍 Start periodic match checker - detect missed matches every 3 seconds
    this.startPeriodicMatchChecker()

    // 🔧 CRITICAL FIX: Also do an immediate scan after ALL initial population is complete
    this.time.delayedCall(1500, () => {
      if (!this.gameOver && !this.levelComplete) {
        console.log('🔍 Performing comprehensive initial match scan after full population...')
        this.scanAllSlotsForMissedMatches()
      }
    })
  }

  createBackground() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Create 80s Tom and Jerry retro cartoon style background environment
    
    // Create gray-toned retro cartoon background
    this.backgroundGraphics = this.add.graphics()
    
    // 80s retro cartoon background effect - gray tone
    this.backgroundGraphics.fillStyle(0x808080, 1) // Pure gray background, fits 80s cartoon style
    this.backgroundGraphics.fillRect(0, 0, screenWidth, screenHeight)
    this.backgroundGraphics.setDepth(-200)
    
    // Add Tom and Jerry retro cartoon style decorative effects
    this.backgroundWalls = this.add.graphics()
    
    // Simple black and white border decoration, fits 80s cartoon style
    this.backgroundWalls.lineStyle(6, 0x000000, 0.3) // Thick black border
    this.backgroundWalls.strokeRoundedRect(20, 20, screenWidth - 40, screenHeight - 40, 15)
    
    // Inner white border
    this.backgroundWalls.lineStyle(3, 0xFFFFFF, 0.4) // White inner border
    this.backgroundWalls.strokeRoundedRect(30, 30, screenWidth - 60, screenHeight - 60, 10)
    
    this.backgroundWalls.setDepth(-150)
    
    // Randomly select a Tom and Jerry classic scene background
    const tomJerryBackgrounds = [
      'tom_jerry_kitchen_background',
      'tom_jerry_living_room_background', 
      'tom_jerry_garden_background',
      'tom_jerry_basement_background'
    ]
    
    // In multiplayer mode, synchronize the same background
    let selectedBackground
    if (this.gameMode === 'online' && this.isHost) {
      // Host selects and stores the background
      selectedBackground = tomJerryBackgrounds[Phaser.Math.Between(0, tomJerryBackgrounds.length - 1)]
      localStorage.setItem('currentRoomBackground', selectedBackground)
    } else if (this.gameMode === 'online' && !this.isHost) {
      // Guest uses the same background as host
      selectedBackground = localStorage.getItem('currentRoomBackground') || tomJerryBackgrounds[0]
    } else {
      // Single player mode - random selection
      selectedBackground = tomJerryBackgrounds[Phaser.Math.Between(0, tomJerryBackgrounds.length - 1)]
    }
    
    // Try to load the selected Tom and Jerry background scene
    if (this.textures.exists(selectedBackground)) {
      try {
        this.backgroundImage = this.add.image(screenWidth / 2, screenHeight / 2, selectedBackground)
        
        // Calculate appropriate scale ratio
        const scaleX = screenWidth / 1536
        const scaleY = screenHeight / 1024
        const scale = Math.max(scaleX, scaleY)
        
        this.backgroundImage.setScale(scale)
        this.backgroundImage.setDepth(-100) // Above the gray background
        this.backgroundImage.setAlpha(0.8) // Increase transparency to make Tom and Jerry scene more clearly visible
        
        // Adjust gray background tone based on different scenes
        this.adjustBackgroundForScene(selectedBackground)
        
      } catch (error) {
        // If loading fails, use fallback design
      }
    }
    
    // Add Tom and Jerry style decorative touches
    this.backgroundOverlay = this.add.graphics()
    // Draw some simple decorative dots, fits 80s cartoon style
    this.backgroundOverlay.fillStyle(0xFFFFFF, 0.1) // White decorative dots
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, screenWidth - 50)
      const y = Phaser.Math.Between(50, screenHeight - 50)
      this.backgroundOverlay.fillCircle(x, y, Phaser.Math.Between(3, 8))
    }
    this.backgroundOverlay.setDepth(-50)
  }

  // Adjust background tone based on different Tom and Jerry scenes
  adjustBackgroundForScene(sceneName) {
    // Set appropriate background tones for different scenes to enhance atmosphere
    let backgroundColor = 0x808080 // Default gray
    
    switch(sceneName) {
      case 'tom_jerry_kitchen_background':
        backgroundColor = 0x8B7355 // Warm kitchen brown tone
        break
      case 'tom_jerry_living_room_background':
        backgroundColor = 0x6B8E8E // Comfortable living room blue-gray tone
        break
      case 'tom_jerry_garden_background':
        backgroundColor = 0x7B8B6B // Natural garden green tone
        break
      case 'tom_jerry_basement_background':
        backgroundColor = 0x696969 // Mysterious basement dark gray tone
        break
    }
    
    // Reset background color
    this.backgroundGraphics.clear()
    this.backgroundGraphics.fillStyle(backgroundColor, 1)
    this.backgroundGraphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)
    
    // Add scene-specific prompt text
    this.addSceneLabel(sceneName)
  }

  // Add scene label
  addSceneLabel(sceneName) {
    const sceneLabels = {
      'tom_jerry_kitchen_background': '🍽️ KITCHEN CHAOS',
      'tom_jerry_living_room_background': '🛋️ LIVING ROOM MAYHEM', 
      'tom_jerry_garden_background': '🌻 GARDEN ADVENTURE',
      'tom_jerry_basement_background': '🕳️ BASEMENT MYSTERY'
    }
    
    const label = sceneLabels[sceneName] || '🏠 TOM & JERRY HOUSE'
    
    // Check if mobile
    const isMobile = window.isMobileDevice || false
    
    // Display scene label in bottom right corner
    this.sceneLabel = this.add.text(this.cameras.main.width - 20, this.cameras.main.height - 20, label, {
      fontSize: `${window.getResponsiveFontSize(14)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: isMobile ? 4 : 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(1, 1).setDepth(1900) // Below UI layer
    
    // Add fade-in animation
    this.sceneLabel.setAlpha(0)
    this.tweens.add({
      targets: this.sceneLabel,
      alpha: 0.8,
      duration: 1000,
      ease: 'Power2.easeOut'
    })
  }



  createShelf() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // No longer create full-screen background rectangle, let supermarket background be visible
    // this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0xf5f5f5)
    
    // Record actual size and position of grid area
    this.shelfBounds = {
      x: 0,
      y: 0,
      width: screenWidth,
      height: screenHeight
    }
  }

  drawGridLines(startX, startY, gridWidth, gridHeight, rows, cols, slotWidth, slotHeight, slotSpacing) {
    const graphics = this.add.graphics()
    
    // Draw cartoon-style wooden shelf
    this.drawCartoonWoodenShelf(graphics, startX, startY, gridWidth, gridHeight, rows, cols, slotWidth, slotHeight, slotSpacing)
    
    graphics.setDepth(50) // Ensure shelf is above background but below items
  }

  drawCartoonWoodenShelf(graphics, startX, startY, gridWidth, gridHeight, rows, cols, slotWidth, slotHeight, slotSpacing) {
    // Wooden material color series
    const woodColors = {
      light: 0xDEB887,    // Light wood color
      medium: 0xCD853F,   // Medium wood color  
      dark: 0x8B4513,     // Dark wood color
      shadow: 0x654321,   // Shadow color
      highlight: 0xF5DEB3 // Highlight color
    }
    
    // 1. Draw shelf main background (reduce transparency to let background show through)
    graphics.fillStyle(0xFAFAFA, 0.3) // Significantly reduce main background transparency
    graphics.fillRoundedRect(startX - 15, startY - 15, gridWidth + 30, gridHeight + 30, 12)
    
    // 2. Draw shelf frame decoration
    this.drawShelfFrame(graphics, startX, startY, gridWidth, gridHeight, woodColors)
    
    // 3. Draw wooden background for each shelf slot (with spacing)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (slotWidth + slotSpacing)
        const y = startY + row * (slotHeight + slotSpacing)
        this.drawWoodenSlot(graphics, x, y, slotWidth, slotHeight, woodColors)
      }
    }
    
    // 4. Draw shelf divider boards (horizontal) - modern supermarket shelf style (with spacing)
    graphics.fillStyle(0xE0E0E0, 0.5) // Reduce divider board transparency
    for (let row = 0; row <= rows; row++) {
      const y = startY + row * (slotHeight + slotSpacing) - 4 - (row > 0 ? slotSpacing : 0)
      graphics.fillRoundedRect(startX - 10, y, gridWidth + 20, 8, 4)
      
      // Add metallic texture effect
      graphics.fillStyle(0xF0F0F0, 0.3) // Reduce highlight transparency
      graphics.fillRect(startX - 8, y + 1, gridWidth + 16, 2)
      graphics.fillStyle(0xD0D0D0, 0.2) // Reduce shadow transparency
      graphics.fillRect(startX - 8, y + 5, gridWidth + 16, 1)
      graphics.fillStyle(0xE0E0E0, 0.5) // Restore main color
    }
    
    // 5. Draw shelf divider boards (vertical) - modern supermarket shelf style (with spacing)
    for (let col = 0; col <= cols; col++) {
      const x = startX + col * (slotWidth + slotSpacing) - 4 - (col > 0 ? slotSpacing : 0)
      graphics.fillRoundedRect(x, startY - 10, 8, gridHeight + 20, 4)
      
      // Add metallic texture effect
      graphics.fillStyle(0xF0F0F0, 0.3) // Reduce highlight transparency
      graphics.fillRect(x + 1, startY - 8, 2, gridHeight + 16)
      graphics.fillStyle(0xD0D0D0, 0.2) // Reduce shadow transparency
      graphics.fillRect(x + 5, startY - 8, 1, gridHeight + 16)
      graphics.fillStyle(0xE0E0E0, 0.5) // Restore main color
    }
    
    // 6. Draw decorative metal corner irons
    this.drawMetalCorners(graphics, startX, startY, gridWidth, gridHeight)
  }

  drawShelfFrame(graphics, startX, startY, gridWidth, gridHeight, woodColors) {
    // Draw 3D effect on frame edges
    const frameWidth = 12
    
    // Frame highlight
    graphics.fillStyle(woodColors.highlight, 0.4) // Reduce highlight transparency
    graphics.fillRoundedRect(startX - frameWidth, startY - frameWidth, gridWidth + frameWidth * 2, frameWidth, 5)
    graphics.fillRoundedRect(startX - frameWidth, startY - frameWidth, frameWidth, gridHeight + frameWidth * 2, 5)
    
    // Frame shadow
    graphics.fillStyle(woodColors.shadow, 0.3) // Reduce shadow transparency
    graphics.fillRoundedRect(startX - frameWidth, startY + gridHeight, gridWidth + frameWidth * 2, frameWidth, 5)
    graphics.fillRoundedRect(startX + gridWidth, startY - frameWidth, frameWidth, gridHeight + frameWidth * 2, 5)
  }

  drawWoodenSlot(graphics, x, y, width, height, woodColors) {
    // Draw modern supermarket background for slots (reduce transparency to let background show faintly)
    graphics.fillStyle(0xFFFFFE, 0.4) // Reduce transparency to 40%, let background show faintly
    graphics.fillRect(x + 2, y + 2, width - 4, height - 4)
    
    // Add subtle grid line effect
    graphics.fillStyle(0xF0F0F0, 0.2) // Accordingly reduce grid line transparency
    // Horizontal thin lines
    const lineY = y + height / 2
    graphics.fillRect(x + 4, lineY, width - 8, 1)
    
    // Add subtle shadow effect inside slots
    graphics.fillStyle(0xEEEEEE, 0.3) // Accordingly reduce shadow transparency
    graphics.fillRect(x + 2, y + 2, width - 4, 2) // Top light shadow
    graphics.fillRect(x + 2, y + 2, 2, height - 4) // Left light shadow
  }

  drawMetalCorners(graphics, startX, startY, gridWidth, gridHeight) {
    // Draw metal decoration on four corners
    const metalColor = 0x708090 // Slate gray color
    const cornerSize = 20
    
    graphics.fillStyle(metalColor, 0.4) // Reduce metal corner iron transparency
    
    // Top left corner
    graphics.fillTriangle(
      startX - 15, startY - 15,
      startX - 15 + cornerSize, startY - 15,
      startX - 15, startY - 15 + cornerSize
    )
    
    // Top right corner
    graphics.fillTriangle(
      startX + gridWidth + 15, startY - 15,
      startX + gridWidth + 15 - cornerSize, startY - 15,
      startX + gridWidth + 15, startY - 15 + cornerSize
    )
    
    // Bottom left corner
    graphics.fillTriangle(
      startX - 15, startY + gridHeight + 15,
      startX - 15 + cornerSize, startY + gridHeight + 15,
      startX - 15, startY + gridHeight + 15 - cornerSize
    )
    
    // Bottom right corner
    graphics.fillTriangle(
      startX + gridWidth + 15, startY + gridHeight + 15,
      startX + gridWidth + 15 - cornerSize, startY + gridHeight + 15,
      startX + gridWidth + 15, startY + gridHeight + 15 - cornerSize
    )
    
    // Add metallic sheen effect
    graphics.fillStyle(0xC0C0C0, 0.2) // Reduce silver highlight transparency
    graphics.fillCircle(startX - 10, startY - 10, 3)
    graphics.fillCircle(startX + gridWidth + 10, startY - 10, 3)
    graphics.fillCircle(startX - 10, startY + gridHeight + 10, 3)
    graphics.fillCircle(startX + gridWidth + 10, startY + gridHeight + 10, 3)
  }

  initializeGrid() {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
    // Calculate grid parameters to fully utilize screen space
    // Reserve top and bottom space for UI elements (fewer slots, reserve more space to make slots larger)
    const uiTopSpace = 160   // Reserve space for target display and counters
    const uiBottomSpace = 80 // Reserve space for bottom  
    const uiSideSpace = 120  // More space on sides for 3x4 grid (was 60)
    
    const gridWidth = this.shelfBounds.width - (uiSideSpace * 2)
    const gridHeight = this.shelfBounds.height - uiTopSpace - uiBottomSpace
    
    // Add spacing between slots for better visibility
    const slotSpacing = 20  // Space between slots
    
    // Calculate slot size with spacing
    const slotWidth = (gridWidth - (cols - 1) * slotSpacing) / cols
    const slotHeight = (gridHeight - (rows - 1) * slotSpacing) / rows
    
    const startX = this.shelfBounds.x + uiSideSpace
    const startY = this.shelfBounds.y + uiTopSpace
    
    // Draw grid lines
    this.drawGridLines(startX, startY, gridWidth, gridHeight, rows, cols, slotWidth, slotHeight, slotSpacing)
    
    // Initialize grid data
    this.gridData = []
    this.gridSlots = []
    
    for (let row = 0; row < rows; row++) {
      this.gridData[row] = []
      this.gridSlots[row] = []
      
      for (let col = 0; col < cols; col++) {
        // Initialize slots, each slot has three independent positions
        this.gridData[row][col] = {
          positions: [null, null, null], // Three positions, null means empty position
          items: [] // Actual item sprite references
        }
        
        // Create slot visual elements (with spacing between slots)
        const slotX = startX + col * (slotWidth + slotSpacing) + slotWidth / 2
        const slotY = startY + row * (slotHeight + slotSpacing) + slotHeight / 2
        
        // Create transparent slots
        const slot = this.add.rectangle(slotX, slotY, slotWidth, slotHeight, 0xffffff, 0)
        
        // Define offset for three item positions (moderate position within slot, avoid blocking edges)
        const positionOffsets = [
          { x: -slotWidth * 0.25, y: slotHeight * 0.15 },     // Left position (moderate position within slot, avoid blocking edges)
          { x: 0, y: slotHeight * 0.15 },                      // Middle position (moderate position within slot)
          { x: slotWidth * 0.25, y: slotHeight * 0.15 }        // Right position (moderate position within slot, avoid blocking edges)
        ]
        
        // No longer create circular indicators, keep simple line separator design
        const positionIndicators = []
        
        this.gridSlots[row][col] = {
          sprite: slot,
          positionIndicators: positionIndicators,
          x: slotX,
          y: slotY,
          width: slotWidth,
          height: slotHeight,
          positionOffsets: positionOffsets
        }
      }
    }
    
    // Create cat lying above grid
    this.createWatchingCat(startX, startY, gridWidth)
  }
  
  createWatchingCat(startX, startY, gridWidth) {
    const screenWidth = this.cameras.main.width
    
    // Create Tom the Cat (not Jerry the mouse!)
    // Tom (the cat character from Tom and Jerry) watches from above
    const tomCatBaseY = startY + 5 // Position Tom so his paw touches the grid top
    
    this.watchingCat = this.add.image(screenWidth / 2, tomCatBaseY, 'tom_cat_watching')
      .setOrigin(0.5, 1.0) // Set origin at bottom center so Tom's paw touches grid top
      .setScale(0.18) // Smaller scale to fit on screen without overlapping
      .setDepth(85)  // Above grid (50) but below items (100+) and UI (2000+)
    
    // Add breathing animation effect
    this.tweens.add({
      targets: this.watchingCat,
      y: tomCatBaseY + 5, // Move slightly up and down from base position
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    // Randomly add blinking action
    this.time.addEvent({
      delay: 3000, // Every 3 seconds
      callback: () => {
        if (Phaser.Math.Between(0, 10) > 3) { // 70% chance to blink
          // Briefly shrink Y-axis to simulate blinking
          this.tweens.add({
            targets: this.watchingCat,
            scaleY: 0.16,
            duration: 100,
            ease: 'Linear',
            yoyo: true,
            onComplete: () => {
              this.watchingCat.setScale(0.18)
            }
          })
        }
      },
      loop: true
    })
    
    // Occasionally turn head left/right
    this.time.addEvent({
      delay: 5000, // Every 5 seconds
      callback: () => {
        if (Phaser.Math.Between(0, 10) > 5) { // 50% chance to turn head
          const direction = Phaser.Math.Between(0, 1) ? -1 : 1 // Random left/right direction
          
          // Move to one side
          this.tweens.add({
            targets: this.watchingCat,
            x: screenWidth / 2 + (direction * 30),
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            hold: 1000, // Stay for a while
            repeat: 0
          })
        }
      },
      loop: true
    })
  }

  createUI() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Create UI container
    this.uiContainer = this.add.container(0, 0)
    
    // Target display
    this.createTargetDisplay()
    
    // Move counter
    this.createMoveCounter()
    
    // ⭐ NEW: Score display
    this.createScoreDisplay()
    
    // Pause button
    this.createPauseButton()
    
    // Opponent stats (online mode only)
    if (this.gameMode === 'online') {
      this.createOpponentStatsPanel()
    }
  }

  createTargetDisplay() {
    const screenWidth = this.cameras.main.width

    // 🎮 For Zen mode, don't show targets at all - pure relaxation!
    if (this.selectedGameMode === 'zen') {
      return
    }

    // 🎮 For Cascade mode, show special description
    if (this.selectedGameMode === 'cascade') {
      // Create special cascade mode UI
      this.targetBg = this.add.graphics()
      this.targetBg.fillGradientStyle(0x1E90FF, 0x1E90FF, 0x4169E1, 0x4169E1, 0.95)
      this.targetBg.fillRoundedRect(20, 20, screenWidth * 0.3, 120, 20)

      this.targetBg.lineStyle(4, 0xFFFFFF, 0.9)
      this.targetBg.strokeRoundedRect(20, 20, screenWidth * 0.3, 120, 20)
      this.targetBg.setDepth(2000)

      this.targetText = this.add.text(screenWidth * 0.15, 35, '🌊 CASCADE MODE', {
        fontSize: `${window.getResponsiveFontSize(20)}px`,
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(2100)

      const cascadeDesc = this.add.text(screenWidth * 0.15, 80, 'Chain Reactions!\nItems fall & create combos!', {
        fontSize: `${window.getResponsiveFontSize(14)}px`,
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(2100)

      // Add cascade score display
      this.cascadeScoreText = this.add.text(screenWidth * 0.15, 110, 'Cascade: 0 | Max: 0', {
        fontSize: `${window.getResponsiveFontSize(12)}px`,
        fontFamily: window.getGameFont(),
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(2100)

      return
    }

    // Cute target background - cream yellow gradient background
    this.targetBg = this.add.graphics()
    this.targetBg.fillGradientStyle(0xFFFACD, 0xFFFACD, 0xF5DEB3, 0xF5DEB3, 0.95)  // Cream yellow gradient
    this.targetBg.fillRoundedRect(20, 20, screenWidth * 0.3, 120, 20)

    // Add cute border
    this.targetBg.lineStyle(4, 0xFFFFFF, 0.9)
    this.targetBg.strokeRoundedRect(20, 20, screenWidth * 0.3, 120, 20)
    this.targetBg.setDepth(2000) // Ensure UI is on top layer

    // Tom and Jerry themed target text - classic cartoon style
    this.targetText = this.add.text(screenWidth * 0.15, 35, '🧀 TOM & JERRY CHASE 🐭', {
      fontSize: `${window.getResponsiveFontSize(20)}px`,
      fontFamily: window.getGameFont(),  // More cute font
      color: '#8B4513',  // Dark brown text with cream yellow background
      stroke: '#DEB887',  // Light brown stroke
      strokeThickness: 3,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)

    // 🎯 Use random targets!
    const targets = [
      { type: this.levelTargets[0].type, target: this.levelTargets[0].count, x: screenWidth * 0.08 },
      { type: this.levelTargets[1].type, target: this.levelTargets[1].count, x: screenWidth * 0.15 },
      { type: this.levelTargets[2].type, target: this.levelTargets[2].count, x: screenWidth * 0.22 }
    ]

    this.targetDisplays = []

    targets.forEach((target, index) => {
      const icon = this.add.image(target.x, 80, target.type).setScale(0.050).setDepth(2100)  // Adjusted for new optimized assets

      // Apply background removal effect to Tom and Jerry retro cartoon target icons
      this.applyTomJerryItemEnhancement(icon)
      this.applyHighQualityRendering(icon)

      // Add cute blinking effect to icons
      this.tweens.add({
        targets: icon,
        scaleX: 0.050 * 1.1,  // Accordingly adjust blinking effect scale
        scaleY: 0.050 * 1.1,
        duration: 1000 + (index * 200),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      })

      const text = this.add.text(target.x, 115, `${this.eliminatedCounts[target.type]}/${target.target}`, {
        fontSize: `${window.getResponsiveFontSize(16)}px`,
        fontFamily: window.getGameFont(),  // Cute font
        color: '#8B4513',  // Dark brown text with cream yellow background
        stroke: '#DEB887',  // Light brown stroke
        strokeThickness: 2,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(2100)

      this.targetDisplays.push({ icon, text, type: target.type, target: target.target })
    })
  }

  createMoveCounter() {
    const screenWidth = this.cameras.main.width
    
    // 🎮 For Endless/Zen/Cascade mode, show different UI
    if (this.selectedGameMode === 'endless' || this.selectedGameMode === 'zen' || this.selectedGameMode === 'cascade') {
      // Show move count without limit
      this.moveCounterBg = this.add.graphics()
      this.moveCounterBg.fillGradientStyle(0x9370DB, 0x9370DB, 0xBA55D3, 0xBA55D3, 0.95)
      this.moveCounterBg.fillRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)

      this.moveCounterBg.lineStyle(3, 0xFFFFFF, 0.9)
      this.moveCounterBg.strokeRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
      this.moveCounterBg.setDepth(2000)

      let modeIcon = '♾️'
      if (this.selectedGameMode === 'zen') modeIcon = '🏆'
      if (this.selectedGameMode === 'cascade') modeIcon = '🌊'

      this.moveCounterText = this.add.text(screenWidth * 0.8, 50, `${modeIcon} Moves: ${this.currentMoves}`, {
        fontSize: `${window.getResponsiveFontSize(18)}px`,
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#4B0082',
        strokeThickness: 2,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(2100)
      return
    }
    
    // ⏱️ For Time Attack mode, show timer instead
    if (this.selectedGameMode === 'time_attack') {
      this.moveCounterBg = this.add.graphics()
      this.moveCounterBg.fillGradientStyle(0xFF6347, 0xFF6347, 0xFF7F50, 0xFF7F50, 0.95)
      this.moveCounterBg.fillRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
      
      this.moveCounterBg.lineStyle(3, 0xFFFFFF, 0.9)
      this.moveCounterBg.strokeRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
      this.moveCounterBg.setDepth(2000)
      
      this.moveCounterText = this.add.text(screenWidth * 0.8, 50, `⏱️ Time: 2:00`, {
        fontSize: `${window.getResponsiveFontSize(18)}px`,
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#8B0000',
        strokeThickness: 2,
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(2100)
      return
    }
    
    // 🏃 Classic mode - show moves with limit
    this.moveCounterBg = this.add.graphics()
    this.moveCounterBg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xADD8E6, 0xADD8E6, 0.95)
    this.moveCounterBg.fillRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
    
    this.moveCounterBg.lineStyle(3, 0xFFFFFF, 0.9)
    this.moveCounterBg.strokeRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
    this.moveCounterBg.setDepth(2000)
    
    this.moveCounterText = this.add.text(screenWidth * 0.8, 50, `✨ Moves: ${this.currentMoves}/${levelConfig.maxMoves.value} ✨`, {
      fontSize: `${window.getResponsiveFontSize(18)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#4169E1',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
  }

  createScoreDisplay() {
    const screenWidth = this.cameras.main.width
    
    // Score background - purple gradient
    this.scoreBg = this.add.graphics()
    this.scoreBg.fillGradientStyle(0x9370DB, 0x9370DB, 0xBA55D3, 0xBA55D3, 0.95)
    this.scoreBg.fillRoundedRect(screenWidth * 0.35, 20, screenWidth * 0.25, 60, 15)
    
    // Add white border
    this.scoreBg.lineStyle(3, 0xFFFFFF, 0.9)
    this.scoreBg.strokeRoundedRect(screenWidth * 0.35, 20, screenWidth * 0.25, 60, 15)
    this.scoreBg.setDepth(2000)
    
    this.scoreText = this.add.text(screenWidth * 0.475, 50, `🏆 Score: 0`, {
      fontSize: `${window.getResponsiveFontSize(18)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#4B0082',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
  }

  createPauseButton() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height

    // Cute pause button - orange gradient
    this.pauseButtonBg = this.add.graphics()
    this.pauseButtonBg.fillGradientStyle(0xFF8C00, 0xFF8C00, 0xFFA500, 0xFFA500, 0.95)  // Slightly increase opacity
    this.pauseButtonBg.fillRoundedRect(screenWidth - 120, 100, 100, 45, 22)

    // Add cute white border and shadow effect
    this.pauseButtonBg.lineStyle(3, 0xFFFFFF, 0.95)
    this.pauseButtonBg.strokeRoundedRect(screenWidth - 120, 100, 100, 45, 22)
    this.pauseButtonBg.setDepth(2000) // Ensure UI is on top layer

    this.pauseButtonBg.setInteractive(new Phaser.Geom.Rectangle(screenWidth - 120, 100, 100, 45), Phaser.Geom.Rectangle.Contains)

    this.pauseButtonText = this.add.text(screenWidth - 70, 122, '⏸️ PAUSE', {
      fontSize: `${window.getResponsiveFontSize(16)}px`,
      fontFamily: window.getGameFont(),  // Cute font
      color: '#FFFFFF',
      stroke: '#FF4500',  // Orange red stroke
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)

    // Add button hover effect - only apply scaling to text, avoid graphics distortion
    this.pauseButtonBg.on('pointerover', () => {
      this.tweens.add({
        targets: this.pauseButtonText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Back.easeOut'
      })
      // Provide visual feedback through color change, not scaling graphics
      this.pauseButtonText.setTint(0xFFFF88)
    })

    this.pauseButtonBg.on('pointerout', () => {
      this.tweens.add({
        targets: this.pauseButtonText,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeOut'
      })
      this.pauseButtonText.clearTint()
    })

    this.pauseButtonBg.on('pointerdown', () => {
      this.pauseButtonText.setScale(0.95)
      this.pauseButtonText.setTint(0xCCCC44)
    })

    this.pauseButtonBg.on('pointerup', () => {
      this.pauseButtonText.setScale(1.1)
      this.pauseButtonText.setTint(0xFFFF88)
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
      this.scene.pause()
      this.scene.launch('PauseScene')
    })

    // 💡 HINT BUTTON - positioned below pause button
    this.hintButtonBg = this.add.graphics()
    this.hintButtonBg.fillGradientStyle(0x4169E1, 0x4169E1, 0x6495ED, 0x6495ED, 0.95)  // Blue gradient
    this.hintButtonBg.fillRoundedRect(screenWidth - 120, 160, 100, 45, 22)

    this.hintButtonBg.lineStyle(3, 0xFFFFFF, 0.95)
    this.hintButtonBg.strokeRoundedRect(screenWidth - 120, 160, 100, 45, 22)
    this.hintButtonBg.setDepth(2000)

    this.hintButtonBg.setInteractive(new Phaser.Geom.Rectangle(screenWidth - 120, 160, 100, 45), Phaser.Geom.Rectangle.Contains)

    this.hintButtonText = this.add.text(screenWidth - 70, 182, `💡 HINT (${this.maxHints})`, {
      fontSize: `${window.getResponsiveFontSize(16)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#1E90FF',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)

    // Hint button hover effects
    this.hintButtonBg.on('pointerover', () => {
      this.tweens.add({
        targets: this.hintButtonText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Back.easeOut'
      })
      this.hintButtonText.setTint(0xFFFF88)
    })

    this.hintButtonBg.on('pointerout', () => {
      this.tweens.add({
        targets: this.hintButtonText,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeOut'
      })
      this.hintButtonText.clearTint()
    })

    this.hintButtonBg.on('pointerdown', () => {
      this.hintButtonText.setScale(0.95)
      this.hintButtonText.setTint(0xCCCC44)
    })

    this.hintButtonBg.on('pointerup', () => {
      this.hintButtonText.setScale(1.1)
      this.hintButtonText.setTint(0xFFFF88)
      this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })

      // Check if hints are available
      if (this.hintsUsed >= this.maxHints) {
        this.showNoMoreHintsMessage()
        return
      }

      this.showHint()
    })
  }

  createOpponentStatsPanel() {
    const screenWidth = this.cameras.main.width
    
    // Opponent panel background - red gradient, smaller and more compact
    this.opponentBg = this.add.graphics()
    this.opponentBg.fillGradientStyle(0xFF6B6B, 0xFF6B6B, 0xFF8E8E, 0xFF8E8E, 0.95)
    this.opponentBg.fillRoundedRect(screenWidth * 0.68, 90, screenWidth * 0.27, 80, 15)
    
    // Add border
    this.opponentBg.lineStyle(3, 0xFFFFFF, 0.9)
    this.opponentBg.strokeRoundedRect(screenWidth * 0.68, 90, screenWidth * 0.27, 80, 15)
    this.opponentBg.setDepth(2000)
    
    // Title - smaller font
    this.opponentTitle = this.add.text(screenWidth * 0.815, 103, '👤 OPPONENT', {
      fontSize: `${window.getResponsiveFontSize(14)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
    
    // Opponent target stats - more compact horizontal layout
    const baseX = screenWidth * 0.735
    const itemSpacing = screenWidth * 0.06
    const iconY = 138
    
    // 🎯 Use same random targets for opponent (will be updated when we receive opponent's actual targets)
    this.opponentTarget1Icon = this.add.image(baseX, iconY, this.levelTargets[0].type).setScale(0.042).setDepth(2100)
    this.applyTomJerryItemEnhancement(this.opponentTarget1Icon)
    this.applyHighQualityRendering(this.opponentTarget1Icon)
    this.opponentTarget1Text = this.add.text(baseX, iconY + 26, `0/${this.levelTargets[0].count}`, {
      fontSize: `${window.getResponsiveFontSize(12)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
    
    this.opponentTarget2Icon = this.add.image(baseX + itemSpacing, iconY, this.levelTargets[1].type).setScale(0.042).setDepth(2100)
    this.applyTomJerryItemEnhancement(this.opponentTarget2Icon)
    this.applyHighQualityRendering(this.opponentTarget2Icon)
    this.opponentTarget2Text = this.add.text(baseX + itemSpacing, iconY + 26, `0/${this.levelTargets[1].count}`, {
      fontSize: `${window.getResponsiveFontSize(12)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
    
    this.opponentTarget3Icon = this.add.image(baseX + itemSpacing * 2, iconY, this.levelTargets[2].type).setScale(0.042).setDepth(2100)
    this.applyTomJerryItemEnhancement(this.opponentTarget3Icon)
    this.applyHighQualityRendering(this.opponentTarget3Icon)
    this.opponentTarget3Text = this.add.text(baseX + itemSpacing * 2, iconY + 26, `0/${this.levelTargets[2].count}`, {
      fontSize: `${window.getResponsiveFontSize(12)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
  }



  setupInputs() {
    // Setup pause key (ESC or P)
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P)
    
    this.escKey.on('down', () => {
      this.pauseGame()
    })
    
    this.pKey.on('down', () => {
      this.pauseGame()
    })
    
    // Setup drag input
    this.input.on('dragstart', (pointer, gameObject) => {
      this.selectedItem = gameObject
      this.isDragging = true
      
      // Kill any existing tweens on this object to prevent accumulation
      this.tweens.killTweensOf(gameObject)
      
      // Reset to normal scale before starting animation
      gameObject.setScale(0.075)
      
      // Cartoon-style pickup animation
      this.tweens.add({
        targets: gameObject,
        scaleX: 0.075 * 1.5,
        scaleY: 0.075 * 1.5,
        duration: 150,
        ease: 'Back.easeOut',
        yoyo: true,
        onComplete: () => {
          gameObject.setScale(0.090)  // Keep slightly larger state when dragging
        }
      })
      
      gameObject.setDepth(1000)
      gameObject.setAlpha(1.0)  // Completely opaque when dragging
      
      // Add cute rainbow glow effect
      gameObject.setTint(0xFFB6C1)  // Light pink glow effect
      
      // Create cute multi-layer halo effect
      this.dragRing = this.add.graphics()
      
      // Outer halo - pink
      this.dragRing.lineStyle(4, 0xFF69B4, 0.6)
      this.dragRing.strokeCircle(gameObject.x, gameObject.y, 30 * 0.95)  // Halo size reduced to 95%
      
      // Middle halo - purple  
      this.dragRing.lineStyle(3, 0xDA70D6, 0.7)
      this.dragRing.strokeCircle(gameObject.x, gameObject.y, 22 * 0.95)  // Halo size reduced to 95%
      
      // Inner halo - white
      this.dragRing.lineStyle(2, 0xFFFFFF, 0.8)
      this.dragRing.strokeCircle(gameObject.x, gameObject.y, 15 * 0.95)  // Halo size reduced to 95%
      
      this.dragRing.setDepth(999)
      
      // Cute halo pulse animation
      this.tweens.add({
        targets: this.dragRing,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.4,
        rotation: Math.PI * 2,  // Rotation effect
        duration: 800,
        ease: 'Sine.easeInOut',
        repeat: -1,
        yoyo: true
      })
      
      this.sound.play('item_pickup', { volume: audioConfig.sfxVolume.value })
    })
    
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX
      gameObject.y = dragY
      
      // Update halo position
      if (this.dragRing) {
        this.dragRing.x = dragX
        this.dragRing.y = dragY
      }
      
      // Highlight available slots
      this.highlightAvailableSlots()
    })
    
    this.input.on('dragend', (pointer, gameObject) => {
      // Clear drag effects
      if (this.dragRing) {
        this.tweens.killTweensOf(this.dragRing)
        this.dragRing.destroy()
        this.dragRing = null
      }
      
      this.handleItemDrop(gameObject, pointer)
      this.selectedItem = null
      this.isDragging = false
      
      // Clear slot highlights
      this.clearSlotHighlights()
    })
  }

  populateInitialItems() {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    const totalPositions = rows * cols * 3 // Total positions (5x6x3 = 90)
    
    // Leave much more space - fill only 60-70% of positions for better gameplay
    const fillPercentage = Phaser.Math.Between(60, 70) / 100
    const filledPositions = Math.floor(totalPositions * fillPercentage)
    
    // Create array of all positions
    const allPositions = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        for (let position = 0; position < 3; position++) {
          allPositions.push({ row, col, position })
        }
      }
    }
    
    // Randomly shuffle position array
    Phaser.Utils.Array.Shuffle(allPositions)
    
    // 🎯 Get current level target types from random targets!
    const targetTypes = this.levelTargets.map(t => t.type)
    
    // 🎲 GUARANTEE AT LEAST ONE MATCH-3 COMBO!
    // Place first 3 items of the same type close to each other
    let guaranteedItemType = targetTypes[Phaser.Math.Between(0, targetTypes.length - 1)]
    
    for (let i = 0; i < Math.min(3, allPositions.length); i++) {
      const pos = allPositions[i]
      this.addItemToSlot(pos.row, pos.col, guaranteedItemType, pos.position)
    }
    
    // Fill remaining positions
    for (let i = 3; i < filledPositions; i++) {
      const pos = allPositions[i]
      let itemType
      
      // 🎯 HARDER: First 20 items have 50% chance to be target items
      // Reduced from 65% to make it more challenging!
      if (i < 20 && Math.random() < gameConfig.targetItemSpawnChanceStart.value / 100) {
        itemType = targetTypes[Phaser.Math.Between(0, targetTypes.length - 1)]
      } else {
        itemType = this.getRandomItemType()
      }
      
      this.addItemToSlot(pos.row, pos.col, itemType, pos.position)
    }
    
    // 🔍 Start the no-moves detection system
    this.startNoMovesDetection()
  }

  getRandomItemType() {
    // 🚧 20% chance to spawn obstacle items (Tom & Jerry obstacles!)
    if (Math.random() < gameConfig.obstacleSpawnChance.value / 100) {
      const obstacles = ['anvil_obstacle', 'safe_obstacle', 'piano_obstacle']
      return obstacles[Phaser.Math.Between(0, obstacles.length - 1)]
    }
    
    return this.itemTypes[Phaser.Math.Between(0, this.itemTypes.length - 1)]
  }

  addItemToSlot(row, col, itemType, targetPosition = null) {
    const slot = this.gridSlots[row][col]
    const gridCell = this.gridData[row][col]
    
    // Find first empty position, or use specified position
    let positionIndex = targetPosition
    if (positionIndex === null) {
      positionIndex = gridCell.positions.findIndex(pos => pos === null)
      if (positionIndex === -1) {
        return false // No empty positions
      }
    } else {
      // Check if specified position is empty
      if (gridCell.positions[positionIndex] !== null) {
        return false
      }
    }
    
    // Create item sprite, initially set to invisible
    const item = this.add.image(slot.x, slot.y, itemType)
      .setScale(0)  // Start from 0, prepare for pop-in animation
      .setAlpha(0)  // Initially transparent
    
    // 🚧 Tom & Jerry obstacle items cannot be dragged!
    const isObstacle = itemType === 'anvil_obstacle' || itemType === 'safe_obstacle' || itemType === 'piano_obstacle'
    if (!isObstacle) {
      item.setInteractive({ draggable: true })
      
      // 📱 Enhance drag & drop for mobile
      if (this.mobileHelper) {
        this.mobileHelper.enhanceDragAndDrop(item)
      }
    }
    
    // Apply background removal effect to Tom and Jerry retro cartoon items
    this.applyTomJerryItemEnhancement(item)
    
    // Set item position based on position index
    const offset = slot.positionOffsets[positionIndex]
    item.x = slot.x + offset.x
    item.y = slot.y + offset.y
    item.setDepth(100 + positionIndex)  // Ensure item is above indicator
    
    // Apply high-quality rendering to item
    this.applyHighQualityRendering(item)
    
    // 🎬 SPECIAL: Obstacle items fall from sky with Tom & Jerry style animation!
    if (isObstacle) {
      // Start from top of screen
      const startY = -100
      item.y = startY
      item.setScale(0.075)
      item.setAlpha(1)
      
      // Fall from sky with bounce
      this.tweens.add({
        targets: item,
        y: slot.y + offset.y,
        duration: 600,
        ease: 'Bounce.easeOut',
        delay: Phaser.Math.Between(0, 300)
      })
      
      // Rotate while falling
      this.tweens.add({
        targets: item,
        rotation: Math.PI * 2,
        duration: 600,
        ease: 'Linear',
        delay: Phaser.Math.Between(0, 300),
        onComplete: () => {
          // Impact effect when landing!
          this.createObstacleImpactEffect(item.x, item.y)
        }
      })
    } else {
      // Cartoon-style pop-in animation for normal items - Bigger items for 3-row grid!
      this.tweens.add({
        targets: item,
        scale: 0.075,  // 40% bigger for better visibility with 3-row grid (was 0.053 for 5-row)
        alpha: 1,      // Completely opaque
        duration: 300,
        ease: 'Back.easeOut.config(2)',  // Elastic effect
        delay: Phaser.Math.Between(0, 200)  // Random delay to stagger item appearances
      })
    }
    
    // Store item information
    item.itemType = itemType
    item.gridRow = row
    item.gridCol = col
    item.positionIndex = positionIndex
    
    // Update data structure
    gridCell.positions[positionIndex] = itemType
    gridCell.items.push(item)
    
    // Update position indicator color
    this.updatePositionIndicator(row, col, positionIndex, itemType)
    
    // Check if can eliminate
    this.time.delayedCall(100, () => {
      this.checkForElimination(row, col)
    })
    
    return true
  }

  // 🎬 Start obstacle spawn timer - spawn obstacles from sky regularly
  startObstacleSpawnTimer() {
    // Initial delay before first obstacle (configurable)
    const minDelay = gameConfig.obstacleFirstSpawnDelayMin.value * 1000
    const maxDelay = gameConfig.obstacleFirstSpawnDelayMax.value * 1000
    const initialDelay = Phaser.Math.Between(minDelay, maxDelay)
    
    console.log(`🎬 First obstacle will spawn in ${initialDelay / 1000} seconds`)
    
    this.time.delayedCall(initialDelay, () => {
      this.spawnRandomObstacle()
      
      // Then spawn obstacles at regular intervals (configurable)
      const minInterval = gameConfig.obstacleSpawnIntervalMin.value * 1000
      const maxInterval = gameConfig.obstacleSpawnIntervalMax.value * 1000
      
      this.obstacleSpawnTimer = this.time.addEvent({
        delay: Phaser.Math.Between(minInterval, maxInterval),
        callback: () => {
          this.spawnRandomObstacle()
          // Randomize next spawn interval
          this.obstacleSpawnTimer.delay = Phaser.Math.Between(minInterval, maxInterval)
          console.log(`⏰ Next obstacle in ${this.obstacleSpawnTimer.delay / 1000} seconds`)
        },
        loop: true
      })
    })
  }
  
  // 🎯 Spawn a random Tom & Jerry obstacle from the sky
  spawnRandomObstacle() {
    // Don't spawn obstacles if game is over
    if (this.gameOver || this.levelComplete) {
      return
    }
    
    const obstacles = ['anvil_obstacle', 'safe_obstacle', 'piano_obstacle']
    const obstacleType = obstacles[Phaser.Math.Between(0, obstacles.length - 1)]
    
    // Find a random slot with at least one empty position
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
    const availableSlots = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]
        // Check if has at least one empty position
        if (gridCell.positions.some(pos => pos === null)) {
          availableSlots.push({ row, col })
        }
      }
    }
    
    if (availableSlots.length === 0) {
      console.log('⚠️ No available slots for obstacle spawn')
      return
    }
    
    // Random select a slot
    const targetSlot = availableSlots[Phaser.Math.Between(0, availableSlots.length - 1)]
    
    // Add obstacle to this slot
    const success = this.addItemToSlot(targetSlot.row, targetSlot.col, obstacleType)
    
    if (success) {
      console.log(`🎬 ${obstacleType} spawned from sky at (${targetSlot.row}, ${targetSlot.col})`)
    }
  }
  
  // 🎪 Start Tom random event timer
  startTomEventTimer() {
    // Initial delay before first Tom event (configurable)
    const minDelay = gameConfig.tomEventFirstDelayMin.value * 1000
    const maxDelay = gameConfig.tomEventFirstDelayMax.value * 1000
    const initialDelay = Phaser.Math.Between(minDelay, maxDelay)
    
    console.log(`🎪 First Tom event will happen in ${initialDelay / 1000} seconds`)
    
    this.time.delayedCall(initialDelay, () => {
      this.triggerRandomTomEvent()
      
      // Then trigger Tom events at regular intervals (configurable)
      const minInterval = gameConfig.tomEventIntervalMin.value * 1000
      const maxInterval = gameConfig.tomEventIntervalMax.value * 1000
      
      this.tomEventTimer = this.time.addEvent({
        delay: Phaser.Math.Between(minInterval, maxInterval),
        callback: () => {
          this.triggerRandomTomEvent()
          // Randomize next event interval
          this.tomEventTimer.delay = Phaser.Math.Between(minInterval, maxInterval)
          console.log(`⏰ Next Tom event in ${this.tomEventTimer.delay / 1000} seconds`)
        },
        loop: true
      })
    })
  }
  
  // 🎲 Trigger a random Tom event
  triggerRandomTomEvent() {
    // Don't trigger events if game is over
    if (this.gameOver || this.levelComplete) {
      return
    }
    
    // Random event selection with weighted probabilities
    const randomValue = Math.random() * 100
    
    if (randomValue < 50) {
      // 50% - Tom & Jerry chase (most fun, non-disruptive)
      this.tomJerryChaseEvent()
    } else if (randomValue < 75) {
      // 25% - Tom drops obstacles
      this.tomDropsObstaclesEvent()
    } else {
      // 25% - Tom shakes screen
      this.tomShakesScreenEvent()
    }
  }
  
  // 🏃 Event 1: Tom chases Jerry across the screen
  tomJerryChaseEvent() {
    console.log('🏃 Tom & Jerry chase event!')
    
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Random vertical position
    const yPosition = Phaser.Math.Between(screenHeight * 0.3, screenHeight * 0.7)
    
    // 🎬 Create Jerry with animation!
    const jerry = this.animManager.createAnimatedSprite(-150, yPosition, 'jerry_running_scared', 'jerry_run', 0.15)
    jerry.setDepth(10000)
    
    // Apply high quality rendering
    this.applyHighQualityRendering(jerry)
    
    // Jerry runs across screen
    this.tweens.add({
      targets: jerry,
      x: screenWidth + 150,
      duration: 2500,
      ease: 'Linear',
      onComplete: () => jerry.destroy()
    })
    
    // Play whoosh sound
    this.sound.play('whoosh_fast', { volume: audioConfig.sfxVolume.value })
    
    // Tom chases 400ms later
    this.time.delayedCall(400, () => {
      // 🎬 Create Tom with animation!
      const tom = this.animManager.createAnimatedSprite(-150, yPosition, 'tom_chasing_jerry', 'tom_chase', 0.15)
      tom.setDepth(10000)
      
      // Apply high quality rendering
      this.applyHighQualityRendering(tom)
      
      this.tweens.add({
        targets: tom,
        x: screenWidth + 150,
        duration: 2500,
        ease: 'Linear',
        onComplete: () => tom.destroy()
      })
      
      // Play running sound and Tom's laugh
      this.sound.play('tom_running_footsteps', { volume: audioConfig.sfxVolume.value * 0.7 })

      // Update Tom event stats
      this.updatePlayerStatsTomEvent()

      // Add dust clouds behind them
      this.createDustTrail(yPosition)
    })
  }
  
  // 💨 Create dust trail effect
  createDustTrail(yPosition) {
    const screenWidth = this.cameras.main.width
    
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 500, () => {
        const dust = this.add.image(i * 200, yPosition + 20, 'dust_cloud')
          .setDepth(9999)
          .setScale(0.08)
          .setAlpha(0.6)
        
        this.tweens.add({
          targets: dust,
          alpha: 0,
          scale: 0.15,
          duration: 800,
          ease: 'Power2',
          onComplete: () => dust.destroy()
        })
      })
    }
  }
  
  // 🎬 Event 2: Tom drops obstacles from the sky
  tomDropsObstaclesEvent() {
    console.log('🎬 Tom drops obstacles event!')
    
    const screenWidth = this.cameras.main.width
    
    // 🎬 Tom appears at top with sack (with animation!)
    const tom = this.animManager.createAnimatedSprite(screenWidth / 2, -150, 'tom_carrying_sack', 'tom_carry', 0.2)
    tom.setDepth(10000)
    
    // Apply high quality rendering
    this.applyHighQualityRendering(tom)
    
    // Tom slides down
    this.tweens.add({
      targets: tom,
      y: 100,
      duration: 800,
      ease: 'Bounce.easeOut'
    })
    
    // Tom evil laugh
    this.time.delayedCall(500, () => {
      this.sound.play('tom_evil_laugh', { volume: audioConfig.sfxVolume.value })
    })
    
    // Tom trips and falls after 1.5 seconds
    this.time.delayedCall(1500, () => {
      // 🎬 Play tripping animation!
      this.animManager.playAnimation(tom, 'tom_trip')
      tom.setRotation(-0.3)
      
      // Tom falls out of screen
      this.tweens.add({
        targets: tom,
        y: this.cameras.main.height + 150,
        rotation: Math.PI * 2,
        duration: 1000,
        ease: 'Cubic.easeIn',
        onComplete: () => tom.destroy()
      })
      
      // Play crash sound
      this.time.delayedCall(800, () => {
        this.sound.play('tom_crash_fall', { volume: audioConfig.sfxVolume.value })
      })
      
      // Drop 2-3 obstacles while falling
      const obstacleCount = Phaser.Math.Between(2, 3)
      for (let i = 0; i < obstacleCount; i++) {
        this.time.delayedCall(i * 300, () => {
          this.spawnRandomObstacle()
        })
      }
    })
  }
  
  // 🔍 Start periodic match checker to detect missed matches
  startPeriodicMatchChecker() {
    // Check every 3 seconds for any missed matches
    this.periodicMatchTimer = this.time.addEvent({
      delay: 3000, // Every 3 seconds
      callback: () => {
        if (!this.gameOver && !this.levelComplete) {
          this.scanAllSlotsForMissedMatches()
        }
      },
      loop: true
    })
    console.log('🔍 Periodic match checker started (every 3 seconds)')

    // 🔧 CRITICAL FIX: Also do an immediate scan after initial population
    this.time.delayedCall(500, () => {
      if (!this.gameOver && !this.levelComplete) {
        console.log('🔍 Performing initial match scan after population...')
        this.scanAllSlotsForMissedMatches()
      }
    })
  }
  
  // 🔍 Scan all slots for missed matches
  scanAllSlotsForMissedMatches() {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
    let missedMatches = 0
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]
        
        // 🔄 First, resync the cell to fix any desync
        if (gridCell.items.length !== gridCell.positions.filter(p => p !== null).length) {
          console.warn(`🔄 Auto-resync (${row},${col}): items=${gridCell.items.length}, positions=${gridCell.positions.filter(p => p !== null).length}`)
          this.resyncGridCell(row, col)
        }
        
        // 🎯 Check if this slot has a match
        const positions = gridCell.positions
        const allPositionsFilled = positions.every(pos => pos !== null)
        
        if (allPositionsFilled) {
          const firstItemType = positions[0]
          const allSameType = positions.every(pos => pos === firstItemType)
          
          if (allSameType && !gridCell.isEliminating) {
            missedMatches++
            console.log(`🎯 MISSED MATCH DETECTED at (${row},${col}): 3x ${firstItemType} - Auto-eliminating!`)
            
            // Delay elimination slightly to stagger multiple missed matches
            this.time.delayedCall(missedMatches * 200, () => {
              this.eliminateItems(row, col, firstItemType)
            })
          }
        }
      }
    }
    
    if (missedMatches > 0) {
      console.log(`✅ Periodic scan found ${missedMatches} missed match(es) - Fixed!`)
    }
  }
  
  // 🌍 Event 3: Tom shakes the screen with hammer
  tomShakesScreenEvent() {
    console.log('🌍 Tom shakes screen event!')
    
    const screenWidth = this.cameras.main.width
    
    // 🎬 Tom appears at top with hammer (with animation!)
    const tom = this.animManager.createAnimatedSprite(screenWidth * 0.8, -150, 'tom_with_hammer', 'tom_hammer', 0.18)
    tom.setDepth(10000)
    
    // Apply high quality rendering
    this.applyHighQualityRendering(tom)
    
    // Tom slides down
    this.tweens.add({
      targets: tom,
      y: 120,
      duration: 600,
      ease: 'Back.easeOut'
    })
    
    // Tom strikes with hammer after 1 second
    this.time.delayedCall(1000, () => {
      // Hammer swing animation
      this.tweens.add({
        targets: tom,
        scaleY: 0.22,
        scaleX: 0.16,
        duration: 100,
        yoyo: true,
        repeat: 2
      })
      
      // Screen shake effect!
      this.cameras.main.shake(2000, 0.01)
      
      // Play rumble sound
      this.sound.play('screen_shake_rumble', { volume: audioConfig.sfxVolume.value })

      // Update Tom event stats
      this.updatePlayerStatsTomEvent()

      // All items vibrate!
      this.gridSlots.forEach((row, rowIndex) => {
        row.forEach((slot, colIndex) => {
          const gridCell = this.gridData[rowIndex][colIndex]
          // Check if gridCell and items exist before accessing
          if (gridCell && gridCell.items && gridCell.items.length > 0) {
            gridCell.items.forEach((item) => {
              this.tweens.add({
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
      
      // Tom disappears after shaking
      this.time.delayedCall(2500, () => {
        this.tweens.add({
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
  
  // 🔍 Start no-moves detection system
  startNoMovesDetection() {
    // Check every 5 seconds if player has possible moves
    this.noMovesTimer = this.time.addEvent({
      delay: 5000,
      callback: () => {
        this.checkForPossibleMoves()
      },
      loop: true
    })
  }
  
  // 🔍 Check if there are any possible match-3 combos
  checkForPossibleMoves() {
    // Don't check if game is over
    if (this.gameOver || this.levelComplete) {
      return
    }

    // Use the same sophisticated logic as findPossibleMatches()
    const possibleMatches = this.findPossibleMatches()

    // 🚨 NO POSSIBLE MOVES! Help the player!
    if (possibleMatches === 0) {
      console.log('🚨 NO POSSIBLE MOVES DETECTED! Adding helpful items...')
      this.addHelpfulItems()
    }
  }
  
  // 🆘 Add helpful items when player is stuck
  addHelpfulItems() {
    // Get target types
    const targetTypes = this.levelTargets.map(t => t.type)
    const helpItemType = targetTypes[Phaser.Math.Between(0, targetTypes.length - 1)]
    
    // Find 3 empty positions
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
    const emptyPositions = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]
        for (let posIndex = 0; posIndex < 3; posIndex++) {
          if (gridCell.positions[posIndex] === null) {
            emptyPositions.push({ row, col, posIndex })
          }
        }
      }
    }
    
    // Shuffle and take first 3
    Phaser.Utils.Array.Shuffle(emptyPositions)
    const positionsToFill = emptyPositions.slice(0, 3)
    
    // Add 3 items of the same type with special effect
    positionsToFill.forEach((pos, index) => {
      this.time.delayedCall(index * 200, () => {
        const slot = this.gridSlots[pos.row][pos.col]
        const gridCell = this.gridData[pos.row][pos.col]
        
        // Create item with GOLDEN GLOW effect
        const item = this.add.image(slot.x, -100, helpItemType)
          .setScale(0)
          .setAlpha(0)
        
        item.setInteractive({ draggable: true })
        
        // 📱 Enhance drag & drop for mobile
        if (this.mobileHelper) {
          this.mobileHelper.enhanceDragAndDrop(item)
        }
        
        this.applyTomJerryItemEnhancement(item)
        
        const offset = slot.positionOffsets[pos.posIndex]
        item.setDepth(100 + pos.posIndex)
        this.applyHighQualityRendering(item)
        
        // ✨ SPECIAL GOLDEN GLOW for helpful items!
        item.setTint(0xFFD700) // Golden color
        
        // Fall from sky with sparkles
        this.tweens.add({
          targets: item,
          y: slot.y + offset.y,
          x: slot.x + offset.x,
          scale: 0.075,
          alpha: 1,
          duration: 600,
          ease: 'Back.easeOut',
          onComplete: () => {
            // Flash effect
            this.tweens.add({
              targets: item,
              alpha: 0.5,
              duration: 200,
              yoyo: true,
              repeat: 3,
              onComplete: () => {
                item.clearTint() // Remove golden tint after flash
              }
            })
          }
        })
        
        // Store item information
        item.itemType = helpItemType
        item.gridRow = pos.row
        item.gridCol = pos.col
        item.positionIndex = pos.posIndex
        
        // Update data structure
        gridCell.positions[pos.posIndex] = helpItemType
        gridCell.items.push(item)
        
        this.updatePositionIndicator(pos.row, pos.col, pos.posIndex, helpItemType)
      })
    })
    
    // Update Tom help stats
    this.updatePlayerStatsTomHelp()

    // Show helpful message
    this.showHelpMessage("✨ TOM HELPED YOU! ✨")

    // Play helpful sound
    this.sound.play('item_pickup', { volume: audioConfig.sfxVolume.value })
  }
  
  // 💬 Show helpful message to player
  showHelpMessage(message) {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    const helpText = this.add.text(screenWidth / 2, screenHeight / 2, message, {
      fontSize: `${window.getResponsiveFontSize(28)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5)
      .setDepth(10001)
      .setAlpha(0)
      .setScale(0)
    
    // Pop in
    this.tweens.add({
      targets: helpText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Stay for 2 seconds
        this.time.delayedCall(2000, () => {
          // Fade out
          this.tweens.add({
            targets: helpText,
            alpha: 0,
            scale: 0.5,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
              helpText.destroy()
            }
          })
        })
      }
    })
  }
  
  // 🎬 Create impact effect when obstacle lands
  createObstacleImpactEffect(x, y) {
    // Play impact sound
    this.sound.play('item_drop', { volume: audioConfig.sfxVolume.value * 1.2 })
    
    // Dust cloud rings
    const rings = []
    for (let i = 0; i < 3; i++) {
      const ring = this.add.graphics()
      ring.lineStyle(6 - i * 2, 0xAAAAAA, 0.8 - i * 0.2)
      ring.strokeCircle(x, y, 10)
      ring.setDepth(9999)
      rings.push(ring)
      
      this.tweens.add({
        targets: ring,
        scaleX: 3 + i,
        scaleY: 3 + i,
        alpha: 0,
        duration: 400 + i * 100,
        ease: 'Cubic.easeOut',
        delay: i * 50,
        onComplete: () => ring.destroy()
      })
    }
    
    // Stars flying out
    const starEffects = ['⭐', '💫', '✨']
    for (let i = 0; i < 8; i++) {
      const star = this.add.text(x, y, starEffects[Math.floor(Math.random() * starEffects.length)], {
        fontSize: '18px',
        color: '#FFD700'
      }).setOrigin(0.5, 0.5).setDepth(10000)
      
      const angle = (i / 8) * Math.PI * 2
      const distance = 50
      
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        rotation: Math.PI,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy()
      })
    }
  }
  
  // Update position indicator color
  updatePositionIndicator(row, col, positionIndex, itemType) {
    // No longer use position indicators, keep simple line separator design
  }

  handleItemDrop(item, pointer) {
    const dropResult = this.getSlotAndPositionAtLocation(pointer.x, pointer.y)
    
    if (dropResult) {
      // 🎯 NEW: Auto-find empty position in the target slot!
      let targetPosition = dropResult.position
      const gridCell = this.gridData[dropResult.row][dropResult.col]
      
      // If the exact position is occupied, find the first empty position automatically
      if (gridCell.positions[targetPosition] !== null) {
        const emptyPosition = gridCell.positions.findIndex(pos => pos === null)
        
        if (emptyPosition !== -1) {
          targetPosition = emptyPosition
          console.log(`🎯 Auto-placed in empty position ${targetPosition} instead of occupied position ${dropResult.position}`)
        } else {
          // No empty positions at all - reject placement
          this.returnItemToOriginalPosition(item)
          this.tweens.killTweensOf(item)
          this.tweens.add({
            targets: item,
            x: item.x - 10,
            duration: 100,
            ease: 'Power2',
            yoyo: true,
            repeat: 2
          })
          this.tweens.killTweensOf(item)
          item.setScale(0.075)
          item.setDepth(100 + (item.positionIndex || 0))
          item.clearTint()
          return
        }
      }
      
      // Move item to new position (either original or auto-found empty position)
      this.moveItemToPosition(item, dropResult.row, dropResult.col, targetPosition)
      this.sound.play('item_pickup', { volume: audioConfig.sfxVolume.value })
      
      // Kill any existing tweens to prevent accumulation
      this.tweens.killTweensOf(item)
      
      // Successful placement bounce feedback animation
      this.tweens.add({
        targets: item,
        scaleX: 0.090,
        scaleY: 0.090,
        duration: 100,
        ease: 'Back.easeOut',
        yoyo: true,
        onComplete: () => {
          item.setScale(0.075)
        }
      })
      
      // Increase move counter
      this.currentMoves++
      this.updateMoveCounter()
      
      // 🔍 CRITICAL: Check ALL cells for matches after placement
      this.time.delayedCall(100, () => {
        this.checkAllCellsForMatches()
      })
      
      // 🔄 Check for deadlock ONLY every 5 moves (not every move!)
      if (this.currentMoves % 5 === 0) {
        this.time.delayedCall(500, () => {
          this.checkForDeadlock()
        })
      }
      
      // Check game end conditions
      this.checkGameEnd()
    } else {
      // Return to original position - add shake animation to indicate cannot place
      this.returnItemToOriginalPosition(item)
      
      // Kill any existing tweens to prevent accumulation
      this.tweens.killTweensOf(item)
      
      // Shake animation
      this.tweens.add({
        targets: item,
        x: item.x - 10,
        duration: 100,
        ease: 'Power2',
        yoyo: true,
        repeat: 2
      })
    }
    
    // Kill any existing tweens before resetting
    this.tweens.killTweensOf(item)
    
    // Reset item style
    item.setScale(0.075)
    item.setDepth(100 + (item.positionIndex || 0))
    item.clearTint()  // Clear glow effect
  }

  // Get slot and specific position corresponding to mouse position
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
          // Determine specific position (0, 1, 2) - adjust detection boundaries to match larger spacing
          const relativeX = x - slot.x
          let position = 1 // Default middle position
          
          if (relativeX < -slot.width * 0.2) {  // Adjust detection range to match new offset
            position = 0 // Left position
          } else if (relativeX > slot.width * 0.2) {  // Adjust detection range to match new offset
            position = 2 // Right position
          }
          
          return { row, col, position }
        }
      }
    }
    
    return null
  }

  // Check if specified position can place item
  canPlaceItemAtPosition(row, col, position) {
    const gridCell = this.gridData[row][col]
    return gridCell.positions[position] === null
  }

  moveItemToPosition(item, newRow, newCol, newPosition) {
    // Remove from original position
    const oldRow = item.gridRow
    const oldCol = item.gridCol
    const oldPosition = item.positionIndex
    const oldGridCell = this.gridData[oldRow][oldCol]
    
    // Clear original position
    oldGridCell.positions[oldPosition] = null
    const itemIndex = oldGridCell.items.indexOf(item)
    if (itemIndex > -1) {
      oldGridCell.items.splice(itemIndex, 1)
    }
    
    // Update original position indicator
    this.updatePositionIndicator(oldRow, oldCol, oldPosition, null)
    
    // Add to new position
    const newSlot = this.gridSlots[newRow][newCol]
    const newGridCell = this.gridData[newRow][newCol]
    
    item.gridRow = newRow
    item.gridCol = newCol
    item.positionIndex = newPosition
    
    // Update data structure
    newGridCell.positions[newPosition] = item.itemType
    newGridCell.items.push(item)
    
    // Update item position
    const offset = newSlot.positionOffsets[newPosition]
    item.x = newSlot.x + offset.x
    item.y = newSlot.y + offset.y
    item.setDepth(100 + newPosition)
    
    // Update new position indicator
    this.updatePositionIndicator(newRow, newCol, newPosition, item.itemType)
    
    // Check elimination
    this.time.delayedCall(gameConfig.eliminateDelay.value, () => {
      this.checkForElimination(newRow, newCol)
    })
  }

  returnItemToOriginalPosition(item) {
    const slot = this.gridSlots[item.gridRow][item.gridCol]
    const offset = slot.positionOffsets[item.positionIndex]
    
    // Restore to original position
    item.x = slot.x + offset.x
    item.y = slot.y + offset.y
    item.setDepth(100 + item.positionIndex)
    item.setAlpha(1.0)  // Restore completely opaque
  }

  // Highlight available slot positions
  highlightAvailableSlots() {
    // Clear any existing highlights first
    this.clearSlotHighlights()
    
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
    // Create highlights for slots with at least one empty position
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]
        const hasEmptyPosition = gridCell.positions.some(pos => pos === null)
        
        if (hasEmptyPosition) {
          // Green glow for available slots
          const slot = this.gridSlots[row][col]
          const highlight = this.add.graphics()
          highlight.lineStyle(4, 0x00FF00, 0.8)
          highlight.strokeRoundedRect(
            slot.x - slot.width / 2,
            slot.y - slot.height / 2,
            slot.width,
            slot.height,
            8
          )
          highlight.setDepth(45)
          
          // Pulse animation
          this.tweens.add({
            targets: highlight,
            alpha: 0.3,
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
          })
          
          if (!this.slotHighlights) {
            this.slotHighlights = []
          }
          this.slotHighlights.push(highlight)
        } else {
          // Red X for full slots
          const slot = this.gridSlots[row][col]
          const redX = this.add.graphics()
          redX.lineStyle(6, 0xFF0000, 0.9)
          
          // Draw X
          const size = Math.min(slot.width, slot.height) * 0.3
          redX.strokeLineShape(new Phaser.Geom.Line(
            slot.x - size, slot.y - size,
            slot.x + size, slot.y + size
          ))
          redX.strokeLineShape(new Phaser.Geom.Line(
            slot.x + size, slot.y - size,
            slot.x - size, slot.y + size
          ))
          redX.setDepth(45)
          
          if (!this.slotHighlights) {
            this.slotHighlights = []
          }
          this.slotHighlights.push(redX)
        }
      }
    }
  }

  // Clear slot highlights
  clearSlotHighlights() {
    if (this.slotHighlights) {
      this.slotHighlights.forEach(highlight => {
        this.tweens.killTweensOf(highlight)
        highlight.destroy()
      })
      this.slotHighlights = []
    }
  }

  checkForElimination(row, col) {
    const gridCell = this.gridData[row][col]
    const positions = gridCell.positions
    
    // Double-check: ensure gridCell and items are in sync
    if (gridCell.items.length !== positions.filter(p => p !== null).length) {
      console.warn(`⚠️ Mismatch detected at (${row},${col}): items=${gridCell.items.length}, positions=${positions.filter(p => p !== null).length}`)
      // Resync: rebuild positions from actual items
      this.resyncGridCell(row, col)
    }
    
    // Check if all three positions have items
    const allPositionsFilled = positions.every(pos => pos !== null)
    
    if (allPositionsFilled) {
      // Check if all are same type
      const firstItemType = positions[0]
      const allSameType = positions.every(pos => pos === firstItemType)
      
      if (allSameType) {
        console.log(`✅ Match found at (${row},${col}): 3x ${firstItemType}`)
        this.eliminateItems(row, col, firstItemType)
      }
    }
  }
  
  // Resync grid cell data with actual items
  resyncGridCell(row, col) {
    const gridCell = this.gridData[row][col]
    
    // Clear positions array
    gridCell.positions = [null, null, null]
    
    // Rebuild from actual items
    gridCell.items.forEach((item, index) => {
      if (item && item.active) {
        const posIndex = item.positionIndex
        if (posIndex >= 0 && posIndex < 3) {
          gridCell.positions[posIndex] = item.itemType
        }
      }
    })
    
    console.log(`🔄 Resynced (${row},${col}): ${gridCell.positions}`)
  }
  
  // Check ALL cells for matches (global scan)
  checkAllCellsForMatches() {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
    let matchesFound = 0
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]
        const positions = gridCell.positions
        
        // Skip if not all positions filled
        if (!positions.every(pos => pos !== null)) {
          continue
        }
        
        // Check if all same type
        const firstItemType = positions[0]
        const allSameType = positions.every(pos => pos === firstItemType)
        
        if (allSameType) {
          matchesFound++
          console.log(`🎯 Global scan found match at (${row},${col}): 3x ${firstItemType}`)
          
          // Delay elimination slightly to stagger multiple matches
          this.time.delayedCall(matchesFound * 200, () => {
            this.eliminateItems(row, col, firstItemType)
          })
        }
      }
    }
    
    if (matchesFound > 0) {
      console.log(`✅ Global scan complete: ${matchesFound} match(es) found`)
    }
  }

  eliminateItems(row, col, itemType) {
    const gridCell = this.gridData[row][col]
    const slot = this.gridSlots[row][col]
    
    // 🛡️ PREVENT DOUBLE ELIMINATION - Check if already eliminating
    if (gridCell.isEliminating) {
      console.log(`⚠️ Skip (${row},${col}) - Already eliminating!`)
      return
    }
    
    // Mark as eliminating
    gridCell.isEliminating = true
    
    // ⭐ NEW: Combo system logic
    const currentTime = this.time.now
    const timeSinceLastElimination = currentTime - this.lastEliminationTime
    
    // If less than 2 seconds since last elimination, increment combo
    if (timeSinceLastElimination < this.comboResetDelay && this.combo > 0) {
      this.combo++
    } else {
      this.combo = 1 // Reset to 1 (first elimination)
    }
    
    this.lastEliminationTime = currentTime
    
    // Clear existing timer and create new one
    if (this.comboTimer) {
      this.comboTimer.remove()
    }
    
    this.comboTimer = this.time.delayedCall(this.comboResetDelay, () => {
      this.combo = 0 // Reset combo after delay
    })
    
    // ⭐ Calculate score based on combo
    const basePoints = 100
    const comboMultiplier = this.combo
    const earnedPoints = basePoints * comboMultiplier
    this.score += earnedPoints
    
    // Update score display
    this.updateScoreDisplay()
    
    // ⭐ Play appropriate sound based on combo level - NEW SOUNDS! 🎵
    if (this.combo >= 5) {
      this.sound.play('combo_mega', { volume: audioConfig.sfxVolume.value })
    } else if (this.combo >= 3) {
      this.sound.play('combo_x3', { volume: audioConfig.sfxVolume.value })
    } else if (this.combo >= 2) {
      this.sound.play('combo_x2', { volume: audioConfig.sfxVolume.value })
    } else {
      this.sound.play('match_eliminate', { volume: audioConfig.sfxVolume.value })
    }
    
    // Also play score gain sound for extra satisfaction! 💰
    this.time.delayedCall(150, () => {
      this.sound.play('score_gain', { volume: audioConfig.sfxVolume.value * 0.5 })
    })
    
    // Update elimination count
    const amountToAdd = gameConfig.maxItemsPerSlot.value
    const oldCount = this.eliminatedCounts[itemType] || 0
    this.eliminatedCounts[itemType] = oldCount + amountToAdd
    const newCount = this.eliminatedCounts[itemType]
    
    console.log(`📊 Eliminated ${itemType}: ${oldCount} → ${newCount} (+${amountToAdd})`)
    console.log(`📊 All counts:`, JSON.stringify(this.eliminatedCounts, null, 2))
    
    this.updateTargetDisplay()
    
    // Send updated stats to opponent in online mode
    this.sendMyStatsToOpponent()
    
    // Create cartoon-style elimination effect with combo display
    this.createCartoonEliminationEffect(slot.x, slot.y, itemType, earnedPoints)
    
    // 🎬 Use AnimationManager for smooth elimination animations
    gridCell.items.forEach((item, index) => {
      this.time.delayedCall(index * 50, () => {
        this.animManager.animateItemEliminate(item)
      })
    })

    // Clear slots and positions
    gridCell.positions = [null, null, null]
    gridCell.items = []
    
    // Update all position indicators
    for (let i = 0; i < 3; i++) {
      this.updatePositionIndicator(row, col, i, null)
    }
    
    // 🚧 Check adjacent slots for obstacles to unlock
    this.unlockAdjacentObstacles(row, col)
    
    // 🛡️ Reset eliminating flag after a short delay
    this.time.delayedCall(100, () => {
      gridCell.isEliminating = false
    })
    
    // Delay restock
    this.time.delayedCall(gameConfig.refillDelay.value, () => {
      this.refillSlot(row, col)

      // 🌊 CASCADE MODE: Trigger cascade effect after elimination and restock
      if (this.selectedGameMode === 'cascade') {
        this.time.delayedCall(300, () => {
          this.triggerCascadeEffect(row, col)
        })
      }
    })
  }
  
  // 🚧 Unlock obstacles in adjacent slots when a match is made
  unlockAdjacentObstacles(row, col) {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
    // Check all adjacent slots (including diagonals)
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ]
    
    directions.forEach(([dRow, dCol]) => {
      const adjRow = row + dRow
      const adjCol = col + dCol
      
      // Check bounds
      if (adjRow >= 0 && adjRow < rows && adjCol >= 0 && adjCol < cols) {
        const adjCell = this.gridData[adjRow][adjCol]
        
        // Check each position in adjacent slot for Tom & Jerry obstacles
        adjCell.items.forEach((item, index) => {
          if (item.itemType === 'anvil_obstacle' || item.itemType === 'safe_obstacle' || item.itemType === 'piano_obstacle') {
            // 🔓 Unlock this obstacle!
            this.unlockObstacle(item, adjRow, adjCol, index)
          }
        })
      }
    })
  }
  
  // 🔓 Unlock a single obstacle item
  unlockObstacle(item, row, col, position) {
    const oldType = item.itemType
    
    // Transform obstacle into a random normal item
    const newItemType = this.itemTypes[Phaser.Math.Between(0, this.itemTypes.length - 1)]
    
    // Visual unlock animation
    this.tweens.add({
      targets: item,
      scale: 0.09,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        // Change to new item type
        item.setTexture(newItemType)
        item.itemType = newItemType
        item.clearTint() // Remove gray tint
        item.setInteractive({ draggable: true }) // Make it draggable
        
        // 📱 Enhance drag & drop for mobile
        if (this.mobileHelper) {
          this.mobileHelper.enhanceDragAndDrop(item)
        }
        
        // Update grid data
        this.gridData[row][col].positions[position] = newItemType
        
        // Apply Tom & Jerry enhancement
        this.applyTomJerryItemEnhancement(item)
        
        // Sparkle effect
        const sparkles = ['✨', '💫', '⭐', '🌟']
        for (let i = 0; i < 5; i++) {
          const sparkle = this.add.text(item.x, item.y, sparkles[Math.floor(Math.random() * sparkles.length)], {
            fontSize: '20px',
            color: '#FFD700'
          }).setOrigin(0.5, 0.5).setDepth(10000)
          
          this.tweens.add({
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
    
    // Play unlock sound
    this.sound.play('item_drop', { volume: audioConfig.sfxVolume.value })
  }

  createCartoonEliminationEffect(x, y, itemType, earnedPoints) {
    // Jerry direct escape animation, but add pop effect to make it more obvious
    const jerry = this.add.image(x, y, 'mouse_run_away')
      .setOrigin(0.5, 0.5)
      .setScale(0) // Start from 0, have a pop effect
      .setDepth(10000)
    
    // Set initial properties
    jerry.setAlpha(1)
    
    // First let Jerry pop up, then start escaping
    this.tweens.add({
      targets: jerry,
      scale: 0.08, // First a bit larger than normal size
      duration: 150,
      ease: 'Back.easeOut.config(1.7)',
      onComplete: () => {
        // Create Jerry escape animation effect
        this.tweens.add({
          targets: jerry,
          x: x + 180, // Escape further to the right
          y: y - 40,  // Run slightly upward
          scaleX: 0.05,
          scaleY: 0.05,
          rotation: 0.1, // Increase rotation angle, more dynamic
          duration: 400, // Quick escape
          ease: 'Quad.easeOut',
          onComplete: () => {
            jerry.destroy();
            // Second phase: leave a puff of smoke
            createDustCloud();
          }
        });
      }
    });
    
    // Second phase: puff of smoke disappearance effect
    const createDustCloud = () => {
      const dustCloud = this.add.image(x + 100, y - 20, 'dust_cloud')
        .setOrigin(0.5, 0.5)
        .setScale(0.08)
        .setAlpha(0.8)
        .setDepth(9999);
      
      // Smoke spreads then disappears
      this.tweens.add({
        targets: dustCloud,
        scaleX: 0.12,
        scaleY: 0.12,
        alpha: 0,
        x: x + 200,
        duration: 600,
        ease: 'Sine.easeOut',
        onComplete: () => {
          dustCloud.destroy();
        }
      });
    };

    // Create super cute multiple effects
    const cuteEffects = ['✨', '💖', '🌟', '💫', '🎀', '🌈', '💕', '⭐']
    for (let i = 0; i < 10; i++) {
      const effect = this.add.text(x, y, cuteEffects[Math.floor(Math.random() * cuteEffects.length)], {
        fontSize: Phaser.Math.Between(14, 22) + 'px',
        color: ['#FF69B4', '#FFB6C1', '#FF1493', '#DA70D6', '#BA55D3', '#9370DB'][Math.floor(Math.random() * 6)]
      }).setOrigin(0.5, 0.5).setDepth(9999)

      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5
      const distance = Phaser.Math.Between(40, 80)

      this.tweens.add({
        targets: effect,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - 20,  // Float slightly upward
        rotation: Phaser.Math.Between(-Math.PI, Math.PI),
        alpha: 0,
        scale: Phaser.Math.Between(0.1, 0.3),
        duration: Phaser.Math.Between(500, 800),
        ease: 'Cubic.easeOut',
        delay: i * 30,  // Stagger appearance time
        onComplete: () => {
          effect.destroy()
        }
      })
    }

    // Create cute multi-layer rainbow halo effect
    const ring = this.add.graphics()
    
    // Outer pink halo
    ring.lineStyle(8, 0xFF69B4, 0.7)
    ring.strokeCircle(x, y, 25 * 0.95)  // Halo size reduced to 95%
    
    // Middle purple halo  
    ring.lineStyle(6, 0xDA70D6, 0.8)
    ring.strokeCircle(x, y, 18 * 0.95)  // Halo size reduced to 95%
    
    // Inner white halo
    ring.lineStyle(4, 0xFFFFFF, 0.9)
    ring.strokeCircle(x, y, 12 * 0.95)  // Halo size reduced to 95%
    
    ring.setDepth(9998)

    this.tweens.add({
      targets: ring,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      rotation: Math.PI,  // Rotation effect
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        ring.destroy()
      }
    })

    // ⭐ NEW: Dynamic combo and score display
    let comboText = ''
    let comboColor = '#FFD700' // Gold by default
    let comboFontSize = '22px'
    
    if (this.combo >= 5) {
      comboText = `🔥 MEGA COMBO x${this.combo}! 🔥`
      comboColor = '#FF4500' // Red-orange
      comboFontSize = '28px'
    } else if (this.combo >= 3) {
      comboText = `⚡ COMBO x${this.combo}! ⚡`
      comboColor = '#FF8C00' // Dark orange
      comboFontSize = '24px'
    } else if (this.combo >= 2) {
      comboText = `✨ COMBO x${this.combo}! ✨`
      comboColor = '#FFD700' // Gold
      comboFontSize = '22px'
    }
    
    // Show combo text if combo > 1
    if (this.combo > 1) {
      const comboTextObj = this.add.text(x, y - 80, comboText, {
        fontSize: comboFontSize,
        fontFamily: window.getGameFont(),
        color: comboColor,
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(10001)
      
      // Combo text animation - bigger bounce for higher combos
      this.tweens.add({
        targets: comboTextObj,
        y: y - 120,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        duration: 1000,
        ease: 'Back.easeOut'
      })
    }
    
    // Show score earned
    const scoreText = this.add.text(x + 35, y - 25, `+${earnedPoints} 💎`, {
      fontSize: '24px',
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(10000)

    // Bounce up animation
    this.tweens.add({
      targets: scoreText,
      y: y - 70,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: scoreText,
          alpha: 0,
          y: y - 90,
          duration: 700,
          ease: 'Power1',
          onComplete: () => {
            scoreText.destroy()
          }
        })
      }
    })
  }

  refillSlot(row, col) {
    // Always refill with 3 items to keep gameplay flowing
    const itemCount = 3

    // 🎯 Get all level targets (now using random targets from levelTargets!)
    const targetTypes = this.levelTargets.map(t => t.type)

    // Check which targets are not yet completed
    const incompleteTargets = targetTypes.filter(itemType => {
      const target = this.levelTargets.find(t => t.type === itemType)
      return target && this.eliminatedCounts[itemType] < target.count
    })

    for (let i = 0; i < itemCount; i++) {
      let itemType

      // 🎯 HARDER: 55% chance for EACH item to be a target if needed
      // Reduced from 70% to make it more challenging!
      if (incompleteTargets.length > 0 && Math.random() < gameConfig.targetItemSpawnChanceRefill.value / 100) {
        itemType = incompleteTargets[Phaser.Math.Between(0, incompleteTargets.length - 1)]
      } else {
        // Other items: random selection from all types (includes 15% obstacle chance)
        itemType = this.getRandomItemType()
      }

      this.addItemToSlot(row, col, itemType)
    }

    // 🔧 CRITICAL FIX: After refilling, check for matches in the newly filled slot
    this.time.delayedCall(200, () => {
      if (!this.gameOver && !this.levelComplete) {
        this.checkForElimination(row, col)
      }
    })
  }

  updateTargetDisplay() {
    // Safety check for Zen mode where targets aren't displayed
    if (!this.targetDisplays) {
      return
    }

    this.targetDisplays.forEach(display => {
      const current = this.eliminatedCounts[display.type]
      const target = display.target

      if (current >= target) {
        display.text.setText(`✅ ${current}/${target}`)
        display.text.setColor('#32CD32')  // Lime green

        // Add blinking effect when completed
        if (!display.completed) {
          display.completed = true
          this.tweens.add({
            targets: [display.icon, display.text],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            ease: 'Back.easeOut',
            yoyo: true,
            repeat: 2
          })
        }
      } else {
        display.text.setText(`${current}/${target}`)
      }
    })

    // Check game end conditions after each target display update
    this.checkGameEnd()

  }

  setupMultiplayerSync() {
    // If host, send the selected background to opponent
    if (this.isHost) {
      const selectedBackground = localStorage.getItem('currentRoomBackground')
      if (selectedBackground) {
        // Send background info immediately
        multiplayerService.sendGameAction({
          type: 'backgroundSync',
          background: selectedBackground
        })
        console.log('📤 Host sent background:', selectedBackground)
      }
    }
    
    // 👋 Listen for opponent disconnect/leave
    multiplayerService.onOpponentLeft = () => {
      console.log('👋 Opponent disconnected!')
      
      if (!this.gameOver && !this.levelComplete) {
        // Show notification that opponent left
        this.showOpponentLeftNotification()
        
        // Award win to remaining player
        this.time.delayedCall(2000, () => {
          if (!this.gameOver && !this.levelComplete) {
            this.levelComplete = true
            this.sound.play('level_complete', { volume: audioConfig.sfxVolume.value })
            this.scene.launch('VictoryScene', { 
              score: this.score,
              moves: this.currentMoves,
              maxMoves: levelConfig.maxMoves.value,
              mode: this.gameMode,
              reason: 'Opponent Disconnected!'
            })
          }
        })
      }
    }
    
    // Listen for opponent's game state updates
    multiplayerService.onGameStateUpdate = (state) => {
      if (state) {
        // 🎯 Pass the FULL state object (includes eliminatedCounts AND levelTargets)
        this.updateOpponentStats(state)
      }
    }
    
    // Listen for game actions (like background sync, game end)
    multiplayerService.onGameAction = (actionData) => {
      if (actionData && actionData.type === 'backgroundSync') {
        console.log('📥 Guest received background:', actionData.background)
        // Store it so it's available immediately
        localStorage.setItem('currentRoomBackground', actionData.background)
        
        // If scene already created, update the background
        if (!this.isHost && this.backgroundImage) {
          // Recreate background with synced data
          this.updateBackgroundImage(actionData.background)
        }
      }
      
      // 🎮 NEW: Handle game end from opponent
      if (actionData && actionData.type === 'gameEnd') {
        console.log('🏁 Opponent game ended:', actionData.result)
        
        // If opponent won, I lost!
        if (actionData.result === 'win' && !this.gameOver && !this.levelComplete) {
          this.gameOver = true
          this.sound.play('game_over', { volume: audioConfig.sfxVolume.value })
          this.scene.launch('GameOverScene', {
            score: this.score,
            moves: this.currentMoves,
            mode: this.gameMode,  // 🎮 Pass 'online' for stats tracking
            reason: 'Opponent Won!'
          })
        }
        
        // If opponent lost, I won!
        if (actionData.result === 'lose' && !this.gameOver && !this.levelComplete) {
          this.levelComplete = true
          this.sound.play('level_complete', { volume: audioConfig.sfxVolume.value })
          this.scene.launch('VictoryScene', { 
            score: this.score,
            moves: this.currentMoves,
            maxMoves: levelConfig.maxMoves.value,
            mode: this.gameMode,  // 🎮 Pass 'online' for stats tracking
            reason: 'Opponent Lost!'
          })
        }
      }
    }
    
    console.log('✅ Multiplayer sync enabled - stats and background will sync in real-time')
    
    // 🎯 Send initial objectives to opponent immediately!
    this.time.delayedCall(500, () => {
      this.sendMyStatsToOpponent()
      console.log('🎯 Initial objectives sent to opponent!')
    })
  }
  
  updateBackgroundImage(backgroundKey) {
    // Remove old background if exists
    if (this.backgroundImage) {
      this.backgroundImage.destroy()
    }
    
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Create new background with synced key
    if (this.textures.exists(backgroundKey)) {
      try {
        this.backgroundImage = this.add.image(screenWidth / 2, screenHeight / 2, backgroundKey)
        
        const scaleX = screenWidth / 1536
        const scaleY = screenHeight / 1024
        const scale = Math.max(scaleX, scaleY)
        
        this.backgroundImage.setScale(scale)
        this.backgroundImage.setDepth(-100)
        this.backgroundImage.setAlpha(0.8)
        
        this.adjustBackgroundForScene(backgroundKey)
        
        console.log('✅ Background updated to:', backgroundKey)
      } catch (error) {
        console.error('Failed to update background:', error)
      }
    }
  }

  updateOpponentUI() {
    if (!this.opponentLevelTargets) return
    
    console.log('🎨 Updating opponent UI with their targets:', this.opponentLevelTargets)
    
    // Update icon 1
    if (this.opponentTarget1Icon && this.opponentLevelTargets[0]) {
      this.opponentTarget1Icon.setTexture(this.opponentLevelTargets[0].type)
      this.applyTomJerryItemEnhancement(this.opponentTarget1Icon)
      this.applyHighQualityRendering(this.opponentTarget1Icon)
      
      if (this.opponentTarget1Text) {
        const currentCount = this.opponentStats[this.opponentLevelTargets[0].type] || 0
        this.opponentTarget1Text.setText(`${currentCount}/${this.opponentLevelTargets[0].count}`)
      }
    }
    
    // Update icon 2
    if (this.opponentTarget2Icon && this.opponentLevelTargets[1]) {
      this.opponentTarget2Icon.setTexture(this.opponentLevelTargets[1].type)
      this.applyTomJerryItemEnhancement(this.opponentTarget2Icon)
      this.applyHighQualityRendering(this.opponentTarget2Icon)
      
      if (this.opponentTarget2Text) {
        const currentCount = this.opponentStats[this.opponentLevelTargets[1].type] || 0
        this.opponentTarget2Text.setText(`${currentCount}/${this.opponentLevelTargets[1].count}`)
      }
    }
    
    // Update icon 3
    if (this.opponentTarget3Icon && this.opponentLevelTargets[2]) {
      this.opponentTarget3Icon.setTexture(this.opponentLevelTargets[2].type)
      this.applyTomJerryItemEnhancement(this.opponentTarget3Icon)
      this.applyHighQualityRendering(this.opponentTarget3Icon)
      
      if (this.opponentTarget3Text) {
        const currentCount = this.opponentStats[this.opponentLevelTargets[2].type] || 0
        this.opponentTarget3Text.setText(`${currentCount}/${this.opponentLevelTargets[2].count}`)
      }
    }
  }

  updateOpponentStats(opponentData) {
    if (this.gameMode !== 'online') return
    
    console.log('📥 Received opponent stats:', opponentData)
    
    // 🎯 Store opponent's level targets if provided
    if (opponentData.levelTargets) {
      this.opponentLevelTargets = opponentData.levelTargets
      console.log('📥 Received opponent targets:', this.opponentLevelTargets)
      
      // Update opponent UI with their actual objectives!
      this.updateOpponentUI()
    }
    
    // 🎯 Update opponent stats dynamically based on OPPONENT'S targets!
    const targetsToUse = this.opponentLevelTargets || this.levelTargets
    
    targetsToUse.forEach((target, index) => {
      const itemType = target.type
      const targetCount = target.count
      
      if (opponentData.eliminatedCounts && opponentData.eliminatedCounts[itemType] !== undefined) {
        this.opponentStats[itemType] = opponentData.eliminatedCounts[itemType]
        
        // Get the corresponding text element
        let textElement = null
        if (index === 0 && this.opponentTarget1Text) {
          textElement = this.opponentTarget1Text
        } else if (index === 1 && this.opponentTarget2Text) {
          textElement = this.opponentTarget2Text
        } else if (index === 2 && this.opponentTarget3Text) {
          textElement = this.opponentTarget3Text
        }
        
        if (textElement) {
          textElement.setText(`${opponentData.eliminatedCounts[itemType]}/${targetCount}`)
          
          // Add animation when opponent makes progress
          this.tweens.add({
            targets: textElement,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            ease: 'Back.easeOut',
            yoyo: true
          })
        }
      }
    })
  }

  sendMyStatsToOpponent() {
    if (this.gameMode !== 'online') return
    
    // 🎯 Send current stats AND my objectives to opponent!
    const targetType1 = this.levelTargets[0].type
    const targetType2 = this.levelTargets[1].type
    const targetType3 = this.levelTargets[2].type
    
    const myStats = {
      eliminatedCounts: {
        [targetType1]: this.eliminatedCounts[targetType1],
        [targetType2]: this.eliminatedCounts[targetType2],
        [targetType3]: this.eliminatedCounts[targetType3]
      },
      moves: this.currentMoves,
      // 🎯 NEW: Send my objectives so opponent can display them!
      levelTargets: this.levelTargets
    }
    
    console.log('📤 Sending my stats to opponent:', myStats)
    multiplayerService.sendGameState(myStats)
  }

  updateMoveCounter() {
    // 🎮 Update based on game mode
    if (this.selectedGameMode === 'endless' || this.selectedGameMode === 'zen') {
      const modeIcon = this.selectedGameMode === 'endless' ? '♾️' : '🏆'
      this.moveCounterText.setText(`${modeIcon} Moves: ${this.currentMoves}`)
      return
    }
    
    if (this.selectedGameMode === 'time_attack') {
      // Timer is updated in updateGameTimer method
      return
    }
    
    // Classic mode
    this.moveCounterText.setText(`✨ Moves: ${this.currentMoves}/${levelConfig.maxMoves.value} ✨`)
    
    if (this.currentMoves >= levelConfig.maxMoves.value) {
      this.moveCounterText.setColor('#FF6347')
      this.moveCounterText.setText(`⚠️ Moves: ${this.currentMoves}/${levelConfig.maxMoves.value} ⚠️`)
    }
  }

  updateScoreDisplay() {
    this.scoreText.setText(`🏆 Score: ${this.score.toLocaleString()}`)
    
    // Add bounce animation on score update
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      ease: 'Back.easeOut',
      yoyo: true
    })
  }

  // 🔄 Check if game is in a deadlock (no possible matches)
  checkForDeadlock() {
    if (this.gameOver || this.levelComplete) return
    
    // Count total empty slots and items
    const stats = this.getGridStats()
    
    // 🎯 SMART CHECK: Only shuffle if truly stuck
    // Don't shuffle if:
    // 1. There are many empty slots (items can be moved around)
    // 2. Grid is not full enough to be stuck
    if (stats.emptySlots > stats.totalSlots * 0.3) {
      // More than 30% empty, plenty of room to move
      return
    }
    
    const possibleMatches = this.findPossibleMatches()
    
    // Only shuffle if REALLY no moves (0 possible matches)
    // AND grid is pretty full
    if (possibleMatches === 0 && stats.emptySlots < stats.totalSlots * 0.2) {
      console.log('⚠️ TRUE DEADLOCK! No moves possible. Shuffling...')
      this.shuffleBoard()
    }
  }
  
  // 📊 Get grid statistics
  getGridStats() {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    let emptySlots = 0
    let totalSlots = 0
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]
        totalSlots += 3 // Each slot has 3 positions
        
        gridCell.positions.forEach(pos => {
          if (pos === null) {
            emptySlots++
          }
        })
      }
    }
    
    return { emptySlots, totalSlots }
  }
  
  // 🔍 Find how many possible matches exist (IMPROVED!)
  findPossibleMatches() {
    let possibleMatches = 0
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value

    // Strategy 1: Check slots with 2 same items that need 1 more
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]

        // Count items by type in this slot
        const typeCounts = {}
        gridCell.positions.forEach(itemType => {
          if (itemType) {
            typeCounts[itemType] = (typeCounts[itemType] || 0) + 1
          }
        })

        // If we have 2 of same type, check if we can complete the match
        Object.keys(typeCounts).forEach(itemType => {
          if (typeCounts[itemType] === 2) {
            // Check if this item type exists ANYWHERE on the board
            if (this.itemExistsOnBoard(itemType, row, col)) {
              possibleMatches++
            }
          }
        })
      }
    }

    // Strategy 2: Check slots with empty space that can receive matching items
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]
        const emptyPositions = gridCell.positions.filter(p => p === null).length

        if (emptyPositions > 0) {
          // This slot has space, check what can be moved here
          const availableTypes = this.getAvailableItemTypes()
          availableTypes.forEach(itemType => {
            const countInSlot = gridCell.positions.filter(p => p === itemType).length
            // Can we make a match by moving items here?
            if (countInSlot > 0 && this.itemExistsOnBoard(itemType, row, col)) {
              possibleMatches++
            }
          })
        }
      }
    }

    return possibleMatches
  }

  // 💡 Show a hint by highlighting a possible move
  showHint() {
    // Don't show hints if game is over
    if (this.gameOver || this.levelComplete) {
      return
    }

    // Clear any existing hints first
    this.clearHints()

    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value

    // Look for slots with exactly 2 same items that can be completed to 3
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]

        // Count items by type in this slot (only non-obstacle items)
        const typeCounts = {}
        gridCell.positions.forEach((itemType, index) => {
          if (itemType && itemType !== 'anvil_obstacle' && itemType !== 'safe_obstacle' && itemType !== 'piano_obstacle') {
            typeCounts[itemType] = (typeCounts[itemType] || 0) + 1
          }
        })

        // If we have exactly 2 of same type (and one empty spot), check if we can complete the match
        for (let itemType in typeCounts) {
          if (typeCounts[itemType] === 2) {
            // Check if this item type exists elsewhere on the board
            if (this.itemExistsOnBoard(itemType, row, col)) {
              // Found a hint! Highlight the slot with 2 items
              this.highlightHintSlot(row, col, itemType)
              this.hintsUsed++ // Increment hint counter
              this.updatePlayerStatsHint() // Update hint usage in stats
              this.updateHintButtonText() // Update button text
              return // Show only one hint at a time
            }
          }
        }
      }
    }

    // If no direct matches found, show a message
    this.showNoHintMessage()
  }

  // 💡 Highlight a slot as a hint
  highlightHintSlot(row, col, itemType) {
    const slot = this.gridSlots[row][col]

    // Create hint glow effect
    const hintGlow = this.add.graphics()
    hintGlow.lineStyle(6, 0xFFD700, 0.9) // Gold glow
    hintGlow.strokeRoundedRect(
      slot.x - slot.width / 2 - 5,
      slot.y - slot.height / 2 - 5,
      slot.width + 10,
      slot.height + 10,
      12
    )
    hintGlow.setDepth(100)

    // Pulsing animation
    this.tweens.add({
      targets: hintGlow,
      alpha: 0.3,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        hintGlow.destroy()
      }
    })

    // Store hint for clearing
    if (!this.activeHints) {
      this.activeHints = []
    }
    this.activeHints.push(hintGlow)

    // Show hint message
    this.showHintMessage(`💡 Try matching ${itemType.replace('_', ' ')}!`)

    // Play hint sound
    this.sound.play('item_pickup', { volume: audioConfig.sfxVolume.value * 0.7 })
  }

  // 💬 Show hint message
  showHintMessage(message) {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height

    const hintText = this.add.text(screenWidth / 2, screenHeight / 2 - 100, message, {
      fontSize: `${window.getResponsiveFontSize(24)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5)
      .setDepth(10001)
      .setAlpha(0)
      .setScale(0)

    // Pop in animation
    this.tweens.add({
      targets: hintText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Stay for 3 seconds
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: hintText,
            alpha: 0,
            scale: 0.5,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
              hintText.destroy()
            }
          })
        })
      }
    })
  }

  // ❌ Show message when no more hints available
  showNoMoreHintsMessage() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height

    const noMoreHintsText = this.add.text(screenWidth / 2, screenHeight / 2 - 100, `❌ No more hints!\n(${this.hintsUsed}/${this.maxHints} used)`, {
      fontSize: `${window.getResponsiveFontSize(24)}px`,
      fontFamily: window.getGameFont(),
      color: '#FF6347',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5)
      .setDepth(10001)
      .setAlpha(0)
      .setScale(0)

    // Pop in animation
    this.tweens.add({
      targets: noMoreHintsText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Stay for 2 seconds
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: noMoreHintsText,
            alpha: 0,
            scale: 0.5,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
              noMoreHintsText.destroy()
            }
          })
        })
      }
    })

    // Play different sound for no more hints
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value * 0.3 })
  }

  // 🔄 Update hint button text to show remaining hints
  updateHintButtonText() {
    if (this.hintButtonText) {
      const remainingHints = this.maxHints - this.hintsUsed
      this.hintButtonText.setText(`💡 HINT (${remainingHints})`)

      // Change color when hints are running low
      if (remainingHints === 0) {
        this.hintButtonText.setColor('#FF6347') // Red when no hints left
      } else if (remainingHints === 1) {
        this.hintButtonText.setColor('#FFA500') // Orange when 1 hint left
      } else {
        this.hintButtonText.setColor('#FFFFFF') // White normally
      }
    }
  }

  // 😔 Show message when no hints available
  showNoHintMessage() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height

    const noHintText = this.add.text(screenWidth / 2, screenHeight / 2 - 100, '😔 No hints available right now!', {
      fontSize: `${window.getResponsiveFontSize(24)}px`,
      fontFamily: window.getGameFont(),
      color: '#FF6347',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5)
      .setDepth(10001)
      .setAlpha(0)
      .setScale(0)

    // Pop in animation
    this.tweens.add({
      targets: noHintText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Stay for 2 seconds
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: noHintText,
            alpha: 0,
            scale: 0.5,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
              noHintText.destroy()
            }
          })
        })
      }
    })

    // Play different sound for no hints
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value * 0.5 })
  }

  // 🧹 Clear all active hints
  clearHints() {
    if (this.activeHints) {
      this.activeHints.forEach(hint => {
        if (hint && hint.active) {
          this.tweens.killTweensOf(hint)
          hint.destroy()
        }
      })
      this.activeHints = []
    }
  }
  
  // 🔎 Check if item type exists anywhere on board (excluding specific slot)
  itemExistsOnBoard(itemType, excludeRow, excludeCol) {
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Skip the excluded slot
        if (row === excludeRow && col === excludeCol) continue
        
        const gridCell = this.gridData[row][col]
        if (gridCell.positions.includes(itemType)) {
          return true
        }
      }
    }
    
    return false
  }
  
  // 📦 Get all item types currently on the board
  getAvailableItemTypes() {
    const types = new Set()
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]
        gridCell.positions.forEach(itemType => {
          if (itemType) {
            types.add(itemType)
          }
        })
      }
    }
    
    return Array.from(types)
  }
  
  // 🔄 Shuffle all items on the board
  shuffleBoard() {
    // Show shuffle warning
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    const shuffleWarning = this.add.text(screenWidth / 2, screenHeight / 2, '🔄 NO MOVES LEFT!\nSHUFFLING...', {
      fontSize: `${window.getResponsiveFontSize(36)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(15000).setAlpha(0)
    
    // Fade in warning
    this.tweens.add({
      targets: shuffleWarning,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    })
    
    // Play shuffle sound
    this.sound.play('item_pickup', { volume: audioConfig.sfxVolume.value })
    
    // Collect all items from grid
    const allItems = []
    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.gridData[row][col]
        gridCell.items.forEach(item => {
          allItems.push({
            type: item.itemType,
            sprite: item
          })
        })
      }
    }
    
    // Shuffle items array
    Phaser.Utils.Array.Shuffle(allItems)
    
    // Animate items flying to center
    allItems.forEach((itemData, index) => {
      this.tweens.add({
        targets: itemData.sprite,
        x: screenWidth / 2,
        y: screenHeight / 2,
        scale: 0,
        rotation: Math.PI * 2,
        alpha: 0.5,
        duration: 500,
        delay: index * 10,
        ease: 'Back.easeIn'
      })
    })
    
    // Wait for animation, then redistribute
    this.time.delayedCall(800, () => {
      // Clear all grid cells
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          this.gridData[row][col].positions = [null, null, null]
          this.gridData[row][col].items = []
        }
      }
      
      // Destroy all item sprites
      allItems.forEach(itemData => {
        itemData.sprite.destroy()
      })
      
      // Redistribute items
      let itemIndex = 0
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          for (let position = 0; position < 3; position++) {
            if (itemIndex < allItems.length) {
              this.addItemToSlot(row, col, allItems[itemIndex].type, position)
              itemIndex++
            }
          }
        }
      }
      
      // Remove warning
      this.tweens.add({
        targets: shuffleWarning,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          shuffleWarning.destroy()
        }
      })
    })
  }

  checkGameEnd() {
    // 🎮 Endless/Zen/Cascade mode - no game over conditions, no victory conditions either!
    if (this.selectedGameMode === 'endless' || this.selectedGameMode === 'zen' || this.selectedGameMode === 'cascade') {
      // Pure relaxation mode - no win/lose conditions
      // Just keep playing forever!
      return
    }
    
    // 🎯 Check victory conditions using random targets!
    const target1Met = this.eliminatedCounts[this.levelTargets[0].type] >= this.levelTargets[0].count
    const target2Met = this.eliminatedCounts[this.levelTargets[1].type] >= this.levelTargets[1].count
    const target3Met = this.eliminatedCounts[this.levelTargets[2].type] >= this.levelTargets[2].count
    const victoryConditionMet = target1Met && target2Met && target3Met
    
    if (victoryConditionMet && !this.levelComplete) {
      this.levelComplete = true
      this.sound.play('level_complete', { volume: audioConfig.sfxVolume.value })
      
      // Stop timer for Time Attack mode
      if (this.selectedGameMode === 'time_attack' && this.gameTimer) {
        this.gameTimer.remove()
      }
      
      // Update player stats
      this.updatePlayerStats(true) // true = victory
    
      // 🎮 MULTIPLAYER: If someone wins, opponent loses!
      if (this.gameMode === 'online') {
        multiplayerService.sendGameEnd('win')
      }
    
      this.scene.launch('VictoryScene', {
        score: this.score,
        moves: this.currentMoves,
        maxMoves: levelConfig.maxMoves.value,
        mode: this.gameMode  // 🎮 Pass 'online' or 'single' for stats tracking
      })
      return
    }
    
    // Check failure conditions (only for classic mode, not time_attack which uses timer)
    if (this.selectedGameMode === 'classic' && this.currentMoves >= levelConfig.maxMoves.value && !this.levelComplete) {
      this.gameOver = true
      this.sound.play('game_over', { volume: audioConfig.sfxVolume.value })
      
      // Update player stats
      this.updatePlayerStats(false) // false = defeat

      // 🎮 MULTIPLAYER: If someone loses, tell opponent
      if (this.gameMode === 'online') {
        multiplayerService.sendGameEnd('lose')
      }

      this.scene.launch('GameOverScene', {
        score: this.score,
        moves: this.currentMoves,
        mode: this.gameMode  // 🎮 Pass 'online' or 'single' for stats tracking
      })
    }
  }

  // 🎵 Stop all music from other scenes to prevent overlap
  stopAllOtherMusic() {
    const allScenes = ['TitleScene', 'ModeSelectionScene', 'GameModeMenuScene', 'OnlineLobbyScene']
    
    allScenes.forEach(sceneKey => {
      const scene = this.scene.get(sceneKey)
      if (scene && scene.backgroundMusic) {
        if (scene.backgroundMusic.isPlaying) {
          scene.backgroundMusic.stop()
          console.log(`🎵 Stopped music from ${sceneKey}`)
        }
      }
    })
  }

  playBackgroundMusic() {
    // Don't play music if already playing
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      return
    }
    
    this.backgroundMusic = this.sound.add('tom_jerry_80s_retro_theme', {
      volume: audioConfig.musicVolume.value,
      loop: true
    })
    this.backgroundMusic.play()
  }
  
  // ⏱️ Start game timer for Time Attack mode
  startGameTimer() {
    this.timeRemaining = 120 // 2 minutes
    
    this.gameTimer = this.time.addEvent({
      delay: 1000, // 1 second
      callback: this.updateGameTimer,
      callbackScope: this,
      loop: true
    })
  }
  
  // ⏱️ Update game timer display
  updateGameTimer() {
    if (this.gameOver || this.levelComplete) {
      if (this.gameTimer) {
        this.gameTimer.remove()
      }
      return
    }
    
    this.timeRemaining--
    
    // Update display
    const minutes = Math.floor(this.timeRemaining / 60)
    const seconds = this.timeRemaining % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
    
    this.moveCounterText.setText(`⏱️ Time: ${timeString}`)
    
    // Warning colors
    if (this.timeRemaining <= 10) {
      this.moveCounterText.setColor('#FF0000') // Red
    } else if (this.timeRemaining <= 30) {
      this.moveCounterText.setColor('#FF6347') // Orange
    }
    
    // Time's up!
    if (this.timeRemaining <= 0) {
      this.gameTimer.remove()
      this.gameOver = true
      this.sound.play('game_over', { volume: audioConfig.sfxVolume.value })
      
      // 🎮 MULTIPLAYER: If someone loses due to time, tell opponent
      if (this.gameMode === 'online') {
        multiplayerService.sendGameEnd('lose')
      }
      
      this.scene.launch('GameOverScene', {
        score: this.score,
        moves: this.currentMoves,
        mode: this.gameMode,  // 🎮 Pass 'online' or 'single' for stats tracking
        reason: 'Time is up!'
      })
    }
  }

  highlightAvailableSlots() {
    // Remove highlight effect, keep original style
  }
  
  clearSlotHighlights() {
    // Remove highlight effect, keep original style
  }
  
  // This method has already been defined earlier, remove duplicate definition
  
  // Check if specified slot can place item
  canPlaceItemInSlot(row, col) {
    const gridCell = this.gridData[row][col]
    // Check if there are any empty positions
    return gridCell.positions.some(pos => pos === null)
  }

  // Tom and Jerry retro cartoon items opaque bright processing
  applyTomJerryItemEnhancement(item) {
    // Professional quality rendering settings
    item.setBlendMode(Phaser.BlendModes.NORMAL)
    
    // Clear any tint, keep original bright colors
    item.clearTint()
    
    // Keep completely opaque for sharp, clean look
    item.setAlpha(1.0)
    
    // Add subtle drop shadow for depth and professionalism
    if (this.plugins && this.plugins.get('rexDropShadowPipeline')) {
      item.setPipeline('rexDropShadowPipeline')
    }
    
    // Enhance texture quality - disable pixel art mode for smoother rendering
    if (item.texture && item.texture.source && item.texture.source[0]) {
      item.texture.source[0].setFilter(1) // LINEAR filtering for smooth anti-aliased edges
    }
    
    // Add subtle brightness enhancement
    if (item.setTintFill) {
      item.setTint(0xFFFFFF)
    }
  }

  // Apply high-quality rendering to prevent pixelation
  applyHighQualityRendering(item) {
    // Safe texture quality improvement without direct WebGL access
    if (item.texture && item.texture.source && item.texture.source[0]) {
      try {
        // LINEAR filtering for smooth scaling (most important!)
        item.texture.source[0].setFilter(1) // 1 = LINEAR (smooth), 0 = NEAREST (pixelated)
        
        // Set scale mode if available
        if (item.texture.source[0].scaleMode !== undefined) {
          item.texture.source[0].scaleMode = 1 // LINEAR for smooth rendering
        }
      } catch (e) {
        // Silently fail if texture not ready
        console.warn('Texture not ready for quality enhancement')
      }
    }
    
    // Ensure antialiasing is enabled
    item.setBlendMode(Phaser.BlendModes.NORMAL)
    
    // Disable pixel snapping for smoother sub-pixel positioning
    item.roundPixels = false
    
    // Force alpha to 1.0 for crisp rendering
    if (item.alpha < 1) {
      item.setAlpha(1.0)
    }
    
    // Clear any tint for better text visibility
    item.clearTint()
  }

  pauseGame() {
    if (!this.gameOver && !this.levelComplete) {
      this.scene.pause()
      this.scene.launch('PauseScene')
    }
  }

  // 👋 Show notification when opponent leaves
  showOpponentLeftNotification() {
    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    
    // Create semi-transparent overlay
    const overlay = this.add.rectangle(
      screenWidth / 2, 
      screenHeight / 2, 
      screenWidth, 
      screenHeight, 
      0x000000, 
      0.5
    ).setDepth(9999)
    
    // Create notification panel
    const panelWidth = 400
    const panelHeight = 150
    const panel = this.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      panelWidth,
      panelHeight,
      0xFF6347,
      1
    ).setDepth(10000).setStrokeStyle(6, 0x8B0000)
    
    // Icon and text
    const notificationText = this.add.text(
      screenWidth / 2,
      screenHeight / 2 - 20,
      '👋 OPPONENT DISCONNECTED',
      {
        fontSize: '24px',
        fontFamily: window.getGameFont(),
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5).setDepth(10001)
    
    const subText = this.add.text(
      screenWidth / 2,
      screenHeight / 2 + 25,
      'You win by default!',
      {
        fontSize: '18px',
        fontFamily: window.getGameFont(),
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }
    ).setOrigin(0.5, 0.5).setDepth(10001)
    
    // Scale in animation
    panel.setScale(0)
    notificationText.setScale(0)
    subText.setScale(0)
    
    this.tweens.add({
      targets: [overlay],
      alpha: { from: 0, to: 0.5 },
      duration: 300,
      ease: 'Power2'
    })
    
    this.tweens.add({
      targets: panel,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    })
    
    this.tweens.add({
      targets: [notificationText, subText],
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Elastic.easeOut',
      delay: 200
    })
    
    // Play notification sound
    this.sound.play('ui_click', { volume: audioConfig.sfxVolume.value })
  }

  shutdown() {
    // Stop game timer if exists
    if (this.gameTimer) {
      this.gameTimer.remove()
      this.gameTimer = null
    }
    
    // 🎬 Stop obstacle spawn timer
    if (this.obstacleSpawnTimer) {
      this.obstacleSpawnTimer.remove()
      this.obstacleSpawnTimer = null
    }
    
    // 🎪 Stop Tom event timer
    if (this.tomEventTimer) {
      this.tomEventTimer.remove()
      this.tomEventTimer = null
    }
    
    // 🔍 Stop no-moves detection timer
    if (this.noMovesTimer) {
      this.noMovesTimer.remove()
      this.noMovesTimer = null
    }
    
    // Stop game music when leaving this scene
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop()
      this.backgroundMusic.destroy()
      this.backgroundMusic = null
    }
  }

  update() {
    // Game main loop update
  }

  // 📊 Update player statistics
  updatePlayerStats(isVictory) {
    const stats = this.loadPlayerStats()

    // Update games played
    stats.gamesPlayed++

    // Update wins/losses
    if (isVictory) {
      stats.gamesWon++
    }

    // Update total score
    stats.totalScore += this.score

    // Update best score
    if (this.score > stats.bestScore) {
      stats.bestScore = this.score
    }

    // Update best combo
    if (this.combo > stats.bestCombo) {
      stats.bestCombo = this.combo
    }

    // Update play time (estimate based on moves)
    stats.playTimeSeconds += Math.max(30, this.currentMoves * 5) // Estimate 5 seconds per move, minimum 30 seconds

    // Update mode-specific stats
    const modeKey = this.selectedGameMode
    if (modeKey === 'classic') {
      stats.classicGamesPlayed++
      if (isVictory) stats.classicGamesWon++
    } else if (modeKey === 'time_attack') {
      stats.timeAttackGamesPlayed++
      if (isVictory) stats.timeAttackGamesWon++
    } else if (modeKey === 'endless') {
      stats.endlessGamesPlayed++
      if (isVictory) stats.endlessGamesWon++
    } else if (modeKey === 'cascade') {
      stats.cascadeGamesPlayed++
      if (isVictory) stats.cascadeGamesWon++
    } else if (modeKey === 'zen') {
      stats.zenGamesPlayed++
      if (isVictory) stats.zenGamesWon++
    }

    // Save updated stats
    this.savePlayerStats(stats)
  }

  // 💡 Update hint usage stats
  updatePlayerStatsHint() {
    const stats = this.loadPlayerStats()
    stats.totalHintsUsed++
    this.savePlayerStats(stats)
  }

  // 🆘 Update Tom help stats
  updatePlayerStatsTomHelp() {
    const stats = this.loadPlayerStats()
    stats.totalTomHelps++
    this.savePlayerStats(stats)
  }

  // 🎪 Update Tom event stats
  updatePlayerStatsTomEvent() {
    const stats = this.loadPlayerStats()
    stats.tomEventsSeen++
    this.savePlayerStats(stats)
  }

  // 📊 Load player statistics from localStorage
  loadPlayerStats() {
    const defaultStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      bestScore: 0,
      bestCombo: 0,
      totalHintsUsed: 0,
      totalTomHelps: 0,
      playTimeSeconds: 0,
      tomEventsSeen: 0,
      classicGamesPlayed: 0,
      classicGamesWon: 0,
      timeAttackGamesPlayed: 0,
      timeAttackGamesWon: 0,
      endlessGamesPlayed: 0,
      endlessGamesWon: 0,
      zenGamesPlayed: 0,
      zenGamesWon: 0,
      cascadeGamesPlayed: 0,
      cascadeGamesWon: 0
    }

    const savedStats = localStorage.getItem('playerStats')
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats)
        return { ...defaultStats, ...parsedStats }
      } catch (error) {
        console.warn('Failed to parse player stats, using defaults')
        return defaultStats
      }
    }

    return defaultStats
  }

  // 💾 Save player statistics to localStorage
  savePlayerStats(stats) {
    try {
      localStorage.setItem('playerStats', JSON.stringify(stats))
      console.log('📊 Player stats saved:', stats)
    } catch (error) {
      console.warn('Failed to save player stats:', error)
    }
  }

  // 🌊 CASCADE MODE: Trigger cascade effect after elimination
  triggerCascadeEffect(row, col) {
    console.log('🌊 Triggering cascade effect at:', row, col)

    const rows = gameConfig.gridRows.value
    const cols = gameConfig.gridCols.value
    let cascadeTriggered = false

    // Create water ripple effect at elimination point
    this.createWaterRippleEffect(row, col)

    // Check all slots for items that can fall (starting from bottom up)
    for (let r = rows - 2; r >= 0; r--) { // Start from second-to-last row
      for (let c = 0; c < cols; c++) {
        const gridCell = this.gridData[r][c]

        // Check each position in the slot
        for (let pos = 0; pos < 3; pos++) {
          if (gridCell.positions[pos] !== null) {
            // Check if there's empty space below this item
            if (this.canItemFall(r, c, pos)) {
              this.makeItemFall(r, c, pos)
              cascadeTriggered = true
            }
          }
        }
      }
    }

    if (cascadeTriggered) {
      console.log('🌊 Cascade effect triggered - items falling!')
      // Play cascade sound
      this.sound.play('item_drop', { volume: audioConfig.sfxVolume.value * 0.8 })

      // Create water splash effects
      this.createWaterSplashEffects()

      // After cascade animation, check for new matches
      this.time.delayedCall(1000, () => {
        this.checkAllCellsForMatches()
      })
    } else {
      // If no cascade happened, still check for matches in case items created new combinations
      this.time.delayedCall(500, () => {
        this.checkAllCellsForMatches()
      })
    }
  }

  // 🌊 Check if an item can fall (has empty space below)
  canItemFall(row, col, position) {
    // Items fall downward in the grid
    if (row >= gameConfig.gridRows.value - 1) return false // Already at bottom

    const belowCell = this.gridData[row + 1][col]
    // Check if there's an empty position below
    return belowCell.positions.some(pos => pos === null)
  }

  // 🌊 Make an item fall to the slot below
  makeItemFall(fromRow, fromCol, fromPosition) {
    const item = this.gridData[fromRow][fromCol].items[fromPosition]
    if (!item) return

    // Find empty position in the slot below
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

      // Update item position
      const newSlot = this.gridSlots[fromRow + 1][fromCol]
      const offset = newSlot.positionOffsets[emptyPos]
      const newY = newSlot.y + offset.y

      // Set higher depth during animation to prevent overlap issues
      const originalDepth = item.depth
      item.setDepth(200)

      // Animate falling with bounce
      this.tweens.add({
        targets: item,
        y: newY,
        duration: 400,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          // Restore original depth
          item.setDepth(originalDepth)
          // Check if this creates a new match
          this.checkForElimination(fromRow + 1, fromCol)
        }
      })

      // Update position indicators
      this.updatePositionIndicator(fromRow, fromCol, fromPosition, null)
      this.updatePositionIndicator(fromRow + 1, fromCol, emptyPos, item.itemType)

      console.log(`🌊 Item fell from (${fromRow},${fromCol}) to (${fromRow + 1},${fromCol})`)
    }
  }

  // 🌊 Create water ripple effect at cascade point
  createWaterRippleEffect(row, col) {
     const slot = this.gridSlots[row][col]
     const x = slot.x
     const y = slot.y

     // Create concentric ripple circles
     for (let i = 0; i < 3; i++) {
       const ripple = this.add.graphics()
       ripple.lineStyle(3, 0x1E90FF, 0.8 - i * 0.2) // Blue ripples
       ripple.strokeCircle(x, y, 20 + i * 15)
       ripple.setDepth(999)

       this.tweens.add({
         targets: ripple,
         scaleX: 2.5,
         scaleY: 2.5,
         alpha: 0,
         duration: 800 + i * 200,
         ease: 'Cubic.easeOut',
         onComplete: () => ripple.destroy()
       })
     }

     // Add water droplets
     for (let i = 0; i < 8; i++) {
       const angle = (i / 8) * Math.PI * 2
       const distance = 40
       const dropletX = x + Math.cos(angle) * distance
       const dropletY = y + Math.sin(angle) * distance

       const droplet = this.add.text(dropletX, dropletY, '💧', {
         fontSize: '16px'
       }).setOrigin(0.5, 0.5).setDepth(1000)

       this.tweens.add({
         targets: droplet,
         y: dropletY + 30,
         alpha: 0,
         duration: 600,
         ease: 'Power2',
         delay: i * 50,
         onComplete: () => droplet.destroy()
       })
     }
   }

   // 🌊 Create water splash effects during cascade
   createWaterSplashEffects() {
     const screenWidth = this.cameras.main.width
     const screenHeight = this.cameras.main.height

     // Random water splash effects across the screen
     for (let i = 0; i < 5; i++) {
       const splashX = Phaser.Math.Between(100, screenWidth - 100)
       const splashY = Phaser.Math.Between(200, screenHeight - 200)

       // Create splash particles
       for (let j = 0; j < 6; j++) {
         const particle = this.add.graphics()
         particle.fillStyle(0x87CEEB, 0.7) // Light blue
         particle.fillCircle(0, 0, Phaser.Math.Between(3, 8))
         particle.setPosition(splashX, splashY)
         particle.setDepth(999)

         const angle = (j / 6) * Math.PI * 2 + Phaser.Math.Between(-0.5, 0.5)
         const distance = Phaser.Math.Between(20, 60)

         this.tweens.add({
           targets: particle,
           x: splashX + Math.cos(angle) * distance,
           y: splashY + Math.sin(angle) * distance - 20,
           alpha: 0,
           scale: 0.5,
           duration: Phaser.Math.Between(400, 800),
           ease: 'Power2',
           delay: i * 100 + j * 30,
           onComplete: () => particle.destroy()
         })
       }
     }
   }
}