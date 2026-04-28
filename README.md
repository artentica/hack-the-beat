# Hack the Beat 🎮

> **Jouer maintenant →** [https://artentica.github.io/hack-the-beat/](https://artentica.github.io/hack-the-beat/)

Jeu de rythme/réflexe façon Guitar Hero pour développeurs. Appuie sur la bonne touche au bon moment pour scorer — chaque tuile représente un logo tech (Vue, React, Python, Docker…).

## Gameplay

- **8 tuiles** tirées aléatoirement parmi 14 technos (Angular, Bootstrap, C++, Docker, GitHub, HTML5, Java, Kotlin, Node.js, Python, React, Swift, TypeScript, Vue.js)
- **Niveaux progressifs** : le BPM augmente à chaque palier
- **Précision** : PERFECT (±50 ms), GOOD (±100 ms), OK (±150 ms), MISS
- **Combo** : enchaîne les hits parfaits pour multiplier ton score
- **Rock Meter** : jauge de vie qui baisse à chaque miss — à zéro, game over
- **Mécaniques spéciales** : pièges (ne pas appuyer), chiffrement César, decoy beats, effets glitch (shake, inversion, blur)

## Fonctionnalités

- 🏆 Leaderboard global avec podium (top 3)
- 🌍 Bilingue français / anglais
- 💾 Export/import JSON des scores
- 📱 Interface responsive
- 🔒 Collecte RGPD-conforme pour la soumission de score

## Stack technique

| Couche      | Techno                        |
| ----------- | ----------------------------- |
| Framework   | Vue 3 (Composition API)       |
| Build       | Vite + vite-plugin-singlefile |
| Styles      | SCSS scopé par composant      |
| Tests       | Playwright                    |
| Déploiement | GitHub Pages (workflow auto)  |

## Développement

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
# → dist/index.html autonome, ouvrable directement dans un navigateur
```

## Tests

```bash
npm test            # Playwright headless
npm run test:ui     # Playwright UI mode
```

## Licence

MIT
