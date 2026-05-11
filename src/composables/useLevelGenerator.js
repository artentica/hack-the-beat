export function useLevelGenerator() {
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  // Level parameters — BPM starts at 90, +15 per level (no cap)
  function getLevelParams(level) {
    const bpm = 90 + level * 15
    const loopCount = Math.min(6, 2 + Math.ceil(level / 2))
    const hasScreenShake = level >= 5
    const hasBlurGlitch = level >= 5
    const activeLanes = level <= 2 ? 2 : level <= 4 ? 3 : 4

    return { bpm, loopCount, hasScreenShake, hasBlurGlitch, activeLanes }
  }

  // Pre-defined rhythmic patterns per lane count
  // _ = null (rest/silence). All patterns are exactly 8 beats.
  const _ = null
  const PATTERNS_2 = [
    [0, _, 0, _, 1, _, 0, _],
    [0, _, 1, _, 0, _, 1, _],
    [0, 0, _, _, 1, 1, _, _],
    [0, _, _, 1, _, _, 0, _],
    [0, _, 1, _, _, 0, _, _],
    [1, _, 0, _, 0, _, 1, _],
  ]

  const PATTERNS_3 = [
    [0, _, 1, _, 2, _, 1, _],
    [0, 1, _, 2, _, 1, 0, _],
    [0, _, 1, 2, _, _, 1, 0],
    [2, _, 1, _, 0, _, _, 0],
    [0, 1, _, _, 2, 1, _, _],
    [0, _, 2, _, 1, _, 0, _],
  ]

  const PATTERNS_4 = [
    [0, 1, _, 2, 3, _, 1, _],
    [0, _, 1, 2, _, 3, _, 0],
    [3, _, 2, _, 1, _, 0, _],
    [0, 1, 2, _, 3, 2, 1, _],
    [0, _, 3, _, 1, _, 2, _],
    [0, 1, _, 2, _, 3, 0, _],
    [1, _, 0, 3, _, 2, _, 1],
    [0, 2, _, _, 3, 1, _, 0],
  ]

  function getPatternPool(activeLanes) {
    if (activeLanes <= 2) return PATTERNS_2
    if (activeLanes <= 3) return PATTERNS_3
    return PATTERNS_4
  }

  // Generate the full beat sequence for a level
  // Returns { sequence, pattern } — pattern is the raw 8-beat array for preview
  function generateSequence(level) {
    const params = getLevelParams(level)
    const pool = getPatternPool(params.activeLanes)
    const basePattern = pickRandom(pool)
    const seq = []

    // Lead-in: 4 rest beats so player can see notes approaching
    for (let r = 0; r < 4; r++) {
      seq.push({ laneIndex: -1, isRest: true })
    }

    // Repeat the same 8-beat pattern loopCount times
    for (let loop = 0; loop < params.loopCount; loop++) {
      for (let i = 0; i < basePattern.length; i++) {
        const lane = basePattern[i]
        if (lane === null) {
          seq.push({ laneIndex: -1, isRest: true })
        } else {
          seq.push({ laneIndex: lane, isRest: false })
        }
      }
    }

    return { sequence: seq, pattern: basePattern }
  }

  return {
    pickRandom,
    getLevelParams,
    generateSequence,
  }
}
