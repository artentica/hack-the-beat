<template>
  <div class="tile" :class="tileClasses" :style="tileStyle">
    <!-- Shape watermark background -->
    <svg class="tile-watermark" viewBox="0 0 100 100" aria-hidden="true">
      <circle v-if="tile.shape === 'circle'" cx="50" cy="50" r="46" />
      <rect
        v-else-if="tile.shape === 'square'"
        x="6"
        y="6"
        width="88"
        height="88"
        rx="8"
      />
      <polygon v-else-if="tile.shape === 'triangle'" points="50,4 96,96 4,96" />
      <polygon
        v-else-if="tile.shape === 'diamond'"
        points="50,4 96,50 50,96 4,50"
      />
    </svg>
    <!-- Tech logo -->
    <img
      v-if="tile.tech?.svg"
      :src="tile.tech.svg"
      :alt="tile.tech?.name"
      class="tile-logo"
    />
    <span class="tile-letter">{{ tile.key }}</span>
    <!-- Hit zone markers -->
    <div class="tile-hit-zone">
      <div class="zone zone-ok"></div>
      <div class="zone zone-good"></div>
      <div class="zone zone-perfect"></div>
      <div class="zone zone-good"></div>
      <div class="zone zone-ok"></div>
    </div>
    <!-- Timing progress bar -->
    <div class="tile-progress">
      <div
        class="tile-progress-fill"
        :style="{ width: progressPercent + '%' }"
      ></div>
      <div
        class="tile-progress-cursor"
        :style="{ left: progressPercent + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tile: { type: Object, required: true },
  isActive: { type: Boolean, default: false },
  result: { type: String, default: null },
  progress: { type: Number, default: 0 },
  upcomingDistance: { type: Number, default: 0 },
});

const tileClasses = computed(() => ({
  active: props.isActive,
  "result-perfect": props.result === "PERFECT",
  "result-good": props.result === "GOOD",
  "result-ok": props.result === "OK",
  "result-miss": props.result === "MISS",
}));

const tileStyle = computed(() => ({
  "--lane-color": props.tile.color,
  "--lane-color-glow": props.tile.color + "66",
  "--lane-color-bg": props.tile.color + "15",
}));

const progressPercent = computed(() => Math.round(props.progress * 100));
</script>

<style lang="scss" scoped>
.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--lane-color-bg, var(--surface-color));
  border: 2px solid var(--lane-color, transparent);
  border-radius: 16px;
  padding: 12px 12px 20px;
  transition:
    transform 0.15s,
    border-color 0.15s,
    box-shadow 0.15s,
    background 0.2s;
  aspect-ratio: 1;
  overflow: hidden;

  &.active {
    background: var(--lane-color-bg);
    box-shadow: 0 0 20px var(--lane-color-glow);
    transform: scale(1.08);
    z-index: 2;
    animation: tilePulse 0.3s ease-out;
  }

  &.result-perfect,
  &.result-good,
  &.result-ok {
    box-shadow: 0 0 18px var(--lane-color-glow);
  }

  &.result-miss {
    border-color: var(--miss-color);
    background: var(--miss-color);
    box-shadow: 0 0 15px var(--miss-color-glow);
    animation: tileShake 0.3s ease;

    .tile-letter {
      color: #fff;
    }

    .tile-watermark {
      fill: #fff;
      opacity: 0.15;
    }
  }
}

.tile-watermark {
  position: absolute;
  inset: 8%;
  width: 84%;
  height: 84%;
  fill: var(--lane-color);
  opacity: 0.08;
  pointer-events: none;
}

.tile-logo {
  width: 44%;
  height: auto;
  max-height: 44%;
  object-fit: contain;
  pointer-events: none;
  z-index: 1;
}

.tile-letter {
  font-size: 1.2em;
  font-weight: 800;
  color: var(--lane-color);
  z-index: 1;
  margin-top: 4px;
}

.tile-hit-zone {
  position: absolute;
  bottom: 10px;
  left: 4px;
  right: 4px;
  height: 6px;
  display: flex;
  border-radius: 3px;
  overflow: hidden;
  opacity: 0.4;

  .zone {
    flex: 1;
  }
  .zone-ok {
    background: #1565c0;
  }
  .zone-good {
    background: #2e7d32;
  }
  .zone-perfect {
    background: #ffd600;
  }
}

.tile-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
}

.tile-progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--lane-color);
  opacity: 0.3;
  transition: width 60ms linear;
}

.tile-progress-cursor {
  position: absolute;
  top: -2px;
  width: 4px;
  height: 10px;
  background: #fff;
  border-radius: 2px;
  transform: translateX(-50%);
  transition: left 60ms linear;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
}

@keyframes tilePulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1.08);
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
