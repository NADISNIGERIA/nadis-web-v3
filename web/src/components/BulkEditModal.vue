<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'BulkEditModal',
  props: {
    selectedCount: {
      type: Number,
      required: true
    }
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    const selectedStatus = ref('')

    const handleConfirm = () => {
      if (!selectedStatus.value) {
        return
      }
      emit('confirm', selectedStatus.value)
    }

    const handleClose = () => {
      emit('close')
    }

    return {
      selectedStatus,
      handleConfirm,
      handleClose
    }
  }
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Bulk Edit Status</h3>
        <p class="mt-1 text-sm text-gray-600">
          Update status for {{ selectedCount }} selected report{{ selectedCount > 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Body -->
      <div class="px-6 py-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select New Status
        </label>
        <select
          v-model="selectedStatus"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">-- Select Status --</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <button
          @click="handleClose"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          @click="handleConfirm"
          :disabled="!selectedStatus"
          :class="[
            'px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            selectedStatus
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
          ]"
        >
          Update Status
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure modal appears above other elements */
</style>
