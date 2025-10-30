import Phaser from "phaser"
import { LoadingScene } from "./scenes/LoadingScene.js"
import { TitleScene } from "./scenes/TitleScene.js"
import { ModeSelectionScene } from "./scenes/ModeSelectionScene.js"
import { GameModeMenuScene } from "./scenes/GameModeMenuScene.js"
import { GameScene } from "./scenes/GameScene.js"
import { OnlineLobbyScene } from "./scenes/OnlineLobbyScene.js"
import { VictoryScene } from "./scenes/VictoryScene.js"
import { GameOverScene } from "./scenes/GameOverScene.js"
import { PauseScene } from "./scenes/PauseScene.js"
import { SettingsScene } from "./scenes/SettingsScene.js"
import { PlayerProfileScene } from "./scenes/PlayerProfileScene.js"
import { screenSize, mobileScreenSize, debugConfig } from "./gameConfig.json"

// Detect if device is mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
  || (('ontouchstart' in window) && (navigator.maxTouchPoints > 0))

console.log('🎮 Device detected:', isMobile ? 'MOBILE 📱' : 'DESKTOP 🖥️')

// Store device type globally for all scenes
window.isMobileDevice = isMobile

// Always use landscape mode for mobile (force horizontal layout)
let gameWidth, gameHeight

if (isMobile) {
  // Force landscape mode on mobile for better gameplay
  gameWidth = screenSize.width.value  // 1152 (wider)
  gameHeight = screenSize.height.value // 768 (shorter)
  console.log('📱 Mobile mode - LANDSCAPE forced (1152×768)')
  
  // Add orientation warning if in portrait
  if (window.innerHeight > window.innerWidth) {
    console.warn('⚠️ Please rotate your device to LANDSCAPE mode for best experience')
  }
} else {
  // Desktop: always use desktop dimensions
  gameWidth = screenSize.width.value
  gameHeight = screenSize.height.value
}

console.log(`📐 Game size: ${gameWidth}x${gameHeight}`)

// Helper function to calculate responsive font size
window.getResponsiveFontSize = (baseSize) => {
  // Base size is for desktop (1152x768)
  // Scale proportionally for mobile
  const scaleFactor = isMobile ? (gameWidth / screenSize.width.value) : 1
  return Math.round(baseSize * scaleFactor * 1.2) // 1.2x multiplier for better mobile readability
}

// Helper function to get the right font family for the device
window.getGameFont = () => {
  // Use web-safe fonts that work on ALL devices (mobile + desktop)
  // Bangers and Lilita One are loaded from Google Fonts for reliability
  if (isMobile) {
    // Mobile: Use Google Fonts (loaded in HTML) for guaranteed compatibility
    return 'Bangers, "Lilita One", Impact, Arial Black, sans-serif'
  } else {
    // Desktop: Can use Comic Sans MS or fallback to web fonts
    return '"Comic Sans MS", Bangers, "Lilita One", cursive, sans-serif'
  }
}

const config = {
  type: Phaser.WEBGL, // Force WebGL for better quality and performance
  width: gameWidth,
  height: gameHeight,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Mobile optimizations
    expandParent: isMobile,
    fullscreenTarget: isMobile ? document.body : null,
  },
  input: {
    // Enable touch events for mobile
    touch: isMobile,
    mouse: !isMobile,
  },
  render: {
    // Professional rendering settings for high quality
    antialias: true, // Enable anti-aliasing for smooth edges
    antialiasGL: true, // Enable WebGL anti-aliasing
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR', // Best quality texture filtering
    roundPixels: false, // Allow sub-pixel rendering for smoother animations
    pixelArt: false, // Disable pixel art mode for smooth modern graphics
    powerPreference: 'high-performance', // Use GPU for better performance
    transparent: false,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
    desynchronized: true, // Better performance
  },
  physics: {
    default: "arcade",
    arcade: {
      fps: 120,
      debug: debugConfig.debug.value,
    },
  },
  scene: [
    LoadingScene,
    TitleScene,
    ModeSelectionScene,
    GameModeMenuScene,
    GameScene,
    OnlineLobbyScene,
    VictoryScene,
    GameOverScene,
    PauseScene,
    SettingsScene,
    PlayerProfileScene
  ],
}

export default new Phaser.Game(config)
