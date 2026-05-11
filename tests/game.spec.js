// @ts-check
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

/** Get the full sequence for the current level */
function getSequence(page) {
  return page.evaluate(() =>
    window.__engine.sequence.value.map((b) => ({
      laneIndex: b.laneIndex,
      isRest: b.isRest,
    })),
  )
}

/** Get BPM */
function getBpm(page) {
  return page.evaluate(() => window.__engine.bpm.value)
}

/**
 * Play through the current level perfectly.
 * Reads the sequence and grid, then presses the right key at the center of each beat.
 */
async function playLevelPerfectly(page) {
  const keys = await getGridKeys(page)
  const seq = await getSequence(page)
  const bpmVal = await getBpm(page)
  const beatMs = 60000 / bpmVal

  for (const beat of seq) {
    if (beat.isRest) {
      // Wait the beat duration without pressing
      await page.waitForTimeout(beatMs)
      continue
    }

    // Wait until center of beat (PERFECT timing)
    await page.waitForTimeout(beatMs * 0.45)

    // Press the correct lane key
    const key = keys[beat.laneIndex]
    await page.keyboard.press(key.toLowerCase())

    // Wait the remaining beat time
    await page.waitForTimeout(beatMs * 0.55)
  }
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
    await waitForState(page, 'LEVEL_COMPLETE', 30000)

    const missCount = await engineVal(page, 'missCount')
    expect(missCount).toBe(0)

    const score = await engineVal(page, 'score')
    expect(score).toBeGreaterThan(0)
  })

  test('Level 1 → Level 2: next level button works', async ({ page }) => {
    await startGame(page)
    await playLevelPerfectly(page)
    await waitForState(page, 'LEVEL_COMPLETE', 30000)

    // Click next level
    const nextBtn = page.locator('button.cbtw-style').filter({ hasText: /next|suivant/i })
    await nextBtn.click()

    // Wait for countdown then playing
    await waitForState(page, 'PLAYING', 10000)
    const level = await engineVal(page, 'level')
    expect(level).toBe(2)
  })

  test('Play through 3 levels successfully', async ({ page }) => {
    test.setTimeout(120000)
    await startGame(page)

    for (let lvl = 1; lvl <= 3; lvl++) {
      const currentLevel = await engineVal(page, 'level')
      expect(currentLevel).toBe(lvl)

      await playLevelPerfectly(page)
      await waitForState(page, 'LEVEL_COMPLETE', 30000)

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
    await waitForState(page, 'LEVEL_COMPLETE', 30000)

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

    // Play a few beats perfectly, reading combo after each
    const keys = await getGridKeys(page)
    const seq = await getSequence(page)
    const bpmVal = await getBpm(page)
    const beatMs = 60000 / bpmVal

    let comboSeen = 0
    for (let i = 0; i < Math.min(seq.length, 12); i++) {
      const beat = seq[i]
      if (beat.isRest) {
        await page.waitForTimeout(beatMs)
        continue
      }

      await page.waitForTimeout(beatMs * 0.45)
      await page.keyboard.press(keys[beat.laneIndex].toLowerCase())

      const combo = await engineVal(page, 'combo')
      if (combo > comboSeen) comboSeen = combo

      await page.waitForTimeout(beatMs * 0.55)
    }

    expect(comboSeen).toBeGreaterThanOrEqual(2)
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
  test('Can reach level 5 with screen shake', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/')
    await getEngine(page)
    await startGame(page)

    // Jump directly to level 5 via engine
    await page.evaluate(() => window.__engine.setupLevel(5))

    // Now at level 5
    const level = await engineVal(page, 'level')
    expect(level).toBe(5)

    // Level params should have hasScreenShake and hasBlurGlitch
    const params = await page.evaluate(
      () => window.__engine.levelParams.value,
    )
    expect(params.hasScreenShake).toBe(true)
    expect(params.hasBlurGlitch).toBe(true)

    // Play level 5
    await playLevelPerfectly(page)
    await waitForState(page, 'LEVEL_COMPLETE', 30000)

    const score = await engineVal(page, 'score')
    expect(score).toBeGreaterThan(0)
  })
})
