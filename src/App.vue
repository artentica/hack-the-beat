<template>
  <div class="app-root">
    <!-- Settings menu -->
    <div class="settings-container">
      <span class="settings-icon" @click="showSettings = !showSettings"
        ><Settings :size="20" :stroke-width="2"
      /></span>
      <div v-if="showSettings" class="settings-menu">
        <div class="settings-lang">
          <span><Globe :size="18" :stroke-width="2" /></span>
          <select
            :value="locale"
            @change="setLocale($event.target.value)"
            class="lang-select"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        <button @click="exportScores">{{ t("exportJson") }}</button>
        <button @click="triggerImport">{{ t("importJson") }}</button>
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
      <Home :size="22" :stroke-width="2" />
    </div>

    <div class="main-layout">
      <LeftPanel :activeRule="activeRule" :podium="leaderboard.podium.value" />

      <div class="right-panel">
        <StartScreen
          v-if="screen === 'start'"
          @start="startGame"
          @viewScores="goLeaderboard"
        />

        <GameScreen
          v-else-if="screen === 'game'"
          :state="engine.state.value"
          :countdownValue="engine.countdownValue.value"
          :score="engine.score.value"
          :combo="engine.combo.value"
          :comboMultiplier="engine.comboMultiplier.value"
          :level="engine.level.value"
          :activeBeatsTotal="engine.activeBeatsTotal.value"
          :activeBeatsPlayed="engine.activeBeatsPlayed.value"
          :lastFeedback="engine.lastFeedback.value"
          :sequence="engine.sequence.value"
          :pattern="engine.pattern.value"
          :currentBeatIndex="engine.currentBeatIndex.value"
          :gridTiles="engine.gridTiles.value"
          :activeTileIndex="engine.activeTileIndex.value"
          :upcomingBeats="engine.upcomingBeats.value"
          :inputResult="engine.inputResult.value"
          :beatProgress="engine.beatProgress.value"
          :beatDurationMs="engine.beatDurationMs.value"
          :beatPulse="engine.beatPulse.value"
          :glitchEffects="engine.glitchEffects.value"
          :perfectCount="engine.perfectCount.value"
          :goodCount="engine.goodCount.value"
          :okCount="engine.okCount.value"
          :missCount="engine.missCount.value"
          :rockMeter="engine.rockMeter.value"
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
          @viewScores="goLeaderboard"
          @replay="startGame"
          @home="goHome"
          @showPrivacy="showPrivacy = true"
        />

        <LeaderboardScreen
          v-else-if="screen === 'leaderboard'"
          :scores="leaderboard.sorted.value"
          @home="goHome"
          @showPrivacy="showPrivacy = true"
        />
      </div>
    </div>

    <PrivacyModal v-if="showPrivacy" @close="showPrivacy = false" />

    <div class="decorative-quarter-circle"></div>
  </div>
</template>

<script setup>
import { Globe, Home, Settings } from "lucide-vue-next";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import GameOverScreen from "./components/GameOverScreen.vue";
import GameScreen from "./components/GameScreen.vue";
import LeaderboardScreen from "./components/LeaderboardScreen.vue";
import LeftPanel from "./components/LeftPanel.vue";
import PrivacyModal from "./components/PrivacyModal.vue";
import StartScreen from "./components/StartScreen.vue";
import { STATES, useGameEngine } from "./composables/useGameEngine.js";
import { useLeaderboard } from "./composables/useLeaderboard.js";
import { useI18n } from "./i18n/index.js";

const screen = ref("start");
const gameOverRef = ref(null);
const engine = useGameEngine();
const leaderboard = useLeaderboard();
const { t, locale, setLocale } = useI18n();

// Expose engine for E2E tests
if (typeof window !== "undefined") {
  window.__engine = engine;
  window.__leaderboard = leaderboard;
}
const showSettings = ref(false);
const showPrivacy = ref(false);
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
    alert(t("importSuccess"));
  } catch (err) {
    alert(err.message);
  }
  e.target.value = null;
}

function goHome() {
  engine.resetToIdle();
  screen.value = "start";
}

function goLeaderboard() {
  screen.value = "leaderboard";
}

/** Règle active (1-based) selon l'état du jeu */
const activeRule = computed(() => {
  if (screen.value !== "game") return 0;
  const lvl = engine.level.value;
  if (lvl >= 5) return 3;
  if (lvl >= 3) return 2;
  return 1;
});

function confirmHome() {
  if (screen.value === "game" && engine.state.value === STATES.PLAYING) {
    if (!window.confirm(t("quitConfirm"))) return;
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
/* Les variables CSS sont définies dans global.scss */

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
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
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

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    filter: grayscale(40%);
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

  &.primary {
    background-color: var(--color-cbtw-blue);
    color: var(--color-cbtw-white);
    
    &:hover {
      background-color: var(--color-cbtw-blue);
      color: var(--color-cbtw-white);
    }
  } 
}

.main-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

/* ---- Panneau droit ---- */
.right-panel {
  flex: 1;
  min-width: 0;
  padding: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

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

.settings-lang {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 8px;
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: 4px;
}

.lang-select {
  font-family: inherit;
  font-size: 0.85em;
  background: var(--surface-color);
  color: var(--main-font-color);
  border: 1px solid var(--surface-border);
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  outline: none;
  &:hover {
    border-color: var(--accent-color);
  }
}

/* ---- Quart de cercle décoratif CBTW ---- */
.decorative-quarter-circle {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background-color: var(--accent-color);
  border-top-left-radius: 200px;
  z-index: 0;
  pointer-events: none;
}

/* ---- Responsive ---- */
@media (max-width: 800px) {
  .main-layout {
    flex-direction: column;
  }
  .right-panel {
    order: 1;
  }
  .decorative-quarter-circle {
    width: 120px;
    height: 120px;
    border-top-left-radius: 120px;
  }
}
</style>
