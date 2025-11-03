<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    title: {
      type: String,
      default: 'Search here'
    }
  },
  setup() {
    //
  }
})
</script>

<template>
  <input
    type="text"
    :placeholder="title"
    class="rounded-sm border border-primary px-4 py-2 w-full focus:outline-none"
  />
</template>
