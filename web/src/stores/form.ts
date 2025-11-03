import fb from '@/services/firebase'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import useAlert from './../composables/alert'

export const useForm = defineStore('form', {
  state: () => ({
    forms: [],
    loading: false
  }),
  actions: {
    async addForm(form: any) {
      this.loading = true
      const id = form.id
      delete form.id
      await setDoc(doc(fb.db, 'forms', id), form)
      useAlert().exposeAlert(5000, 'success', 'Form Added')

      return true
    },
    async updateForm(form: any) {
      this.loading = true
      const id = form.id
      delete form.id
      await updateDoc(doc(fb.db, 'forms', id), form)
      useAlert().exposeAlert(5000, 'success', 'Form Updated')

      return true
    },
    async deleteForm(id: any) {
      this.loading = true
      await deleteDoc(doc(fb.db, 'forms', id))

      return true
    },
    async getAllForms() {
      this.loading = true
      const docs = await getDocs(collection(fb.db, 'forms'))
      const forms_new = [] as any
      this.forms = []
      docs.forEach((doc) => {
        const form = doc.data()
        form.id = doc.id
        forms_new.push(form)
      })
      this.forms = forms_new
    }
  }
})
