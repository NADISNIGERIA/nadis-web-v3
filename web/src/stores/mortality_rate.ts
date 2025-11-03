import fb from '@/services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'

export const useMortalityRate = defineStore('mortality_rate', {
  state: () => ({
    outbreak_mortality: [],
    suspicion_mortality: [],
    aquaculture_mortality: []
  }),
  actions: {
    resetOutbreak() {
      this.outbreak_mortality = []
    },
    async outbreakMortality() {
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const docs = await getDocs(
        query(collection(fb.db, 'outbreak_reports'), where('created_at', '>', last_six_months))
      )
      if (!docs.empty) {
        const value = [] as any
        docs.forEach((doc) => {
          if (doc.data().approved == true) {
            if (doc.data().number_of_animals != undefined) {
              if (doc.data().number_of_animals.deaths != '') {
                const unit = doc.data()
                value.push(unit)
              }
            }
          }
        })
        this.outbreak_mortality = value
      }
    },
    async suspicionMortality() {
      this.suspicion_mortality = []
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const docs = await getDocs(
        query(collection(fb.db, 'suspicion_reports'), where('created_at', '>', last_six_months))
      )
      const value = [] as any
      docs.forEach((doc) => {
        if (doc.data().approved == true) {
          if (doc.data().total_number_of_animals != undefined) {
            if (doc.data().total_number_of_animals.dead_animals != '') {
              const unit = doc.data()
              value.push(unit)
            }
          }
        }
      })
      this.suspicion_mortality = value
    },
    async aquacultureMortality() {
      this.aquaculture_mortality = []
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const docs = await getDocs(
        query(collection(fb.db, 'aquaculture_reports'), where('created_at', '>', last_six_months))
      )
      const value = [] as any
      docs.forEach((doc) => {
        if (doc.data().approved == true) {
          if (doc.data().passive_surveillance != undefined) {
            if (doc.data().passive_surveillance.mortality_for_month != '') {
              const unit = doc.data()
              value.push(unit)
            }
          }
        }
      })
      this.aquaculture_mortality = value
    }
  },
  getters: {
    number_month: (state) => (number: any) => {
      //var date = new Date()
      const month = new Date().getMonth()
      let new_month = month - number
      if (new_month < 0) {
        new_month = 12 + new_month
      }
      const values = [] as any[]
      state.outbreak_mortality.forEach((outbreak: any) => {
        const created_month = new Date(outbreak.created_at).getMonth()
        if (created_month == new_month) {
          values.push(outbreak)
        }
      })
      return values
    },
    suspicion_number_month: (state) => (number: any) => {
      //var date = new Date()
      const month = new Date().getMonth()
      let new_month = month - number
      if (new_month < 0) {
        new_month = 12 + new_month
      }
      const values = [] as any[]
      state.suspicion_mortality.forEach((suspicion: any) => {
        const created_month = new Date(suspicion.created_at).getMonth()
        if (created_month == new_month) {
          values.push(suspicion)
        }
      })
      return values
    },
    aquaculture_number_month: (state) => (number: any) => {
      //var date = new Date()
      const month = new Date().getMonth()
      let new_month = month - number
      if (new_month < 0) {
        new_month = 12 + new_month
      }
      const values = [] as any[]
      state.aquaculture_mortality.forEach((aquaculture: any) => {
        const created_month = new Date(aquaculture.created_at).getMonth()
        if (created_month == new_month) {
          values.push(aquaculture)
        }
      })
      return values
    }
  }
})
