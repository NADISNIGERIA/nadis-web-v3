import router from '@/router'
import fb from '@/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { defineStore } from 'pinia'

export const useHome = defineStore('home', {
  state: () => ({
    loading: false
  }),
  actions: {
    hasAccess() {
      this.loading = false
      onAuthStateChanged(fb.auth, (user) => {
        if (user) {
          onSnapshot(doc(fb.db, 'admins', user.uid), (doc) => {
            if (doc.exists()) {
              if (doc.data().approved == undefined) {
                router.push({
                  name: 'AdminDetails'
                })
              }
            } else {
              router.push({
                name: 'AdminDetails'
              })
            }
          })
        } else {
          router.push({
            name: 'Register'
          })
        }
      })
    }
  }
})
