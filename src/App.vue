<template>
  <div class="app-root">
    <!-- Retour accueil (hors start screen) -->
    <div v-if="screen !== 'start'" class="home-icon" @click="goHome">🏠</div>

    <div class="main-layout">
      <div class="right-panel">
        <!-- Écran d'accueil inline (StartScreen à venir) -->
        <div v-if="screen === 'start'" class="placeholder-start">
          <h1>Hack the Beat 🎮</h1>
          <p>Jeu de rythme visuel</p>
          <button class="button accent" @click="startGame">Jouer</button>
        </div>

        <GameScreen
          v-else-if="screen === 'game'"
          :state="engine.state.value"
          :countdownValue="engine.countdownValue.value"
          :score="engine.score.value"
          :combo="engine.combo.value"
          :comboMultiplier="engine.comboMultiplier.value"
          :level="engine.level.value"
          :totalBeats="engine.totalBeats.value"
          :beatsRemaining="engine.beatsRemaining.value"
          :activeBeatsTotal="engine.activeBeatsTotal.value"
          :activeBeatsPlayed="engine.activeBeatsPlayed.value"
          :lastFeedback="engine.lastFeedback.value"
          :sequence="engine.sequence.value"
          :currentBeatIndex="engine.currentBeatIndex.value"
          :gridTiles="engine.gridTiles.value"
          :activeTileIndex="engine.activeTileIndex.value"
          :upcomingBeats="engine.upcomingBeats.value"
          :isDecoyBeat="engine.isDecoyBeat.value"
          :inputResult="engine.inputResult.value"
          :beatProgress="engine.beatProgress.value"
          :beatDurationMs="engine.beatDurationMs.value"
          :cesarShift="engine.cesarShift.value"
          :glitchEffects="engine.glitchEffects.value"
          :perfectCount="engine.perfectCount.value"
          :goodCount="engine.goodCount.value"
          :okCount="engine.okCount.value"
          :missCount="engine.missCount.value"
          @nextLevel="engine.nextLevel()"
          @endGame="endGame"
        />

        <!-- Écran game over inline (GameOverScreen à venir) -->
        <div v-else-if="screen === 'gameover'" class="placeholder-gameover">
          <h2>Game Over !</h2>
          <p>Score : <strong>{{ finalScore }}</strong></p>
          <p>Niveau atteint : {{ finalLevel }}</p>
          <button class="button accent" @click="startGame">Rejouer</button>
          <button class="button" @click="goHome">Accueil</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import GameScreen from './components/GameScreen.vue'
import { STATES, useGameEngine } from './composables/useGameEngine.js'

const screen = ref('start')
const engine = useGameEngine()
const finalScore = ref(0)
const finalLevel = ref(1)

function startGame() {
  screen.value = 'game'
  engine.startGame()
}

function endGame() {
  finalScore.value = engine.score.value
  finalLevel.value = engine.level.value
  engine.gameOver()
  screen.value = 'gameover'
}

function goHome() {
  engine.resetToIdle()
  screen.value = 'start'
}

watch(() => engine.state.value, (newState) => {
  if (newState === STATES.GAME_OVER && screen.value === 'game') endGame()
})

function onKeyDown(e) {
  if (screen.value !== 'game') return
  if (engine.state.value !== STATES.PLAYING) return
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  e.preventDefault()
  engine.handleKeyPress(e.key)
}

onMounted(() => { document.addEventListener('keydown', onKeyDown) })
onUnmounted(() => { document.removeEventListener('keydown', onKeyDown) })
</script>

<style lang="scss">
:root {
  --accent-color: #f5ed63;
  --accent-hover: #e8e05a;
  --accent-glow: rgba(245, 237, 99, 0.5);
  --brand-dark: #1c1c1c;

  --main-font-color: #e8e8e8;
  --secondary-font-color: #9e9e9e;
  --page-background-color: #0d0d0d;
  --app-background-color: #141418;
  --surface-color: rgba(255, 255, 255, 0.06);
  --surface-hover: rgba(255, 255, 255, 0.1);
  --surface-border: rgba(255, 255, 255, 0.08);
  --menu-border-color: rgba(255, 255, 255, 0.1);

  --success-color: #4caf50;
  --danger-color: #f44336;
  --warning-color: #ff6b35;

  --tile-bg: rgba(255, 255, 255, 0.04);
  --tile-border: rgba(255, 255, 255, 0.08);

  --font-family: "Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  background-color: var(--page-background-color);
  color: var(--main-font-color);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--app-background-color);
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.4);
  min-height: 100vh;
  position: relative;
  border-left: 1px solid var(--surface-border);
  border-right: 1px solid var(--surface-border);
}
</style>

<style lang="scss" scoped>
.app-root {
  width: 100%;
  min-height: 100vh;
  position: relative;
}

:deep(.button) {
  font-family: inherit;
  font-weight: 600;
  background-color: var(--surface-color);
  color: var(--main-font-color);
  border: 1px solid var(--surface-border);
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.95em;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.15s, border-color 0.2s;
  margin: 5px;

  &:hover:not(:disabled) {
    background-color: var(--surface-hover);
    border-color: var(--accent-color);
    transform: translateY(-1px);
  }

  &.accent {
    background-color: var(--accent-color);
    color: var(--brand-dark);
    font-weight: 700;
    border-color: transparent;
    &:hover:not(:disabled) { background-color: var(--accent-hover); }
  }
}

.main-layout {
  display: flex;
  width: 100%;
  flex-grow: 1;
}

.right-panel {
  width: 100%;
  padding: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.placeholder-start,
.placeholder-gameover {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: 20px;
  text-align: center;

  h1, h2 { font-size: 2.5em; font-weight: 700; }
  p { color: var(--secondary-font-color); font-size: 1.1em; }
}

.home-icon {
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 1000;
  cursor: pointer;
  font-size: 24px;
  padding: 8px;
  border-radius: 10px;
  background: var(--surface-color);
  border: 1px solid var(--surface-border);
  user-select: none;
  &:hover { background: var(--surface-hover); border-color: var(--accent-color); }
}
</style>
