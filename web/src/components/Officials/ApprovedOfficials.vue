<script lang="ts">
import { useApprovedOfficials } from './../../stores/approved_officials'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import ApprovedOfficialsDetails from './ApprovedOfficialsDetails.vue'

export default defineComponent({
  components: { ApprovedOfficialsDetails },
  props: {
    full: Boolean
  },
  setup() {
    const show = ref(false)
    const official = ref({}) as any
    const searchQuery = ref('')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const sortField = ref('fullname')
    const sortDirection = ref('asc')
    const loading = ref(false)
    
    const approved_officials = computed(() => useApprovedOfficials().approved_officials) as any

    // Filtered and sorted officials
    const filteredOfficials = computed(() => {
      if (!approved_officials.value) return []
      
      let filtered = approved_officials.value.filter((official: any) => {
        const searchLower = searchQuery.value.toLowerCase()
        return (
          official.fullname?.toLowerCase().includes(searchLower) ||
          official.email?.toLowerCase().includes(searchLower) ||
          official.phoneNumber?.includes(searchQuery.value) ||
          official.role?.toLowerCase().includes(searchLower)
        )
      })

      // Sort the filtered results
      filtered.sort((a: any, b: any) => {
        let aValue = ''
        let bValue = ''
        
        switch (sortField.value) {
          case 'fullname':
            aValue = a.fullname || ''
            bValue = b.fullname || ''
            break
          case 'email':
            aValue = a.email || ''
            bValue = b.email || ''
            break
          case 'phone':
            aValue = a.phoneNumber || ''
            bValue = b.phoneNumber || ''
            break
          case 'role':
            aValue = a.role || ''
            bValue = b.role || ''
            break
        }

        if (sortDirection.value === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })

      return filtered
    })

    // Paginated officials
    const paginatedOfficials = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredOfficials.value.slice(start, end)
    })

    // Total pages
    const totalPages = computed(() => {
      return Math.ceil(filteredOfficials.value.length / itemsPerPage.value)
    })

    // Pagination info
    const paginationInfo = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value + 1
      const end = Math.min(currentPage.value * itemsPerPage.value, filteredOfficials.value.length)
      return {
        start,
        end,
        total: filteredOfficials.value.length
      }
    })

    const showDetails = (selectedOfficial: any) => {
      official.value = selectedOfficial
      show.value = true
    }

    const openModal = (val: any) => {
      show.value = val
    }

    const role = (val: any) => {
      if (val == 'Federal') {
        return 'Has Access to All'
      } else if (val == 'State') {
        return 'Has Access to Own State'
      } else {
        return 'Has Access to Own LGA'
      }
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
      }
    }

    const changeItemsPerPage = (items: number) => {
      itemsPerPage.value = items
      currentPage.value = 1 // Reset to first page
    }

    // Reset to first page when search changes
    watch(searchQuery, () => {
      currentPage.value = 1
    })

    onMounted(() => {
      loading.value = true
      useApprovedOfficials().approved()
      loading.value = false
    })

    return { 
      approved_officials,
      show, 
      official,
      searchQuery,
      currentPage,
      itemsPerPage,
      sortField,
      sortDirection,
      loading,
      filteredOfficials,
      paginatedOfficials,
      totalPages,
      paginationInfo,
      showDetails, 
      openModal,
      role,
      sort,
      changePage,
      changeItemsPerPage
    }
  }
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex items-center space-x-4">
          <h2 class="text-2xl font-semibold text-nadis-black">Approved Officials</h2>
          <span class="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
            {{ filteredOfficials.length }} Total
          </span>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Search and Controls -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search officials..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>

        <!-- Items per page -->
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-600">Show:</label>
          <select
            v-model="itemsPerPage"
            @change="changeItemsPerPage(itemsPerPage)"
            class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading officials...</p>
        </div>

        <!-- Table Content -->
        <div v-else-if="filteredOfficials.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  @click="sort('fullname')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div class="flex items-center space-x-1">
                    <span>Full Name</span>
                    <svg
                      class="w-4 h-4 transition-transform"
                      :class="{
                        'text-primary': sortField === 'fullname',
                        'rotate-180': sortField === 'fullname' && sortDirection === 'desc'
                      }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </th>
                <th
                  @click="sort('email')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div class="flex items-center space-x-1">
                    <span>Email</span>
                    <svg
                      class="w-4 h-4 transition-transform"
                      :class="{
                        'text-primary': sortField === 'email',
                        'rotate-180': sortField === 'email' && sortDirection === 'desc'
                      }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </th>
                <th
                  @click="sort('phone')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div class="flex items-center space-x-1">
                    <span>Phone</span>
                    <svg
                      class="w-4 h-4 transition-transform"
                      :class="{
                        'text-primary': sortField === 'phone',
                        'rotate-180': sortField === 'phone' && sortDirection === 'desc'
                      }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </th>
                <th
                  @click="sort('role')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div class="flex items-center space-x-1">
                    <span>Role</span>
                    <svg
                      class="w-4 h-4 transition-transform"
                      :class="{
                        'text-primary': sortField === 'role',
                        'rotate-180': sortField === 'role' && sortDirection === 'desc'
                      }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access Level
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="official in paginatedOfficials"
                :key="official.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-primary-2 border-2 border-primary flex items-center justify-center">
                        <span class="text-sm font-medium text-white">
                          {{ official.fullname ? official.fullname.charAt(0).toUpperCase() : 'O' }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ official.fullname || 'N/A' }}
                      </div>
                      <div class="text-sm text-gray-500">
                        Active Official
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ official.email || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ official.phoneNumber || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="{
                      'bg-green-100 text-green-800': official.role === 'Federal',
                      'bg-blue-100 text-blue-800': official.role === 'State',
                      'bg-purple-100 text-purple-800': official.role === 'AVO'
                    }"
                  >
                    {{ official.role || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ role(official.role) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="showDetails(official)"
                    class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-primary bg-primary-2 bg-opacity-10 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No officials found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ searchQuery ? 'Try adjusting your search criteria.' : 'No approved officials are currently available.' }}
          </p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredOfficials.length > 0" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm border border-gray-200">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ paginationInfo.start }}</span>
              to
              <span class="font-medium">{{ paginationInfo.end }}</span>
              of
              <span class="font-medium">{{ paginationInfo.total }}</span>
              results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="changePage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <!-- Page Numbers -->
              <template v-for="page in Math.min(totalPages, 7)" :key="page">
                <button
                  v-if="page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)"
                  @click="changePage(page)"
                  :class="[
                    page === currentPage
                      ? 'z-10 bg-primary bg-opacity-10 border-primary text-primary'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                  ]"
                >
                  {{ page }}
                </button>
                <span
                  v-else-if="(page === 2 && currentPage > 4) || (page === totalPages - 1 && currentPage < totalPages - 3)"
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                >
                  ...
                </span>
              </template>

              <button
                @click="changePage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Official Details Modal -->
      <ApprovedOfficialsDetails :show="show" :official="official" @close="openModal" />
    </div>
  </div>
</template>
