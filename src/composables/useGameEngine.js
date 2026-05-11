import { computed, nextTick, onUnmounted, ref } from 'vue'
import { LANES, LANE_KEYS, pickLevelTechs } from '../data/techLogos.js'
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

  // Test time scale: speeds up countdown & beat durations (1 = normal)
  const timeScale = window.__testTimeScale || 1

  // --- State ---
  const state = ref(STATES.IDLE)
  const level = ref(1)
  const countdownValue = ref(3)

  // Rock Meter (0-100, starts at 50, game over at 0)
  const ROCK_METER_START = 50
  const rockMeter = ref(ROCK_METER_START)

  function changeRockMeter(delta) {
    rockMeter.value = Math.max(0, Math.min(100, rockMeter.value + delta))
    if (rockMeter.value === 0) {
      gameOver()
      return true
    }
    return false
  }

  // Grid: 4 tiles (one per lane) with decorative tech logos
  const gridTiles = ref([]) // [{ key, laneIndex, color, shape, tech: { name, svg } }]

  // Beat sequence for current level
  const sequence = ref([])
  const currentBeatIndex = ref(0)

  // The raw 8-beat pattern (for preview display)
  const pattern = ref([])

  // Timing
  const bpm = ref(100)
  const beatDurationMs = computed(() => 60000 / bpm.value / timeScale)

  // Active lane index (-1 = none)
  const activeTileIndex = ref(-1)

  // Upcoming beats preview
  const PREVIEW_COUNT = 3
  const upcomingBeats = computed(() => {
    const upcoming = []
    for (let i = 1; i <= PREVIEW_COUNT; i++) {
      const idx = currentBeatIndex.value + i
      if (idx < sequence.value.length) {
        upcoming.push({
          tileIndex: sequence.value[idx].laneIndex,
          distance: i,
        })
      }
    }
    return upcoming
  })

  const expectedLetter = ref('')

  // Timing indicator progress (0 to 1)
  const beatProgress = ref(0)

  // Beat pulse for visual rhythm feedback
  const beatPulse = ref(false)

  // Input state
  const inputResult = ref(null)
  const inputProcessed = ref(false)

  // Glitch effects
  const glitchEffects = ref({
    screenShake: false,
    blurGlitch: false,
  })
  let shakeTimer = null
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
  const activeBeatsTotal = computed(() => sequence.value.filter(b => !b.isRest).length)
  const activeBeatsPlayed = computed(() => {
    let count = 0
    for (let i = 0; i < currentBeatIndex.value && i < sequence.value.length; i++) {
      if (!sequence.value[i].isRest) count++
    }
    return count
  })

  // Hit windows: PERFECT ±50ms, GOOD ±100ms, OK ±150ms
  const HIT_WINDOW = 150

  // --- Methods ---

  function setupLevel(lvl) {
    level.value = lvl
    const params = generator.getLevelParams(lvl)
    levelParams.value = params
    bpm.value = params.bpm

    // Build 4 grid tiles from lanes + decorative tech logos
    const techs = pickLevelTechs(lvl)
    gridTiles.value = LANES.map((lane, idx) => ({
      ...lane,
      tech: techs[idx],
      index: idx,
    }))

    // Generate beat sequence
    const result = generator.generateSequence(lvl)
    sequence.value = result.sequence
    pattern.value = result.pattern
    currentBeatIndex.value = 0
    activeTileIndex.value = -1
    expectedLetter.value = ''
    beatProgress.value = 0
    beatPulse.value = false
    inputResult.value = null
    inputProcessed.value = false
    rockMeter.value = ROCK_METER_START

    glitchEffects.value = { screenShake: false, blurGlitch: false }
  }

  function startCountdown(onComplete) {
    state.value = STATES.COUNTDOWN
    countdownValue.value = 3
    inputResult.value = null
    activeTileIndex.value = -1
    beatProgress.value = 0
    scoring.lastFeedback.value = null

    countdownTimer = setInterval(() => {
      countdownValue.value--
      if (countdownValue.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
        // Show "GO!" for 1s before starting — enough time to read it
        setTimeout(() => onComplete(), 300 / timeScale)
      }
    }, 800 / timeScale)
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

    // Pulse on every beat for rhythm feedback
    beatPulse.value = false
    nextTick(() => { beatPulse.value = true })

    if (beat.isRest) {
      activeTileIndex.value = -1
      expectedLetter.value = ''
      beatStartTime = performance.now()
      animFrameId = requestAnimationFrame(beatLoop)
      return
    }

    activeTileIndex.value = beat.laneIndex
    expectedLetter.value = LANE_KEYS[beat.laneIndex]

    beatStartTime = performance.now()
    animFrameId = requestAnimationFrame(beatLoop)
  }

  function beatLoop(now) {
    if (state.value !== STATES.PLAYING) return

    const elapsed = now - beatStartTime
    const duration = beatDurationMs.value
    beatProgress.value = Math.min(1, elapsed / duration)

    if (elapsed >= duration) {
      if (!inputProcessed.value) {
        const isRest = sequence.value[currentBeatIndex.value]?.isRest

        if (isRest) {
          // Rest beat — no action needed
        } else {
          // Missed the beat
          scoring.missBeat()
          inputResult.value = 'MISS'
          triggerGlitch()
          const missLoss = Math.min(25, 8 + level.value * 2)
          if (changeRockMeter(-missLoss)) return
        }
        inputProcessed.value = true
      }

      currentBeatIndex.value++
      startBeat()
      return
    }

    animFrameId = requestAnimationFrame(beatLoop)
  }

  function handleKeyPress(key) {
    if (state.value !== STATES.PLAYING) return
    if (inputProcessed.value) return

    const pressedKey = key.toUpperCase()

    // Only accept D, F, J, K
    if (!LANE_KEYS.includes(pressedKey)) return

    // Pressed during a rest beat — penalize
    const currentSeqBeat = sequence.value[currentBeatIndex.value]
    if (currentSeqBeat && currentSeqBeat.isRest) {
      scoring.missBeat()
      inputResult.value = 'MISS'
      inputProcessed.value = true
      triggerGlitch()
      return
    }

    const now = performance.now()
    const elapsed = now - beatStartTime
    const duration = beatDurationMs.value

    if (pressedKey === expectedLetter.value) {
      // Correct key — evaluate timing
      const centerTime = duration / 2
      const timingOffset = Math.abs(elapsed - centerTime)

      let accuracy
      if (timingOffset <= 50) accuracy = 'PERFECT'
      else if (timingOffset <= 100) accuracy = 'GOOD'
      else if (timingOffset <= HIT_WINDOW) accuracy = 'OK'
      else accuracy = 'OK'

      scoring.hitBeat(accuracy, level.value)
      inputResult.value = accuracy
      inputProcessed.value = true
      const meterGain = accuracy === 'PERFECT' ? 5 : accuracy === 'GOOD' ? 3 : 1
      changeRockMeter(+meterGain)
    } else {
      // Wrong lane
      scoring.missBeat()
      inputResult.value = 'MISS'
      inputProcessed.value = true
      triggerGlitch()
      const missLoss = Math.min(25, 8 + level.value * 2)
      changeRockMeter(-missLoss)
    }
  }

  let colorGlitchTimer = null

  function triggerGlitch() {
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

    if (levelParams.value.hasBlurGlitch) {
      clearTimeout(colorGlitchTimer)
      glitchEffects.value.blurGlitch = true
      colorGlitchTimer = setTimeout(() => {
        glitchEffects.value.blurGlitch = false
      }, 400)
    }
  }

  function levelComplete() {
    cancelAnimationFrame(animFrameId)
    state.value = STATES.LEVEL_COMPLETE
    activeTileIndex.value = -1
    beatProgress.value = 0
  }

  /** Test helper: instantly complete the current level with perfect score */
  function skipLevel() {
    cancelAnimationFrame(animFrameId)
    for (const beat of sequence.value) {
      if (!beat.isRest) {
        scoring.hitBeat('PERFECT', level.value)
        changeRockMeter(+5)
      }
    }
    currentBeatIndex.value = sequence.value.length
    levelComplete()
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
    const startLevel = (import.meta.env.DEV || import.meta.env.MODE === 'test')
      ? parseInt(new URLSearchParams(window.location.search).get('level')) || 1
      : 1
    setupLevel(startLevel)
    startCountdown(() => startPlaying())
  }

  function resetToIdle() {
    cancelAnimationFrame(animFrameId)
    if (countdownTimer) clearInterval(countdownTimer)
    state.value = STATES.IDLE
    level.value = 1
    scoring.reset()
  }

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
    pattern,
    currentBeatIndex,
    activeTileIndex,
    upcomingBeats,
    expectedLetter,
    beatProgress,
    beatPulse,
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
    skipLevel,
  }
}
