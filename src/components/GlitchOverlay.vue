<template>
  <div
    class="glitch-overlay"
    :class="{ shaking: screenShake, inverted: colorInvert }"
  ></div>
</template>

<script setup>
defineProps({
  screenShake: { type: Boolean, default: false },
  colorInvert: { type: Boolean, default: false },
});
</script>

<style lang="scss" scoped>
.glitch-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;

  &.shaking {
    animation: screenShake 0.3s ease;
  }

  &.inverted {
    background: transparent;
    mix-blend-mode: difference;
    backdrop-filter: invert(1);
  }
}

@keyframes screenShake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-3px);
  }
  40% {
    transform: translateX(3px);
  }
  60% {
    transform: translateX(-2px);
  }
  80% {
    transform: translateX(2px);
  }
}
</style>
