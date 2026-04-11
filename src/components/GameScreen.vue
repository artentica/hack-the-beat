<template>
  <div
    class="game-screen"
    :class="{ 'screen-shake': glitchEffects.screenShake }"
  >
    <!-- Countdown -->
    <Transition name="countdown-fade">
      <div v-if="state === 'COUNTDOWN'" class="countdown-overlay">
        <span class="countdown-number" :key="countdownValue">{{
          countdownValue > 0 ? countdownValue : "GO!"
        }}</span>
      </div>
    </Transition>

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
      />

      <NoteTimeline
        :sequence="sequence"
        :currentBeatIndex="currentBeatIndex"
        :beatDurationMs="beatDurationMs"
        :gridTiles="gridTiles"
        :hitResult="inputResult"
        :isCountdown="state === 'COUNTDOWN'"
        :countdownValue="countdownValue"
      />

      <div v-if="cesarShift > 0 && !isDecoyBeat" class="cesar-banner">
        {{ t("cesarBanner", { shift: cesarShift }) }}
      </div>

      <TileGrid
        :tiles="gridTiles"
        :activeTileIndex="activeTileIndex"
        :isDecoy="isDecoyBeat"
        :result="inputResult"
        :progress="beatProgress"
        :cesarShift="cesarShift"
        :blur="glitchEffects.blur"
        :upcomingBeats="upcomingBeats"
      />
    </template>

    <!-- Level Complete -->
    <div v-if="state === 'LEVEL_COMPLETE'" class="level-complete">
      <h2>{{ t("levelComplete", { level }) }}</h2>
      <p class="level-score">
        {{ t("levelScore") }} <strong>{{ score }}</strong>
      </p>
      <div class="level-stats">
        <span>🎯 Perfect: {{ perfectCount }}</span>
        <span>👍 Good: {{ goodCount }}</span>
        <span>✅ OK: {{ okCount }}</span>
        <span>❌ Miss: {{ missCount }}</span>
      </div>
      <div class="level-actions">
        <button @click="$emit('nextLevel')" class="button cbtw-style">
          {{ t("nextLevel") }}
        </button>
        <button @click="$emit('endGame')" class="button secondary">
          {{ t("endGameBtn") }}
        </button>
      </div>
    </div>

    <GlitchOverlay
      :screenShake="glitchEffects.screenShake"
      :colorInvert="glitchEffects.colorInvert"
    />
  </div>
</template>

<script setup>
import { useI18n } from "../i18n/index.js";
import GlitchOverlay from "./GlitchOverlay.vue";
import NoteTimeline from "./NoteTimeline.vue";
import ScoreDisplay from "./ScoreDisplay.vue";
import TileGrid from "./TileGrid.vue";

const { t } = useI18n();

defineProps({
  state: String,
  countdownValue: Number,
  score: Number,
  combo: Number,
  comboMultiplier: Number,
  level: Number,
  totalBeats: Number,
  beatsRemaining: Number,
  activeBeatsTotal: { type: Number, default: 0 },
  activeBeatsPlayed: { type: Number, default: 0 },
  lastFeedback: Object,
  sequence: { type: Array, default: () => [] },
  currentBeatIndex: { type: Number, default: 0 },
  gridTiles: Array,
  activeTileIndex: Number,
  upcomingBeats: { type: Array, default: () => [] },
  isDecoyBeat: Boolean,
  inputResult: String,
  beatProgress: Number,
  beatDurationMs: { type: Number, default: 750 },
  cesarShift: Number,
  glitchEffects: Object,
  perfectCount: Number,
  goodCount: Number,
  okCount: Number,
  missCount: Number,
});

defineEmits(["nextLevel", "endGame"]);
</script>

<style lang="scss" scoped>
.game-screen {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  &.screen-shake {
    animation: gameShake 0.3s ease;
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
  background: rgba(20, 20, 24, 0.9);
  border-radius: 16px;
  backdrop-filter: blur(8px);
}

.countdown-number {
  font-size: 6em;
  font-weight: 700;
  color: var(--main-font-color);
  animation: countdownPulse 0.8s ease infinite;
}

@keyframes countdownPulse {
  0% {
    transform: scale(0.8);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.3;
  }
}

.countdown-fade-leave-active {
  transition: opacity 400ms ease;

  .countdown-number {
    transition: filter 400ms ease;
  }
}

.countdown-fade-leave-to {
  opacity: 0;

  .countdown-number {
    filter: blur(20px);
  }
}

/* César banner */
.cesar-banner {
  background: var(--warning-color, #ff6b35);
  color: white;
  font-weight: 600;
  font-size: 0.9em;
  padding: 6px 16px;
  border-radius: 20px;
  margin-bottom: 12px;
  animation: cesarFlash 0.5s ease infinite alternate;
}

@keyframes cesarFlash {
  from {
    opacity: 0.8;
  }
  to {
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
</style>
