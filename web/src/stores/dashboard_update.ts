import fb from '@/services/firebase'
import { collection, doc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore'
import { defineStore } from 'pinia'

export const useDashboardUpdate = defineStore('dashboard_update', {
  state: () => ({
    //
  }),
  actions: {
    async checkIfDashboardIsUpToDate() {
      // check if dashboard is up to date
      const d = new Date()
      const year = d.getFullYear()
      const month = d.getMonth()
      const day = d.getDate()

      const num_of_days = new Date(year, month, day, 0, 0).getTime()

      const docs = await getDocs(
        query(collection(fb.db, 'dashboard'), where('updated_at', '<', num_of_days))
      )
      if (!docs.empty) {
        // if dashboard is not up to date, run function that updates dashboard
        docs.forEach((item) => {
          if (this.validator(item)) {
            this.combineApprovedInProgressAndPending(item)
          }
          if (item.id === 'users') {
            this.combineUserFunction(item.id)
          }
          if (item.id === 'admins') {
            this.combineAdminFunction(item.id)
          }
        })
        console.log('updated')
      } else {
        console.log('none', num_of_days)
      }
    },
    validator(item: any) {
      if (
        item.id === 'abattoir_reports' ||
        item.id === 'aquaculture_reports' ||
        item.id === 'laboratory_reports' ||
        item.id === 'outbreak_reports' ||
        item.id === 'suspicion_reports' ||
        item.id === 'vaccination_reports' ||
        item.id === 'veterinarian_reports'
      ) {
        return true
      } else {
        return false
      }
    },
    async combineApprovedInProgressAndPending(item: any) {
      // All Reports
      await this.updateAllReports(item.data().updated_at, item.id)

      // Approved
      await this.updateApprovedAndInProgress(item.data().updated_at, item.id, {
        string: 'approved',
        sign: '==',
        value: true
      })

      // In Progress
      await this.updateApprovedAndInProgress(item.data().updated_at, item.id, {
        string: 'finished',
        sign: '==',
        value: false
      })

      // Pending
      await this.updatePending(
        item.data().updated_at,
        item.id,
        {
          string: 'approved',
          sign: '==',
          value: false
        },
        {
          string: 'finished',
          sign: '==',
          value: true
        }
      )
    },
    async updateApprovedAndInProgress(created_at: number, item_id: string, params: any) {
      // UPDATE dashboard with recent data
      const all_data = await getDocs(
        query(
          collection(fb.db, item_id),
          where('created_at', '>', created_at),
          where(params.string, params.sign, params.value)
        )
      )
      if (!all_data.empty) {
        if (params.string === 'approved') {
          updateDoc(doc(fb.db, 'dashboard', item_id), {
            total_approved: increment(all_data.size),
            updated_at: Date.now()
          })
        } else if (params.string === 'finished') {
          updateDoc(doc(fb.db, 'dashboard', item_id), {
            total_in_progress: increment(all_data.size),
            updated_at: Date.now()
          })
        }
      }
    },
    async updatePending(created_at: number, item_id: string, params: any, params2: any) {
      // UPDATE dashboard with recent data
      const all_data = await getDocs(
        query(
          collection(fb.db, item_id),
          where('created_at', '>', created_at),
          where(params.string, params.sign, params.value),
          where(params2.string, params2.sign, params2.value)
        )
      )
      if (!all_data.empty) {
        updateDoc(doc(fb.db, 'dashboard', item_id), {
          total_pending: increment(all_data.size),
          updated_at: Date.now()
        })
      }
    },
    async updateAllReports(created_at: number, item_id: string) {
      // UPDATE dashboard with recent data
      const all_data = await getDocs(
        query(collection(fb.db, item_id), where('created_at', '>', created_at))
      )
      if (!all_data.empty) {
        updateDoc(doc(fb.db, 'dashboard', item_id), {
          total_reports: increment(all_data.size),
          updated_at: Date.now()
        })
      }
    },
    async combineUserFunction(item_id: string) {
      this.updateApprovedUsers(item_id, { string: 'approved', sign: '==', value: 1 })
      this.updateTotalUsers(item_id)
    },
    async updateApprovedUsers(item_id: string, params: any) {
      const all_data = await getDocs(
        query(collection(fb.db, item_id), where(params.string, params.sign, params.value))
      )
      if (!all_data.empty) {
        updateDoc(doc(fb.db, 'dashboard', item_id), {
          approved_users: all_data.size,
          updated_at: Date.now()
        })
      }
    },
    async updateTotalUsers(item_id: string) {
      const all_data = await getDocs(collection(fb.db, item_id))
      if (!all_data.empty) {
        updateDoc(doc(fb.db, 'dashboard', item_id), {
          total_users: all_data.size,
          updated_at: Date.now()
        })
      }
    },
    async combineAdminFunction(item_id: string) {
      this.updateApprovedAdmin(item_id, { string: 'approved', sign: '==', value: 1 })
      this.updateTotalAdmin(item_id)
    },
    async updateApprovedAdmin(item_id: string, params: any) {
      const all_data = await getDocs(
        query(collection(fb.db, item_id), where(params.string, params.sign, params.value))
      )
      if (!all_data.empty) {
        updateDoc(doc(fb.db, 'dashboard', item_id), {
          approved_admins: all_data.size,
          updated_at: Date.now()
        })
      }
    },
    async updateTotalAdmin(item_id: string) {
      const all_data = await getDocs(collection(fb.db, item_id))
      if (!all_data.empty) {
        updateDoc(doc(fb.db, 'dashboard', item_id), {
          total_admins: all_data.size,
          updated_at: Date.now()
        })
      }
    }
  }
})
