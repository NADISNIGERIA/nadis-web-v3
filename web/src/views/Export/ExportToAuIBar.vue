<script lang="ts">
import { useHome } from './../../stores/home'
import { useMiddleware } from './../../stores/middleware'
import { computed, defineComponent, onMounted, ref } from 'vue'
import router from './../../router'
import OutbreakView from '../../components/Tables/OutbreakView.vue'
import VaccinationView from '../../components/Tables/VaccinationView.vue'
import PagesTop from '../../components/PagesTop.vue'
import ExportIcon from '../../components/icons/ExportIcon.vue'

export default defineComponent({
  components: { OutbreakView, VaccinationView, PagesTop, ExportIcon },
  props: {
    full: Boolean
  },
  setup(props, ctx) {
    const active_menu = ref(6)
    const outbreak = ref(true)
    const vaccination = ref(false)
    const export_to_excel = ref(1)
    const selected_category = ref('Approved')
    const selected_state = ref('All States')

    const role = computed(() => useMiddleware().role)

    const toggleReport = (outbreak_val: any, vaccination_val: any) => {
      outbreak.value = outbreak_val
      vaccination.value = vaccination_val
    }
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

    return {
      outbreak,
      vaccination,
      selected_category,
      selected_state,
      export_to_excel,
      toggleReport,
      exportToExcel
    }
  }
})
</script>

<template>
  <div class="text-left">
    <pages-top :title="'Export to AU IBAR'"></pages-top>
    <div class="pt-7 px-5 w-full flex justify-between items-center">
      <div>
        <div
          id="outbreak"
          @click="toggleReport(true, false)"
          class="px-4 py-3 text-xl mr-2 inline-block cursor-pointer rounded mb-3"
          :class="{
            'bg-primary hover:bg-primary-2 text-white': outbreak,
            'text-gray-400 hover:border-gray-300 border border-white': !outbreak
          }"
        >
          Outbreak
        </div>
        <div
          id="vaccination"
          @click="toggleReport(false, true)"
          class="px-4 py-3 text-xl mr-2 inline-block cursor-pointer rounded mb-3"
          :class="{
            'bg-primary hover:bg-primary-2 text-white': vaccination,
            'text-gray-400 hover:border-gray-300 border border-white': !vaccination
          }"
        >
          Vaccination
        </div>
      </div>
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
    <div class="px-6 pb-10">
      <outbreak-view
        v-if="outbreak"
        :selected_category="selected_category"
        :selected_state="selected_state"
        :full="full"
        :export_to_excel="export_to_excel"
      ></outbreak-view>
      <vaccination-view
        v-if="vaccination"
        :selected_category="selected_category"
        :selected_state="selected_state"
        :full="full"
        :export_to_excel="export_to_excel"
      ></vaccination-view>
    </div>
  </div>
</template>
