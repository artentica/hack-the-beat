import { computed, nextTick, onUnmounted, ref } from 'vue'
import { LETTERS, TECH_LOGOS } from '../data/techLogos.js'
import { useLevelGenerator } from './useLevelGenerator.js'
import { useScoring } from './useScoring.js'

// Game states
export const STATES = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_OVER: 'GAME_OVER',
}

export function useGameEngine() {
  const generator = useLevelGenerator()
  const scoring = useScoring()

  // --- State ---
  const state = ref(STATES.IDLE)
  const level = ref(1)
  const countdownValue = ref(3)

  // Rock Meter (0-100, démarre à 50, game over à 0)
  const ROCK_METER_START = 50
  const rockMeter = ref(ROCK_METER_START)

  function changeRockMeter(delta) {
    rockMeter.value = Math.max(0, Math.min(100, rockMeter.value + delta))
    if (rockMeter.value === 0) {
      gameOver()
      return true // game ended
    }
    return false
  }

  // Grid: 8 tiles for 2x4
  const gridTiles = ref([]) // [{ letter, name, svg, index }]

  // Beat sequence for current level (sequential L→R scan)
  const sequence = ref([])
  const currentBeatIndex = ref(0)

  // Timing
  const bpm = ref(80)
  const beatDurationMs = computed(() => 60000 / bpm.value)

  // Scan position: which grid tile (0-7) the cursor is currently on
  const activeTileIndex = ref(-1)

  // How many upcoming beats to preview (Guitar Hero style approaching notes)
  const PREVIEW_COUNT = 3
  const upcomingBeats = computed(() => {
    const upcoming = []
    for (let i = 1; i <= PREVIEW_COUNT; i++) {
      const idx = currentBeatIndex.value + i
      if (idx < sequence.value.length) {
        upcoming.push({
          tileIndex: sequence.value[idx].tileIndex,
          distance: i, // 1 = next, 2 = after next, etc.
        })
      }
    }
    return upcoming
  })
  const isDecoyBeat = ref(false)
  const cesarShift = ref(0)
  const expectedLetter = ref('') // the letter the player should press (after César shift)

  // Timing indicator progress (0 to 1)
  const beatProgress = ref(0)

  // Input state
  const inputResult = ref(null) // null | 'PERFECT' | 'GOOD' | 'OK' | 'MISS' | 'DODGE' | 'TRAP'
  const inputProcessed = ref(false)

  // Glitch effects
  const glitchEffects = ref({
    screenShake: false,
    colorInvert: false,
    blur: false,
  })
  let shakeTimer = null
  let colorInvertTimer = null
  const levelParams = ref(null)

  // Animation frame tracking
  let animFrameId = null
  let beatStartTime = 0
  let countdownTimer = null

  // --- Computed ---
  const currentBeat = computed(() => {
    if (currentBeatIndex.value < sequence.value.length) {
      return sequence.value[currentBeatIndex.value]
    }
    return null
  })

  const totalBeats = computed(() => sequence.value.length)
  const beatsRemaining = computed(() => totalBeats.value - currentBeatIndex.value)
  // Count only actionable beats (non-rest)
  const activeBeatsTotal = computed(() => sequence.value.filter(b => !b.isRest).length)
  const activeBeatsPlayed = computed(() => {
    let count = 0
    for (let i = 0; i < currentBeatIndex.value && i < sequence.value.length; i++) {
      if (!sequence.value[i].isRest) count++
    }
    return count
  })

  // The hit window: ±150ms around the center of the beat
  // PERFECT: ±50ms, GOOD: ±100ms, OK: ±150ms
  const HIT_WINDOW = 150

  // --- Methods ---

  function setupLevel(lvl) {
    level.value = lvl
    const params = generator.getLevelParams(lvl)
    levelParams.value = params
    bpm.value = params.bpm

    // Pick 8 random logos from the pool of 14
    const selectedLogos = generator.pickGridLogos(TECH_LOGOS)
    gridTiles.value = selectedLogos.map((logo, idx) => ({
      ...logo,
      index: idx,
    }))

    // Generate beat sequence
    sequence.value = generator.generateSequence(lvl, 8)
    currentBeatIndex.value = 0
    activeTileIndex.value = -1
    isDecoyBeat.value = false
    cesarShift.value = 0
    expectedLetter.value = ''
    beatProgress.value = 0
    inputResult.value = null
    inputProcessed.value = false
    rockMeter.value = ROCK_METER_START

    // Reset glitch effects
    glitchEffects.value = {
      screenShake: false,
      colorInvert: false,
      blur: false,
    }
  }

  function startCountdown(onComplete) {
    state.value = STATES.COUNTDOWN
    countdownValue.value = 3
    // Clear any lingering result from the previous level
    inputResult.value = null
    activeTileIndex.value = -1
    beatProgress.value = 0

    countdownTimer = setInterval(() => {
      countdownValue.value--
      if (countdownValue.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
        onComplete()
      }
    }, 800)
  }

  function startPlaying() {
    state.value = STATES.PLAYING
    currentBeatIndex.value = 0
    inputProcessed.value = false
    inputResult.value = null
    startBeat()
  }

  function startBeat() {
    if (currentBeatIndex.value >= sequence.value.length) {
      levelComplete()
      return
    }

    const beat = sequence.value[currentBeatIndex.value]
    inputProcessed.value = false
    inputResult.value = null
    beatProgress.value = 0

    // Rest beat — no tile activates, auto-advance after beat duration
    if (beat.isRest) {
      activeTileIndex.value = -1
      isDecoyBeat.value = false
      cesarShift.value = 0
      expectedLetter.value = ''
      // Don't mark inputProcessed — pressing during rest is penalized in handleKeyPress
      beatStartTime = performance.now()
      animFrameId = requestAnimationFrame(beatLoop)
      return
    }

    if (beat.isDecoy) {
      // Decoy beat: tile lights up but player should NOT press
      activeTileIndex.value = beat.tileIndex
      isDecoyBeat.value = true
      cesarShift.value = 0
      expectedLetter.value = ''
    } else {
      activeTileIndex.value = beat.tileIndex
      isDecoyBeat.value = false
      cesarShift.value = beat.cesarShift

      const baseLetter = gridTiles.value[beat.tileIndex].letter
      if (beat.cesarShift > 0) {
        // Shift the letter in the LETTERS array
        const allLetters = LETTERS
        const baseIdx = allLetters.indexOf(baseLetter)
        const shiftedIdx = (baseIdx + beat.cesarShift) % allLetters.length
        expectedLetter.value = allLetters[shiftedIdx]
      } else {
        expectedLetter.value = baseLetter
      }
    }

    beatStartTime = performance.now()
    animFrameId = requestAnimationFrame(beatLoop)
  }

  function beatLoop(now) {
    if (state.value !== STATES.PLAYING) return

    const elapsed = now - beatStartTime
    const duration = beatDurationMs.value
    beatProgress.value = Math.min(1, elapsed / duration)

    // Check if beat time has expired
    if (elapsed >= duration) {
      if (!inputProcessed.value) {
        const isRest = sequence.value[currentBeatIndex.value]?.isRest

        if (isRest) {
          // Rest beat completed without pressing — correct, no action needed
        } else if (isDecoyBeat.value) {
          // Player correctly did NOT press anything during decoy
          scoring.decoyAvoided(level.value)
          inputResult.value = 'DODGE'
          changeRockMeter(+5)
        } else {
          // Missed the beat
          scoring.missBeat()
          inputResult.value = 'MISS'
          triggerGlitch('miss')
          if (changeRockMeter(-15)) return
        }
        inputProcessed.value = true
      }

      // Rest beats advance faster (no feedback needed)
      const isRest = sequence.value[currentBeatIndex.value]?.isRest

      // Advance immediately — timeline scrolls continuously so no delay needed
      currentBeatIndex.value++
      startBeat()
      return
    }

    animFrameId = requestAnimationFrame(beatLoop)
  }

  function handleKeyPress(key) {
    if (state.value !== STATES.PLAYING) return
    if (inputProcessed.value) return

    const pressedLetter = key.toUpperCase()

    // Only consider letters that exist in the grid
    const isInGrid = gridTiles.value.some(t => t.letter === pressedLetter)
    if (!isInGrid) return // ignore keys not in current grid (non-letter keys, etc.)

    // Pressed during a rest beat — penalize spam
    const currentSeqBeat = sequence.value[currentBeatIndex.value]
    if (currentSeqBeat && currentSeqBeat.isRest) {
      scoring.missBeat()
      inputResult.value = 'MISS'
      inputProcessed.value = true
      triggerGlitch('miss')
      return
    }

    const now = performance.now()
    const elapsed = now - beatStartTime
    const duration = beatDurationMs.value

    if (isDecoyBeat.value) {
      // Player pressed during a decoy — fail!
      scoring.decoyFailed()
      inputResult.value = 'TRAP'
      inputProcessed.value = true
      triggerGlitch('miss')
      changeRockMeter(-20)
      return
    }

    if (pressedLetter === expectedLetter.value) {
      // Correct key — evaluate timing
      // Timing relative to center of beat
      const centerTime = duration / 2
      const timingOffset = Math.abs(elapsed - centerTime)

      let accuracy
      if (timingOffset <= 50) accuracy = 'PERFECT'
      else if (timingOffset <= 100) accuracy = 'GOOD'
      else if (timingOffset <= HIT_WINDOW) accuracy = 'OK'
      else accuracy = 'OK' // still within beat window

      scoring.hitBeat(accuracy, level.value)
      inputResult.value = accuracy
      inputProcessed.value = true
      const meterGain = accuracy === 'PERFECT' ? 12 : accuracy === 'GOOD' ? 8 : 4
      changeRockMeter(+meterGain)
    } else {
      // Wrong key
      scoring.missBeat()
      inputResult.value = 'MISS'
      inputProcessed.value = true
      triggerGlitch('miss')
      changeRockMeter(-15)
    }
  }

  function triggerGlitch(type) {
    if (!levelParams.value) return

    if (levelParams.value.hasScreenShake) {
      clearTimeout(shakeTimer)
      glitchEffects.value.screenShake = false
      nextTick(() => {
        glitchEffects.value.screenShake = true
        shakeTimer = setTimeout(() => {
          glitchEffects.value.screenShake = false
        }, 300)
      })
    }

    // Random chance of color invert at high levels
    if (levelParams.value.hasColorInvert && Math.random() < 0.2) {
      clearTimeout(colorInvertTimer)
      glitchEffects.value.colorInvert = true
      colorInvertTimer = setTimeout(() => {
        glitchEffects.value.colorInvert = false
      }, 3000)
    }
  }

  function levelComplete() {
    cancelAnimationFrame(animFrameId)
    state.value = STATES.LEVEL_COMPLETE
    activeTileIndex.value = -1
    beatProgress.value = 0
  }

  function nextLevel() {
    setupLevel(level.value + 1)
    startCountdown(() => startPlaying())
  }

  function gameOver() {
    cancelAnimationFrame(animFrameId)
    if (countdownTimer) clearInterval(countdownTimer)
    state.value = STATES.GAME_OVER
  }

  function startGame() {
    scoring.reset()
    rockMeter.value = ROCK_METER_START
    setupLevel(1)
    startCountdown(() => startPlaying())
  }

  function resetToIdle() {
    cancelAnimationFrame(animFrameId)
    if (countdownTimer) clearInterval(countdownTimer)
    state.value = STATES.IDLE
    level.value = 1
    scoring.reset()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cancelAnimationFrame(animFrameId)
    if (countdownTimer) clearInterval(countdownTimer)
  })

  return {
    // State
    state,
    level,
    countdownValue,
    gridTiles,
    sequence,
    currentBeatIndex,
    activeTileIndex,
    upcomingBeats,
    isDecoyBeat,
    cesarShift,
    expectedLetter,
    beatProgress,
    inputResult,
    inputProcessed,
    glitchEffects,
    levelParams,
    bpm,
    beatDurationMs,
    totalBeats,
    beatsRemaining,
    activeBeatsTotal,
    activeBeatsPlayed,

    // Rock Meter
    rockMeter,

    // Scoring (exposed)
    score: scoring.score,
    combo: scoring.combo,
    maxCombo: scoring.maxCombo,
    comboMultiplier: scoring.comboMultiplier,
    perfectCount: scoring.perfectCount,
    goodCount: scoring.goodCount,
    okCount: scoring.okCount,
    missCount: scoring.missCount,
    lastFeedback: scoring.lastFeedback,

    // Actions
    startGame,
    startCountdown,
    startPlaying,
    handleKeyPress,
    nextLevel,
    gameOver,
    levelComplete,
    resetToIdle,
    setupLevel,
  }
}
