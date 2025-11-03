<script lang="ts">
import { useOutbreak } from './../../stores/outbreak'
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import OutbreakDeclineForm from './DeclineForm/OutbreakDeclineForm.vue'
import useMonths from './../../composables/months'
import { utils, writeFile } from 'xlsx'

export default defineComponent({
  components: { OutbreakDeclineForm },
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
    const value = ref([]) as any
    const doc_id = ref('')
    const decline_form = ref(false)

    const reporter_state = computed(() => useOutbreak().reporter_state)
    const outbreak = computed(() => useOutbreak().outbreak) as any
    const successful = computed(() => useOutbreak().successful)

    watch(selected_category, () => {
      getOutbreak()
    })
    watch(selected_state, () => {
      getOutbreak()
    })
    watch(successful, () => {
      getOutbreak()
    })
    watch(action, () => {
      performAction()
    })
    watch(outbreak, () => {
      outbreak_count()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getOutbreak = () => {
      let sort = 1
      let progress = false
      if (selected_category.value == 'Approved') {
        sort = 1
        progress = false
      } else if (selected_category.value == 'Pending') {
        sort = 0
        progress = false
      } else if (selected_category.value == 'In Progress') {
        sort = 0
        progress = true
      }

      const values = {
        category: sort,
        state: selected_state.value,
        in_progress: progress
      }
      useOutbreak().getOutbreak(values)
    }
    const getDate = (val: any) => {
      if (!val) return 'Invalid Date'
      var month = new Date(val).getMonth()
      var day = new Date(val).getDate()
      var year = new Date(val).getFullYear()
      
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
          const document_id = outbreak.value[index].doc_id
          if (action.value == 'in_progress_' + index) {
            useOutbreak().in_progress(document_id)
          } else if (action.value == 'approve_' + index) {
            useOutbreak().approve(document_id)
          } else if (action.value == 'pending_' + index) {
            useOutbreak().pending(document_id)
          } else if (action.value == 'decline_' + index) {
            declineForm(document_id)
          }
        }
        action.value = ''
      }
    }
    const outbreak_count = () => {
      value.value = []
      const count = outbreak.value.length
      for (let val = 0; val < count; val++) {
        value.value.push(0)
      }
    }
    const declineForm = (id: string) => {
      decline_form.value = true
      doc_id.value = id
    }
    const exportTableToExcel = () => {
      // Acquire Data (reference to the HTML table)
      var table_elt = document.getElementById('outbreak_to_excel')

      // Extract Data (create a workbook object from the table)
      var workbook = utils.table_to_book(table_elt)

      // Process Data (add a new row)
      var ws = workbook.Sheets['Sheet1']
      utils.sheet_add_aoa(ws, [], { origin: -1 })

      // Package and Release Data (`writeFile` tries to write and save an XLSB file)
      writeFile(workbook, selected_category.value + '_Outbreak_report_' + Date.now() + '.xlsx')
    }
    const closeModal = () => {
      decline_form.value = false
    }
    const findState = (doc_id: any) => {
      const found_reporter = reporter_state.value.find(
        (reporter: any) => reporter.doc_id === doc_id
      )
      if (found_reporter != undefined) {
        return found_reporter.state_lga
      } else {
        return { state: 'null', local_govt: 'null' }
      }
    }

    onMounted(() => {
      getOutbreak()
      outbreak_count()
    })

    return { outbreak, action, doc_id, decline_form, getDate, findState, fixLocation, closeModal }
  }
})
</script>

<template>
  <div>
    <div class="w-full overflow-x-auto">
      <table class="w-6500 mb-10" id="outbreak_to_excel">
        <tr class="grid mt-8 mb-1 text-cool-gray-500 text-sm grid-cols-102">
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
            Disease Suspected
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Outbreak Type
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Outbreak Number
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Other Diseases
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Is it a cluster?
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Total Cluster
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Dates /
            <span>Occurred</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Dates /
            <span>Reported</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Dates /
            <span>Investigated</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Dates /
            <span>Final Diagnosis</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Locality (Facility) /
            <span>Type</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Locality (Facility) /
            <span>Name</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Lat</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Lng</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Animals Affected /
            <span>Species Name</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Animals Affected /
            <span>Species Type</span>
          </th>

          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Age Group in weeks
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Sex
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Production System
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Control Means
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Basis for Diagnosis
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Number of Animals /
            <span>Susceptible</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Number of Animals /
            <span>Cases</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Number of Animals /
            <span>Deaths</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Number of Animals /
            <span>Slaughter</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Number of Animals /
            <span>Recovered</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Number of Animals /
            <span>Destroyed</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Outbreak Stopped
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Vaccination /
            <span>Vaccination Type</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Vaccination /
            <span>vaccination Number</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Vaccination /
            <span>Source</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Vaccination /
            <span>Batch Number</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Vaccination /
            <span>Expiry Date</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Vaccination /
            <span>Was Vaccinated</span>
          </th>
          <th
            class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md text-center"
          >
            Action
          </th>
        </tr>
        <tr
          class="grid text-cool-gray-500 w-6500 text-sm grid-cols-102"
          v-for="(result, index) in outbreak"
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
            {{ getDate(result.created_at) }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ findState(result.doc_id).state + ' / ' + findState(result.doc_id).local_govt }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.disease_name }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.outbreak_type }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.outbreak_num }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.other_diseases }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.cluster_type }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.cluster }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.date ? (result.date.occurred ? getDate(result.date.occurred) : '') : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.date ? (result.date.reported ? getDate(result.date.reported) : '') : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.date ? (result.date.investigated ? getDate(result.date.investigated) : '') : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.date
                ? result.date.final_diagnosis
                  ? getDate(result.date.final_diagnosis)
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.localty ? result.localty.facility_type : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.localty ? result.localty.facility_name : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.location ? fixLocation(result.location.lat) : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.location ? fixLocation(result.location.lng) : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.species ? (result.species.species_name ? result.species.species_name : '') : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.species ? (result.species.species_type ? result.species.species_type : '') : ''
            }}
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
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.production_system ? result.production_system : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            <select class="w-full py-1 bg-card-8 border-gray-200 focus:outline-none">
              <option
                v-for="(control, index) in result.control_means ? result.control_means : ''"
                :key="index"
              >
                {{ control.name }}
              </option>
            </select>
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.basis_for_diagnosis ? result.basis_for_diagnosis : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.number_of_animals
                ? result.number_of_animals.total_animals
                  ? result.number_of_animals.total_animals
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.number_of_animals
                ? result.number_of_animals.cases
                  ? result.number_of_animals.cases
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.number_of_animals
                ? result.number_of_animals.deaths
                  ? result.number_of_animals.deaths
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.number_of_animals
                ? result.number_of_animals.slaughter
                  ? result.number_of_animals.slaughter
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.number_of_animals
                ? result.number_of_animals.recovered
                  ? result.number_of_animals.recovered
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.number_of_animals
                ? result.number_of_animals.destroyed
                  ? result.number_of_animals.destroyed
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.was_outbreak_stopped ? result.was_outbreak_stopped : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.vaccination != undefined
                ? result.vaccination.vaccination_type
                  ? result.vaccination.vaccination_type
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.vaccination != undefined
                ? result.vaccination.vaccination_number
                  ? result.vaccination.vaccination_number
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.vaccination != undefined
                ? result.vaccination.source
                  ? result.vaccination.source
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.vaccination != undefined
                ? result.vaccination.batch_no
                  ? result.vaccination.batch_no
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.vaccination
                ? result.vaccination.expiry_date
                  ? getDate(result.vaccination.expiry_date)
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.vaccination != undefined
                ? result.vaccination.was_vaccinated
                  ? result.vaccination.was_vaccinated
                  : ''
                : ''
            }}
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
    <outbreak-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></outbreak-decline-form>
  </div>
</template>

<style scoped>
.w-6500 {
  width: 6500px;
}
.w-4000 {
  width: 4000px;
}
</style>
