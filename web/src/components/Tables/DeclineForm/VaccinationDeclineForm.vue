<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { useVaccination } from '../../../stores/vaccination'
import InputTextArea from '../../inputs/InputTextArea.vue'
import useAlert from './../../../composables/alert'

export default defineComponent({
  components: { InputTextArea },
  props: {
    full: Boolean,
    doc_id: [String, Number]
  },
  setup(props, ctx) {
    const form_report = ref('')
    const text_length = ref(0)
    const total_chars = ref(150)
    const disable = ref(false)

    watch(form_report, () => {
      text_length.value = form_report.value.length
      if (text_length.value > total_chars.value) {
        disable.value = true
      } else if (text_length.value <= total_chars.value) {
        disable.value = false
      }
    })

    const close = () => {
      ctx.emit('open-form', false)
    }
    const addForm = () => {
      if (validation()) {
        const payload = {
          doc_id: props.doc_id,
          is_decline: true,
          reason_for_decline: form_report.value
        }
        close()
        useVaccination().decline(payload)
      }
    }
    const validation = () => {
      if (props.doc_id != undefined && form_report.value != '') {
        return true
      } else {
        useAlert().exposeAlert(5000, 'info', 'Fill All Fields')
      }
    }

    return { text_length, total_chars, form_report, disable, close, addForm }
  }
})
</script>

<template>
  <div
    class="absolute top-0 bg-nadis-fade h-screen"
    :class="{ 'left-1/6 w-5/6': !full, 'w-full': full }"
  >
    <div class="absolute top-1/10 md:top-1/4 w-full">
      <div class="relative mx-auto w-9/10 lg:w-2/4 px-12 py-16 bg-white rounded overflow-y-scroll">
        <div @click="close()" class="text-right cursor-pointer -mt-8 -mr-4 text-primary">Close</div>
        <div>
          <p class="text-3xl">Vaccination Decline Form</p>
          <p>Please give a detailed reason for declining this report</p>
          <div class="pt-10">
            <div class="space-y-2">
              <div
                class="float-right"
                :class="{
                  'text-red-600': text_length > total_chars,
                  'text-green-600': text_length == total_chars
                }"
              >
                ( <span> {{ text_length }}</span> of <span>{{ total_chars }} </span>)
              </div>
              <input-text-area
                type="text"
                placeholder="Add your reasons here..."
                v-model="form_report"
              ></input-text-area>
            </div>
          </div>
          <div class="pt-12 w-2/4 mx-auto">
            <button
              v-if="disable == false"
              class="w-full inline-block text-center px-2 py-3 font-medium rounded text-white focus:outline-none"
              @click="addForm()"
              :class="{
                'bg-red-400 hover:bg-red-500 cursor-pointer': disable == false
              }"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
