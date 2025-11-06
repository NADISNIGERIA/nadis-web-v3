<script lang="ts">
import { useOutbreak } from './../../stores/outbreak'
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import OutbreakDeclineForm from './DeclineForm/OutbreakDeclineForm.vue'
import BulkEditModal from './../BulkEditModal.vue'
import useMonths from './../../composables/months'
import { useToast } from './../../composables/toast'
import { utils, writeFile } from 'xlsx'

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
  components: { OutbreakDeclineForm, BulkEditModal },
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
    const showStatusDropdown = ref(false)
    const { success, error, warning } = useToast()

    const reporter_state = computed(() => useOutbreak().reporter_state)
    const outbreak = computed(() => useOutbreak().outbreak as OutbreakReport[])
    const successful = computed(() => useOutbreak().successful)
    const loading = computed(() => useOutbreak().loading)
    const pagination = computed(() => useOutbreak().pagination)

    // Sorted outbreak data
    const sortedOutbreak = computed(() => {
      if (!sortBy.value || sortBy.value.length === 0) {
        return outbreak.value
      }

      const sorted = [...outbreak.value]
      const sortConfig = sortBy.value[0]

      return sorted.sort((a: any, b: any) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        // Handle nested properties (e.g., 'location.lat')
        if (sortConfig.key.includes('.')) {
          const keys = sortConfig.key.split('.')
          aVal = keys.reduce((obj: any, key: any) => obj?.[key], a)
          bVal = keys.reduce((obj: any, key: any) => obj?.[key], b)
        }

        // Handle undefined/null values
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return 1
        if (bVal == null) return -1

        // Compare values
        let comparison = 0
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal)
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal
        } else {
          comparison = String(aVal).localeCompare(String(bVal))
        }

        return sortConfig.order === 'asc' ? comparison : -comparison
      })
    })

    // Vuetify data table state
    const itemsPerPage = ref(20)
    const selectedReports = ref<OutbreakReport[]>([])
    const sortBy = ref<any[]>([{ key: 'created_at', order: 'desc' }])

    // Define table headers with wider widths for long column names
    const headers = ref([
      { title: 'S/N', key: 'index', sortable: false, width: 60 },
      { title: 'Created Date', key: 'created_at', sortable: true, width: 140 },
      { title: 'Report State - LGA', key: 'state_lga', sortable: false, width: 180 },
      { title: 'Disease Suspected', key: 'disease_name', sortable: true, width: 180 },
      { title: 'Outbreak Type', key: 'outbreak_type', sortable: true, width: 150 },
      { title: 'Outbreak Number', key: 'outbreak_num', sortable: false, width: 150 },
      { title: 'Other Diseases', key: 'other_diseases', sortable: false, width: 180 },
      { title: 'Is it a cluster?', key: 'cluster_type', sortable: false, width: 140 },
      { title: 'Total Cluster', key: 'cluster', sortable: false, width: 130 },
      { title: 'Dates - Occurred', key: 'date.occurred', sortable: false, width: 150 },
      { title: 'Dates - Reported', key: 'date.reported', sortable: false, width: 150 },
      { title: 'Dates - Investigated', key: 'date.investigated', sortable: false, width: 170 },
      { title: 'Dates - Final Diagnosis', key: 'date.final_diagnosis', sortable: false, width: 180 },
      { title: 'Locality (Facility) - Type', key: 'localty.facility_type', sortable: false, width: 200 },
      { title: 'Locality (Facility) - Name', key: 'localty.facility_name', sortable: false, width: 200 },
      { title: 'Location - Lat', key: 'location.lat', sortable: false, width: 130 },
      { title: 'Location - Lng', key: 'location.lng', sortable: false, width: 130 },
      { title: 'Animals Affected - Species Name', key: 'species.species_name', sortable: false, width: 220 },
      { title: 'Animals Affected - Species Type', key: 'species.species_type', sortable: false, width: 220 },
      { title: 'Age Group in weeks', key: 'age', sortable: false, width: 160 },
      { title: 'Sex', key: 'sex', sortable: false, width: 80 },
      { title: 'Production System', key: 'production_system', sortable: false, width: 170 },
      { title: 'Control Means', key: 'control_means', sortable: false, width: 200 },
      { title: 'Basis for Diagnosis', key: 'basis_for_diagnosis', sortable: false, width: 180 },
      { title: 'Animals Susceptible', key: 'number_of_animals.total_animals', sortable: false, width: 180 },
      { title: 'Number of Animals - Cases', key: 'number_of_animals.cases', sortable: false, width: 200 },
      { title: 'Number of Animals - Deaths', key: 'number_of_animals.deaths', sortable: false, width: 200 },
      { title: 'Number of Animals - Slaughter', key: 'number_of_animals.slaughter', sortable: false, width: 220 },
      { title: 'Number of Animals - Recovered', key: 'number_of_animals.recovered', sortable: false, width: 220 },
      { title: 'Number of Animals - Destroyed', key: 'number_of_animals.destroyed', sortable: false, width: 220 },
      { title: 'Outbreak Stopped', key: 'was_outbreak_stopped', sortable: false, width: 160 },
      { title: 'Vaccination Type', key: 'vaccination.vaccination_type', sortable: false, width: 170 },
      { title: 'Vaccination - Vaccination Number', key: 'vaccination.vaccination_number', sortable: false, width: 240 },
      { title: 'Vaccination - Source', key: 'vaccination.source', sortable: false, width: 180 },
      { title: 'Vaccination - Batch Number', key: 'vaccination.batch_no', sortable: false, width: 220 },
      { title: 'Expiry Date', key: 'vaccination.expiry_date', sortable: false, width: 140 },
      { title: 'Vaccination - Was Vaccinated', key: 'vaccination.was_vaccinated', sortable: false, width: 220 },
      { title: 'Action', key: 'actions', sortable: false, width: 180 }
    ])

    watch(selected_category, () => {
      getOutbreak()
    })
    watch(selected_state, () => {
      getOutbreak()
    })
    watch(successful, () => {
      getOutbreak()
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

    const getDate = (val: any) => {
      if (!val) return 'N/A'
      const month = new Date(val).getMonth()
      const day = new Date(val).getDate()
      const year = new Date(val).getFullYear()
      return months.value[month].short + ' ' + day + ', ' + year
    }

    const fixLocation = (val: any) => {
      if (val !== undefined) {
        return val.toFixed(6)
      } else {
        return 'N/A'
      }
    }

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

    const findState = (doc_id: string) => {
      const found_reporter = reporter_state.value.find(
        (reporter: any) => reporter.doc_id === doc_id
      )
      if (found_reporter != undefined) {
        return found_reporter.state_lga
      } else {
        return { state: 'null', local_govt: 'null' }
      }
    }

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
      getOutbreak()
    })

    return {
      outbreak,
      sortedOutbreak,
      decline_form,
      doc_id,
      headers,
      itemsPerPage,
      selectedReports,
      sortBy,
      showStatusDropdown,
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
    <!-- Bulk Actions Toolbar -->
    <div v-if="selectedReports.length > 0" class="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
      <span class="text-sm font-medium text-blue-900">
        {{ selectedReports.length }} report(s) selected
      </span>
      <div class="flex gap-2 relative">
        <div class="relative">
          <button
            @click="showStatusDropdown = !showStatusDropdown"
            class="px-4 py-2 bg-primary hover:bg-primary-2 text-white rounded text-sm flex items-center gap-2"
          >
            Edit Status
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <!-- Dropdown Menu -->
          <div
            v-if="showStatusDropdown"
            class="absolute top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-full"
          >
            <button
              @click="handleBulkAction('pending'); showStatusDropdown = false"
              class="w-full text-left px-4 py-2 text-sm hover:bg-yellow-50 text-gray-700 flex items-center gap-2"
            >
              <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
              Set to Pending
            </button>
            <button
              @click="handleBulkAction('in_progress'); showStatusDropdown = false"
              class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 flex items-center gap-2"
            >
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              Set to In Progress
            </button>
            <button
              @click="handleBulkAction('approved'); showStatusDropdown = false"
              class="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-gray-700 flex items-center gap-2"
            >
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              Set to Approved
            </button>
          </div>
        </div>
        <button
          @click="selectedReports = []"
          class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm"
        >
          Clear Selection
        </button>
      </div>
    </div>

    <!-- Vuetify Data Table -->
    <v-data-table
      v-model="selectedReports"
      v-model:items-per-page="itemsPerPage"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="sortedOutbreak"
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
            All reports loaded ({{ outbreak.length }} total)
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

<style scoped>
/* Vuetify table customizations */
:deep(.v-data-table) {
  font-size: 0.875rem;
  background-color: #EEFEF6;
}

:deep(.v-data-table-header) {
  background-color: #EEFEF6 !important;
}

:deep(.v-data-table__td) {
  padding: 8px 12px !important;
  background-color: #EEFEF6 !important;
}

:deep(.v-data-table__th) {
  padding: 12px !important;
  font-weight: 600 !important;
  color: #374151 !important;
  background-color: #EEFEF6 !important;
}

:deep(thead) {
  background-color: #EEFEF6 !important;
}

:deep(thead tr) {
  background-color: #EEFEF6 !important;
}

:deep(thead th) {
  background-color: #EEFEF6 !important;
}

:deep(.v-table__wrapper) {
  overflow-x: auto;
  background-color: #EEFEF6;
}

:deep(.v-data-table__tr) {
  background-color: #EEFEF6;
}

:deep(.v-data-table__tr:hover) {
  background-color: #d9f5e8 !important;
}
</style>
