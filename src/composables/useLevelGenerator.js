// Mulberry32 — fast, seedable, deterministic PRNG
function mulberry32(seed) {
  let s = seed | 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function useLevelGenerator() {
  let rng = mulberry32(Date.now())

  function setSeed(seed) {
    rng = mulberry32(seed)
  }

  // Fisher–Yates shuffle with the seeded PRNG
  function shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  function pickRandom(arr) {
    return arr[Math.floor(rng() * arr.length)]
  }

  // Pick 8 logos for the grid from a pool of 14
  function pickGridLogos(pool) {
    return shuffle(pool).slice(0, 8)
  }

  // Level parameters
  function getLevelParams(level) {
    const baseBPM = 60
    const bpm = Math.min(160, Math.round(baseBPM * Math.pow(1.08, level - 1)))

    // How many times the pattern repeats
    // Level 1: 2 reps, grows to 6
    const loopCount = Math.min(6, 1 + Math.ceil(level / 2))

    // Number of rest beats sprinkled between the 8 tiles
    // Level 1: 6 rests, Level 4: 3, Level 7+: 0
    const restCount = Math.max(0, 7 - level)

    // Glitch features
    const hasScreenShake = level >= 5
    const hasDecoys = level >= 7
    const hasColorInvert = level >= 9
    const hasBlur = level >= 11
    const hasCesar = level >= 8

    return { bpm, loopCount, restCount, hasScreenShake, hasDecoys, hasColorInvert, hasBlur, hasCesar }
  }

  /**
   * Generate a rhythm pattern: always all 8 tiles in grid order (0→7),
   * with rest beats randomly distributed in the gaps between tiles.
   */
  function generatePattern(restCount) {
    // Distribute rests among the 7 gaps between tiles
    const gaps = new Array(7).fill(0)
    for (let r = 0; r < restCount; r++) {
      gaps[Math.floor(rng() * 7)]++
    }

    const pattern = []
    for (let i = 0; i < 8; i++) {
      pattern.push(i)
      // Add rests after this tile (not after the last one)
      if (i < 7) {
        for (let r = 0; r < gaps[i]; r++) {
          pattern.push(null)
        }
      }
    }

    return pattern
  }

  // Generate the full beat sequence
  function generateSequence(level, gridSize = 8) {
    const params = getLevelParams(level)
    const pattern = generatePattern(params.restCount)
    const seq = []

    // Lead-in: 4 rest beats so the player can see the grid before notes arrive
    for (let r = 0; r < 4; r++) {
      seq.push({ tileIndex: -1, isRest: true, isDecoy: false, cesarShift: 0 })
    }

    for (let loop = 0; loop < params.loopCount; loop++) {
      for (let i = 0; i < pattern.length; i++) {
        const tileIndex = pattern[i]

        if (tileIndex === null) {
          seq.push({ tileIndex: -1, isRest: true, isDecoy: false, cesarShift: 0 })
          continue
        }

        // Decoy chance at high levels
        if (params.hasDecoys && rng() < 0.08) {
          seq.push({ tileIndex, isRest: false, isDecoy: true, cesarShift: 0 })
          continue
        }

        // César shift
        let cesarShift = 0
        if (params.hasCesar && rng() < 0.12) {
          cesarShift = 1
        }

        seq.push({ tileIndex, isRest: false, isDecoy: false, cesarShift })
      }
    }

    // Trim trailing rest beats to avoid dead time at end of level
    while (seq.length > 0 && seq[seq.length - 1].isRest) {
      seq.pop()
    }

    return seq
  }

  return {
    setSeed,
    shuffle,
    pickRandom,
    pickGridLogos,
    getLevelParams,
    generateSequence,
  }
}
