# Booth Staff Guide — Hack the Beat

This guide explains how to manage player scores during the event:
retrieve data, save it, transfer it between machines and display the winners —
**no technical knowledge required**.

---

## Table of contents

1. [Display the top 3 winners](#1-display-the-top-3-winners)
2. [Export scores](#2-export-scores)
3. [Import scores](#3-import-scores)
4. [Transfer scores between two machines](#4-transfer-scores-between-two-machines)
5. [FAQ](#5-faq)

---

## 1. Display the top 3 winners

The fastest way to see who the best players are **without downloading anything**.
You just need to open the browser console.

### Step by step

**1.** Open the game in the browser (Google Chrome or Firefox recommended).

**2.** Press the **F12** key on the keyboard.
> A dark panel opens at the bottom or side of the screen — this is the developer console.

**3.** Click the **Console** tab at the top of that panel.
> The tab is labelled "Console" in both Chrome and Firefox.
> If you don't see it, look for a `»` arrow to reveal hidden tabs.

**4.** Click inside the text area at the bottom (where you see a `>`), type:

```
podium()
```

then press **Enter**.

**5.** The results appear immediately:

```
🏆 TOP 3 — Hack the Beat
  🥇 #1 — Marie Dupont
      📧 Email     : marie.dupont@company.com
      📞 Phone     : 0612345678
      💼 Position  : Backend Developer
      🎮 Score     : 4200
      📅 Date      : 2026-06-03
  🥈 #2 — John Martin
      ...
  🥉 #3 — Sophie Bernard
      ...
```

> **Tip:** click on each winner's name in the console to expand or collapse their details.

---

## 2. Export scores

Exporting lets you **download a file** containing all recorded scores.
Useful for making a backup or transferring data to another machine.

### Step by step

**1.** Open the game and navigate to the **leaderboard**
(the "View scores" button after a game, or from the home screen).

**2.** At the bottom of the leaderboard, click the **"Export"** button (download icon).

**3.** A file is automatically saved to your Downloads folder:

```
hack-scores-2026-06-03.json
```

**4.** This file can be opened with any text editor (Notepad, TextEdit…)
or shared via email or USB drive.

> ⚠️ **Important:** do not rename the file or edit its contents,
> otherwise it may not be imported correctly.

---

## 3. Import scores

Importing lets you **load a previously exported score file**.
Useful for resuming a session on a new machine or restoring a backup.

### Step by step

**1.** Open the game and navigate to the **leaderboard**.

**2.** Click the **"Import"** button (folder icon).

**3.** A file picker window opens.
Select the `.json` file exported earlier (e.g. `hack-scores-2026-06-03.json`).

**4.** Click **Open**.

**5.** The leaderboard updates immediately with the imported scores.

> ℹ️ If a player already exists in the current scores **and** their imported score
> is lower, **their best score is kept**. No data is ever lost during an import.

---

## 4. Transfer scores between two machines

Typical scenario: two game stations are running in parallel during the event.
At the end of the day, you want to **consolidate all scores onto one machine**.

### Recommended procedure

```
Machine A  ──export──►  USB drive  ──import──►  Machine B
```

**1.** On **Machine A**: export the scores (see section 2).
Copy the `.json` file onto a USB drive.

**2.** On **Machine B**: import the file from the USB drive (see section 3).

**3.** Both machines' scores are now merged on Machine B.
For any player present on both machines, **the best score is kept automatically**.

**4.** *(Optional)* Re-export from Machine B to have a single unified backup file.

> ✅ You can repeat this process as many times as needed throughout the event.

---

## 5. FAQ

**F12 does not open the console — what should I do?**
> On some machines, try **Ctrl + Shift + J** (Windows / Linux)
> or **Cmd + Option + J** (Mac).
> In Chrome you can also right-click anywhere on the page
> → **Inspect** → **Console** tab.

---

**`podium()` returns nothing — why?**
> No player has saved their score yet. A score is only recorded after a game,
> when the player fills in the form and clicks **Save**.

---

**The exported file is empty or contains `[]` — why?**
> This means no scores are stored on this machine.
> Check that players have completed the form at the end of their game.

---

**Can scores be lost during an import?**
> No. Import merges data: if a player already exists, only the **best** of the
> two scores is kept. An import never overwrites a higher score with a lower one.

---

**Are scores saved if the browser is closed?**
> Yes. Scores are stored locally in the browser (localStorage).
> They persist after closing the tab, restarting the browser or reloading the page.
> However, they are tied to the specific browser and machine — which is why
> export/import is recommended for long-term backups or multi-machine setups.

---

*Internal guide — CBTW · Hack the Beat*
