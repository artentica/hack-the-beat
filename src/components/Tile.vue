<template>
  <div class="tile" :class="tileClasses">
    <img :src="tile.svg" :alt="tile.name" class="tile-logo" />
    <span class="tile-letter">{{ tile.letter }}</span>
    <div v-if="cesarShift > 0 && isActive" class="cesar-badge">
      +{{ cesarShift }}
    </div>
    <Transition name="result-pop">
      <div
        v-if="isActive && result"
        :key="result"
        class="result-label"
        :class="'label-' + result.toLowerCase()"
      >
        {{ RESULT_LABELS[result] ?? result }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from "vue";

const RESULT_LABELS = {
  PERFECT: "PERFECT!",
  GOOD: "GOOD",
  OK: "OK",
  MISS: "MISS",
  TRAP: "✗ TRAP",
  DODGE: "✓ DODGE",
};

const props = defineProps({
  tile: { type: Object, required: true },
  isActive: { type: Boolean, default: false },
  isDecoy: { type: Boolean, default: false },
  result: { type: String, default: null },
  progress: { type: Number, default: 0 },
  cesarShift: { type: Number, default: 0 },
  blur: { type: Boolean, default: false },
  upcomingDistance: { type: Number, default: 0 },
});

const tileClasses = computed(() => ({
  active: props.isActive && !props.isDecoy,
  decoy: props.isActive && props.isDecoy,
  "result-perfect": props.result === "PERFECT",
  "result-good": props.result === "GOOD",
  "result-ok": props.result === "OK",
  "result-miss": props.result === "MISS" || props.result === "TRAP",
  "result-dodge": props.result === "DODGE",
  "tile-blur": props.blur && !props.isActive,
}));
</script>

<style lang="scss" scoped>
.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--tile-bg, var(--surface-color));
  border: 2px solid var(--tile-border, transparent);
  border-radius: 16px;
  padding: 12px;
  transition:
    transform 0.15s,
    border-color 0.15s,
    box-shadow 0.15s,
    filter 0.3s,
    background 0.2s;
  aspect-ratio: 1;
  overflow: hidden;

  // Active state — the current beat
  &.active {
    border-color: var(--accent-color, #f5ed63);
    box-shadow: 0 0 16px var(--accent-glow, rgba(245, 237, 99, 0.4));
    transform: scale(1.05);
    z-index: 2;
  }

  // Decoy flash
  &.decoy {
    border-color: var(--danger-color, #ff4444);
    box-shadow: 0 0 15px rgba(255, 68, 68, 0.4);
    animation: decoyPulse 0.3s ease-in-out infinite;
  }

  // Result states
  &.result-perfect,
  &.result-good,
  &.result-ok,
  &.result-dodge {
    border-color: var(--success-color, #4caf50);
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
  }

  &.result-miss {
    border-color: var(--danger-color, #f44336);
    box-shadow: 0 0 15px rgba(244, 67, 54, 0.5);
    animation: tileShake 0.3s ease;
  }

  // Blur effect at high levels
  &.tile-blur .tile-logo {
    filter: blur(8px);
  }
}

.tile-logo {
  width: 60%;
  height: auto;
  max-height: 60%;
  object-fit: contain;
  pointer-events: none;
  transition: filter 0.3s;
}

.tile-letter {
  margin-top: 6px;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--main-font-color);
  opacity: 0.7;
}

.cesar-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ff6b35;
  color: white;
  font-size: 0.7em;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
}

.result-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72em;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-radius: inherit;
  pointer-events: none;

  &.label-perfect {
    color: #d4a017;
    background: rgba(255, 215, 0, 0.25);
  }
  &.label-good {
    color: #388e3c;
    background: rgba(56, 142, 60, 0.18);
  }
  &.label-ok {
    color: #1565c0;
    background: rgba(21, 101, 192, 0.15);
  }
  &.label-miss,
  &.label-trap {
    color: #c62828;
    background: rgba(198, 40, 40, 0.15);
  }
  &.label-dodge {
    color: #388e3c;
    background: rgba(56, 142, 60, 0.18);
  }
}

.result-pop-enter-active {
  animation: resultIn 0.15s ease-out;
}
.result-pop-leave-active {
  animation: resultOut 0.2s ease-in;
}

@keyframes resultIn {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes resultOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: scale(1.1);
  }
}

@keyframes decoyPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes tileShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}
</style>
