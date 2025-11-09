<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import ApprovedView from '../components/Agents/ApprovedView.vue'
import PendingView from '../components/Agents/PendingView.vue'
import PagesTop from '../components/PagesTop.vue'
import DropArrowIcon from '../components/icons/DropArrowIcon.vue'
import { useHome } from '../stores/home'
import { useMiddleware } from '../stores/middleware'
import router from './../router'

export default defineComponent({
  components: { ApprovedView, PendingView, PagesTop, DropArrowIcon },
  props: {
    full: Boolean
  },
  setup(props, ctx) {
    const active_menu = ref(4)
    const selected_category = ref('Approved')
    const show_category = ref(false)
    const role = computed(() => useMiddleware().role)

    const selectCategory = (val: string) => {
      selected_category.value = val
      show_category.value = false
    }

    onMounted(() => {
      ctx.emit('active-menu', active_menu.value)
      useHome().hasAccess()
      if (role.value != 'Federal') {
        router.push({
          name: 'Home'
        })
      }
    })

    return { 
      selected_category,
      show_category,
      selectCategory
    }
  }
})
</script>

<template>
  <div class="text-left">
    <pages-top :title="selected_category + ' Agents'"></pages-top>
    <div class="pt-7 px-6">
      <div class="flex justify-end">
        <div
          class="p-2 sm:p-3 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-gray-200 hover:border-green-300 rounded inline-block cursor-pointer shadow-sm transition-colors duration-200 w-auto min-w-[120px] sm:min-w-[140px]"
        >
          <div
            class="text-gray-800 font-medium text-center sm:text-left"
            :class="{ 'pb-2': show_category }"
            @click="show_category = !show_category"
          >
            {{ selected_category }}
            <div class="inline-block pl-1 sm:pl-2">
              <drop-arrow-icon></drop-arrow-icon>
            </div>
          </div>
          <div class="relative">
            <div
              v-if="show_category"
              class="pt-2 absolute w-32 sm:w-36 bg-white border border-gray-200 -ml-3 sm:-ml-4 rounded rounded-t-none shadow-xl z-10 right-0 sm:right-auto"
            >
              <div class="text-gray-800 hover:bg-green-50 px-3 sm:px-4 py-2 sm:py-3 transition-colors duration-150 cursor-pointer flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm" @click="selectCategory('Approved')">
                <div class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                <span>Approved</span>
              </div>
              <div class="text-gray-800 hover:bg-green-50 px-3 sm:px-4 py-2 sm:py-3 transition-colors duration-150 cursor-pointer flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm" @click="selectCategory('Pending')">
                <div class="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></div>
                <span>Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="clear-both">
      <transition name="pages">
        <approved-view v-if="selected_category === 'Approved'" :full="full"></approved-view>
      </transition>
      <transition name="pages">
        <pending-view v-if="selected_category === 'Pending'" :full="full"></pending-view>
      </transition>
    </div>
  </div>
</template>
