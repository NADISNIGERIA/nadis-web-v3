<script lang="ts">
import { computed, defineComponent, ref, toRefs, watch } from 'vue'
import { useOutbreak } from '../../stores/outbreak'
import useMonths from './../../composables/months'
import { utils, writeFile } from 'xlsx'

export default defineComponent({
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

      const values = {
        category: sort,
        state: selected_state.value,
        in_progress: progress
      }
      useOutbreak().getOutbreak(values)
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
          const document_id = outbreak.value[index].doc_id
          if (action.value == 'in_progress_' + index) {
            useOutbreak().in_progress(document_id)
          } else if (action.value == 'approve_' + index) {
            useOutbreak().approve(document_id)
          } else if (action.value == 'pending_' + index) {
            useOutbreak().pending(document_id)
          } else if (action.value == 'decline_' + index) {
            // declineForm(document_id)
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
    const exportTableToExcel = () => {
      // Acquire Data (reference to the HTML table)
      var table_elt = document.getElementById('faooutbreak_to_excel')

      // Extract Data (create a workbook object from the table)
      var workbook = utils.table_to_book(table_elt)

      // Process Data (add a new row)
      var ws = workbook.Sheets['Sheet1']
      utils.sheet_add_aoa(ws, [], { origin: -1 })

      // Package and Release Data (`writeFile` tries to write and save an XLSB file)
      writeFile(workbook, selected_category.value + '_Faooutbreak_report_' + Date.now() + '.xlsx')
    }
    const findState = (document_id: any) => {
      const found_reporter = reporter_state.value.find(
        (reporter: any) => reporter.doc_id === document_id
      )
      if (found_reporter != undefined) {
        return found_reporter.state_lga
      } else {
        return { state: 'null', local_govt: 'null' }
      }
    }

    return { outbreak, getDate, findState, fixLocation }
  }
})
</script>

<template>
  <div>
    <div class="w-full overflow-x-auto">
      <table class="w-3000 mb-10" id="faooutbreak_to_excel">
        <tr class="grid mt-8 mb-1 text-cool-gray-500 text-sm grid-cols-41">
          <th
            class="col-span-1 bg-card-8 rounded-tl-md border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            S/N
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Created Date
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Report State / LGA
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Disease Suspected
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Other Diseases
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Outbreak Number
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
        </tr>
        <tr
          class="grid text-cool-gray-500 w-3000 text-sm grid-cols-41"
          v-for="(result, index) in outbreak"
          :key="index"
        >
          <td
            class="col-span-1 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ index + 1 }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.date ? (result.date.occurred ? getDate(result.date.occurred) : '') : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
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
            {{ result.other_diseases }}
          </td>

          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.outbreak_num }}
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
        </tr>
      </table>
    </div>
  </div>
</template>

<style scoped>
.w-3000 {
  width: 3000px;
}
.w-4000 {
  width: 4000px;
}
</style>
