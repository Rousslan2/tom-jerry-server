/**
 * 🎨 Skin Manager
 * Gère les différents thèmes visuels des items
 */

export class SkinManager {
  constructor() {
    // Définition des skins disponibles
    this.skins = {
      original: {
        id: 'original',
        name: 'Original',
        description: 'Le thème classique',
        icon: '🎮',
        items: {
          milk_box: 'milk_box',
          chips_bag: 'chips_bag',
          cola_bottle: 'cola_bottle',
          cookie_box: 'cookie_box',
          detergent_bottle: 'detergent_bottle',
          tissue_pack: 'tissue_pack',
          toothpaste: 'toothpaste',
          bread: 'bread',
          towel: 'towel',
          yogurt_cups: 'yogurt_cups',
          energy_drinks: 'energy_drinks',
          coffee_cans: 'coffee_cans',
          soap_dispensers: 'soap_dispensers',
          instant_noodles: 'instant_noodles',
          shampoo_bottles: 'shampoo_bottles',
          juice_bottles: 'juice_bottles',
          candy_jars: 'candy_jars'
        },
        unlocked: true,
        unlockLevel: 0,
        unlockCost: 0
      },
      
      christmas: {
        id: 'christmas',
        name: 'Noël',
        description: 'Thème festif de Noël',
        icon: '🎄',
        items: {
          // Pour l'instant, on utilise les mêmes textures
          // Tu pourras créer de vraies textures de Noël plus tard
          milk_box: 'milk_box',  // → Sera 'hot_chocolate' quand tu auras l'image
          chips_bag: 'chips_bag', // → Sera 'gingerbread'
          cola_bottle: 'cola_bottle', // → Sera 'cranberry_juice'
          cookie_box: 'cookie_box', // → Sera 'christmas_cookies'
          detergent_bottle: 'detergent_bottle',
          tissue_pack: 'tissue_pack',
          toothpaste: 'toothpaste',
          bread: 'bread',
          towel: 'towel',
          yogurt_cups: 'yogurt_cups',
          energy_drinks: 'energy_drinks',
          coffee_cans: 'coffee_cans',
          soap_dispensers: 'soap_dispensers',
          instant_noodles: 'instant_noodles',
          shampoo_bottles: 'shampoo_bottles',
          juice_bottles: 'juice_bottles',
          candy_jars: 'candy_jars'
        },
        unlocked: false,
        unlockLevel: 5,
        unlockCost: 1000,
        // Couleur teinte pour simuler le thème
        tint: 0xFFCCCC
      },
      
      halloween: {
        id: 'halloween',
        name: 'Halloween',
        description: 'Thème effrayant',
        icon: '🎃',
        items: {
          milk_box: 'milk_box',
          chips_bag: 'chips_bag',
          cola_bottle: 'cola_bottle',
          cookie_box: 'cookie_box',
          detergent_bottle: 'detergent_bottle',
          tissue_pack: 'tissue_pack',
          toothpaste: 'toothpaste',
          bread: 'bread',
          towel: 'towel',
          yogurt_cups: 'yogurt_cups',
          energy_drinks: 'energy_drinks',
          coffee_cans: 'coffee_cans',
          soap_dispensers: 'soap_dispensers',
          instant_noodles: 'instant_noodles',
          shampoo_bottles: 'shampoo_bottles',
          juice_bottles: 'juice_bottles',
          candy_jars: 'candy_jars'
        },
        unlocked: false,
        unlockLevel: 10,
        unlockCost: 1500,
        tint: 0xFF8800
      },
      
      future: {
        id: 'future',
        name: 'Futuriste',
        description: 'Thème cyberpunk',
        icon: '🚀',
        items: {
          milk_box: 'milk_box',
          chips_bag: 'chips_bag',
          cola_bottle: 'cola_bottle',
          cookie_box: 'cookie_box',
          detergent_bottle: 'detergent_bottle',
          tissue_pack: 'tissue_pack',
          toothpaste: 'toothpaste',
          bread: 'bread',
          towel: 'towel',
          yogurt_cups: 'yogurt_cups',
          energy_drinks: 'energy_drinks',
          coffee_cans: 'coffee_cans',
          soap_dispensers: 'soap_dispensers',
          instant_noodles: 'instant_noodles',
          shampoo_bottles: 'shampoo_bottles',
          juice_bottles: 'juice_bottles',
          candy_jars: 'candy_jars'
        },
        unlocked: false,
        unlockLevel: 20,
        unlockCost: 2000,
        tint: 0x00FFFF
      },
      
      kawaii: {
        id: 'kawaii',
        name: 'Kawaii',
        description: 'Thème adorable',
        icon: '💖',
        items: {
          milk_box: 'milk_box',
          chips_bag: 'chips_bag',
          cola_bottle: 'cola_bottle',
          cookie_box: 'cookie_box',
          detergent_bottle: 'detergent_bottle',
          tissue_pack: 'tissue_pack',
          toothpaste: 'toothpaste',
          bread: 'bread',
          towel: 'towel',
          yogurt_cups: 'yogurt_cups',
          energy_drinks: 'energy_drinks',
          coffee_cans: 'coffee_cans',
          soap_dispensers: 'soap_dispensers',
          instant_noodles: 'instant_noodles',
          shampoo_bottles: 'shampoo_bottles',
          juice_bottles: 'juice_bottles',
          candy_jars: 'candy_jars'
        },
        unlocked: false,
        unlockLevel: 30,
        unlockCost: 2500,
        tint: 0xFFB6C1
      },
      
      golden: {
        id: 'golden',
        name: 'Doré',
        description: 'Thème luxueux',
        icon: '👑',
        items: {
          milk_box: 'milk_box',
          chips_bag: 'chips_bag',
          cola_bottle: 'cola_bottle',
          cookie_box: 'cookie_box',
          detergent_bottle: 'detergent_bottle',
          tissue_pack: 'tissue_pack',
          toothpaste: 'toothpaste',
          bread: 'bread',
          towel: 'towel',
          yogurt_cups: 'yogurt_cups',
          energy_drinks: 'energy_drinks',
          coffee_cans: 'coffee_cans',
          soap_dispensers: 'soap_dispensers',
          instant_noodles: 'instant_noodles',
          shampoo_bottles: 'shampoo_bottles',
          juice_bottles: 'juice_bottles',
          candy_jars: 'candy_jars'
        },
        unlocked: false,
        unlockLevel: 50,
        unlockCost: 5000,
        tint: 0xFFD700
      }
    }
    
    // Skin actuellement équipé
    this.currentSkin = 'original'
    
    // Charger le skin équipé
    this.loadEquippedSkin()
    
    // Charger les skins débloqués
    this.loadUnlockedSkins()
  }
  
  /**
   * Charger le skin équipé depuis localStorage
   */
  loadEquippedSkin() {
    const saved = localStorage.getItem('equippedSkin')
    if (saved && this.skins[saved]) {
      this.currentSkin = saved
    }
  }
  
  /**
   * Charger les skins débloqués
   */
  loadUnlockedSkins() {
    const saved = localStorage.getItem('unlockedSkins')
    if (saved) {
      const unlocked = JSON.parse(saved)
      unlocked.forEach(skinId => {
        if (this.skins[skinId]) {
          this.skins[skinId].unlocked = true
        }
      })
    }
  }
  
  /**
   * Sauvegarder les skins débloqués
   */
  saveUnlockedSkins() {
    const unlocked = Object.keys(this.skins).filter(key => this.skins[key].unlocked)
    localStorage.setItem('unlockedSkins', JSON.stringify(unlocked))
  }
  
  /**
   * Obtenir la texture pour un item avec le skin actuel
   */
  getTexture(itemType) {
    const skin = this.skins[this.currentSkin]
    return skin.items[itemType] || itemType
  }
  
  /**
   * Obtenir la teinte pour le skin actuel
   */
  getTint() {
    const skin = this.skins[this.currentSkin]
    return skin.tint || null
  }
  
  /**
   * Équiper un skin
   */
  equipSkin(skinId) {
    if (!this.skins[skinId]) {
      console.error('Skin not found:', skinId)
      return false
    }
    
    if (!this.skins[skinId].unlocked) {
      console.error('Skin not unlocked:', skinId)
      return false
    }
    
    this.currentSkin = skinId
    localStorage.setItem('equippedSkin', skinId)
    
    console.log('🎨 Skin equipped:', skinId)
    return true
  }
  
  /**
   * Débloquer un skin par niveau
   */
  unlockByLevel(playerLevel) {
    let newlyUnlocked = []
    
    Object.values(this.skins).forEach(skin => {
      if (!skin.unlocked && skin.unlockLevel > 0 && playerLevel >= skin.unlockLevel) {
        skin.unlocked = true
        newlyUnlocked.push(skin)
      }
    })
    
    if (newlyUnlocked.length > 0) {
      this.saveUnlockedSkins()
    }
    
    return newlyUnlocked
  }
  
  /**
   * Débloquer un skin avec des fromages
   */
  unlockWithCoins(skinId) {
    const skin = this.skins[skinId]
    
    if (!skin) {
      return { success: false, message: 'Skin introuvable' }
    }
    
    if (skin.unlocked) {
      return { success: false, message: 'Skin déjà débloqué' }
    }
    
    // Vérifier les fromages
    const playerCoins = parseInt(localStorage.getItem('playerCoins') || '0')
    
    if (playerCoins < skin.unlockCost) {
      return { 
        success: false, 
        message: `Pas assez de fromages! (${playerCoins}/${skin.unlockCost})` 
      }
    }
    
    // Débloquer
    skin.unlocked = true
    localStorage.setItem('playerCoins', (playerCoins - skin.unlockCost).toString())
    this.saveUnlockedSkins()
    
    return { 
      success: true, 
      message: `Skin "${skin.name}" débloqué!`,
      skin: skin
    }
  }
  
  /**
   * Obtenir tous les skins
   */
  getAllSkins() {
    return Object.values(this.skins)
  }
  
  /**
   * Obtenir les skins débloqués
   */
  getUnlockedSkins() {
    return Object.values(this.skins).filter(skin => skin.unlocked)
  }
  
  /**
   * Obtenir les skins verrouillés
   */
  getLockedSkins() {
    return Object.values(this.skins).filter(skin => !skin.unlocked)
  }
  
  /**
   * Obtenir le skin actuel
   */
  getCurrentSkin() {
    return this.skins[this.currentSkin]
  }
  
  /**
   * Obtenir le skin par ID
   */
  getSkin(skinId) {
    return this.skins[skinId]
  }
  
  /**
   * Vérifier si un skin est débloqué
   */
  isUnlocked(skinId) {
    return this.skins[skinId]?.unlocked || false
  }
  
  /**
   * Obtenir le pourcentage de collection
   */
  getCollectionPercentage() {
    const total = Object.keys(this.skins).length
    const unlocked = Object.values(this.skins).filter(s => s.unlocked).length
    return Math.round((unlocked / total) * 100)
  }
}

// Instance globale
export const skinManager = new SkinManager()
