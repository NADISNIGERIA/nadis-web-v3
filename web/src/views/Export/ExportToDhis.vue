<script lang="ts">
import { defineComponent } from 'vue'
import PagesTop from '../../components/PagesTop.vue'

export default defineComponent({
  components: { PagesTop },
  setup() {
    //
  }
})
</script>

<template>
  <div class="text-left">
    <pages-top :title="'Export to DHIS2'"></pages-top>
  </div>
</template>
