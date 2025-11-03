<template>
  <div class="date-range-picker">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Start Date -->
      <div class="form-group">
        <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
          Start Date
        </label>
        <input
          id="startDate"
          v-model="localStartDate"
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :max="localEndDate || undefined"
          @input="updateStartDate"
        />
      </div>

      <!-- End Date -->
      <div class="form-group">
        <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
          End Date
        </label>
        <input
          id="endDate"
          v-model="localEndDate"
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :min="localStartDate || undefined"
          :max="maxDate"
          @input="updateEndDate"
        />
      </div>
    </div>

    <!-- Quick Date Range Buttons -->
    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="preset in presets"
        :key="preset.label"
        @click="applyPreset(preset)"
        class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors"
      >
        {{ preset.label }}
      </button>
      <button
        @click="clearDates"
        class="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-md border border-red-300 transition-colors"
      >
        Clear
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="mt-2 text-sm text-red-600">
      {{ errorMessage }}
    </div>

    <!-- Date Range Display -->
    <div v-if="localStartDate || localEndDate" class="mt-3 text-sm text-gray-600">
      <span class="font-medium">Selected Range:</span>
      {{ formatDateRange() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface DateRangePreset {
  label: string
  startDate: Date
  endDate: Date
}

interface Props {
  startDate?: string
  endDate?: string
  maxDate?: string
  minDate?: string
  showPresets?: boolean
}

interface Emits {
  (e: 'update:startDate', value: string | null): void
  (e: 'update:endDate', value: string | null): void
  (e: 'rangeChanged', value: { startDate: string | null; endDate: string | null }): void
}

const props = withDefaults(defineProps<Props>(), {
  startDate: '',
  endDate: '',
  maxDate: '',
  minDate: '',
  showPresets: true
})

const emit = defineEmits<Emits>()

// Local state
const localStartDate = ref(props.startDate)
const localEndDate = ref(props.endDate)
const errorMessage = ref('')

// Computed properties
const maxDate = computed(() => {
  if (props.maxDate) return props.maxDate
  // Default to today
  return new Date().toISOString().split('T')[0]
})

// Date presets
const presets = computed((): DateRangePreset[] => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  
  const lastMonth = new Date(today)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  const last3Months = new Date(today)
  last3Months.setMonth(last3Months.getMonth() - 3)
  
  const lastYear = new Date(today)
  lastYear.setFullYear(lastYear.getFullYear() - 1)

  return [
    {
      label: 'Today',
      startDate: today,
      endDate: today
    },
    {
      label: 'Yesterday',
      startDate: yesterday,
      endDate: yesterday
    },
    {
      label: 'Last 7 Days',
      startDate: lastWeek,
      endDate: today
    },
    {
      label: 'Last 30 Days',
      startDate: lastMonth,
      endDate: today
    },
    {
      label: 'Last 3 Months',
      startDate: last3Months,
      endDate: today
    },
    {
      label: 'Last Year',
      startDate: lastYear,
      endDate: today
    }
  ]
})

// Methods
const validateDates = (): boolean => {
  errorMessage.value = ''
  
  if (!localStartDate.value || !localEndDate.value) {
    return true // Allow partial selection
  }
  
  const start = new Date(localStartDate.value)
  const end = new Date(localEndDate.value)
  
  if (start > end) {
    errorMessage.value = 'Start date cannot be after end date'
    return false
  }
  
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Warn if range is too large (more than 2 years)
  if (diffDays > 730) {
    errorMessage.value = 'Date range is very large and may affect performance'
    return true // Allow but warn
  }
  
  return true
}

const updateStartDate = (): void => {
  if (validateDates()) {
    emit('update:startDate', localStartDate.value || null)
    emitRangeChanged()
  }
}

const updateEndDate = (): void => {
  if (validateDates()) {
    emit('update:endDate', localEndDate.value || null)
    emitRangeChanged()
  }
}

const emitRangeChanged = (): void => {
  emit('rangeChanged', {
    startDate: localStartDate.value || null,
    endDate: localEndDate.value || null
  })
}

const applyPreset = (preset: DateRangePreset): void => {
  localStartDate.value = preset.startDate.toISOString().split('T')[0]
  localEndDate.value = preset.endDate.toISOString().split('T')[0]
  
  if (validateDates()) {
    emit('update:startDate', localStartDate.value)
    emit('update:endDate', localEndDate.value)
    emitRangeChanged()
  }
}

const clearDates = (): void => {
  localStartDate.value = ''
  localEndDate.value = ''
  errorMessage.value = ''
  
  emit('update:startDate', null)
  emit('update:endDate', null)
  emitRangeChanged()
}

const formatDateRange = (): string => {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  if (localStartDate.value && localEndDate.value) {
    return `${formatDate(localStartDate.value)} - ${formatDate(localEndDate.value)}`
  } else if (localStartDate.value) {
    return `From ${formatDate(localStartDate.value)}`
  } else if (localEndDate.value) {
    return `Until ${formatDate(localEndDate.value)}`
  }
  
  return 'No dates selected'
}

// Watch for external prop changes
watch(() => props.startDate, (newVal) => {
  localStartDate.value = newVal
})

watch(() => props.endDate, (newVal) => {
  localEndDate.value = newVal
})
</script>

<style scoped>
.date-range-picker {
  /* Additional custom styles if needed */
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .date-range-picker .grid {
    grid-template-columns: 1fr;
  }
}
</style>