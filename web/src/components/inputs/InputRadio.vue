<script lang="ts">
import { defineComponent, onMounted, ref, toRefs } from 'vue'

export default defineComponent({
  props: {
    selected_value: {
      default: false,
      type: Boolean
    }
  },
  setup(props, ctx) {
    const { selected_value: selected_value } = toRefs(props)
    const selected = ref(false)

    const selectAction = () => {
      selected.value = !selected.value
      ctx.emit('selected-value', selected.value)
    }

    onMounted(() => {
      selected.value = selected_value.value
    })

    return { selected, selectAction }
  }
})
</script>

<template>
  <div class="h-6">
    <div @click="selectAction" class="w-6 h-6 rounded-full border border-gray-700 inline-block">
      <div class="radio w-4 h-4 rounded-full" :class="{ 'bg-primary': selected }"></div>
    </div>
    <div class="px-4 absolute inline-block"><slot></slot></div>
  </div>
</template>

<style>
.radio {
  margin-left: 3px;
  margin-top: 3px;
}
</style>
