<script setup lang="ts">
import { RouterView } from 'vue-router'
import SideBar from './components/SideBar.vue'
import MenuIcon from './components/icons/MenuIcon.vue'
import SearchBar from './components/SearchBar.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useMiddleware } from './stores/middleware'
import { useAdmin } from './stores/admin'
import { useAuth } from './stores/auth'

const full = ref(false)
const mobileMenuOpen = ref(false)
const active_menu = ref(0)
const has_access = computed(() => useMiddleware().has_access)
const admin = computed(() => useAdmin().admin) as any

const activeMenu = (val: any) => {
  active_menu.value = val
}
watch(admin, () => {
  useMiddleware().access()
})

onMounted(() => {
  useAdmin().checkIfAdminRegIsComplete()
  useMiddleware().access()
  useAuth().currentUser()
})
</script>

<template>
  <div class="flex bg-nadis-bg">
    <!-- Desktop Sidebar -->
    <div class="lg:w-2/10 xl:w-1/6 h-screen hidden lg:inline-block" v-if="!full && has_access">
      <side-bar :active_menu="active_menu"></side-bar>
    </div>
    
    <!-- Mobile Sidebar Overlay -->
    <div class="fixed inset-0 z-50 lg:hidden" v-if="mobileMenuOpen && has_access">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="mobileMenuOpen = false"></div>
      <!-- Sidebar -->
      <div class="fixed top-0 left-0 w-80 max-w-xs h-full transform transition-transform duration-300 ease-in-out z-60">
        <side-bar :active_menu="active_menu" :is-mobile="true" @close-mobile="mobileMenuOpen = false"></side-bar>
      </div>
    </div>
    <div
      class="h-screen overflow-y-scroll xscroll"
      :class="{
        'w-full': (full && has_access) || !has_access,
        'w-full lg:w-8/10 xl:w-5/6': !full && has_access
      }"
    >
      <div v-if="has_access">
        <!-- Mobile Header -->
        <div class="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div class="flex items-center">
            <button
              class="bg-white p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              @click="mobileMenuOpen = true"
            >
              <menu-icon class="w-5 h-5"></menu-icon>
            </button>
            <!-- Mobile Logo with Coat of Arms -->
            <div class="flex items-center space-x-3 ml-4">
              <div class="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center p-1">
                <img src="/img/coat_of_arms.svg" alt="Nigeria Coat of Arms" class="w-full h-full object-contain" />
              </div>
              <div>
                <h1 class="text-lg font-bold text-nadis-black">NADIS</h1>
              </div>
            </div>
          </div>
          <div class="text-sm text-nadis-black font-medium">{{ admin.fullname }}</div>
        </div>
        
        <!-- Desktop Header -->
        <div class="hidden lg:block">
          <div class="flex items-center justify-between bg-white shadow-sm px-6 py-4" v-if="!full">
            <div class="flex items-center">
              <button
                class="bg-white p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors mr-4"
                @click="full = !full"
              >
                <menu-icon class="w-5 h-5"></menu-icon>
              </button>
              <div class="w-96">
                <search-bar :title="'Search here'"></search-bar>
              </div>
            </div>
            <div class="text-sm text-nadis-black font-medium">{{ admin.fullname }}</div>
          </div>
          
          <!-- Collapsed desktop header -->
          <div v-if="full" class="bg-white shadow-sm px-6 py-4">
            <div class="flex items-center justify-between">
              <button
                class="bg-white p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                @click="full = !full"
              >
                <menu-icon class="w-5 h-5"></menu-icon>
              </button>
              <div class="text-sm text-nadis-black font-medium">{{ admin.fullname }}</div>
            </div>
          </div>
        </div>
      </div>
      <router-view v-on:active-menu="activeMenu" :full="full"></router-view>
    </div>
  </div>
</template>

<style>
.pages-enter-active,
.pages-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease-in-out;
}

.pages-enter-active {
  transition-delay: 0.5s;
}

.pages-enter {
  opacity: 0;
  transform: translateZ(200px);
}

.pages-leave-to {
  opacity: 0;
  transform: translateZ(-200px);
}

.pages-leave {
  opacity: 1;
  transform: translateZ(0px);
}

.pages-enter-to {
  opacity: 1;
  transform: translateZ(0px);
}
</style>
