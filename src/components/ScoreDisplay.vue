<template>
  <div class="score-display">
    <div class="score-row">
      <div class="score-item">
        <span class="score-label">{{ t("score") }}</span>
        <span class="score-value">{{ score }}</span>
      </div>
      <div class="score-item">
        <span class="score-label">{{ t("combo") }}</span>
        <span class="score-value combo" :class="{ 'combo-high': combo >= 5 }">
          {{ combo }}
          <span v-if="comboMultiplier > 1" class="multiplier"
            >×{{ comboMultiplier }}</span
          >
        </span>
      </div>
      <div class="score-item">
        <span class="score-label">{{ t("level") }}</span>
        <span class="score-value">{{ level }}</span>
      </div>
    </div>
    <div class="beat-progress">
      <div
        class="beat-bar"
        :style="{
          width: ((totalBeats - beatsRemaining) / totalBeats) * 100 + '%',
        }"
      ></div>
    </div>
    <Transition name="feedback-pop">
      <div
        v-if="feedback"
        :key="feedback.timestamp"
        class="feedback"
        :class="'feedback-' + feedback.type.toLowerCase()"
      >
        {{ feedbackText }}
        <span v-if="feedback.points > 0" class="feedback-points"
          >+{{ feedback.points }}</span
        >
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "../i18n/index.js";

const { t } = useI18n();

const props = defineProps({
  score: { type: Number, default: 0 },
  combo: { type: Number, default: 0 },
  comboMultiplier: { type: Number, default: 1 },
  level: { type: Number, default: 1 },
  totalBeats: { type: Number, default: 1 },
  beatsRemaining: { type: Number, default: 0 },
  feedback: { type: Object, default: null },
});

const feedbackText = computed(() => {
  if (!props.feedback) return "";
  const map = {
    PERFECT: t("feedbackPerfect"),
    GOOD: t("feedbackGood"),
    OK: t("feedbackOk"),
    MISS: t("feedbackMiss"),
    DODGE: t("feedbackDodge"),
    TRAP: t("feedbackTrap"),
  };
  return map[props.feedback.type] || "";
});
</script>

<style lang="scss" scoped>
.score-display {
  width: 100%;
  max-width: 520px;
  margin: 0 auto 16px;
}

.score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--secondary-font-color, #757575);
  font-weight: 500;
}

.score-value {
  font-size: 1.6em;
  font-weight: 700;
  color: var(--main-font-color);
}

.combo.combo-high {
  color: var(--accent-color);
  text-shadow: 0 0 8px var(--accent-glow);
  animation: comboPop 0.2s ease;
}

@keyframes comboPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.multiplier {
  font-size: 0.6em;
  color: var(--warning-color, #ff6b35);
  font-weight: 700;
  margin-left: 2px;
}

.beat-progress {
  width: 100%;
  height: 4px;
  background: var(--surface-color);
  border-radius: 2px;
  overflow: hidden;
}

.beat-bar {
  height: 100%;
  background: var(--accent-color);
  border-radius: 2px;
  transition: width 0.15s linear;
  box-shadow: 0 0 8px var(--accent-glow);
}

/* Feedback popup */
.feedback {
  text-align: center;
  font-size: 1.4em;
  font-weight: 700;
  margin-top: 10px;
  padding: 4px 0;
}

.feedback-perfect {
  color: #ffd700;
}
.feedback-good {
  color: #4caf50;
}
.feedback-ok {
  color: #2196f3;
}
.feedback-miss,
.feedback-trap {
  color: #f44336;
}
.feedback-dodge {
  color: #4caf50;
}

.feedback-points {
  font-size: 0.7em;
  opacity: 0.8;
  margin-left: 6px;
}

.feedback-pop-enter-active {
  animation: feedbackIn 0.3s ease;
}
.feedback-pop-leave-active {
  animation: feedbackOut 0.2s ease;
}

@keyframes feedbackIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes feedbackOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
