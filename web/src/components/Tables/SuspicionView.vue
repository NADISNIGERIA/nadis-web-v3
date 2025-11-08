<script lang="ts">
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import { useSuspicion } from './../../stores/suspicion'
import SuspicionDeclineForm from './DeclineForm/SuspicionDeclineForm.vue'
import useMonths from './../../composables/months'
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

interface SuspicionReport {
  doc_id: string
  created_at: number
  approved: boolean
  finished: boolean
  [key: string]: any
}

export default defineComponent({
  components: { SuspicionDeclineForm, BulkActionsToolbar },
  props: {
    export_to_excel: Number,
    selected_category: String,
    selected_state: String,
    full: Boolean
  },
  setup(props) {
    const { selected_category, selected_state, export_to_excel } = toRefs(props)

    const suspicionStore = useSuspicion()
    const months = ref(useMonths().months)
    const doc_id = ref('')
    const decline_form = ref(false)
    const { success, error, warning } = useToast()

    const reporter_state = computed(() => suspicionStore.reporter_state)
    const suspicion = computed(() => suspicionStore.suspicion as SuspicionReport[])
    const successful = computed(() => suspicionStore.successful)
    const loading = computed(() => suspicionStore.loading)
    const pagination = computed(() => suspicionStore.pagination)

    const itemsPerPage = ref(20)
    const sortBy = ref<any[]>([{ key: 'created_at', order: 'desc' }])
    const selectedReports = ref<SuspicionReport[]>([])
    const currentPage = ref(1)

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
      suspicionStore,
      valuesRef
    )

    // Column visibility control (simplified for space)
    const columnVisibilityLevel = ref(3)
    const allColumns = [
      { title: 'S/N', key: 'index', sortable: false, width: 60, priority: 1 },
      { title: 'Created Date', key: 'created_at', sortable: true, width: 140, priority: 1 },
      { title: 'State / LGA', key: 'state_lga', sortable: false, width: 150, priority: 1 },
      { title: 'Disease Suspected', key: 'disease_name', sortable: true, width: 140, priority: 2 },
      { title: 'Other Diseases', key: 'other_diseases', sortable: false, width: 130, priority: 4 },
      { title: 'Laboratory Slip', key: 'laboratory_slip', sortable: false, width: 130, priority: 3 },
      { title: 'Agent Name', key: 'survey_agent.name', sortable: false, width: 130, priority: 2 },
      { title: 'Agent Phone', key: 'survey_agent.phone_number', sortable: false, width: 130, priority: 5 },
      { title: 'Location', key: 'details.location_details', sortable: false, width: 130, priority: 2 },
      { title: 'Address', key: 'details.address_details', sortable: false, width: 150, priority: 4 },
      { title: 'Latitude', key: 'location.lat', sortable: false, width: 100, priority: 5 },
      { title: 'Longitude', key: 'location.lng', sortable: false, width: 100, priority: 5 },
      { title: 'Owner Name', key: 'owner_details.name_of_owner', sortable: false, width: 130, priority: 3 },
      { title: 'Owner Phone', key: 'owner_details.phone_number', sortable: false, width: 130, priority: 5 },
      { title: 'Purchase Date', key: 'purchase_details.date_of_purchase', sortable: false, width: 130, priority: 4 },
      { title: 'Animal Source', key: 'purchase_details.source_of_animals', sortable: false, width: 140, priority: 4 },
      { title: 'Farm Practice', key: 'farm_practices.select_farming', sortable: false, width: 130, priority: 4 },
      // Condensed movement columns
      { title: 'Total Animals', key: 'number_of_animals.total_animals', sortable: false, width: 120, priority: 2 },
      { title: 'Animals Affected', key: 'number_of_animals.cases', sortable: false, width: 130, priority: 2 },
      { title: 'Animals Dead', key: 'number_of_animals.deaths', sortable: false, width: 120, priority: 3 },
      { title: 'Species', key: 'animal_details.species', sortable: false, width: 110, priority: 2 },
      { title: 'Clinical Signs', key: 'clinical_signs', sortable: false, width: 140, priority: 3 },
      { title: 'Action', key: 'actions', sortable: false, width: 120, priority: 1 }
    ]
    
    const headers = computed(() => allColumns.filter(col => col.priority <= columnVisibilityLevel.value))

    const sortedSuspicion = computed(createSortedComputed(suspicion, sortBy))

    // Dynamic table configuration based on data availability
    const tableConfig = computed(() => {
      const dataCount = sortedSuspicion.value.length
      // Use fixed height only when there are enough rows to benefit from scrolling
      const needsScrolling = dataCount > 10
      return {
        height: needsScrolling ? '600px' : 'auto',
        fixedHeader: needsScrolling
      }
    })

    watch(selected_category, () => {
      currentPage.value = 1
      getSuspicion()
    })
    watch(selected_state, () => {
      currentPage.value = 1
      getSuspicion()
    })
    watch(successful, () => {
      getSuspicion()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })
    watch(
      () => suspicion.value,
      () => {
        selectedReports.value = []
      }
    )

    const getSuspicion = () => {
      // Use the new page-based method for traditional pagination
      suspicionStore.getSuspicionPage(valuesRef.value, currentPage.value, itemsPerPage.value)
    }

    const getDate = createGetDateFunction(months)
    const fixLocation = createFixLocationFunction()

    const performAction = (action: string, docId: string) => {
      if (action === 'in_progress') {
        suspicionStore.in_progress(docId)
      } else if (action === 'approve') {
        suspicionStore.approve(docId)
      } else if (action === 'pending') {
        suspicionStore.pending(docId)
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

    // Bulk actions
    const handleBulkAction = async (action: string) => {
      if (selectedReports.value.length === 0) {
        warning('Please select at least one report')
        return
      }

      const docIds = selectedReports.value.map(report => report.doc_id)
      const result = await suspicionStore.bulkUpdateStatus(docIds, action as any)

      if (result.success.length > 0) {
        success(`Successfully updated ${result.success.length} reports`)
        selectedReports.value = []
        getSuspicion()
      }

      if (result.failed.length > 0) {
        error(`Failed to update ${result.failed.length} reports`)
      }
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

        const exportData = await suspicionStore.exportSuspicion(filters)

        if (exportData.length === 0) {
          warning(
            'No suspicion reports found matching your selected filters. Try adjusting your date range or filters.'
          )
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
            item.approved ? 'Approved' : item.finished ? 'Pending' : 'In Progress',
            item.reporter_name || 'N/A'
          ]
        })

        const worksheetData = [headers, ...rows]

        let baseFilename = `${selected_category.value || 'All'}_Suspicion_Reports`
        if (exportFilters.startDate || exportFilters.endDate) {
          baseFilename += '_Filtered'
        }
        baseFilename += `_${Date.now()}`

        const format = exportFilters.format || 'excel'

        if (format === 'csv') {
          const csvContent = worksheetData
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n')

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
                  ${
                    exportFilters.startDate || exportFilters.endDate
                      ? `<p>Date Range: ${exportFilters.startDate || 'No start'} to ${exportFilters.endDate || 'No end'}</p>`
                      : '<p>Date Range: All dates</p>'
                  }
                  <p>Total Records: ${exportData.length}</p>
                </div>
                <table>
                  ${worksheetData
                    .map(
                      (row, index) =>
                        `<tr>${row
                          .map((cell) => (index === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`))
                          .join('')}</tr>`
                    )
                    .join('')}
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
          utils.book_append_sheet(workbook, worksheet, 'Suspicion Reports')
          writeFile(workbook, `${baseFilename}.xlsx`)
        }

        success(
          `Successfully exported ${exportData.length} suspicion reports to ${
            format === 'csv' ? 'CSV' : format === 'pdf' ? 'PDF' : 'Excel'
          }.`
        )
      } catch (exportError) {
        console.error('Error exporting suspicion data:', exportError)
        error('Failed to export suspicion reports. Please try again or contact support if the issue persists.')
      }
    }

    const findState = createFindStateFunction(reporter_state)

    const safeDisplay = (value: any) => {
      if (value === undefined || value === null || value === '') {
        return 'N/A'
      }
      return value
    }

    onMounted(() => {
      getSuspicion()
    })

    return {
      suspicion,
      sortedSuspicion,
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
      safeDisplay,
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
        <v-btn-toggle v-model="columnVisibilityLevel" variant="outlined" size="small" mandatory>
          <v-btn :value="2" size="small">Essential</v-btn>
          <v-btn :value="3" size="small">Standard</v-btn>
          <v-btn :value="4" size="small">Detailed</v-btn>
          <v-btn :value="5" size="small">Complete</v-btn>
        </v-btn-toggle>
        <v-spacer></v-spacer>
        <span class="text-caption text-medium-emphasis">
          Showing {{ headers.length }} of {{ allColumns.length }} columns
        </span>
      </div>
    </v-card>

    <v-data-table
      v-model="selectedReports"
      v-model:items-per-page="itemsPerPage"
      v-model:sort-by="sortBy"
      v-model:page="currentPage"
      :headers="headers"
      :items="sortedSuspicion"
      :loading="loading"
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
      <template v-slot:item.index="{ index }">
        {{ index + 1 }}
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ getDate(item.created_at) }}
      </template>

      <template v-slot:item.state_lga="{ item }">
        {{ findState(item.doc_id).state }} / {{ findState(item.doc_id).local_govt }}
      </template>

      <template v-slot:item.disease_name="{ item }">
        {{ safeDisplay(item.disease_name) }}
      </template>

      <template v-slot:item.other_diseases="{ item }">
        {{ safeDisplay(item.other_diseases) }}
      </template>

      <template v-slot:item.laboratory_slip="{ item }">
        {{ safeDisplay(item.laboratory_slip) }}
      </template>

      <template v-slot:item.survey_agent.name="{ item }">
        {{ safeDisplay(item.survey_agent?.name) }}
      </template>

      <template v-slot:item.survey_agent.phone_number="{ item }">
        {{ safeDisplay(item.survey_agent?.phone_number) }}
      </template>

      <template v-slot:item.details.location_details="{ item }">
        {{ safeDisplay(item.details?.location_details) }}
      </template>

      <template v-slot:item.details.address_details="{ item }">
        {{ safeDisplay(item.details?.address_details) }}
      </template>

      <template v-slot:item.location.lat="{ item }">
        {{ item.location ? fixLocation(item.location.lat) : 'N/A' }}
      </template>

      <template v-slot:item.location.lng="{ item }">
        {{ item.location ? fixLocation(item.location.lng) : 'N/A' }}
      </template>

      <template v-slot:item.owner_details.name_of_owner="{ item }">
        {{ safeDisplay(item.owner_details?.name_of_owner) }}
      </template>

      <template v-slot:item.owner_details.phone_number="{ item }">
        {{ safeDisplay(item.owner_details?.phone_number) }}
      </template>

      <template v-slot:item.purchase_details.date_of_purchase="{ item }">
        {{ item.purchase_details?.date_of_purchase ? getDate(item.purchase_details.date_of_purchase) : 'N/A' }}
      </template>

      <template v-slot:item.purchase_details.source_of_animals="{ item }">
        {{ safeDisplay(item.purchase_details?.source_of_animals) }}
      </template>

      <template v-slot:item.farm_practices.select_farming="{ item }">
        {{ safeDisplay(item.farm_practices?.select_farming) }}
      </template>

      <template v-slot:item.farm_practices.transhumance.animal_movement_from.state="{ item }">
        {{ safeDisplay(item.farm_practices?.transhumance?.animal_movement_from?.state) }}
      </template>

      <template v-slot:item.farm_practices.transhumance.animal_movement_from.local_govt="{ item }">
        {{ safeDisplay(item.farm_practices?.transhumance?.animal_movement_from?.local_govt) }}
      </template>

      <template v-slot:item.farm_practices.transhumance.animal_movement_from.name_of_location="{ item }">
        {{ safeDisplay(item.farm_practices?.transhumance?.animal_movement_from?.name_of_location) }}
      </template>

      <template v-slot:item.farm_practices.transhumance.animal_movement_to.state="{ item }">
        {{ safeDisplay(item.farm_practices?.transhumance?.animal_movement_to?.state) }}
      </template>

      <template v-slot:item.farm_practices.transhumance.animal_movement_to.local_govt="{ item }">
        {{ safeDisplay(item.farm_practices?.transhumance?.animal_movement_to?.local_govt) }}
      </template>

      <template v-slot:item.farm_practices.transhumance.animal_movement_to.name_of_location="{ item }">
        {{ safeDisplay(item.farm_practices?.transhumance?.animal_movement_to?.name_of_location) }}
      </template>

      <template v-slot:item.number_of_animals.total_animals="{ item }">
        {{ safeDisplay(item.number_of_animals?.total_animals) }}
      </template>

      <template v-slot:item.number_of_animals.cases="{ item }">
        {{ safeDisplay(item.number_of_animals?.cases) }}
      </template>

      <template v-slot:item.number_of_animals.deaths="{ item }">
        {{ safeDisplay(item.number_of_animals?.deaths) }}
      </template>

      <template v-slot:item.number_of_animals.destroyed="{ item }">
        {{ safeDisplay(item.number_of_animals?.destroyed) }}
      </template>

      <template v-slot:item.number_of_animals.recovered="{ item }">
        {{ safeDisplay(item.number_of_animals?.recovered) }}
      </template>

      <template v-slot:item.number_of_animals.slaughter="{ item }">
        {{ safeDisplay(item.number_of_animals?.slaughter) }}
      </template>

      <template v-slot:item.animal_details.species="{ item }">
        {{ safeDisplay(item.animal_details?.species) }}
      </template>

      <template v-slot:item.animal_details.sex="{ item }">
        {{ safeDisplay(item.animal_details?.sex) }}
      </template>

      <template v-slot:item.age="{ item }">
        {{ safeDisplay(item.age) }}
      </template>

      <template v-slot:item.clinical_signs="{ item }">
        {{ safeDisplay(item.clinical_signs) }}
      </template>

      <template v-slot:item.samples.sample_id="{ item }">
        {{ safeDisplay(item.samples?.sample_id) }}
      </template>

      <template v-slot:item.samples.sample_taken="{ item }">
        {{ safeDisplay(item.samples?.sample_taken) }}
      </template>

      <template v-slot:item.control_measures="{ item }">
        {{ safeDisplay(item.control_measures) }}
      </template>

      <template v-slot:item.report_date="{ item }">
        {{ item.report_date ? getDate(item.report_date) : 'N/A' }}
      </template>

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
    <suspicion-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></suspicion-decline-form>
  </div>
</template>

<style scoped src="./GenericDataTableStyles.css"></style>
