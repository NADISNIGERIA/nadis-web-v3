<script lang="ts">
import { useApprovedAgents } from './../../stores/approved_agents'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import ApprovedDetails from './ApprovedDetails.vue'

export default defineComponent({
  components: { ApprovedDetails },
  props: {
    full: Boolean
  },
  setup() {
    const show = ref(false)
    const agent = ref({}) as any
    const searchQuery = ref('')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const sortField = ref('fullname')
    const sortDirection = ref('asc')
    
    const approved_agents = computed(() => useApprovedAgents().approved_agents) as any

    // Backend-based data fetching
    const totalCount = ref(0)
    const loading = ref(false)
    
    // Computed agents (now from backend queries)
    const paginatedAgents = computed(() => approved_agents.value || [])
    
    // Total pages based on server count
    const totalPages = computed(() => {
      return Math.ceil(totalCount.value / itemsPerPage.value)
    })

    // Pagination info
    const paginationInfo = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value + 1
      const end = Math.min(currentPage.value * itemsPerPage.value, totalCount.value)
      return {
        start,
        end,
        total: totalCount.value
      }
    })

    // Backend data fetching function
    const fetchAgents = async () => {
      loading.value = true
      try {
        await useApprovedAgents().approvedAgentsPaginated({
          page: currentPage.value,
          limit: itemsPerPage.value,
          search: searchQuery.value,
          sortField: sortField.value,
          sortDirection: sortDirection.value
        })
        
        // Get total count for pagination
        totalCount.value = await useApprovedAgents().getApprovedAgentsCount(searchQuery.value)
      } catch (error) {
        console.error('Error fetching agents:', error)
      } finally {
        loading.value = false
      }
    }

    const showDetails = (selectedAgent: any) => {
      agent.value = selectedAgent
      show.value = true
    }

    const openModal = (val: any) => {
      show.value = val
    }

    const sort = (field: string) => {
      if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortDirection.value = 'asc'
      }
    }

    const changePage = (page: number) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        fetchAgents()
      }
    }

    const changeItemsPerPage = (items: number) => {
      itemsPerPage.value = items
      currentPage.value = 1 // Reset to first page
      fetchAgents()
    }

    // Debounced search to avoid too many API calls
    let searchTimeout: NodeJS.Timeout
    const debouncedSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        currentPage.value = 1
        fetchAgents()
      }, 500) // Wait 500ms after user stops typing
    }

    // Watch for changes and trigger backend queries
    watch(searchQuery, debouncedSearch)
    
    watch([sortField, sortDirection], () => {
      fetchAgents()
    })

    onMounted(() => {
      fetchAgents()
    })

    return { 
      show, 
      agent, 
      approved_agents,
      searchQuery,
      currentPage,
      itemsPerPage,
      sortField,
      sortDirection,
      paginatedAgents,
      totalPages,
      paginationInfo,
      totalCount,
      loading,
      fetchAgents,
      showDetails, 
      openModal,
      sort,
      changePage,
      changeItemsPerPage
    }
  }
})
</script>

<template>
  <div class="p-6">
    <!-- Header with Search and Stats -->
    <div class="mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex items-center space-x-4">
          <h2 class="text-2xl font-semibold text-nadis-black">Approved Agents</h2>
          <span class="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
            {{ totalCount }} Total
          </span>
          <span v-if="loading" class="text-sm text-gray-500 animate-pulse">Loading...</span>
        </div>
        
        <!-- Search Bar -->
        <div class="flex items-center space-x-3">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search agents..."
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-64"
            >
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          
          <!-- Items per page selector -->
          <select 
            v-model="itemsPerPage" 
            @change="changeItemsPerPage(itemsPerPage)"
            class="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th 
                @click="sort('fullname')"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div class="flex items-center space-x-1">
                  <span>Full Name</span>
                  <svg v-if="sortField === 'fullname'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </th>
              <th 
                @click="sort('email')"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div class="flex items-center space-x-1">
                  <span>Email</span>
                  <svg v-if="sortField === 'email'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </th>
              <th 
                @click="sort('phone')"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div class="flex items-center space-x-1">
                  <span>Phone Number</span>
                  <svg v-if="sortField === 'phone'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </th>
              <th 
                @click="sort('state')"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div class="flex items-center space-x-1">
                  <span>State</span>
                  <svg v-if="sortField === 'state'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </th>
              <th 
                @click="sort('lga')"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div class="flex items-center space-x-1">
                  <span>LGA</span>
                  <svg v-if="sortField === 'lga'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="agent in paginatedAgents" 
              :key="agent.id"
              class="hover:bg-gray-50 transition-colors duration-200"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                    <span class="text-primary font-semibold text-sm">
                      {{ agent.details.fullname ? agent.details.fullname.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'N/A' }}
                    </span>
                  </div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ agent.details.fullname || 'N/A' }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ agent.details.email || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ agent.details.phoneNumber || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ agent.stateLga.state || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ agent.stateLga.lga || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="showDetails(agent)"
                  class="text-primary hover:text-primary-2 transition-colors duration-200 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- No results message -->
      <div v-if="paginatedAgents.length === 0" class="text-center py-12">
        <svg class="mx-auto w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-1">No agents found</h3>
        <p class="text-gray-500">Try adjusting your search criteria</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
      <div class="text-sm text-gray-700">
        Showing {{ paginationInfo.start }} to {{ paginationInfo.end }} of {{ paginationInfo.total }} results
      </div>
      
      <div class="flex items-center space-x-1">
        <!-- Previous button -->
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          :class="[
            'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
            currentPage === 1 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          Previous
        </button>
        
        <!-- Page numbers -->
        <template v-for="page in Math.min(5, totalPages)" :key="page">
          <button
            @click="changePage(page)"
            :class="[
              'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
              page === currentPage 
                ? 'bg-primary text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            {{ page }}
          </button>
        </template>
        
        <span v-if="totalPages > 5" class="px-2 text-gray-500">...</span>
        
        <button
          v-if="totalPages > 5 && currentPage < totalPages"
          @click="changePage(totalPages)"
          :class="[
            'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
            totalPages === currentPage 
              ? 'bg-primary text-white' 
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          {{ totalPages }}
        </button>
        
        <!-- Next button -->
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          :class="[
            'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
            currentPage === totalPages 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Details Modal -->
    <approved-details
      v-if="show && agent && Object.keys(agent).length > 0"
      :agent="agent"
      :full="full"
      v-on:open-modal="openModal"
    ></approved-details>
  </div>
</template>
