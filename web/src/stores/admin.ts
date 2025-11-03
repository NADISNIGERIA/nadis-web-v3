import router from '@/router'
import fb from '@/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { useAuth } from './auth'
import useAlert from './../composables/alert'

export const useAdmin = defineStore('admin', {
  state: () => ({
    admin: {},
    details: {},
    registration_complete: false,
    loading: true
  }),
  actions: {
    checkIfAdminRegIsComplete() {
      onAuthStateChanged(fb.auth, (userAuth) => {
        if (userAuth) {
          const uid = userAuth.uid
          onSnapshot(doc(fb.db, 'admins', uid), (doc) => {
            if (doc.exists()) {
              this.admin = doc.data()
            }
          })
        }
      })
    },
    isAdmin() {
      onAuthStateChanged(fb.auth, (user) => {
        if (user) {
          onSnapshot(doc(fb.db, 'admins', user.uid), (doc) => {
            if (doc.exists()) {
              this.admin = doc.data()
              this.registration_complete = true
              if (doc.data().approved) {
                router.push({
                  name: 'Home'
                })
              } else {
                router.push({
                  name: 'AdminDetails'
                })
              }
            }
            this.loading = false
          })
        } else {
          router.push({
            name: 'Register'
          })
        }
      })
    },
    async submit(value: any) {
      value.phoneNumber = useAuth().user.phoneNumber
      const uid = useAuth().user.uid
      this.loading = true
      await setDoc(doc(fb.db, 'admins', uid), value)
      this.registration_complete = true
      this.loading = false
      useAlert().exposeAlert(5000, 'success', "You're in, Awaiting approval by the data unit of FDV & PCS after registration")
    }
  }
})
