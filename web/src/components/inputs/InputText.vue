<!-- <script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps({
  modelValue: String
})

defineEmits(['update:modelValue'])

const input = ref(null) as any

onMounted(() => {
  if (input.value.hasAttribute('autofocus')) {
    input.value.focus()
  }
})

defineExpose({ focus: () => input.value.focus() })
</script> -->

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
  <input
    class="border-b border-nadis-ash2 w-full px-2 py-3 font-medium bg-nadis-bg2 focus:outline-none"
    ref="input"
    :value="modelValue"
    @input="emitValues"
  />
</template>
