<script lang="ts">
import { useMortalityRate } from './../../stores/mortality_rate'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'

export default defineComponent({
  setup(props, ctx) {
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
    ])
    const months = ref([
      {
        full: 'January',
        short: 'Jan',
        days: 31
      },
      {
        full: 'Febuary',
        short: 'Feb',
        days: 29
      },
      {
        full: 'March',
        short: 'March',
        days: 31
      },
      {
        full: 'April',
        short: 'April',
        days: 30
      },
      {
        full: 'May',
        short: 'May',
        days: 31
      },
      {
        full: 'June',
        short: 'Jun',
        days: 30
      },
      {
        full: 'July',
        short: 'Jul',
        days: 31
      },
      {
        full: 'August',
        short: 'Aug',
        days: 31
      },
      {
        full: 'September',
        short: 'Sept',
        days: 30
      },
      {
        full: 'October',
        short: 'Oct',
        days: 31
      },
      {
        full: 'November',
        short: 'Nov',
        days: 30
      },
      {
        full: 'December',
        short: 'Dec',
        days: 31
      }
    ])
    const number_of_months = ref(5)
    const mortality = ref([]) as any
    const rate_months = ref([]) as any
    const bar_lengths = ref([]) as any
    const largest = ref(0)
    const outbreak_mortality = computed(() => useMortalityRate().outbreak_mortality)
    const bar_numbers = computed(() => {
      const maximumMortality = largest.value

      let i = 0
      let bar_number = 0
      while (maximumMortality > numbers.value[i]) {
        bar_number = numbers.value[i]
        i++
      }
      bar_number = numbers.value[i]
      return bar_number
    })
    const bar_array = computed(() => {
      const increment = bar_numbers.value / 5
      let add_increment = 0
      let array = []
      while (add_increment < bar_numbers.value) {
        array.push(add_increment)
        add_increment += increment
      }
      array.push(add_increment)

      return array
    })

    watch(outbreak_mortality, () => {
      callMonth()
    })
    watch(mortality, () => {
      ctx.emit('outbreak-mortality', mortality.value)
      callLength(mortality.value)
    })

    const callMonth = () => {
      mortality.value = []
      for (let index = 0; index < number_of_months.value; index++) {
        const values = useMortalityRate().number_month(index)
        let added = 0
        values.forEach((value: any) => {
          added = added + parseInt(value.number_of_animals.deaths)
          if (parseInt(value.number_of_animals.deaths) > largest.value) {
            largest.value = parseInt(value.number_of_animals.deaths)
          }
        })
        mortality.value.push(added)
      }
    }
    const callLength = (val: any) => {
      bar_lengths.value = []
      for (let index = 0; index < 5; index++) {
        if (val[index] == 0) {
          bar_lengths.value.push(0)
        } else {
          bar_lengths.value.push(
            Math.round((val[index] / bar_array.value[5]) * lengths.value.length - 1) + 2
          )
        }
      }
    }
    const monthCalculator = () => {
      for (let index = number_of_months.value - 1; index > -1; index--) {
        //var date = new Date()
        var month = new Date().getMonth()
        //var month_number = date.setMonth(month - index)
        //var new_month = new Date(month_number).getMonth()
        var new_month = month - index
        if (new_month < 0) {
          new_month = 12 + new_month
        }
        rate_months.value.push(months.value[new_month].short)
      }
    }

    onMounted(() => {
      callMonth()
      monthCalculator()
    })

    return { bar_array, rate_months, bar_lengths, lengths }
  }
})
</script>

<template>
  <div class="w-full lg:w-1/2 py-8 text-left">
    <div class="pl-4 text-black">
      <div class="text-xl">Outbreak Mortality Rate (Last 5 Months)</div>
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
              class="w-8 rounded-sm bg-gradient-to-t from-purple-100 via-purple-400 to-card-pad-2"
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
