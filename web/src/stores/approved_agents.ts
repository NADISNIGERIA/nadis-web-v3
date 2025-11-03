import fb from '@/services/firebase'
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import useAlert from './../composables/alert'
import { useUnsubscriber } from './unsubscriber'

export const useApprovedAgents = defineStore('approved_agents', {
  state: () => ({
    approved_agents: [],
    loading: false
  }),
  actions: {
    // Legacy method - keep for backward compatibility
    approvedAgents() {
      const unsubscribe = onSnapshot(query(collection(fb.db, 'users'), where('approved', '==', 1)), (doc) => {
        const approved = [] as any
        doc.forEach((element) => {
          const user = {
            details: element.data().details,
            stateLga: element.data().stateLga,
            id: element.id
          }
          approved.push(user)
        })
        this.approved_agents = approved
      })
      useUnsubscriber().unsubscribe.push(unsubscribe)
    },

    // New efficient paginated method
    async approvedAgentsPaginated(params: {
      page: number,
      limit: number,
      search?: string,
      sortField?: string,
      sortDirection?: string
    }) {
      this.loading = true
      try {
        // Build Firebase query
        let q = query(
          collection(fb.db, 'users'),
          where('approved', '==', 1)
        )

        // Add search filters (Firebase has limited search, so this is a basic implementation)
        // For production, consider using Algolia or similar for advanced search
        if (params.search) {
          // Firebase doesn't support full-text search well, so we'll need to handle this differently
          // This is a limitation - for proper search, you'd need Algolia, Elasticsearch, etc.
        }

        // Add sorting (Firebase has limited sorting options)
        if (params.sortField && params.sortDirection) {
          const direction = params.sortDirection === 'desc' ? 'desc' : 'asc'
          // Note: Firebase sorting is limited to indexed fields
          // You may need to create composite indexes for complex sorting
        }

        // For now, we'll fetch and then slice (not ideal, but Firebase limitation)
        const snapshot = await getDocs(q)
        let approved = [] as any
        
        snapshot.forEach((element) => {
          const user = {
            details: element.data().details,
            stateLga: element.data().stateLga,
            id: element.id
          }
          approved.push(user)
        })

        // Client-side filtering (temporary solution)
        if (params.search) {
          const searchLower = params.search.toLowerCase()
          approved = approved.filter((agent: any) => 
            agent.details.fullname?.toLowerCase().includes(searchLower) ||
            agent.details.email?.toLowerCase().includes(searchLower) ||
            agent.details.phoneNumber?.includes(params.search) ||
            agent.stateLga.state?.toLowerCase().includes(searchLower) ||
            agent.stateLga.lga?.toLowerCase().includes(searchLower)
          )
        }

        // Client-side sorting
        if (params.sortField) {
          approved.sort((a: any, b: any) => {
            let aValue = ''
            let bValue = ''
            
            switch (params.sortField) {
              case 'fullname':
                aValue = a.details.fullname || ''
                bValue = b.details.fullname || ''
                break
              case 'email':
                aValue = a.details.email || ''
                bValue = b.details.email || ''
                break
              case 'phone':
                aValue = a.details.phoneNumber || ''
                bValue = b.details.phoneNumber || ''
                break
              case 'state':
                aValue = a.stateLga.state || ''
                bValue = b.stateLga.state || ''
                break
              case 'lga':
                aValue = a.stateLga.lga || ''
                bValue = b.stateLga.lga || ''
                break
            }

            if (params.sortDirection === 'asc') {
              return aValue.localeCompare(bValue)
            } else {
              return bValue.localeCompare(aValue)
            }
          })
        }

        // Client-side pagination
        const start = (params.page - 1) * params.limit
        const end = start + params.limit
        this.approved_agents = approved.slice(start, end)

        this.loading = false
        return approved.length // Return total count for pagination
      } catch (error) {
        this.loading = false
        throw error
      }
    },

    async getApprovedAgentsCount(search?: string) {
      try {
        const q = query(collection(fb.db, 'users'), where('approved', '==', 1))
        const snapshot = await getDocs(q)
        
        if (!search) {
          return snapshot.size
        }
        
        // Apply search filter to count
        let count = 0
        const searchLower = search.toLowerCase()
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (
            data.details.fullname?.toLowerCase().includes(searchLower) ||
            data.details.email?.toLowerCase().includes(searchLower) ||
            data.details.phoneNumber?.includes(search) ||
            data.stateLga.state?.toLowerCase().includes(searchLower) ||
            data.stateLga.lga?.toLowerCase().includes(searchLower)
          ) {
            count++
          }
        })
        
        return count
      } catch (error) {
        console.error('Error getting count:', error)
        return 0
      }
    },
    async disable(id: any) {
      this.loading = true
      await updateDoc(doc(fb.db, 'users', id), { approved: 0 })
      this.loading = false
      useAlert().exposeAlert(5000, 'success', 'Done! Agent Disabled.')
    }
  }
})
