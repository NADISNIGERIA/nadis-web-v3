<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useApprovedAgents } from '../../stores/approved_agents'
import InputText from '../inputs/InputText.vue'
import useAlert from './../../composables/alert'

export default defineComponent({
  components: { InputText },
  props: {
    agent: Object as any,
    full: Boolean
  },
  setup(props, ctx) {
    const fullname = ref(props.agent?.details?.fullname || '')
    const phone = ref(props.agent?.details?.phoneNumber || '')
    const email = ref(props.agent?.details?.email || '')
    const organization = ref(props.agent?.details?.organization || '')
    const position = ref(props.agent?.details?.position || '')
    const type_of_user = ref(props.agent?.details?.type_of_user || '')
    const vcn_number = ref(props.agent?.details?.vcn_number || '')
    const state = ref(props.agent?.stateLga?.state || '')
    const local_govt = ref(props.agent?.stateLga?.local_govt || '')
    const id = ref(props.agent?.id || '')

    const close = () => {
      ctx.emit('open-modal', false)
    }
    const approve = () => {
      useAlert().confirmBeforeAction(
        'Are you sure? This agent would be denied access to the mobile app',
        disableAgent,
        id.value
      )
    }
    const disableAgent = (id: string) => {
      useApprovedAgents().disable(id)
      close()
    }

    return {
      fullname,
      phone,
      email,
      organization,
      position,
      type_of_user,
      vcn_number,
      state,
      local_govt,
      approve,
      close
    }
  }
})
</script>

<template>
  <div
    class="absolute top-0 bg-nadis-fade h-screen"
    :class="{ 'left-1/6 w-5/6': !full, 'w-full': full }"
  >
    <div class="absolute top-1/10 md:top-1/6 w-full">
      <div
        class="relative mx-auto w-9/10 lg:w-3/4 px-12 py-16 bg-white rounded overflow-y-scroll h-screen-80 md:h-auto"
      >
        <div @click="close()" class="text-right cursor-pointer -mt-8 -mr-4 text-primary">Close</div>
        <form action="javascript:;">
          <p class="text-3xl">
            Agent Details
            <span v-if="vcn_number != ''">(VCN No. {{ vcn_number }})</span>
          </p>
          <p>Please check the following information for accuracy</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-x-3 pt-10">
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Agent's Full Name"
                v-model="fullname"
              ></input-text>
              <small>Full Name</small>
            </div>
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Agent's Phone Number"
                v-model="phone"
              ></input-text>
              <small>Phone Number</small>
            </div>
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Agent's Email Address"
                v-model="email"
              ></input-text>
              <small>Email</small>
            </div>
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Agent's Organization"
                v-model="organization"
              ></input-text>
              <small>Organization</small>
            </div>
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Agent's Position in Organization"
                v-model="position"
              ></input-text>
              <small>Position</small>
            </div>
            <div class="pt-3">
              <input-text
                type="text"
                placeholder="Agent's User Type"
                v-model="type_of_user"
              ></input-text>
              <small>Type of User</small>
            </div>
            <div class="pt-3">
              <input-text type="text" placeholder="Agent's State" v-model="state"></input-text>
              <small>State</small>
            </div>
            <div class="pt-3">
              <input-text type="text" placeholder="Agent's LGA" v-model="local_govt"></input-text>
              <small>LGA</small>
            </div>
            <div class="pt-3">
              <input-text type="text" placeholder="VCN Number" v-model="vcn_number"></input-text>
              <small>VCN Number</small>
            </div>
          </div>
          <div class="pt-12 w-1/2 mx-auto">
            <button
              class="bg-red-400 hover:bg-red-500 w-full cursor-pointer inline-block text-center px-2 py-3 font-medium rounded text-white focus:outline-none"
              @click="approve"
            >
              Disable Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
