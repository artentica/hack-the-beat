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
