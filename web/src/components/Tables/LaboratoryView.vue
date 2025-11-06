<script lang="ts">
import { useLaboratory } from './../../stores/laboratory'
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import LaboratoryDeclineForm from './DeclineForm/LaboratoryDeclineForm.vue'
import useMonths from './../../composables/months'
import { useToast } from './../../composables/toast'
import { utils, writeFile } from 'xlsx'
import {
  createGetDateFunction,
  createFindStateFunction,
  createSortedComputed,
  BulkActionsToolbar
} from './GenericDataTableView.vue'

// Define TypeScript interface for Laboratory report
interface LaboratoryReport {
  doc_id: string
  created_at: number
  disease?: string
  other_diseases?: string
  sample_code?: string
  date?: {
    date_received?: number
    date_released?: number
  }
  location?: {
    unit?: string
    farm_name?: string
    location_address?: string
  }
  diagnostic_test?: string
  samples?: string[]
  disease_and_result?: {
    disease?: string[]
    test?: string[]
  }
  laboratory_confirmation?: string
  laboratory_dvs_number?: string
  agent_serotype?: string
  farmer_phone_number?: string
  approved: boolean
  finished: boolean
}

export default defineComponent({
  components: { LaboratoryDeclineForm, BulkActionsToolbar },
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
    const doc_id = ref('')
    const decline_form = ref(false)
    const value = ref([]) as any
    const { success, error, warning } = useToast()

    const reporter_state = computed(() => useLaboratory().reporter_state)
    const laboratory = computed(() => useLaboratory().laboratory as LaboratoryReport[])
    const successful = computed(() => useLaboratory().successful)
    const loading = computed(() => useLaboratory().loading)
    const pagination = computed(() => useLaboratory().pagination)

    // Vuetify data table state
    const itemsPerPage = ref(20)
    const selectedReports = ref<LaboratoryReport[]>([])
    const sortBy = ref<any[]>([{ key: 'created_at', order: 'desc' }])

    // Use shared sorting logic from GenericDataTableView
    const sortedLaboratory = computed(createSortedComputed(laboratory, sortBy))

    // Define table headers with exact column names from the original
    const headers = ref([
      { title: 'S/N', key: 'index', sortable: false, width: 60 },
      { title: 'Created Date', key: 'created_at', sortable: true, width: 140 },
      { title: 'Report State - LGA', key: 'state_lga', sortable: false, width: 180 },
      { title: 'Name of Disease', key: 'disease', sortable: true, width: 180 },
      { title: 'Other Diseases', key: 'other_diseases', sortable: false, width: 150 },
      { title: 'Disease Suspicion code', key: 'sample_code', sortable: false, width: 180 },
      { title: 'Dates - Received', key: 'date.date_received', sortable: false, width: 150 },
      { title: 'Dates - Result Released', key: 'date.date_released', sortable: false, width: 180 },
      { title: 'Location - Epiemioogical Unit', key: 'location.unit', sortable: false, width: 200 },
      { title: 'Location - Farm Name', key: 'location.farm_name', sortable: false, width: 180 },
      { title: 'Location - Location Address', key: 'location.location_address', sortable: false, width: 200 },
      { title: 'Diagnostic Test', key: 'diagnostic_test', sortable: false, width: 150 },
      { title: 'Samples', key: 'samples', sortable: false, width: 150 },
      { title: 'Disease & Result - Name of Disease', key: 'disease_result_name', sortable: false, width: 240 },
      { title: 'Disease & Result - Test Result', key: 'disease_result_test', sortable: false, width: 220 },
      { title: 'Laboratory confirmation number', key: 'laboratory_confirmation', sortable: false, width: 220 },
      { title: 'DVS Phone number', key: 'laboratory_dvs_number', sortable: false, width: 160 },
      { title: 'Agent - Serotype', key: 'agent_serotype', sortable: false, width: 160 },
      { title: 'Farmer\'s Phone Number', key: 'farmer_phone_number', sortable: false, width: 180 },
      { title: 'Action', key: 'actions', sortable: false, width: 180 }
    ])

    watch(selected_category, () => {
      getLaboratory()
    })
    watch(selected_state, () => {
      getLaboratory()
    })
    watch(successful, () => {
      getLaboratory()
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
        useLaboratory().loadNextPage(values)
      }
    }

    // Use shared utility functions
    const getDate = createGetDateFunction(months)
    const findState = createFindStateFunction(reporter_state)

    const performAction = (action: string, docId: string) => {
      if (action === 'in_progress') {
        useLaboratory().in_progress(docId)
      } else if (action === 'approve') {
        useLaboratory().approve(docId)
      } else if (action === 'pending') {
        useLaboratory().pending(docId)
      } else if (action === 'decline') {
        declineForm(docId)
      }
    }

    const laboratory_count = () => {
      value.value = []
      const count = laboratory.value.length
      for (let val = 0; val < count; val++) {
        value.value.push(0)
      }
    }

    const declineForm = (id: string) => {
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

    // Bulk actions
    const handleBulkAction = async (action: string) => {
      if (selectedReports.value.length === 0) {
        warning('Please select at least one report')
        return
      }

      const docIds = selectedReports.value.map(report => report.doc_id)
      const result = await useLaboratory().bulkUpdateStatus(docIds, action as any)

      if (result.success.length > 0) {
        success(`Successfully updated ${result.success.length} reports`)
        selectedReports.value = []
        getLaboratory()
      }

      if (result.failed.length > 0) {
        error(`Failed to update ${result.failed.length} reports`)
      }
    }

    onMounted(() => {
      getLaboratory()
    })

    return {
      laboratory,
      sortedLaboratory,
      value,
      decline_form,
      doc_id,
      headers,
      itemsPerPage,
      selectedReports,
      sortBy,
      getDate,
      findState,
      closeModal,
      loading,
      pagination,
      loadNextPage,
      performAction,
      handleBulkAction
    }
  }
})
</script>

<template>
  <div>
    <!-- Bulk Actions Toolbar Component -->
    <BulkActionsToolbar
      :selected-reports="selectedReports"
      @bulk-action="handleBulkAction"
      @clear-selection="selectedReports = []"
    />

    <!-- Vuetify Data Table -->
    <v-data-table
      v-model="selectedReports"
      v-model:items-per-page="itemsPerPage"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="sortedLaboratory"
      :loading="loading"
      show-select
      return-object
      item-value="doc_id"
      class="elevation-1"
      fixed-header
      height="600px"
    >
      <!-- Serial Number Column -->
      <template v-slot:item.index="{ index }">
        {{ index + 1 }}
      </template>

      <!-- Created Date Column -->
      <template v-slot:item.created_at="{ item }">
        {{ getDate(item.created_at) }}
      </template>

      <!-- State/LGA Column -->
      <template v-slot:item.state_lga="{ item }">
        {{ findState(item.doc_id).state }} / {{ findState(item.doc_id).local_govt }}
      </template>

      <!-- Date Received -->
      <template v-slot:item.date.date_received="{ item }">
        {{ item.date?.date_received ? getDate(item.date.date_received) : 'N/A' }}
      </template>

      <!-- Date Released -->
      <template v-slot:item.date.date_released="{ item }">
        {{ item.date?.date_released ? getDate(item.date.date_released) : 'N/A' }}
      </template>

      <!-- Location Unit -->
      <template v-slot:item.location.unit="{ item }">
        {{ item.location?.unit || 'N/A' }}
      </template>

      <!-- Location Farm Name -->
      <template v-slot:item.location.farm_name="{ item }">
        {{ item.location?.farm_name || 'N/A' }}
      </template>

      <!-- Location Address -->
      <template v-slot:item.location.location_address="{ item }">
        {{ item.location?.location_address || 'N/A' }}
      </template>

      <!-- Samples -->
      <template v-slot:item.samples="{ item }">
        <v-select
          v-if="item.samples?.length"
          :model-value="item.samples[0]"
          :items="item.samples"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
        <span v-else>N/A</span>
      </template>

      <!-- Disease & Result - Name of Disease -->
      <template v-slot:item.disease_result_name="{ item }">
        <v-select
          v-if="item.disease_and_result?.disease?.length"
          :model-value="item.disease_and_result.disease[0]"
          :items="item.disease_and_result.disease"
          density="default"
          variant="outlined"
          hide-details
        ></v-select>
        <span v-else>N/A</span>
      </template>

      <!-- Disease & Result - Test Result -->
      <template v-slot:item.disease_result_test="{ item }">
        <v-select
          v-if="item.disease_and_result?.test?.length"
          :model-value="item.disease_and_result.test[0]"
          :items="item.disease_and_result.test"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
        <span v-else>N/A</span>
      </template>

      <!-- Actions Column -->
      <template v-slot:item.actions="{ item }">
        <v-select
          :items="[
            { title: '-- Select Action --', value: '' },
            ...(item.finished ? [{ title: 'In Progress', value: 'in_progress' }] : []),
            ...(!item.approved ? [{ title: 'Approve', value: 'approve' }] : []),
            ...(item.approved ? [{ title: 'Pending', value: 'pending' }] : []),
            ...(item.finished ? [{ title: 'Decline', value: 'decline' }] : [])
          ]"
          density="compact"
          variant="outlined"
          hide-details
          :model-value="''"
          @update:model-value="(value: string) => value && performAction(value, item.doc_id)"
        ></v-select>
      </template>

      <!-- Loading Slot -->
      <template v-slot:loading>
        <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
      </template>

      <!-- No Data Slot -->
      <template v-slot:no-data>
        <div class="text-center py-8">
          <div class="text-gray-500 text-lg">No reports found</div>
          <div class="text-gray-400 text-sm mt-2">
            Try adjusting your filters or check back later
          </div>
        </div>
      </template>

      <!-- Bottom Slot for Load More -->
      <template v-slot:bottom>
        <div class="text-center pa-4">
          <v-btn
            v-if="pagination.hasMore"
            @click="loadNextPage"
            :loading="loading"
            color="primary"
            variant="outlined"
          >
            Load More
          </v-btn>
          <div v-else class="text-sm text-gray-500">
            All reports loaded ({{ laboratory.length }} total)
          </div>
        </div>
      </template>
    </v-data-table>

    <!-- Decline Form Modal -->
    <laboratory-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></laboratory-decline-form>
  </div>
</template>

<style scoped src="./GenericDataTableStyles.css"></style>
