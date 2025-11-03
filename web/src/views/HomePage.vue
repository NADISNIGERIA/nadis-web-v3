<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
// import { useAuth } from '../stores/auth'
import { useCounter } from '../stores/counter'
import { useMortalityRate } from './../stores/mortality_rate'
import { useHome } from './../stores/home'
import AllMortality from '../components/Analytics/AllMortality.vue'
import OutbreakMortality from '../components/Analytics/OutbreakMortality.vue'
import SuspicionMortality from '../components/Analytics/SuspicionMortality.vue'
import AquacultureMortality from '../components/Analytics/AquacultureMortality.vue'
import StateSummary from '../components/Analytics/StateSummary.vue'
import MapMortality from '../components/Analytics/MapMortality.vue'
import FooterPage from '../components/FooterPage.vue'
import PagesTop from '../components/PagesTop.vue'
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
    PagesTop
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

    onMounted(() => {
      ctx.emit('active-menu', active_menu.value)
      useCounter().allCounter()
      useMortalityRate().outbreakMortality()
      useMortalityRate().suspicionMortality()
      useMortalityRate().aquacultureMortality()
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
      barArray
    }
  }
})
</script>

<template>
  <div class="home">
    <pages-top :title="'Dashboard Overview'"></pages-top>
    <div class="pt-12 px-6">
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- Total Reports Card -->
        <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-4">
                  <div class="w-14 h-14 bg-card-5 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm5-18v4h3V3h-3z"/>
                    </svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xl font-semibold text-nadis-black">Reports</p>
                    <p class="text-sm text-nadis-ash text-left">All submissions</p>
                  </div>
                </div>
                <p class="text-5xl font-black text-nadis-black tracking-tight leading-none">
                  {{
                    abattoir +
                    aquaculture +
                    laboratory +
                    outbreak +
                    suspicion +
                    vaccination +
                    veterinarian
                  }}
                </p>
              </div>
            </div>
          </div>
          <div class="h-1 bg-gradient-to-r from-primary to-primary-2"></div>
        </div>

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
