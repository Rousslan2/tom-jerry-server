import Phaser from 'phaser'
import { LoadingScene } from './scenes/LoadingScene.js'
import { TitleScene } from './scenes/TitleScene.js'
import MenuScene from './scenes/MenuScene.js'
import { ModeSelectionScene } from './scenes/ModeSelectionScene.js'
import { GameModeMenuScene } from './scenes/GameModeMenuScene.js'
import { GameScene } from './scenes/GameScene.js'
import { VictoryScene } from './scenes/VictoryScene.js'
import { GameOverScene } from './scenes/GameOverScene.js'
import { OnlineLobbyScene } from './scenes/OnlineLobbyScene.js'
import { SettingsScene } from './scenes/SettingsScene.js'
// 🆕 NOUVELLES SCÈNES
import AchievementScene from './scenes/AchievementScene.js'
import SkinScene from './scenes/SkinScene.js'

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#808080',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [
    LoadingScene,
    TitleScene,
    MenuScene,
    ModeSelectionScene,
    GameModeMenuScene,
    GameScene,
    VictoryScene,
    GameOverScene,
    OnlineLobbyScene,
    SettingsScene,
    // 🆕 NOUVELLES SCÈNES
    AchievementScene,
    SkinScene
  ]
}

const game = new Phaser.Game(config)

export default game
