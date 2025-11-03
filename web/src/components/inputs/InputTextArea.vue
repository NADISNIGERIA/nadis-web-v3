<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  props: {
    modelValue: String
  },
  setup(props, ctx) {
    const input = ref(null) as any

    const emitValues = (e: any) => {
      ctx.emit('update:modelValue', e.target?.value)
    }

    onMounted(() => {
      if (input.value.hasAttribute('autofocus')) {
        input.value.focus()
      }
      ctx.expose({ focus: () => input.value.focus() })
    })

    return { emitValues, input }
  }
})
</script>

<template>
  <textarea
    cols="30"
    rows="5"
    class="border-b border-nadis-ash2 w-full p-3 font-medium bg-nadis-bg2 focus:outline-none"
    ref="input"
    :value="modelValue"
    @input="emitValues"
  ></textarea>
</template>
