// AnimationManager.js - Centralized animation system
export class AnimationManager {
  constructor(scene) {
    this.scene = scene
    this.createAllAnimations()
  }

  createAllAnimations() {
    // 🏃 Tom animations
    this.createTomAnimations()
    
    // 🐭 Jerry animations
    this.createJerryAnimations()
    
    // 🎯 Item animations
    this.createItemAnimations()
    
    // 💨 Effect animations
    this.createEffectAnimations()
    
    console.log('✅ All animations created successfully!')
  }

  // 🏃 Create Tom animations
  createTomAnimations() {
    // Tom chasing animation
    if (!this.scene.anims.exists('tom_chase')) {
      this.scene.anims.create({
        key: 'tom_chase',
        frames: [
          { key: 'tom_chasing_jerry', duration: 100 },
          { key: 'tom_cat_watching', duration: 100 }
        ],
        frameRate: 10,
        repeat: -1
      })
    }

    // Tom carrying sack animation
    if (!this.scene.anims.exists('tom_carry')) {
      this.scene.anims.create({
        key: 'tom_carry',
        frames: [
          { key: 'tom_carrying_sack', duration: 200 }
        ],
        frameRate: 5,
        repeat: 0
      })
    }

    // Tom tripping animation
    if (!this.scene.anims.exists('tom_trip')) {
      this.scene.anims.create({
        key: 'tom_trip',
        frames: [
          { key: 'tom_carrying_sack', duration: 100 },
          { key: 'tom_tripping', duration: 100 }
        ],
        frameRate: 10,
        repeat: 0
      })
    }

    // Tom with hammer animation
    if (!this.scene.anims.exists('tom_hammer')) {
      this.scene.anims.create({
        key: 'tom_hammer',
        frames: [
          { key: 'tom_with_hammer', duration: 200 }
        ],
        frameRate: 5,
        repeat: 0
      })
    }

    // Tom watching idle animation (subtle movement)
    if (!this.scene.anims.exists('tom_watch_idle')) {
      this.scene.anims.create({
        key: 'tom_watch_idle',
        frames: [
          { key: 'tom_cat_watching', duration: 1000 }
        ],
        frameRate: 1,
        repeat: -1
      })
    }
  }

  // 🐭 Create Jerry animations
  createJerryAnimations() {
    // Jerry running scared animation
    if (!this.scene.anims.exists('jerry_run')) {
      this.scene.anims.create({
        key: 'jerry_run',
        frames: [
          { key: 'jerry_running_scared', duration: 100 },
          { key: 'mouse_run_away', duration: 100 }
        ],
        frameRate: 10,
        repeat: -1
      })
    }

    // Jerry escape animation
    if (!this.scene.anims.exists('jerry_escape')) {
      this.scene.anims.create({
        key: 'jerry_escape',
        frames: [
          { key: 'mouse_run_away', duration: 150 }
        ],
        frameRate: 6,
        repeat: 0
      })
    }

    // Jerry idle animation
    if (!this.scene.anims.exists('jerry_idle')) {
      this.scene.anims.create({
        key: 'jerry_idle',
        frames: [
          { key: 'jerry_head', duration: 1000 }
        ],
        frameRate: 1,
        repeat: -1
      })
    }
  }

  // 🎯 Create item animations
  createItemAnimations() {
    const itemTypes = [
      'milk_box', 'chips_bag', 'cola_bottle', 'cookie_box',
      'detergent_bottle', 'tissue_pack', 'toothpaste', 'bread',
      'towel', 'yogurt_cups', 'energy_drinks', 'coffee_cans',
      'soap_dispensers', 'instant_noodles', 'shampoo_bottles',
      'juice_bottles', 'candy_jars'
    ]

    itemTypes.forEach(itemType => {
      const animKey = `${itemType}_idle`
      
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: [
            { key: itemType, duration: 1000 }
          ],
          frameRate: 1,
          repeat: -1
        })
      }
    })

    // Obstacle animations
    const obstacles = ['anvil_obstacle', 'safe_obstacle', 'piano_obstacle']
    
    obstacles.forEach(obstacle => {
      const animKey = `${obstacle}_fall`
      
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: [
            { key: obstacle, duration: 100 }
          ],
          frameRate: 10,
          repeat: 0
        })
      }
    })
  }

  // 💨 Create effect animations
  createEffectAnimations() {
    // Dust cloud animation
    if (!this.scene.anims.exists('dust_appear')) {
      this.scene.anims.create({
        key: 'dust_appear',
        frames: [
          { key: 'dust_cloud', duration: 200 }
        ],
        frameRate: 5,
        repeat: 0
      })
    }
  }

  // 🎬 Play animation on a sprite
  playAnimation(sprite, animationKey, onComplete = null) {
    if (!sprite || !animationKey) {
      console.warn('Invalid sprite or animation key')
      return
    }

    // Check if animation exists
    if (!this.scene.anims.exists(animationKey)) {
      console.warn(`Animation "${animationKey}" does not exist!`)
      return
    }

    // Play animation
    sprite.play(animationKey)

    // Add completion callback if provided
    if (onComplete) {
      sprite.once('animationcomplete', onComplete)
    }
  }

  // 🎯 Create custom tween animation (for smooth movements)
  createTweenAnimation(config) {
    return this.scene.tweens.add(config)
  }

  // 🌟 Create sprite with animation
  createAnimatedSprite(x, y, textureKey, animationKey = null, scale = 1) {
    const sprite = this.scene.add.sprite(x, y, textureKey)
    sprite.setScale(scale)

    if (animationKey && this.scene.anims.exists(animationKey)) {
      sprite.play(animationKey)
    }

    return sprite
  }

  // 💫 Create particle effect
  createParticleEffect(x, y, particleKey = 'particle_effect', config = {}) {
    const defaultConfig = {
      speed: { min: 50, max: 200 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      quantity: 10,
      ...config
    }

    const particles = this.scene.add.particles(x, y, particleKey, defaultConfig)
    
    // Auto-destroy after lifespan
    this.scene.time.delayedCall(defaultConfig.lifespan + 500, () => {
      particles.destroy()
    })

    return particles
  }

  // 🎨 Enhanced item animations with tweens
  animateItemSpawn(item, delay = 0) {
    item.setScale(0)
    item.setAlpha(0)

    this.scene.tweens.add({
      targets: item,
      scale: 0.075,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut.config(2)',
      delay: delay
    })
  }

  animateItemEliminate(item, onComplete = null) {
    // Bounce and enlarge
    this.scene.tweens.add({
      targets: item,
      scaleX: item.scaleX * 1.5,
      scaleY: item.scaleY * 1.5,
      duration: 150,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        // Rotate and disappear
        this.scene.tweens.add({
          targets: item,
          rotation: Math.PI * 2,
          alpha: 0,
          scale: 0,
          duration: 400,
          ease: 'Back.easeIn',
          onComplete: () => {
            item.destroy()
            if (onComplete) onComplete()
          }
        })
      }
    })
  }

  animateItemPickup(item) {
    this.scene.tweens.add({
      targets: item,
      scaleX: 0.075 * 1.5,
      scaleY: 0.075 * 1.5,
      duration: 150,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        item.setScale(0.090)
      }
    })
  }

  animateItemDrop(item, targetX, targetY) {
    this.scene.tweens.add({
      targets: item,
      x: targetX,
      y: targetY,
      duration: 300,
      ease: 'Bounce.easeOut'
    })
  }

  // 🎪 Tom event animations
  animateTomChase(tomSprite, jerrySprite) {
    const screenWidth = this.scene.cameras.main.width

    // Jerry runs first
    this.scene.tweens.add({
      targets: jerrySprite,
      x: screenWidth + 150,
      duration: 2500,
      ease: 'Linear'
    })

    // Tom chases
    this.scene.time.delayedCall(400, () => {
      this.scene.tweens.add({
        targets: tomSprite,
        x: screenWidth + 150,
        duration: 2500,
        ease: 'Linear'
      })
    })
  }

  animateTomFall(tomSprite, onComplete = null) {
    this.scene.tweens.add({
      targets: tomSprite,
      y: this.scene.cameras.main.height + 150,
      rotation: Math.PI * 2,
      duration: 1000,
      ease: 'Cubic.easeIn',
      onComplete: onComplete
    })
  }

  // 🌊 CASCADE MODE: Item falling animations
  animateItemFall(item, fromY, toY, onComplete = null) {
    // Animate item falling down with bounce
    this.scene.tweens.add({
      targets: item,
      y: toY,
      duration: 400,
      ease: 'Bounce.easeOut',
      onComplete: onComplete
    })

    // Add rotation while falling
    this.scene.tweens.add({
      targets: item,
      rotation: item.rotation + (Math.PI / 4),
      duration: 400,
      ease: 'Linear'
    })
  }

  animateCascadeChain(items, delay = 100) {
    // Animate multiple items falling in sequence
    items.forEach((item, index) => {
      this.scene.time.delayedCall(index * delay, () => {
        // Highlight effect before falling
        this.scene.tweens.add({
          targets: item,
          scaleX: item.scaleX * 1.2,
          scaleY: item.scaleY * 1.2,
          duration: 100,
          ease: 'Back.easeOut',
          yoyo: true
        })
      })
    })
  }

  createCascadeEffect(x, y) {
    // Water/wave effect for cascade mode
    const wave = this.scene.add.graphics()
    wave.lineStyle(3, 0x00BFFF, 0.8)
    wave.strokeCircle(x, y, 10)
    wave.setDepth(9999)

    // Multiple expanding waves
    for (let i = 0; i < 3; i++) {
      this.scene.tweens.add({
        targets: wave,
        scaleX: 2 + i * 0.5,
        scaleY: 2 + i * 0.5,
        alpha: 0,
        duration: 600 + i * 100,
        ease: 'Cubic.easeOut',
        delay: i * 100,
        onComplete: () => {
          if (i === 2) wave.destroy()
        }
      })
    }

    // Water droplets
    const droplets = ['💧', '💦', '🌊']
    for (let i = 0; i < 6; i++) {
      const droplet = this.scene.add.text(
        x,
        y,
        droplets[Math.floor(Math.random() * droplets.length)],
        {
          fontSize: '18px',
          color: '#00BFFF'
        }
      ).setOrigin(0.5, 0.5).setDepth(10000)

      const angle = (i / 6) * Math.PI * 2
      const distance = 40

      this.scene.tweens.add({
        targets: droplet,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => droplet.destroy()
      })
    }
  }

  // 🌊 Cascade mode: Item gravity effect
  applyGravityEffect(item, strength = 1) {
    // Items feel "heavier" in cascade mode
    this.scene.tweens.add({
      targets: item,
      scaleY: item.scaleY * 0.9,
      duration: 100,
      ease: 'Quad.easeIn',
      yoyo: true
    })
  }

  // 🌟 Screen effects
  createScreenShake(duration = 500, intensity = 0.01) {
    this.scene.cameras.main.shake(duration, intensity)
  }

  createScreenFlash(color = 0xffffff, duration = 100) {
    this.scene.cameras.main.flash(duration, color)
  }

  // 💥 Impact effects
  createImpactEffect(x, y) {
    // Create rings
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics()
      ring.lineStyle(6 - i * 2, 0xAAAAAA, 0.8 - i * 0.2)
      ring.strokeCircle(x, y, 10)
      ring.setDepth(9999)

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

  // 🎨 Combo text animations
  createComboText(x, y, comboLevel, points) {
    let comboText = ''
    let comboColor = '#FFD700'
    let comboFontSize = '22px'

    if (comboLevel >= 5) {
      comboText = `🔥 MEGA COMBO x${comboLevel}! 🔥`
      comboColor = '#FF4500'
      comboFontSize = '28px'
    } else if (comboLevel >= 3) {
      comboText = `⚡ COMBO x${comboLevel}! ⚡`
      comboColor = '#FF8C00'
      comboFontSize = '24px'
    } else if (comboLevel >= 2) {
      comboText = `✨ COMBO x${comboLevel}! ✨`
      comboColor = '#FFD700'
      comboFontSize = '22px'
    }

    if (comboLevel > 1) {
      const comboTextObj = this.scene.add.text(x, y - 80, comboText, {
        fontSize: comboFontSize,
        fontFamily: window.getGameFont(),
        color: comboColor,
        stroke: '#000000',
        strokeThickness: 4,
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(10001)

      this.scene.tweens.add({
        targets: comboTextObj,
        y: y - 120,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        duration: 1000,
        ease: 'Back.easeOut',
        onComplete: () => comboTextObj.destroy()
      })
    }

    // Score text
    const scoreText = this.scene.add.text(x + 35, y - 25, `+${points} 💎`, {
      fontSize: '24px',
      fontFamily: window.getGameFont(),
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(10000)

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
          onComplete: () => scoreText.destroy()
        })
      }
    })
  }
}
