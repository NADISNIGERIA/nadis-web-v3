import fb from '@/services/firebase'
import { collection, doc, getDocs, query, updateDoc, where, limit, startAfter, orderBy, DocumentSnapshot } from 'firebase/firestore'
import { defineStore } from 'pinia'
import useAlert from './../composables/alert'

export const usePendingAgents = defineStore('pending_agents', {
  state: () => ({
    pending_agents: [],
    loading: false,
    pagination: {
      lastVisible: null as DocumentSnapshot | null,
      hasMore: true,
      currentPage: 1,
      pageSize: 25
    }
  }),
  actions: {
    async pendingAgents() {
      this.loading = true
      try {
        const docs = await getDocs(query(collection(fb.db, 'users'), where('approved', '==', 0)))
        const pending = [] as any
        docs.forEach((element) => {
          const user = {
            details: element.data().details,
            stateLga: element.data().stateLga,
            id: element.id
          }
          pending.push(user)
        })
        this.pending_agents = pending
      } catch (error) {
        console.error('Error fetching pending agents:', error)
        useAlert().exposeAlert(5000, 'error', 'Failed to load pending agents.')
      } finally {
        this.loading = false
      }
    },

    async fetchPendingAgentsPaginated(pageSize: number = 25, isNextPage: boolean = false) {
      this.loading = true
      try {
        let q = query(
          collection(fb.db, 'users'), 
          where('approved', '==', 0),
          orderBy('details.fullname'),
          limit(pageSize)
        )

        if (isNextPage && this.pagination.lastVisible) {
          q = query(
            collection(fb.db, 'users'),
            where('approved', '==', 0),
            orderBy('details.fullname'),
            startAfter(this.pagination.lastVisible),
            limit(pageSize)
          )
        }

        const docs = await getDocs(q)
        const pending = [] as any
        
        docs.forEach((element) => {
          const user = {
            details: element.data().details,
            stateLga: element.data().stateLga,
            id: element.id
          }
          pending.push(user)
        })

        if (isNextPage) {
          this.pending_agents = [...this.pending_agents, ...pending]
          this.pagination.currentPage++
        } else {
          this.pending_agents = pending
          this.pagination.currentPage = 1
        }

        this.pagination.lastVisible = docs.docs[docs.docs.length - 1] || null
        this.pagination.hasMore = docs.docs.length === pageSize
        this.pagination.pageSize = pageSize

      } catch (error) {
        console.error('Error fetching paginated pending agents:', error)
        useAlert().exposeAlert(5000, 'error', 'Failed to load pending agents.')
      } finally {
        this.loading = false
      }
    },

    async searchPendingAgents(searchTerm: string) {
      if (!searchTerm.trim()) {
        await this.pendingAgents()
        return
      }

      this.loading = true
      try {
        // For client-side search, we fetch all and filter
        const docs = await getDocs(query(collection(fb.db, 'users'), where('approved', '==', 0)))
        const pending = [] as any
        
        docs.forEach((element) => {
          const data = element.data()
          const user = {
            details: data.details,
            stateLga: data.stateLga,
            id: element.id
          }
          
          // Client-side filtering
          const searchLower = searchTerm.toLowerCase()
          if (
            user.details.fullname?.toLowerCase().includes(searchLower) ||
            user.details.email?.toLowerCase().includes(searchLower) ||
            user.details.phoneNumber?.includes(searchTerm) ||
            user.stateLga.state?.toLowerCase().includes(searchLower) ||
            user.stateLga.lga?.toLowerCase().includes(searchLower)
          ) {
            pending.push(user)
          }
        })
        
        this.pending_agents = pending
      } catch (error) {
        console.error('Error searching pending agents:', error)
        useAlert().exposeAlert(5000, 'error', 'Failed to search agents.')
      } finally {
        this.loading = false
      }
    },

    resetPagination() {
      this.pagination = {
        lastVisible: null,
        hasMore: true,
        currentPage: 1,
        pageSize: 25
      }
    },

    async approve(id: string) {
      this.loading = true
      try {
        await updateDoc(doc(fb.db, 'users', id), { approved: 1 })
        
        // Remove the approved agent from the pending list
        this.pending_agents = this.pending_agents.filter((agent: any) => agent.id !== id)
        
        useAlert().exposeAlert(5000, 'success', 'Done! Agent Approved.')
      } catch (error) {
        console.error('Error approving agent:', error)
        useAlert().exposeAlert(5000, 'error', 'Failed to approve agent.')
      } finally {
        this.loading = false
      }
    }
  }
})
