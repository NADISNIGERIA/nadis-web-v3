<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useAuth } from '../../stores/auth'
import uniqid from 'uniqid'
import { useForm } from '../../stores/form'
import useAlert from './../../composables/alert'
import InputText from '../inputs/InputText.vue'

export default defineComponent({
  components: { InputText },
  props: {
    full: Boolean
  },
  setup(props, ctx) {
    const form_link = ref('')
    const form_title = ref('')

    const user = computed(() => useAuth().user)

    const close = () => {
      ctx.emit('open-form', false)
    }
    const addForm = () => {
      if (validation()) {
        const uniqueId = uniqid()
        const form = {
          id: uniqueId,
          form_link: form_link.value,
          form_title: form_title.value,
          created_at: Date.now(),
          enabled: true,
          editor: user.value.uid
        }
        useForm().addForm(form)
        close()
      }
    }
    const validation = () => {
      if (form_link.value != '' && form_title.value != '') {
        return true
      } else {
        useAlert().exposeAlert(5000, 'info', 'Fill All Fields')
      }
    }

    return { form_title, form_link, close, addForm }
  }
})
</script>

<template>
  <div
    class="absolute top-0 bg-nadis-fade h-screen"
    :class="{ 'left-1/6 w-5/6': !full, 'w-full': full }"
  >
    <div class="absolute top-1/10 md:top-1/4 w-full">
      <div class="relative mx-auto w-9/10 lg:w-3/4 px-12 py-16 bg-white rounded overflow-y-scroll">
        <div @click="close()" class="text-right cursor-pointer -mt-8 -mr-4 text-primary">Close</div>
        <form action="javascript:;">
          <p class="text-3xl">Add Form Details</p>
          <p>Please check the following information for accuracy</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-3 pt-10">
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Add Form Title Here"
                v-model="form_title"
              ></input-text>
              <small>Form Title</small>
            </div>
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Add Form Link Here"
                v-model="form_link"
              ></input-text>
              <small>Form Link</small>
            </div>
          </div>
          <div class="pt-12 w-3/4 lg:w-1/2 mx-auto">
            <button
              class="bg-red-400 hover:bg-red-500 w-full cursor-pointer inline-block text-center px-2 py-3 font-medium rounded text-white focus:outline-none"
              @click="addForm()"
            >
              Add to Mobile App
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
