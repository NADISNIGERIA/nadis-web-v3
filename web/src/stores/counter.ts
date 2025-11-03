import fb from '@/services/firebase'
import { collection, getDocs } from 'firebase/firestore'
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
    }
  }
})
