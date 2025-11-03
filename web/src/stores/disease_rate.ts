import fb from '@/services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'

export const useDiseaseRate = defineStore('disease_rate', {
  state: () => ({
    list_of_diseases: [
      { name: 'Acarapisosis of honey bees', count: 0 },
      { name: 'Actinomycosis', count: 0 },
      { name: 'African horse sickness', count: 0 },
      { name: 'African swine fever', count: 0 },
      { name: 'American foulbrood of honey bees', count: 0 },
      { name: 'Anthrax', count: 0 },
      { name: 'Atrophic rhinitis of swine', count: 0 },
      { name: 'Aujeszky’s disease', count: 0 },
      { name: 'Avian chlamydiosis', count: 0 },
      { name: 'Avian encephalomyelitis', count: 0 },
      { name: 'Avian infectious bronchitis', count: 0 },
      { name: 'Avian infectious laryngotracheitis', count: 0 },
      { name: 'Avian leukosis', count: 0 },
      { name: 'Avian mycoplasmosis (M. gallisepticum)', count: 0 },
      { name: 'Avian mycoplasmosis (M. synoviae)', count: 0 },
      { name: 'Avian salmonellosis (excluding B308 and B313)', count: 0 },
      { name: 'Avian spirochaetosis', count: 0 },
      { name: 'Avian tuberculosis', count: 0 },
      { name: 'Blackleg (Black Quarter)', count: 0 },
      { name: 'Bluetongue', count: 0 },
      { name: 'Botulism', count: 0 },
      { name: 'Bovine anaplasmosis', count: 0 },
      { name: 'Bovine babesiosis', count: 0 },
      { name: 'Bovine cysticercosis', count: 0 },
      { name: 'Bovine genital campylobacteriosis', count: 0 },
      { name: 'Bovine spongiform encephalopathy', count: 0 },
      { name: 'Bovine tuberculosis', count: 0 },
      { name: 'Brucellosis (Brucella abortus)', count: 0 },
      { name: 'Brucellosis (Brucella melitensis)', count: 0 },
      { name: 'Brucellosis (Brucella ovis)', count: 0 },
      { name: 'Brucellosis (Brucella suis)', count: 0 },
      { name: 'Camelpox', count: 0 },
      { name: 'Canine babesiosis', count: 0 },
      { name: 'Canine distemper', count: 0 },
      { name: 'Canine Hepatitis', count: 0 },
      { name: 'Caprine and ovine brucellosis (excluding B. ovis)', count: 0 },
      { name: 'Caprine arthritis/encephalitis', count: 0 },
      { name: 'Caseous lymphadenitis', count: 0 },
      { name: 'Classical swine fever', count: 0 },
      { name: 'Coccidiosis', count: 0 },
      { name: 'Colibacillosis', count: 0 },
      { name: 'Contagious agalactia', count: 0 },
      { name: 'Contagious bovine pleuropneumonia', count: 0 },
      { name: 'Contagious caprine pleuropneumonia', count: 0 },
      { name: 'Contagious equine metritis', count: 0 },
      { name: 'Contagious ophthalmia', count: 0 },
      { name: 'Contagious pustular dermatitis', count: 0 },
      { name: 'Crimean-Congo haemorrhagic fever', count: 0 },
      { name: 'Dermatophilosis', count: 0 },
      { name: 'Distomatosis (Liver fluke)', count: 0 },
      { name: 'Dourine', count: 0 },
      { name: 'Duck virus enteritis', count: 0 },
      { name: 'Duck virus hepatitis', count: 0 },
      { name: 'Echinococcosis/hydatidosis', count: 0 },
      { name: 'Ectoparasitosis', count: 0 },
      { name: 'Enterotoxaemia', count: 0 },
      { name: 'Enterovirus encephalomyelitis', count: 0 },
      { name: 'Enzootic abortion of ewes (ovine chlamydiosis)', count: 0 },
      { name: 'Enzootic bovine leukosis', count: 0 },
      { name: 'Epizootic haematopoietic necrosis', count: 0 },
      { name: 'Epizootic haemorrhagic disease', count: 0 },
      { name: 'Epizootic lymphangitis', count: 0 },
      { name: 'Epizootic ulcerative syndrome', count: 0 },
      { name: 'Equine coital exanthema', count: 0 },
      { name: 'Equine encephalomyelitis (Eastern and Western)', count: 0 },
      { name: 'Equine infectious anaemia', count: 0 },
      { name: 'Equine influenza', count: 0 },
      { name: 'Equine piroplasmosis', count: 0 },
      { name: 'Equine rhinopneumonitis', count: 0 },
      { name: 'Equine viral arteritis', count: 0 },
      { name: 'European foulbrood of honey bees', count: 0 },
      { name: 'Filariasis', count: 0 },
      { name: 'Foot and mouth disease', count: 0 },
      { name: 'Footrot', count: 0 },
      { name: 'Fowl cholera', count: 0 },
      { name: 'Fowl pox', count: 0 },
      { name: 'Fowl typhoid', count: 0 },
      { name: 'Glanders', count: 0 },
      { name: 'Gyrodactylosis (Gyrodactylus salaris)', count: 0 },
      { name: 'Haemorrhagic septicaemia', count: 0 },
      { name: 'Hardpad', count: 0 },
      { name: 'Heartwater', count: 0 },
      { name: 'Helminthosis', count: 0 },
      { name: 'Heminthosis', count: 0 },
      { name: 'Highly pathogenic avian influenza', count: 0 },
      { name: 'Horse colic', count: 0 },
      { name: 'Horse pox', count: 0 },
      {
        name: 'Infectious bovine rhinotracheitis/infectious pustular vulvovaginitis',
        count: 0
      },
      { name: 'Infectious bursal disease (Gumboro disease)', count: 0 },
      { name: 'Infectious coryza', count: 0 },
      { name: 'Infectious haematopoietic necrosis', count: 0 },
      { name: 'Infectious salmon anaemia', count: 0 },
      { name: 'Japanese encephalitis', count: 0 },
      { name: 'Koi herpesvirus disease', count: 0 },
      { name: 'Leishmaniosis', count: 0 },
      { name: 'Leptospirosis', count: 0 },
      { name: 'Listeriosis', count: 0 },
      { name: 'Lumpy skin disease', count: 0 },
      { name: 'Maedi-visna', count: 0 },
      { name: 'Malignant catarrhal fever', count: 0 },
      { name: 'Mange', count: 0 },
      { name: 'Marek’s disease', count: 0 },
      { name: 'Mastitis', count: 0 },
      { name: 'Melioidosis', count: 0 },
      { name: 'Mucosal disease / Bovine virus diarrhoea', count: 0 },
      { name: 'Myxomatosis', count: 0 },
      { name: 'Nairobi sheep disease', count: 0 },
      { name: 'Newcastle disease', count: 0 },
      { name: 'New world screwworm (Cochliomyia hominivorax)', count: 0 },
      { name: 'Old world screwworm (Chrysomya bezziana)', count: 0 },
      { name: 'Orf', count: 0 },
      { name: 'Other clostridial infections', count: 0 },
      { name: 'Other pasteurellosis', count: 0 },
      { name: 'Ovine pulmonary adenomatosis', count: 0 },
      { name: 'Paratuberculosis', count: 0 },
      { name: 'Parvoviral Enteritis', count: 0 },
      { name: 'Peste des petits ruminants', count: 0 },
      { name: 'Porcine cysticercosis', count: 0 },
      { name: 'Porcine reproductive and respiratory syndrome', count: 0 },
      { name: 'Pullorum disease', count: 0 },
      { name: 'Q fever', count: 0 },
      { name: 'Rabbit haemorrhagic disease', count: 0 },
      { name: 'Rabies', count: 0 },
      { name: 'Red sea bream iridoviral disease', count: 0 },
      { name: 'Rift Valley fever', count: 0 },
      { name: 'Rinderpest', count: 0 },
      { name: 'Salmonellosis (Salmonella abortus equi)', count: 0 },
      { name: 'Salmonellosis (Salmonella abortus ovis)', count: 0 },
      { name: 'Scrapie', count: 0 },
      { name: 'Sheep pox and goat pox', count: 0 },
      { name: 'Small hive beetle infestation (Aethina tumida)', count: 0 },
      { name: 'Spring viraemia of carp', count: 0 },
      { name: 'Strangles', count: 0 },
      { name: 'Swine erysipelas', count: 0 },
      { name: 'Swine vesicular disease', count: 0 },
      { name: 'Tetanus', count: 0 },
      { name: 'Theileriosis', count: 0 },
      { name: 'Toxoplasmosis', count: 0 },
      { name: 'Transmissible gastroenteritis', count: 0 },
      { name: 'Trichinellosis', count: 0 },
      { name: 'Trichomonosis', count: 0 },
      { name: 'Tropilaelaps infestation of honey bees', count: 0 },
      { name: 'Trypanosomosis', count: 0 },
      { name: 'Tularemia', count: 0 },
      { name: 'Turkey rhinotracheitis', count: 0 },
      { name: 'Ulcerative lymphangitis', count: 0 },
      { name: 'Unknown disease', count: 0 },
      { name: 'Varroosis of honey bees', count: 0 },
      { name: 'Venezuelan equine encephalomyelitis', count: 0 },
      { name: 'Vesicular stomatitis', count: 0 },
      { name: 'Vibrionic dysentery', count: 0 },
      { name: 'Viral haemorrhagic septicaemia', count: 0 },
      { name: 'Warble infestation', count: 0 },
      { name: 'West Nile Fever', count: 0 }
    ],
    loading: false
  }),
  actions: {
    clear_reports(neutral: any) {
      neutral.forEach((single: any) => {
        if (single.count > 0) {
          single.count = 0
        }
      })
      this.list_of_diseases = []
      this.list_of_diseases = neutral
      return true
    },
    async abattoir_disease() {
      this.loading = true
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const snapshot = await getDocs(
        query(collection(fb.db, 'abattoir_reports'), where('created_at', '>', last_six_months))
      )
      if (!snapshot.empty) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            if (change.doc.data().approved == true) {
              //
              this.runThroughDisease(change.doc.data().disease_name)
            }
          }
        })
      }
    },
    async aquaculture_disease() {
      this.loading = true
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const snapshot = await getDocs(
        query(collection(fb.db, 'aquaculture_reports'), where('created_at', '>', last_six_months))
      )
      if (!snapshot.empty) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            if (change.doc.data().approved == true) {
              this.runThroughDisease(change.doc.data().disease)
            }
          }
        })
      }
    },
    async laboratory_disease() {
      this.loading = true
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)

      const snapshot = await getDocs(
        query(collection(fb.db, 'laboratory_reports'), where('created_at', '>', last_six_months))
      )
      if (!snapshot.empty) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            if (change.doc.data().approved == true) {
              change.doc.data().disease_and_result.disease.forEach((disease: any) => {
                this.runThroughDisease(disease)
              })
            }
          }
        })
      }
    },
    async outbreak_disease() {
      this.loading = true
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const snapshot = await getDocs(
        query(collection(fb.db, 'outbreak_reports'), where('created_at', '>', last_six_months))
      )
      if (!snapshot.empty) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            if (change.doc.data().approved == true) {
              this.runThroughDisease(change.doc.data().disease_name)
            }
          }
        })
      }
    },
    async suspicion_disease() {
      this.loading = true
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const snapshot = await getDocs(
        query(collection(fb.db, 'suspicion_reports'), where('created_at', '>', last_six_months))
      )
      if (!snapshot.empty) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            if (change.doc.data().approved == true) {
              this.runThroughDisease(change.doc.data().disease_name)
            }
          }
        })
      }
    },
    async vaccination_disease() {
      this.loading = true
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const snapshot = await getDocs(
        query(collection(fb.db, 'vaccination_reports'), where('created_at', '>', last_six_months))
      )
      if (!snapshot.empty) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            if (change.doc.data().approved == true) {
              this.runThroughDisease(change.doc.data().disease.disease_name)
            }
          }
        })
      }
    },
    async veterinarian_disease() {
      this.loading = true
      const date = new Date()
      const month = new Date().getMonth()
      const last_six_months = date.setMonth(month - 6)
      const snapshot = await getDocs(
        query(collection(fb.db, 'veterinarian_reports'), where('created_at', '>', last_six_months))
      )
      if (!snapshot.empty) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            if (change.doc.data().approved == true) {
              this.runThroughDisease(change.doc.data().disease)
            }
          }
        })
      }
    },
    runThroughDisease(disease: any) {
      this.loading = true
      const lists = this.getList
      for (let index = 0; index < lists.length; index++) {
        if (lists[index].name == disease) {
          const list_disease = lists[index]
          const count = list_disease.count
          list_disease.count = count + 1
          const obj = {
            list_disease: list_disease,
            index: index
          }
          this.list_of_diseases[obj.index].count = obj.list_disease.count
        }
      }
    }
  },
  getters: {
    getList: (state) => {
      return state.list_of_diseases
    },
    rearrangeList: (state) => {
      const arra = state.list_of_diseases.sort((a, b) => b.count - a.count)
      return arra
    }
  }
})
