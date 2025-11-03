import { ref } from 'vue'

export interface StatsUpdateEvent {
  reportType: string
  action: 'approve' | 'pending' | 'in_progress' | 'decline'
  docId: string
}

class ReportStatsEventBus {
  private listeners: Array<(event: StatsUpdateEvent) => void> = []

  /**
   * Subscribe to stats update events
   */
  on(callback: (event: StatsUpdateEvent) => void) {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Emit a stats update event
   */
  emit(event: StatsUpdateEvent) {
    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in stats update listener:', error)
      }
    })
  }

  /**
   * Clear all listeners
   */
  clear() {
    this.listeners.length = 0
  }
}

// Create singleton instance
export const reportStatsEventBus = new ReportStatsEventBus()

/**
 * Composable for handling report stats updates
 */
export function useReportStatsUpdates() {
  const isUpdating = ref(false)

  /**
   * Emit a stats update event
   */
  const emitStatsUpdate = (reportType: string, action: StatsUpdateEvent['action'], docId: string) => {
    reportStatsEventBus.emit({ reportType, action, docId })
  }

  /**
   * Subscribe to stats updates with automatic cleanup
   */
  const onStatsUpdate = (callback: (event: StatsUpdateEvent) => void) => {
    return reportStatsEventBus.on(callback)
  }

  return {
    isUpdating,
    emitStatsUpdate,
    onStatsUpdate
  }
}

export default reportStatsEventBus