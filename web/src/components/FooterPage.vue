<script lang="ts">
import { defineComponent } from 'vue'
import VetsarkLogo from './icons/VetsarkLogo.vue'

export default defineComponent({
  components: { VetsarkLogo },
    setup() {
        //
    },
})
</script>

<template>
    <div class="text-center w-full">
      powered by
      <a
        href="https://vetsark.com"
        target="_blank"
        class="text-primary cursor-pointer"
      >
        <vetsark-logo :width="'w-20'" :height="'h-5'"></vetsark-logo>
      </a>
    </div>
  </template>