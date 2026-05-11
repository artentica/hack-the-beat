<template>
  <div class="sequence-preview">
    <div
      v-for="(beat, idx) in patternBeats"
      :key="idx"
      class="seq-cell"
      :class="{
        'seq-rest': beat.isRest,
        'seq-current': idx === currentPatternIndex,
        'seq-played': !beat.isRest && idx < currentPatternIndex,
      }"
      :style="beat.isRest ? {} : { '--lane-color': beat.color }"
    >
      <template v-if="!beat.isRest">
        <img
          v-if="beat.techSvg"
          :src="beat.techSvg"
          :alt="beat.key"
          class="seq-icon"
        />
        <span class="seq-key">{{ beat.key }}</span>
      </template>
      <span v-else class="seq-dash">—</span>
      <span class="seq-num">{{ idx + 1 }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { LANES } from "../data/techLogos.js";

const props = defineProps({
  pattern: { type: Array, default: () => [] },
  gridTiles: { type: Array, default: () => [] },
  currentBeatIndex: { type: Number, default: 0 },
});

// 4 lead-in rest beats before the pattern starts
const LEAD_IN = 4;
const currentPatternIndex = computed(() => {
  const idx = props.currentBeatIndex - LEAD_IN;
  if (idx < 0) return -1; // still in lead-in
  return idx % 8;
});

const patternBeats = computed(() => {
  return props.pattern.map((laneIdx) => {
    if (laneIdx === null) {
      return { isRest: true };
    }
    const lane = LANES[laneIdx];
    const tile = props.gridTiles[laneIdx];
    return {
      isRest: false,
      key: lane.key,
      color: lane.color,
      shape: lane.shape,
      techSvg: tile?.tech?.svg || null,
    };
  });
});
</script>

<style lang="scss" scoped>
.sequence-preview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 6px;
  width: 100%;
  max-width: 320px;
  margin: 12px auto 0;
}

.seq-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: 10px;
  background: var(--surface-color, rgba(0, 0, 0, 0.05));
  border: 2px solid transparent;
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s,
    opacity 0.15s;
  padding: 4px;

  &.seq-rest {
    opacity: 0.2;
    border: 2px dashed rgba(255, 255, 255, 0.15);
  }

  &:not(.seq-rest) {
    border-color: var(--lane-color, transparent);
    background: color-mix(in srgb, var(--lane-color) 12%, transparent);
  }

  &.seq-current:not(.seq-rest) {
    transform: scale(1.12);
    box-shadow: 0 0 14px var(--lane-color);
    border-width: 3px;
    z-index: 2;
  }

  &.seq-current.seq-rest {
    transform: scale(1.08);
    opacity: 0.4;
    border-color: rgba(255, 255, 255, 0.3);
  }

  &.seq-played {
    opacity: 0.4;
  }
}

.seq-icon {
  width: 50%;
  height: auto;
  max-height: 50%;
  object-fit: contain;
}

.seq-key {
  font-size: 0.7em;
  font-weight: 800;
  color: var(--lane-color);
  line-height: 1;
  margin-top: 2px;
}

.seq-dash {
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.2);
}

.seq-num {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.5em;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.25);
}
</style>
