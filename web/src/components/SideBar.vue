<script lang="ts">
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import useAlert from './../composables/alert'
import { useAuth } from './../stores/auth'
import { useMiddleware } from './../stores/middleware'

export default defineComponent({
  props: {
    active_menu: Number,
    isMobile: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close-mobile'],
  setup(props, { emit }) {
    const { active_menu: active_menu } = toRefs(props)
    const showSubmenu = ref(false)
    const menu_index = ref(1) as any

    const role = computed(() => useMiddleware().role)

    watch(active_menu, () => {
      menu_index.value = active_menu.value
    })
    watch(menu_index, () => {
      if (menu_index.value !== 6) {
        showSubmenu.value = false
      }
    })

    const signOut = () => {
      useAlert().confirmBeforeAction('Do you want to logout?', useSignOut)
    }
    const useSignOut = () => {
      useAuth().signOut()
    }
    const interoperabilityMenu = () => {
      showSubmenu.value = !showSubmenu.value
    }

    const closeMobile = () => {
      emit('close-mobile')
    }

    onMounted(() => {
      useMiddleware().getRole()
    })

    return { signOut, interoperabilityMenu, showSubmenu, role, menu_index, closeMobile }
  }
})
</script>

<template>
  <div class="bg-gradient-to-br from-primary via-primary-2 to-nadis-black text-white text-left shadow overflow-y-auto h-screen relative w-full">
    <!-- Background decoration -->
    <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-nadis-black to-transparent opacity-50"></div>
    <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white to-transparent opacity-10 rounded-bl-full"></div>
    
    <div class="px-8 lg:px-12 pt-6 lg:pt-9 relative z-10">
      <div class="flex items-center justify-between">
        <!-- Modern Logo with Nigeria Coat of Arms -->
        <div class="flex items-center space-x-4 min-w-0 flex-1 pr-6 lg:pr-8">
          <!-- Nigeria Coat of Arms -->
          <div class="w-12 h-12 lg:w-14 lg:h-14 bg-white bg-opacity-20 lg:bg-white rounded-xl flex items-center justify-center backdrop-blur-sm p-2 flex-shrink-0">
            <img src="/img/coat_of_arms.svg" alt="Nigeria Coat of Arms" class="w-full h-full object-contain" />
          </div>
          <!-- Text -->
          <div class="flex flex-col min-w-0 flex-1">
            <h1 class="text-xl lg:text-2xl font-bold text-white tracking-tight">NADIS</h1>
            <p class="text-xs text-white text-opacity-80 font-medium tracking-wide hidden lg:block leading-relaxed pr-2">
              Nigeria Animal Disease Info System
            </p>
          </div>
        </div>
        <!-- Mobile Close Button -->
        <button 
          v-if="isMobile" 
          @click="closeMobile"
          class="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300 flex-shrink-0"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="mt-16 lg:mt-28 cursor-pointer relative z-10">
      <div class="flex">
        <span class="rounded-tr rounded-br bg-white w-1" v-if="menu_index == 1"></span>
        <router-link class="pl-6 lg:pl-9 py-3 w-full hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-r-lg text-lg lg:text-xl" :to="{ name: 'Home' }" @click="isMobile && closeMobile()"> Dashboard</router-link>
        <span class="rounded-tl rounded-bl bg-white w-1" v-if="menu_index == 1"></span>
      </div>
    </div>
    <div class="mt-5 cursor-pointer relative z-10">
      <div class="flex">
        <span class="rounded-tr rounded-br bg-white w-1" v-if="menu_index == 2"></span>
        <router-link class="pl-6 lg:pl-9 py-3 w-full hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-r-lg text-lg lg:text-xl" :to="{ name: 'Reports' }" @click="isMobile && closeMobile()">Reports</router-link>
        <span class="rounded-tl rounded-bl bg-white w-1" v-if="menu_index == 2"></span>
      </div>
    </div>
    <div class="mt-5 cursor-pointer relative z-10">
      <div class="flex">
        <span class="rounded-tr rounded-br bg-white w-1" v-if="menu_index == 5"></span>
        <router-link class="pl-6 lg:pl-9 py-3 w-full hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-r-lg text-lg lg:text-xl" :to="{ name: 'Forms' }" @click="isMobile && closeMobile()">Forms</router-link>
        <span class="rounded-tl rounded-bl bg-white w-1" v-if="menu_index == 5"></span>
      </div>
    </div>
    <div class="my-5 cursor-pointer relative z-10" v-if="role == 'Federal'">
      <div class="flex">
        <span class="rounded-tr rounded-br bg-white w-1" v-if="menu_index == 3"></span
        ><router-link class="pl-6 lg:pl-9 py-3 w-full hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-r-lg text-lg lg:text-xl" :to="{ name: 'Officials' }" @click="isMobile && closeMobile()">Officials</router-link>
        <span class="rounded-tl rounded-bl bg-white w-1" v-if="menu_index == 3"></span>
      </div>
    </div>
    <div class="my-5 cursor-pointer relative z-10" v-if="role == 'Federal'">
      <div class="flex">
        <span class="rounded-tr rounded-br bg-white w-1" v-if="menu_index == 4"></span
        ><router-link class="pl-6 lg:pl-9 py-3 w-full hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-r-lg text-lg lg:text-xl" :to="{ name: 'Agents' }" @click="isMobile && closeMobile()">Agents</router-link>
        <span class="rounded-tl rounded-bl bg-white w-1" v-if="menu_index == 4"></span>
      </div>
    </div>
    <div class="mt-5 mb-2 cursor-pointer relative z-10" v-if="role == 'Federal'">
      <div class="flex">
        <span class="rounded-tr rounded-br bg-white w-1" v-if="menu_index == 6"></span
        ><a href="javascript:;" class="pl-6 lg:pl-9 py-3 w-full hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-r-lg text-lg lg:text-xl" @click="interoperabilityMenu()"
          >Interoperability</a
        >
        <span class="rounded-tl rounded-bl bg-white w-1" v-if="menu_index == 6"></span>
      </div>
    </div>
    <transition
      leave-active-class="transition ease-in duration-1000"
      leave-class="opacity-100"
      leave-to-class="opacity-0"
      enter-active-class="transition ease-in duration-1000"
      enter-class="opacity-0"
      enter-to-class="opacity-100"
    >
      <div class="pl-10 text-sm relative z-10" v-if="showSubmenu">
        <router-link :to="{ name: 'ExportToAuIbar' }" class="block py-2 pl-4 hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-lg"
          >Export to AU IBAR</router-link
        >
        <router-link :to="{ name: 'ExportToFao' }" class="block py-2 pl-4 hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-lg"
          >Export to FAO</router-link
        >
        <router-link :to="{ name: 'ExportToNcdc' }" class="block py-2 pl-4 hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-lg"
          >Export to NCDC</router-link
        >
        <router-link :to="{ name: 'ExportToDhis' }" class="block py-2 pl-4 hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-lg"
          >Export to DHIS2</router-link
        >
        <router-link :to="{ name: 'ExportToOie' }" class="block py-2 pl-4 hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-lg"
          >Export to OIE</router-link
        >
      </div>
    </transition>
    <!-- <div class="my-5 cursor-pointer">
      <div class="flex">
        <a href="javascript:;" class="pl-9 py-2 w-full">Export</a>
      </div>
    </div> -->
    <div class="my-5 cursor-pointer relative z-10">
      <div class="flex">
        <a href="javascript:;" class="pl-6 lg:pl-9 py-3 w-full hover:bg-white hover:bg-opacity-10 transition-all duration-300 rounded-r-lg text-lg lg:text-xl" @click="signOut">Log out</a>
      </div>
    </div>
  </div>
</template>
