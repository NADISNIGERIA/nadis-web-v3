<script lang="ts">
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import useMonths from './../../composables/months'
import { useAquaculture } from './../../stores/aquaculture'
import AquacultureDeclineForm from './DeclineForm/AquacultureDeclineForm.vue'
import BulkEditModal from './../BulkEditModal.vue'
import { useBulkEdit } from './../../composables/useBulkEdit'
import { useToast } from './../../composables/toast'
import { utils, writeFile } from 'xlsx'

export default defineComponent({
  components: { AquacultureDeclineForm, BulkEditModal },
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
    const { success, error, warning } = useToast()

    const reporter_state = computed(() => useAquaculture().reporter_state)
    const aquaculture = computed(() => useAquaculture().aquaculture) as any
    const successful = computed(() => useAquaculture().successful)

    watch(selected_category, () => {
      getAqauculture()
    })
    watch(selected_state, () => {
      getAqauculture()
    })
    watch(successful, () => {
      getAqauculture()
    })
    watch(action, () => {
      performAction()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getAqauculture = () => {
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
      useAquaculture().getAquaculture(values)
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
          const document_id = aquaculture.value[index].doc_id
          if (action.value == 'in_progress_' + index) {
            useAquaculture().in_progress(document_id)
          } else if (action.value == 'approve_' + index) {
            useAquaculture().approve(document_id)
          } else if (action.value == 'pending_' + index) {
            useAquaculture().pending(document_id)
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
        const exportData = await useAquaculture().exportAquaculture(filters)
        
        if (exportData.length === 0) {
          warning('No aquaculture reports found matching your selected filters. Try adjusting your date range or filters.')
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
          'Number Dead',
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
            item.no_dead || 0,
            item.approved ? 'Approved' : (item.finished ? 'Pending' : 'In Progress'),
            item.reporter_name || 'N/A'
          ]
        })

        // Combine headers and data
        const worksheetData = [headers, ...rows]
        
        // Generate base filename
        let baseFilename = `${selected_category.value || 'All'}_Aquaculture_Reports`
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
                <title>Aquaculture Reports</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
                  th { background-color: #f2f2f2; font-weight: bold; }
                  .header { margin-bottom: 20px; }
                  @media print { body { margin: 0; } }
                </style>
              </head>
              <body>
                <div class="header">
                  <h2>Aquaculture Reports - ${selected_category.value || 'All'}</h2>
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
          utils.book_append_sheet(workbook, worksheet, 'Aquaculture Reports')
          writeFile(workbook, `${baseFilename}.xlsx`)
        }
        
        success(`Successfully exported ${exportData.length} aquaculture reports to ${format === 'csv' ? 'CSV' : format === 'pdf' ? 'PDF' : 'Excel'}.`)
      } catch (exportError) {
        console.error('Error exporting aquaculture data:', exportError)
        error('Failed to export aquaculture reports. Please try again or contact support if the issue persists.')
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
    } = useBulkEdit(aquaculture, useAquaculture(), getAqauculture)

    onMounted(() => {
      getAqauculture()
    })

    return {
      aquaculture,
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
      <table class="w-7000 mb-10" id="aquaculture_to_excel">
        <tr class="grid mt-8 mb-1 text-cool-gray-500 text-sm grid-cols-82">
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
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Report State / LGA
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Name of Farm
          </th>
          <!-- <th
            class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            Region /
            <span>State</span>
          </th>
          <th
            class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md"
          >
            Region /
            <span>LGA</span>
          </th> -->
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Region /
            <span>Town/Village</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Farm Capacity
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Species
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Latitude</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Location /
            <span>Longitute</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Owner's Phone Number
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Registration /
            <span>Registered with Government?</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Registration /
            <span>Registration Type</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Belong to Farmers Association?
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Type of Pond
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Passive Surveillance /
            <span class="">Any health plan</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Passive Surveillance /
            <span class="">Vets attends to the health of aquatic species</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Passive Surveillance /
            <span class="">Health practitioner visits (bi-weekly)</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Passive Surveillance /
            <span class="">Fishes on the farm?</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Passive Surveillance /
            <span class="">Mortality for the month</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Passive Surveillance /
            <span class="">Average mortality per day</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Water Quality /
            <span class="">Recent Test</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Water Quality /
            <span class="">Contains organic materials and food debris?</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Water Quality /
            <span class="">Has Phytoplankton and algae available</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Water Quality /
            <span class="">Type of test normally done</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Water Quality /
            <span class="">Change pond water</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Biosecurity Measures /
            <span class="">Measures Seen</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Biosecurity Measures /
            <span class="">Other aquatic within 1km</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diseases Suspected /
            <span class="">Viral</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diseases Suspected /
            <span class="">Bacterial</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diseases Suspected /
            <span class="">Fungal</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diseases Suspected /
            <span class="">Protozoan parasitic</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diseases Suspected /
            <span class="">Helminth parasitic</span>
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diseases Suspected /
            <span class="">Leech parasitic</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diseases Suspected /
            <span class="">Environmental diseases</span>
          </th>
          <th class="col-span-5 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Diseases Suspected /
            <span class="">Nutritional diseases</span>
          </th>
          <th class="col-span-3 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            OIE listed fish pathogens (2020)
          </th>
          <th class="col-span-2 bg-card-8 border-r border-cool-gray-200 px-3 py-3 shadow-md">
            Action
          </th>
        </tr>
        <tr
          class="grid text-cool-gray-500 w-7000 text-sm grid-cols-82"
          v-for="(result, index) in aquaculture"
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
            {{ result.identifiers ? result.identifiers.name_of_farm : '' }}
          </td>
          <!-- <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.identifiers ? result.identifiers.state : '' }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.identifiers ? result.identifiers.local_govt : '' }}
          </td> -->
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.identifiers ? result.identifiers.town : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.identifiers ? result.identifiers.capacity : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.identifiers ? result.identifiers.selected_species : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.identifiers
                ? result.identifiers.my_coordinate
                  ? fixLocation(result.identifiers.my_coordinate.lat)
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.identifiers
                ? result.identifiers.my_coordinate
                  ? fixLocation(result.identifiers.my_coordinate.lng)
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.identifiers ? result.identifiers.owner_phone_number : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.identifiers ? (result.identifiers.registration_type == '' ? 'No' : 'Yes') : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.identifiers
                ? result.identifiers.registration_type == ''
                  ? 'None'
                  : result.identifiers.registration_type
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.identifiers
                ? result.identifiers.fish_farm_association == false
                  ? 'No'
                  : 'Yes'
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.identifiers ? result.identifiers.pond_type : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.passive_surveillance
                ? result.passive_surveillance.health_plan
                  ? 'Yes'
                  : 'No Health Plan'
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.passive_surveillance
                ? result.passive_surveillance.vet_attend_to
                  ? 'Yes'
                  : 'No'
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.passive_surveillance
                ? result.passive_surveillance.practitioner_visit
                  ? 'Yes'
                  : 'No'
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.passive_surveillance
                ? result.passive_surveillance.fishes_on_farm
                  ? result.passive_surveillance.fishes_on_farm
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.passive_surveillance
                ? result.passive_surveillance.mortality_for_month
                  ? result.passive_surveillance.mortality_for_month
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.passive_surveillance
                ? result.passive_surveillance.average_mortality_per_day
                  ? result.passive_surveillance.average_mortality_per_day
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.water_quality ? (result.water_quality.recent_quality_test ? 'Yes' : 'No') : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.water_quality ? (result.water_quality.organic_material ? 'Yes' : 'No') : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{ result.water_quality ? (result.water_quality.algae_available ? 'Yes' : 'No') : '' }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            <span v-if="result.water_quality">
              <span
                v-for="(test_type, index) in result.water_quality.test_type
                  ? result.water_quality.test_type
                  : ''"
                :key="index"
                >{{ test_type + ', ' }}</span
              >
            </span>
            <span v-else>{{ ' ' }}</span>
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.water_quality ? (result.water_quality.change_pond_water ? 'Yes' : 'No') : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            <select class="w-full py-1 bg-card-8 border-gray-200 focus:outline-none">
              <option
                v-for="(measures_seen, index) in result.biosecurity_measures.selected_bio_measures
                  ? result.biosecurity_measures.selected_bio_measures
                  : ''"
                :key="index"
              >
                {{ measures_seen.name }}
              </option>
            </select>
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.biosecurity_measures
                ? result.biosecurity_measures.aquatic_available
                  ? 'Yes'
                  : 'No'
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.disease_suspected
                ? result.disease_suspected.viral
                  ? result.disease_suspected.viral
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.disease_suspected
                ? result.disease_suspected.bacterial
                  ? result.disease_suspected.bacterial
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.disease_suspected
                ? result.disease_suspected.fungal
                  ? result.disease_suspected.fungal
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.disease_suspected
                ? result.disease_suspected.protozoan_parasitic
                  ? result.disease_suspected.protozoan_parasitic
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.disease_suspected
                ? result.disease_suspected.helminth_parasitic
                  ? result.disease_suspected.helminth_parasitic
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-2 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.disease_suspected
                ? result.disease_suspected.leech_infestation
                  ? result.disease_suspected.leech_infestation
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.disease_suspected
                ? result.disease_suspected.environmental_diseases
                  ? result.disease_suspected.environmental_diseases
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-5 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            {{
              result.disease_suspected
                ? result.disease_suspected.nutritional_diseases
                  ? result.disease_suspected.nutritional_diseases
                  : ''
                : ''
            }}
          </td>
          <td
            class="col-span-3 bg-card-8 border-r border-t border-cool-gray-200 text-cool-gray-700 px-3 py-3"
          >
            <select class="w-full py-1 bg-card-8 border-gray-200 focus:outline-none">
              <option
                v-for="(pathogens, index) in result.oie_listed_fish_pathogens
                  ? result.oie_listed_fish_pathogens
                  : ''"
                :key="index"
              >
                {{ pathogens.name }}
              </option>
            </select>
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
    <aquaculture-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></aquaculture-decline-form>

    <bulk-edit-modal
      v-if="showBulkEditModal"
      :selected-count="selectedReports.size"
      @close="closeBulkEditModal"
      @confirm="handleBulkEditConfirm"
    ></bulk-edit-modal>
  </div>
</template>

<style scoped>
.w-7000 {
  width: 7000px;
}
</style>
