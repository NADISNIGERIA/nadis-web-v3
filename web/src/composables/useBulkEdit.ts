import { ref, watch, type Ref, type ComputedRef } from 'vue'
import { useToast } from './toast'

export interface BulkEditStore {
  bulkUpdateStatus: (docIds: string[], newStatus: 'pending' | 'in_progress' | 'approved') => Promise<{
    success: string[]
    failed: string[]
  }>
}

export function useBulkEdit(
  reports: ComputedRef<any[]>,
  store: BulkEditStore,
  refreshCallback: () => void
) {
  const { success, error, warning } = useToast()

  // State
  const selectedReports = ref<Set<string>>(new Set())
  const selectAll = ref(false)
  const showBulkEditModal = ref(false)

  // Methods
  const toggleReportSelection = (docId: string) => {
    if (selectedReports.value.has(docId)) {
      selectedReports.value.delete(docId)
    } else {
      selectedReports.value.add(docId)
    }
    selectAll.value = selectedReports.value.size === reports.value.length
  }

  const toggleSelectAll = () => {
    selectAll.value = !selectAll.value
    if (selectAll.value) {
      reports.value.forEach((report: any) => {
        selectedReports.value.add(report.doc_id)
      })
    } else {
      selectedReports.value.clear()
    }
  }

  const openBulkEditModal = () => {
    if (selectedReports.value.size === 0) {
      warning('Please select at least one report to edit.')
      return
    }
    showBulkEditModal.value = true
  }

  const closeBulkEditModal = () => {
    showBulkEditModal.value = false
  }

  const handleBulkEditConfirm = async (newStatus: string) => {
    try {
      const docIds = Array.from(selectedReports.value)
      const result = await store.bulkUpdateStatus(
        docIds,
        newStatus as 'pending' | 'in_progress' | 'approved'
      )

      if (result.success.length > 0) {
        success(
          `Successfully updated ${result.success.length} report(s) to ${newStatus.replace('_', ' ')}.`
        )
      }

      if (result.failed.length > 0) {
        error(`Failed to update ${result.failed.length} report(s).`)
      }

      // Clear selections and close modal
      selectedReports.value.clear()
      selectAll.value = false
      showBulkEditModal.value = false

      // Refresh the list
      refreshCallback()
    } catch (err) {
      console.error('Bulk edit error:', err)
      error('An error occurred while updating reports.')
    }
  }

  // Watch for changes in reports list to clear selections
  watch(reports, () => {
    selectedReports.value.clear()
    selectAll.value = false
  })

  return {
    selectedReports,
    selectAll,
    showBulkEditModal,
    toggleReportSelection,
    toggleSelectAll,
    openBulkEditModal,
    closeBulkEditModal,
    handleBulkEditConfirm
  }
}
