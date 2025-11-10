<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useAdmin } from '../../stores/admin'
import useAlert from './../../composables/alert'
import LoadingIcon from './../../components/icons/LoadingIcon.vue'
import InputText from '../../components/inputs/InputText.vue'
import InputButton from '../../components/inputs/InputButton.vue'
import StateLga from '../../components/StateLga.vue'
import SelectArrowIcon from '../../components/icons/SelectArrowIcon.vue'

export default defineComponent({
  components: { LoadingIcon, InputText, InputButton, StateLga, SelectArrowIcon },
  setup() {
    const show_user_type = ref(false)
    const fullname = ref('')
    const email = ref('')
    const role = ref('')
    const type_of_users = ref(['State', 'Area Veterinary Officer (AVO)', 'Federal'])
    const state = ref('')
    const local_govt = ref('')
    const registration_complete = computed(() => useAdmin().registration_complete)
    const loading = computed(() => useAdmin().loading)

    const next = () => {
      if (validator()) {
        var details = {
          approved: false,
          fullname: fullname.value,
          email: email.value,
          role: role.value,
          state: state.value,
          lga: local_govt.value
        }
        useAdmin().submit(details)
      }
    }
    const validator = () => {
      if (fullname.value != '' && email.value != '' && role.value != '') {
        if (role.value == 'Federal') {
          return true
        } else if (role.value == 'State') {
          if (state.value != '' && local_govt.value != '') {
            return true
          } else {
            useAlert().exposeAlert(5000, 'info', 'Please fill your state and LGA')
          }
        } else if (role.value == 'Area Veterinary Officer (AVO)') {
          return true
        }
      } else {
        useAlert().exposeAlert(5000, 'info', 'Oops! Fill required fields.')
      }
    }
    const selectUserType = (val: any) => {
      role.value = type_of_users.value[val]
      show_user_type.value = false
    }
    const stateLga = (val: any) => {
      state.value = val.state
      local_govt.value = val.local_govt
    }

    onMounted(() => {
      useAdmin().isAdmin()
    })

    return {
      registration_complete,
      fullname,
      email,
      show_user_type,
      type_of_users,
      role,
      loading,
      stateLga,
      next,
      selectUserType
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-nadis-bg">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-primary via-primary-2 to-nadis-black text-white">
      <div class="container mx-auto px-6 py-8">
        <div class="flex items-center justify-center mb-6">
          <img src="/img/coat_of_arms.svg" alt="Nigeria Coat of Arms" class="w-12 h-12 mr-4">
          <div class="text-center">
            <h1 class="text-2xl font-bold">NADIS</h1>
            <p class="text-sm opacity-90">National Animal Disease Information System</p>
          </div>
        </div>
        <div class="text-center">
          <div class="inline-flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2 mb-4">
            <div class="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
            <span class="text-sm font-medium">Account Setup</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div class="max-w-2xl mx-auto">
        
        <!-- Registration Form -->
        <div v-if="!registration_complete" class="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          <!-- Form Header -->
          <div class="bg-gradient-to-r from-card-5 to-nadis-bg2 p-4 sm:p-8 border-b border-nadis-ash2">
            <div class="text-center">
              <h2 class="text-2xl sm:text-3xl font-bold text-nadis-black mb-2 sm:mb-3">Complete Your Profile</h2>
              <p class="text-nadis-ash text-base sm:text-lg px-2">Please provide your details to complete the registration process</p>
            </div>
          </div>

          <!-- Form Body -->
          <div class="p-4 sm:p-8 space-y-6 sm:space-y-8">
            <!-- Personal Information Section -->
            <div class="space-y-4 sm:space-y-6">
              <div class="flex items-center mb-4 sm:mb-6">
                <div class="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span class="text-white font-semibold text-xs sm:text-sm">1</span>
                </div>
                <h3 class="text-lg sm:text-xl font-semibold text-nadis-black">Personal Information</h3>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label class="block text-base font-semibold text-nadis-black mb-3">Full Name</label>
                  <input-text type="text" v-model="fullname" placeholder="Enter your full name"></input-text>
                </div>
                <div>
                  <label class="block text-base font-semibold text-nadis-black mb-3">Email Address</label>
                  <input-text type="text" v-model="email" placeholder="Enter your email"></input-text>
                </div>
              </div>
            </div>

            <!-- Role Selection Section -->
            <div class="space-y-4 sm:space-y-6">
              <div class="flex items-center mb-4 sm:mb-6">
                <div class="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span class="text-white font-semibold text-xs sm:text-sm">2</span>
                </div>
                <h3 class="text-lg sm:text-xl font-semibold text-nadis-black">Role & Location</h3>
              </div>

              <div>
                <label class="block text-base font-semibold text-nadis-black mb-3">Type of User</label>
                <div class="relative">
                  <div @click="show_user_type = !show_user_type" class="cursor-pointer">
                    <input-text type="text" placeholder="Select your role" readonly v-model="role"></input-text>
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
                    v-if="show_user_type" 
                    class="fixed inset-0 z-40"
                    @click="show_user_type = false"
                  ></div>
                  
                  <transition
                    leave-active-class="transition ease-in duration-300"
                    leave-to-class="opacity-0 transform scale-95"
                    enter-active-class="transition ease-out duration-300"
                    enter-to-class="opacity-100 transform scale-100"
                  >
                    <div class="relative" v-if="show_user_type">
                      <!-- Dropdown positioned above the input to prevent cutoff -->
                      <div class="bg-white absolute z-50 rounded-lg bottom-full mb-2 w-full border border-nadis-ash2 shadow-xl max-h-60 overflow-y-auto">
                        <div
                          class="px-4 py-3 hover:bg-card-5 cursor-pointer transition-colors duration-200 text-sm sm:text-base select-none"
                          :class="{
                            'rounded-t-lg': index == 0,
                            'rounded-b-lg': index + 1 == type_of_users.length,
                            'border-b border-nadis-ash2': index + 1 != type_of_users.length
                          }"
                          @click.stop="selectUserType(index)"
                          v-for="(type_of_user, index) in type_of_users"
                          :key="index"
                        >
                          <span class="text-nadis-black font-medium break-words">{{ type_of_user }}</span>
                        </div>
                      </div>
                    </div>
                  </transition>
                </div>
              </div>

              <!-- State/LGA Selection (conditional) -->
              <transition
                enter-active-class="transition ease-out duration-500"
                enter-to-class="opacity-100 transform translate-y-0"
                leave-active-class="transition ease-in duration-300"
                leave-to-class="opacity-0 transform -translate-y-4"
              >
                <div v-if="role == 'State'" class="bg-card-5 rounded-lg p-4 sm:p-6">
                  <div class="flex items-center mb-3 sm:mb-4">
                    <div class="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center mr-2">
                      <span class="text-white font-semibold text-xs">📍</span>
                    </div>
                    <h4 class="text-base sm:text-lg font-semibold text-nadis-black">Location Details</h4>
                  </div>
                  <state-lga v-on:state-lga="stateLga"></state-lga>
                </div>
              </transition>
            </div>

            <!-- Submit Button -->
            <div class="pt-4 sm:pt-6">
              <a href="javascript:;" @click="next()" class="block">
                <button class="w-full bg-primary hover:bg-primary-2 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg transform hover:scale-[1.02] text-sm sm:text-base">
                  Complete Registration
                </button>
              </a>
            </div>
          </div>
        </div>

        <!-- Approval Waiting State -->
        <div v-if="registration_complete" class="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-12 text-center">
          <div class="mb-6 sm:mb-8">
            <div class="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-dash-card-4 to-primary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <span class="text-3xl sm:text-4xl">⏳</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-bold text-nadis-black mb-3 sm:mb-4">Registration Complete!</h2>
            <p class="text-lg sm:text-xl text-nadis-ash mb-4 sm:mb-6">Your application is being reviewed</p>
            <div class="bg-nadis-bg2 border border-nadis-ash2 rounded-lg p-4 sm:p-6 max-w-md mx-auto">
              <p class="text-nadis-black font-semibold mb-2 text-sm sm:text-base">What happens next?</p>
              <p class="text-nadis-black text-xs sm:text-sm leading-relaxed">
                Our team will review your application and notify you once your account is approved. 
                This usually takes 1-2 business days.
              </p>
            </div>
          </div>
          <div class="flex justify-center">
            <img src="/img/gif/busstop.gif" alt="Waiting" class="rounded-lg shadow-md max-w-xs w-full h-auto" />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div class="fixed inset-0 bg-nadis-fade flex items-center justify-center z-50 p-4" v-if="loading">
      <div class="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 flex flex-col items-center shadow-2xl max-w-sm w-full">
        <loading-icon :width="'w-10'" :height="'w-10'" class="sm:w-12 sm:h-12"></loading-icon>
        <p class="mt-4 sm:mt-6 text-nadis-black font-semibold text-base sm:text-lg text-center">Processing your information...</p>
        <p class="text-nadis-ash text-xs sm:text-sm mt-2 text-center">Please wait while we set up your account</p>
      </div>
    </div>
  </div>
</template>
