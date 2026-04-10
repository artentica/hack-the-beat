<template>
  <div class="tile-grid">
    <Tile
      v-for="tile in tiles"
      :key="tile.index"
      :tile="tile"
      :isActive="tile.index === activeTileIndex"
      :isDecoy="tile.index === activeTileIndex && isDecoy"
      :result="tile.index === activeTileIndex ? result : null"
      :progress="tile.index === activeTileIndex ? progress : 0"
      :cesarShift="tile.index === activeTileIndex ? cesarShift : 0"
      :blur="blur"
      :upcomingDistance="getUpcomingDistance(tile.index)"
    />
  </div>
</template>

<script setup>
import Tile from "./Tile.vue";

const props = defineProps({
  tiles: { type: Array, required: true },
  activeTileIndex: { type: Number, default: -1 },
  isDecoy: { type: Boolean, default: false },
  result: { type: String, default: null },
  progress: { type: Number, default: 0 },
  cesarShift: { type: Number, default: 0 },
  blur: { type: Boolean, default: false },
  upcomingBeats: { type: Array, default: () => [] },
});

function getUpcomingDistance(tileIndex) {
  const match = props.upcomingBeats.find((b) => b.tileIndex === tileIndex);
  return match ? match.distance : 0;
}
</script>

<style lang="scss" scoped>
.tile-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}
</style>
