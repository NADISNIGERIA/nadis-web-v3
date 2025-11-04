import fb from '@/services/firebase'
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore'
import { defineStore } from 'pinia'

export const useCounter = defineStore('counter', {
  state: () => ({
    loading: false,
    abattoir: 0,
    aquaculture: 0,
    laboratory: 0,
    outbreak: 0,
    suspicion: 0,
    vaccination: 0,
    veterinarian: 0,
    approved_abattoir: 0,
    approved_aquaculture: 0,
    approved_laboratory: 0,
    approved_outbreak: 0,
    approved_suspicion: 0,
    approved_vaccination: 0,
    approved_veterinarian: 0,
    progress_abattoir: 0,
    progress_aquaculture: 0,
    progress_laboratory: 0,
    progress_outbreak: 0,
    progress_suspicion: 0,
    progress_vaccination: 0,
    progress_veterinarian: 0,
    pending_abattoir: 0,
    pending_aquaculture: 0,
    pending_laboratory: 0,
    pending_outbreak: 0,
    pending_suspicion: 0,
    pending_vaccination: 0,
    pending_veterinarian: 0,
    agents: 0,
    officials: 0
  }),
  actions: {
    async allCounter() {
      const docs = await getDocs(collection(fb.db, 'dashboard'))
      this.clearAll()
      if (!docs.empty) {
        docs.forEach((item) => {
          if (item.id === 'abattoir_reports') {
            this.abattoir = item.data().total_reports
            this.approved_abattoir = item.data().total_approved
            this.progress_abattoir = item.data().total_in_progress
            this.pending_abattoir = item.data().total_pending
          }
          if (item.id === 'aquaculture_reports') {
            this.aquaculture = item.data().total_reports
            this.approved_aquaculture = item.data().total_approved
            this.progress_aquaculture = item.data().total_in_progress
            this.pending_aquaculture = item.data().total_pending
          }
          if (item.id === 'laboratory_reports') {
            this.laboratory = item.data().total_reports
            this.approved_laboratory = item.data().total_approved
            this.progress_laboratory = item.data().total_in_progress
            this.pending_laboratory = item.data().total_pending
          }
          if (item.id === 'outbreak_reports') {
            this.outbreak = item.data().total_reports
            this.approved_outbreak = item.data().total_approved
            this.progress_outbreak = item.data().total_in_progress
            this.pending_outbreak = item.data().total_pending
          }
          if (item.id === 'suspicion_reports') {
            this.suspicion = item.data().total_reports
            this.approved_suspicion = item.data().total_approved
            this.progress_suspicion = item.data().total_in_progress
            this.pending_suspicion = item.data().total_pending
          }
          if (item.id === 'vaccination_reports') {
            this.vaccination = item.data().total_reports
            this.approved_vaccination = item.data().total_approved
            this.progress_vaccination = item.data().total_in_progress
            this.pending_vaccination = item.data().total_pending
          }
          if (item.id === 'veterinarian_reports') {
            this.veterinarian = item.data().total_reports
            this.approved_veterinarian = item.data().total_approved
            this.progress_veterinarian = item.data().total_in_progress
            this.pending_veterinarian = item.data().total_pending
          }
          if (item.id === 'users') {
            this.agents = item.data().approved_users
          }
          if (item.id === 'admins') {
            this.officials = item.data().approved_admins
          }
        })
      }
    },
    clearAll() {
      this.abattoir = 0
      this.aquaculture = 0
      this.laboratory = 0
      this.outbreak = 0
      this.suspicion = 0
      this.vaccination = 0
      this.veterinarian = 0
      this.approved_abattoir = 0
      this.approved_aquaculture = 0
      this.approved_laboratory = 0
      this.approved_outbreak = 0
      this.approved_suspicion = 0
      this.approved_vaccination = 0
      this.approved_veterinarian = 0
      this.progress_abattoir = 0
      this.progress_aquaculture = 0
      this.progress_laboratory = 0
      this.progress_outbreak = 0
      this.progress_suspicion = 0
      this.progress_vaccination = 0
      this.progress_veterinarian = 0
      this.pending_abattoir = 0
      this.pending_aquaculture = 0
      this.pending_laboratory = 0
      this.pending_outbreak = 0
      this.pending_suspicion = 0
      this.pending_vaccination = 0
      this.pending_veterinarian = 0
      this.agents = 0
      this.officials = 0
    },
    async allAbattoir() {
      this.loading = true
      const docs = await getDocs(collection(fb.db, 'abattoir_reports'))
      if (!docs.empty) {
        this.abattoir = docs.docs.length
      }
    },
    async allAquaculture() {
      this.loading = true
      const docs = await getDocs(collection(fb.db, 'aquaculture_reports'))
      if (!docs.empty) {
        this.aquaculture = docs.docs.length
      }
    },
    async allLaboratory() {
      this.loading = true
      const docs = await getDocs(collection(fb.db, 'laboratory_reports'))
      if (!docs.empty) {
        this.laboratory = docs.docs.length
      }
    },
    async allOutbreak() {
      this.loading = true
      const docs = await getDocs(collection(fb.db, 'outbreak_reports'))
      if (!docs.empty) {
        this.outbreak = docs.docs.length
      }
    },
    async allSuspicion() {
      this.loading = true
      const docs = await getDocs(collection(fb.db, 'suspicion_reports'))
      if (!docs.empty) {
        this.suspicion = docs.docs.length
      }
    },
    async allVaccination() {
      this.loading = true
      const docs = await getDocs(collection(fb.db, 'vaccination_reports'))
      if (!docs.empty) {
        this.vaccination = docs.docs.length
      }
    },
    async allVeterinarian() {
      this.loading = true
      const docs = await getDocs(collection(fb.db, 'veterinarian_reports'))
      if (!docs.empty) {
        this.veterinarian = docs.docs.length
      }
    },
    
    // State-filtered counter methods
    async allCounterFiltered(state?: string) {
      this.loading = true
      
      if (!state || state === 'All States') {
        // If no state filter, use direct counting for accurate totals
        await this.countAllAgents()
        await this.countAllOfficials()
        
        // Use existing method for reports but don't let it override our counts
        const tempAgents = this.agents
        const tempOfficials = this.officials
        
        await this.allCounter()
        
        // Restore our accurate counts
        this.agents = tempAgents
        this.officials = tempOfficials
        return
      }

      // Clear all counters
      this.clearAll()

      try {
        // Count reports by state for each report type
        await Promise.all([
          this.countReportsByState('abattoir_reports', state),
          this.countReportsByState('aquaculture_reports', state),
          this.countReportsByState('laboratory_reports', state),
          this.countReportsByState('outbreak_reports', state),
          this.countReportsByState('suspicion_reports', state),
          this.countReportsByState('vaccination_reports', state),
          this.countReportsByState('veterinarian_reports', state)
        ])
        
        // Count agents and officials by state
        await Promise.all([
          this.countAgentsByState(state),
          this.countOfficialsByState(state)
        ])
        
      } catch (error) {
        console.error('Error loading filtered dashboard data:', error)
        // Fallback to unfiltered data
        await this.allCounter()
      } finally {
        this.loading = false
      }
    },

    async countReportsByState(collection_name: string, state: string) {
      try {
        // Use efficient count queries instead of fetching all documents
        const collectionRef = collection(fb.db, collection_name)
        
        // Count total reports for state
        const totalQuery = query(collectionRef, where('state', '==', state))
        const totalSnapshot = await getCountFromServer(totalQuery)
        const totalCount = totalSnapshot.data().count
        
        // Count approved reports
        const approvedQuery = query(
          collectionRef, 
          where('state', '==', state),
          where('approved', '==', true),
          where('finished', '==', true)
        )
        const approvedSnapshot = await getCountFromServer(approvedQuery)
        const approvedCount = approvedSnapshot.data().count
        
        // Count pending reports  
        const pendingQuery = query(
          collectionRef,
          where('state', '==', state),
          where('approved', '==', false),
          where('finished', '==', true)
        )
        const pendingSnapshot = await getCountFromServer(pendingQuery)
        const pendingCount = pendingSnapshot.data().count
        
        // Count in-progress reports
        const progressQuery = query(
          collectionRef,
          where('state', '==', state), 
          where('finished', '==', false)
        )
        const progressSnapshot = await getCountFromServer(progressQuery)
        const progressCount = progressSnapshot.data().count
        
        // Create mock docs objects for compatibility
        const totalDocs = { size: totalCount }
        const approvedDocs = { size: approvedCount }
        const pendingDocs = { size: pendingCount }
        const progressDocs = { size: progressCount }

        // Set the appropriate counters based on collection type
        switch (collection_name) {
          case 'abattoir_reports':
            this.abattoir = totalDocs.size
            this.approved_abattoir = approvedDocs.size
            this.pending_abattoir = pendingDocs.size
            this.progress_abattoir = progressDocs.size
            break
          case 'aquaculture_reports':
            this.aquaculture = totalDocs.size
            this.approved_aquaculture = approvedDocs.size
            this.pending_aquaculture = pendingDocs.size
            this.progress_aquaculture = progressDocs.size
            break
          case 'laboratory_reports':
            this.laboratory = totalDocs.size
            this.approved_laboratory = approvedDocs.size
            this.pending_laboratory = pendingDocs.size
            this.progress_laboratory = progressDocs.size
            break
          case 'outbreak_reports':
            this.outbreak = totalDocs.size
            this.approved_outbreak = approvedDocs.size
            this.pending_outbreak = pendingDocs.size
            this.progress_outbreak = progressDocs.size
            break
          case 'suspicion_reports':
            this.suspicion = totalDocs.size
            this.approved_suspicion = approvedDocs.size
            this.pending_suspicion = pendingDocs.size
            this.progress_suspicion = progressDocs.size
            break
          case 'vaccination_reports':
            this.vaccination = totalDocs.size
            this.approved_vaccination = approvedDocs.size
            this.pending_vaccination = pendingDocs.size
            this.progress_vaccination = progressDocs.size
            break
          case 'veterinarian_reports':
            this.veterinarian = totalDocs.size
            this.approved_veterinarian = approvedDocs.size
            this.pending_veterinarian = pendingDocs.size
            this.progress_veterinarian = progressDocs.size
            break
        }
      } catch (error) {
        console.error(`Error counting ${collection_name} by state:`, error)
      }
    },

    async countAgentsByState(state: string) {
      try {
        // Use more efficient query - only get approved users
        const usersQuery = query(
          collection(fb.db, 'users'),
          where('approved', '==', 1)
        )
        const usersDocs = await getDocs(usersQuery)
        
        let agentCount = 0
        
        usersDocs.forEach((doc) => {
          const data = doc.data()
          // Only check state for approved users (much smaller dataset)
          if (data.stateLga && data.stateLga.state === state) {
            agentCount++
          }
        })
        
        this.agents = agentCount
      } catch (error) {
        console.error(`Error counting agents by state:`, error)
        this.agents = 0
      }
    },

    async countOfficialsByState(state: string) {
      try {
        // Get only approved admins (officials) - much more efficient
        const adminsQuery = query(
          collection(fb.db, 'admins'),
          where('approved', '==', true)
        )
        const adminsDocs = await getDocs(adminsQuery)
        
        let officialCount = 0
        let totalApproved = 0
        let totalWithState = 0
        let totalWithMatchingState = 0
        
        adminsDocs.forEach((doc) => {
          const data = doc.data()
          
          // Check different possible state field structures (already filtered by approved)
          let adminState = null
          
          if (data.stateLga && data.stateLga.state) {
            adminState = data.stateLga.state
          } else if (data.state && data.state.trim() !== '') {
            adminState = data.state
          }
          
          if (adminState === state) {
            officialCount++
          }
        })

        
        this.officials = officialCount
      } catch (error) {
        console.error(`Error counting officials by state:`, error)
        this.officials = 0
      }
    },

    async countAllAgents() {
      try {
        // Use efficient count query
        const usersQuery = query(collection(fb.db, 'users'), where('approved', '==', 1))
        const countSnapshot = await getCountFromServer(usersQuery)
        this.agents = countSnapshot.data().count
      } catch (error) {
        console.error('Error counting all agents:', error)
        this.agents = 0
      }
    },

    async countAllOfficials() {
      try {
        // Use efficient count query
        const adminsQuery = query(collection(fb.db, 'admins'), where('approved', '==', true))
        const countSnapshot = await getCountFromServer(adminsQuery)
        this.officials = countSnapshot.data().count
      } catch (error) {
        console.error('Error counting all officials:', error)
        this.officials = 0
      }
    }
  }
})
