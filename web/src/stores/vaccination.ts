import fb from '@/services/firebase'
import { emitReportStatsUpdate, REPORT_TYPES } from '@/services/reportStatsHelpers'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  updateDoc, 
  where,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore'
import { defineStore } from 'pinia'

export const useVaccination = defineStore('vaccination', {
  state: () => ({
    vaccination: [] as any,
    reporter_state: [] as any,
    loading: false,
    successful: 0,
    pagination: {
      currentPage: 1,
      pageSize: 20,
      hasMore: true,
      lastVisible: null,
      totalCount: 0
    },
    cache: {} as any,
    cacheExpiry: 5 * 60 * 1000 // 5 minutes
  }),
  actions: {
    // Helper methods for caching and pagination
    getCacheKey(filters: any) {
      return JSON.stringify(filters)
    },
    isCacheValid(timestamp: number) {
      return Date.now() - timestamp < this.cacheExpiry
    },
    getCachedData(filters: any) {
      const key = this.getCacheKey(filters)
      const cached = this.cache[key]
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data
      }
      return null
    },
    setCachedData(filters: any, data: any[]) {
      const key = this.getCacheKey(filters)
      this.cache[key] = {
        data: data,
        timestamp: Date.now(),
        filters: filters
      }
    },

    // Clear all cache data
    clearCache() {
      this.cache = {}
    },

    resetPagination() {
      this.pagination = {
        currentPage: 1,
        pageSize: 20,
        hasMore: true,
        lastVisible: null,
        totalCount: 0
      }
    },
    
    async show_in_progress_a_state(state: any) {
      this.vaccination = []
      const docs = await getDocs(
        query(
          collection(fb.db, 'vaccination_reports'),
          where('state', '==', state),
          where('finished', '==', false)
        )
      )
      const value = [] as any
      this.reporter_state = []
      docs.forEach((doc) => {
        const unit = doc.data()
        unit.doc_id = doc.id
        this.getReporterState({
          uid: doc.data().uid,
          doc_id: doc.id
        })
        value.push(unit)
      })
      this.vaccination = value.sort((a: any, b: any) => b.created_at - a.created_at)
    },
    async show_in_progress_all_states() {
      this.vaccination = []
      const docs = await getDocs(
        query(collection(fb.db, 'vaccination_reports'), where('finished', '==', false))
      )
      const value = [] as any
      this.reporter_state = []
      docs.forEach((doc) => {
        const unit = doc.data()
        unit.doc_id = doc.id
        this.getReporterState({
          uid: doc.data().uid,
          doc_id: doc.id
        })
        value.push(unit)
      })
      this.vaccination = value.sort((a: any, b: any) => b.created_at - a.created_at)
    },
    async getVaccination(values: any, isNextPage = false, pageSize = 20) {
      try {
        this.loading = true
        const state = values.state

        // Check cache first (unless getting next page)
        if (!isNextPage) {
          const cached = this.getCachedData(values)
          if (cached) {
            this.vaccination = cached
            this.loading = false
            return
          }
          this.resetPagination()
        }

        if (values.in_progress == true) {
          if (state != 'All States') {
            await this.show_in_progress_a_state(state)
          } else {
            await this.show_in_progress_all_states()
          }
        } else if (values.in_progress == false) {
          let sort = false
          if (values.category) {
            sort = true
          } else {
            sort = false
          }

          // Build query without orderBy to avoid composite index requirement
          let queryRef: any

          if (state != 'All States') {
            queryRef = query(
              collection(fb.db, 'vaccination_reports'),
              where('approved', '==', sort),
              where('state', '==', state),
              where('finished', '==', true),
              limit(pageSize)
            )
          } else {
            queryRef = query(
              collection(fb.db, 'vaccination_reports'),
              where('approved', '==', sort),
              where('finished', '==', true),
              limit(pageSize)
            )
          }

          // Add pagination cursor
          if (isNextPage && this.pagination.lastVisible) {
            if (state != 'All States') {
              queryRef = query(
                collection(fb.db, 'vaccination_reports'),
                where('approved', '==', sort),
                where('state', '==', state),
                where('finished', '==', true),
                startAfter(this.pagination.lastVisible),
                limit(pageSize)
              )
            } else {
              queryRef = query(
                collection(fb.db, 'vaccination_reports'),
                where('approved', '==', sort),
                where('finished', '==', true),
                startAfter(this.pagination.lastVisible),
                limit(pageSize)
              )
            }
          }

          const docs = await getDocs(queryRef)
          let value = [] as any

          if (!isNextPage) {
            this.vaccination = []
            this.reporter_state = []
            this.pagination.currentPage = 1
          } else {
            value = [...this.vaccination]
            this.pagination.currentPage++
          }

          docs.forEach((doc) => {
            const unit = doc.data()
            unit.doc_id = doc.id
            this.getReporterState({
              uid: doc.data().uid,
              doc_id: doc.id
            })
            value.push(unit)
          })

          // Sort by created_at descending (client-side)
          if (!isNextPage) {
            value.sort((a: any, b: any) => b.created_at - a.created_at)
          }

          this.pagination.lastVisible = docs.docs[docs.docs.length - 1] || null
          this.pagination.hasMore = docs.docs.length === pageSize
          this.pagination.pageSize = pageSize

          this.vaccination = value

          if (!isNextPage) {
            this.setCachedData(values, value)
          }
        }
      } catch (error) {
        console.error('Error fetching vaccination reports:', error)
      } finally {
        this.loading = false
      }
    },

    async loadNextPage(values: any) {
      if (this.pagination.hasMore && !this.loading) {
        await this.getVaccination(values, true, this.pagination.pageSize)
      }
    },
    async approve(doc_id: string) {
      this.loading = true
      const vac_doc = await getDoc(doc(fb.db, 'vaccination_reports', doc_id))
      if (vac_doc.exists()) {
        if (vac_doc.data().decline == undefined) {
          await updateDoc(doc(fb.db, 'vaccination_reports', doc_id), {
            approved: true,
            finished: true
          })
          this.loading = false
          this.successful += 1
          emitReportStatsUpdate(REPORT_TYPES.VACCINATION, 'approve', doc_id, this)
        } else if (vac_doc.data().decline != undefined) {
          await updateDoc(doc(fb.db, 'vaccination_reports', doc_id), {
            approved: true,
            finished: true,
            decline: null
          })
          this.loading = false
          this.successful += 1
          emitReportStatsUpdate(REPORT_TYPES.VACCINATION, 'approve', doc_id, this)
        }
      }
    },
    async pending(doc_id: string) {
      this.loading = true
      await updateDoc(doc(fb.db, 'vaccination_reports', doc_id), { approved: false })
      this.loading = false
      this.successful += 1
      emitReportStatsUpdate(REPORT_TYPES.VACCINATION, 'pending', doc_id, this)
    },
    async in_progress(doc_id: string) {
      this.loading = true
      await updateDoc(doc(fb.db, 'vaccination_reports', doc_id), {
        approved: false,
        finished: false
      })
      this.loading = false
      this.successful += 1
      emitReportStatsUpdate(REPORT_TYPES.VACCINATION, 'in_progress', doc_id, this)
    },
    async decline(payload: any) {
      const { doc_id, is_decline, reason_for_decline } = payload
      this.loading = true
      await updateDoc(doc(fb.db, 'vaccination_reports', doc_id), {
        'decline.is_decline': is_decline,
        'decline.reason_for_decline': reason_for_decline,
        approved: false,
        finished: false
      })
      this.loading = false
      this.successful += 1
      emitReportStatsUpdate(REPORT_TYPES.VACCINATION, 'decline', doc_id, this)
    },
    async getReporterState(payload: any) {
      const reporterDoc = await getDoc(doc(fb.db, 'users', payload.uid))
      if (reporterDoc.exists()) {
        this.reporter_state.push({
          state_lga: reporterDoc.data().stateLga,
          doc_id: payload.doc_id
        })
      }
    }
  }
})
