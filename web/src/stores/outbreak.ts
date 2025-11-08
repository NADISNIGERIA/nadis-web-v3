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

export const useOutbreak = defineStore('outbreak', {
  state: () => ({
    outbreak: [] as any,
    reporter_state: [] as any,
    loading: false,
    successful: 0,
    pagination: {
      currentPage: 1,
      pageSize: 20,
      hasMore: true,
      lastVisible: null,
      totalCount: 0,
      pageCursors: {} as any, // Store cursors for each page for efficient navigation
      totalPages: 0
    },
    cache: {} as any,
    cacheExpiry: 5 * 60 * 1000 // 5 minutes
  }),
  actions: {
    // Helper method to generate cache key
    getCacheKey(filters: any) {
      return JSON.stringify(filters)
    },

    // Helper method to check if cache is valid
    isCacheValid(timestamp: number) {
      return Date.now() - timestamp < this.cacheExpiry
    },

    // Helper method to get cached data
    getCachedData(filters: any) {
      const key = this.getCacheKey(filters)
      const cached = this.cache[key]
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data
      }
      return null
    },

    // Helper method to cache data
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

    // Reset pagination state
    resetPagination() {
      this.pagination = {
        currentPage: 1,
        pageSize: 20,
        hasMore: true,
        lastVisible: null,
        totalCount: 0,
        pageCursors: {},
        totalPages: 0
      }
    },
    async getOutbreak(values: any, isNextPage = false, pageSize = 20) {
      try {
        this.loading = true
        const state = values.state

        // Check cache first (unless getting next page)
        if (!isNextPage) {
          const cached = this.getCachedData(values)
          if (cached) {
            this.outbreak = cached
            this.loading = false
            return
          }
          // Reset pagination for new filters
          this.resetPagination()
        }

        if (values.in_progress == true) {
          // Handle in-progress reports (no pagination for now, as these are typically fewer)
          if (state != 'All States') {
            const docs = await getDocs(
              query(
                collection(fb.db, 'outbreak_reports'),
                where('state', '==', state),
                where('finished', '==', false)
              )
            )
            let value = []
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
            
            // Sort by created_at descending (client-side)
            value.sort((a: any, b: any) => b.created_at - a.created_at)
            this.outbreak = value
          } else {
            const docs = await getDocs(
              query(
                collection(fb.db, 'outbreak_reports'), 
                where('finished', '==', false)
              )
            )
            let value = []
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
            
            // Sort by created_at descending (client-side)
            value.sort((a: any, b: any) => b.created_at - a.created_at)
            this.outbreak = value
          }
        } else if (values.in_progress == false) {
          let sort = false
          if (values.category == 1 || values.category === true) {
            sort = true
          } else {
            sort = false
          }

          // Build query without orderBy to avoid composite index requirement
          let queryRef: any

          // Add state filter if not 'All States'
          if (state != 'All States') {
            queryRef = query(
              collection(fb.db, 'outbreak_reports'),
              where('approved', '==', sort),
              where('state', '==', state),
              where('finished', '==', true),
              limit(pageSize)
            )
          } else {
            queryRef = query(
              collection(fb.db, 'outbreak_reports'),
              where('approved', '==', sort),
              where('finished', '==', true),
              limit(pageSize)
            )
          }

          // Add pagination cursor for next page
          if (isNextPage && this.pagination.lastVisible) {
            if (state != 'All States') {
              queryRef = query(
                collection(fb.db, 'outbreak_reports'),
                where('approved', '==', sort),
                where('state', '==', state),
                where('finished', '==', true),
                startAfter(this.pagination.lastVisible),
                limit(pageSize)
              )
            } else {
              queryRef = query(
                collection(fb.db, 'outbreak_reports'),
                where('approved', '==', sort),
                where('finished', '==', true),
                startAfter(this.pagination.lastVisible),
                limit(pageSize)
              )
            }
          }

          const docs = await getDocs(queryRef)
          let value = [] as any

          // If not getting next page, reset the array
          if (!isNextPage) {
            this.outbreak = []
            this.reporter_state = []
            this.pagination.currentPage = 1
          } else {
            // Append to existing data for next page
            value = [...this.outbreak]
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

          // Update pagination state
          this.pagination.lastVisible = docs.docs[docs.docs.length - 1] || null
          this.pagination.hasMore = docs.docs.length === pageSize
          this.pagination.pageSize = pageSize

          this.outbreak = value

          // Cache the data (only for first page)
          if (!isNextPage) {
            this.setCachedData(values, value)
          }
        }
      } catch (error) {
        console.error('Error fetching outbreak reports:', error)
      } finally {
        this.loading = false
      }
    },

    // Method to load next page
    async loadNextPage(values: any) {
      if (this.pagination.hasMore && !this.loading) {
        await this.getOutbreak(values, true, this.pagination.pageSize)
      }
    },

    // Method for traditional page-based navigation
    async getOutbreakPage(values: any, page: number, pageSize: number = 20) {
      try {
        this.loading = true
        const state = values.state

        // Update current page
        this.pagination.currentPage = page
        this.pagination.pageSize = pageSize

        if (values.in_progress == true) {
          // Handle in-progress reports (no pagination needed, typically fewer items)
          return await this.getOutbreak(values, false, pageSize)
        }

        let sort = false
        if (values.category == 1 || values.category === true) {
          sort = true
        } else {
          sort = false
        }

        // For page 1, start fresh
        if (page === 1) {
          this.pagination.pageCursors = {}
          this.pagination.lastVisible = null
          return await this.getOutbreak(values, false, pageSize)
        }

        // For subsequent pages, use cached cursors if available
        const cursors = this.pagination.pageCursors
        let queryRef: any

        // Build base query
        if (state != 'All States') {
          queryRef = query(
            collection(fb.db, 'outbreak_reports'),
            where('approved', '==', sort),
            where('state', '==', state),
            where('finished', '==', true),
            limit(pageSize)
          )
        } else {
          queryRef = query(
            collection(fb.db, 'outbreak_reports'),
            where('approved', '==', sort),
            where('finished', '==', true),
            limit(pageSize)
          )
        }

        // If we have a cursor for the previous page, use it
        const prevPageCursor = cursors[page - 1]
        if (prevPageCursor) {
          if (state != 'All States') {
            queryRef = query(
              collection(fb.db, 'outbreak_reports'),
              where('approved', '==', sort),
              where('state', '==', state),
              where('finished', '==', true),
              startAfter(prevPageCursor),
              limit(pageSize)
            )
          } else {
            queryRef = query(
              collection(fb.db, 'outbreak_reports'),
              where('approved', '==', sort),
              where('finished', '==', true),
              startAfter(prevPageCursor),
              limit(pageSize)
            )
          }
        } else {
          // If no cursor available, we need to navigate sequentially
          // This is a limitation of Firebase cursor-based pagination
          // For better UX, we'll load from page 1 and navigate to the desired page
          await this.loadPagesSequentially(values, page, pageSize)
          return
        }

        const docs = await getDocs(queryRef)
        let value = [] as any

        // Reset the array for page-based navigation
        this.outbreak = []
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

        // Sort by created_at descending (client-side)
        value.sort((a: any, b: any) => b.created_at - a.created_at)

        // Update pagination state
        this.pagination.lastVisible = docs.docs[docs.docs.length - 1] || null
        this.pagination.hasMore = docs.docs.length === pageSize
        
        // Store cursor for this page
        if (docs.docs.length > 0) {
          this.pagination.pageCursors[page] = docs.docs[docs.docs.length - 1]
        }

        // Estimate total count for traditional pagination
        if (page === 1 && docs.docs.length === pageSize) {
          this.pagination.totalCount = Math.max(pageSize * 3, value.length + pageSize * 2)
        } else if (docs.docs.length < pageSize) {
          this.pagination.totalCount = (page - 1) * pageSize + docs.docs.length
          this.pagination.hasMore = false
        } else {
          this.pagination.totalCount = Math.max(this.pagination.totalCount, page * pageSize + pageSize)
        }

        this.outbreak = value

      } catch (error) {
        console.error('Error fetching outbreak page:', error)
      } finally {
        this.loading = false
      }
    },

    // Helper method to load pages sequentially when cursor is not available
    async loadPagesSequentially(values: any, targetPage: number, pageSize: number) {
      try {
        // Start from page 1 and load sequentially to build cursors
        this.pagination.pageCursors = {}
        this.pagination.currentPage = 1
        
        // Load first page
        await this.getOutbreak(values, false, pageSize)
        
        // Store cursor for page 1
        if (this.pagination.lastVisible) {
          this.pagination.pageCursors[1] = this.pagination.lastVisible
        }

        // Load subsequent pages until we reach target page
        for (let page = 2; page <= targetPage; page++) {
          if (this.pagination.hasMore) {
            await this.getOutbreak(values, true, pageSize)
            if (this.pagination.lastVisible) {
              this.pagination.pageCursors[page] = this.pagination.lastVisible
            }
          }
        }

        // Now load the target page data only
        if (targetPage > 1 && this.pagination.pageCursors[targetPage - 1]) {
          await this.getOutbreakPage(values, targetPage, pageSize)
        }

        this.pagination.currentPage = targetPage
      } catch (error) {
        console.error('Error loading pages sequentially:', error)
      }
    },
    async approve(doc_id: any) {
      this.loading = true
      const outbreak_doc = await getDoc(doc(fb.db, 'outbreak_reports', doc_id))
      if (outbreak_doc.exists()) {
        if (outbreak_doc.data().decline == undefined) {
          await updateDoc(doc(fb.db, 'outbreak_reports', doc_id), {
            approved: true,
            finished: true
          })
          this.loading = false
          this.successful += 1
          emitReportStatsUpdate(REPORT_TYPES.OUTBREAK, 'approve', doc_id, this)
        } else if (outbreak_doc.data().decline != undefined) {
          await updateDoc(doc(fb.db, 'outbreak_reports', doc_id), {
            approved: true,
            finished: true,
            decline: null
          })
          this.loading = false
          this.successful += 1
          emitReportStatsUpdate(REPORT_TYPES.OUTBREAK, 'approve', doc_id, this)
        }
      }
    },
    async pending(doc_id: string) {
      this.loading = true
      await updateDoc(doc(fb.db, 'outbreak_reports', doc_id), { approved: false })
      this.loading = false
      this.successful += 1
      emitReportStatsUpdate(REPORT_TYPES.OUTBREAK, 'pending', doc_id, this)
    },
    async in_progress(doc_id: string) {
      this.loading = true
      await updateDoc(doc(fb.db, 'outbreak_reports', doc_id), { approved: false, finished: false })
      this.loading = false
      this.successful += 1
      emitReportStatsUpdate(REPORT_TYPES.OUTBREAK, 'in_progress', doc_id, this)
    },
    async decline(payload: any) {
      const { doc_id, is_decline, reason_for_decline } = payload
      this.loading = true
      await updateDoc(doc(fb.db, 'outbreak_reports', doc_id), {
        'decline.is_decline': is_decline,
        'decline.reason_for_decline': reason_for_decline,
        approved: false,
        finished: false
      })
      this.loading = false
      this.successful += 1
      emitReportStatsUpdate(REPORT_TYPES.OUTBREAK, 'decline', doc_id, this)
    },
    async getReporterState(payload: any) {
      const reporterDoc = await getDoc(doc(fb.db, 'users', payload.uid))

      if (reporterDoc.exists()) {
        this.reporter_state.push({
          state_lga: reporterDoc.data().stateLga,
          doc_id: payload.doc_id
        })
      }
    },

    // Bulk edit methods
    async bulkUpdateStatus(docIds: string[], newStatus: 'pending' | 'in_progress' | 'approved') {
      this.loading = true
      const results = {
        success: [] as string[],
        failed: [] as string[]
      }

      try {
        for (const docId of docIds) {
          try {
            const updates: any = {}

            switch (newStatus) {
              case 'pending':
                updates.approved = false
                updates.finished = true
                break
              case 'in_progress':
                updates.approved = false
                updates.finished = false
                break
              case 'approved':
                updates.approved = true
                updates.finished = true
                break
            }

            await updateDoc(doc(fb.db, 'outbreak_reports', docId), updates)
            results.success.push(docId)

            emitReportStatsUpdate(REPORT_TYPES.OUTBREAK, newStatus === 'approved' ? 'approve' : newStatus === 'in_progress' ? 'in_progress' : 'pending', docId, this)
          } catch (error) {
            console.error(`Failed to update report ${docId}:`, error)
            results.failed.push(docId)
          }
        }

        this.successful += 1
        return results
      } finally {
        this.loading = false
      }
    },

    // Export method with date filtering and no pagination limit
    async exportOutbreak(filters: {
      category: boolean,
      state: string,
      in_progress: boolean,
      startDate?: string,
      endDate?: string
    }) {
      try {
        this.loading = true
        const state = filters.state
        let sort = false

        if (filters.in_progress === true) {
          // Handle in-progress exports
          let queryRef: any
          if (state !== 'All States') {
            queryRef = query(
              collection(fb.db, 'outbreak_reports'),
              where('state', '==', state),
              where('finished', '==', false)
            )
          } else {
            queryRef = query(
              collection(fb.db, 'outbreak_reports'),
              where('finished', '==', false)
            )
          }

          // Add date filtering if provided
          if (filters.startDate || filters.endDate) {
            const constraints = []
            if (filters.startDate) {
              const startTimestamp = new Date(filters.startDate).getTime()
              constraints.push(where('created_at', '>=', startTimestamp))
            }
            if (filters.endDate) {
              // Add 24 hours to include the entire end date
              const endTimestamp = new Date(filters.endDate).getTime() + (24 * 60 * 60 * 1000)
              constraints.push(where('created_at', '<=', endTimestamp))
            }
            
            // Rebuild query with date constraints
            if (state !== 'All States') {
              queryRef = query(
                collection(fb.db, 'outbreak_reports'),
                where('state', '==', state),
                where('finished', '==', false),
                ...constraints
              )
            } else {
              queryRef = query(
                collection(fb.db, 'outbreak_reports'),
                where('finished', '==', false),
                ...constraints
              )
            }
          }

          const docs = await getDocs(queryRef)
          const value = []
          docs.forEach((doc) => {
            const unit = doc.data()
            unit.doc_id = doc.id
            value.push(unit)
          })

          // Sort by created_at descending
          value.sort((a: any, b: any) => b.created_at - a.created_at)
          return value

        } else {
          // Handle approved/pending exports
          if (filters.category) {
            sort = true
          } else {
            sort = false
          }

          let queryRef: any
          const constraints = [
            where('approved', '==', sort),
            where('finished', '==', true)
          ]

          // Add state filter if not 'All States'
          if (state !== 'All States') {
            constraints.push(where('state', '==', state))
          }

          // Add date filtering if provided
          if (filters.startDate || filters.endDate) {
            if (filters.startDate) {
              const startTimestamp = new Date(filters.startDate).getTime()
              constraints.push(where('created_at', '>=', startTimestamp))
            }
            if (filters.endDate) {
              // Add 24 hours to include the entire end date
              const endTimestamp = new Date(filters.endDate).getTime() + (24 * 60 * 60 * 1000)
              constraints.push(where('created_at', '<=', endTimestamp))
            }
          }

          queryRef = query(collection(fb.db, 'outbreak_reports'), ...constraints)
          
          const docs = await getDocs(queryRef)
          const value = []
          docs.forEach((doc) => {
            const unit = doc.data()
            unit.doc_id = doc.id
            value.push(unit)
          })

          // Sort by created_at descending
          value.sort((a: any, b: any) => b.created_at - a.created_at)
          return value
        }
      } catch (error) {
        console.error('Error exporting outbreak reports:', error)
        return []
      } finally {
        this.loading = false
      }
    }
  }
})
