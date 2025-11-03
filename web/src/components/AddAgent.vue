<script lang="ts">
declare global {
  interface Window {
    recaptchaVerifier: any
    confirmationResult: any
    recaptchaWidgetId: any
  }
}

import { defineComponent, onMounted, ref } from 'vue'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import fb from './../services/firebase'
import useAlert from './../composables/alert'
import { addDoc, collection } from 'firebase/firestore'

export default defineComponent({
  props: {
    full: Boolean
  },
  setup(props, ctx) {
    const phone = ref('')

    const close = () => {
      ctx.emit('open-modal', false)
    }
    const onSignInSubmit = () => {
      const appVerifier = window.recaptchaVerifier
      signInWithPhoneNumber(fb.auth, phone.value, appVerifier)
        .then((confirmationResult) => {
          // SMS sent. Prompt user to type the code from the message, then sign the
          // user in with confirmationResult.confirm(code).
          window.confirmationResult = confirmationResult
          saveVerificationCode(confirmationResult)
          useAlert().exposeAlert(5000, 'info', 'An SMS has been sent to ' + phone.value)
          phone.value = ''
        })
        .catch((error) => {
          //Swal.fire('Error', error, 'error')
          console.log(error)
        })
    }
    const saveVerificationCode = async (confirmationResult: any) => {
      const data = {
        phone: phone.value,
        verificationId: confirmationResult.verificationId
      }
      await addDoc(collection(fb.db, 'verificationCodes'), data)
    }

    onMounted(() => {
      const auth = getAuth()
      window.recaptchaVerifier = new RecaptchaVerifier(
        'sign-in-button',
        {
          size: 'invisible',
          callback: (response: any) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            console.log(response)
            onSignInSubmit()
          }
        },
        auth
      )

      window.recaptchaVerifier.render().then((widgetId: any) => {
        window.recaptchaWidgetId = widgetId
      })
    })

    return { close, phone }
  }
})
</script>

<template>
  <div
    class="absolute top-0 bg-nadis-fade h-screen"
    :class="{ 'left-1/6 w-5/6': !full, 'w-full': full }"
  >
    <div class="absolute top-1/4 w-full">
      <div class="relative mx-auto w-1/2 px-12 py-16 bg-white rounded">
        <div @click="close" class="text-right cursor-pointer -mt-8 -mr-4 text-primary">Close</div>
        <form action="javascript:;">
          <p class="text-3xl">Add Agent</p>
          <p>Please fill in the following information to add an agent</p>
          <div class="pt-12">
            <input-text type="text" placeholder="Agent's Phone Number" v-model="phone"></input-text>
          </div>
          <div class="pt-12">
            <button
              id="sign-in-button"
              pattern="\+[0-9\s\-\(\)]+"
              type="submit"
              class="bg-primary hover:bg-primary-2 w-full cursor-pointer inline-block text-center px-2 py-3 font-medium rounded text-white focus:outline-none"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
