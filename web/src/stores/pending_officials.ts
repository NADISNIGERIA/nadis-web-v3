import fb from '@/services/firebase'
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import useAlert from './../composables/alert'

export const usePendingOfficials = defineStore('pending_officials', {
  state: () => ({
    pending_officials: [],
    loading: false
  }),
  actions: {
    async pending() {
      const docs = await getDocs(query(collection(fb.db, 'admins'), where('approved', '==', false)))
      const pending = [] as any
      docs.forEach((element) => {
        const user = element.data()
        user.id = element.id
        pending.push(user)
      })
      this.pending_officials = pending
    },
    async approve(id: string) {
      this.loading = true
      await updateDoc(doc(fb.db, 'admins', id), { approved: true })
      this.loading = true
      useAlert().exposeAlert(5000, 'success', 'Done! Official Approved.')
    }
  }
})
