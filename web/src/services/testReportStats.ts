// Test script for ReportStatsService
// This can be used in browser console for testing

import ReportStatsService from '../services/reportStatsService'

// Test function to check if the service works
export async function testReportStats() {
  console.log('Testing ReportStatsService...')
  
  try {
    // Test abattoir reports stats
    console.log('Fetching abattoir report stats...')
    const abattoirStats = await ReportStatsService.getReportStats('abattoir_reports')
    console.log('Abattoir Stats:', abattoirStats)

    // Test with state filter
    console.log('Fetching abattoir stats for a specific state...')
    const abattoirStatsFiltered = await ReportStatsService.getReportStats('abattoir_reports', 'Lagos State')
    console.log('Abattoir Stats (Lagos):', abattoirStatsFiltered)

    // Test multiple report types
    console.log('Fetching multiple report stats...')
    const multipleStats = await ReportStatsService.getMultipleReportStats([
      'abattoir_reports',
      'outbreak_reports',
      'vaccination_reports'
    ])
    console.log('Multiple Stats:', multipleStats)

    // Test all reports aggregated
    console.log('Fetching all report stats...')
    const allStats = await ReportStatsService.getAllReportStats()
    console.log('All Stats:', allStats)

  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Usage in browser console:
// import { testReportStats } from './path/to/testReportStats'
// testReportStats()