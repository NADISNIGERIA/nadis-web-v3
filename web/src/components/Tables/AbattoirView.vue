<script lang="ts">
import { useAbattoir } from './../../stores/abattoir'
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import AbattoirDeclineForm from './DeclineForm/AbattoirDeclineForm.vue'
import BulkEditModal from '../BulkEditModal.vue'
import useMonths from './../../composables/months'
import { useToast } from './../../composables/toast'
import { useBulkEdit } from './../../composables/useBulkEdit'
import { utils, writeFile } from 'xlsx'

export default defineComponent({
  components: { AbattoirDeclineForm, BulkEditModal },
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

    const reporter_state = computed(() => useAbattoir().reporter_state)
    const abattoir = computed(() => useAbattoir().abattoir) as any
    const successful = computed(() => useAbattoir().successful)
    const loading = computed(() => useAbattoir().loading)
    const pagination = computed(() => useAbattoir().pagination)

    watch(selected_category, () => {
      getAbattoir()
    })
    watch(selected_state, () => {
      getAbattoir()
    })
    watch(successful, () => {
      getAbattoir()
    })
    watch(action, () => {
      performAction()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getAbattoir = () => {
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
      if (selected_state.value != undefined || selected_state.value !== '') {
        useAbattoir().getAbattoir(values)
      }
    }

    const loadNextPage = () => {
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
      
      if (pagination.value.hasMore && !loading.value) {
        useAbattoir().loadNextPage(values)
      }
    }
    const getDate = (val: any) => {
      const month = new Date(val).getMonth()
      const day = new Date(val).getDate()
      const year = new Date(val).getFullYear()
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
        let index = action.value.match(/\d+/)[0]
        if (index >= 0) {
          const document_id = abattoir.value[index].doc_id
          if (action.value == 'in_progress_' + index) {
            useAbattoir().in_progress(document_id)
          } else if (action.value == 'approve_' + index) {
            useAbattoir().approve(document_id)
          } else if (action.value == 'pending_' + index) {
            useAbattoir().pending(document_id)
          } else if (action.value == 'decline_' + index) {
            declineForm(document_id)
          }
        }
        action.value = ''
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
        const exportData = await useAbattoir().exportAbattoir(filters)
        
        if (exportData.length === 0) {
          warning('No abattoir reports found matching your selected filters. Try adjusting your date range or filters.')
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
        let baseFilename = `${selected_category.value || 'All'}_Abattoir_Reports`
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
          // For PDF, we'll create a simple HTML table and use window.print
          // This is a basic implementation - for production, consider using jsPDF or similar
          const htmlContent = `
            <html>
              <head>
                <title>Abattoir Reports</title>
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
                  <h2>Abattoir Reports - ${selected_category.value || 'All'}</h2>
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
          utils.book_append_sheet(workbook, worksheet, 'Abattoir Reports')
          writeFile(workbook, `${baseFilename}.xlsx`)
        }
        
        success(`Successfully exported ${exportData.length} abattoir reports to ${format === 'csv' ? 'CSV' : format === 'pdf' ? 'PDF' : 'Excel'}.`)
      } catch (exportError) {
        console.error('Error exporting abattoir data:', exportError)
        error('Failed to export abattoir reports. Please try again or contact support if the issue persists.')
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

    // Bulk edit - using composable (AFTER all function declarations)
    const {
      selectedReports,
      selectAll,
      showBulkEditModal,
      toggleReportSelection,
      toggleSelectAll,
      openBulkEditModal,
      closeBulkEditModal,
      handleBulkEditConfirm
    } = useBulkEdit(abattoir, useAbattoir(), getAbattoir)

    const handleBulkAction = (event: Event) => {
      const target = event.target as HTMLSelectElement
      const action = target.value
      if (action) {
        handleBulkEditConfirm(action)
        target.value = '' // Reset dropdown
      }
    }

    onMounted(() => {
      getAbattoir()
    })

    return {
      abattoir,
      action,
      decline_form,
      doc_id,
      getDate,
      findState,
      fixLocation,
      closeModal,
      loading,
      pagination,
      loadNextPage,
      // Bulk edit from composable
      selectedReports,
      selectAll,
      showBulkEditModal,
      toggleReportSelection,
      toggleSelectAll,
      openBulkEditModal,
      closeBulkEditModal,
      handleBulkEditConfirm,
      handleBulkAction
    }
  }
})
</script>

<template>
  <div>
    <div class="w-full overflow-x-auto">
      <table class="w-6000 mb-10" id="abattoir_to_excel">
        <tr class="grid mt-8 mb-1 text-cool-gray-500 text-sm grid-cols-78">
          <th class="col-span-2 bg-card-8 rounded-tl-md border-r border-cool-gray-200 px-3 py-3 shadow-md">
            <div class="flex flex-col items-center gap-1">
              <select
                v-if="selectedReports.size > 0"
                @change="handleBulkAction"
                class="text-xs px-2 py-1 bg-blue-600 text-white rounded cursor-pointer focus:outline-none"
              >
                <option value="">Actions ({{ selectedReports.size }})</option>
                <option value="pending">Set to Pending</option>
                <option value="in_progress">Set to In Progress</option>
                <option value="approved">Set to Approved</option>
              </select>
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
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Report State / LGA
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Disease Suspected
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Other Diseases
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Abattoir Name
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Address
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Holding Capacity
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location / Lat
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location / Lng
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Species
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Others species
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Source of Animals
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diseases Suspected
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Inspection /
            <span>Inspected</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Inspection /
            <span>Rejected</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Inspection /
            <span>Reason for Rejection</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Slaughtered per day
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Ante Mortem Inspection /
            <span> No. Inspected</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Ante Mortem Inspection /
            <span> Appearance</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Post Mortem Inspection /
            <span> Organs suspected</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Post Mortem Inspection /
            <span> Lesion seen</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Post Mortem Inspection /
            <span> No. of organs condemned</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Post Mortem Inspection /
            <span> Partially Condemned</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Post Mortem Inspection /
            <span> Totally Condemned</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Sample Information /
            <span> Collected</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Sample Information /
            <span> Date</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Sample Information /
            <span> Submitted</span>
          </th>

          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            By-Product
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Action
          </th>
        </tr>
        <tr
          class="grid text-cool-gray-500 w-6000 text-sm grid-cols-78"
          v-for="(result, index) in abattoir"
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
            {{ result.other_diseases }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.name_of_abattoir }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.address }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.holding_capacity }}
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
            {{ result.species_affected ? result.species_affected.species : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.species_affected ? result.species_affected.other_species : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.source_of_animal ? result.source_of_animal : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.disease_suspected ? result.disease_suspected : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.animal_inspection ? result.animal_inspection.inspected : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.animal_inspection ? result.animal_inspection.rejected : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.animal_inspection ? result.animal_inspection.reason_for_rejection : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.slaughter_figure ? result.slaughter_figure : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.anti_mortem ? result.anti_mortem.inspected : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.anti_mortem ? result.anti_mortem.appearance : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.post_mortem_inspection
                ? result.post_mortem_inspection.total_organs_suspected
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.post_mortem_inspection ? result.post_mortem_inspection.legion_seen : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.post_mortem_inspection ? result.post_mortem_inspection.number_suspected : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            <select class="w-full py-1 bg-card-8 border-gray-200 focus:outline-none">
              <option
                v-for="(organ, index) in result.post_mortem_inspection
                  ? result.post_mortem_inspection.selected_partially_condemned
                  : ''"
                :key="index"
              >
                {{ organ }}
              </option>
            </select>
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            <select class="w-full py-1 bg-card-8 border-gray-200 focus:outline-none">
              <option
                v-for="(organ, index) in result.post_mortem_inspection
                  ? result.post_mortem_inspection.selected_totally_condemned
                  : ''"
                :key="index"
              >
                {{ organ }}
              </option>
            </select>
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.sample_information ? result.sample_information.samples_collected : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.sample_information ? getDate(result.sample_information.date) : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.sample_information ? result.sample_information.number_of_sample_submitted : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.by_products ? result.by_products : '' }}
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

    <!-- Loading States and Pagination -->
    <div class="px-4 py-4">
      <!-- Loading Indicator -->
      <div v-if="loading" class="flex justify-center items-center py-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span class="ml-2 text-gray-600">Loading reports...</span>
      </div>

      <!-- Pagination Controls -->
      <div v-if="!loading && abattoir.length > 0" class="flex justify-between items-center py-4">
        <div class="text-sm text-gray-600">
          Showing {{ abattoir.length }} reports
          <span v-if="pagination.hasMore">(Page {{ pagination.currentPage }})</span>
        </div>
        
        <!-- Load More Button -->
        <button
          v-if="pagination.hasMore"
          @click="loadNextPage"
          :disabled="loading"
          class="bg-primary hover:bg-primary-2 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors duration-200"
        >
          <span v-if="!loading">Load More</span>
          <span v-else>Loading...</span>
        </button>
        
        <div v-else class="text-sm text-gray-500">
          All reports loaded
        </div>
      </div>

      <!-- No Data Message -->
      <div v-if="!loading && abattoir.length === 0" class="text-center py-8">
        <div class="text-gray-500 text-lg">No reports found</div>
        <div class="text-gray-400 text-sm mt-2">
          Try adjusting your filters or check back later
        </div>
      </div>
    </div>

    <abattoir-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></abattoir-decline-form>

    <!-- Bulk Edit Modal -->
    <bulk-edit-modal
      v-if="showBulkEditModal"
      :selected-count="selectedReports.size"
      @close="closeBulkEditModal"
      @confirm="handleBulkEditConfirm"
    />
  </div>
</template>

<style scoped>
.w-2800 {
  width: 2800px;
}
.w-4800 {
  width: 4800px;
}
.w-5200 {
  width: 5200px;
}
.w-6000 {
  width: 6000px;
}
tr > th {
  @apply font-normal;
}
</style>
