<script lang="ts">
import { useVaccination } from './../../stores/vaccination'
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import VaccinationDeclineForm from './DeclineForm/VaccinationDeclineForm.vue'
import useMonths from './../../composables/months'
import { useToast } from './../../composables/toast'
import { utils, writeFile } from 'xlsx'
import {
  BulkActionsToolbar,
  createFindStateFunction,
  createFixLocationFunction,
  createGetDateFunction,
  createSortedComputed
} from './GenericDataTableView.vue'

// Define TypeScript interface for Vaccination report
interface VaccinationReport {
  doc_id: string
  created_at: number
  disease?: {
    disease_name?: string
    vaccination_type?: string
    vaccination_number?: string | number
  }
  other_diseases?: string
  vaccination?: {
    batch_no?: string
    expiry_date?: number
    source?: string
    animal_name?: string
    animal_type?: string
    vaccine_name?: string
    vaccine_type?: string
  }
  location?: {
    lat: number
    lng: number
  }
  approved: boolean
  finished: boolean
}

export default defineComponent({
  components: { VaccinationDeclineForm, BulkActionsToolbar },
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

    const reporter_state = computed(() => useVaccination().reporter_state)
    const vaccination = computed(() => useVaccination().vaccination as VaccinationReport[])
    const successful = computed(() => useVaccination().successful)
    const loading = computed(() => useVaccination().loading)
    const pagination = computed(() => useVaccination().pagination)

    // Vuetify data table state
    const itemsPerPage = ref(20)
    const selectedReports = ref<VaccinationReport[]>([])
    const sortBy = ref<any[]>([{ key: 'created_at', order: 'desc' }])

    const sortedVaccination = computed(createSortedComputed(vaccination, sortBy))

    // Define table headers with wider widths for long column names
    const headers = ref([
      { title: 'S/N', key: 'index', sortable: false, width: 60 },
      { title: 'Created Date', key: 'created_at', sortable: true, width: 140 },
      { title: 'Report State - LGA', key: 'state_lga', sortable: false, width: 180 },
      { title: 'Disease - Disease Name', key: 'disease.disease_name', sortable: false, width: 200 },
      { title: 'Disease - Vaccination Type', key: 'disease.vaccination_type', sortable: false, width: 220 },
      { title: 'Disease - Vaccination Number', key: 'disease.vaccination_number', sortable: false, width: 230 },
      { title: 'Other Diseases', key: 'other_diseases', sortable: false, width: 160 },
      { title: 'Vaccination - Batch Number', key: 'vaccination.batch_no', sortable: false, width: 220 },
      { title: 'Vaccination - Expiry Date', key: 'vaccination.expiry_date', sortable: false, width: 210 },
      { title: 'Vaccination - Source', key: 'vaccination.source', sortable: false, width: 180 },
      { title: 'Vaccination - Animal Name', key: 'vaccination.animal_name', sortable: false, width: 210 },
      { title: 'Vaccination - Animal Type', key: 'vaccination.animal_type', sortable: false, width: 210 },
      { title: 'Vaccination - Vaccine Name', key: 'vaccination.vaccine_name', sortable: false, width: 220 },
      { title: 'Vaccination - Vaccine Type', key: 'vaccination.vaccine_type', sortable: false, width: 220 },
      { title: 'Location - Lat', key: 'location.lat', sortable: false, width: 130 },
      { title: 'Location - Lng', key: 'location.lng', sortable: false, width: 130 },
      { title: 'Action', key: 'actions', sortable: false, width: 180 }
    ])

    watch(selected_category, () => {
      getVaccination()
    })
    watch(selected_state, () => {
      getVaccination()
    })
    watch(successful, () => {
      getVaccination()
    })
    watch(export_to_excel, () => {
      exportTableToExcel()
    })

    const getVaccination = () => {
      let sort = true
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

      if (selected_state.value != undefined && selected_state.value != '') {
        const values = {
          category: sort,
          state: selected_state.value,
          in_progress: progress
        }
        useVaccination().getVaccination(values)
      }
    }

    const loadNextPage = () => {
      let sort = true
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
        useVaccination().loadNextPage(values)
      }
    }

    const getDate = createGetDateFunction(months)
    const fixLocation = createFixLocationFunction()

    const performAction = (action: string, docId: string) => {
      if (action === 'in_progress') {
        useVaccination().in_progress(docId)
      } else if (action === 'approve') {
        useVaccination().approve(docId)
      } else if (action === 'pending') {
        useVaccination().pending(docId)
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

        const exportData = await useVaccination().exportVaccination(filters)

        if (exportData.length === 0) {
          warning('No vaccination reports found matching your selected filters. Try adjusting your date range or filters.')
          return
        }

        const headers = [
          'Date Reported',
          'State',
          'LGA',
          'Species',
          'Vaccine Name',
          'Number Vaccinated',
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
            item.vaccine_name || 'N/A',
            item.no_vaccinated || 0,
            item.approved ? 'Approved' : (item.finished ? 'Pending' : 'In Progress'),
            item.reporter_name || 'N/A'
          ]
        })

        const worksheetData = [headers, ...rows]

        let baseFilename = `${selected_category.value || 'All'}_Vaccination_Reports`
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
                <title>Vaccination Reports</title>
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
                  <h2>Vaccination Reports - ${selected_category.value || 'All'}</h2>
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
          utils.book_append_sheet(workbook, worksheet, 'Vaccination Reports')
          writeFile(workbook, `${baseFilename}.xlsx`)
        }

        success(`Successfully exported ${exportData.length} vaccination reports to ${format === 'csv' ? 'CSV' : format === 'pdf' ? 'PDF' : 'Excel'}.`)
      } catch (exportError) {
        console.error('Error exporting vaccination data:', exportError)
        error('Failed to export vaccination reports. Please try again or contact support if the issue persists.')
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
      const result = await useVaccination().bulkUpdateStatus(docIds, action as any)

      if (result.success.length > 0) {
        success(`Successfully updated ${result.success.length} reports`)
        selectedReports.value = []
        getVaccination()
      }

      if (result.failed.length > 0) {
        error(`Failed to update ${result.failed.length} reports`)
      }
    }

    onMounted(() => {
      getVaccination()
    })

    return {
      vaccination,
      sortedVaccination,
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
      :items="sortedVaccination"
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

      <!-- Disease Name -->
      <template v-slot:item.disease.disease_name="{ item }">
        {{ item.disease?.disease_name || 'N/A' }}
      </template>

      <!-- Vaccination Type -->
      <template v-slot:item.disease.vaccination_type="{ item }">
        {{ item.disease?.vaccination_type || 'N/A' }}
      </template>

      <!-- Vaccination Number -->
      <template v-slot:item.disease.vaccination_number="{ item }">
        {{ item.disease?.vaccination_number || 'N/A' }}
      </template>

      <!-- Batch Number -->
      <template v-slot:item.vaccination.batch_no="{ item }">
        {{ item.vaccination?.batch_no || 'N/A' }}
      </template>

      <!-- Expiry Date -->
      <template v-slot:item.vaccination.expiry_date="{ item }">
        {{ item.vaccination?.expiry_date ? getDate(item.vaccination.expiry_date) : 'N/A' }}
      </template>

      <!-- Source -->
      <template v-slot:item.vaccination.source="{ item }">
        {{ item.vaccination?.source || 'N/A' }}
      </template>

      <!-- Animal Name -->
      <template v-slot:item.vaccination.animal_name="{ item }">
        {{ item.vaccination?.animal_name || 'N/A' }}
      </template>

      <!-- Animal Type -->
      <template v-slot:item.vaccination.animal_type="{ item }">
        {{ item.vaccination?.animal_type || 'N/A' }}
      </template>

      <!-- Vaccine Name -->
      <template v-slot:item.vaccination.vaccine_name="{ item }">
        {{ item.vaccination?.vaccine_name || 'N/A' }}
      </template>

      <!-- Vaccine Type -->
      <template v-slot:item.vaccination.vaccine_type="{ item }">
        {{ item.vaccination?.vaccine_type || 'N/A' }}
      </template>

      <!-- Location Latitude -->
      <template v-slot:item.location.lat="{ item }">
        {{ item.location ? fixLocation(item.location.lat) : 'N/A' }}
      </template>

      <!-- Location Longitude -->
      <template v-slot:item.location.lng="{ item }">
        {{ item.location ? fixLocation(item.location.lng) : 'N/A' }}
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
            All reports loaded ({{ vaccination.length }} total)
          </div>
        </div>
      </template>
    </v-data-table>

    <!-- Decline Form Modal -->
    <vaccination-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></vaccination-decline-form>
  </div>
</template>

<style scoped src="./GenericDataTableStyles.css"></style>
