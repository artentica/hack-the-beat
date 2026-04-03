<template>
  <div class="app-root">
    <h1>Hack the Beat 🎮</h1>
    <p class="subtitle">Jeu de rythme visuel — Vue 3 + Vite</p>
  </div>
</template>

<script setup></script>

<style lang="scss">
:root {
  --accent-color: #f5ed63;
  --accent-hover: #e8e05a;
  --accent-glow: rgba(245, 237, 99, 0.5);
  --brand-dark: #1c1c1c;

  --main-font-color: #e8e8e8;
  --secondary-font-color: #9e9e9e;
  --page-background-color: #0d0d0d;
  --app-background-color: #141418;
  --surface-color: rgba(255, 255, 255, 0.06);
  --surface-hover: rgba(255, 255, 255, 0.1);
  --surface-border: rgba(255, 255, 255, 0.08);
  --menu-border-color: rgba(255, 255, 255, 0.1);

  --success-color: #4caf50;
  --danger-color: #f44336;
  --warning-color: #ff6b35;

  --tile-bg: rgba(255, 255, 255, 0.04);
  --tile-border: rgba(255, 255, 255, 0.08);

  --font-family: "Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  background-color: var(--page-background-color);
  color: var(--main-font-color);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--app-background-color);
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.4);
  min-height: 100vh;
  position: relative;
  border-left: 1px solid var(--surface-border);
  border-right: 1px solid var(--surface-border);
}
</style>

<style lang="scss" scoped>
.app-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  gap: 1em;

  h1 {
    font-size: 3em;
    font-weight: 700;
    color: var(--accent-color);
  }

  .subtitle {
    color: var(--secondary-font-color);
    font-size: 1.1em;
  }
}
</style>
