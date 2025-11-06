<script lang="ts" setup>
import { ref } from 'vue'

// Props
interface Props {
  selectedReports: any[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'bulk-action', action: string): void
  (e: 'clear-selection'): void
}>()

// Local state
const showStatusDropdown = ref(false)

// Methods
const handleBulkAction = (action: string) => {
  emit('bulk-action', action)
  showStatusDropdown.value = false
}

const clearSelection = () => {
  emit('clear-selection')
}
</script>

<template>
  <div
    v-if="selectedReports.length > 0"
    class="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between"
  >
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
            @click="handleBulkAction('pending')"
            class="w-full text-left px-4 py-2 text-sm hover:bg-yellow-50 text-gray-700 flex items-center gap-2"
          >
            <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
            Set to Pending
          </button>
          <button
            @click="handleBulkAction('in_progress')"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 flex items-center gap-2"
          >
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            Set to In Progress
          </button>
          <button
            @click="handleBulkAction('approved')"
            class="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-gray-700 flex items-center gap-2"
          >
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            Set to Approved
          </button>
        </div>
      </div>
      <button
        @click="clearSelection"
        class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm"
      >
        Clear Selection
      </button>
    </div>
  </div>
</template>
