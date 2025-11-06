<script lang="ts">
import { defineComponent } from 'vue'
import BulkActionsToolbar from './BulkActionsToolbar.vue'

/**
 * GenericDataTableView - Shared Patterns and Styles
 *
 * This file contains shared patterns, utility functions, and styles used across all
 * report table views (AbattoirView, OutbreakView, LaboratoryView, SuspicionView,
 * VaccinationView, VeterinarianView, AquacultureView).
 *
 * COMMON PATTERNS SHARED ACROSS ALL TABLES:
 *
 * 1. VUETIFY STATE (refs):
 *    - sortBy = ref<any[]>([{ key: 'created_at', order: 'desc' }])
 *    - itemsPerPage = ref(20)
 *    - selectedReports = ref<ReportType[]>([])
 *
 * 2. SORTING COMPUTED PROPERTY:
 *    See `createSortedComputed()` utility below for the exact pattern
 *
 * 3. UTILITY FUNCTIONS (exported):
 *    - createGetDateFunction(monthsRef): Function - Create date formatter
 *    - createFixLocationFunction(): Function - Create location formatter
 *    - createFindStateFunction(reporterStateRef): Function - Create state finder
 *    - createSortedComputed(dataRef, sortByRef): Function - Create sorting computed
 *
 * 4. REUSABLE COMPONENTS (exported):
 *    - BulkActionsToolbar - Bulk editing toolbar with dropdown
 *
 * 5. VUETIFY TABLE BINDINGS:
 *    v-model="selectedReports"
 *    v-model:items-per-page="itemsPerPage"
 *    v-model:sort-by="sortBy"
 *    :headers="headers"
 *    :items="sortedData"
 *    :loading="loading"
 *    show-select
 *    return-object
 *    item-value="doc_id"
 *    class="elevation-1"
 *    fixed-header
 *    height="600px"
 *
 * USAGE EXAMPLE:
 *
 * import {
 *   createGetDateFunction,
 *   createFindStateFunction,
 *   createSortedComputed,
 *   BulkActionsToolbar
 * } from './GenericDataTableView.vue'
 *
 * // In setup():
 * const getDate = createGetDateFunction(months)
 * const findState = createFindStateFunction(reporter_state)
 * const sortedData = computed(createSortedComputed(data, sortBy))
 *
 * // In template:
 * <BulkActionsToolbar
 *   :selected-reports="selectedReports"
 *   @bulk-action="handleBulkAction"
 *   @clear-selection="selectedReports = []"
 * />
 */

/**
 * UTILITY FUNCTIONS - Import these into your table component
 */

// Export the BulkActionsToolbar component
export { BulkActionsToolbar }

// Shared slot prop helpers
export type DataTableItemSlot<T> = { item: T }
export type DataTableIndexSlot = { index: number }

// FORMAT DATE FUNCTION - Used in all tables
export const createGetDateFunction = (monthsRef: any) => {
  return (val: any): string => {
    if (!val) return 'N/A'
    const date = new Date(val)
    if (Number.isNaN(date.getTime())) return 'N/A'

    const monthIndex = date.getMonth()
    const monthsArray = monthsRef?.value ?? monthsRef ?? []
    const monthInfo = monthsArray[monthIndex]
    const monthLabel =
      monthInfo?.short ??
      monthInfo?.name ??
      date.toLocaleString('en-US', { month: 'short' })

    return `${monthLabel} ${date.getDate()}, ${date.getFullYear()}`
  }
}

// FORMAT LOCATION FUNCTION - Used in tables with coordinates
export const createFixLocationFunction = () => {
  return (val: any): string => {
    if (val === undefined || val === null) {
      return 'N/A'
    }

    const numericValue = typeof val === 'number' ? val : Number(val)
    if (Number.isNaN(numericValue)) {
      return 'N/A'
    }

    return numericValue.toFixed(6)
  }
}

// FIND STATE FUNCTION - Used in all tables
export const createFindStateFunction = (reporterStateRef: any) => {
  return (doc_id: string) => {
    const found_reporter = reporterStateRef.value.find(
      (reporter: any) => reporter.doc_id === doc_id
    )
    if (found_reporter != undefined) {
      return found_reporter.state_lga
    } else {
      return { state: 'null', local_govt: 'null' }
    }
  }
}

// SORTING COMPUTED PROPERTY - Used in all tables
export const createSortedComputed = (dataRef: any, sortByRef: any) => {
  return () => {
    if (!sortByRef.value || sortByRef.value.length === 0) {
      return dataRef.value
    }

    const sorted = [...dataRef.value]
    const sortConfig = sortByRef.value[0]

    return sorted.sort((a: any, b: any) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      // Handle nested properties (e.g., 'location.lat')
      if (sortConfig.key.includes('.')) {
        const keys = sortConfig.key.split('.')
        aVal = keys.reduce((obj: any, key: any) => obj?.[key], a)
        bVal = keys.reduce((obj: any, key: any) => obj?.[key], b)
      }

      // Handle undefined/null values
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      // Compare values
      let comparison = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal)
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }

      return sortConfig.order === 'asc' ? comparison : -comparison
    })
  }
}

export default defineComponent({
  name: 'GenericDataTableView'
})
</script>

<template>
  <div>
    <!-- Reusable Bulk Actions Toolbar Component -->
    <!-- Can be imported and used directly with: <BulkActionsToolbar :selectedReports="selectedReports" @bulk-action="handleBulkAction" /> -->
  </div>
</template>

<style scoped src="./GenericDataTableStyles.css"></style>
