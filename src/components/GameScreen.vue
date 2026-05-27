<template>
  <div
    class="game-screen"
    :class="{
      'screen-shake': glitchEffects?.screenShake,
      'blur-glitch': glitchEffects?.blurGlitch,
    }"
  >
    <!-- Countdown -->
    <div
      class="countdown-overlay"
      :class="{ 'is-active': state === 'COUNTDOWN' }"
    >
      <span class="countdown-number" :key="countdownValue">{{
        countdownValue > 0 ? countdownValue : "GO!"
      }}</span>
    </div>

    <!-- Playing -->
    <template v-if="state === 'PLAYING' || state === 'COUNTDOWN'">
      <ScoreDisplay
        :score="score"
        :combo="combo"
        :comboMultiplier="comboMultiplier"
        :level="level"
        :totalBeats="activeBeatsTotal"
        :beatsRemaining="activeBeatsTotal - activeBeatsPlayed"
        :feedback="lastFeedback"
        :rockMeter="rockMeter"
      />

      <NoteTimeline
        :sequence="sequence"
        :currentBeatIndex="currentBeatIndex"
        :beatDurationMs="beatDurationMs"
        :gridTiles="gridTiles"
        :hitResult="inputResult"
        :isCountdown="state === 'COUNTDOWN'"
        :countdownValue="countdownValue"
        :beatPulse="beatPulse"
      />

      <div class="grid-wrapper">
        <TileGrid
          :tiles="gridTiles"
          :activeTileIndex="activeTileIndex"
          :result="inputResult"
          :progress="beatProgress"
          :upcomingBeats="upcomingBeats"
        />
        <TransitionGroup name="miss-float">
          <div
            v-for="m in missFloats"
            :key="m.id"
            class="miss-float-indicator"
            :style="m.style"
          >
            {{ m.text }}
          </div>
        </TransitionGroup>
      </div>
    </template>

    <!-- Level Complete -->
    <div v-if="state === 'LEVEL_COMPLETE'" class="level-complete">
      <h2>{{ t("levelComplete", { level }) }}</h2>
      <p class="level-score">
        {{ t("levelScore") }} <strong>{{ score }}</strong>
      </p>
      <div class="level-stats">
        <span
          ><Target :size="14" :stroke-width="2" /> Perfect:
          {{ perfectCount }}</span
        >
        <span
          ><ThumbsUp :size="14" :stroke-width="2" /> Good: {{ goodCount }}</span
        >
        <span><Check :size="14" :stroke-width="2" /> OK: {{ okCount }}</span>
        <span><X :size="14" :stroke-width="2" /> Miss: {{ missCount }}</span>
      </div>
      <div class="level-actions">
        <button @click="emit('nextLevel')" class="button cbtw-style primary">
          <SkipForward :size="16" :stroke-width="2" /> {{ t("nextLevel") }}
          <kbd class="kbd-hint">SPACE</kbd>
        </button>
        <button @click="emit('endGame')" class="button secondary">
          <Square :size="16" :stroke-width="2" /> {{ t("endGameBtn") }}
        </button>
      </div>
    </div>

    <GlitchOverlay :screenShake="glitchEffects?.screenShake" />
  </div>
</template>

<script setup>
import {
  Check,
  SkipForward,
  Square,
  Target,
  ThumbsUp,
  X,
} from "lucide-vue-next";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "../i18n/index.js";
import GlitchOverlay from "./GlitchOverlay.vue";
import NoteTimeline from "./NoteTimeline.vue";
import ScoreDisplay from "./ScoreDisplay.vue";
import SequencePreview from "./SequencePreview.vue";
import TileGrid from "./TileGrid.vue";

const { t } = useI18n();

const props = defineProps({
  state: String,
  countdownValue: Number,
  score: Number,
  combo: Number,
  comboMultiplier: Number,
  level: Number,
  activeBeatsTotal: { type: Number, default: 0 },
  activeBeatsPlayed: { type: Number, default: 0 },
  lastFeedback: Object,
  sequence: { type: Array, default: () => [] },
  pattern: { type: Array, default: () => [] },
  currentBeatIndex: { type: Number, default: 0 },
  gridTiles: Array,
  activeTileIndex: Number,
  upcomingBeats: { type: Array, default: () => [] },
  inputResult: String,
  beatProgress: Number,
  beatDurationMs: { type: Number, default: 600 },
  beatPulse: { type: Boolean, default: false },
  glitchEffects: Object,
  perfectCount: Number,
  goodCount: Number,
  okCount: Number,
  missCount: Number,
  rockMeter: { type: Number, default: 50 },
});

const emit = defineEmits(["nextLevel", "endGame"]);

// Spacebar to go to next level
function onKeyDown(e) {
  if (e.code === "Space" && props.state === "LEVEL_COMPLETE") {
    e.preventDefault();
    emit("nextLevel");
  }
}
onMounted(() => window.addEventListener("keydown", onKeyDown));
onUnmounted(() => window.removeEventListener("keydown", onKeyDown));

// --- Floating MISS indicators ---
const missFloats = ref([]);
let missIdCounter = 0;

watch(
  () => props.inputResult,
  (val) => {
    if (val === "MISS") {
      const id = ++missIdCounter;
      const x = 10 + Math.random() * 80;
      const y = 10 + Math.random() * 70;
      const rotation = -20 + Math.random() * 40;
      const scale = 0.85 + Math.random() * 0.35;
      missFloats.value.push({
        id,
        text: "MISS",
        style: {
          left: x + "%",
          top: y + "%",
          "--rot": rotation + "deg",
          "--scale": scale,
        },
      });
      setTimeout(() => {
        missFloats.value = missFloats.value.filter((m) => m.id !== id);
      }, 700);
    }
  },
);
</script>

<style lang="scss" scoped>
.game-screen {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: filter 150ms ease;

  &.screen-shake {
    animation: gameShake 0.3s ease;
  }

  &.blur-glitch {
    animation: blurGlitch 0.4s ease;
  }

  &.screen-shake.blur-glitch {
    animation:
      gameShake 0.3s ease,
      blurGlitch 0.4s ease;
  }
}

@keyframes blurGlitch {
  0% {
    filter: blur(0);
  }
  20% {
    filter: blur(3px);
  }
  50% {
    filter: blur(5px) brightness(1.05);
  }
  80% {
    filter: blur(2px);
  }
  100% {
    filter: blur(0);
  }
}

@keyframes gameShake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-4px);
  }
  40% {
    transform: translateX(4px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}

/* Countdown */
.countdown-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  background: rgba(251, 249, 242, 0.88);
  border-radius: 16px;
  backdrop-filter: blur(6px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 250ms ease;

  &.is-active {
    opacity: 1;
    pointer-events: auto;
  }
}

.countdown-number {
  font-size: 6em;
  font-weight: 700;
  color: var(--main-font-color);
  animation: countdownPulse 0.8s ease infinite;
}

@keyframes countdownPulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

/* Level complete */
.level-complete {
  text-align: center;
  padding: 32px 20px;
  width: 100%;
}

.level-complete h2 {
  font-size: 1.8em;
  margin-bottom: 12px;
}

.level-score {
  font-size: 1.3em;
  margin-bottom: 16px;
}

.level-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
  font-size: 0.95em;
}

.level-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.kbd-hint {
  display: inline-block;
  font-size: 0.65em;
  font-weight: 700;
  padding: 2px 6px;
  margin-left: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  vertical-align: middle;
  line-height: 1.3;
  font-family: inherit;
}

/* Grid wrapper for floating MISS indicators */
.grid-wrapper {
  position: relative;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding-top: 64px;
}

.miss-float-indicator {
  position: absolute;
  z-index: 20;
  pointer-events: none;
  font-size: 1.5em;
  font-weight: 900;
  color: #f44336;
  text-shadow:
    0 0 10px rgba(244, 67, 54, 0.7),
    0 2px 4px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%) rotate(var(--rot, 0deg))
    scale(var(--scale, 1));
  white-space: nowrap;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.miss-float-enter-active {
  animation: missIn 0.15s ease-out;
}
.miss-float-leave-active {
  animation: missOut 0.5s ease-in forwards;
}

@keyframes missIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--rot, 0deg))
      scale(calc(var(--scale, 1) * 1.8));
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--rot, 0deg))
      scale(var(--scale, 1));
  }
}

@keyframes missOut {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--rot, 0deg))
      scale(var(--scale, 1));
  }
  to {
    opacity: 0;
    transform: translate(-50%, calc(-50% - 30px)) rotate(var(--rot, 0deg))
      scale(calc(var(--scale, 1) * 0.6));
  }
}
</style>
