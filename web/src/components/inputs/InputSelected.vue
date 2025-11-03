<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: ['value'],
  setup(props, ctx) {
    const emitInput = (e: any) => {
      ctx.emit('select', e.target.value)
    }

    return { emitInput }
  }
})
</script>

<template>
  <select
    class="border-b border-nadis-ash2 w-full px-2 py-3 font-medium bg-nadis-bg2 focus:outline-none"
    :value="value"
    @input="emitInput"
    ref="select"
  >
    <slot></slot>
  </select>
</template>
