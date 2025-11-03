<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import AddForm from '../components/Forms/AddForm.vue'
import FormTable from '../components/Forms/FormTable.vue'
import PagesTop from '../components/PagesTop.vue'
import { useHome } from '../stores/home'
import { useMiddleware } from '../stores/middleware'
import router from './../router'

export default defineComponent({
  props: {
    full: Boolean
  },
  components: { PagesTop, FormTable, AddForm },
  setup(props, ctx) {
    const active_menu = ref(5)
    const open_form = ref(false)

    const role = computed(() => useMiddleware().role)

    const openForm = (val: any) => {
      open_form.value = val
    }

    onMounted(() => {
      ctx.emit('active-menu', active_menu.value)
      useHome().hasAccess()
      if (role.value != 'Federal') {
        router.push({
          name: 'Home'
        })
      }
    })

    return { open_form, openForm }
  }
})
</script>

<template>
  <div class="text-left">
    <pages-top :title="'Forms'"></pages-top>
    <div class="pt-7 text-right text-xl">
      <div
        class="px-5 py-3 mr-10 bg-primary hover:bg-primary-2 text-white rounded-sm inline-block cursor-pointer"
        @click="open_form = true"
      >
        <span>Add Form Link</span>
      </div>
    </div>
    <form-table :full="full"></form-table>
    <add-form v-if="open_form" :full="full" v-on:open-form="openForm"></add-form>
  </div>
</template>
