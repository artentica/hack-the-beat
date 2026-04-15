<template>
  <div class="app-root">
    <!-- Settings menu -->
    <div class="settings-container">
      <span class="settings-icon" @click="showSettings = !showSettings">⚙️</span>
      <div v-if="showSettings" class="settings-menu">
        <button @click="exportScores">📥 Exporter JSON</button>
        <button @click="triggerImport">📤 Importer JSON</button>
      </div>
      <input
        type="file"
        ref="fileInput"
        @change="importScores"
        accept=".json"
        style="display: none"
      />
    </div>

    <!-- Retour accueil (hors start screen) -->
    <div v-if="screen !== 'start'" class="home-icon" @click="confirmHome">
      🏠
    </div>

    <GlitchOverlay
      :screenShake="engine.glitchEffects.value?.screenShake"
      :colorInvert="engine.glitchEffects.value?.colorInvert"
    />

    <div class="main-layout">
      <div class="right-panel">
        <StartScreen v-if="screen === 'start'" @start="startGame" />

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

        <GameOverScreen
          v-else-if="screen === 'gameover'"
          ref="gameOverRef"
          :score="finalScore"
          :level="finalLevel"
          :maxCombo="finalMaxCombo"
          :perfectCount="finalPerfect"
          @save="saveScore"
          @replay="startGame"
          @home="goHome"
        />

        <LeaderboardScreen
          v-else-if="screen === 'leaderboard'"
          :scores="leaderboard.sorted.value"
          @home="goHome"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import GameOverScreen from "./components/GameOverScreen.vue";
import GameScreen from "./components/GameScreen.vue";
import GlitchOverlay from "./components/GlitchOverlay.vue";
import LeaderboardScreen from "./components/LeaderboardScreen.vue";
import StartScreen from "./components/StartScreen.vue";
import { STATES, useGameEngine } from "./composables/useGameEngine.js";
import { useLeaderboard } from "./composables/useLeaderboard.js";

const screen = ref("start");
const gameOverRef = ref(null);
const engine = useGameEngine();
const leaderboard = useLeaderboard();
const showSettings = ref(false);
const fileInput = ref(null);
const finalScore = ref(0);
const finalLevel = ref(1);
const finalMaxCombo = ref(0);
const finalPerfect = ref(0);

function startGame() {
  screen.value = "game";
  engine.startGame();
}

function endGame() {
  finalScore.value = engine.score.value;
  finalLevel.value = engine.level.value;
  finalMaxCombo.value = engine.maxCombo.value;
  finalPerfect.value = engine.perfectCount.value;
  engine.gameOver();
  screen.value = "gameover";
}

function saveScore(playerData) {
  const entry = {
    ...playerData,
    score: finalScore.value,
    date: new Date().toISOString(),
  };
  const rank = leaderboard.addEntry(entry);
  nextTick(() => {
    gameOverRef.value?.setSaved(rank);
  });
}

function exportScores() {
  showSettings.value = false;
  leaderboard.exportJSON();
}

function triggerImport() {
  showSettings.value = false;
  fileInput.value?.click();
}

async function importScores(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await leaderboard.importJSON(file);
    alert("Import réussi !");
  } catch (err) {
    alert(err.message);
  }
  e.target.value = null;
}

function goHome() {
  engine.resetToIdle();
  screen.value = "start";
}

function confirmHome() {
  if (screen.value === "game" && engine.state.value === STATES.PLAYING) {
    if (!window.confirm("Abandonner la partie ?")) return;
  }
  goHome();
}

watch(
  () => engine.state.value,
  (newState) => {
    if (newState === STATES.GAME_OVER && screen.value === "game") endGame();
  },
);

function onKeyDown(e) {
  if (screen.value !== "game") return;
  if (engine.state.value !== STATES.PLAYING) return;
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  e.preventDefault();
  engine.handleKeyPress(e.key);
}

onMounted(() => {
  document.addEventListener("keydown", onKeyDown);
});
onUnmounted(() => {
  document.removeEventListener("keydown", onKeyDown);
});
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

  --font-family:
    "Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
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
  transition:
    background-color 0.2s,
    transform 0.15s,
    border-color 0.2s;
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
    &:hover:not(:disabled) {
      background-color: var(--accent-hover);
    }
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

  h1,
  h2 {
    font-size: 2.5em;
    font-weight: 700;
  }
  p {
    color: var(--secondary-font-color);
    font-size: 1.1em;
  }
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
  &:hover {
    background: var(--surface-hover);
    border-color: var(--accent-color);
  }
}

.settings-container {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 1001;
  user-select: none;
}

.settings-icon {
  font-size: 22px;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  background: var(--surface-color);
  border: 1px solid var(--surface-border);
  display: inline-block;
  &:hover {
    background: var(--surface-hover);
    border-color: var(--accent-color);
  }
}

.settings-menu {
  position: absolute;
  top: 44px;
  right: 0;
  background: var(--app-background-color);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

  button {
    font-family: inherit;
    font-size: 0.85em;
    font-weight: 500;
    background: var(--surface-color);
    color: var(--main-font-color);
    border: 1px solid var(--surface-border);
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    &:hover {
      background: var(--surface-hover);
      border-color: var(--accent-color);
    }
  }
}
</style>
