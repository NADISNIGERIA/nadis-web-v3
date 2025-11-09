<script lang="ts">
import { useAbattoir } from './../../stores/abattoir'
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import AbattoirDeclineForm from './DeclineForm/AbattoirDeclineForm.vue'
import BulkEditModal from '../BulkEditModal.vue'
import useMonths from './../../composables/months'
import { useToast } from './../../composables/toast'
import { utils, writeFile } from 'xlsx'
import {
  BulkActionsToolbar,
  createFindStateFunction,
  createFixLocationFunction,
  createGetDateFunction
} from './GenericDataTableView.vue'

// Define TypeScript interface for Abattoir report
interface AbattoirReport {
  doc_id: string
  created_at: number
  disease_name?: string
  other_diseases?: string
  name_of_abattoir?: string
  address?: string
  holding_capacity?: number
  location?: {
    lat: number
    lng: number
  }
  species_affected?: {
    species: string
    other_species: string
  }
  source_of_animal?: string
  disease_suspected?: string
  animal_inspection?: {
    inspected: number
    rejected: number
    reason_for_rejection: string
  }
  slaughter_figure?: number
  anti_mortem?: {
    inspected: number
    appearance: string
  }
  post_mortem_inspection?: {
    total_organs_suspected: number
    legion_seen: string
    number_suspected: number
    selected_partially_condemned: string[]
    selected_totally_condemned: string[]
  }
  sample_information?: {
    samples_collected: string
    date: number
    number_of_sample_submitted: number
  }
  by_products?: string
  approved: boolean
  finished: boolean
}

export default defineComponent({
  components: { AbattoirDeclineForm, BulkEditModal, BulkActionsToolbar },
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
    const doc_id = ref('')
    const decline_form = ref(false)
    const { success, error, warning } = useToast()

    const reporter_state = computed(() => useAbattoir().reporter_state)
    const abattoir = computed(() => useAbattoir().abattoir as AbattoirReport[])
    const successful = computed(() => useAbattoir().successful)
    const loading = computed(() => useAbattoir().loading)
    const pagination = computed(() => useAbattoir().pagination)

    // Vuetify data table state
    const itemsPerPage = ref(20)
    const selectedReports = ref<AbattoirReport[]>([])
    const sortBy = ref<any[]>([{ key: 'created_at', order: 'desc' }])
    const currentPage = ref(1)

    // Dynamic table configuration based on data availability
    const tableConfig = computed(() => {
      const dataCount = abattoir.value.length
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
    const handlePageChange = (page: number) => {
      currentPage.value = page
      useAbattoir().getAbattoirPage(valuesRef.value, page, itemsPerPage.value)
    }

    const handlePageSizeChange = (newPageSize: number) => {
      itemsPerPage.value = newPageSize
      currentPage.value = 1
      useAbattoir().getAbattoirPage(valuesRef.value, 1, newPageSize)
    }

    // Define all available columns with priority levels for responsive display
    const allColumns = [
      { title: 'S/N', key: 'index', sortable: false, width: 60, priority: 1 },
      { title: 'Created Date', key: 'created_at', sortable: true, width: 120, priority: 1 },
      { title: 'State / LGA', key: 'state_lga', sortable: false, width: 140, priority: 1 },
      { title: 'Disease Suspected', key: 'disease_name', sortable: true, width: 140, priority: 2 },
      { title: 'Other Diseases', key: 'other_diseases', sortable: false, width: 120, priority: 4 },
      { title: 'Abattoir Name', key: 'name_of_abattoir', sortable: true, width: 140, priority: 2 },
      { title: 'Address', key: 'address', sortable: false, width: 150, priority: 3 },
      { title: 'Holding Capacity', key: 'holding_capacity', sortable: true, width: 120, priority: 3 },
      { title: 'Latitude', key: 'location.lat', sortable: false, width: 100, priority: 5 },
      { title: 'Longitude', key: 'location.lng', sortable: false, width: 100, priority: 5 },
      { title: 'Species', key: 'species', sortable: false, width: 110, priority: 2 },
      { title: 'Other Species', key: 'other_species', sortable: false, width: 120, priority: 4 },
      { title: 'Source of Animals', key: 'source_of_animal', sortable: false, width: 140, priority: 3 },
      { title: 'Disease Suspected', key: 'disease_suspected', sortable: false, width: 140, priority: 4 },
      { title: 'Inspected', key: 'animal_inspection.inspected', sortable: false, width: 100, priority: 3 },
      { title: 'Rejected', key: 'animal_inspection.rejected', sortable: false, width: 100, priority: 3 },
      { title: 'Rejection Reason', key: 'animal_inspection.reason_for_rejection', sortable: false, width: 150, priority: 4 },
      { title: 'Slaughtered/day', key: 'slaughter_figure', sortable: false, width: 120, priority: 3 },
      { title: 'AM - Inspected', key: 'anti_mortem.inspected', sortable: false, width: 120, priority: 4 },
      { title: 'AM - Appearance', key: 'anti_mortem.appearance', sortable: false, width: 120, priority: 4 },
      { title: 'PM - Organs Suspected', key: 'post_mortem_inspection.total_organs_suspected', sortable: false, width: 140, priority: 4 },
      { title: 'PM - Lesion Seen', key: 'post_mortem_inspection.legion_seen', sortable: false, width: 130, priority: 4 },
      { title: 'PM - Condemned', key: 'post_mortem_inspection.number_suspected', sortable: false, width: 130, priority: 4 },
      { title: 'Partially Condemned', key: 'partially_condemned', sortable: false, width: 140, priority: 5 },
      { title: 'Totally Condemned', key: 'totally_condemned', sortable: false, width: 140, priority: 5 },
      { title: 'Samples Collected', key: 'sample_information.samples_collected', sortable: false, width: 130, priority: 5 },
      { title: 'Sample Date', key: 'sample_information.date', sortable: false, width: 110, priority: 5 },
      { title: 'Samples Submitted', key: 'sample_information.number_of_sample_submitted', sortable: false, width: 130, priority: 5 },
      { title: 'By-Product', key: 'by_products', sortable: false, width: 110, priority: 5 },
      { title: 'Action', key: 'actions', sortable: false, width: 120, priority: 1 }
    ]

    // Column visibility controls
    const columnVisibilityLevel = ref(3) // Show priorities 1-3 by default
    
    // Responsive headers based on user preference
    const headers = computed(() => {
      return allColumns.filter(col => col.priority <= columnVisibilityLevel.value)
    })

    // Toggle more/fewer columns
    const toggleColumnVisibility = (level: number) => {
      columnVisibilityLevel.value = level
    }

    watch(selected_category, () => {
      currentPage.value = 1
      getAbattoir()
    })
    watch(selected_state, () => {
      currentPage.value = 1
      getAbattoir()
    })
    watch(successful, () => {
      getAbattoir()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getAbattoir = () => {
      // Use the new page-based method for traditional pagination
      useAbattoir().getAbattoirPage(valuesRef.value, currentPage.value, itemsPerPage.value)
    }

    const getDate = createGetDateFunction(months)
    const fixLocation = createFixLocationFunction()

    const performAction = (action: string, docId: string) => {
      if (action === 'in_progress') {
        useAbattoir().in_progress(docId)
      } else if (action === 'approve') {
        useAbattoir().approve(docId)
      } else if (action === 'pending') {
        useAbattoir().pending(docId)
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

        const exportData = await useAbattoir().exportAbattoir(filters)

        if (exportData.length === 0) {
          warning('No abattoir reports found matching your selected filters. Try adjusting your date range or filters.')
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

        let baseFilename = `${selected_category.value || 'All'}_Abattoir_Reports`
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

    const findState = createFindStateFunction(reporter_state)

    // Bulk actions
    const handleBulkAction = async (action: string) => {
      if (selectedReports.value.length === 0) {
        warning('Please select at least one report')
        return
      }

      const docIds = selectedReports.value.map(report => report.doc_id)
      const result = await useAbattoir().bulkUpdateStatus(docIds, action as any)

      if (result.success.length > 0) {
        success(`Successfully updated ${result.success.length} reports`)
        selectedReports.value = []
        getAbattoir()
      }

      if (result.failed.length > 0) {
        error(`Failed to update ${result.failed.length} reports`)
      }
    }

    onMounted(() => {
      getAbattoir()
    })

    return {
      abattoir,
      tableConfig,
      decline_form,
      doc_id,
      headers,
      allColumns,
      columnVisibilityLevel,
      toggleColumnVisibility,
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

    <!-- Vuetify Data Table Server -->
    <v-data-table-server
      v-model="selectedReports"
      v-model:items-per-page="itemsPerPage"
      v-model:sort-by="sortBy"
      v-model:page="currentPage"
      :headers="headers"
      :items="abattoir"
      :loading="loading"
      :items-per-page-options="[10, 20, 50, 100]"
      :items-length="pagination.totalCount"
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

      <!-- Created Date Column -->
      <template v-slot:item.created_at="{ item }">
        {{ getDate(item.created_at) }}
      </template>

      <!-- State/LGA Column -->
      <template v-slot:item.state_lga="{ item }">
        {{ findState(item.doc_id).state }} / {{ findState(item.doc_id).local_govt }}
      </template>

      <!-- Location Latitude -->
      <template v-slot:item.location.lat="{ item }">
        {{ item.location ? fixLocation(item.location.lat) : 'N/A' }}
      </template>

      <!-- Location Longitude -->
      <template v-slot:item.location.lng="{ item }">
        {{ item.location ? fixLocation(item.location.lng) : 'N/A' }}
      </template>

      <!-- Species -->
      <template v-slot:item.species="{ item }">
        {{ item.species_affected?.species || 'N/A' }}
      </template>

      <!-- Other Species -->
      <template v-slot:item.other_species="{ item }">
        {{ item.species_affected?.other_species || 'N/A' }}
      </template>

      <!-- Animal Inspection - Inspected -->
      <template v-slot:item.animal_inspection.inspected="{ item }">
        {{ item.animal_inspection?.inspected || 'N/A' }}
      </template>

      <!-- Animal Inspection - Rejected -->
      <template v-slot:item.animal_inspection.rejected="{ item }">
        {{ item.animal_inspection?.rejected || 'N/A' }}
      </template>

      <!-- Animal Inspection - Reason for Rejection -->
      <template v-slot:item.animal_inspection.reason_for_rejection="{ item }">
        {{ item.animal_inspection?.reason_for_rejection || 'N/A' }}
      </template>

      <!-- Ante Mortem - Inspected -->
      <template v-slot:item.anti_mortem.inspected="{ item }">
        {{ item.anti_mortem?.inspected || 'N/A' }}
      </template>

      <!-- Ante Mortem - Appearance -->
      <template v-slot:item.anti_mortem.appearance="{ item }">
        {{ item.anti_mortem?.appearance || 'N/A' }}
      </template>

      <!-- Post Mortem - Total Organs Suspected -->
      <template v-slot:item.post_mortem_inspection.total_organs_suspected="{ item }">
        {{ item.post_mortem_inspection?.total_organs_suspected || 'N/A' }}
      </template>

      <!-- Post Mortem - Lesion Seen -->
      <template v-slot:item.post_mortem_inspection.legion_seen="{ item }">
        {{ item.post_mortem_inspection?.legion_seen || 'N/A' }}
      </template>

      <!-- Post Mortem - Number Suspected -->
      <template v-slot:item.post_mortem_inspection.number_suspected="{ item }">
        {{ item.post_mortem_inspection?.number_suspected || 'N/A' }}
      </template>

      <!-- Partially Condemned Organs -->
      <template v-slot:item.partially_condemned="{ item }">
        <v-select
          v-if="item.post_mortem_inspection?.selected_partially_condemned?.length"
          :model-value="item.post_mortem_inspection.selected_partially_condemned[0]?.name"
          :items="item.post_mortem_inspection.selected_partially_condemned.map((c: any) => c.name)"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
        <span v-else>N/A</span>
      </template>

      <!-- Totally Condemned Organs -->
      <template v-slot:item.totally_condemned="{ item }">
        <v-select
          v-if="item.post_mortem_inspection?.selected_totally_condemned?.length"
          :model-value="item.post_mortem_inspection.selected_totally_condemned[0]?.name"
          :items="item.post_mortem_inspection.selected_totally_condemned.map((c: any) => c.name)"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
        <span v-else>N/A</span>
      </template>

      <!-- Sample Information - Collected -->
      <template v-slot:item.sample_information.samples_collected="{ item }">
        {{ item.sample_information?.samples_collected || 'N/A' }}
      </template>

      <!-- Sample Information - Date -->
      <template v-slot:item.sample_information.date="{ item }">
        {{ item.sample_information?.date ? getDate(item.sample_information.date) : 'N/A' }}
      </template>

      <!-- Sample Information - Submitted -->
      <template v-slot:item.sample_information.number_of_sample_submitted="{ item }">
        {{ item.sample_information?.number_of_sample_submitted || 'N/A' }}
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
    </v-data-table-server>

    <!-- Decline Form Modal -->
    <abattoir-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></abattoir-decline-form>
  </div>
</template>

<style scoped src="./GenericDataTableStyles.css"></style>
