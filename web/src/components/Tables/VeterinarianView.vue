<script lang="ts">
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import useMonths from './../../composables/months'
import { useVeterinarian } from './../../stores/veterinarian'
import VeterinarianDeclineForm from './DeclineForm/VeterinarianDeclineForm.vue'
import { utils, writeFile } from 'xlsx'

export default defineComponent({
  components: { VeterinarianDeclineForm },
  props: {
    export_to_excel: Number,
    selected_category: String,
    selected_state: String,
    full: Boolean
  },
  setup(props) {
    const {
      export_to_excel: export_to_excel,
      selected_category: selected_category,
      selected_state: selected_state
    } = toRefs(props)
    const months = ref(useMonths().months)
    const action = ref('') as any
    const doc_id = ref('')
    const decline_form = ref(false)

    const reporter_state = computed(() => useVeterinarian().reporter_state)
    const veterinarian = computed(() => useVeterinarian().veterinarian) as any
    const successful = computed(() => useVeterinarian().successful)

    watch(selected_category, () => {
      getVeterinarian()
    })
    watch(selected_state, () => {
      getVeterinarian()
    })
    watch(successful, () => {
      getVeterinarian()
    })
    watch(action, () => {
      performAction()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getVeterinarian = () => {
      let sort = false
      let progress = false
      if (selected_category.value == 'Approved') {
        sort = true
        progress = false
      } else if (selected_category.value == 'Pending') {
        sort = false
        progress = false
      } else if (selected_category.value == 'In Progress') {
        sort = false
        progress = true
      }

      var values = {
        category: sort,
        state: selected_state.value,
        in_progress: progress
      }
      useVeterinarian().getVeterinarian(values)
    }
    const getDate = (val: any) => {
      if (!val) return 'Invalid Date'
      const month = new Date(val).getMonth()
      const day = new Date(val).getDate()
      const year = new Date(val).getFullYear()
      
      // Safety check for months array
      if (!months.value || !months.value[month]) {
        return 'Invalid Date'
      }
      
      return months.value[month].short + ' ' + day + ', ' + year
    }
    const fixLocation = (val: any) => {
      if (val !== undefined) {
        return val.toFixed(6)
      } else {
        return 'Unable to get location.'
      }
    }
    const performAction = () => {
      if (action.value != '') {
        var index = action.value.match(/\d+/)[0]
        if (index >= 0) {
          const document_id = veterinarian.value[index].doc_id
          if (action.value == 'in_progress_' + index) {
            useVeterinarian().in_progress(document_id)
          } else if (action.value == 'approve_' + index) {
            useVeterinarian().approve(document_id)
          } else if (action.value == 'pending_' + index) {
            useVeterinarian().pending(document_id)
          } else if (action.value == 'decline_' + index) {
            declineForm(document_id)
          }
        }
        action.value = ''
      }
    }
    const declineForm = (doc_id: any) => {
      decline_form.value = true
      doc_id.value = doc_id
    }
    const closeModal = () => {
      decline_form.value = false
    }
    const exportTableToExcel = () => {
      // Acquire Data (reference to the HTML table)
      var table_elt = document.getElementById('Veterinarian_to_excel')

      // Extract Data (create a workbook object from the table)
      var workbook = utils.table_to_book(table_elt)

      // Process Data (add a new row)
      var ws = workbook.Sheets['Sheet1']
      utils.sheet_add_aoa(ws, [], { origin: -1 })

      // Package and Release Data (`writeFile` tries to write and save an XLSB file)
      writeFile(workbook, selected_category.value + '_Veterinarian_report_' + Date.now() + '.xlsx')
    }
    const findState = (id: string) => {
      const found_reporter = reporter_state.value.find((reporter: any) => reporter.doc_id === id)
      if (found_reporter != undefined) {
        return found_reporter.state_lga
      } else {
        return { state: 'null', local_govt: 'null' }
      }
    }

    onMounted(() => {
      getVeterinarian()
    })

    return {
      veterinarian,
      decline_form,
      action,
      doc_id,
      closeModal,
      getDate,
      findState,
      fixLocation
    }
  }
})
</script>

<template>
  <div>
    <div class="w-full overflow-x-auto">
      <table class="w-2600 mb-10" id="Veterinarian_to_excel">
        <tr class="grid mt-8 mb-1 text-cool-gray-500 text-sm grid-cols-35">
          <th
            class="col-span-1 bg-card-8 rounded-tl-md border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            S/N
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Created Date
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Report State / LGA
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Name of Clinic / Hospital
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Type of Report
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Latitude</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Longitude</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Disease Suspected
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Other Diseases
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Type of Animal
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Age
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Sex
          </th>
          <th class="col-span-4 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Address of Affected Farm
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diagnosis
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Measures
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Action
          </th>
        </tr>
        <tr
          class="grid text-cool-gray-500 w-2600 text-sm grid-cols-35"
          v-for="(result, index) in veterinarian"
          :key="index"
        >
          <td
            class="col-span-1 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ index + 1 }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.date ? getDate(result.date) : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ findState(result.doc_id).state + ' / ' + findState(result.doc_id).local_govt }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.name_of_hospital }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.type_of_report ? result.type_of_report : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.location ? (result.location.lat ? fixLocation(result.location.lat) : '') : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.location ? (result.location.lng ? fixLocation(result.location.lng) : '') : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.disease ? result.disease : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.other_diseases ? result.other_diseases : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.species ? result.species : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.age ? result.age : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.sex ? result.sex : '' }}
          </td>
          <td
            class="col-span-4 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.address_affected_farm ? result.address_affected_farm : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.diagnosis ? result.diagnosis : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.measures ? result.measures : '' }}
          </td>
          <td class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 px-3 py-3">
            <select class="px-2 py-1 text-sm bg-card-8 focus:outline-none" v-model="action">
              <option value="">-- Select Action --</option>
              <option :value="'in_progress_' + index" v-if="result.finished">In Progress</option>
              <option :value="'approve_' + index" v-if="!result.approved">Approve</option>
              <option :value="'pending_' + index" v-if="result.approved">Pending</option>
              <option :value="'decline_' + index" v-if="result.finished">Decline</option>
            </select>
          </td>
        </tr>
      </table>
    </div>
    <veterinarian-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal()"
    ></veterinarian-decline-form>
  </div>
</template>

<style scoped>
.w-2400 {
  width: 2400px;
}
.w-2600 {
  width: 2600px;
}
</style>
