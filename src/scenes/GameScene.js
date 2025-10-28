import Phaser from 'phaser'
import { screenSize, gameConfig, levelConfig, audioConfig } from '../gameConfig.json'
import { multiplayerService } from '../services/MultiplayerService.js'

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
    
    // Game state
    this.gameOver = false
    this.levelComplete = false
    this.currentMoves = 0
    
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
    
    // Item type mapping
    this.itemTypes = [
      'milk_box',
      'chips_bag', 
      'cola_bottle',
      'cookie_box',
      'detergent_bottle',
      'tissue_pack',
      'toothpaste',
      'bread',
      'towel'
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
      'towel': 0
    }
  }

  // Receive scene startup parameters
  init(data) {
    // If reset flag exists, reinitialize game state
    if (data && data.reset) {
      this.initializeGameState()
    }
    
    // Set game mode
    if (data && data.mode) {
      this.gameMode = data.mode
      this.isHost = data.isHost || false
    }
  }

  preload() {
    // Resources are now loaded in LoadingScene via asset-pack.json, no need to load any resources here
  }

  create() {
    // Stop title scene music if playing
    const titleScene = this.scene.get('TitleScene')
    if (titleScene && titleScene.backgroundMusic && titleScene.backgroundMusic.isPlaying) {
      titleScene.backgroundMusic.stop()
    }
    
    // Check if mobile device
    this.isMobile = window.isMobileDevice || false
    
    if (this.isMobile) {
      console.log('📱 Mobile mode activated - Touch controls enabled')
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
    
    // Pause button
    this.createPauseButton()
    
    // Opponent stats (online mode only)
    if (this.gameMode === 'online') {
      this.createOpponentStatsPanel()
    }
  }

  createTargetDisplay() {
    const screenWidth = this.cameras.main.width
    
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
    
    // Specific target display - relayout in top area
    const targets = [
      { type: 'milk_box', target: levelConfig.targetMilk.value, x: screenWidth * 0.08 },
      { type: 'chips_bag', target: levelConfig.targetChips.value, x: screenWidth * 0.15 },
      { type: 'cola_bottle', target: levelConfig.targetCola.value, x: screenWidth * 0.22 }
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
    
    // Cute move counter background - blue gradient
    this.moveCounterBg = this.add.graphics()
    this.moveCounterBg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xADD8E6, 0xADD8E6, 0.95)  // Slightly increase opacity
    this.moveCounterBg.fillRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
    
    // Add cute white border
    this.moveCounterBg.lineStyle(3, 0xFFFFFF, 0.9)
    this.moveCounterBg.strokeRoundedRect(screenWidth * 0.65, 20, screenWidth * 0.3, 60, 15)
    this.moveCounterBg.setDepth(2000) // Ensure UI is on top layer
    
    this.moveCounterText = this.add.text(screenWidth * 0.8, 50, `✨ Moves: ${this.currentMoves}/${levelConfig.maxMoves.value} ✨`, {
      fontSize: `${window.getResponsiveFontSize(18)}px`,
      fontFamily: window.getGameFont(),  // Cute font
      color: '#FFFFFF',
      stroke: '#4169E1',  // Royal blue stroke
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
    
    // Milk
    const milkIcon = this.add.image(baseX, iconY, 'milk_box').setScale(0.042).setDepth(2100)
    this.applyTomJerryItemEnhancement(milkIcon)
    this.applyHighQualityRendering(milkIcon)
    this.opponentMilkText = this.add.text(baseX, iconY + 26, `0/${levelConfig.targetMilk.value}`, {
      fontSize: `${window.getResponsiveFontSize(12)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
    
    // Chips
    const chipsIcon = this.add.image(baseX + itemSpacing, iconY, 'chips_bag').setScale(0.042).setDepth(2100)
    this.applyTomJerryItemEnhancement(chipsIcon)
    this.applyHighQualityRendering(chipsIcon)
    this.opponentChipsText = this.add.text(baseX + itemSpacing, iconY + 26, `0/${levelConfig.targetChips.value}`, {
      fontSize: `${window.getResponsiveFontSize(12)}px`,
      fontFamily: window.getGameFont(),
      color: '#FFFFFF',
      stroke: '#8B0000',
      strokeThickness: 2,
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(2100)
    
    // Cola
    const colaIcon = this.add.image(baseX + itemSpacing * 2, iconY, 'cola_bottle').setScale(0.042).setDepth(2100)
    this.applyTomJerryItemEnhancement(colaIcon)
    this.applyHighQualityRendering(colaIcon)
    this.opponentColaText = this.add.text(baseX + itemSpacing * 2, iconY + 26, `0/${levelConfig.targetCola.value}`, {
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
    
    // Calculate number of positions to leave empty (3-6)
    const emptyPositions = Phaser.Math.Between(3, 6)
    const filledPositions = totalPositions - emptyPositions
    
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
    
    // Fill first filledPositions positions
    for (let i = 0; i < filledPositions; i++) {
      const pos = allPositions[i]
      this.addItemToSlot(pos.row, pos.col, this.getRandomItemType(), pos.position)
    }
  }

  getRandomItemType() {
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
      .setInteractive({ draggable: true })
      .setScale(0)  // Start from 0, prepare for pop-in animation
      .setAlpha(0)  // Initially transparent
    
    // Apply background removal effect to Tom and Jerry retro cartoon items
    this.applyTomJerryItemEnhancement(item)
    
    // Set item position based on position index
    const offset = slot.positionOffsets[positionIndex]
    item.x = slot.x + offset.x
    item.y = slot.y + offset.y
    item.setDepth(100 + positionIndex)  // Ensure item is above indicator
    
    // Apply high-quality rendering to item
    this.applyHighQualityRendering(item)
    
    // Cartoon-style pop-in animation - Bigger items for 3-row grid!
    this.tweens.add({
      targets: item,
      scale: 0.075,  // 40% bigger for better visibility with 3-row grid (was 0.053 for 5-row)
      alpha: 1,      // Completely opaque
      duration: 300,
      ease: 'Back.easeOut.config(2)',  // Elastic effect
      delay: Phaser.Math.Between(0, 200)  // Random delay to stagger item appearances
    })
    
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

  // Update position indicator color
  updatePositionIndicator(row, col, positionIndex, itemType) {
    // No longer use position indicators, keep simple line separator design
  }

  handleItemDrop(item, pointer) {
    const dropResult = this.getSlotAndPositionAtLocation(pointer.x, pointer.y)
    
    if (dropResult && this.canPlaceItemAtPosition(dropResult.row, dropResult.col, dropResult.position)) {
      // Move item to new position
      this.moveItemToPosition(item, dropResult.row, dropResult.col, dropResult.position)
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
    // Remove highlight effect, keep original style
  }

  // Clear slot highlights
  clearSlotHighlights() {
    // Remove highlight effect, keep original style
  }

  checkForElimination(row, col) {
    const gridCell = this.gridData[row][col]
    const positions = gridCell.positions
    
    // Check if all three positions have items
    const allPositionsFilled = positions.every(pos => pos !== null)
    
    if (allPositionsFilled) {
      // Check if all are same type
      const firstItemType = positions[0]
      const allSameType = positions.every(pos => pos === firstItemType)
      
      if (allSameType) {
        this.eliminateItems(row, col, firstItemType)
      }
    }
  }

  eliminateItems(row, col, itemType) {
    const gridCell = this.gridData[row][col]
    const slot = this.gridSlots[row][col]
    
    // Play cartoon elimination sound
    this.sound.play('match_eliminate', { volume: audioConfig.sfxVolume.value })
    
    // Update elimination count
    this.eliminatedCounts[itemType] += gameConfig.maxItemsPerSlot.value
    this.updateTargetDisplay()
    
    // Send updated stats to opponent in online mode
    this.sendMyStatsToOpponent()
    
    // Create cartoon-style elimination effect
    this.createCartoonEliminationEffect(slot.x, slot.y, itemType)
    
    // Cartoon-style item elimination animation
    gridCell.items.forEach((item, index) => {
      // First bounce and enlarge
      this.tweens.add({
        targets: item,
        scaleX: item.scaleX * 1.5,
        scaleY: item.scaleY * 1.5,
        duration: 150,
        ease: 'Back.easeOut',
        yoyo: true,
        onComplete: () => {
          // Then rotate and disappear
          this.tweens.add({
            targets: item,
            rotation: Math.PI * 2,
            alpha: 0,
            scale: 0,
            duration: 400,
            ease: 'Back.easeIn',
            delay: index * 50,  // Stagger time
            onComplete: () => {
              item.destroy()
            }
          })
        }
      })
    })

    // Clear slots and positions
    gridCell.positions = [null, null, null]
    gridCell.items = []
    
    // Update all position indicators
    for (let i = 0; i < 3; i++) {
      this.updatePositionIndicator(row, col, i, null)
    }
    
    // Delay restock
    this.time.delayedCall(gameConfig.refillDelay.value, () => {
      this.refillSlot(row, col)
    })
  }

  createCartoonEliminationEffect(x, y, itemType) {
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

    // Cute +score effect
    const scoreText = this.add.text(x + 35, y - 25, '💖 +3 💖', {
      fontSize: '19px',  // Reduce text size
      fontFamily: window.getGameFont(),  // Cute font
      color: '#FF1493',  // Deep pink
      stroke: '#FFFFFF',
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
    
    // Target items that need to be collected (milk, chips, cola)
    const targetItems = ['milk_box', 'chips_bag', 'cola_bottle']
    
    // Check which targets are not yet completed
    const incompleteTargets = targetItems.filter(itemType => {
      const display = this.targetDisplays.find(d => d.type === itemType)
      return display && this.eliminatedCounts[itemType] < display.target
    })
    
    // Guarantee at least 1 target item if targets are incomplete
    const guaranteeTargetItem = incompleteTargets.length > 0 && Math.random() < 0.6 // 60% chance
    
    for (let i = 0; i < itemCount; i++) {
      let itemType
      
      // First item: 60% chance to be an incomplete target item
      if (i === 0 && guaranteeTargetItem) {
        itemType = incompleteTargets[Phaser.Math.Between(0, incompleteTargets.length - 1)]
      } else {
        // Other items: random selection
        itemType = this.getRandomItemType()
      }
      
      this.addItemToSlot(row, col, itemType)
    }
  }

  updateTargetDisplay() {
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
    
    // Listen for opponent's game state updates
    multiplayerService.onGameStateUpdate = (state) => {
      if (state && state.eliminatedCounts) {
        this.updateOpponentStats(state.eliminatedCounts)
      }
    }
    
    // Listen for game actions (like background sync)
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
    }
    
    console.log('✅ Multiplayer sync enabled - stats and background will sync in real-time')
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

  updateOpponentStats(opponentData) {
    if (this.gameMode !== 'online') return
    
    // Update opponent stats from multiplayer service
    if (opponentData.milk_box !== undefined) {
      this.opponentStats.milk_box = opponentData.milk_box
      if (this.opponentMilkText) {
        this.opponentMilkText.setText(`${opponentData.milk_box}/${levelConfig.targetMilk.value}`)
        
        // Add animation when opponent makes progress
        this.tweens.add({
          targets: this.opponentMilkText,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 150,
          ease: 'Back.easeOut',
          yoyo: true
        })
      }
    }
    
    if (opponentData.chips_bag !== undefined) {
      this.opponentStats.chips_bag = opponentData.chips_bag
      if (this.opponentChipsText) {
        this.opponentChipsText.setText(`${opponentData.chips_bag}/${levelConfig.targetChips.value}`)
        
        // Add animation when opponent makes progress
        this.tweens.add({
          targets: this.opponentChipsText,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 150,
          ease: 'Back.easeOut',
          yoyo: true
        })
      }
    }
    
    if (opponentData.cola_bottle !== undefined) {
      this.opponentStats.cola_bottle = opponentData.cola_bottle
      if (this.opponentColaText) {
        this.opponentColaText.setText(`${opponentData.cola_bottle}/${levelConfig.targetCola.value}`)
        
        // Add animation when opponent makes progress
        this.tweens.add({
          targets: this.opponentColaText,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 150,
          ease: 'Back.easeOut',
          yoyo: true
        })
      }
    }
  }

  sendMyStatsToOpponent() {
    if (this.gameMode !== 'online') return
    
    // Send current stats to opponent
    const myStats = {
      eliminatedCounts: {
        milk_box: this.eliminatedCounts['milk_box'],
        chips_bag: this.eliminatedCounts['chips_bag'],
        cola_bottle: this.eliminatedCounts['cola_bottle']
      },
      moves: this.currentMoves
    }
    
    multiplayerService.sendGameState(myStats)
  }

  updateMoveCounter() {
    this.moveCounterText.setText(`✨ Moves: ${this.currentMoves}/${levelConfig.maxMoves.value} ✨`)
    
    if (this.currentMoves >= levelConfig.maxMoves.value) {
      this.moveCounterText.setColor('#FF6347')  // Softer red
      this.moveCounterText.setText(`⚠️ Moves: ${this.currentMoves}/${levelConfig.maxMoves.value} ⚠️`)
    }
  }

  checkGameEnd() {
    // Check victory conditions - need to achieve all targets
    const milkTarget = this.eliminatedCounts['milk_box'] >= levelConfig.targetMilk.value
    const chipsTarget = this.eliminatedCounts['chips_bag'] >= levelConfig.targetChips.value
    const colaTarget = this.eliminatedCounts['cola_bottle'] >= levelConfig.targetCola.value
    const victoryConditionMet = milkTarget && chipsTarget && colaTarget
    
    if (victoryConditionMet && !this.levelComplete) {
      this.levelComplete = true
      this.sound.play('level_complete', { volume: audioConfig.sfxVolume.value })
      this.scene.launch('VictoryScene')
      return
    }
    
    // Check failure conditions
    if (this.currentMoves >= levelConfig.maxMoves.value && !this.levelComplete) {
      this.gameOver = true
      this.sound.play('game_over', { volume: audioConfig.sfxVolume.value })
      this.scene.launch('GameOverScene')
    }
  }

  playBackgroundMusic() {
    this.backgroundMusic = this.sound.add('tom_jerry_80s_retro_theme', {
      volume: audioConfig.musicVolume.value,
      loop: true
    })
    this.backgroundMusic.play()
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

  shutdown() {
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
}