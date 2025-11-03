<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
    //
  }
})
</script>

<template>
  <div
    class="bg-primary hover:bg-primary-2 w-full cursor-pointer inline-block text-center px-2 py-3 font-medium rounded text-white focus:outline-none"
  >
    <slot></slot>
  </div>
</template>
