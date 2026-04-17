<template>
  <div v-if="entries.length > 0" class="podium-container">
    <!-- 2e place (gauche) -->
    <div class="podium-place place-2" :class="{ empty: !entries[1] }">
      <template v-if="entries[1]">
        <span class="podium-rank">🥈</span>
        <span class="podium-name">{{ entries[1].firstName }}</span>
        <span class="podium-score">{{ entries[1].score }}</span>
      </template>
    </div>
    <!-- 1re place (centre) -->
    <div class="podium-place place-1" :class="{ empty: !entries[0] }">
      <template v-if="entries[0]">
        <span class="podium-rank">🥇</span>
        <span class="podium-name">{{ entries[0].firstName }}</span>
        <span class="podium-score">{{ entries[0].score }}</span>
      </template>
    </div>
    <!-- 3e place (droite) -->
    <div class="podium-place place-3" :class="{ empty: !entries[2] }">
      <template v-if="entries[2]">
        <span class="podium-rank">🥉</span>
        <span class="podium-name">{{ entries[2].firstName }}</span>
        <span class="podium-score">{{ entries[2].score }}</span>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({
  entries: { type: Array, default: () => [] },
});
</script>

<style lang="scss" scoped>
.podium-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  gap: 4px;
}

.podium-place {
  flex: 1;
  max-width: 110px;
  padding: 8px 6px;
  border-radius: 8px 8px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  overflow: hidden;

  &.place-1 {
    background: var(--gold-color, #ffd700);
    height: 160px;
    order: 2;
  }
  &.place-2 {
    background: var(--silver-color, #c0c0c0);
    height: 120px;
    order: 1;
  }
  &.place-3 {
    background: var(--bronze-color, #cd7f32);
    height: 90px;
    order: 3;
  }
  &.empty {
    background: var(--surface-color);
  }
}

.podium-rank {
  font-size: 1.4em;
  line-height: 1.8;
}
.podium-name {
  font-size: 0.72em;
  font-weight: 600;
  text-align: center;
  word-break: break-word;
  margin: 2px 0;
  color: var(--brand-dark, #1c1c1c);
}
.podium-score {
  font-size: 0.68em;
  color: var(--brand-dark, #1c1c1c);
  opacity: 0.75;
}
</style>
