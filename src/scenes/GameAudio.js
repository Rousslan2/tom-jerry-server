import Phaser from 'phaser'
import { audioConfig } from '../gameConfig.json'

export class GameAudio {
  constructor(scene) {
    this.scene = scene
    this.backgroundMusic = null
  }

  // Stop all music from other scenes to prevent overlap
  stopAllOtherMusic() {
    const allScenes = ['TitleScene', 'ModeSelectionScene', 'GameModeMenuScene', 'OnlineLobbyScene']

    allScenes.forEach(sceneKey => {
      const scene = this.scene.scene.get(sceneKey)
      if (scene && scene.backgroundMusic) {
        if (scene.backgroundMusic.isPlaying) {
          scene.backgroundMusic.stop()
          console.log(`🎵 Stopped music from ${sceneKey}`)
        }
      }
    })
  }

  // Play background music
  playBackgroundMusic() {
    // Don't play music if already playing
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      return
    }

    this.backgroundMusic = this.scene.sound.add('tom_jerry_80s_retro_theme', {
      volume: audioConfig.musicVolume.value,
      loop: true
    })
    this.backgroundMusic.play()
  }

  // Stop background music
  stopBackgroundMusic() {
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop()
      this.backgroundMusic.destroy()
      this.backgroundMusic = null
    }
  }

  // Play sound effect with volume
  playSound(soundKey, volume = audioConfig.sfxVolume.value) {
    this.scene.sound.play(soundKey, { volume })
  }

  // Play combo sound based on level
  playComboSound(combo) {
    if (combo >= 5) {
      this.playSound('combo_mega')
    } else if (combo >= 3) {
      this.playSound('combo_x3')
    } else if (combo >= 2) {
      this.playSound('combo_x2')
    } else {
      this.playSound('match_eliminate')
    }

    // Also play score gain sound for extra satisfaction
    this.scene.time.delayedCall(150, () => {
      this.playSound('score_gain', audioConfig.sfxVolume.value * 0.5)
    })
  }

  // Play game end sound
  playGameEndSound(isVictory) {
    if (isVictory) {
      this.playSound('level_complete')
    } else {
      this.playSound('game_over')
    }
  }

  // Cleanup
  shutdown() {
    this.stopBackgroundMusic()
  }
}