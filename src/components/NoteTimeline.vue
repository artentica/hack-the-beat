<template>
  <div class="note-timeline" ref="timelineRef">
    <!-- Hit line — simple vertical marker -->
    <div class="hit-line"></div>

    <!-- Hit feedback label au niveau de la hit line -->
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
          'note-decoy': note.isDecoy,
          'note-hit':
            note.seqIndex === currentBeatIndex &&
            hitResult &&
            hitResult !== 'MISS' &&
            hitResult !== 'TRAP',
          'note-miss':
            note.seqIndex === currentBeatIndex &&
            (hitResult === 'MISS' || hitResult === 'TRAP'),
        }"
        :style="noteStyle(note)"
      >
        <img
          v-if="note.svg"
          :src="note.svg"
          :alt="note.letter"
          class="note-icon"
        />
        <span class="note-letter">{{ note.letter }}</span>

        <!-- Timing zones at the bottom of the tile -->
        <div v-if="note.showZones" class="timing-zones">
          <div class="zone zone-ok"></div>
          <div class="zone zone-good"></div>
          <div class="zone zone-perfect"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const RESULT_LABELS = {
  PERFECT: "PERFECT!",
  GOOD: "GOOD",
  OK: "OK",
  MISS: "MISS",
  TRAP: "TRAP",
  DODGE: "DODGE",
};

const props = defineProps({
  sequence: { type: Array, default: () => [] },
  currentBeatIndex: { type: Number, default: 0 },
  beatDurationMs: { type: Number, default: 750 },
  gridTiles: { type: Array, default: () => [] },
  hitResult: { type: String, default: null },
  isCountdown: { type: Boolean, default: false },
  countdownValue: { type: Number, default: 0 },
});

// Maintien du label visible 500ms minimum
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

// Track container width for pixel-based transforms
const trackWidth = ref(640);
let resizeObserver = null;
const timelineRef = ref(null);

// Hit line position (% from left)
const HIT_LINE_POS = 10;
// Spacing between each beat (% of timeline width)
const BEAT_SPACING = 10;
const VISIBLE_AHEAD = 9;

// Pre-computed beat pixel width (reactive to container resize)
const beatPx = computed(() => (BEAT_SPACING / 100) * trackWidth.value);

// Slide the whole track in from the right during countdown
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
  // Show 1 beat behind (just passed) and VISIBLE_AHEAD beats ahead
  const startIdx = Math.max(0, props.currentBeatIndex - 1);
  const endIdx = Math.min(
    props.currentBeatIndex + VISIBLE_AHEAD + 1,
    props.sequence.length,
  );

  for (let i = startIdx; i < endIdx; i++) {
    const beat = props.sequence[i];
    // Skip rest beats — don't show them on timeline
    if (beat.isRest) continue;

    const tile = beat.tileIndex >= 0 ? props.gridTiles[beat.tileIndex] : null;

    // Position at start of beat (beatProgress = 0)
    // CSS animation will handle smooth scrolling to the left
    const beatOffset = i - props.currentBeatIndex;
    const posPercent = HIT_LINE_POS + (beatOffset + 0.5) * BEAT_SPACING;

    // Wider range to include notes that will scroll into view during animation
    if (posPercent < -15 || posPercent > 115) continue;

    // Show zones on current note and next 2 upcoming notes
    const aheadCount = i - props.currentBeatIndex;
    const showZones = aheadCount >= 0 && aheadCount <= 2;

    notes.push({
      seqIndex: i,
      posPercent,
      tileIndex: beat.tileIndex,
      isDecoy: beat.isDecoy || false,
      svg: tile ? tile.svg : null,
      letter: tile ? tile.letter : "",
      showZones,
    });
  }

  return notes;
});

/** Compute CSS variables for GPU-animated scrolling.
 *  --start-x:  pixel position at start of beat
 *  --beat-px:  pixel distance to travel in one beat
 *  --beat-dur: beat duration for the CSS animation */
// Timing zone widths in pixels (proportional to beat duration)
const zoneOkW = computed(() => (300 / props.beatDurationMs) * beatPx.value);
const zoneGoodW = computed(() => (200 / props.beatDurationMs) * beatPx.value);
const zonePerfectW = computed(
  () => (100 / props.beatDurationMs) * beatPx.value,
);

function noteStyle(note) {
  const startX = (note.posPercent / 100) * trackWidth.value - 28;
  return {
    "--start-x": startX + "px",
    "--beat-px": beatPx.value + "px",
    "--beat-dur": props.beatDurationMs + "ms",
    "--zone-ok-w": zoneOkW.value + "px",
    "--zone-good-w": zoneGoodW.value + "px",
    "--zone-perfect-w": zonePerfectW.value + "px",
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
  height: 96px;
  background: var(--surface-color, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.1));
  border-radius: 12px;
  overflow: hidden;
}

// Timing zones inside each note tile
.timing-zones {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  height: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.zone {
  position: absolute;
  height: 100%;
  border-radius: 2px;
}

.zone-ok {
  width: var(--zone-ok-w, 40px);
  background: rgba(100, 160, 255, 0.35);
}

.zone-good {
  width: var(--zone-good-w, 28px);
  background: rgba(76, 200, 80, 0.5);
}

.zone-perfect {
  width: var(--zone-perfect-w, 16px);
  background: rgba(245, 237, 99, 0.7);
}

// Hit line — simple vertical marker
.hit-line {
  position: absolute;
  left: 10%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent-color, #f5ed63);
  z-index: 5;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: var(--surface-color, rgba(0, 0, 0, 0.05));
  border: 2px solid var(--surface-border, rgba(0, 0, 0, 0.1));
  overflow: hidden;
  z-index: 2;
  will-change: transform;
  backface-visibility: hidden;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;

  // Pause scroll animation during countdown
  &.note-paused {
    animation-play-state: paused !important;
  }

  &.note-current {
    border-color: var(--accent-color, #f5ed63);
    box-shadow: 0 0 12px var(--accent-glow, rgba(245, 237, 99, 0.5));
    z-index: 4;
    animation:
      note-scroll var(--beat-dur, 750ms) linear forwards,
      note-current-in 120ms ease-out forwards;
  }

  &.note-decoy {
    border-color: var(--danger-color, #ff4444);
    background: rgba(255, 68, 68, 0.1);
  }

  &.note-hit {
    border-color: var(--success-color, #4caf50);
    box-shadow: 0 0 14px rgba(76, 175, 80, 0.6);
  }

  &.note-miss {
    border-color: var(--danger-color, #f44336);
    box-shadow: 0 0 14px rgba(244, 67, 54, 0.6);
  }
}

@keyframes note-scroll {
  from {
    transform: translate3d(var(--start-x), -50%, 0);
  }
  to {
    transform: translate3d(calc(var(--start-x) - var(--beat-px)), -50%, 0);
  }
}

@keyframes note-current-in {
  from {
    scale: 1;
  }
  to {
    scale: 1.15;
  }
}

.note-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
  pointer-events: none;
}

.note-letter {
  font-size: 0.6em;
  font-weight: 700;
  color: var(--main-font-color);
  opacity: 0.8;
  line-height: 1;
}

// Label de résultat flottant sur la ligne de hit
.hit-feedback {
  position: absolute;
  left: 10%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: 6px;

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
  &.result-miss,
  &.result-trap {
    color: #fff;
    background: rgba(198, 40, 40, 0.9);
  }
  &.result-dodge {
    color: #fff;
    background: rgba(46, 125, 50, 0.9);
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
    transform: translate(-50%, -65%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
@keyframes hitOut {
  from {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -35%);
  }
}
</style>
