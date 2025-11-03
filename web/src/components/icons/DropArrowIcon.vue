<template>
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    class="fill-current inline-block"
    :class="[width, height, color]"
  >
    <path class="a" d="M0,0H24V24H0Z" />
    <path class="b" d="m7 10 5 5 5-5z" />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    width: {
      type: String,
      default: 'w-5'
    },
    height: {
      type: String,
      default: 'h-5'
    },
    color: {
      type: String,
      default: 'text-card-4'
    }
  },
  setup() {
    //
  }
})
</script>

<style scoped>
.a {
  fill: none;
}
.b {
  fill: #149a40;
}
</style>
