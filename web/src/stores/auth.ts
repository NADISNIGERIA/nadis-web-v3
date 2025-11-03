import fb from '@/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { defineStore } from 'pinia'
import useAlert from '@/composables/alert'
import router from '@/router'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: {
      uid: null
    } as any
  }),
  actions: {
    setUser(userAuth: any) {
      const user_details = {
        uid: userAuth.uid,
        phoneNumber: userAuth.phoneNumber
      }
      this.user = user_details
    },
    currentUser() {
      onAuthStateChanged(fb.auth, (userAuth) => {
        this.setUser(userAuth)
      })
    },
    signOut() {
      fb.auth.signOut().then(() => {
        this.user = {
          uid: null
        }
        useAlert().exposeAlert(5000, 'success', 'Signed Out')
        router.push({
          name: 'Register'
        })
      })
    }
  }
})
