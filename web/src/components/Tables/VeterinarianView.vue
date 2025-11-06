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
  createSortedComputed
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

    const sortedVeterinarian = computed(createSortedComputed(veterinarian, sortBy))

    // Define table headers
    const headers = ref([
      { title: 'S/N', key: 'index', sortable: false, width: 60 },
      { title: 'Created Date', key: 'date', sortable: true, width: 140 },
      { title: 'Report State - LGA', key: 'state_lga', sortable: false, width: 180 },
      { title: 'Name of Clinic - Hospital', key: 'name_of_hospital', sortable: false, width: 220 },
      { title: 'Type of Report', key: 'type_of_report', sortable: false, width: 150 },
      { title: 'Location - Latitude', key: 'location.lat', sortable: false, width: 160 },
      { title: 'Location - Longitude', key: 'location.lng', sortable: false, width: 160 },
      { title: 'Disease Suspected', key: 'disease', sortable: false, width: 160 },
      { title: 'Other Diseases', key: 'other_diseases', sortable: false, width: 160 },
      { title: 'Type of Animal', key: 'species', sortable: false, width: 150 },
      { title: 'Age', key: 'age', sortable: false, width: 100 },
      { title: 'Sex', key: 'sex', sortable: false, width: 100 },
      { title: 'Address of Affected Farm', key: 'address_affected_farm', sortable: false, width: 220 },
      { title: 'Diagnosis', key: 'diagnosis', sortable: false, width: 150 },
      { title: 'Measures', key: 'measures', sortable: false, width: 150 },
      { title: 'Action', key: 'actions', sortable: false, width: 180 }
    ])

    watch(selected_category, () => {
      getVeterinarian()
    })
    watch(selected_state, () => {
      getVeterinarian()
    })
    watch(successful, () => {
      getVeterinarian()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getVeterinarian = () => {
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

      var values = {
        category: sort,
        state: selected_state.value,
        in_progress: progress
      }
      useVeterinarian().getVeterinarian(values)
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
        useVeterinarian().loadNextPage(values)
      }
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
      decline_form,
      doc_id,
      headers,
      itemsPerPage,
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
      handleBulkAction
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

    <!-- Vuetify Data Table -->
    <v-data-table
      v-model="selectedReports"
      v-model:items-per-page="itemsPerPage"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="sortedVeterinarian"
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
            All reports loaded ({{ veterinarian.length }} total)
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
