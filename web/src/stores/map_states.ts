import fb from '@/services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'

export const useMapStates = defineStore('map_states', {
  state: () => ({
    state_locations: [
      {
        name: 'Abia State',
        lat: 5.532003041,
        lng: 7.486002487
      },
      {
        name: 'Adamawa State',
        lat: 10.2703408,
        lng: 13.2700321
      },
      {
        name: 'Akwa Ibom State',
        lat: 5.007996056,
        lng: 7.849998524
      },
      {
        name: 'Anambra State',
        lat: 6.210433572,
        lng: 7.06999711
      },
      {
        name: 'Bauchi State',
        lat: 11.68040977,
        lng: 10.19001339
      },
      {
        name: 'Bayelsa State',
        lat: 4.8267351,
        lng: 5.430821
      },
      {
        name: 'Benue State',
        lat: 7.190399596,
        lng: 8.129984089
      },
      {
        name: 'Borno State',
        lat: 10.62042279,
        lng: 12.18999467
      },
      {
        name: 'Cross River State',
        lat: 4.960406513,
        lng: 8.330023558
      },
      {
        name: 'Delta State',
        lat: 5.890427265,
        lng: 5.680004434
      },
      {
        name: 'Ebonyi State',
        lat: 6.2435322,
        lng: 7.4196847
      },
      {
        name: 'Edo State',
        lat: 6.340477314,
        lng: 5.620008096
      },
      {
        name: 'Ekiti State',
        lat: 7.630372741,
        lng: 5.219980834
      },
      {
        name: 'Enugu State',
        lat: 6.867034321,
        lng: 7.383362995
      },
      {
        name: 'FCT',
        lat: 9.083333149,
        lng: 7.533328002
      },
      {
        name: 'Gombe State',
        lat: 10.29044293,
        lng: 11.16995357
      },
      {
        name: 'Imo State',
        lat: 5.492997053,
        lng: 7.026003588
      },
      {
        name: 'Jigawa State',
        lat: 11.7991891,
        lng: 9.350334607
      },
      {
        name: 'Kaduna State',
        lat: 11.0799813,
        lng: 7.710009724
      },
      {
        name: 'Kano State',
        lat: 11.99997683,
        lng: 8.5200378
      },
      {
        name: 'Katsina State',
        lat: 11.5203937,
        lng: 7.320007689
      },
      {
        name: 'Kebbi State',
        lat: 12.45041445,
        lng: 4.199939737
      },
      {
        name: 'Kogi State',
        lat: 7.800388203,
        lng: 6.739939737
      },
      {
        name: 'Kwara State',
        lat: 8.490010192,
        lng: 4.549995889
      },
      {
        name: 'Lagos State',
        lat: 6.443261653,
        lng: 3.391531071
      },
      {
        name: 'Nasarawa State',
        lat: 8.490423603,
        lng: 8.5200378
      },
      {
        name: 'Niger State',
        lat: 10.4003587,
        lng: 5.469939737
      },
      {
        name: 'Ogun State',
        lat: 7.160427265,
        lng: 3.350017455
      },
      {
        name: 'Ondo State',
        lat: 7.250395934,
        lng: 5.199982054
      },
      {
        name: 'Osun State',
        lat: 7.629959329,
        lng: 4.179992634
      },
      {
        name: 'Oyo State',
        lat: 7.970016092,
        lng: 3.590002806
      },
      {
        name: 'Plateau State',
        lat: 9.929973978,
        lng: 8.890041055
      },
      {
        name: 'Rivers State',
        lat: 4.810002257,
        lng: 7.010000772
      },
      {
        name: 'Sokoto State',
        lat: 13.06001548,
        lng: 5.240031289
      },
      {
        name: 'Taraba State',
        lat: 7.870409769,
        lng: 9.780012572
      },
      {
        name: 'Yobe State',
        lat: 11.74899608,
        lng: 11.96600457
      },
      {
        name: 'Zamfara State',
        lat: 12.1704057,
        lng: 6.659996296
      }
    ],
    states_in_abattoir: [],
    states_in_aquaculture: [],
    states_in_laboratory: [],
    states_in_outbreak: [],
    states_in_suspicion: [],
    states_in_vaccination: [],
    states_in_veterinarian: []
  }),
  actions: {
    async getStatesInAbattoir(disease: any) {
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const report = [] as any
      this.states_in_abattoir = []
      const docs = await getDocs(
        query(collection(fb.db, 'abattoir_reports'), where('created_at', '>', last_six_months))
      )
      docs.forEach((doc) => {
        if (doc.data().disease_name == disease) {
          report.push(doc.data().state)
        }
        this.states_in_abattoir = report
      })
    },
    async getStatesInAquaculture(disease: any) {
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const report = [] as any
      this.states_in_aquaculture = []
      const docs = await getDocs(
        query(collection(fb.db, 'aquaculture_reports'), where('created_at', '>', last_six_months))
      )
      docs.forEach((doc) => {
        if (doc.data().disease == disease) {
          report.push(doc.data().state)
        }
        this.states_in_aquaculture = report
      })
    },
    async getStatesInLaboratory(disease: any) {
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const report = [] as any
      this.states_in_laboratory = []
      const docs = await getDocs(
        query(collection(fb.db, 'laboratory_reports'), where('created_at', '>', last_six_months))
      )

      docs.forEach((doc) => {
        if (doc.data().disease_and_result) {
          doc.data().disease_and_result.disease.forEach((value: any) => {
            if (value == disease) {
              report.push(doc.data().state)
            }
          })
        }
        this.states_in_laboratory = report
      })
    },
    async getStatesInOutbreak(disease: any) {
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const report = [] as any
      this.states_in_outbreak = []
      const docs = await getDocs(
        query(collection(fb.db, 'outbreak_reports'), where('created_at', '>', last_six_months))
      )
      docs.forEach((doc) => {
        if (doc.data().disease_name == disease) {
          report.push(doc.data().state)
        }
        this.states_in_outbreak = report
      })
    },
    async getStatesInSuspicion(disease: any) {
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const report = [] as any
      this.states_in_suspicion = []
      const docs = await getDocs(
        query(collection(fb.db, 'suspicion_reports'), where('created_at', '>', last_six_months))
      )
      docs.forEach((doc) => {
        if (doc.data().disease_name == disease) {
          report.push(doc.data().state)
        }
        this.states_in_suspicion = report
      })
    },
    async getStatesInVaccination(disease: any) {
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const report = [] as any
      this.states_in_vaccination = []
      const docs = await getDocs(
        query(collection(fb.db, 'vaccination_reports'), where('created_at', '>', last_six_months))
      )
      docs.forEach((doc) => {
        if (doc.data().disease.disease_name == disease) {
          report.push(doc.data().state)
        }
        this.states_in_vaccination = report
      })
    },
    async getStatesInVeterinarian(disease: any) {
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const report = [] as any
      this.states_in_veterinarian = []
      const docs = await getDocs(
        query(collection(fb.db, 'veterinarian_reports'), where('created_at', '>', last_six_months))
      )
      docs.forEach((doc) => {
        if (doc.data().disease == disease) {
          report.push(doc.data().state)
        }
        this.states_in_veterinarian = report
      })
    }
  },
  getters: {
    combineAllReports: (state) => {
      let newArray = state.states_in_abattoir
      newArray = newArray.concat(state.states_in_aquaculture)
      newArray = newArray.concat(state.states_in_laboratory)
      newArray = newArray.concat(state.states_in_outbreak)
      newArray = newArray.concat(state.states_in_suspicion)
      newArray = newArray.concat(state.states_in_vaccination)
      newArray = newArray.concat(state.states_in_veterinarian)
      return newArray.sort()
    }
  }
})
