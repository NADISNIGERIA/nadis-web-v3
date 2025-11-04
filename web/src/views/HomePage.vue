<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
// import { useAuth } from '../stores/auth'
import { useCounter } from '../stores/counter'
import { useMortalityRate } from './../stores/mortality_rate'
import { useHome } from './../stores/home'
import { useMiddleware } from '../stores/middleware'
import AllMortality from '../components/Analytics/AllMortality.vue'
import OutbreakMortality from '../components/Analytics/OutbreakMortality.vue'
import SuspicionMortality from '../components/Analytics/SuspicionMortality.vue'
import AquacultureMortality from '../components/Analytics/AquacultureMortality.vue'
import StateSummary from '../components/Analytics/StateSummary.vue'
import MapMortality from '../components/Analytics/MapMortality.vue'
import FooterPage from '../components/FooterPage.vue'
import PagesTop from '../components/PagesTop.vue'
import DropArrowIcon from '../components/icons/DropArrowIcon.vue'
import { useDashboardUpdate } from '../stores/dashboard_update'

export default defineComponent({
  components: {
    AllMortality,
    OutbreakMortality,
    SuspicionMortality,
    AquacultureMortality,
    StateSummary,
    MapMortality,
    FooterPage,
    PagesTop,
    DropArrowIcon
  },
  setup(props, ctx) {
    const active_menu = ref(1)
    const rate_months = ref([])
    const bar_array = ref([])
    const bar_lengths = ref([])
    const aquaculture_mortality = ref([])
    const outbreak_mortality = ref([])
    const suspicion_mortality = ref([])
    // const isUserAlreadySignedIn = computed(() => useAuth().user.uid)

    // Role and state filtering
    const role = computed(() => useMiddleware().role)
    const selected_state = ref('All States')
    const show_state = ref(false)
    const search_state = ref('')
    
    // States list (same as in ReportsPage)
    const states = ref([
      {
        name: 'Abia State',
        id: 1
      },
      {
        name: 'Adamawa State',
        id: 2
      },
      {
        name: 'Akwa Ibom State',
        id: 3
      },
      {
        name: 'Anambra State',
        id: 4
      },
      {
        name: 'Bauchi State',
        id: 5
      },
      {
        name: 'Bayelsa State',
        id: 6
      },
      {
        name: 'Benue State',
        id: 7
      },
      {
        name: 'Borno State',
        id: 8
      },
      {
        name: 'Cross River State',
        id: 9
      },
      {
        name: 'Delta State',
        id: 10
      },
      {
        name: 'Ebonyi State',
        id: 11
      },
      {
        name: 'Edo State',
        id: 12
      },
      {
        name: 'Ekiti State',
        id: 13
      },
      {
        name: 'Enugu State',
        id: 14
      },
      {
        name: 'FCT',
        id: 15
      },
      {
        name: 'Gombe State',
        id: 16
      },
      {
        name: 'Imo State',
        id: 17
      },
      {
        name: 'Jigawa State',
        id: 18
      },
      {
        name: 'Kaduna State',
        id: 19
      },
      {
        name: 'Kano State',
        id: 20
      },
      {
        name: 'Katsina State',
        id: 21
      },
      {
        name: 'Kebbi State',
        id: 22
      },
      {
        name: 'Kogi State',
        id: 23
      },
      {
        name: 'Kwara State',
        id: 24
      },
      {
        name: 'Lagos State',
        id: 25
      },
      {
        name: 'Nasarawa State',
        id: 26
      },
      {
        name: 'Niger State',
        id: 27
      },
      {
        name: 'Ogun State',
        id: 28
      },
      {
        name: 'Ondo State',
        id: 29
      },
      {
        name: 'Osun State',
        id: 30
      },
      {
        name: 'Oyo State',
        id: 31
      },
      {
        name: 'Plateau State',
        id: 32
      },
      {
        name: 'Rivers State',
        id: 33
      },
      {
        name: 'Sokoto State',
        id: 34
      },
      {
        name: 'Taraba State',
        id: 35
      },
      {
        name: 'Yobe State',
        id: 36
      },
      {
        name: 'Zamfara State',
        id: 37
      }
    ])
    const abattoir = computed(() => useCounter().abattoir)
    const aquaculture = computed(() => useCounter().aquaculture)
    const laboratory = computed(() => useCounter().laboratory)
    const outbreak = computed(() => useCounter().outbreak)
    const suspicion = computed(() => useCounter().suspicion)
    const vaccination = computed(() => useCounter().vaccination)
    const veterinarian = computed(() => useCounter().veterinarian)
    
    const approved_abattoir = computed(() => useCounter().approved_abattoir)
    const approved_aquaculture = computed(() => useCounter().approved_aquaculture)
    const approved_laboratory = computed(() => useCounter().approved_laboratory)
    const approved_outbreak = computed(() => useCounter().approved_outbreak)
    const approved_suspicion = computed(() => useCounter().approved_suspicion)
    const approved_vaccination = computed(() => useCounter().approved_vaccination)
    const approved_veterinarian = computed(() => useCounter().approved_veterinarian)
    
    const pending_abattoir = computed(() => useCounter().pending_abattoir)
    const pending_aquaculture = computed(() => useCounter().pending_aquaculture)
    const pending_laboratory = computed(() => useCounter().pending_laboratory)
    const pending_outbreak = computed(() => useCounter().pending_outbreak)
    const pending_suspicion = computed(() => useCounter().pending_suspicion)
    const pending_vaccination = computed(() => useCounter().pending_vaccination)
    const pending_veterinarian = computed(() => useCounter().pending_veterinarian)
    
    const progress_abattoir = computed(() => useCounter().progress_abattoir)
    const progress_aquaculture = computed(() => useCounter().progress_aquaculture)
    const progress_laboratory = computed(() => useCounter().progress_laboratory)
    const progress_outbreak = computed(() => useCounter().progress_outbreak)
    const progress_suspicion = computed(() => useCounter().progress_suspicion)
    const progress_vaccination = computed(() => useCounter().progress_vaccination)
    const progress_veterinarian = computed(() => useCounter().progress_veterinarian)
    
    const officials = computed(() => useCounter().officials)
    const agents = computed(() => useCounter().agents)

    // Filtered states based on search
    const filteredStates = computed(() => {
      if (!search_state.value) {
        return states.value
      }
      return states.value.filter(state => 
        state.name.toLowerCase().includes(search_state.value.toLowerCase())
      )
    })

    // State filter functions
    const selectState = (index: any) => {
      if (index === 'All States') {
        selected_state.value = 'All States'
      } else {
        // Get state from filtered results
        const selectedState = filteredStates.value[index]
        if (selectedState) {
          selected_state.value = selectedState.name
        }
      }
      show_state.value = false
      search_state.value = '' // Reset search when selection is made
      loadDashboardData()
    }

    // Load dashboard data with state filter
    const loadDashboardData = () => {
      const stateFilter = selected_state.value === 'All States' ? undefined : selected_state.value
      useCounter().allCounterFiltered(stateFilter)
      useMortalityRate().outbreakMortalityFiltered(stateFilter)
      useMortalityRate().suspicionMortalityFiltered(stateFilter)
      useMortalityRate().aquacultureMortalityFiltered(stateFilter)
    }

    // Close dropdown when clicking outside
    const closeDropdown = () => {
      show_state.value = false
      search_state.value = ''
    }

    // Add click outside handler
    onMounted(() => {
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        if (!target.closest('.state-filter-dropdown')) {
          closeDropdown()
        }
      })
    })

    const rateMonths = (val: any) => {
      rate_months.value = val
    }
    const barArray = (val: any) => {
      bar_array.value = val
    }
    const barLengths = (val: any) => {
      bar_lengths.value = val
    }
    const aquacultureMortality = (val: any) => {
      aquaculture_mortality.value = val
    }
    const outbreakMortality = (val: any) => {
      outbreak_mortality.value = val
    }
    const suspicionMortality = (val: any) => {
      suspicion_mortality.value = val
    }

    // Watch for role changes to set appropriate state for non-Federal users
    watch(role, () => {
      const new_role = role.value.toLocaleLowerCase()
      if (new_role != 'federal') {
        // For non-Federal users, set their specific state and load filtered data
        // This assumes the user's state is available in their profile
        // For now, we'll load all data but could be enhanced to auto-select user's state
        selected_state.value = 'All States'
        loadDashboardData()
      }
    })

    onMounted(() => {
      ctx.emit('active-menu', active_menu.value)
      loadDashboardData()
      useDashboardUpdate().checkIfDashboardIsUpToDate()
      useHome().hasAccess()
    })

    return {
      abattoir,
      aquaculture,
      laboratory,
      outbreak,
      suspicion,
      vaccination,
      veterinarian,
      approved_abattoir,
      approved_aquaculture,
      approved_laboratory,
      approved_outbreak,
      approved_suspicion,
      approved_vaccination,
      approved_veterinarian,
      pending_abattoir,
      pending_aquaculture,
      pending_laboratory,
      pending_outbreak,
      pending_suspicion,
      pending_vaccination,
      pending_veterinarian,
      progress_abattoir,
      progress_aquaculture,
      progress_laboratory,
      progress_outbreak,
      progress_suspicion,
      progress_vaccination,
      progress_veterinarian,
      officials,
      agents,
      rate_months,
      bar_array,
      bar_lengths,
      aquaculture_mortality,
      outbreak_mortality,
      suspicion_mortality,
      outbreakMortality,
      suspicionMortality,
      rateMonths,
      barLengths,
      aquacultureMortality,
      barArray,
      // State filter variables
      role,
      selected_state,
      show_state,
      search_state,
      states,
      filteredStates,
      selectState,
      closeDropdown
    }
  }
})
</script>

<template>
  <div class="home">
    <pages-top :title="'Dashboard Overview'"></pages-top>
    
    <!-- Enhanced State Filter (Federal users only) -->
    <div v-if="role === 'Federal'" class="pt-8 px-6">
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 mb-6 border border-blue-100">
        <div class="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <label class="text-lg font-semibold text-gray-800">Filter by State</label>
          </div>
          
          <div class="relative flex-1 max-w-xs state-filter-dropdown">
            <div
              class="relative bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 focus-within:border-blue-500 transition-colors duration-200 cursor-pointer shadow-sm"
              @click="show_state = !show_state"
            >
              <div class="px-4 py-3 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span class="text-gray-800 font-medium">{{ selected_state }}</span>
                </div>
                <div class="transform transition-transform duration-200" :class="{ 'rotate-180': show_state }">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <!-- Enhanced Dropdown -->
            <div
              v-if="show_state"
              class="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
            >
              <!-- Search Input -->
              <div class="p-3 border-b border-gray-100">
                <div class="relative">
                  <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input
                    v-model="search_state"
                    type="text"
                    placeholder="Search states..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    @click.stop
                  />
                </div>
              </div>
              
              <!-- Options List -->
              <div class="max-h-48 overflow-y-auto">
                <!-- All States Option -->
                <div
                  class="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 flex items-center space-x-3 border-b border-gray-50"
                  :class="{ 'bg-blue-100 text-blue-800': selected_state === 'All States' }"
                  @click="selectState('All States')"
                >
                  <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                  <span class="font-medium">All States</span>
                  <div class="ml-auto">
                    <svg v-if="selected_state === 'All States'" class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </div>
                
                <!-- State Options -->
                <div
                  v-for="(state, index) in filteredStates"
                  :key="index"
                  class="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 flex items-center space-x-3"
                  :class="{ 'bg-blue-100 text-blue-800': selected_state === state.name }"
                  @click="selectState(index)"
                >
                  <div class="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>{{ state.name }}</span>
                  <div class="ml-auto">
                    <svg v-if="selected_state === state.name" class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </div>
                
                <!-- No results message -->
                <div v-if="filteredStates.length === 0" class="px-4 py-6 text-center text-gray-500">
                  <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.206 0-4.206.896-5.657 2.343M16 21h-8a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v14a2 2 0 01-2 2z"/>
                  </svg>
                  <p class="text-sm">No states found</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Filter Status Badge -->
          <div v-if="selected_state !== 'All States'" class="flex items-center space-x-2">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/>
              </svg>
              Filtered
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="pt-4 px-6" :class="{ 'pt-0': role === 'Federal' }">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <!-- Total Approved Card -->
        <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-4">
                  <div class="w-14 h-14 bg-card-5 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xl font-semibold text-nadis-black">Approved</p>
                    <p class="text-sm text-nadis-ash text-left">Verified cases</p>
                  </div>
                </div>
                <p class="text-5xl font-black text-nadis-black tracking-tight leading-none">
                  {{
                    approved_abattoir +
                    approved_aquaculture +
                    approved_laboratory +
                    approved_outbreak +
                    approved_suspicion +
                    approved_vaccination +
                    approved_veterinarian
                  }}
                </p>
              </div>
            </div>
          </div>
          <div class="h-1 bg-gradient-to-r from-primary to-primary-2"></div>
        </div>

        <!-- Total Pending Card -->
        <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border-l-4 border-yellow-500">
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-4">
                  <div class="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-7 h-7 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7,13H11V7H13V13H17L12,18L7,13Z"/>
                    </svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xl font-semibold text-yellow-800">Pending</p>
                    <p class="text-sm text-yellow-600 text-left">Under review</p>
                  </div>
                </div>
                <p class="text-5xl font-black text-yellow-800 tracking-tight leading-none">
                  {{
                    pending_abattoir +
                    pending_aquaculture +
                    pending_laboratory +
                    pending_outbreak +
                    pending_suspicion +
                    pending_vaccination +
                    pending_veterinarian
                  }}
                </p>
              </div>
            </div>
          </div>
          <div class="h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
        </div>

        <!-- Total In Progress Card -->
        <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border-l-4 border-blue-500">
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-4">
                  <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
                    </svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xl font-semibold text-blue-800">In Progress</p>
                    <p class="text-sm text-blue-600 text-left">Active cases</p>
                  </div>
                </div>
                <p class="text-5xl font-black text-blue-800 tracking-tight leading-none">
                  {{
                    progress_abattoir +
                    progress_aquaculture +
                    progress_laboratory +
                    progress_outbreak +
                    progress_suspicion +
                    progress_vaccination +
                    progress_veterinarian
                  }}
                </p>
              </div>
            </div>
          </div>
          <div class="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
        </div>

        <!-- Total Officials Card -->
        <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-4">
                  <div class="w-14 h-14 bg-card-5 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25Z"/>
                    </svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xl font-semibold text-nadis-black">Officials</p>
                    <p class="text-sm text-nadis-ash text-left">Registered staff</p>
                  </div>
                </div>
                <p class="text-5xl font-black text-nadis-black tracking-tight leading-none">{{ officials }}</p>
              </div>
            </div>
          </div>
          <div class="h-1 bg-gradient-to-r from-primary to-primary-2"></div>
        </div>

        <!-- Total Agents Card -->
        <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-4">
                  <div class="w-14 h-14 bg-card-5 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14A2.5,2.5 0 0,0 13,16.5A2.5,2.5 0 0,0 15.5,19A2.5,2.5 0 0,0 18,16.5A2.5,2.5 0 0,0 15.5,14M10,4A4,4 0 0,1 14,8C14,8.91 13.69,9.75 13.18,10.43C12.32,10.75 11.55,11.26 10.91,11.9L10,12A4,4 0 0,1 6,8A4,4 0 0,1 10,4M2,20V18C2,15.88 5.31,14.14 9.5,14C9.18,14.78 9,15.62 9,16.5C9,17.79 9.38,19 10,20H2Z"/>
                    </svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xl font-semibold text-nadis-black">Agents</p>
                    <p class="text-sm text-nadis-ash text-left">Field workers</p>
                  </div>
                </div>
                <p class="text-5xl font-black text-nadis-black tracking-tight leading-none">{{ agents }}</p>
              </div>
            </div>
          </div>
          <div class="h-1 bg-gradient-to-r from-primary to-primary-2"></div>
        </div>
      </div>
      <div class="w-full lg:flex pt-14">
        <all-mortality
          :rate_months="rate_months"
          :bar_array="bar_array"
          :bar_lengths="bar_lengths"
          :aquaculture_mortality="aquaculture_mortality"
          :outbreak_mortality="outbreak_mortality"
          :suspicion_mortality="suspicion_mortality"
        ></all-mortality>
        <outbreak-mortality v-on:outbreak-mortality="outbreakMortality"></outbreak-mortality>
      </div>
      <div class="w-full lg:flex pb-14">
        <suspicion-mortality v-on:suspicion-mortality="suspicionMortality"></suspicion-mortality>

        <aquaculture-mortality
          v-on:rate-months="rateMonths"
          v-on:bar-lengths="barLengths"
          v-on:aquaculture-mortality="aquacultureMortality"
        ></aquaculture-mortality>
      </div>
      <div class="w-full flex pb-14">
        <state-summary></state-summary>
      </div>
      <div class="w-full">
        <map-mortality></map-mortality>
      </div>
    </div>
    <footer-page></footer-page>
  </div>
</template>
