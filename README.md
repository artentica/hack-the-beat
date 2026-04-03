# Hack the Beat 🎮

Jeu de rythme visuel — Vue 3 + Vite.

## Lancer en développement

```bash
npm install
npm run dev
```

## Build production (fichier unique)

```bash
npm run build
# → dist/index.html autonome, ouvrable directement dans un navigateur
```

## Stack

- **Vue 3** (Composition API)
- **Vite** + **vite-plugin-singlefile** → build en un seul `index.html`
- **SCSS** scopé par composant
