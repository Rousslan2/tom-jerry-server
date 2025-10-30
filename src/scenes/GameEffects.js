import Phaser from 'phaser'
import { audioConfig } from '../gameConfig.json'

export class GameEffects {
  constructor(scene) {
    this.scene = scene
    this.dragRing = null
    this.slotHighlights = []
  }

  // Apply Tom and Jerry retro cartoon items opaque bright processing
  applyTomJerryItemEnhancement(item) {
    // Professional quality rendering settings
    item.setBlendMode(Phaser.BlendModes.NORMAL)

    // Clear any tint, keep original bright colors
    item.clearTint()

    // Keep completely opaque for sharp, clean look
    item.setAlpha(1.0)

    // Add subtle drop shadow for depth and professionalism
    if (this.scene.plugins && this.scene.plugins.get('rexDropShadowPipeline')) {
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

  // Create drag effects for items
  createDragEffects(item) {
    // Add cute rainbow glow effect
    item.setTint(0xFFB6C1)  // Light pink glow effect

    // Create cute multi-layer halo effect
    this.dragRing = this.scene.add.graphics()

    // Outer halo - pink
    this.dragRing.lineStyle(4, 0xFF69B4, 0.6)
    this.dragRing.strokeCircle(item.x, item.y, 30 * 0.95)  // Halo size reduced to 95%

    // Middle halo - purple
    this.dragRing.lineStyle(3, 0xDA70D6, 0.7)
    this.dragRing.strokeCircle(item.x, item.y, 22 * 0.95)  // Halo size reduced to 95%

    // Inner halo - white
    this.dragRing.lineStyle(2, 0xFFFFFF, 0.8)
    this.dragRing.strokeCircle(item.x, item.y, 15 * 0.95)  // Halo size reduced to 95%

    this.dragRing.setDepth(999)

    // Cute halo pulse animation
    this.scene.tweens.add({
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

    this.scene.sound.play('item_pickup', { volume: audioConfig.sfxVolume.value })
  }

  // Clear drag effects
  clearDragEffects() {
    if (this.dragRing) {
      this.scene.tweens.killTweensOf(this.dragRing)
      this.dragRing.destroy()
      this.dragRing = null
    }
  }

  // Highlight available slots
  highlightAvailableSlots() {
    // Clear any existing highlights first
    this.clearSlotHighlights()

    const rows = this.scene.gameConfig.gridRows.value
    const cols = this.scene.gameConfig.gridCols.value

    // Create highlights for slots with at least one empty position
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gridCell = this.scene.gridData[row][col]
        const hasEmptyPosition = gridCell.positions.some(pos => pos === null)

        if (hasEmptyPosition) {
          // Green glow for available slots
          const slot = this.scene.gridSlots[row][col]
          const highlight = this.scene.add.graphics()
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
          this.scene.tweens.add({
            targets: highlight,
            alpha: 0.3,
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
          })

          this.slotHighlights.push(highlight)
        } else {
          // Red X for full slots
          const slot = this.scene.gridSlots[row][col]
          const redX = this.scene.add.graphics()
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

          this.slotHighlights.push(redX)
        }
      }
    }
  }

  // Clear slot highlights
  clearSlotHighlights() {
    if (this.slotHighlights) {
      this.slotHighlights.forEach(highlight => {
        this.scene.tweens.killTweensOf(highlight)
        highlight.destroy()
      })
      this.slotHighlights = []
    }
  }

  // Create cartoon-style elimination effect
  createCartoonEliminationEffect(x, y, itemType, earnedPoints) {
    // Jerry direct escape animation
    const jerry = this.scene.add.image(x, y, 'mouse_run_away')
      .setOrigin(0.5, 0.5)
      .setScale(0) // Start from 0, have a pop effect
      .setDepth(10000)

    // Set initial properties
    jerry.setAlpha(1)

    // First let Jerry pop up, then start escaping
    this.scene.tweens.add({
      targets: jerry,
      scale: 0.08, // First a bit larger than normal size
      duration: 150,
      ease: 'Back.easeOut.config(1.7)',
      onComplete: () => {
        // Create Jerry escape animation effect
        this.scene.tweens.add({
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
            this.createDustCloud(x + 100, y - 20);
          }
        });
      }
    });

    // Second phase: puff of smoke disappearance effect
    const createDustCloud = (dustX, dustY) => {
      const dustCloud = this.scene.add.image(dustX, dustY, 'dust_cloud')
        .setOrigin(0.5, 0.5)
        .setScale(0.08)
        .setAlpha(0.8)
        .setDepth(9999);

      // Smoke spreads then disappears
      this.scene.tweens.add({
        targets: dustCloud,
        scaleX: 0.12,
        scaleY: 0.12,
        alpha: 0,
        x: dustX + 100,
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
      const effect = this.scene.add.text(x, y, cuteEffects[Math.floor(Math.random() * cuteEffects.length)], {
        fontSize: Phaser.Math.Between(14, 22) + 'px',
        color: ['#FF69B4', '#FFB6C1', '#FF1493', '#DA70D6', '#BA55D3', '#9370DB'][Math.floor(Math.random() * 6)]
      }).setOrigin(0.5, 0.5).setDepth(9999)

      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5
      const distance = Phaser.Math.Between(40, 80)

      this.scene.tweens.add({
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
    const ring = this.scene.add.graphics()

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

    this.scene.tweens.add({
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

    // Combo display
    this.createComboDisplay(x, y, earnedPoints)

    // Score display
    this.createScoreDisplay(x, y, earnedPoints)
  }

  // Create combo display
  createComboDisplay(x, y, earnedPoints) {
    let comboText = ''
    let comboColor = '#FFD700' // Gold by default
    let comboFontSize = '22px'

    if (this.scene.combo >= 5) {
      comboText = `🔥 MEGA COMBO x${this.scene.combo}! 🔥`
      comboColor = '#FF4500' // Red-orange
      comboFontSize = '28px'
    } else if (this.scene.combo >= 3) {
      comboText = `⚡ COMBO x${this.scene.combo}! ⚡`
      comboColor = '#FF8C00' // Dark orange
      comboFontSize = '24px'
    } else if (this.scene.combo >= 2) {
      comboText = `✨ COMBO x${this.scene.combo}! ✨`
      comboColor = '#FFD700' // Gold
      comboFontSize = '22px'
    }

    // Show combo text if combo > 1
    if (this.scene.combo > 1) {
      const comboTextObj = this.scene.add.text(x, y - 80, comboText, {
        fontSize: comboFontSize,
        fontFamily: window.getGameFont(),
        color: comboColor,
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(10001)

      // Combo text animation
      this.scene.tweens.add({
        targets: comboTextObj,
        y: y - 120,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        duration: 1000,
        ease: 'Back.easeOut'
      })
    }
  }

  // Create score display
  createScoreDisplay(x, y, earnedPoints) {
    const scoreText = this.scene.add.text(x + 35, y - 25, `+${earnedPoints} 💎`, {
      fontSize: '24px',
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(10000)

    // Bounce up animation
    this.scene.tweens.add({
      targets: scoreText,
      y: y - 70,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
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

  // Create obstacle impact effect
  createObstacleImpactEffect(x, y) {
    // Play impact sound
    this.scene.sound.play('item_drop', { volume: audioConfig.sfxVolume.value * 1.2 })

    // Dust cloud rings
    const rings = []
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics()
      ring.lineStyle(6 - i * 2, 0xAAAAAA, 0.8 - i * 0.2)
      ring.strokeCircle(x, y, 10)
      ring.setDepth(9999)
      rings.push(ring)

      this.scene.tweens.add({
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
      const star = this.scene.add.text(x, y, starEffects[Math.floor(Math.random() * starEffects.length)], {
        fontSize: '18px',
        color: '#FFD700'
      }).setOrigin(0.5, 0.5).setDepth(10000)

      const angle = (i / 8) * Math.PI * 2
      const distance = 50

      this.scene.tweens.add({
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

  // Create dust trail effect
  createDustTrail(yPosition) {
    const screenWidth = this.scene.cameras.main.width

    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 500, () => {
        const dust = this.scene.add.image(i * 200, yPosition + 20, 'dust_cloud')
          .setDepth(9999)
          .setScale(0.08)
          .setAlpha(0.6)

        this.scene.tweens.add({
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

  // Apply LINEAR filtering to all textures
  applyLinearFilteringToAllTextures() {
    let textureCount = 0

    // Iterate through all loaded textures
    this.scene.textures.each((texture) => {
      if (texture.key && texture.key !== '__DEFAULT' && texture.key !== '__MISSING') {
        // Apply LINEAR filtering to each texture source
        if (texture.source && texture.source[0]) {
          texture.source[0].setFilter(1) // 1 = Phaser.Textures.FilterMode.LINEAR
          textureCount++

          // Also set scaleMode for WebGL rendering
          if (texture.source[0].scaleMode !== undefined) {
            texture.source[0].scaleMode = 1 // LINEAR
          }
        }
      }
    })

    console.log(`✅ Applied LINEAR filtering to ${textureCount} textures for smooth scaling`)
  }
}