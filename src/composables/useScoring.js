import { computed, ref } from 'vue'

export function useScoring() {
  const score = ref(0)
  const combo = ref(0)
  const maxCombo = ref(0)
  const perfectCount = ref(0)
  const goodCount = ref(0)
  const okCount = ref(0)
  const missCount = ref(0)
  const lastFeedback = ref(null) // { type, points, timestamp }

  const comboMultiplier = computed(() => {
    if (combo.value >= 20) return 5
    if (combo.value >= 10) return 3
    if (combo.value >= 5) return 2
    return 1
  })

  function hitBeat(accuracy, level) {
    // accuracy: 'PERFECT' | 'GOOD' | 'OK'
    const accuracyBonus = accuracy === 'PERFECT' ? 3 : accuracy === 'GOOD' ? 2 : 1

    if (accuracy === 'PERFECT') perfectCount.value++
    else if (accuracy === 'GOOD') goodCount.value++
    else okCount.value++

    combo.value++
    if (combo.value > maxCombo.value) maxCombo.value = combo.value

    const points = 10 * level * comboMultiplier.value * accuracyBonus
    score.value += points

    lastFeedback.value = { type: accuracy, points, timestamp: Date.now() }
    return points
  }

  function missBeat() {
    combo.value = 0
    missCount.value++
    lastFeedback.value = { type: 'MISS', points: 0, timestamp: Date.now() }
  }

  function decoyAvoided(level) {
    // Small bonus for correctly NOT pressing during a decoy
    const points = 5 * level
    score.value += points
    combo.value++
    if (combo.value > maxCombo.value) maxCombo.value = combo.value
    lastFeedback.value = { type: 'DODGE', points, timestamp: Date.now() }
    return points
  }

  function decoyFailed() {
    combo.value = 0
    missCount.value++
    lastFeedback.value = { type: 'TRAP', points: 0, timestamp: Date.now() }
  }

  function reset() {
    score.value = 0
    combo.value = 0
    maxCombo.value = 0
    perfectCount.value = 0
    goodCount.value = 0
    okCount.value = 0
    missCount.value = 0
    lastFeedback.value = null
  }

  return {
    score,
    combo,
    maxCombo,
    comboMultiplier,
    perfectCount,
    goodCount,
    okCount,
    missCount,
    lastFeedback,
    hitBeat,
    missBeat,
    decoyAvoided,
    decoyFailed,
    reset,
  }
}
