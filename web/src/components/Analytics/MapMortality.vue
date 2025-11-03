<script lang="ts">
declare global {
  interface Google {
    maps: any
  }
}
import { useMapStates } from './../../stores/map_states'
import { useDiseaseRate } from './../../stores/disease_rate'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { GoogleMap, Marker as PointMarker } from 'vue3-google-map'

export default defineComponent({
  components: { GoogleMap, PointMarker },
  setup() {
    // const zoom = ref(5)
    const image = ref([
      './img/marker_1.png',
      './img/marker_2.png',
      './img/marker_3.png',
      './img/marker_4.png'
    ])
    const disease_index = ref(0)
    const states = ref([]) as any
    const rearrangeList = computed(() => useDiseaseRate().rearrangeList)
    const topDiseases = computed(() => {
      const diseases = []
      diseases.push(rearrangeList.value[0])
      diseases.push(rearrangeList.value[1])
      diseases.push(rearrangeList.value[2])
      diseases.push(rearrangeList.value[3])
      return diseases
    })
    const combineAllReports = computed(() => useMapStates().combineAllReports)
    const state_locations = computed(() => useMapStates().state_locations)
    const marker_options = ref({})
    const center = ref({ lat: 9.0173905, lng: 4.1801729 })
    const zoom = ref(7)

    watch(topDiseases, () => {
      diseaseState(0)
    })
    watch(combineAllReports, () => {
      addFractions()
    })
    watch(disease_index, () => {
      diseaseState(disease_index.value)
    })
    watch(states, () => {
      if (states.value.length !== 0) {
        initMap()
      }
    })

    const initMap = () => {
      // eslint-disable-next-line no-undef
      // const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      //   zoom: 7,
      //   center: { lat: 9.0173905, lng: 4.1801729 }
      // })
      // Create an array of alphabetical characters used to label the markers.
      const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      // Add some markers to the map.
      // Note: The code uses the JavaScript Array.prototype.map() method to
      // create an array of markers based on a given "locations" array.
      // The map() method here has nothing to do with the Google Maps API.
      states.value.map((location: any, i: any) => {
        // eslint-disable-next-line no-undef
        // return new google.maps.Marker({
        //   position: location,
        //   label: labels[i % labels.length],
        //   icon: {
        //     url: image.value[i],
        //     // eslint-disable-next-line no-undef
        //     scaledSize: new google.maps.Size(location.fraction, location.fraction)
        //   },
        //   map: map
        // })
        marker_options.value = {
          position: location,
          label: labels[i % labels.length],
          icon: {
            url: image.value[i],
            // eslint-disable-next-line no-undef
            // scaledSize: new google.maps.Size(location.fraction, location.fraction)
          }
        }
      })
    }
    const diseaseState = (index: any) => {
      const disease = topDiseases.value[index]
      useMapStates().getStatesInAbattoir(disease.name)
      useMapStates().getStatesInAquaculture(disease.name)
      useMapStates().getStatesInLaboratory(disease.name)
      useMapStates().getStatesInOutbreak(disease.name)
      useMapStates().getStatesInSuspicion(disease.name)
      useMapStates().getStatesInVaccination(disease.name)
      useMapStates().getStatesInVeterinarian(disease.name)
    }
    const topFourStates = () => {
      let states_new = []
      var current = null
      var cnt = 0
      for (var i = 0; i < combineAllReports.value.length; i++) {
        if (combineAllReports.value[i] != current) {
          if (cnt > 0) {
            states_new.push({
              state: combineAllReports.value[i - 1],
              count: cnt,
              lat: getLatLng(combineAllReports.value[i - 1]).lat,
              lng: getLatLng(combineAllReports.value[i - 1]).lng
            })
          }
          current = combineAllReports.value[i]
          cnt = 1
        } else {
          cnt++
        }
      }
      if (cnt > 0) {
        states_new.push({
          state: combineAllReports.value[i - 1],
          count: cnt,
          lat: getLatLng(combineAllReports.value[i - 1]).lat,
          lng: getLatLng(combineAllReports.value[i - 1]).lng
        })
      }
      return states_new
    }
    const reorderStatesAndPickTopFour = () => {
      const arra = topFourStates().sort((a, b) => b.count - a.count)
      var newArray = []
      if (arra.length >= 4) {
        for (let index = 0; index < 4; index++) {
          newArray.push(arra[index])
        }
      } else {
        for (let index = 0; index < arra.length; index++) {
          newArray.push(arra[index])
        }
      }
      return newArray
    }
    const addFractions = () => {
      const states_reorder = reorderStatesAndPickTopFour()
      let totalNumber = 0
      states_reorder.forEach((state) => {
        totalNumber = totalNumber + state.count
      })
      states_reorder.forEach((state: any) => {
        let fraction = (state.count / totalNumber) * 200
        state.fraction = fraction
      })
      states.value = states_reorder
    }
    const getLatLng = (state: any) => {
      const lat_lng = state_locations.value
      let position = {} as any
      lat_lng.forEach((location) => {
        if (location.name == state) {
          position.lat = location.lat
          position.lng = location.lng
        }
      })
      return position
    }
    // const addScript = () => {
    //   const scriptArray = document.getElementsByTagName('script')
    //   let present = false
    //   const link =
    //     'https://maps.googleapis.com/maps/api/js?key=AIzaSyDAsGPSGZwAX26gSjpy3DpRun-ftaiaZds&libraries=places&callback=initMap'
    //   for (let index = 0; index < scriptArray.length; index++) {
    //     const script = scriptArray[index]
    //     if (script.src === link) {
    //       present = true
    //     }
    //   }
    //   if (!present) {
    //     const googleMap = document.createElement('script')
    //     googleMap.setAttribute('src', link)
    //     document.head.appendChild(googleMap)
    //   }
    // }

    onMounted(() => {
      disease_index.value = 0
    })

    return { topDiseases, disease_index, initMap, marker_options, center, zoom }
  }
})
</script>

<template>
  <div>
    <div class="pb-5 font-bold text-2xl">
      First Four States where "{{ topDiseases ? topDiseases[disease_index].name : '' }}" occurs the
      most
    </div>
    <div class="relative md:w-5/12 mx-auto">
      <div class="md:absolute md:top-4 bg-nadis-white-fade rounded-md px-3 py-2 w-full z-50">
        <select
          class="focus:outline-none pr-4 w-full border rounded-md md:bg-transparent"
          v-model="disease_index"
        >
          <option :value="index" v-for="(disease, index) in topDiseases" :key="index">
            {{ disease.name }}
          </option>
        </select>
      </div>
    </div>
    <!-- <div id="map" class="rounded-md border-2 map_height mb-8"></div> -->
    <google-map
      api-key="AIzaSyDAsGPSGZwAX26gSjpy3DpRun-ftaiaZds"
      style="width: 100%; height: 500px"
      :center="center"
      :zoom="zoom"
    >
      <point-marker :options="marker_options"></point-marker>
    </google-map>
  </div>
</template>
