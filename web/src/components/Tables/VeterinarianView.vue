<script lang="ts">
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import useMonths from './../../composables/months'
import { useVeterinarian } from './../../stores/veterinarian'
import VeterinarianDeclineForm from './DeclineForm/VeterinarianDeclineForm.vue'
import { useToast } from './../../composables/toast'
import { utils, writeFile } from 'xlsx'
import {
  BulkActionsToolbar,
  createFindStateFunction,
  createFixLocationFunction,
  createGetDateFunction,
  createSortedComputed,
  createPaginationHandlers
} from './GenericDataTableView.vue'

// Define TypeScript interface for Veterinarian report
interface VeterinarianReport {
  doc_id: string
  created_at: number
  date?: number
  name_of_hospital?: string
  type_of_report?: string
  location?: {
    lat: number
    lng: number
  }
  disease?: string
  other_diseases?: string
  species?: string
  age?: string | number
  sex?: string
  address_affected_farm?: string
  diagnosis?: string
  measures?: string
  approved: boolean
  finished: boolean
}

export default defineComponent({
  components: { VeterinarianDeclineForm, BulkActionsToolbar },
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
    const doc_id = ref('')
    const decline_form = ref(false)
    const { success, error, warning } = useToast()

    const reporter_state = computed(() => useVeterinarian().reporter_state)
    const veterinarian = computed(() => useVeterinarian().veterinarian as VeterinarianReport[])
    const successful = computed(() => useVeterinarian().successful)
    const loading = computed(() => useVeterinarian().loading)
    const pagination = computed(() => useVeterinarian().pagination)

    // Vuetify data table state
    const itemsPerPage = ref(20)
    const selectedReports = ref<VeterinarianReport[]>([])
    const sortBy = ref<any[]>([{ key: 'created_at', order: 'desc' }])
    const currentPage = ref(1)

    const sortedVeterinarian = computed(createSortedComputed(veterinarian, sortBy))

    // Dynamic table configuration based on data availability
    const tableConfig = computed(() => {
      const dataCount = sortedVeterinarian.value.length
      // Use fixed height only when there are enough rows to benefit from scrolling
      const needsScrolling = dataCount > 10
      return {
        height: needsScrolling ? '600px' : 'auto',
        fixedHeader: needsScrolling
      }
    })

    // Create reactive values for pagination
    const valuesRef = computed(() => {
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

      return {
        category: sort,
        state: selected_state.value,
        in_progress: progress
      }
    })

    // Create pagination handlers
    const { handlePageChange, handlePageSizeChange } = createPaginationHandlers(
      useVeterinarian(),
      valuesRef
    )

    // Column visibility control
    const columnVisibilityLevel = ref(3)
    const allColumns = [
      { title: 'S/N', key: 'index', sortable: false, width: 60, priority: 1 },
      { title: 'Created Date', key: 'date', sortable: true, width: 140, priority: 1 },
      { title: 'State - LGA', key: 'state_lga', sortable: false, width: 150, priority: 1 },
      { title: 'Hospital/Clinic', key: 'name_of_hospital', sortable: false, width: 180, priority: 2 },
      { title: 'Report Type', key: 'type_of_report', sortable: false, width: 130, priority: 2 },
      { title: 'Latitude', key: 'location.lat', sortable: false, width: 100, priority: 5 },
      { title: 'Longitude', key: 'location.lng', sortable: false, width: 100, priority: 5 },
      { title: 'Disease Suspected', key: 'disease', sortable: false, width: 140, priority: 2 },
      { title: 'Other Diseases', key: 'other_diseases', sortable: false, width: 130, priority: 4 },
      { title: 'Animal Type', key: 'species', sortable: false, width: 120, priority: 2 },
      { title: 'Age', key: 'age', sortable: false, width: 80, priority: 3 },
      { title: 'Sex', key: 'sex', sortable: false, width: 80, priority: 3 },
      { title: 'Farm Address', key: 'address_affected_farm', sortable: false, width: 160, priority: 4 },
      { title: 'Diagnosis', key: 'diagnosis', sortable: false, width: 130, priority: 3 },
      { title: 'Measures', key: 'measures', sortable: false, width: 130, priority: 3 },
      { title: 'Action', key: 'actions', sortable: false, width: 120, priority: 1 }
    ]
    
    const headers = computed(() => allColumns.filter(col => col.priority <= columnVisibilityLevel.value))

    watch(selected_category, () => {
      currentPage.value = 1
      getVeterinarian()
    })
    watch(selected_state, () => {
      currentPage.value = 1
      getVeterinarian()
    })
    watch(successful, () => {
      getVeterinarian()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getVeterinarian = () => {
      // Use the new page-based method for traditional pagination
      useVeterinarian().getVeterinarianPage(valuesRef.value, currentPage.value, itemsPerPage.value)
    }

    const getDate = createGetDateFunction(months)
    const fixLocation = createFixLocationFunction()

    const performAction = (action: string, docId: string) => {
      if (action === 'in_progress') {
        useVeterinarian().in_progress(docId)
      } else if (action === 'approve') {
        useVeterinarian().approve(docId)
      } else if (action === 'pending') {
        useVeterinarian().pending(docId)
      } else if (action === 'decline') {
        declineForm(docId)
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
        const exportFilters = (window as any).exportFilters || {}

        const filters = {
          category: selected_category.value === 'Approved',
          state: selected_state.value || 'All States',
          in_progress: selected_category.value === 'In Progress',
          startDate: exportFilters.startDate,
          endDate: exportFilters.endDate
        }

        const exportData = await useVeterinarian().exportVeterinarian(filters)

        if (exportData.length === 0) {
          warning('No veterinarian reports found matching your selected filters. Try adjusting your date range or filters.')
          return
        }

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

        const worksheetData = [headers, ...rows]

        let baseFilename = `${selected_category.value || 'All'}_Veterinarian_Reports`
        if (exportFilters.startDate || exportFilters.endDate) {
          baseFilename += '_Filtered'
        }
        baseFilename += `_${Date.now()}`

        const format = exportFilters.format || 'excel'

        if (format === 'csv') {
          const csvContent = worksheetData.map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          ).join('\n')

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = `${baseFilename}.csv`
          link.click()
          URL.revokeObjectURL(link.href)
        } else if (format === 'pdf') {
          const htmlContent = `
            <html>
              <head>
                <title>Veterinarian Reports</title>
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
                  <h2>Veterinarian Reports - ${selected_category.value || 'All'}</h2>
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
          const workbook = utils.book_new()
          const worksheet = utils.aoa_to_sheet(worksheetData)
          utils.book_append_sheet(workbook, worksheet, 'Veterinarian Reports')
          writeFile(workbook, `${baseFilename}.xlsx`)
        }

        success(`Successfully exported ${exportData.length} veterinarian reports to ${format === 'csv' ? 'CSV' : format === 'pdf' ? 'PDF' : 'Excel'}.`)
      } catch (exportError) {
        console.error('Error exporting veterinarian data:', exportError)
        error('Failed to export veterinarian reports. Please try again or contact support if the issue persists.')
      }
    }

    const findState = createFindStateFunction(reporter_state)

    // Bulk actions
    const handleBulkAction = async (action: string) => {
      if (selectedReports.value.length === 0) {
        warning('Please select at least one report')
        return
      }

      const docIds = selectedReports.value.map(report => report.doc_id)
      const result = await useVeterinarian().bulkUpdateStatus(docIds, action as any)

      if (result.success.length > 0) {
        success(`Successfully updated ${result.success.length} reports`)
        selectedReports.value = []
        getVeterinarian()
      }

      if (result.failed.length > 0) {
        error(`Failed to update ${result.failed.length} reports`)
      }
    }

    onMounted(() => {
      getVeterinarian()
    })

    return {
      veterinarian,
      sortedVeterinarian,
      tableConfig,
      decline_form,
      doc_id,
      headers,
      allColumns,
      columnVisibilityLevel,
      itemsPerPage,
      selectedReports,
      sortBy,
      currentPage,
      getDate,
      findState,
      fixLocation,
      closeModal,
      loading,
      pagination,
      performAction,
      handleBulkAction,
      handlePageChange,
      handlePageSizeChange
    }
  }
})
</script>

<template>
  <div>
    <BulkActionsToolbar
      :selected-reports="selectedReports"
      @bulk-action="handleBulkAction"
      @clear-selection="selectedReports = []"
    />

    <!-- Column Visibility Controls -->
    <v-card class="mb-4 pa-3" elevation="1">
      <div class="d-flex align-center gap-3">
        <span class="text-subtitle-2 text-medium-emphasis">Column View:</span>
        <v-btn-toggle
          v-model="columnVisibilityLevel"
          variant="outlined"
          size="small"
          mandatory
        >
          <v-btn :value="2" size="small">
            Essential
            <v-tooltip activator="parent" location="top">
              Show only the most important columns ({{ allColumns.filter(c => c.priority <= 2).length }} columns)
            </v-tooltip>
          </v-btn>
          <v-btn :value="3" size="small">
            Standard
            <v-tooltip activator="parent" location="top">
              Show standard view ({{ allColumns.filter(c => c.priority <= 3).length }} columns)
            </v-tooltip>
          </v-btn>
          <v-btn :value="4" size="small">
            Detailed
            <v-tooltip activator="parent" location="top">
              Show detailed view ({{ allColumns.filter(c => c.priority <= 4).length }} columns)
            </v-tooltip>
          </v-btn>
          <v-btn :value="5" size="small">
            Complete
            <v-tooltip activator="parent" location="top">
              Show all columns ({{ allColumns.length }} columns)
            </v-tooltip>
          </v-btn>
        </v-btn-toggle>
        <v-spacer></v-spacer>
        <span class="text-caption text-medium-emphasis">
          Showing {{ headers.length }} of {{ allColumns.length }} columns
        </span>
      </div>
    </v-card>

    <!-- Vuetify Data Table -->
    <v-data-table
      v-model="selectedReports"
      v-model:items-per-page="itemsPerPage"
      v-model:page="currentPage"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="sortedVeterinarian"
      :items-length="pagination.totalCount"
      :loading="loading"
      show-select
      return-object
      item-value="doc_id"
      class="elevation-1"
      :fixed-header="tableConfig.fixedHeader"
      :height="tableConfig.height"
      @update:page="handlePageChange"
      @update:items-per-page="handlePageSizeChange"
    >
      <!-- Serial Number Column -->
      <template v-slot:item.index="{ index }">
        {{ index + 1 }}
      </template>

      <!-- Date Column -->
      <template v-slot:item.date="{ item }">
        {{ item.date ? getDate(item.date) : 'N/A' }}
      </template>

      <!-- State/LGA Column -->
      <template v-slot:item.state_lga="{ item }">
        {{ findState(item.doc_id).state }} / {{ findState(item.doc_id).local_govt }}
      </template>

      <!-- Location Latitude -->
      <template v-slot:item.location.lat="{ item }">
        {{ item.location?.lat ? fixLocation(item.location.lat) : 'N/A' }}
      </template>

      <!-- Location Longitude -->
      <template v-slot:item.location.lng="{ item }">
        {{ item.location?.lng ? fixLocation(item.location.lng) : 'N/A' }}
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
    </v-data-table>

    <!-- Decline Form Modal -->
    <veterinarian-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></veterinarian-decline-form>
  </div>
</template>

<style scoped src="./GenericDataTableStyles.css"></style>
