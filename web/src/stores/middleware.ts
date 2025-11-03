import router from '@/router'
import fb from '@/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { defineStore } from 'pinia'

export const useMiddleware = defineStore('middleware', {
  state: () => ({
    role: '',
    has_access: false
  }),
  actions: {
    getRole() {
      onAuthStateChanged(fb.auth, (user) => {
        if (user) {
          onSnapshot(doc(fb.db, 'admins', user.uid), (doc) => {
            if (doc.exists()) {
              this.role = doc.data().role
            }
          })
        }
      })
    },
    access() {
      onAuthStateChanged(fb.auth, (user) => {
        if (user) {
          onSnapshot(doc(fb.db, 'admins', user.uid), (doc) => {
            if (doc.exists()) {
              if (doc.data().approved == true) {
                this.has_access = true
              } else {
                this.has_access = false
                router.push({
                  name: 'AdminDetails'
                })
              }
            } else {
              this.has_access = false
              router.push({
                name: 'AdminDetails'
              })
            }
          })
        } else {
          this.has_access = false
          if (router.currentRoute.value.name != 'Register') {
            router.push({
              name: 'Register'
            })
          }
        }
      })
    }
  }
})
