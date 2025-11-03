<script lang="ts">
import { useMiddleware } from './../stores/middleware'
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useHome } from '../stores/home'
import router from './../router'
import ApprovedOfficials from '../components/Officials/ApprovedOfficials.vue'
import PendingOfficials from '../components/Officials/PendingOfficials.vue'
import PagesTop from '../components/PagesTop.vue'

export default defineComponent({
  components: { ApprovedOfficials, PendingOfficials, PagesTop },
  props: {
    full: Boolean
  },
  setup(props, ctx) {
    const active_menu = ref(3)
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
    <pages-top :title="'Officials'" v-if="!pending"></pages-top>
    <pages-top :title="'Pending Officials'" v-if="pending"></pages-top>
    <div class="pt-7 text-right text-xl">
      <div
        class="px-5 py-3 mr-10 bg-primary hover:bg-primary-2 text-white rounded-sm inline-block cursor-pointer"
        @click="pending = !pending"
      >
        <span v-if="!pending">Pending Officials</span>
        <span v-if="pending">Active Officials</span>
      </div>
    </div>
    <transition name="pages">
      <approved-officials v-if="!pending" :full="full"></approved-officials>
    </transition>
    <transition name="pages">
      <pending-officials v-if="pending" :full="full"></pending-officials>
    </transition>
  </div>
</template>
