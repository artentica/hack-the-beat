<template>
  <div class="leaderboard-screen">
    <h2>{{ t("leaderboardTitle") }}</h2>

    <p v-if="scores.length === 0" class="empty">{{ t("noScores") }}</p>

    <table v-else class="scores-table">
      <thead>
        <tr>
          <th>#</th>
          <th>{{ t("firstName") }}</th>
          <th>{{ t("lastName") }}</th>
          <th>{{ t("score") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(s, i) in scores"
          :key="s.email + s.score"
          :class="rankClass(i)"
        >
          <td>{{ i + 1 }}</td>
          <td>{{ s.firstName }}</td>
          <td>{{ s.lastName }}</td>
          <td>{{ s.score }}</td>
        </tr>
      </tbody>
    </table>

    <a class="privacy-link" @click="$emit('showPrivacy')"
      >Politique de confidentialité</a
    >

    <div class="actions">
      <button @click="$emit('home')" class="button cbtw-style">
        {{ t("home") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "../i18n/index.js";

const { t } = useI18n();

defineProps({
  scores: { type: Array, default: () => [] },
});

defineEmits(["home", "showPrivacy"]);

function rankClass(index) {
  if (index === 0) return "rank-1";
  if (index === 1) return "rank-2";
  if (index === 2) return "rank-3";
  return "";
}
</script>

<style lang="scss" scoped>
.leaderboard-screen {
  width: 100%;
  padding: 24px 20px;
  text-align: center;
}

.empty {
  color: var(--secondary-font-color, #757575);
  margin: 32px 0;
}

.scores-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  background: var(--surface-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

.scores-table th,
.scores-table td {
  border-bottom: 1px solid var(--surface-border, #eee);
  padding: 12px 15px;
  text-align: left;
  font-size: 0.9em;
}

.scores-table th {
  background: rgba(255, 255, 255, 0.04);
  text-transform: uppercase;
  font-size: 0.8em;
  letter-spacing: 0.5px;
  font-weight: 500;
  border-bottom-width: 2px;
  border-bottom-color: var(--surface-border);
  color: var(--secondary-font-color);
}

.scores-table tr:last-child td {
  border-bottom: none;
}

.scores-table tr:hover:not(thead tr) {
  background: rgba(255, 255, 255, 0.04);
}

.rank-1 {
  background: rgba(255, 215, 0, 0.12);
  font-weight: 700;
}
.rank-2 {
  background: rgba(192, 192, 192, 0.1);
  font-weight: 600;
}
.rank-3 {
  background: rgba(205, 127, 50, 0.1);
  font-weight: 600;
}

.privacy-link {
  font-size: 0.85em;
  text-decoration: underline;
  cursor: pointer;
  display: block;
  margin: 16px auto;
  color: var(--main-font-color);
}

.actions {
  margin-top: 16px;
}
</style>
