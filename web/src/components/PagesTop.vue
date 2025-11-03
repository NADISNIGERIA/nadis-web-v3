<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    title: String
  },
  setup() {
    //
  }
})
</script>

<template>
  <div id="pagetop" class="px-6 pt-8 text-left">
    <p class="text-3xl">{{ title }}</p>
    <div class="w-full flex pt-6">
      <div class="border-b-4 border-primary w-1/12"></div>
      <div class="border-b-2 border-gray-200 w-11/12"></div>
    </div>
  </div>
</template>
