import fb from '@/services/firebase'
import { emitReportStatsUpdate, REPORT_TYPES } from '@/services/reportStatsHelpers'
import { collection, doc, getDoc, getDocs, query, updateDoc, where, orderBy, limit, startAfter, getCountFromServer } from 'firebase/firestore'
import { defineStore } from 'pinia'

export const useLaboratory = defineStore('laboratory', {
  state: () => ({
    laboratory: [],
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
    cache: new Map(),
    currentFilters: null as any
  }),
  actions: {
    // Cache management methods
    getCacheKey(values: any): string {
      return JSON.stringify({
        state: values.state,
        in_progress: values.in_progress,
        category: values.category
      })
    },

    isCacheValid(timestamp: number): boolean {
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
      return Date.now() - timestamp < CACHE_DURATION
    },

    getCachedData(values: any) {
      const key = this.getCacheKey(values)
      const cached = this.cache.get(key)
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data
      }
      return null
    },

    setCachedData(values: any, data: any) {
      const key = this.getCacheKey(values)
      this.cache.set(key, {
        data: [...data],
        timestamp: Date.now()
      })
    },

    // Clear all cache data
    clearCache() {
      this.cache.clear()
    },

    resetPagination() {
      this.pagination.currentPage = 1
      this.pagination.hasMore = true
      this.pagination.lastVisible = null
      this.pagination.totalCount = 0
      this.pagination.pageCursors = {}
      this.pagination.totalPages = 0
    },

    // Reset pagination but preserve totalCount to avoid "0 - 0 of 0" flash
    resetPaginationSoft() {
      this.pagination = {
        ...this.pagination,
        currentPage: 1,
        hasMore: true,
        lastVisible: null,
        pageCursors: {}
      }
    },
    async show_in_progress_a_state(state: any) {
      const docs = await getDocs(
        query(
          collection(fb.db, 'laboratory_reports'),
          where('state', '==', state),
          where('finished', '==', false)
        )
      )
      const value = [] as any
      this.reporter_state = []
      docs.forEach((doc) => {
        const unit = doc.data()
        unit.doc_id = doc.id
        this.getReporterState({ uid: doc.data().uid, doc_id: doc.id })
        value.push(unit)
      })
      this.laboratory = []
      this.laboratory = value.sort((a: any, b: any) => b.created_at - a.created_at)
      // Update totalCount for pagination display
      this.pagination.totalCount = value.length
      this.pagination.totalPages = Math.ceil(value.length / this.pagination.pageSize)
    },

    async getLaboratoryCount(values: any) {
      try {
        const state = values.state
        let queryRef = collection(fb.db, 'laboratory_reports')

        const queryConstraints = []
        
        // Apply the same filters as the data query
        if (values.category) {
          // When category is specified, approved = true
          queryConstraints.push(where('approved', '==', true))
        } else {
          // When no category, approved = false
          queryConstraints.push(where('approved', '==', false))
        }
        
        if (state && state !== 'All States') {
          queryConstraints.push(where('state', '==', state))
        }
        
        // Always add finished = true for main data queries
        queryConstraints.push(where('finished', '==', true))

        queryRef = query(collection(fb.db, 'laboratory_reports'), ...queryConstraints)

        const snapshot = await getCountFromServer(queryRef)
        return snapshot.data().count
      } catch (error) {
        console.error('Error getting laboratory count:', error)
        return 0
      }
    },

    async show_in_progress_all_states() {
      const docs = await getDocs(
        query(collection(fb.db, 'laboratory_reports'), where('finished', '==', false))
      )
      const value = [] as any
      this.reporter_state = []
      docs.forEach((doc) => {
        const unit = doc.data()
        unit.doc_id = doc.id
        this.getReporterState({ uid: doc.data().uid, doc_id: doc.id })
        value.push(unit)
      })
      this.laboratory = []
      this.laboratory = value.sort((a: any, b: any) => b.created_at - a.created_at)
    },
    async getLaboratory(values: any, isNextPage = false, pageSize = 20) {
      try {
        this.loading = true
        const state = values.state

        // Check cache first (unless getting next page)
        if (!isNextPage) {
          const cached = this.getCachedData(values)
          if (cached) {
            this.laboratory = cached
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
              collection(fb.db, 'laboratory_reports'),
              where('approved', '==', sort),
              where('state', '==', state),
              where('finished', '==', true),
              limit(pageSize)
            )
          } else {
            queryRef = query(
              collection(fb.db, 'laboratory_reports'),
              where('approved', '==', sort),
              where('finished', '==', true),
              limit(pageSize)
            )
          }

          // Add pagination cursor
          if (isNextPage && this.pagination.lastVisible) {
            if (state != 'All States') {
              queryRef = query(
                collection(fb.db, 'laboratory_reports'),
                where('approved', '==', sort),
                where('state', '==', state),
                where('finished', '==', true),
                startAfter(this.pagination.lastVisible),
                limit(pageSize)
              )
            } else {
              queryRef = query(
                collection(fb.db, 'laboratory_reports'),
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
            this.laboratory = []
            this.reporter_state = []
            this.pagination.currentPage = 1
          } else {
            value = [...this.laboratory]
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

          this.laboratory = value

          if (!isNextPage) {
            this.setCachedData(values, value)
          }
        }
      } catch (error) {
        console.error('Error fetching laboratory reports:', error)
      } finally {
        this.loading = false
      }
    },

    // New method for traditional pagination
    async getLaboratoryPage(values: any, page = 1, pageSize = 20) {
      try {
        this.loading = true;
        
        // Update pageSize in pagination state
        this.pagination.pageSize = pageSize;
        
        const state = values.state;

        // Create a filter key to detect status/filter changes
        const currentFilterKey = JSON.stringify({
          state: values.state,
          in_progress: values.in_progress,
          category: values.category
        });

        // Check if filters have changed - if so, reset pagination completely
        if (this.currentFilters !== currentFilterKey) {
          this.currentFilters = currentFilterKey;
          this.resetPagination(); // Full reset when status changes
        }

        // Check cache first (only after filter change check)
        // Include pageSize in cache key to handle different page sizes
        const cacheKey = `${JSON.stringify(values)}_page_${page}_size_${pageSize}`;
        if (this.pagination.pageCursors && this.pagination.pageCursors[cacheKey]) {
          this.laboratory = this.pagination.pageCursors[cacheKey].data;
          this.pagination.currentPage = page;
          this.loading = false;
          return;
        }

        if (values.in_progress == true) {
          // Handle in-progress reports with pagination
          await this.loadInProgressPagesSequentially(values, page, pageSize, state);
          this.pagination.currentPage = page;
          this.loading = false;
          return;
        }

        let sort = false;
        if (values.category) {
          sort = true;
        } else {
          sort = false;
        }

        // For page 1, no cursor needed
        if (page === 1) {
          await this.loadPagesSequentially(values, 1, pageSize, sort, state);
        } else {
          // Load pages sequentially up to the requested page
          await this.loadPagesSequentially(values, page, pageSize, sort, state);
        }

        this.pagination.currentPage = page;
      } catch (error) {
        console.error('Error fetching laboratory page:', error);
      } finally {
        this.loading = false;
      }
    },

    async loadPagesSequentially(values: any, targetPage: number, pageSize: number, sort: boolean, state: string) {
      let currentCursor = null;

      // Load pages sequentially to get to the target page
      for (let page = 1; page <= targetPage; page++) {
        const cacheKey = `${JSON.stringify(values)}_page_${page}_size_${pageSize}`;

        // Check if this page is already cached
        if (this.pagination.pageCursors && this.pagination.pageCursors[cacheKey]) {
          currentCursor = this.pagination.pageCursors[cacheKey].cursor;
          if (page === targetPage) {
            this.laboratory = this.pagination.pageCursors[cacheKey].data;
          }
          continue;
        }

        // Build query
        let queryRef: any;
        
        if (state != 'All States') {
          if (currentCursor) {
            queryRef = query(
              collection(fb.db, 'laboratory_reports'),
              where('approved', '==', sort),
              where('state', '==', state),
              where('finished', '==', true),
              startAfter(currentCursor),
              limit(pageSize)
            );
          } else {
            queryRef = query(
              collection(fb.db, 'laboratory_reports'),
              where('approved', '==', sort),
              where('state', '==', state),
              where('finished', '==', true),
              limit(pageSize)
            );
          }
        } else {
          if (currentCursor) {
            queryRef = query(
              collection(fb.db, 'laboratory_reports'),
              where('approved', '==', sort),
              where('finished', '==', true),
              startAfter(currentCursor),
              limit(pageSize)
            );
          } else {
            queryRef = query(
              collection(fb.db, 'laboratory_reports'),
              where('approved', '==', sort),
              where('finished', '==', true),
              limit(pageSize)
            );
          }
        }

        const docs = await getDocs(queryRef);
        let value = [] as any;
        this.reporter_state = [];

        docs.forEach((doc) => {
          const unit = doc.data();
          unit.doc_id = doc.id;
          this.getReporterState({
            uid: doc.data().uid,
            doc_id: doc.id
          });
          value.push(unit);
        });

        // Sort by created_at descending (client-side)
        value.sort((a: any, b: any) => b.created_at - a.created_at);

        // Cache this page
        const lastDoc = docs.docs[docs.docs.length - 1] || null;
        this.pagination.pageCursors[cacheKey] = {
          data: value,
          cursor: lastDoc
        };

        // Update cursor for next iteration
        currentCursor = lastDoc;

        // If this is the target page, set it as current data
        if (page === targetPage) {
          this.laboratory = value;
        }

        // Update total count and pages - get accurate count on first page
        if (page === 1) {
          // Get accurate total count from server
          try {
            this.pagination.totalCount = await this.getLaboratoryCount(values);
            this.pagination.totalPages = Math.ceil(this.pagination.totalCount / pageSize);
          } catch (error) {
            // Fallback to estimation if count fails
            this.pagination.totalCount = Math.max(pageSize * 3, value.length + pageSize * 2)
            this.pagination.totalPages = Math.ceil(this.pagination.totalCount / pageSize);
          }
        } else {
          // For subsequent pages, update total based on what we've seen
          const currentTotal = ((page - 1) * pageSize) + docs.docs.length;
          if (docs.docs.length === pageSize) {
            // Still getting full pages, estimate more
            this.pagination.totalCount = Math.max(this.pagination.totalCount, currentTotal + pageSize);
          } else {
            // This is the last page
            this.pagination.totalCount = currentTotal;
          }
          this.pagination.totalPages = Math.ceil(this.pagination.totalCount / pageSize);
        }

        // If we got fewer docs than pageSize, we've reached the end
        if (docs.docs.length < pageSize) {
          this.pagination.totalPages = page;
          this.pagination.totalCount = ((page - 1) * pageSize) + docs.docs.length;
          break;
        }
      }
    },

    // Helper method to load in-progress reports with pagination
    async loadInProgressPagesSequentially(values: any, targetPage: number, pageSize: number, state: string) {
      let currentCursor = null

      for (let page = 1; page <= targetPage; page++) {
        const cacheKey = `${JSON.stringify(values)}_inprogress_page_${page}_size_${pageSize}`

        if (this.pagination.pageCursors && this.pagination.pageCursors[cacheKey]) {
          currentCursor = this.pagination.pageCursors[cacheKey].cursor
          if (page === targetPage) {
            this.laboratory = this.pagination.pageCursors[cacheKey].data
          }
          continue
        }

        let queryRef: any
        
        if (state != 'All States') {
          if (currentCursor) {
            queryRef = query(
              collection(fb.db, 'laboratory_reports'),
              where('state', '==', state),
              where('finished', '==', false),
              startAfter(currentCursor),
              limit(pageSize)
            )
          } else {
            queryRef = query(
              collection(fb.db, 'laboratory_reports'),
              where('state', '==', state),
              where('finished', '==', false),
              limit(pageSize)
            )
          }
        } else {
          if (currentCursor) {
            queryRef = query(
              collection(fb.db, 'laboratory_reports'),
              where('finished', '==', false),
              startAfter(currentCursor),
              limit(pageSize)
            )
          } else {
            queryRef = query(
              collection(fb.db, 'laboratory_reports'),
              where('finished', '==', false),
              limit(pageSize)
            )
          }
        }

        const docs = await getDocs(queryRef)
        let value = [] as any
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

        value.sort((a: any, b: any) => b.created_at - a.created_at)

        const lastDoc = docs.docs[docs.docs.length - 1] || null
        this.pagination.pageCursors[cacheKey] = {
          data: value,
          cursor: lastDoc
        }

        currentCursor = lastDoc

        if (page === targetPage) {
          this.laboratory = value
        }

        if (page === 1) {
          try {
            let countQueryRef: any
            if (state != 'All States') {
              countQueryRef = query(
                collection(fb.db, 'laboratory_reports'),
                where('state', '==', state),
                where('finished', '==', false)
              )
            } else {
              countQueryRef = query(
                collection(fb.db, 'laboratory_reports'),
                where('finished', '==', false)
              )
            }
            
            const snapshot = await getCountFromServer(countQueryRef)
            this.pagination.totalCount = snapshot.data().count
            this.pagination.totalPages = Math.ceil(this.pagination.totalCount / pageSize)
          } catch (error) {
            if (docs.docs.length === pageSize) {
              this.pagination.totalCount = pageSize * 3
            } else {
              this.pagination.totalCount = docs.docs.length
            }
            this.pagination.totalPages = Math.ceil(this.pagination.totalCount / pageSize)
          }
        } else {
          const currentTotal = ((page - 1) * pageSize) + docs.docs.length
          if (docs.docs.length === pageSize) {
            this.pagination.totalCount = Math.max(this.pagination.totalCount, currentTotal + pageSize)
          } else {
            this.pagination.totalCount = currentTotal
          }
          this.pagination.totalPages = Math.ceil(this.pagination.totalCount / pageSize)
        }

        this.pagination.lastVisible = lastDoc
        this.pagination.hasMore = docs.docs.length === pageSize

        if (docs.docs.length < pageSize) {
          this.pagination.totalCount = ((page - 1) * pageSize) + docs.docs.length
          break
        }
      }

      this.pagination.currentPage = targetPage
    },

    async loadNextPage(values: any) {
      if (this.pagination.hasMore && !this.loading) {
        await this.getLaboratory(values, true, this.pagination.pageSize)
      }
    },
    async approve(doc_id: string) {
      this.loading = true
      const ar_doc = await getDoc(doc(fb.db, 'laboratory_reports', doc_id))

      if (ar_doc.exists()) {
        if (ar_doc.data().decline == undefined) {
          await updateDoc(doc(fb.db, 'laboratory_reports', doc_id), {
            approved: true,
            finished: true
          })
          this.loading = false
          this.successful += 1
          emitReportStatsUpdate(REPORT_TYPES.LABORATORY, 'approve', doc_id, this)
        } else if (ar_doc.data().decline != undefined) {
          await updateDoc(doc(fb.db, 'laboratory_reports', doc_id), {
            approved: true,
            finished: true,
            decline: null
          })
          this.loading = false
          this.successful += 1
          emitReportStatsUpdate(REPORT_TYPES.LABORATORY, 'approve', doc_id, this)
        }
      }
    },
    async pending(doc_id: string) {
      this.loading = true
      await updateDoc(doc(fb.db, 'laboratory_reports', doc_id), { approved: false })
      this.loading = false
      this.successful += 1
      emitReportStatsUpdate(REPORT_TYPES.LABORATORY, 'pending', doc_id, this)
    },
    async in_progress(doc_id: any) {
      this.loading = true
      await updateDoc(doc(fb.db, 'laboratory_reports', doc_id), {
        approved: false,
        finished: false
      })
      this.loading = false
      this.successful += 1
      emitReportStatsUpdate(REPORT_TYPES.LABORATORY, 'in_progress', doc_id, this)
    },
    async decline(payload: any) {
      const { doc_id, is_decline, reason_for_decline } = payload
      this.loading = true
      await updateDoc(doc(fb.db, 'laboratory_reports', doc_id), {
        'decline.is_decline': is_decline,
        'decline.reason_for_decline': reason_for_decline,
        approved: false,
        finished: false
      })
      this.loading = false
      this.successful += 1
      emitReportStatsUpdate(REPORT_TYPES.LABORATORY, 'decline', doc_id, this)
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

            await updateDoc(doc(fb.db, 'laboratory_reports', docId), updates)
            results.success.push(docId)

            emitReportStatsUpdate(REPORT_TYPES.LABORATORY, newStatus === 'approved' ? 'approve' : newStatus === 'in_progress' ? 'in_progress' : 'pending', docId, this)
          } catch (error) {
            console.error(`Failed to update report ${docId}:`, error)
            results.failed.push(docId)
          }
        }

        // Clear pagination cache to force data reload
        this.resetPagination()

        this.successful += 1
        return results
      } finally {
        this.loading = false
      }
    },

    // Export method with date filtering and no pagination limit
    async exportLaboratory(filters: {
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
              collection(fb.db, 'laboratory_reports'),
              where('state', '==', state),
              where('finished', '==', false)
            )
          } else {
            queryRef = query(
              collection(fb.db, 'laboratory_reports'),
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
                collection(fb.db, 'laboratory_reports'),
                where('state', '==', state),
                where('finished', '==', false),
                ...constraints
              )
            } else {
              queryRef = query(
                collection(fb.db, 'laboratory_reports'),
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

          queryRef = query(collection(fb.db, 'laboratory_reports'), ...constraints)
          
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
        console.error('Error exporting laboratory reports:', error)
        return []
      } finally {
        this.loading = false
      }
    }
  }
})
