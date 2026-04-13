<template>
  <div class="start-screen">
    <h1 class="game-title">{{ t("gameTitle") }}</h1>
    <p class="game-subtitle">{{ t("gameSubtitle") }}</p>

    <div class="rules-preview">
      <div class="rule-card">
        <span class="rule-icon">⌨️</span>
        <p v-html="t('ruleType')"></p>
      </div>
      <div class="rule-card">
        <span class="rule-icon">⚡</span>
        <p>{{ t("ruleSpeed") }}</p>
      </div>
      <div class="rule-card">
        <span class="rule-icon">🏆</span>
        <p v-html="t('ruleCombo')"></p>
      </div>
    </div>

    <div class="start-buttons">
      <button @click="$emit('start')" class="button cbtw-style">
        {{ t("startGame") }}
      </button>
      <button @click="$emit('viewScores')" class="button secondary">
        {{ t("viewScores") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "../i18n/index.js";

defineEmits(["start", "viewScores"]);

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.start-screen {
  text-align: center;
  padding: 40px 20px;
  width: 100%;
}

.game-title {
  font-size: 2.8em;
  font-weight: 800;
  color: var(--main-font-color);
  margin-bottom: 8px;
  letter-spacing: -0.02em;
  background: linear-gradient(
    135deg,
    var(--main-font-color),
    var(--accent-color)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.game-subtitle {
  font-size: 1.1em;
  color: var(--secondary-font-color, #757575);
  margin-bottom: 32px;
}

.rules-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  margin: 0 auto 32px;
}

.rule-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface-color);
  border: 1px solid var(--surface-border, transparent);
  border-radius: 12px;
  padding: 14px 18px;
  text-align: left;
  backdrop-filter: blur(4px);
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--accent-color);
  }

  p {
    margin: 0;
    font-size: 0.92em;
    line-height: 1.4;
    color: var(--secondary-font-color, #666);
  }
}

.rule-icon {
  font-size: 1.6em;
  flex-shrink: 0;
}

.start-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
</style>
