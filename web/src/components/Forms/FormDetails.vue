<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useAuth } from '../../stores/auth'
import { useForm } from '../../stores/form'
import InputText from '../inputs/InputText.vue'
import useAlert from './../../composables/alert'

export default defineComponent({
  components: { InputText },
  props: {
    full: Boolean,
    form: Object as any
  },
  setup(props, ctx) {
    const form_link = ref(props.form.form_link)
    const form_title = ref(props.form.form_title)
    const enabled = ref(props.form.enabled) as any

    const user = computed(() => useAuth().user)

    const close = () => {
      ctx.emit('open-details', false)
    }
    const updateForm = () => {
      let enabled_val = false
      if (validation()) {
        if (enabled.value == 'true') {
          enabled_val = true
        } else {
          enabled_val = false
        }
        const uniqueId = props.form.id
        const form = {
          id: uniqueId,
          form_link: form_link.value,
          form_title: form_title.value,
          updated_at: Date.now(),
          enabled: enabled_val,
          editor: user.value.uid
        }
        useForm().updateForm(form)
        close()
      }
    }
    const deleteForm = () => {
      useAlert().confirmBeforeAction('Do you want to delete form?', deleteFunction, props.form.id)
    }
    const deleteFunction = (form_id: any) => {
      useForm().deleteForm(form_id)
      useAlert().exposeAlert(5000, 'info', 'Deleted!')
      close()
    }
    const validation = () => {
      if (form_link.value != '' && form_title.value != '') {
        return true
      } else {
        useAlert().exposeAlert(5000, 'info', 'Fill All Fields')
      }
    }

    return { form_title, form_link, enabled, close, updateForm, deleteForm }
  }
})
</script>

<template>
  <div
    class="absolute top-0 bg-nadis-fade h-screen"
    :class="{ 'left-2/10 xl:left-1/6 w-5/6': !full, 'w-full left-0': full }"
  >
    <div class="absolute top-1/10 md:top-1/4 w-full">
      <div
        class="relative mx-auto w-9/10 lg:w-3/4 px-12 py-16 bg-white rounded overflow-y-scroll h-screen-80 md:h-auto"
      >
        <div @click="close()" class="text-right cursor-pointer -mt-8 -mr-4 text-primary">Close</div>
        <form action="javascript:;">
          <p class="text-3xl">Form Details</p>
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
            <div class="pt-3">
              <select
                class="border-b border-nadis-ash2 w-full px-2 py-3 font-medium bg-nadis-bg2 focus:outline-none"
                v-model="enabled"
              >
                <option value="true">enable</option>
                <option value="false">disable</option>
              </select>
              <small>Enable or Disable Form</small>
            </div>
          </div>
          <div class="md:flex">
            <div class="pt-12 w-full md:w-1/2 mx-auto md:mr-2">
              <button
                class="bg-primary hover:bg-primary-2 w-full cursor-pointer inline-block text-center px-2 py-3 font-medium rounded text-white focus:outline-none"
                @click="updateForm"
              >
                Update Form
              </button>
            </div>
            <div class="pt-4 md:pt-12 w-full md:w-1/2 mx-auto md:ml-2">
              <button
                class="bg-red-400 hover:bg-red-500 w-full cursor-pointer inline-block text-center px-2 py-3 font-medium rounded text-white focus:outline-none"
                @click="deleteForm"
              >
                Delete Form
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
