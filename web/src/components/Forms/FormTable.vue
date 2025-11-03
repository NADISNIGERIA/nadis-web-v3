<script lang="ts">
import { useForm } from './../../stores/form'
import { computed, defineComponent, onMounted, ref } from 'vue'
import FormDetails from './FormDetails.vue'

export default defineComponent({
  components: { FormDetails },
  props: {
    full: Boolean
  },
  setup() {
    const show_details = ref(false)
    const form = ref({}) as any

    const forms = computed(() => useForm().forms) as any

    const showDetails = (val: any) => {
      form.value = forms.value[val]
      show_details.value = true
    }
    const openDetails = (val: any) => {
      form.value = {}
      show_details.value = val
    }

    onMounted(() => {
        useForm().getAllForms()
    })

    return { forms, form, show_details, showDetails, openDetails }
  }
})
</script>

<template>
  <div class="py-6 px-6">
    <div
      class="bg-card-13 border-primary border-l-2 cursor-pointer py-5 px-4 mt-4"
      @click="showDetails(index)"
      v-for="(form, index) in forms"
      :key="index"
    >
      <div class="">
        <div>Form No: {{ index + 1 }}</div>
      </div>
      <div class="pt-6">
        <div>Form Title</div>
        <div class="pt-3 text-primary-2">{{ form.form_title }}</div>
      </div>
      <div class="pt-6">
        <div>Form Link</div>
        <div class="pt-3 text-primary-2">{{ form.form_link }}</div>
      </div>
      <div class="pt-6 text-primary-2">
        <div v-if="form.enabled">Form is active</div>
        <div v-else>Form is disabled</div>
      </div>
    </div>
    <form-details
      v-if="show_details"
      :form="form"
      :full="full"
      v-on:open-details="openDetails"
    ></form-details>
  </div>
</template>
