<script lang="ts">
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import useMonths from './../../composables/months'
import { useAquaculture } from './../../stores/aquaculture'
import AquacultureDeclineForm from './DeclineForm/AquacultureDeclineForm.vue'
import { useToast } from './../../composables/toast'
import { utils, writeFile } from 'xlsx'
import {
  BulkActionsToolbar,
  createFindStateFunction,
  createFixLocationFunction,
  createGetDateFunction,
  createSortedComputed
} from './GenericDataTableView.vue'

// Define TypeScript interface for Aquaculture report
interface AquacultureReport {
  doc_id: string
  created_at: number
  identifiers?: {
    name_of_farm?: string
    town?: string
    capacity?: string | number
    selected_species?: string
    my_coordinate?: {
      lat: number
      lng: number
    }
    owner_phone_number?: string
    registration_type?: string
    fish_farm_association?: boolean
    pond_type?: string
  }
  passive_surveillance?: {
    health_plan?: boolean
    vet_attend_to?: boolean
    practitioner_visit?: boolean
    fishes_on_farm?: string | number
    mortality_for_month?: string | number
    average_mortality_per_day?: string | number
  }
  water_quality?: {
    recent_quality_test?: boolean
    organic_material?: boolean
    algae_available?: boolean
    test_type?: string[]
    change_pond_water?: boolean
  }
  biosecurity_measures?: {
    selected_bio_measures?: Array<{ name: string }>
    aquatic_available?: boolean
  }
  disease_suspected?: {
    viral?: string
    bacterial?: string
    fungal?: string
    protozoan_parasitic?: string
    helminth_parasitic?: string
    leech_infestation?: string
    environmental_diseases?: string
    nutritional_diseases?: string
  }
  oie_listed_fish_pathogens?: Array<{ name: string }>
  approved: boolean
  finished: boolean
}

export default defineComponent({
  components: { AquacultureDeclineForm, BulkActionsToolbar },
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

    const reporter_state = computed(() => useAquaculture().reporter_state)
    const aquaculture = computed(() => useAquaculture().aquaculture as AquacultureReport[])
    const successful = computed(() => useAquaculture().successful)
    const loading = computed(() => useAquaculture().loading)
    const pagination = computed(() => useAquaculture().pagination)

    // Vuetify data table state
    const itemsPerPage = ref(20)
    const selectedReports = ref<AquacultureReport[]>([])
    const sortBy = ref<any[]>([{ key: 'created_at', order: 'desc' }])

    const sortedAquaculture = computed(createSortedComputed(aquaculture, sortBy))

    // Define table headers with exact column names from original
    const headers = ref([
      { title: 'S/N', key: 'index', sortable: false, width: 60 },
      { title: 'Created Date', key: 'created_at', sortable: true, width: 140 },
      { title: 'Report State - LGA', key: 'state_lga', sortable: false, width: 180 },
      { title: 'Name of Farm', key: 'identifiers.name_of_farm', sortable: false, width: 150 },
      { title: 'Region - Town/Village', key: 'identifiers.town', sortable: false, width: 180 },
      { title: 'Farm Capacity', key: 'identifiers.capacity', sortable: false, width: 140 },
      { title: 'Species', key: 'identifiers.selected_species', sortable: false, width: 140 },
      { title: 'Location - Latitude', key: 'identifiers.my_coordinate.lat', sortable: false, width: 160 },
      { title: 'Location - Longitute', key: 'identifiers.my_coordinate.lng', sortable: false, width: 160 },
      { title: 'Owner\'s Phone Number', key: 'identifiers.owner_phone_number', sortable: false, width: 180 },
      { title: 'Registration - Registered with Government?', key: 'identifiers.registration_type', sortable: false, width: 280 },
      { title: 'Registration - Registration Type', key: 'identifiers.registration_type_display', sortable: false, width: 240 },
      { title: 'Belong to Farmers Association?', key: 'identifiers.fish_farm_association', sortable: false, width: 240 },
      { title: 'Type of Pond', key: 'identifiers.pond_type', sortable: false, width: 140 },
      { title: 'Passive Surveillance - Any health plan', key: 'passive_surveillance.health_plan', sortable: false, width: 260 },
      { title: 'Passive Surveillance - Vets attends to the health of aquatic species', key: 'passive_surveillance.vet_attend_to', sortable: false, width: 420 },
      { title: 'Passive Surveillance - Health practitioner visits (bi-weekly)', key: 'passive_surveillance.practitioner_visit', sortable: false, width: 380 },
      { title: 'Passive Surveillance - Fishes on the farm?', key: 'passive_surveillance.fishes_on_farm', sortable: false, width: 280 },
      { title: 'Passive Surveillance - Mortality for the month', key: 'passive_surveillance.mortality_for_month', sortable: false, width: 300 },
      { title: 'Passive Surveillance - Average mortality per day', key: 'passive_surveillance.average_mortality_per_day', sortable: false, width: 320 },
      { title: 'Water Quality - Recent Test', key: 'water_quality.recent_quality_test', sortable: false, width: 200 },
      { title: 'Water Quality - Contains organic materials and food debris?', key: 'water_quality.organic_material', sortable: false, width: 380 },
      { title: 'Water Quality - Has Phytoplankton and algae available', key: 'water_quality.algae_available', sortable: false, width: 360 },
      { title: 'Water Quality - Type of test normally done', key: 'water_quality.test_type', sortable: false, width: 300 },
      { title: 'Water Quality - Change pond water', key: 'water_quality.change_pond_water', sortable: false, width: 260 },
      { title: 'Biosecurity Measures - Measures Seen', key: 'biosecurity_measures.selected_bio_measures', sortable: false, width: 280 },
      { title: 'Biosecurity Measures - Other aquatic within 1km', key: 'biosecurity_measures.aquatic_available', sortable: false, width: 320 },
      { title: 'Diseases Suspected - Viral', key: 'disease_suspected.viral', sortable: false, width: 200 },
      { title: 'Diseases Suspected - Bacterial', key: 'disease_suspected.bacterial', sortable: false, width: 220 },
      { title: 'Diseases Suspected - Fungal', key: 'disease_suspected.fungal', sortable: false, width: 200 },
      { title: 'Diseases Suspected - Protozoan parasitic', key: 'disease_suspected.protozoan_parasitic', sortable: false, width: 280 },
      { title: 'Diseases Suspected - Helminth parasitic', key: 'disease_suspected.helminth_parasitic', sortable: false, width: 280 },
      { title: 'Diseases Suspected - Leech parasitic', key: 'disease_suspected.leech_infestation', sortable: false, width: 260 },
      { title: 'Diseases Suspected - Environmental diseases', key: 'disease_suspected.environmental_diseases', sortable: false, width: 320 },
      { title: 'Diseases Suspected - Nutritional diseases', key: 'disease_suspected.nutritional_diseases', sortable: false, width: 320 },
      { title: 'OIE listed fish pathogens (2020)', key: 'oie_listed_fish_pathogens', sortable: false, width: 260 },
      { title: 'Action', key: 'actions', sortable: false, width: 180 }
    ])

    watch(selected_category, () => {
      getAqauculture()
    })
    watch(selected_state, () => {
      getAqauculture()
    })
    watch(successful, () => {
      getAqauculture()
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
        useAquaculture().loadNextPage(values)
      }
    }

    const getDate = createGetDateFunction(months)
    const fixLocation = createFixLocationFunction()

    const performAction = (action: string, docId: string) => {
      if (action === 'in_progress') {
        useAquaculture().in_progress(docId)
      } else if (action === 'approve') {
        useAquaculture().approve(docId)
      } else if (action === 'pending') {
        useAquaculture().pending(docId)
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
    const findState = createFindStateFunction(reporter_state)

    // Bulk actions
    const handleBulkAction = async (action: string) => {
      if (selectedReports.value.length === 0) {
        warning('Please select at least one report')
        return
      }

      const docIds = selectedReports.value.map(report => report.doc_id)
      const result = await useAquaculture().bulkUpdateStatus(docIds, action as any)

      if (result.success.length > 0) {
        success(`Successfully updated ${result.success.length} reports`)
        selectedReports.value = []
        getAqauculture()
      }

      if (result.failed.length > 0) {
        error(`Failed to update ${result.failed.length} reports`)
      }
    }

    onMounted(() => {
      getAqauculture()
    })

    return {
      aquaculture,
      sortedAquaculture,
      decline_form,
      doc_id,
      headers,
      itemsPerPage,
      selectedReports,
      sortBy,
      loading,
      pagination,
      loadNextPage,
      performAction,
      handleBulkAction,
      getAqauculture,
      closeModal,
      getDate,
      findState,
      fixLocation
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
      :items="sortedAquaculture"
      :loading="loading"
      show-select
      return-object
      item-value="doc_id"
      class="elevation-1"
      fixed-header
      height="600px"
    >
      <!-- S/N Column -->
      <template v-slot:item.index="{ index }">
        {{ index + 1 }}
      </template>

      <!-- Created Date Column -->
      <template v-slot:item.created_at="{ item }">
        {{ getDate(item.created_at) }}
      </template>

      <!-- State / LGA Column -->
      <template v-slot:item.state_lga="{ item }">
        {{ findState(item.doc_id).state }} / {{ findState(item.doc_id).local_govt }}
      </template>

      <!-- Identifiers - Name of Farm -->
      <template v-slot:item.identifiers.name_of_farm="{ item }">
        {{ item.identifiers?.name_of_farm || '' }}
      </template>

      <!-- Identifiers - Town -->
      <template v-slot:item.identifiers.town="{ item }">
        {{ item.identifiers?.town || '' }}
      </template>

      <!-- Identifiers - Capacity -->
      <template v-slot:item.identifiers.capacity="{ item }">
        {{ item.identifiers?.capacity || '' }}
      </template>

      <!-- Identifiers - Selected Species -->
      <template v-slot:item.identifiers.selected_species="{ item }">
        {{ item.identifiers?.selected_species || '' }}
      </template>

      <!-- Identifiers - Latitude -->
      <template v-slot:item.identifiers.my_coordinate.lat="{ item }">
        {{ item.identifiers?.my_coordinate ? fixLocation(item.identifiers.my_coordinate.lat) : '' }}
      </template>

      <!-- Identifiers - Longitude -->
      <template v-slot:item.identifiers.my_coordinate.lng="{ item }">
        {{ item.identifiers?.my_coordinate ? fixLocation(item.identifiers.my_coordinate.lng) : '' }}
      </template>

      <!-- Identifiers - Owner Phone Number -->
      <template v-slot:item.identifiers.owner_phone_number="{ item }">
        {{ item.identifiers?.owner_phone_number || '' }}
      </template>

      <!-- Identifiers - Registration Type (Yes/No) -->
      <template v-slot:item.identifiers.registration_type="{ item }">
        {{ item.identifiers ? (item.identifiers.registration_type == '' ? 'No' : 'Yes') : '' }}
      </template>

      <!-- Identifiers - Registration Type Display -->
      <template v-slot:item.identifiers.registration_type_display="{ item }">
        {{ item.identifiers ? (item.identifiers.registration_type == '' ? 'None' : item.identifiers.registration_type) : '' }}
      </template>

      <!-- Identifiers - Fish Farm Association -->
      <template v-slot:item.identifiers.fish_farm_association="{ item }">
        {{ item.identifiers ? (item.identifiers.fish_farm_association == false ? 'No' : 'Yes') : '' }}
      </template>

      <!-- Identifiers - Pond Type -->
      <template v-slot:item.identifiers.pond_type="{ item }">
        {{ item.identifiers?.pond_type || '' }}
      </template>

      <!-- Passive Surveillance - Health Plan -->
      <template v-slot:item.passive_surveillance.health_plan="{ item }">
        {{ item.passive_surveillance ? (item.passive_surveillance.health_plan ? 'Yes' : 'No Health Plan') : '' }}
      </template>

      <!-- Passive Surveillance - Vet Attend To -->
      <template v-slot:item.passive_surveillance.vet_attend_to="{ item }">
        {{ item.passive_surveillance ? (item.passive_surveillance.vet_attend_to ? 'Yes' : 'No') : '' }}
      </template>

      <!-- Passive Surveillance - Practitioner Visit -->
      <template v-slot:item.passive_surveillance.practitioner_visit="{ item }">
        {{ item.passive_surveillance ? (item.passive_surveillance.practitioner_visit ? 'Yes' : 'No') : '' }}
      </template>

      <!-- Passive Surveillance - Fishes on Farm -->
      <template v-slot:item.passive_surveillance.fishes_on_farm="{ item }">
        {{ item.passive_surveillance?.fishes_on_farm || '' }}
      </template>

      <!-- Passive Surveillance - Mortality for Month -->
      <template v-slot:item.passive_surveillance.mortality_for_month="{ item }">
        {{ item.passive_surveillance?.mortality_for_month || '' }}
      </template>

      <!-- Passive Surveillance - Average Mortality Per Day -->
      <template v-slot:item.passive_surveillance.average_mortality_per_day="{ item }">
        {{ item.passive_surveillance?.average_mortality_per_day || '' }}
      </template>

      <!-- Water Quality - Recent Quality Test -->
      <template v-slot:item.water_quality.recent_quality_test="{ item }">
        {{ item.water_quality ? (item.water_quality.recent_quality_test ? 'Yes' : 'No') : '' }}
      </template>

      <!-- Water Quality - Organic Material -->
      <template v-slot:item.water_quality.organic_material="{ item }">
        {{ item.water_quality ? (item.water_quality.organic_material ? 'Yes' : 'No') : '' }}
      </template>

      <!-- Water Quality - Algae Available -->
      <template v-slot:item.water_quality.algae_available="{ item }">
        {{ item.water_quality ? (item.water_quality.algae_available ? 'Yes' : 'No') : '' }}
      </template>

      <!-- Water Quality - Test Type -->
      <template v-slot:item.water_quality.test_type="{ item }">
        <span v-if="item.water_quality?.test_type && Array.isArray(item.water_quality.test_type)">
          {{ item.water_quality.test_type.join(', ') }}
        </span>
        <span v-else-if="item.water_quality?.test_type">
          {{ item.water_quality.test_type }}
        </span>
      </template>

      <!-- Water Quality - Change Pond Water -->
      <template v-slot:item.water_quality.change_pond_water="{ item }">
        {{ item.water_quality ? (item.water_quality.change_pond_water ? 'Yes' : 'No') : '' }}
      </template>

      <!-- Biosecurity Measures - Selected Bio Measures -->
      <template v-slot:item.biosecurity_measures.selected_bio_measures="{ item }">
        <v-select
          v-if="item.biosecurity_measures?.selected_bio_measures?.length"
          :items="item.biosecurity_measures.selected_bio_measures.map((m: any) => m.name)"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
        <span v-else>-</span>
      </template>

      <!-- Biosecurity Measures - Aquatic Available -->
      <template v-slot:item.biosecurity_measures.aquatic_available="{ item }">
        {{ item.biosecurity_measures ? (item.biosecurity_measures.aquatic_available ? 'Yes' : 'No') : '' }}
      </template>

      <!-- Disease Suspected - Viral -->
      <template v-slot:item.disease_suspected.viral="{ item }">
        {{ item.disease_suspected?.viral || '' }}
      </template>

      <!-- Disease Suspected - Bacterial -->
      <template v-slot:item.disease_suspected.bacterial="{ item }">
        {{ item.disease_suspected?.bacterial || '' }}
      </template>

      <!-- Disease Suspected - Fungal -->
      <template v-slot:item.disease_suspected.fungal="{ item }">
        {{ item.disease_suspected?.fungal || '' }}
      </template>

      <!-- Disease Suspected - Protozoan Parasitic -->
      <template v-slot:item.disease_suspected.protozoan_parasitic="{ item }">
        {{ item.disease_suspected?.protozoan_parasitic || '' }}
      </template>

      <!-- Disease Suspected - Helminth Parasitic -->
      <template v-slot:item.disease_suspected.helminth_parasitic="{ item }">
        {{ item.disease_suspected?.helminth_parasitic || '' }}
      </template>

      <!-- Disease Suspected - Leech Infestation -->
      <template v-slot:item.disease_suspected.leech_infestation="{ item }">
        {{ item.disease_suspected?.leech_infestation || '' }}
      </template>

      <!-- Disease Suspected - Environmental Diseases -->
      <template v-slot:item.disease_suspected.environmental_diseases="{ item }">
        {{ item.disease_suspected?.environmental_diseases || '' }}
      </template>

      <!-- Disease Suspected - Nutritional Diseases -->
      <template v-slot:item.disease_suspected.nutritional_diseases="{ item }">
        {{ item.disease_suspected?.nutritional_diseases || '' }}
      </template>

      <!-- OIE Listed Fish Pathogens -->
      <template v-slot:item.oie_listed_fish_pathogens="{ item }">
        <v-select
          v-if="item.oie_listed_fish_pathogens?.length"
          :items="item.oie_listed_fish_pathogens.map((p: any) => p.name)"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
        <span v-else>-</span>
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

      <!-- Bottom Slot with Load More Button -->
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
            All reports loaded ({{ aquaculture.length }} total)
          </div>
        </div>
      </template>
    </v-data-table>

    <!-- Decline Form Modal -->
    <aquaculture-decline-form
      v-if="decline_form"
      :full="full"
      :doc_id="doc_id"
      @open-form="closeModal"
    ></aquaculture-decline-form>
  </div>
</template>

<style scoped src="./GenericDataTableStyles.css"></style>
<style scoped>
:deep(.v-data-table) {
  background-color: white;
}

:deep(.v-data-table__th) {
  background-color: white !important;
}

:deep(.v-table__wrapper) {
  background-color: white;
}
</style>
