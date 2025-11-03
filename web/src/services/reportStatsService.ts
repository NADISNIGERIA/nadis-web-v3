import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore'
import fb from './firebase'

export interface ReportStats {
  total: number
  approved: number
  pending: number
  inProgress: number
}

export type ReportType = 
  | 'abattoir_reports'
  | 'outbreak_reports' 
  | 'vaccination_reports'
  | 'suspicion_reports'
  | 'veterinarian_reports'
  | 'laboratory_reports'
  | 'aquaculture_reports'

export class ReportStatsService {
  
  /**
   * Get report statistics for a specific report type
   * @param reportType - The Firebase collection name for the report type
   * @param state - Optional state filter ('All States' or specific state name)
   * @returns Promise<ReportStats> - Object containing count statistics
   */
  static async getReportStats(reportType: ReportType, state?: string): Promise<ReportStats> {
    try {
      const stats: ReportStats = {
        total: 0,
        approved: 0,
        pending: 0,
        inProgress: 0
      }

      // Base collection reference
      const collectionRef = collection(fb.db, reportType)

      // Build base query filters
      const baseFilters = []
      if (state && state !== 'All States') {
        baseFilters.push(where('state', '==', state))
      }

      // Count finished reports (approved + pending)
      const finishedQuery = query(
        collectionRef,
        where('finished', '==', true),
        ...baseFilters
      )

      // Count in-progress reports
      const inProgressQuery = query(
        collectionRef,
        where('finished', '==', false),
        ...baseFilters
      )

      // Count approved reports
      const approvedQuery = query(
        collectionRef,
        where('finished', '==', true),
        where('approved', '==', true),
        ...baseFilters
      )

      // Count pending reports (finished but not approved)
      const pendingQuery = query(
        collectionRef,
        where('finished', '==', true),
        where('approved', '==', false),
        ...baseFilters
      )

      // Execute all count queries in parallel
      const [finishedCount, inProgressCount, approvedCount, pendingCount] = await Promise.all([
        getCountFromServer(finishedQuery),
        getCountFromServer(inProgressQuery),
        getCountFromServer(approvedQuery),
        getCountFromServer(pendingQuery)
      ])

      // Populate stats
      stats.approved = approvedCount.data().count
      stats.pending = pendingCount.data().count
      stats.inProgress = inProgressCount.data().count
      stats.total = stats.approved + stats.pending + stats.inProgress

      return stats

    } catch (error) {
      console.error(`Error fetching ${reportType} statistics:`, error)
      
      // Return zero stats on error
      return {
        total: 0,
        approved: 0,
        pending: 0,
        inProgress: 0
      }
    }
  }

  /**
   * Get report statistics using document queries (fallback method)
   * Use this if getCountFromServer is not available or fails
   */
  static async getReportStatsLegacy(reportType: ReportType, state?: string): Promise<ReportStats> {
    try {
      const stats: ReportStats = {
        total: 0,
        approved: 0,
        pending: 0,
        inProgress: 0
      }

      // Base collection reference
      const collectionRef = collection(fb.db, reportType)

      // Build base query filters
      const baseFilters = []
      if (state && state !== 'All States') {
        baseFilters.push(where('state', '==', state))
      }

      // Query for approved reports
      const approvedQuery = query(
        collectionRef,
        where('finished', '==', true),
        where('approved', '==', true),
        ...baseFilters
      )

      // Query for pending reports
      const pendingQuery = query(
        collectionRef,
        where('finished', '==', true),
        where('approved', '==', false),
        ...baseFilters
      )

      // Query for in-progress reports
      const inProgressQuery = query(
        collectionRef,
        where('finished', '==', false),
        ...baseFilters
      )

      // Execute all queries in parallel
      const [approvedDocs, pendingDocs, inProgressDocs] = await Promise.all([
        getDocs(approvedQuery),
        getDocs(pendingQuery),
        getDocs(inProgressQuery)
      ])

      // Count documents
      stats.approved = approvedDocs.size
      stats.pending = pendingDocs.size
      stats.inProgress = inProgressDocs.size
      stats.total = stats.approved + stats.pending + stats.inProgress

      return stats

    } catch (error) {
      console.error(`Error fetching ${reportType} statistics (legacy):`, error)
      
      // Return zero stats on error
      return {
        total: 0,
        approved: 0,
        pending: 0,
        inProgress: 0
      }
    }
  }

  /**
   * Get statistics for multiple report types
   * @param reportTypes - Array of report types to fetch stats for
   * @param state - Optional state filter
   * @returns Promise<Record<ReportType, ReportStats>>
   */
  static async getMultipleReportStats(
    reportTypes: ReportType[], 
    state?: string
  ): Promise<Record<string, ReportStats>> {
    try {
      const statsPromises = reportTypes.map(async (reportType) => ({
        [reportType]: await this.getReportStats(reportType, state)
      }))

      const statsArray = await Promise.all(statsPromises)
      
      // Merge all stats into a single object
      return statsArray.reduce((acc, curr) => ({ ...acc, ...curr }), {})

    } catch (error) {
      console.error('Error fetching multiple report statistics:', error)
      
      // Return empty stats for all report types
      const emptyStats: Record<string, ReportStats> = {}
      reportTypes.forEach(reportType => {
        emptyStats[reportType] = {
          total: 0,
          approved: 0,
          pending: 0,
          inProgress: 0
        }
      })
      
      return emptyStats
    }
  }

  /**
   * Get aggregated statistics across all report types
   * @param state - Optional state filter
   * @returns Promise<ReportStats> - Combined stats from all report types
   */
  static async getAllReportStats(state?: string): Promise<ReportStats> {
    const allReportTypes: ReportType[] = [
      'abattoir_reports',
      'outbreak_reports',
      'vaccination_reports',
      'suspicion_reports',
      'veterinarian_reports',
      'laboratory_reports',
      'aquaculture_reports'
    ]

    try {
      const allStats = await this.getMultipleReportStats(allReportTypes, state)
      
      // Aggregate all stats
      const aggregatedStats: ReportStats = {
        total: 0,
        approved: 0,
        pending: 0,
        inProgress: 0
      }

      Object.values(allStats).forEach(stats => {
        aggregatedStats.total += stats.total
        aggregatedStats.approved += stats.approved
        aggregatedStats.pending += stats.pending
        aggregatedStats.inProgress += stats.inProgress
      })

      return aggregatedStats

    } catch (error) {
      console.error('Error fetching aggregated report statistics:', error)
      return {
        total: 0,
        approved: 0,
        pending: 0,
        inProgress: 0
      }
    }
  }
}

export default ReportStatsService