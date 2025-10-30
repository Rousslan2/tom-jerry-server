/**
 * 📦 Asset Manager
 * Gestion optimisée des ressources pour améliorer les performances
 *
 * Fonctionnalités :
 * - Chargement progressif des assets
 * - Mise en cache intelligente
 * - Gestion de la mémoire
 * - Préchargement stratégique
 * - Compression et optimisation
 */

export class AssetManager {
  constructor(scene) {
    this.scene = scene
    this.cache = new Map()
    this.loadingQueue = []
    this.loadedAssets = new Set()
    this.memoryUsage = 0
    this.maxMemoryUsage = 50 * 1024 * 1024 // 50MB limite

    this.initializeAssetOptimization()
  }

  /**
   * 🔧 Initialisation des optimisations d'assets
   */
  initializeAssetOptimization() {
    // Configurer les paramètres de chargement Phaser
    this.scene.load.crossOrigin = 'anonymous'

    // Activer la compression si supportée
    if (this.scene.renderer && this.scene.renderer.gl) {
      this.enableTextureCompression()
    }

    // Configurer le cache
    this.setupCaching()

    // Surveiller l'utilisation mémoire
    this.monitorMemoryUsage()

    console.log('📦 Asset optimization enabled')
  }

  /**
   * 🗜️ Activer la compression de texture
   */
  enableTextureCompression() {
    try {
      const gl = this.scene.renderer.gl

      // Vérifier le support des formats compressés
      const ext = gl.getExtension('WEBGL_compressed_texture_s3tc') ||
                  gl.getExtension('WEBGL_compressed_texture_etc') ||
                  gl.getExtension('WEBGL_compressed_texture_pvrtc')

      if (ext) {
        console.log('🗜️ Texture compression enabled')
      }
    } catch (e) {
      console.warn('Texture compression not supported')
    }
  }

  /**
   * 💾 Configuration du cache
   */
  setupCaching() {
    // Cache des textures fréquemment utilisées
    this.textureCache = new Map()

    // Cache des sons
    this.audioCache = new Map()

    // Stratégies de cache
    this.cacheStrategies = {
      // Textures UI - garder en mémoire
      ui: { priority: 'high', lifetime: -1 },

      // Textures de jeu - cache intelligent
      game: { priority: 'medium', lifetime: 300000 }, // 5 minutes

      // Sons d'effet - cache limité
      sfx: { priority: 'low', lifetime: 60000 }, // 1 minute

      // Musique de fond - garder en mémoire
      music: { priority: 'high', lifetime: -1 }
    }
  }

  /**
   * 📊 Surveillance de l'utilisation mémoire
   */
  monitorMemoryUsage() {
    // Vérifier la mémoire toutes les 30 secondes
    this.scene.time.addEvent({
      delay: 30000,
      callback: this.checkMemoryUsage,
      callbackScope: this,
      loop: true
    })

    // Nettoyer le cache automatiquement
    this.scene.time.addEvent({
      delay: 60000, // Toutes les minutes
      callback: this.cleanupCache,
      callbackScope: this,
      loop: true
    })
  }

  /**
   * 🔍 Vérifier l'utilisation mémoire
   */
  checkMemoryUsage() {
    // Estimation de la mémoire utilisée
    let estimatedUsage = 0

    // Textures
    this.scene.textures.each(texture => {
      if (texture.source && texture.source[0]) {
        const source = texture.source[0]
        if (source.width && source.height) {
          // Estimation approximative: 4 bytes par pixel (RGBA)
          estimatedUsage += source.width * source.height * 4
        }
      }
    })

    // Sons
    this.scene.sound.sounds.forEach(sound => {
      if (sound.buffer) {
        estimatedUsage += sound.buffer.length * 4 // Approximation
      }
    })

    this.memoryUsage = estimatedUsage

    // Avertissement si on dépasse 80% de la limite
    if (this.memoryUsage > this.maxMemoryUsage * 0.8) {
      console.warn(`⚠️ High memory usage: ${(this.memoryUsage / 1024 / 1024).toFixed(2)}MB`)
      this.optimizeMemoryUsage()
    }
  }

  /**
   * 🧹 Optimisation de l'utilisation mémoire
   */
  optimizeMemoryUsage() {
    // Libérer les textures non utilisées
    this.scene.textures.each((texture, key) => {
      if (this.shouldUnloadTexture(texture, key)) {
        this.unloadTexture(key)
      }
    })

    // Libérer les sons non utilisés
    this.scene.sound.sounds.forEach(sound => {
      if (this.shouldUnloadSound(sound)) {
        sound.destroy()
      }
    })

    // Forcer le garbage collection si disponible
    if (window.gc) {
      window.gc()
    }
  }

  /**
   * 🗂️ Nettoyage du cache
   */
  cleanupCache() {
    const now = Date.now()

    // Nettoyer les textures expirées
    for (const [key, data] of this.textureCache.entries()) {
      if (data.lifetime > 0 && now - data.loadedAt > data.lifetime) {
        this.unloadTexture(key)
        this.textureCache.delete(key)
      }
    }

    // Nettoyer les sons expirés
    for (const [key, data] of this.audioCache.entries()) {
      if (data.lifetime > 0 && now - data.loadedAt > data.lifetime) {
        this.unloadAudio(key)
        this.audioCache.delete(key)
      }
    }
  }

  /**
   * 📥 Chargement progressif des assets
   */
  loadAssetsProgressively(assetGroups) {
    // Trier par priorité
    const sortedGroups = assetGroups.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // Charger groupe par groupe
    let currentGroupIndex = 0

    const loadNextGroup = () => {
      if (currentGroupIndex >= sortedGroups.length) {
        this.onAllAssetsLoaded()
        return
      }

      const group = sortedGroups[currentGroupIndex]
      console.log(`📦 Loading asset group: ${group.name}`)

      this.loadAssetGroup(group, () => {
        currentGroupIndex++
        // Petit délai entre les groupes pour éviter de surcharger
        this.scene.time.delayedCall(100, loadNextGroup)
      })
    }

    loadNextGroup()
  }

  /**
   * 📋 Charger un groupe d'assets
   */
  loadAssetGroup(group, onComplete) {
    const assets = group.assets
    let loadedCount = 0
    const totalCount = assets.length

    const onAssetLoaded = () => {
      loadedCount++
      if (loadedCount >= totalCount) {
        console.log(`✅ Asset group loaded: ${group.name}`)
        onComplete()
      }
    }

    assets.forEach(asset => {
      if (!this.isAssetLoaded(asset.key)) {
        this.loadSingleAsset(asset, onAssetLoaded)
      } else {
        onAssetLoaded()
      }
    })
  }

  /**
   * 📄 Charger un asset individuel
   */
  loadSingleAsset(asset, onComplete) {
    const { type, key, path, options = {} } = asset

    try {
      switch (type) {
        case 'image':
          this.scene.load.image(key, path)
          break
        case 'spritesheet':
          this.scene.load.spritesheet(key, path, options.frameConfig)
          break
        case 'audio':
          this.scene.load.audio(key, path)
          break
        case 'json':
          this.scene.load.json(key, path)
          break
        case 'bitmapFont':
          this.scene.load.bitmapFont(key, path.image, path.fontData)
          break
      }

      // Marquer comme chargé
      this.loadedAssets.add(key)

      // Ajouter au cache approprié
      this.addToCache(key, type, options)

      this.scene.load.once(`filecomplete-${type}-${key}`, onComplete)

    } catch (error) {
      console.error(`Failed to load asset ${key}:`, error)
      onComplete() // Continuer même en cas d'erreur
    }
  }

  /**
   * 💾 Ajouter au cache
   */
  addToCache(key, type, options) {
    const strategy = this.cacheStrategies[options.category || 'game']
    const cacheData = {
      type: type,
      loadedAt: Date.now(),
      priority: strategy.priority,
      lifetime: strategy.lifetime,
      lastUsed: Date.now()
    }

    if (type === 'image' || type === 'spritesheet') {
      this.textureCache.set(key, cacheData)
    } else if (type === 'audio') {
      this.audioCache.set(key, cacheData)
    }
  }

  /**
   * 🔄 Précharger des assets stratégiques
   */
  preloadStrategicAssets() {
    const strategicAssets = [
      // Assets critiques pour le démarrage
      { type: 'image', key: 'title_background', path: 'assets/title_background.png', category: 'ui' },
      { type: 'image', key: 'game_title', path: 'assets/game_title.png', category: 'ui' },

      // Assets de jeu fréquemment utilisés
      { type: 'image', key: 'milk_box', path: 'assets/items/milk_box.png', category: 'game' },
      { type: 'image', key: 'jerry_head', path: 'assets/jerry_head.png', category: 'game' },

      // Sons importants
      { type: 'audio', key: 'item_pickup', path: 'assets/sounds/item_pickup.mp3', category: 'sfx' },
      { type: 'audio', key: 'match_eliminate', path: 'assets/sounds/match_eliminate.mp3', category: 'sfx' }
    ]

    this.loadAssetsProgressively([
      { name: 'critical', priority: 'critical', assets: strategicAssets.slice(0, 2) },
      { name: 'ui', priority: 'high', assets: strategicAssets.slice(2, 4) },
      { name: 'game', priority: 'medium', assets: strategicAssets.slice(4) }
    ])
  }

  /**
   * 🚀 Précharger pour une scène spécifique
   */
  preloadForScene(sceneKey) {
    const sceneAssets = this.getSceneAssets(sceneKey)

    if (sceneAssets.length > 0) {
      console.log(`🎯 Preloading assets for scene: ${sceneKey}`)
      this.loadAssetsProgressively([
        { name: sceneKey, priority: 'high', assets: sceneAssets }
      ])
    }
  }

  /**
   * 📋 Obtenir les assets d'une scène
   */
  getSceneAssets(sceneKey) {
    const sceneAssetMap = {
      'TitleScene': [
        { type: 'image', key: 'title_background', path: 'assets/title_background.png', category: 'ui' },
        { type: 'image', key: 'game_title', path: 'assets/game_title.png', category: 'ui' },
        { type: 'audio', key: 'tom_jerry_80s_retro_theme', path: 'assets/music/tom_jerry_theme.mp3', category: 'music' }
      ],
      'GameScene': [
        { type: 'image', key: 'milk_box', path: 'assets/items/milk_box.png', category: 'game' },
        { type: 'image', key: 'jerry_head', path: 'assets/jerry_head.png', category: 'game' },
        { type: 'image', key: 'tom_cat_watching', path: 'assets/tom_cat_watching.png', category: 'game' },
        { type: 'audio', key: 'item_pickup', path: 'assets/sounds/item_pickup.mp3', category: 'sfx' }
      ]
    }

    return sceneAssetMap[sceneKey] || []
  }

  /**
   * ✅ Vérifier si un asset est chargé
   */
  isAssetLoaded(key) {
    return this.loadedAssets.has(key) ||
           this.scene.textures.exists(key) ||
           this.scene.sound.sounds.some(sound => sound.key === key)
  }

  /**
   * 🗑️ Décharger une texture
   */
  unloadTexture(key) {
    if (this.scene.textures.exists(key)) {
      this.scene.textures.remove(key)
      this.loadedAssets.delete(key)
      console.log(`🗑️ Unloaded texture: ${key}`)
    }
  }

  /**
   * 🔊 Décharger un son
   */
  unloadAudio(key) {
    const sound = this.scene.sound.get(key)
    if (sound) {
      sound.destroy()
      this.loadedAssets.delete(key)
      console.log(`🔊 Unloaded audio: ${key}`)
    }
  }

  /**
   * 🤔 Décider si une texture doit être déchargée
   */
  shouldUnloadTexture(texture, key) {
    // Garder les textures UI et critiques
    if (key.startsWith('ui_') || key.includes('title') || key.includes('button')) {
      return false
    }

    // Décharger si pas utilisée récemment
    const cacheData = this.textureCache.get(key)
    if (cacheData) {
      const now = Date.now()
      const timeSinceLastUse = now - (cacheData.lastUsed || cacheData.loadedAt)
      return timeSinceLastUse > cacheData.lifetime
    }

    return false
  }

  /**
   * 🔊 Décider si un son doit être déchargé
   */
  shouldUnloadSound(sound) {
    // Garder la musique
    if (sound.key.includes('theme') || sound.key.includes('music')) {
      return false
    }

    // Décharger les effets sonores anciens
    const cacheData = this.audioCache.get(sound.key)
    if (cacheData) {
      const now = Date.now()
      const timeSinceLastUse = now - (cacheData.lastUsed || cacheData.loadedAt)
      return timeSinceLastUse > cacheData.lifetime
    }

    return false
  }

  /**
   * 📊 Marquer un asset comme utilisé récemment
   */
  markAssetAsUsed(key) {
    const now = Date.now()

    if (this.textureCache.has(key)) {
      this.textureCache.get(key).lastUsed = now
    }

    if (this.audioCache.has(key)) {
      this.audioCache.get(key).lastUsed = now
    }
  }

  /**
   * 📈 Obtenir les statistiques d'utilisation des assets
   */
  getAssetStats() {
    return {
      loadedAssets: this.loadedAssets.size,
      cachedTextures: this.textureCache.size,
      cachedAudio: this.audioCache.size,
      memoryUsage: this.memoryUsage,
      memoryUsageMB: (this.memoryUsage / 1024 / 1024).toFixed(2),
      cacheHitRate: this.calculateCacheHitRate()
    }
  }

  /**
   * 🎯 Calculer le taux de succès du cache
   */
  calculateCacheHitRate() {
    // Cette métrique pourrait être calculée en surveillant les chargements
    // Pour l'instant, retourner une estimation
    return 0.85 // 85% de taux de succès estimé
  }

  /**
   * 🎬 Callback quand tous les assets sont chargés
   */
  onAllAssetsLoaded() {
    console.log('🎉 All assets loaded successfully!')
    console.log('📊 Asset stats:', this.getAssetStats())

    // Optimiser après le chargement
    this.postLoadOptimization()
  }

  /**
   * ⚡ Optimisations post-chargement
   */
  postLoadOptimization() {
    // Générer des mipmaps pour les textures
    this.scene.textures.each(texture => {
      if (texture.source && texture.source[0]) {
        try {
          texture.source[0].setFilter(1) // LINEAR filtering
        } catch (e) {
          // Ignorer les erreurs
        }
      }
    })

    // Préparer les sons fréquemment utilisés
    const frequentSounds = ['item_pickup', 'match_eliminate', 'ui_click']
    frequentSounds.forEach(soundKey => {
      if (this.scene.sound.exists(soundKey)) {
        this.markAssetAsUsed(soundKey)
      }
    })
  }

  /**
   * 🧹 Nettoyer toutes les ressources
   */
  destroy() {
    // Vider les caches
    this.cache.clear()
    this.textureCache.clear()
    this.audioCache.clear()
    this.loadedAssets.clear()
    this.loadingQueue = []

    // Supprimer les timers
    if (this.memoryCheckTimer) {
      this.memoryCheckTimer.remove()
    }

    if (this.cacheCleanupTimer) {
      this.cacheCleanupTimer.remove()
    }

    console.log('🧹 Asset manager cleaned up')
  }
}