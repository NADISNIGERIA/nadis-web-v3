<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import ApprovedView from '../components/Agents/ApprovedView.vue'
import PendingView from '../components/Agents/PendingView.vue'
import PagesTop from '../components/PagesTop.vue'
import { useHome } from '../stores/home'
import { useMiddleware } from '../stores/middleware'
import router from './../router'

export default defineComponent({
  components: { ApprovedView, PendingView, PagesTop },
  props: {
    full: Boolean
  },
  setup(props, ctx) {
    const active_menu = ref(4)
    const pending = ref(false)
    const role = computed(() => useMiddleware().role)

    onMounted(() => {
      ctx.emit('active-menu', active_menu.value)
      useHome().hasAccess()
      if (role.value != 'Federal') {
        router.push({
          name: 'Home'
        })
      }
    })

    return { pending }
  }
})
</script>

<template>
  <div class="text-left">
    <pages-top :title="'Agents'" v-if="!pending"></pages-top>
    <pages-top :title="'Pending Agents'" v-if="pending"></pages-top>
    <div class="pt-7 text-right text-xl">
      <div
        class="px-5 py-3 mr-10 bg-primary hover:bg-primary-2 text-white rounded-sm inline-block cursor-pointer"
        @click="pending = !pending"
      >
        <span v-if="!pending">Pending Agents</span>
        <span v-if="pending">Active Agents</span>
      </div>
    </div>
    <transition name="pages">
      <approved-view v-if="!pending" :full="full"></approved-view>
    </transition>
    <transition name="pages">
      <pending-view v-if="pending" :full="full"></pending-view>
    </transition>
  </div>
</template>
