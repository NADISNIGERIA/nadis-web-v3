import fb from '@/services/firebase'
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import useAlert from './../composables/alert'
import { useUnsubscriber } from './unsubscriber'

export const useApprovedOfficials = defineStore('approved_officials', {
  state: () => ({
    approved_officials: [],
    loading: false
  }),
  actions: {
    approved() {
      const unsubscribe = onSnapshot(query(collection(fb.db, 'admins'), where('approved', '==', true)), (doc) => {
        const approved = [] as any
        doc.forEach((element) => {
          const user = element.data()
          user.id = element.id
          approved.push(user)
        })
        this.approved_officials = approved
      })
      useUnsubscriber().unsubscribe.push(unsubscribe)
    },
    async disable(id: any) {
      this.loading = true
      await updateDoc(doc(fb.db, 'admins', id), { approved: false })
      this.loading = false
      useAlert().exposeAlert(5000, 'success', 'Done! Official Disabled.')
    }
  }
})
