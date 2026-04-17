<template>
  <div class="left-panel">
    <!-- Logo CBTW -->
    <div class="left-logo">
      <svg
        viewBox="0 0 220 60"
        xmlns="http://www.w3.org/2000/svg"
        class="cbtw-wordmark"
      >
        <rect
          x="0"
          y="10"
          width="40"
          height="40"
          rx="6"
          fill="var(--accent-color)"
        />
        <text
          x="20"
          y="38"
          text-anchor="middle"
          font-family="var(--font-family)"
          font-weight="800"
          font-size="22"
          fill="var(--brand-dark)"
        >
          CB
        </text>
        <text
          x="80"
          y="42"
          font-family="var(--font-family)"
          font-weight="700"
          font-size="28"
          fill="var(--brand-dark)"
        >
          TW
        </text>
        <text
          x="55"
          y="58"
          font-family="var(--font-family)"
          font-size="9"
          fill="var(--secondary-font-color)"
          letter-spacing="1"
        >
          Collaboration Betters The World
        </text>
      </svg>
    </div>

    <!-- Règles du jeu -->
    <div class="rules-section">
      <h3>{{ t("rulesTitle") }}</h3>
      <div
        v-for="(rule, i) in rules"
        :key="i"
        class="rule-item"
        :class="{ active: activeRule === i + 1 }"
      >
        <span class="rule-num">{{ i + 1 }}</span>
        <p v-html="rule"></p>
      </div>
    </div>

    <!-- Podium top 3 -->
    <div class="podium-wrapper">
      <Podium :entries="podium" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "../i18n/index.js";
import Podium from "./Podium.vue";

const { t } = useI18n();

const props = defineProps({
  /** Index (1-based) de la règle à mettre en avant, 0 = aucune */
  activeRule: { type: Number, default: 0 },
  /** Top-3 entries [{ firstName, score }, ...] */
  podium: { type: Array, default: () => [] },
});

const rules = computed(() => [
  t("ruleType"),
  t("ruleSpeed"),
  t("ruleCombo"),
  t("rulesTrap"),
  t("rulesCesar"),
]);
</script>

<style lang="scss" scoped>
.left-panel {
  width: 33%;
  min-width: 260px;
  padding: 25px 20px;
  box-sizing: border-box;
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.left-logo {
  margin-bottom: 28px;
  display: flex;
  justify-content: center;
}

.cbtw-wordmark {
  width: 180px;
  height: auto;
}

.rules-section {
  h3 {
    font-size: 1.1em;
    font-weight: 700;
    color: var(--main-font-color);
    margin-bottom: 14px;
    padding: 8px 12px;
    background: var(--accent-color);
    border-radius: 8px;
    display: inline-block;
  }
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--surface-color);
  border: 1px solid var(--surface-border);
  padding: 10px 14px;
  margin-bottom: 8px;
  border-radius: 8px;
  transition:
    background-color 0.3s,
    border-color 0.3s;
  font-size: 0.88em;
  line-height: 1.45;
  color: var(--secondary-font-color);

  p {
    margin: 0;
    color: inherit;
  }

  &.active {
    background: rgba(245, 237, 99, 0.15);
    border-color: var(--accent-color);
    color: var(--main-font-color);
    font-weight: 500;
  }
}

.rule-num {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  background: var(--surface-border);
  border-radius: 50%;
  font-size: 0.75em;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary-font-color);

  .rule-item.active & {
    background: var(--accent-color);
    color: var(--brand-dark);
  }
}

.podium-wrapper {
  margin-top: auto;
  padding-top: 20px;
  height: 180px;
  display: flex;
  align-items: flex-end;
}

/* Responsive */
@media (max-width: 800px) {
  .left-panel {
    width: 100%;
    min-width: unset;
    border-right: none;
    border-bottom: 1px solid var(--surface-border);
  }
  .podium-wrapper {
    height: 150px;
    margin-bottom: 10px;
  }
}
</style>
