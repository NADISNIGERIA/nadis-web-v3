<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- Total Reports Card -->
    <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
      <div class="flex items-center">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600">Total Reports</p>
          <div v-if="loading" class="h-8 bg-gray-200 rounded animate-pulse"></div>
          <p v-else class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</p>
        </div>
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg v-if="!loading" class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div v-else class="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Approved Reports Card -->
    <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
      <div class="flex items-center">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600">Approved</p>
          <div v-if="loading" class="h-8 bg-gray-200 rounded animate-pulse"></div>
          <p v-else class="text-2xl font-bold text-gray-900">{{ stats.approved || 0 }}</p>
        </div>
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg v-if="!loading" class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <div v-else class="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Reports Card -->
    <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
      <div class="flex items-center">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600">Pending</p>
          <div v-if="loading" class="h-8 bg-gray-200 rounded animate-pulse"></div>
          <p v-else class="text-2xl font-bold text-gray-900">{{ stats.pending || 0 }}</p>
        </div>
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg v-if="!loading" class="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <div v-else class="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- In Progress Reports Card -->
    <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
      <div class="flex items-center">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600">In Progress</p>
          <div v-if="loading" class="h-8 bg-gray-200 rounded animate-pulse"></div>
          <p v-else class="text-2xl font-bold text-gray-900">{{ stats.inProgress || 0 }}</p>
        </div>
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg v-if="!loading" class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
            </svg>
            <div v-else class="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

interface ReportStats {
  total: number
  approved: number
  pending: number
  inProgress: number
}

export default defineComponent({
  name: 'ReportStatsCards',
  props: {
    stats: {
      type: Object as PropType<ReportStats>,
      default: () => ({
        total: 0,
        approved: 0,
        pending: 0,
        inProgress: 0
      })
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
})
</script>