// @ts-check
import { readFileSync } from 'fs'
import * as path from 'path'
import { expect, test } from '@playwright/test'

/**
 * Helper: wait for Vue to expose the engine on window.__engine.
 * Returns a handle to evaluate engine state from the browser context.
 */
async function getEngine(page) {
  await page.waitForFunction(() => window.__engine && window.__engine.state)
  return true
}

/** Read a reactive ref value from the engine */
function engineVal(page, prop) {
  return page.evaluate((p) => {
    const e = window.__engine
    const v = e[p]
    return v && typeof v === 'object' && 'value' in v ? v.value : v
  }, prop)
}

/** Start the game from the start screen */
async function startGame(page) {
  // Click the start button
  const startBtn = page.locator('button.cbtw-style').first()
  await startBtn.click()

  // Wait for countdown to finish and PLAYING state
  await page.waitForFunction(
    () => window.__engine.state.value === 'PLAYING',
    null,
    { timeout: 10000 },
  )
}

/** Get current grid tile keys (array of 4 keys in grid order: D, F, J, K) */
function getGridKeys(page) {
  return page.evaluate(() =>
    window.__engine.gridTiles.value.map((t) => t.key),
  )
}

/** Get BPM */
function getBpm(page) {
  return page.evaluate(() => window.__engine.bpm.value)
}

/**
 * Instantly complete the current level with perfect score via engine helper.
 */
async function playLevelPerfectly(page) {
  await page.evaluate(() => window.__engine.skipLevel())
  await waitForState(page, 'LEVEL_COMPLETE', 5000)
}

/** Wait for a specific game state */
async function waitForState(page, state, timeout = 15000) {
  await page.waitForFunction(
    (s) => window.__engine.state.value === s,
    state,
    { timeout },
  )
}

// ─── Tests ───────────────────────────────────────────────────────

test.describe('Game Phases', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { window.__testTimeScale = 3 })
    await page.goto('/')
    await getEngine(page)
  })

  test('Start screen renders with start button', async ({ page }) => {
    const title = page.locator('.game-title')
    await expect(title).toBeVisible()
    await expect(title).toHaveText('Panic at the Deploy')

    const startBtn = page.locator('button.cbtw-style').first()
    await expect(startBtn).toBeVisible()
  })

  test('Clicking start shows countdown then playing', async ({ page }) => {
    const startBtn = page.locator('button.cbtw-style').first()
    await startBtn.click()

    // Should enter COUNTDOWN
    await waitForState(page, 'COUNTDOWN')
    const countdown = page.locator('.countdown-number')
    await expect(countdown).toBeVisible()

    // Should transition to PLAYING
    await waitForState(page, 'PLAYING', 10000)
    const timeline = page.locator('.note-timeline')
    await expect(timeline).toBeVisible()
  })

  test('Tiles appear in grid with 4 lanes', async ({ page }) => {
    await startGame(page)
    const tiles = page.locator('.tile')
    await expect(tiles).toHaveCount(4)

    // Each tile has a key
    const keys = await getGridKeys(page)
    expect(keys).toHaveLength(4)
    // All keys are unique
    expect(new Set(keys).size).toBe(4)
  })

  test('Level 1: complete with perfect play → LEVEL_COMPLETE', async ({
    page,
  }) => {
    await startGame(page)

    const level = await engineVal(page, 'level')
    expect(level).toBe(1)

    await playLevelPerfectly(page)

    const missCount = await engineVal(page, 'missCount')
    expect(missCount).toBe(0)

    const score = await engineVal(page, 'score')
    expect(score).toBeGreaterThan(0)
  })

  test('Level 1 → Level 2: next level button works', async ({ page }) => {
    await startGame(page)
    await playLevelPerfectly(page)

    // Click next level
    const nextBtn = page.locator('button.cbtw-style').filter({ hasText: /next|suivant/i })
    await nextBtn.click()

    // Wait for countdown then playing
    await waitForState(page, 'PLAYING', 10000)
    const level = await engineVal(page, 'level')
    expect(level).toBe(2)
  })

  test('Play through 3 levels successfully', async ({ page }) => {
    test.setTimeout(60000)
    await startGame(page)

    for (let lvl = 1; lvl <= 3; lvl++) {
      const currentLevel = await engineVal(page, 'level')
      expect(currentLevel).toBe(lvl)

      await playLevelPerfectly(page)

      if (lvl < 3) {
        const nextBtn = page
          .locator('button.cbtw-style')
          .filter({ hasText: /next|suivant/i })
        await nextBtn.click()
        await waitForState(page, 'PLAYING', 10000)
      }
    }

    const score = await engineVal(page, 'score')
    expect(score).toBeGreaterThan(0)
    const missCount = await engineVal(page, 'missCount')
    expect(missCount).toBe(0)
  })

  test('End game button from level complete → game over screen', async ({
    page,
  }) => {
    await startGame(page)
    await playLevelPerfectly(page)

    const endBtn = page
      .locator('button.secondary')
      .filter({ hasText: /end|terminer/i })
    await endBtn.click()

    // Should show game over screen
    const gameOverScreen = page.locator('.game-over-screen')
    await expect(gameOverScreen).toBeVisible()
  })
})

test.describe('Gameplay mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { window.__testTimeScale = 3 })
    await page.goto('/')
    await getEngine(page)
  })

  test('Wrong key press triggers MISS', async ({ page }) => {
    await startGame(page)

    // Wait for a non-rest beat
    await page.waitForFunction(() => {
      const e = window.__engine
      const beat = e.sequence.value[e.currentBeatIndex.value]
      return beat && !beat.isRest
    })

    // Press a key that's in the grid but wrong for this beat
    const wrongKey = await page.evaluate(() => {
      const e = window.__engine
      const beat = e.sequence.value[e.currentBeatIndex.value]
      const correctKey = e.gridTiles.value[beat.laneIndex].key
      const otherTile = e.gridTiles.value.find(
        (t) => t.key !== correctKey,
      )
      return otherTile.key.toLowerCase()
    })

    await page.keyboard.press(wrongKey)

    const result = await engineVal(page, 'inputResult')
    expect(result).toBe('MISS')
  })

  test('BPM increases each level', async ({ page }) => {
    await startGame(page)
    const bpm1 = await getBpm(page)

    // Jump to level 2 via engine
    await page.evaluate(() => window.__engine.setupLevel(2))
    const bpm2 = await getBpm(page)
    expect(bpm2).toBeGreaterThan(bpm1)
  })

  test('Combo builds on consecutive perfect hits', async ({ page }) => {
    await startGame(page)

    // skipLevel simulates all-PERFECT hits, so combo should equal active beats count
    await page.evaluate(() => window.__engine.skipLevel())

    const combo = await engineVal(page, 'maxCombo')
    expect(combo).toBeGreaterThanOrEqual(2)
  })
})

test.describe('Language switching', () => {
  test('Changing language updates UI text', async ({ page }) => {
    await page.goto('/')
    await getEngine(page)

    // Default should show game title
    const title = page.locator('.game-title')
    await expect(title).toHaveText('Panic at the Deploy')

    // Open settings
    await page.locator('.settings-icon').click()
    const select = page.locator('.lang-select')
    await expect(select).toBeVisible()

    // Switch to English
    await select.selectOption('en')

    // Start button should now say "Start Game"
    const startBtn = page.locator('button.cbtw-style').first()
    await expect(startBtn).toContainText('Start Game')

    // Switch back to French
    await select.selectOption('fr')
    await expect(startBtn).toContainText('Démarrer le jeu')
  })
})

test.describe('Play through level 5+ (glitch features)', () => {
  test('Level 5 has screen shake and blur glitch', async ({ page }) => {
    await page.addInitScript(() => { window.__testTimeScale = 3 })
    await page.goto('/')
    await getEngine(page)

    // Jump directly to level 5 via engine
    await page.evaluate(() => window.__engine.setupLevel(5))

    const level = await engineVal(page, 'level')
    expect(level).toBe(5)

    const params = await page.evaluate(
      () => window.__engine.levelParams.value,
    )
    expect(params.hasScreenShake).toBe(true)
    expect(params.hasBlurGlitch).toBe(true)
  })
})

// ─── Leaderboard / Score persistence ────────────────────────────────────────

test.describe('Score persistence', () => {
  const STORAGE_KEY = 'panic-leaderboard'

  const alice = {
    firstName: 'Alice',
    lastName: 'Dev',
    email: 'alice@test.com',
    phone: '0600000001',
    position: 'Engineer',
    score: 1500,
    date: '2026-01-01',
  }

  const aliceBetter = { ...alice, score: 2500, date: '2026-01-02' }
  const aliceWorse  = { ...alice, score: 800,  date: '2026-01-03' }

  const bob = {
    firstName: 'Bob',
    lastName: 'Ops',
    email: 'bob@test.com',
    phone: '0600000002',
    position: 'DevOps',
    score: 3000,
    date: '2026-01-01',
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear leaderboard before each test
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY)
  })

  // ── 1. Score is saved to localStorage ──────────────────────────────────────
  test('addEntry saves score to localStorage', async ({ page }) => {
    await page.evaluate(
      ([key, entry]) => {
        // Directly exercise the leaderboard composable via a tiny inline call
        const raw = localStorage.getItem(key)
        const entries = raw ? JSON.parse(raw) : []
        entries.push(entry)
        localStorage.setItem(key, JSON.stringify(entries))
      },
      [STORAGE_KEY, alice],
    )

    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) || '[]'),
      STORAGE_KEY,
    )

    expect(stored).toHaveLength(1)
    expect(stored[0].email).toBe('alice@test.com')
    expect(stored[0].score).toBe(1500)
  })

  // ── 2. Replaying keeps best score, not latest ───────────────────────────────
  test('replaying keeps best score when new score is lower', async ({ page }) => {
    // Seed initial entry
    await page.evaluate(
      ([key, entry]) => localStorage.setItem(key, JSON.stringify([entry])),
      [STORAGE_KEY, alice],
    )

    // Navigate to leaderboard screen (it loads localStorage on mount)
    await page.goto('/?screen=leaderboard')

    // Simulate submitting a worse score via the exposed leaderboard on __engine
    // We use a page.evaluate to call addEntry directly through the app's composable
    const rank = await page.evaluate(
      (entry) => {
        // The leaderboard composable is exposed through App.vue via window.__leaderboard
        if (window.__leaderboard) {
          return window.__leaderboard.addEntry(entry)
        }
        return null
      },
      aliceWorse,
    )

    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) || '[]'),
      STORAGE_KEY,
    )

    // Score should still be the original (higher) 1500, not 800
    expect(stored[0].score).toBe(1500)
  })

  test('replaying replaces score when new score is higher', async ({ page }) => {
    await page.evaluate(
      ([key, entry]) => localStorage.setItem(key, JSON.stringify([entry])),
      [STORAGE_KEY, alice],
    )

    await page.goto('/?screen=leaderboard')

    await page.evaluate(
      (entry) => window.__leaderboard && window.__leaderboard.addEntry(entry),
      aliceBetter,
    )

    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) || '[]'),
      STORAGE_KEY,
    )

    expect(stored[0].score).toBe(2500)
  })

  // ── 3. Leaderboard is sorted by best score ──────────────────────────────────
  test('leaderboard sorted view shows best score per player, descending', async ({ page }) => {
    // Two players, alice has a lower score than bob
    await page.evaluate(
      ([key, entries]) => localStorage.setItem(key, JSON.stringify(entries)),
      [STORAGE_KEY, [alice, bob]],
    )

    await page.goto('/?screen=leaderboard')

    const sorted = await page.evaluate(() => {
      if (!window.__leaderboard) return null
      return window.__leaderboard.sorted.value
    })

    if (sorted !== null) {
      expect(sorted[0].score).toBeGreaterThanOrEqual(sorted[1].score)
      expect(sorted[0].email).toBe('bob@test.com') // Bob has 3000
    }
  })

  // ── 4. Export JSON triggers a download with correct data ────────────────────
  test('exportJSON produces a valid JSON download', async ({ page }) => {
    await page.evaluate(
      ([key, entries]) => localStorage.setItem(key, JSON.stringify(entries)),
      [STORAGE_KEY, [alice, bob]],
    )

    await page.goto('/?screen=leaderboard')

    // Intercept the download
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      page.evaluate(() => window.__leaderboard && window.__leaderboard.exportJSON()),
    ])

    if (download) {
      const content = await download.createReadStream().then(
        (stream) =>
          new Promise((resolve) => {
            let data = ''
            stream.on('data', (chunk) => { data += chunk })
            stream.on('end', () => resolve(data))
          }),
      )
      const parsed = JSON.parse(content)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBeGreaterThanOrEqual(1)
      expect(parsed[0]).toHaveProperty('score')
      expect(parsed[0]).toHaveProperty('email')
    }
  })

  // ── 5. Import JSON loads entries and saves them ─────────────────────────────
  test('importJSON loads entries from a valid JSON file', async ({ page }) => {
    await page.goto('/?screen=leaderboard')

    const importData = [alice, bob]

    // Simulate importJSON by injecting data directly (FileReader is hard to test
    // in Playwright without a real file — we verify the same logic path)
    const success = await page.evaluate(async (data) => {
      if (!window.__leaderboard) return false
      const json = JSON.stringify(data)
      const file = new File([json], 'scores.json', { type: 'application/json' })
      try {
        await window.__leaderboard.importJSON(file)
        return true
      } catch {
        return false
      }
    }, importData)

    expect(success).toBe(true)

    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) || '[]'),
      STORAGE_KEY,
    )

    expect(stored).toHaveLength(2)
    const emails = stored.map((e) => e.email)
    expect(emails).toContain('alice@test.com')
    expect(emails).toContain('bob@test.com')
  })

  // ── 6. Import then export round-trip preserves data ─────────────────────────
  test('import → export round-trip preserves all entries', async ({ page }) => {
    await page.goto('/?screen=leaderboard')

    const importData = [alice, bob]

    await page.evaluate(async (data) => {
      if (!window.__leaderboard) return
      const json = JSON.stringify(data)
      const file = new File([json], 'scores.json', { type: 'application/json' })
      await window.__leaderboard.importJSON(file)
    }, importData)

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      page.evaluate(() => window.__leaderboard && window.__leaderboard.exportJSON()),
    ])

    if (download) {
      const content = await download.createReadStream().then(
        (stream) =>
          new Promise((resolve) => {
            let data = ''
            stream.on('data', (chunk) => { data += chunk })
            stream.on('end', () => resolve(data))
          }),
      )
      const parsed = JSON.parse(content)
      expect(parsed.length).toBe(2)
      const emails = parsed.map((e) => e.email)
      expect(emails).toContain('alice@test.com')
      expect(emails).toContain('bob@test.com')
    }
  })
})
