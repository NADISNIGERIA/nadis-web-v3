<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    width: {
      type: String,
      default: 'w-4'
    },
    height: {
      type: String,
      default: 'h-4'
    },
    color: {
      type: String,
      default: 'text-nadis-black'
    }
  },
  setup() {
    //
  }
})
</script>

<template>
  <svg
    enable-background="new 0 0 213.333 213.333"
    version="1.1"
    viewBox="0 0 213.33 213.33"
    xml:space="preserve"
    class="inline fill-current"
    :class="[width, height, color]"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="0 53.333 106.67 160 213.33 53.333" />
  </svg>
</template>
