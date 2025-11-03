<script lang="ts">
import { defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import useListOfStates from './../composables/list_of_states'
import SelectArrowIcon from './icons/SelectArrowIcon.vue'
import InputText from './inputs/InputText.vue'

export default defineComponent({
  components: { SelectArrowIcon, InputText },
  props: {
    state_from_db: String,
    local_govt_from_db: String
  },
  setup(props, ctx) {
    const { local_govt_from_db: local_govt_from_db, state_from_db: state_from_db } = toRefs(props)
    const states = ref(useListOfStates().states)
    const new_states = ref([]) as any
    const state = ref('')
    const local_govts = ref([]) as any
    const new_local_govts = ref([]) as any
    const local_govt = ref('')
    const local_search = ref('')
    const state_search = ref('')
    const show_state = ref(false)
    const show_local_govt = ref(false)

    const selectState = (val: any) => {
      state.value = new_states.value[val].name
      show_state.value = false
      state_search.value = ''
      // Reset local government when state changes
      local_govt.value = ''
      show_local_govt.value = false
    }
    const searchStates = (val: any) => {
      states.value.forEach((state) => {
        const state_name = state.name.toLowerCase()
        const lowercase_val = val.toLowerCase()
        if (state_name.includes(lowercase_val)) {
          new_states.value.push(state)
        }
      })
    }
    const selectLocalGovt = (val: any) => {
      local_govt.value = new_local_govts.value[val].name
      show_local_govt.value = false
      local_search.value = ''
    }
    const getLocalGovts = (val: any) => {
      states.value.forEach((state) => {
        if (state.name == val) {
          local_govts.value = state.locals
          new_local_govts.value = state.locals
        }
      })
    }
    const searchLocals = (val: any) => {
      local_govts.value.forEach((local: any) => {
        var local_name = local.name.toLowerCase()
        var lowercase_val = val.toLowerCase()
        if (local_name.includes(lowercase_val)) {
          new_local_govts.value.push(local)
        }
      })
    }

    watch(state_search, () => {
      new_states.value = []
      searchStates(state_search.value)
    })
    watch(local_search, () => {
      new_local_govts.value = []
      searchLocals(local_search.value)
    })
    watch(state, () => {
      local_govts.value = []
      getLocalGovts(state.value)
    })
    watch(local_govt, () => {
      if (local_govt.value != '' && state.value != '') {
        const state_lga = {
          state: state.value,
          local_govt: local_govt.value
        }
        ctx.emit('state-lga', state_lga)
      }
    })
    watch(state_from_db, () => {
      if (state_from_db.value != undefined) {
        state.value = state_from_db.value
      }
    })
    watch(local_govt_from_db, () => {
      if (local_govt_from_db.value != undefined) {
        local_govt.value = local_govt_from_db.value
      }
    })

    onMounted(() => {
      new_states.value = states.value
      if (local_govt_from_db.value != undefined) {
        local_govt.value = local_govt_from_db.value
      }
      if (state_from_db.value != undefined) {
        state.value = state_from_db.value
      }
    })

    return { states, state, show_state, state_search, new_states, local_search, show_local_govt, local_govt, new_local_govts, selectState, selectLocalGovt }
  }
})
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- State Selection -->
    <div class="relative">
      <label class="block text-base font-semibold text-nadis-black mb-3">State</label>
      <div class="relative">
        <div @click="show_state = !show_state" class="cursor-pointer">
          <input-text type="text" placeholder="Select your state" readonly v-model="state"></input-text>
          <div class="relative">
            <a href="javascript:;">
              <select-arrow-icon
                class="absolute right-0 -mt-8 mr-4 pointer-events-none"
                :width="'w-4'"
                :height="'h-4'"
                :color="'text-primary'"
              ></select-arrow-icon>
            </a>
          </div>
        </div>
        
        <!-- Backdrop to close dropdown when clicking outside -->
        <div 
          v-if="show_state" 
          class="fixed inset-0 z-40"
          @click="show_state = false"
        ></div>
        
        <transition
          leave-active-class="transition ease-in duration-300"
          leave-to-class="opacity-0 transform scale-95"
          enter-active-class="transition ease-out duration-300"
          enter-to-class="opacity-100 transform scale-100"
        >
          <div class="relative" v-if="show_state">
            <div class="bg-white absolute z-50 rounded-lg bottom-full mb-2 w-full border border-nadis-ash2 shadow-xl max-h-60 overflow-hidden">
              <!-- Search Input -->
              <div class="p-3 border-b border-nadis-ash2">
                <input
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-nadis-ash2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Search states..."
                  v-model="state_search"
                  @click.stop
                />
              </div>
              <!-- Options List -->
              <div class="overflow-y-auto max-h-40">
                <div
                  class="px-4 py-3 hover:bg-card-5 cursor-pointer transition-colors duration-200 text-sm sm:text-base select-none"
                  :class="{
                    'border-b border-nadis-ash2': index + 1 != new_states.length
                  }"
                  @click.stop="selectState(index)"
                  v-for="(state_item, index) in new_states"
                  :key="index"
                >
                  <span class="text-nadis-black font-medium">{{ state_item.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Local Government Selection -->
    <div class="relative">
      <label class="block text-base font-semibold text-nadis-black mb-3">Local Government Area</label>
      <div class="relative">
        <div @click="state != '' ? show_local_govt = !show_local_govt : null" :class="{ 'cursor-pointer': state != '', 'cursor-not-allowed opacity-50': state == '' }">
          <input-text 
            type="text" 
            :placeholder="state != '' ? 'Select your LGA' : 'Please select a state first'" 
            readonly 
            v-model="local_govt"
            :disabled="state == ''"
          ></input-text>
          <div class="relative" v-if="state != ''">
            <a href="javascript:;">
              <select-arrow-icon
                class="absolute right-0 -mt-8 mr-4 pointer-events-none"
                :width="'w-4'"
                :height="'h-4'"
                :color="'text-primary'"
              ></select-arrow-icon>
            </a>
          </div>
        </div>
        
        <!-- Backdrop to close dropdown when clicking outside -->
        <div 
          v-if="show_local_govt" 
          class="fixed inset-0 z-40"
          @click="show_local_govt = false"
        ></div>
        
        <transition
          leave-active-class="transition ease-in duration-300"
          leave-to-class="opacity-0 transform scale-95"
          enter-active-class="transition ease-out duration-300"
          enter-to-class="opacity-100 transform scale-100"
        >
          <div class="relative" v-if="show_local_govt && state != ''">
            <div class="bg-white absolute z-50 rounded-lg bottom-full mb-2 w-full border border-nadis-ash2 shadow-xl max-h-60 overflow-hidden">
              <!-- Search Input -->
              <div class="p-3 border-b border-nadis-ash2">
                <input
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-nadis-ash2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Search local governments..."
                  v-model="local_search"
                  @click.stop
                />
              </div>
              <!-- Options List -->
              <div class="overflow-y-auto max-h-40">
                <div
                  class="px-4 py-3 hover:bg-card-5 cursor-pointer transition-colors duration-200 text-sm sm:text-base select-none"
                  :class="{
                    'border-b border-nadis-ash2': index + 1 != new_local_govts.length
                  }"
                  @click.stop="selectLocalGovt(index)"
                  v-for="(local, index) in new_local_govts"
                  :key="index"
                >
                  <span class="text-nadis-black font-medium">{{ local.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>
