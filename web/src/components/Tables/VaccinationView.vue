<script lang="ts">
import { useVaccination } from './../../stores/vaccination'
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import VaccinationDeclineForm from './DeclineForm/VaccinationDeclineForm.vue'
import useMonths from './../../composables/months'
import { useToast } from './../../composables/toast'
import { utils, writeFile } from 'xlsx'

export default defineComponent({
  components: { VaccinationDeclineForm },
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
    const { success, error, warning } = useToast()

    const reporter_state = computed(() => useVaccination().reporter_state)
    const vaccination = computed(() => useVaccination().vaccination) as any
    const successful = computed(() => useVaccination().successful)

    watch(selected_category, () => {
      getVaccination()
    })
    watch(selected_state, () => {
      getVaccination()
    })
    watch(successful, () => {
      getVaccination()
    })
    watch(action, () => {
      performAction()
    })
    watch(vaccination, () => {
      vaccination_count()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getVaccination = () => {
      let sort = true
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

      if (selected_state.value != undefined && selected_state.value != '') {
        const values = {
          category: sort,
          state: selected_state.value,
          in_progress: progress
        }
        useVaccination().getVaccination(values)
      }
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
          const document_id = vaccination.value[index].doc_id
          if (action.value == 'in_progress_' + index) {
            useVaccination().in_progress(document_id)
          } else if (action.value == 'approve_' + index) {
            useVaccination().approve(document_id)
          } else if (action.value == 'pending_' + index) {
            useVaccination().pending(document_id)
          } else if (action.value == 'decline_' + index) {
            declineForm(document_id)
          }
        }
        action.value = ''
      }
    }
    const vaccination_count = () => {
      value.value = []
      const count = vaccination.value.length
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
        const exportData = await useVaccination().exportVaccination(filters)
        
        if (exportData.length === 0) {
          warning('No vaccination reports found matching your selected filters. Try adjusting your date range or filters.')
          return
        }

        // Prepare headers
        const headers = [
          'Date Reported',
          'State',
          'LGA',
          'Species',
          'Vaccine Name',
          'Number Vaccinated',
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
            item.vaccine_name || 'N/A',
            item.no_vaccinated || 0,
            item.approved ? 'Approved' : (item.finished ? 'Pending' : 'In Progress'),
            item.reporter_name || 'N/A'
          ]
        })

        // Combine headers and data
        const worksheetData = [headers, ...rows]
        
        // Generate base filename
        let baseFilename = `${selected_category.value || 'All'}_Vaccination_Reports`
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
                <title>Vaccination Reports</title>
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
                  <h2>Vaccination Reports - ${selected_category.value || 'All'}</h2>
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
          utils.book_append_sheet(workbook, worksheet, 'Vaccination Reports')
          writeFile(workbook, `${baseFilename}.xlsx`)
        }
        
        success(`Successfully exported ${exportData.length} vaccination reports to ${format === 'csv' ? 'CSV' : format === 'pdf' ? 'PDF' : 'Excel'}.`)
      } catch (exportError) {
        console.error('Error exporting vaccination data:', exportError)
        error('Failed to export vaccination reports. Please try again or contact support if the issue persists.')
      }
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
      getVaccination()
    })

    return {
      action,
      decline_form,
      doc_id,
      vaccination,
      getDate,
      findState,
      fixLocation,
      closeModal
    }
  }
})
</script>

<template>
  <div>
    <div class="w-full overflow-x-auto">
      <table class="w-3000 mb-10" id="vaccination_to_excel">
        <tr class="grid mt-8 mb-1 text-cool-gray-500 text-sm grid-cols-50">
          <th
            class="col-span-1 bg-card-8 rounded-tl-md border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            S/N
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Created Date
          </th>
          <th class="col-span-4 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Report State / LGA
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Disease /
            <span>Disease Name</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Disease /
            <span>Vaccination Type</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Disease /
            <span>Vaccination number</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Other Diseases
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
            <span>Source</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Vaccination /
            <span>Animal Name</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Vaccination /
            <span>Animal Type</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Vaccination /
            <span>Vaccine Name</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Vaccination /
            <span>Vaccine Type</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Lat</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Lng</span>
          </th>
          <!-- <th
            class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            State
          </th>
          <th
            class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            Local Govt
          </th> -->
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Action
          </th>
        </tr>
        <tr
          class="grid text-cool-gray-500 w-3000 text-sm grid-cols-50"
          v-for="(result, index) in vaccination"
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
            {{ getDate(result.created_at) }}
          </td>
          <td
            class="col-span-4 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ findState(result.doc_id).state + ' / ' + findState(result.doc_id).local_govt }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.disease ? result.disease.disease_name : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.disease ? result.disease.vaccination_type : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.disease ? result.disease.vaccination_number : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.other_diseases ? result.other_diseases : '' }}
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
                ? result.vaccination.animal_name
                  ? result.vaccination.animal_name
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.vaccination != undefined
                ? result.vaccination.animal_type
                  ? result.vaccination.animal_type
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.vaccination != undefined
                ? result.vaccination.vaccine_name
                  ? result.vaccination.vaccine_name
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 col bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.vaccination != undefined
                ? result.vaccination.vaccine_type
                  ? result.vaccination.vaccine_type
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.location ? fixLocation(result.location.lat) : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.location ? fixLocation(result.location.lng) : '' }}
          </td>
          <!-- <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.vaccination ? result.state : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.vaccination ? result.local_govt : '' }}
          </td> -->
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
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
    <vaccination-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal()"
    ></vaccination-decline-form>
  </div>
</template>

<style scoped>
.w-1800 {
  width: 1800px;
}
.w-3000 {
  width: 3000px;
}
</style>
