<script lang="ts">
import { useOutbreak } from './../../stores/outbreak'
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import OutbreakDeclineForm from './DeclineForm/OutbreakDeclineForm.vue'
import BulkEditModal from './../BulkEditModal.vue'
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

// Define TypeScript interface for Outbreak report
interface OutbreakReport {
  doc_id: string
  created_at: number
  disease_name?: string
  outbreak_type?: string
  outbreak_num?: string | number
  other_diseases?: string
  cluster_type?: string
  cluster?: string | number
  date?: {
    occurred?: number
    reported?: number
    investigated?: number
    final_diagnosis?: number
  }
  localty?: {
    facility_type?: string
    facility_name?: string
  }
  location?: {
    lat: number
    lng: number
  }
  species?: {
    species_name?: string
    species_type?: string
  }
  age?: string | number
  sex?: string
  production_system?: string
  control_means?: Array<{name: string}>
  basis_for_diagnosis?: string
  number_of_animals?: {
    total_animals?: number
    cases?: number
    deaths?: number
    slaughter?: number
    recovered?: number
    destroyed?: number
  }
  was_outbreak_stopped?: string
  vaccination?: {
    vaccination_type?: string
    vaccination_number?: string | number
    source?: string
    batch_no?: string
    expiry_date?: number
    was_vaccinated?: string
  }
  approved: boolean
  finished: boolean
}

export default defineComponent({
  components: { OutbreakDeclineForm, BulkEditModal, BulkActionsToolbar },
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

    const reporter_state = computed(() => useOutbreak().reporter_state)
    const outbreak = computed(() => useOutbreak().outbreak as OutbreakReport[])
    const successful = computed(() => useOutbreak().successful)
    const loading = computed(() => useOutbreak().loading)
    const pagination = computed(() => useOutbreak().pagination)

    // Vuetify data table state
    const itemsPerPage = ref(20)
    const currentPage = ref(1)
    const selectedReports = ref<OutbreakReport[]>([])
    const sortBy = ref<any[]>([{ key: 'created_at', order: 'desc' }])

    const sortedOutbreak = computed(createSortedComputed(outbreak, sortBy))

    // Column visibility control with priority-based filtering
    const columnVisibilityLevel = ref(2) // Start with essential view due to many columns
    const allColumns = [
      // Essential columns (priority 1-2)
      { title: 'S/N', key: 'index', sortable: false, width: 60, priority: 1 },
      { title: 'Created Date', key: 'created_at', sortable: true, width: 140, priority: 1 },
      { title: 'Report State - LGA', key: 'state_lga', sortable: false, width: 180, priority: 1 },
      { title: 'Disease Suspected', key: 'disease_name', sortable: true, width: 180, priority: 1 },
      { title: 'Action', key: 'actions', sortable: false, width: 180, priority: 1 },
      
      // Standard columns (priority 3)
      { title: 'Outbreak Type', key: 'outbreak_type', sortable: true, width: 150, priority: 2 },
      { title: 'Species Name', key: 'species.species_name', sortable: false, width: 180, priority: 2 },
      { title: 'Total Animals', key: 'number_of_animals.total_animals', sortable: false, width: 140, priority: 2 },
      { title: 'Cases', key: 'number_of_animals.cases', sortable: false, width: 120, priority: 2 },
      { title: 'Deaths', key: 'number_of_animals.deaths', sortable: false, width: 120, priority: 2 },
      
      // Detailed columns (priority 4)
      { title: 'Outbreak Number', key: 'outbreak_num', sortable: false, width: 150, priority: 3 },
      { title: 'Other Diseases', key: 'other_diseases', sortable: false, width: 180, priority: 3 },
      { title: 'Is it a cluster?', key: 'cluster_type', sortable: false, width: 140, priority: 3 },
      { title: 'Total Cluster', key: 'cluster', sortable: false, width: 130, priority: 3 },
      { title: 'Species Type', key: 'species.species_type', sortable: false, width: 160, priority: 3 },
      { title: 'Age Group (weeks)', key: 'age', sortable: false, width: 160, priority: 3 },
      { title: 'Sex', key: 'sex', sortable: false, width: 80, priority: 3 },
      { title: 'Production System', key: 'production_system', sortable: false, width: 170, priority: 3 },
      { title: 'Recovered', key: 'number_of_animals.recovered', sortable: false, width: 120, priority: 3 },
      { title: 'Slaughter', key: 'number_of_animals.slaughter', sortable: false, width: 120, priority: 3 },
      { title: 'Destroyed', key: 'number_of_animals.destroyed', sortable: false, width: 120, priority: 3 },
      
      // Complete columns (priority 5)
      { title: 'Date Occurred', key: 'date.occurred', sortable: false, width: 150, priority: 4 },
      { title: 'Date Reported', key: 'date.reported', sortable: false, width: 150, priority: 4 },
      { title: 'Date Investigated', key: 'date.investigated', sortable: false, width: 170, priority: 4 },
      { title: 'Final Diagnosis Date', key: 'date.final_diagnosis', sortable: false, width: 180, priority: 4 },
      { title: 'Facility Type', key: 'localty.facility_type', sortable: false, width: 160, priority: 4 },
      { title: 'Facility Name', key: 'localty.facility_name', sortable: false, width: 160, priority: 4 },
      { title: 'Location - Lat', key: 'location.lat', sortable: false, width: 130, priority: 4 },
      { title: 'Location - Lng', key: 'location.lng', sortable: false, width: 130, priority: 4 },
      { title: 'Control Means', key: 'control_means', sortable: false, width: 200, priority: 4 },
      { title: 'Basis for Diagnosis', key: 'basis_for_diagnosis', sortable: false, width: 180, priority: 4 },
      { title: 'Outbreak Stopped', key: 'was_outbreak_stopped', sortable: false, width: 160, priority: 4 },
      { title: 'Vaccination Type', key: 'vaccination.vaccination_type', sortable: false, width: 170, priority: 4 },
      { title: 'Vaccination Number', key: 'vaccination.vaccination_number', sortable: false, width: 180, priority: 4 },
      { title: 'Vaccination Source', key: 'vaccination.source', sortable: false, width: 150, priority: 4 },
      { title: 'Batch Number', key: 'vaccination.batch_no', sortable: false, width: 150, priority: 4 },
      { title: 'Expiry Date', key: 'vaccination.expiry_date', sortable: false, width: 140, priority: 4 },
      { title: 'Was Vaccinated', key: 'vaccination.was_vaccinated', sortable: false, width: 160, priority: 4 }
    ]

    const headers = computed(() => allColumns.filter(col => col.priority <= columnVisibilityLevel.value))

    watch(selected_category, () => {
      load()
    })
    watch(selected_state, () => {
      load()
    })
    watch(successful, () => {
      load()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getOutbreak = () => {
      let sort = 1
      let progress = false
      if (selected_category.value == 'Approved') {
        sort = 1
        progress = false
      } else if (selected_category.value == 'Pending') {
        sort = 0
        progress = false
      } else if (selected_category.value == 'In Progress') {
        sort = 0
        progress = true
      }

      const values = {
        category: sort,
        state: selected_state.value,
        in_progress: progress
      }
      useOutbreak().getOutbreak(values)
    }

    const loadNextPage = () => {
      let sort = 1
      let progress = false
      if (selected_category.value == 'Approved') {
        sort = 1
        progress = false
      } else if (selected_category.value == 'Pending') {
        sort = 0
        progress = false
      } else if (selected_category.value == 'In Progress') {
        sort = 0
        progress = true
      }

      const values = {
        category: sort,
        state: selected_state.value,
        in_progress: progress
      }

      if (pagination.value.hasMore && !loading.value) {
        useOutbreak().loadNextPage(values)
      }
    }

    const getDate = createGetDateFunction(months)
    const fixLocation = createFixLocationFunction()

    // Create computed ref for values to use with pagination handlers
    const currentValues = computed(() => {
      let sort = 1
      let progress = false
      if (selected_category.value == 'Approved') {
        sort = 1
        progress = false
      } else if (selected_category.value == 'Pending') {
        sort = 0
        progress = false
      } else if (selected_category.value == 'In Progress') {
        sort = 0
        progress = true
      }

      return {
        category: sort,
        state: selected_state.value,
        in_progress: progress
      }
    })

    // Create pagination handlers for traditional pagination
    const { handlePageChange, handlePageSizeChange } = createPaginationHandlers(
      useOutbreak(),
      currentValues
    )

    // Update load function to use page-based navigation
    const load = () => {
      currentPage.value = 1  // Reset to page 1 when loading new data
      useOutbreak().getOutbreakPage(currentValues.value, 1, itemsPerPage.value)
    }

    // Sync currentPage with store pagination
    watch(() => pagination.value.currentPage, (newPage) => {
      currentPage.value = newPage
    })

    // Sync itemsPerPage changes
    watch(itemsPerPage, (newSize) => {
      handlePageSizeChange(newSize)
    })

    const performAction = (action: string, docId: string) => {
      if (action === 'in_progress') {
        useOutbreak().in_progress(docId)
      } else if (action === 'approve') {
        useOutbreak().approve(docId)
      } else if (action === 'pending') {
        useOutbreak().pending(docId)
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

        const exportData = await useOutbreak().exportOutbreak(filters)

        if (exportData.length === 0) {
          warning('No outbreak reports found matching your selected filters. Try adjusting your date range or filters.')
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

        let baseFilename = `${selected_category.value || 'All'}_Outbreak_Reports`
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
                <title>Outbreak Reports</title>
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
                  <h2>Outbreak Reports - ${selected_category.value || 'All'}</h2>
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
          utils.book_append_sheet(workbook, worksheet, 'Outbreak Reports')
          writeFile(workbook, `${baseFilename}.xlsx`)
        }

        success(`Successfully exported ${exportData.length} outbreak reports to ${format === 'csv' ? 'CSV' : format === 'pdf' ? 'PDF' : 'Excel'}.`)
      } catch (exportError) {
        console.error('Error exporting outbreak data:', exportError)
        error('Failed to export outbreak reports. Please try again or contact support if the issue persists.')
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
      const result = await useOutbreak().bulkUpdateStatus(docIds, action as any)

      if (result.success.length > 0) {
        success(`Successfully updated ${result.success.length} reports`)
        selectedReports.value = []
        getOutbreak()
      }

      if (result.failed.length > 0) {
        error(`Failed to update ${result.failed.length} reports`)
      }
    }

    onMounted(() => {
      load()  // Use the new load function
    })

    return {
      outbreak,
      sortedOutbreak,
      decline_form,
      doc_id,
      headers,
      allColumns,
      columnVisibilityLevel,
      itemsPerPage,
      currentPage,
      selectedReports,
      sortBy,
      getDate,
      findState,
      fixLocation,
      closeModal,
      loading,
      pagination,
      loadNextPage,
      performAction,
      handleBulkAction,
      handlePageChange,
      handlePageSizeChange,
      load
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

    <!-- Vuetify Data Table with Traditional Pagination -->
    <v-data-table
      v-model="selectedReports"
      v-model:items-per-page="itemsPerPage"
      v-model:page="currentPage"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="sortedOutbreak"
      :loading="loading"
      :items-per-page-options="[10, 20, 50, 100]"
      :server-items-length="pagination.totalCount || sortedOutbreak.length"
      @update:page="handlePageChange"
      @update:items-per-page="handlePageSizeChange"
      show-select
      return-object
      item-value="doc_id"
      class="elevation-1 nadis-data-table"
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

      <!-- Date Occurred -->
      <template v-slot:item.date.occurred="{ item }">
        {{ item.date?.occurred ? getDate(item.date.occurred) : 'N/A' }}
      </template>

      <!-- Date Reported -->
      <template v-slot:item.date.reported="{ item }">
        {{ item.date?.reported ? getDate(item.date.reported) : 'N/A' }}
      </template>

      <!-- Date Investigated -->
      <template v-slot:item.date.investigated="{ item }">
        {{ item.date?.investigated ? getDate(item.date.investigated) : 'N/A' }}
      </template>

      <!-- Date Final Diagnosis -->
      <template v-slot:item.date.final_diagnosis="{ item }">
        {{ item.date?.final_diagnosis ? getDate(item.date.final_diagnosis) : 'N/A' }}
      </template>

      <!-- Facility Type -->
      <template v-slot:item.localty.facility_type="{ item }">
        {{ item.localty?.facility_type || 'N/A' }}
      </template>

      <!-- Facility Name -->
      <template v-slot:item.localty.facility_name="{ item }">
        {{ item.localty?.facility_name || 'N/A' }}
      </template>

      <!-- Location Latitude -->
      <template v-slot:item.location.lat="{ item }">
        {{ item.location ? fixLocation(item.location.lat) : 'N/A' }}
      </template>

      <!-- Location Longitude -->
      <template v-slot:item.location.lng="{ item }">
        {{ item.location ? fixLocation(item.location.lng) : 'N/A' }}
      </template>

      <!-- Species Name -->
      <template v-slot:item.species.species_name="{ item }">
        {{ item.species?.species_name || 'N/A' }}
      </template>

      <!-- Species Type -->
      <template v-slot:item.species.species_type="{ item }">
        {{ item.species?.species_type || 'N/A' }}
      </template>

      <!-- Control Means -->
      <template v-slot:item.control_means="{ item }">
        <v-select
          v-if="item.control_means?.length"
          :model-value="item.control_means[0]?.name"
          :items="item.control_means.map((c: any) => c.name)"
          density="default"
          variant="outlined"
          hide-details
        ></v-select>
        <span v-else>N/A</span>
      </template>

      <!-- Number of Animals - Total -->
      <template v-slot:item.number_of_animals.total_animals="{ item }">
        {{ item.number_of_animals?.total_animals || 'N/A' }}
      </template>

      <!-- Number of Animals - Cases -->
      <template v-slot:item.number_of_animals.cases="{ item }">
        {{ item.number_of_animals?.cases || 'N/A' }}
      </template>

      <!-- Number of Animals - Deaths -->
      <template v-slot:item.number_of_animals.deaths="{ item }">
        {{ item.number_of_animals?.deaths || 'N/A' }}
      </template>

      <!-- Number of Animals - Slaughter -->
      <template v-slot:item.number_of_animals.slaughter="{ item }">
        {{ item.number_of_animals?.slaughter || 'N/A' }}
      </template>

      <!-- Number of Animals - Recovered -->
      <template v-slot:item.number_of_animals.recovered="{ item }">
        {{ item.number_of_animals?.recovered || 'N/A' }}
      </template>

      <!-- Number of Animals - Destroyed -->
      <template v-slot:item.number_of_animals.destroyed="{ item }">
        {{ item.number_of_animals?.destroyed || 'N/A' }}
      </template>

      <!-- Vaccination Type -->
      <template v-slot:item.vaccination.vaccination_type="{ item }">
        {{ item.vaccination?.vaccination_type || 'N/A' }}
      </template>

      <!-- Vaccination Number -->
      <template v-slot:item.vaccination.vaccination_number="{ item }">
        {{ item.vaccination?.vaccination_number || 'N/A' }}
      </template>

      <!-- Vaccination Source -->
      <template v-slot:item.vaccination.source="{ item }">
        {{ item.vaccination?.source || 'N/A' }}
      </template>

      <!-- Batch Number -->
      <template v-slot:item.vaccination.batch_no="{ item }">
        {{ item.vaccination?.batch_no || 'N/A' }}
      </template>

      <!-- Expiry Date -->
      <template v-slot:item.vaccination.expiry_date="{ item }">
        {{ item.vaccination?.expiry_date ? getDate(item.vaccination.expiry_date) : 'N/A' }}
      </template>

      <!-- Was Vaccinated -->
      <template v-slot:item.vaccination.was_vaccinated="{ item }">
        {{ item.vaccination?.was_vaccinated || 'N/A' }}
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
    <outbreak-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></outbreak-decline-form>
  </div>
</template>

<style scoped src="./GenericDataTableStyles.css"></style>
