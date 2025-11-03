<script lang="ts">
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import useMonths from './../../composables/months'
import { useLaboratory } from './../../stores/laboratory'
import LaboratoryDeclineForm from './DeclineForm/LaboratoryDeclineForm.vue'
import { useToast } from './../../composables/toast'
import { utils, writeFile } from 'xlsx'

export default defineComponent({
  components: { LaboratoryDeclineForm },
  props: {
    export_to_excel: [Boolean, Number],
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
    const { success, error, warning } = useToast()

    const reporter_state = computed(() => useLaboratory().reporter_state)
    const laboratory = computed(() => useLaboratory().laboratory) as any
    const successful = computed(() => useLaboratory().successful)

    watch(selected_category, () => {
      getLaboratory()
    })
    watch(selected_state, () => {
      getLaboratory()
    })
    watch(successful, () => {
      getLaboratory()
    })
    watch(action, () => {
      performAction()
    })
    watch(laboratory, () => {
      laboratory_count()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getLaboratory = () => {
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
      useLaboratory().getLaboratory(values)
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
    // const fixLocation = (val: any) => {
    //   if (val !== undefined) {
    //     return val.toFixed(6)
    //   } else {
    //     return 'Unable to get location.'
    //   }
    // }
    const performAction = () => {
      if (action.value != '') {
        var index = action.value.match(/\d+/)[0]
        if (index >= 0) {
          const document_id = laboratory.value[index].doc_id
          if (action.value == 'in_progress_' + index) {
            useLaboratory().in_progress(document_id)
          } else if (action.value == 'approve_' + index) {
            useLaboratory().approve(document_id)
          } else if (action.value == 'pending_' + index) {
            useLaboratory().pending(document_id)
          } else if (action.value == 'decline_' + index) {
            declineForm(document_id)
          }
        }
        action.value = ''
      }
    }
    const laboratory_count = () => {
      value.value = []
      const count = laboratory.value.length
      for (let val = 0; val < count; val++) {
        value.value.push(0)
      }
    }
    const declineForm = (id: any) => {
      decline_form.value = true
      doc_id.value = id
    }
    const closeModal = () => {
      decline_form.value = false
    }
    const exportTableToExcel = async () => {
      try {
        // Get export filters from global state (set by ReportsPage)
        const exportFilters = (window as any).exportFilters || {}
        
        // Prepare filters for the export method
        const filters = {
          category: selected_category.value === 'Approved',
          state: selected_state.value || 'All States',
          in_progress: selected_category.value === 'In Progress',
          startDate: exportFilters.startDate,
          endDate: exportFilters.endDate
        }

        // Fetch filtered data from store (no pagination limits)
        const exportData = await useLaboratory().exportLaboratory(filters)
        
        if (exportData.length === 0) {
          warning('No laboratory reports found matching your selected filters. Try adjusting your date range or filters.')
          return
        }

        // Prepare headers
        const headers = [
          'Date Reported',
          'State',
          'LGA',
          'Species',
          'Disease',
          'Number Affected',
          'Status',
          'Reporter'
        ]

        // Prepare data rows
        const rows = exportData.map((item: any) => {
          const reporterState = findState(item.doc_id)
          return [
            getDate(item.created_at),
            reporterState?.state || item.state || 'N/A',
            reporterState?.local_govt || 'N/A',
            item.species || 'N/A',
            item.disease_name || 'N/A',
            item.no_affected || 0,
            item.approved ? 'Approved' : (item.finished ? 'Pending' : 'In Progress'),
            item.reporter_name || 'N/A'
          ]
        })

        // Combine headers and data
        const worksheetData = [headers, ...rows]
        
        // Generate base filename
        let baseFilename = `${selected_category.value || 'All'}_Laboratory_Reports`
        if (exportFilters.startDate || exportFilters.endDate) {
          baseFilename += '_Filtered'
        }
        baseFilename += `_${Date.now()}`

        // Export based on selected format
        const format = exportFilters.format || 'excel'
        
        if (format === 'csv') {
          // Create CSV content
          const csvContent = worksheetData.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          ).join('\n')
          
          // Create and download CSV
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = `${baseFilename}.csv`
          link.click()
          URL.revokeObjectURL(link.href)
        } else if (format === 'pdf') {
          // Create HTML content for PDF printing
          const htmlContent = `
            <html>
              <head>
                <title>Laboratory Reports</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                  th { background-color: #f2f2f2; font-weight: bold; }
                  .header { margin-bottom: 20px; }
                  @media print { body { margin: 0; } }
                </style>
              </head>
              <body>
                <div class="header">
                  <h2>Laboratory Reports - ${selected_category.value || 'All'}</h2>
                  <p>Generated on: ${new Date().toLocaleString()}</p>
                  ${exportFilters.startDate || exportFilters.endDate ? 
                    `<p>Date Range: ${exportFilters.startDate || 'No start'} to ${exportFilters.endDate || 'No end'}</p>` : 
                    '<p>Date Range: All dates</p>'
                  }
                  <p>Total Records: ${exportData.length}</p>
                </div>
                <table>
                  ${worksheetData.map((row, index) => 
                    `<tr>${row.map(cell => 
                      index === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`
                    ).join('')}</tr>`
                  ).join('')}
                </table>
              </body>
            </html>
          `
          
          const printWindow = window.open('', '_blank')
          if (printWindow) {
            printWindow.document.write(htmlContent)
            printWindow.document.close()
            printWindow.print()
          }
        } else {
          // Default to Excel format
          const workbook = utils.book_new()
          const worksheet = utils.aoa_to_sheet(worksheetData)
          utils.book_append_sheet(workbook, worksheet, 'Laboratory Reports')
          writeFile(workbook, `${baseFilename}.xlsx`)
        }
        
        success(`Successfully exported ${exportData.length} laboratory reports to ${format === 'csv' ? 'CSV' : format === 'pdf' ? 'PDF' : 'Excel'}.`)
      } catch (exportError) {
        console.error('Error exporting laboratory data:', exportError)
        error('Failed to export laboratory reports. Please try again or contact support if the issue persists.')
      }
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
      getLaboratory()
    })

    return { laboratory, value, decline_form, action, doc_id, getDate, findState, closeModal }
  }
})
</script>

<template>
  <div>
    <div class="w-full overflow-x-auto">
      <table class="w-4000 mb-10" id="labtoraory_disease_to_excel">
        <tr class="grid mt-8 mb-1 text-cool-gray-500 text-sm grid-cols-40">
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
            Name of Disease
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Other Diseases
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Disease Suspicion code
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Dates /
            <span>Received</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Dates /
            <span>Result Released</span>
          </th>
          <!-- <th
            class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            Location /
            <span>State</span>
          </th>
          <th
            class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            Location /
            <span>LGA</span>
          </th> -->
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Epiemioogical Unit</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Farm Name</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Location Address</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diagnostic Test
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Samples
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Disease &amp; Result /
            <span>Name of Disease</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Disease &amp; Result /
            <span>Test Result</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Laboratory confirmation number
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            DVS Phone number
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Agent / Serotype
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Farmer's Phone Number
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Action
          </th>
        </tr>
        <tr
          class="grid text-cool-gray-500 w-3800 text-sm grid-cols-40"
          v-for="(result, index) in laboratory"
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
            {{ result.date ? result.disease : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.other_diseases ? result.other_diseases : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.sample_code ? result.sample_code : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.date ? getDate(result.date.date_received) : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.date ? getDate(result.date.date_released) : '' }}
          </td>
          <!-- <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.location ? result.location.state : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.location ? result.location.local_govt : '' }}
          </td> -->
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.location ? result.location.unit : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.location ? result.location.farm_name : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.location ? result.location.location_address : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.diagnostic_test ? result.diagnostic_test : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            <select class="w-full py-1 bg-card-8 border-gray-200 focus:outline-none">
              <option v-for="(sample, index) in result.samples ? result.samples : ''" :key="index">
                {{ sample }}
              </option>
            </select>
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            <select
              class="w-full py-1 bg-card-8 border-gray-200 focus:outline-none"
              v-model="value[index]"
            >
              <option
                v-for="(disease, number) in result.disease_and_result
                  ? result.disease_and_result.disease
                  : ''"
                :key="number"
                :value="number"
              >
                {{ disease }}
              </option>
            </select>
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            <select
              class="w-full py-1 bg-card-8 border-gray-200 focus:outline-none"
              v-model="value[index]"
            >
              <option
                v-for="(test, number) in result.disease_and_result
                  ? result.disease_and_result.test
                  : ''"
                :key="number"
                :value="number"
              >
                {{ test }}
              </option>
            </select>
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.laboratory_confirmation ? result.laboratory_confirmation : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.laboratory_dvs_number ? result.laboratory_dvs_number : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.agent_serotype ? result.agent_serotype : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.farmer_phone_number ? result.farmer_phone_number : '' }}
          </td>
          <td class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 px-3 py-3">
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
    <laboratory-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></laboratory-decline-form>
  </div>
</template>

<style scoped>
.w-3200 {
  width: 3200px;
}
.w-4000 {
  width: 4000px;
}
</style>
