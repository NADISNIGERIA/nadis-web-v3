import { useReportStatsUpdates } from './reportStatsEventBus'

/**
 * Helper function to emit stats update events from report stores
 * @param reportType - The Firebase collection name
 * @param action - The action performed (approve, pending, in_progress, decline)
 * @param docId - The document ID that was updated
 * @param store - The store instance to clear cache and force refresh
 */
export function emitReportStatsUpdate(
  reportType: string,
  action: 'approve' | 'pending' | 'in_progress' | 'decline',
  docId: string,
  store?: any
) {
  try {
    // Clear cache to ensure fresh data on next fetch
    if (store && typeof store.clearCache === 'function') {
      store.clearCache()
    }

    // Emit the stats update event
    const { emitStatsUpdate } = useReportStatsUpdates()
    emitStatsUpdate(reportType, action, docId)
  } catch (error) {
    console.error('Error emitting stats update:', error)
  }
}

/**
 * Report type mapping for different stores
 */
export const REPORT_TYPES = {
  ABATTOIR: 'abattoir_reports',
  OUTBREAK: 'outbreak_reports',
  VACCINATION: 'vaccination_reports',
  SUSPICION: 'suspicion_reports',
  VETERINARIAN: 'veterinarian_reports',
  LABORATORY: 'laboratory_reports',
  AQUACULTURE: 'aquaculture_reports'
} as const