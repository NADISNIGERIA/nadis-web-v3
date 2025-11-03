import { defineStore } from 'pinia'

export const useUnsubscriber = defineStore('unsubscriber', {
  state: () => ({
    unsubscribe: [] as any
  }),
  actions: {
    unsubscribeAllSnapshot() {
      this.unsubscribe.forEach((unsub: () => any) => unsub())
      this.unsubscribe = []
    }
  }
})
