<script lang="ts">
import { useSuspicion } from './../../stores/suspicion'
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import SuspicionDeclineForm from './DeclineForm/SuspicionDeclineForm.vue'
import BulkEditModal from './../BulkEditModal.vue'
import { useBulkEdit } from './../../composables/useBulkEdit'
import useMonths from './../../composables/months'
import { useToast } from './../../composables/toast'
import { utils, writeFile } from 'xlsx'

export default defineComponent({
  components: { SuspicionDeclineForm, BulkEditModal },
  props: {
    export_to_excel: Number,
    selected_category: String,
    selected_state: String,
    full: Boolean
  },
  setup(props) {
    const {
      selected_category: selected_category,
      selected_state: selected_state,
      export_to_excel: export_to_excel
    } = toRefs(props)
    const months = ref(useMonths().months)
    const action = ref('') as any
    const doc_id = ref('')
    const decline_form = ref(false)
    const { success, error, warning } = useToast()

    const reporter_state = computed(() => useSuspicion().reporter_state)
    const suspicion = computed(() => useSuspicion().suspicion) as any
    const successful = computed(() => useSuspicion().successful)

    watch(selected_category, () => {
      getSuspicion()
    })
    watch(selected_state, () => {
      getSuspicion()
    })
    watch(successful, () => {
      getSuspicion()
    })
    watch(action, () => {
      performAction()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getSuspicion = () => {
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
      useSuspicion().getSuspicion(values)
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
        const index = action.value.match(/\d+/)[0]
        if (index >= 0) {
          const document_id = suspicion.value[index].doc_id
          if (action.value == 'in_progress_' + index) {
            useSuspicion().in_progress(document_id)
          } else if (action.value == 'approve_' + index) {
            useSuspicion().approve(document_id)
          } else if (action.value == 'pending_' + index) {
            useSuspicion().pending(document_id)
          } else if (action.value == 'decline_' + index) {
            declineForm(document_id)
          }
        }
        action.value = ''
      }
    }
    const declineForm = (document_id: any) => {
      decline_form.value = true
      doc_id.value = document_id
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
        const exportData = await useSuspicion().exportSuspicion(filters)
        
        if (exportData.length === 0) {
          warning('No suspicion reports found matching your selected filters. Try adjusting your date range or filters.')
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
        let baseFilename = `${selected_category.value || 'All'}_Suspicion_Reports`
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
                <title>Suspicion Reports</title>
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
                  <h2>Suspicion Reports - ${selected_category.value || 'All'}</h2>
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
          utils.book_append_sheet(workbook, worksheet, 'Suspicion Reports')
          writeFile(workbook, `${baseFilename}.xlsx`)
        }
        
        success(`Successfully exported ${exportData.length} suspicion reports to ${format === 'csv' ? 'CSV' : format === 'pdf' ? 'PDF' : 'Excel'}.`)
      } catch (exportError) {
        console.error('Error exporting suspicion data:', exportError)
        error('Failed to export suspicion reports. Please try again or contact support if the issue persists.')
      }
    }
    const findState = (id: any) => {
      const found_reporter = reporter_state.value.find((reporter: any) => reporter.doc_id === id)
      if (found_reporter != undefined) {
        return found_reporter.state_lga
      } else {
        return { state: 'null', local_govt: 'null' }
      }
    }

    // Initialize bulk edit composable AFTER all function declarations
    const {
      selectedReports,
      selectAll,
      showBulkEditModal,
      toggleReportSelection,
      toggleSelectAll,
      openBulkEditModal,
      closeBulkEditModal,
      handleBulkEditConfirm
    } = useBulkEdit(suspicion, useSuspicion(), getSuspicion)

    onMounted(() => {
      getSuspicion()
    })

    return {
      suspicion,
      action,
      decline_form,
      doc_id,
      closeModal,
      getDate,
      findState,
      fixLocation,
      selectedReports,
      selectAll,
      showBulkEditModal,
      toggleReportSelection,
      toggleSelectAll,
      openBulkEditModal,
      closeBulkEditModal,
      handleBulkEditConfirm
    }
  }
})
</script>

<template>
  <div>
    <div class="mb-4">
      <button
        v-if="selectedReports.size > 0"
        @click="openBulkEditModal"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Bulk Edit Status ({{ selectedReports.size }} selected)
      </button>
    </div>
    <div class="w-full overflow-x-auto">
      <table class="w-6600 mb-10" id="disease_suspicion_to_excel">
        <tr class="grid mt-8 mb-1 text-cool-gray-500 text-sm grid-cols-78">
          <th class="col-span-2 bg-card-8 rounded-tl-md border-r border-cool-gray-200 px-3 py-3 shadow-md">
            <div class="flex flex-col items-center gap-1">
              <span class="text-xs font-semibold">Bulk Status Change</span>
              <input
                type="checkbox"
                :checked="selectAll"
                @change="toggleSelectAll"
                class="cursor-pointer"
              />
            </div>
          </th>
          <th
            class="col-span-1 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            S/N
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Created Date
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Report State / LGA
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Disease Suspected
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Other Diseases
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            laboratory Slip
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Survey Agent /
            <span>Agent Name</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Survey Agent /
            <span>Agent Phone Number</span>
          </th>
          <!-- <th
            class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            Region /
            <span>State</span>
          </th>
          <th
            class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            Region /
            <span>LGA</span>
          </th> -->
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Details /
            <span>Name of Location</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Details /
            <span>Address</span>
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
            Owner Details /
            <span>Name of Owner</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Owner Details /
            <span>Phone Number</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Purchase Details /
            <span>Date of Purchase</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Purchase Details /
            <span>Source os Animal</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Farm Practice
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Animal Movement from /
            <span>State</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Animal Movement from /
            <span>LGA</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Animal Movement from /
            <span>Location Name</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Animal Movement to /
            <span>State</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Animal Movement to /
            <span>LGA</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Animal Movement to /
            <span>Location Name</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Total Number of Animals /
            <span>Total Number of Animals</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Total Number of Animals /
            <span>Animal Affected</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Total Number of Animals /
            <span>Animal Dead</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Total Number of Animals /
            <span>Animal Destroyed</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Total Number of Animals /
            <span>Animal Recovered</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Total Number of Animals /
            <span>Animal Slaughted</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Animal Details /
            <span>Species</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Animal Details /
            <span>Sex</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Age Affected
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Clinical Signs
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Samples /
            <span>Sample ID</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Samples /
            <span>Sample Taken</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Control Measures
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Report Received
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Action
          </th>
        </tr>
        <tr
          class="grid text-cool-gray-500 w-6400 text-sm grid-cols-78"
          v-for="(result, index) in suspicion"
          :key="index"
        >
          <td class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 px-3 py-3 flex items-center justify-center">
            <input
              type="checkbox"
              :checked="selectedReports.has(result.doc_id)"
              @change="toggleReportSelection(result.doc_id)"
              class="cursor-pointer"
            />
          </td>
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
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ findState(result.doc_id).state + ' / ' + findState(result.doc_id).local_govt }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.disease_name }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.other_diseases ? result.other_diseases : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.other_diseases ? result.other_diseases : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.survey_agent != undefined
                ? result.survey_agent.name
                  ? result.survey_agent.name
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.survey_agent ? result.survey_agent.phone_number : '' }}
          </td>
          <!-- <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.state_lga ? result.state_lga.state : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.state_lga ? result.state_lga.local_govt : '' }}
          </td> -->
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.details ? result.details.location_details : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.details ? result.details.address_details : '' }}
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
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.owner_details ? result.owner_details.name_of_owner : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.owner_details ? result.owner_details.phone_number : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.purchase_details ? getDate(result.purchase_details.date_of_purchase) : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.purchase_details ? result.purchase_details.source_of_animals : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.farm_practices ? result.farm_practices.select_farming : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.farm_practices
                ? result.farm_practices.transhumance
                  ? result.farm_practices.transhumance.animal_movement_from.state
                  : 'null '
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.farm_practices
                ? result.farm_practices.transhumance
                  ? result.farm_practices.transhumance.animal_movement_from.local_govt
                  : 'null '
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.farm_practices
                ? result.farm_practices.transhumance
                  ? result.farm_practices.transhumance.animal_movement_from.name_of_location
                  : 'null '
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.farm_practices
                ? result.farm_practices.transhumance
                  ? result.farm_practices.transhumance.animal_movement_to.state
                  : 'null '
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.farm_practices
                ? result.farm_practices.transhumance
                  ? result.farm_practices.transhumance.animal_movement_to.local_govt
                  : 'null '
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.farm_practices
                ? result.farm_practices.transhumance
                  ? result.farm_practices.transhumance.animal_movement_to.name_of_location
                  : 'null '
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.number_of_animals ? result.number_of_animals.total_animals : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.number_of_animals ? result.number_of_animals.cases : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.number_of_animals ? result.number_of_animals.deaths : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.number_of_animals ? result.number_of_animals.destroyed : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.number_of_animals ? result.number_of_animals.recovered : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.number_of_animals ? result.number_of_animals.slaughter : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.animal_details ? result.animal_details.species : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.animal_details ? result.animal_details.sex : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.age ? result.age : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.clinical_signs ? result.clinical_signs : '' }}
          </td>
          <td class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 px-3 py-3">
            {{ result.samples ? result.samples.sample_id : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.samples ? result.samples.sample_taken : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.control_measures ? result.control_measures : '' }}
          </td>
          <td class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 px-3 py-3">
            {{ result.report_date ? getDate(result.report_date) : '' }}
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
    <suspicion-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></suspicion-decline-form>

    <bulk-edit-modal
      v-if="showBulkEditModal"
      :selected-count="selectedReports.size"
      @close="closeBulkEditModal"
      @confirm="handleBulkEditConfirm"
    ></bulk-edit-modal>
  </div>
</template>

<style scoped>
.w-5500 {
  width: 5500px;
}
.w-6000 {
  width: 6000px;
}
.w-6600 {
  width: 6600px;
}
</style>
