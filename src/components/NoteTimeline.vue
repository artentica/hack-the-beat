<template>
  <div class="note-timeline" ref="timelineRef">
    <!-- Hit line with beat pulse -->
    <div class="hit-line" :class="{ 'hit-pulse': beatPulse }"></div>

    <!-- Hit feedback label -->
    <Transition name="hit-pop">
      <div
        v-if="displayResult"
        :key="displayResult + '_' + currentBeatIndex"
        class="hit-feedback"
        :class="'result-' + displayResult.toLowerCase()"
      >
        {{ RESULT_LABELS[displayResult] ?? displayResult }}
      </div>
    </Transition>

    <div class="timeline-track" :style="trackStyle">
      <div
        v-for="note in visibleNotes"
        :key="
          (isCountdown ? 'c' : 'p') + currentBeatIndex + '-' + note.seqIndex
        "
        class="timeline-note"
        :class="{
          'note-paused': isCountdown,
          'note-current': note.seqIndex === currentBeatIndex,
          'note-hit':
            note.seqIndex === currentBeatIndex &&
            hitResult &&
            hitResult !== 'MISS',
          'note-miss':
            note.seqIndex === currentBeatIndex && hitResult === 'MISS',
        }"
        :style="noteStyle(note)"
      >
        <img
          v-if="note.techSvg"
          :src="note.techSvg"
          :alt="note.key"
          class="note-icon"
        />
        <span class="note-letter">{{ note.key }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { LANES } from "../data/techLogos.js";

const RESULT_LABELS = {
  PERFECT: "PERFECT!",
  GOOD: "GOOD",
  OK: "OK",
  MISS: "MISS",
};

const props = defineProps({
  sequence: { type: Array, default: () => [] },
  currentBeatIndex: { type: Number, default: 0 },
  beatDurationMs: { type: Number, default: 750 },
  gridTiles: { type: Array, default: () => [] },
  hitResult: { type: String, default: null },
  isCountdown: { type: Boolean, default: false },
  countdownValue: { type: Number, default: 0 },
  beatPulse: { type: Boolean, default: false },
});

// Display result with 500ms timeout
const displayResult = ref(null);
let resultTimer = null;
watch(
  () => props.hitResult,
  (val) => {
    clearTimeout(resultTimer);
    if (val) {
      displayResult.value = val;
      resultTimer = setTimeout(() => {
        displayResult.value = null;
      }, 500);
    } else {
      displayResult.value = null;
    }
  },
);

const trackWidth = ref(640);
let resizeObserver = null;
const timelineRef = ref(null);

const HIT_LINE_POS = 10;
const BEAT_SPACING = 10;
const VISIBLE_AHEAD = 9;

const beatPx = computed(() => (BEAT_SPACING / 100) * trackWidth.value);

const trackStyle = computed(() => {
  if (!props.isCountdown) return {};
  const extraPx = (props.countdownValue / 3) * beatPx.value * 5;
  return {
    transform: `translateX(${extraPx}px)`,
    transition: "transform 800ms linear",
  };
});

const visibleNotes = computed(() => {
  const notes = [];
  const startIdx = Math.max(0, props.currentBeatIndex - 1);
  const endIdx = Math.min(
    props.currentBeatIndex + VISIBLE_AHEAD + 1,
    props.sequence.length,
  );

  for (let i = startIdx; i < endIdx; i++) {
    const beat = props.sequence[i];
    if (beat.isRest) continue;

    const laneIdx = beat.laneIndex;
    if (laneIdx < 0 || laneIdx >= 4) continue;

    const lane = LANES[laneIdx];
    const beatOffset = i - props.currentBeatIndex;
    const posPercent = HIT_LINE_POS + (beatOffset + 0.5) * BEAT_SPACING;

    if (posPercent < -15 || posPercent > 115) continue;

    // Get tech logo from gridTiles if available
    const tile = props.gridTiles[laneIdx];
    const techSvg = tile?.tech?.svg || null;

    notes.push({
      seqIndex: i,
      posPercent,
      laneIndex: laneIdx,
      key: lane.key,
      color: lane.color,
      shape: lane.shape,
      techSvg,
    });
  }

  return notes;
});

function noteStyle(note) {
  const SHAPE_CLIP = {
    circle: 'none',
    square: 'none',
    triangle: 'polygon(50% 0%, 100% 100%, 0% 100%)',
    diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  };
  const SHAPE_RADIUS = {
    circle: '50%',
    square: '14px',
    triangle: '0',
    diamond: '0',
  };
  const startX = (note.posPercent / 100) * trackWidth.value - 38;
  return {
    "--start-x": startX + "px",
    "--beat-px": beatPx.value + "px",
    "--beat-dur": props.beatDurationMs + "ms",
    "--lane-color": note.color,
    "--lane-color-glow": note.color + "88",
    "--note-radius": SHAPE_RADIUS[note.shape] || '14px',
    clipPath: SHAPE_CLIP[note.shape] || 'none',
  };
}

onMounted(() => {
  const el = timelineRef.value ?? document.querySelector(".note-timeline");
  if (el) {
    trackWidth.value = el.offsetWidth;
    resizeObserver = new ResizeObserver((entries) => {
      trackWidth.value = entries[0].contentRect.width;
    });
    resizeObserver.observe(el);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  clearTimeout(resultTimer);
});
</script>

<style lang="scss" scoped>
.note-timeline {
  width: 100%;
  max-width: 640px;
  margin: 0 auto 16px;
  position: relative;
  height: 100px;
  background: var(--surface-color, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.1));
  border-radius: 12px;
  overflow: hidden;
}

// Hit line
.hit-line {
  position: absolute;
  left: 10%;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent-color, #f5ed63);
  z-index: 5;
  transition: box-shadow 0.1s;

  &.hit-pulse {
    box-shadow: 0 0 14px 5px var(--accent-glow, rgba(245, 237, 99, 0.7));
    animation: hitLinePulse 0.15s ease-out;
  }
}

@keyframes hitLinePulse {
  0% {
    box-shadow: 0 0 22px 10px var(--accent-glow, rgba(245, 237, 99, 0.9));
  }
  100% {
    box-shadow: 0 0 14px 5px var(--accent-glow, rgba(245, 237, 99, 0.7));
  }
}

.timeline-track {
  position: relative;
  width: 100%;
  height: 100%;
}

.timeline-note {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translate3d(var(--start-x, 0), -50%, 0);
  animation: note-scroll var(--beat-dur, 750ms) linear forwards;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2px;
  width: 76px;
  height: 80px;
  border-radius: var(--note-radius, 14px);
  background: var(--lane-color, #888);
  border: 3px solid var(--lane-color, #888);
  overflow: hidden;
  z-index: 2;
  will-change: transform;
  backface-visibility: hidden;
  transition: box-shadow 120ms ease;

  &.note-paused {
    animation-play-state: paused !important;
  }

  &.note-current {
    box-shadow: 0 0 16px var(--lane-color-glow);
    z-index: 4;
  }

  &.note-hit {
    box-shadow: 0 0 20px var(--lane-color-glow);
  }

  &.note-miss {
    border-color: var(--danger-color, #f44336);
    background: var(--danger-color, #f44336);
    box-shadow: 0 0 14px rgba(244, 67, 54, 0.6);
  }
}

.note-icon {
  width: 38px;
  height: 38px;
  object-fit: contain;
  pointer-events: none;
  flex-shrink: 0;
}

.note-letter {
  font-size: 1.1em;
  font-weight: 900;
  color: #fff;
  line-height: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

@keyframes note-scroll {
  from {
    transform: translate3d(var(--start-x), -50%, 0);
  }
  to {
    transform: translate3d(calc(var(--start-x) - var(--beat-px)), -50%, 0);
  }
}

// Hit feedback — bigger and punchier
.hit-feedback {
  position: absolute;
  left: 10%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
  font-size: 15px;
  font-weight: 900;
  text-transform: uppercase;
  white-space: nowrap;
  padding: 4px 10px;
  border-radius: 8px;

  &.result-perfect {
    color: #d4a017;
    background: rgba(255, 215, 0, 0.85);
  }
  &.result-good {
    color: #fff;
    background: rgba(46, 125, 50, 0.9);
  }
  &.result-ok {
    color: #fff;
    background: rgba(21, 101, 192, 0.85);
  }
  &.result-miss {
    color: #fff;
    background: rgba(198, 40, 40, 0.9);
  }
}

.hit-pop-enter-active {
  animation: hitIn 0.12s ease-out;
}
.hit-pop-leave-active {
  animation: hitOut 0.2s ease-in forwards;
}

@keyframes hitIn {
  from {
    opacity: 0;
    transform: translate(-50%, -65%) scale(1.5);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
@keyframes hitOut {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -35%) scale(0.7);
  }
}
</style>
