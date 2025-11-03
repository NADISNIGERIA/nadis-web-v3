<script lang="ts">
import { computed, defineComponent, ref, toRefs, watch } from 'vue'

export default defineComponent({
  props: {
    aquaculture_mortality: Array as any,
    outbreak_mortality: Array as any,
    suspicion_mortality: Array as any,
    rate_months: Array as any
  },
  setup(props) {
    const {
      aquaculture_mortality: aquaculture_mortality,
      outbreak_mortality: outbreak_mortality,
      suspicion_mortality: suspicion_mortality
    } = toRefs(props)
    const lengths = ref([
      'h-0',
      'h-2 mt-18',
      'h-4 mt-16',
      'h-6 mt-14',
      'h-8 mt-12',
      'h-10 mt-10',
      'h-12 mt-8',
      'h-14 mt-6',
      'h-16 mt-4',
      'h-18 mt-2',
      'h-20 mt-0',
      'h-22 -mt-2',
      'h-24 -mt-4',
      'h-26 -mt-6',
      'h-28 -mt-8',
      'h-30 -mt-10',
      'h-32 -mt-12',
      'h-34 -mt-14',
      'h-36 -mt-16',
      'h-38 -mt-18',
      'h-40 -mt-20',
      'h-42 -mt-22',
      'h-44 -mt-24',
      'h-46 -mt-26',
      'h-48 -mt-28',
      'h-50 -mt-30'
    ])
    const numbers = ref([
      0, 50, 100, 150, 200, 400, 600, 800, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
      6000, 7000, 8000, 9000, 10000, 12000, 14000, 16000, 18000, 20000, 24000, 28000, 32000, 36000,
      40000, 48000, 56000, 64000, 72000
    ]) as any
    const bar_lengths = ref([]) as any
    const mortality = computed(() => {
      let calculated_mortality = [] as any[]
      calculated_mortality[0] =
        aquaculture_mortality.value[0] + outbreak_mortality.value[0] + suspicion_mortality.value[0]
      calculated_mortality[1] =
        aquaculture_mortality.value[1] + outbreak_mortality.value[1] + suspicion_mortality.value[1]
      calculated_mortality[2] =
        aquaculture_mortality.value[2] + outbreak_mortality.value[2] + suspicion_mortality.value[2]
      calculated_mortality[3] =
        aquaculture_mortality.value[3] + outbreak_mortality.value[3] + suspicion_mortality.value[3]
      calculated_mortality[4] =
        aquaculture_mortality.value[4] + outbreak_mortality.value[4] + suspicion_mortality.value[4]
      return calculated_mortality
    })
    const largest = computed(() => {
      let calculated_largest = 0
      for (let index = 0; index < calculated_largest; index++) {
        if (mortality.value[index] > calculated_largest) {
          calculated_largest = mortality.value[index]
        }
      }
      return calculated_largest
    })
    const bar_numbers = computed(() => {
      const maximum_mortality = largest.value

      let index = 0
      let calculated_bar_numbers = 0
      while (maximum_mortality > numbers.value) {
        calculated_bar_numbers = numbers.value[index]
        index++
      }
      calculated_bar_numbers = numbers.value[index]
      return calculated_bar_numbers
    })
    const bar_array = computed(() => {
        let increment = bar_numbers.value / 5
        let add_increment = 0
        let array = [] as any
        while (add_increment < bar_numbers.value) {
            array.push(add_increment)
            add_increment += increment
        }
        array.push(add_increment)

        return array
    })

    const callLength = (val: any) => {
      bar_lengths.value = []
      for (let index = 0; index < 5; index++) {
        if (val[index] == 0) {
          bar_lengths.value.push(0)
        } else {
          bar_lengths.value.push(
            Math.round(
              (val[index] / bar_array.value[5]) * lengths.value.length - 1
            ) + 2
          )
        }
      }
    }

    watch(mortality, () => {
        callLength(mortality.value)
    })

    return { lengths, bar_array, bar_lengths }
  }
})
</script>

<template>
  <div class="w-full lg:w-1/2 py-8 text-left">
    <div class="pl-4 text-black">
      <div class="text-xl">All Mortality Rates (Last 5 Months)</div>
    </div>
    <div class="my-6 mr-2 pl-20 pr-5">
      <div class="grid grid-cols-5">
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-b-0 h-12"></div>
        <div class="border border-gray-100 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-r-0 h-12"></div>
        <div class="border border-gray-100 border-r-0 h-12"></div>
        <div class="border border-gray-100 h-12"></div>
      </div>
      <div class="relative">
        <div class="absolute -top-64 -mt-2 -ml-16 text-right text-xs text-gray-500">
          <div class="py-4" v-for="(bar, index) in bar_array.slice().reverse()" :key="index">
            {{ bar }}
          </div>
        </div>
      </div>
      <div class="relative">
        <div class="absolute text-xs text-gray-500 w-full">
          <div class="grid grid-cols-5">
            <div class="" v-for="(month, index) in rate_months" :key="index">
              {{ month }}
            </div>
          </div>
        </div>
      </div>
      <div class="relative">
        <div class="absolute text-xs -top-20 text-gray-500 w-full">
          <div class="grid grid-cols-5">
            <div
              class="w-8 rounded-sm bg-gradient-to-t from-green-100 via-green-200 to-green-400"
              v-for="(bar_length, index) in bar_lengths.slice().reverse()"
              :key="index"
              :class="[lengths[bar_length]]"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
