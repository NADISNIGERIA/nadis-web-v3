<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import ExportIcon from '../../components/icons/ExportIcon.vue'
import PagesTop from '../../components/PagesTop.vue'
import FaooutbreakView from '../../components/Tables/FaooutbreakView.vue'
import { useHome } from '../../stores/home'
import { useMiddleware } from '../../stores/middleware'
import router from './../../router'

export default defineComponent({
  components: { PagesTop, FaooutbreakView, ExportIcon },
  props: {
    full: Boolean
  },
  setup(props, ctx) {
    const active_menu = ref(6)
    const export_to_excel = ref(1)
    const selected_category = ref('Approved')
    const selected_state = ref('All States')

    const role = computed(() => useMiddleware().role)

    const exportToExcel = () => {
      export_to_excel.value++
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

    return { selected_category, selected_state, export_to_excel, exportToExcel }
  }
})
</script>

<template>
  <div class="text-left">
    <pages-top :title="'Export to FAO'"></pages-top>
    <div class="mx-8 my-4">
      <div class="float-right">
        <div
          class="p-3 text-sm sm:px-4 sm:py-3 bg-card-5 rounded inline-block cursor-pointer shadow-md"
          @click="exportToExcel()"
        >
          <a href="javascript:;" class="">Export</a>
          <div class="inline-block sm:pl-2 pl-1">
            <export-icon></export-icon>
          </div>
        </div>
      </div>
    </div>
    <div class="px-6 pb-10">
      <faooutbreak-view
        :selected_category="selected_category"
        :selected_state="selected_state"
        :full="full"
        :export_to_excel="export_to_excel"
      ></faooutbreak-view>
    </div>
  </div>
</template>
