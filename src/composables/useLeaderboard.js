import { computed, ref } from 'vue'

const STORAGE_KEY = 'panic-leaderboard'

export function useLeaderboard() {
  const entries = ref([])

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) entries.value = JSON.parse(raw)
    } catch {
      entries.value = []
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value))
  }

  const sorted = computed(() => {
    // Deduplicate: keep best score per email
    const best = {}
    for (const e of entries.value) {
      const key = e.email.toLowerCase()
      if (!best[key] || e.score > best[key].score) {
        best[key] = e
      }
    }
    return Object.values(best).sort((a, b) => b.score - a.score)
  })

  const podium = computed(() => sorted.value.slice(0, 3))

  function addEntry(entry) {
    // entry: { firstName, lastName, email, phone, position, score, date }
    const existing = entries.value.findIndex(
      e => e.email.toLowerCase() === entry.email.toLowerCase()
    )
    if (existing > -1) {
      if (entry.score > entries.value[existing].score) {
        entries.value.splice(existing, 1, entry)
      }
      // else: don't overwrite with a lower score
    } else {
      entries.value.push(entry)
    }
    save()
    // Return rank (1-based)
    const rank = sorted.value.findIndex(
      e => e.email.toLowerCase() === entry.email.toLowerCase()
    )
    return rank + 1
  }

  function exportJSON() {
    const json = JSON.stringify(sorted.value, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date()
    a.href = url
    a.download = `panic-scores-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (
            Array.isArray(data) &&
            data.every(d => 'score' in d && 'firstName' in d && 'lastName' in d)
          ) {
            entries.value = data
            save()
            resolve(true)
          } else {
            reject(new Error('Format invalide'))
          }
        } catch {
          reject(new Error('Erreur de lecture JSON'))
        }
      }
      reader.readAsText(file)
    })
  }

  // Init
  load()

  return {
    entries,
    sorted,
    podium,
    addEntry,
    exportJSON,
    importJSON,
    load,
  }
}
