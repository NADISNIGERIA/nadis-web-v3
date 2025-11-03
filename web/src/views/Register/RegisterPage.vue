<script lang="ts">
declare global {
  interface Window {
    recaptchaVerifier: any
    confirmationResult: any
    recaptchaWidgetId: any
  }
}

import {
  getAuth,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth'
import { computed, defineComponent, onMounted, ref } from 'vue'
import fb from '../../services/firebase'
import { useAuth } from './../../stores/auth'
import { useMiddleware } from './../../stores/middleware'
import useAlert from './../../composables/alert'
import router from './../../router'
import InputText from '../../components/inputs/InputText.vue'
import InputButton from '../../components/inputs/InputButton.vue'
import LoadingIcon from '../../components/icons/LoadingIcon.vue'

export default defineComponent({
  components: { InputText, InputButton, LoadingIcon },
  setup() {
    const phone = ref('+234')
    const code = ref('')
    const show_code = ref(false)
    // const verificationId = ref('') as any
    const loading = ref(false)
    const isUserAlreadySignedIn = computed(() => useAuth().user.uid)

    const getCode = () => {
      loading.value = true
      const appVerifier = window.recaptchaVerifier
      signInWithPhoneNumber(fb.auth, phone.value, appVerifier)
        .then((confirmationResult) => {
          // SMS sent. Prompt user to type the code from the message, then sign the
          // user in with confirmationResult.confirm(code).
          window.confirmationResult = confirmationResult
          show_code.value = true
          loading.value = false
          useAlert().exposeAlert(5000, 'success', `An SMS has been sent to ${phone.value}`)
        })
        .catch((error) => {
          useAlert().exposeAlert(5000, 'error', error.message)
        })
    }
    const signIn = () => {
      window.confirmationResult
        .confirm(code.value)
        .then((result: any) => {
          console.log(result)
          useAuth().currentUser()
          useMiddleware().access
          router.push({
            name: 'Home'
          })
        })
        .catch((error: any) => {
          useAlert().exposeAlert(5000, 'error', error.message)
        })
    }

    onMounted(() => {
      if (isUserAlreadySignedIn.value == null) {
        const auth = getAuth()
        window.recaptchaVerifier = new RecaptchaVerifier(
          'sign-in-button',
          {
            size: 'invisible',
            callback: (response: any) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
              console.log(response)
              getCode()
            }
          },
          auth
        )

        window.recaptchaVerifier.render().then((widgetId: any) => {
          window.recaptchaWidgetId = widgetId
        })
      }
      onAuthStateChanged(fb.auth, (user) => {
        if (user) {
          router.push({
            name: 'Home'
          })
        }
      })
    })

    return { phone, show_code, code, signIn, loading }
  }
})
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left Panel - Green Theme -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-2 to-nadis-black relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-0 w-full h-full">
          <div class="grid grid-cols-8 gap-4 p-8 h-full">
            <div v-for="i in 64" :key="i" class="bg-white rounded-full opacity-20 animate-pulse" :style="`animation-delay: ${i * 100}ms`"></div>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 flex flex-col justify-center items-center text-white p-12">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold mb-4">Nigeria Animal Disease Information System</h1>
          <p class="text-xl opacity-90 mb-2">NADIS</p>
          <p class="text-lg opacity-80">Federal Ministry of Livestock Development</p>
        </div>
        
        <div class="max-w-md text-center">
          <h2 class="text-2xl font-semibold mb-4">Monitoring & Reporting</h2>
          <p class="text-lg opacity-90 leading-relaxed">
            Advanced disease surveillance and reporting system to protect Nigeria's livestock and ensure food security.
          </p>
        </div>
        
        <!-- Decorative Elements -->
        <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-nadis-black to-transparent"></div>
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary to-transparent rounded-bl-full"></div>
      </div>
    </div>

    <!-- Right Panel - Login Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-nadis-bg">
      <div class="max-w-md w-full">
        <!-- Logo and Header -->
        <div class="text-center mb-8">
          <div class="mb-6">
            <img src="/img/coat_of_arms.svg" alt="Nigeria Coat of Arms" class="w-20 h-20 mx-auto mb-4">
          </div>
          <h2 class="text-3xl font-bold text-nadis-black mb-2">Welcome Back</h2>
          <p class="text-nadis-ash">Sign in to access NADIS</p>
        </div>

        <!-- Mobile Header (visible on small screens) -->
        <div class="lg:hidden text-center mb-8 p-6 bg-primary text-white rounded-lg shadow-lg">
          <h1 class="text-xl font-bold mb-2">NADIS</h1>
          <p class="text-sm opacity-90">Nigeria Animal Disease Information System</p>
        </div>

        <!-- Login Form -->
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div v-if="!show_code">
            <div class="mb-6">
              <label class="block text-sm font-medium text-nadis-black mb-2">Phone Number</label>
              <input-text 
                type="text" 
                v-model="phone" 
                placeholder="Enter your phone number" 
                required
                class="w-full"
              ></input-text>
              <small class="text-nadis-ash text-xs mt-1 block">Format: +2348077766655 (not 08077766655)</small>
            </div>
            
            <div v-show="phone != ''">
              <button
                id="sign-in-button"
                pattern="\+[0-9\s\-\(\)]+"
                type="submit"
                class="w-full bg-primary hover:bg-primary-2 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg"
              >
                Get Verification Code
              </button>
            </div>
          </div>

          <div v-if="show_code">
            <div class="mb-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <label class="block text-sm font-medium text-nadis-black">Phone Number</label>
                  <p class="text-nadis-black font-medium">{{ phone }}</p>
                </div>
                <button 
                  @click="show_code = false"
                  class="text-primary hover:text-primary-2 text-sm font-medium focus:outline-none"
                >
                  Edit
                </button>
              </div>
            </div>
            
            <div class="mb-6">
              <label class="block text-sm font-medium text-nadis-black mb-2">Verification Code</label>
              <input-text 
                type="text" 
                v-model="code" 
                placeholder="Enter 6-digit PIN"
                class="w-full"
              ></input-text>
              <small class="text-nadis-ash text-xs mt-1 block">Enter the code sent to your phone</small>
            </div>
            
            <button
              @click="signIn()"
              class="w-full bg-primary hover:bg-primary-2 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg"
            >
              Verify & Sign In
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-8">
          <p class="text-sm text-nadis-ash">
            © 2025 Federal Ministry of Livestock Development, Nigeria
          </p>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" v-if="loading">
      <div class="bg-white rounded-lg p-8 flex flex-col items-center">
        <loading-icon :width="'w-10'" :height="'h-10'"></loading-icon>
        <p class="mt-4 text-nadis-black font-medium">Processing...</p>
      </div>
    </div>
  </div>
</template>
