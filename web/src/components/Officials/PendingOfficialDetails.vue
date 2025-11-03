<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { usePendingOfficials } from '../../stores/pending_officials'
import InputText from '../inputs/InputText.vue'
import useAlert from './../../composables/alert'

export default defineComponent({
  components: { InputText },
  props: {
    official: Object as any,
    full: Boolean,
    show: Boolean
  },
  setup(props, ctx) {
    const fullname = ref(props.official?.fullname || '')
    const phone = ref(props.official?.phoneNumber || '')
    const email = ref(props.official?.email || '')
    const role = ref(props.official?.role || '')
    const state = ref(props.official?.state || '')
    const local_govt = ref(props.official?.local_govt || '')
    const id = ref(props.official?.id || '')

    const close = () => {
      ctx.emit('close', false)
    }
    const approve = () => {
      useAlert().confirmBeforeAction(
        'Are you sure? This Official would have access to the web app',
        approveOfficial,
        id.value
      )
    }
    const approveOfficial = (id: string) => {
      usePendingOfficials().approve(id)
      close()
    }

    // Watch for changes in the official prop and update refs
    watch(() => props.official, (newOfficial) => {
      if (newOfficial) {
        fullname.value = newOfficial.fullname || ''
        phone.value = newOfficial.phoneNumber || ''
        email.value = newOfficial.email || ''
        role.value = newOfficial.role || ''
        state.value = newOfficial.state || ''
        local_govt.value = newOfficial.local_govt || ''
        id.value = newOfficial.id || ''
      }
    }, { immediate: true, deep: true })

    return { fullname, phone, email, role, state, local_govt, close, approve }
  }
})
</script>

<template>
  <div
    v-if="show && official"
    class="absolute top-0 bg-nadis-fade h-screen"
    :class="{ 'left-1/6 w-5/6': !full, 'w-full': full }"
  >
    <div class="absolute top-1/10 md:top-1/6 w-full">
      <div
        class="relative mx-auto w-9/10 lg:w-3/4 px-12 py-16 bg-white rounded overflow-y-scroll h-screen-80 md:h-auto"
      >
        <div @click="close" class="text-right cursor-pointer -mt-8 -mr-4 text-primary">Close</div>
        <form action="javascript:;">
          <p class="text-3xl">Official Details</p>
          <p>Please check the following information for accuracy</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-x-3 pt-10">
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Official's Full Name"
                v-model="fullname"
              ></input-text>
              <small>Full Name</small>
            </div>
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Official's Phone Number"
                v-model="phone"
              ></input-text>
              <small>Phone Number</small>
            </div>
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Official's Email Address"
                v-model="email"
              ></input-text>
              <small>Email</small>
            </div>
            <div class="pt-3">
              <input-text type="text" placeholder="Official's Role" v-model="role"></input-text>
              <small>Role</small>
            </div>
            <div class="pt-3">
              <input-text type="text" placeholder="Official's State" v-model="state"></input-text>
              <small>State</small>
            </div>
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Official's LGA"
                v-model="local_govt"
              ></input-text>
              <small>LGA</small>
            </div>
          </div>
          <div class="pt-12 w-1/2 mx-auto">
            <button
              class="bg-primary hover:bg-primary-2 w-full cursor-pointer inline-block text-center px-2 py-3 font-medium rounded text-white focus:outline-none"
              @click="approve"
            >
              Approve User
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
