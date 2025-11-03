<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useDiseaseRate } from './../../stores/disease_rate'

export default defineComponent({
  setup() {
    const pieData = ref([
      { color: '#9bddff', value: 35, name: '' },
      { color: '#ff6d6b', value: 20, name: '' },
      { color: '#febb5c', value: 20, name: '' },
      { color: '#aaa1ff', value: 25, name: '' }
    ]) as any
    const neutral_list = ref([
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
    ])
    const rearrangeList = computed(() => useDiseaseRate().rearrangeList)

    const pieStyles = () => {
      const percentages = calculate()
      const pieData = [
        { color: '#9bddff', value: percentages.firstPercentage },
        { color: '#ff6d6b', value: percentages.secondPercentage },
        { color: '#febb5c', value: percentages.thirdPercentage },
        { color: '#aaa1ff', value: percentages.fourthPercentage }
      ]
      let acum = 0
      let styles = pieData.map((segment) => `${segment.color} 0 ${(acum += segment.value)}%`)

      return {
        background: `conic-gradient( ${styles.join(',')} )`
      }
    }
    const calculate = () => {
      const first = rearrangeList.value[0].count
      const second = rearrangeList.value[1].count
      const third = rearrangeList.value[2].count
      const fourth = rearrangeList.value[3].count
      const total = first + second + third + fourth
      const firstPercentage = (first / total) * 100
      const secondPercentage = (second / total) * 100
      const thirdPercentage = (third / total) * 100
      const fourthPercentage = (fourth / total) * 100

      pieData.value[0].value = firstPercentage
      pieData.value[0].name = rearrangeList.value[0].name
      pieData.value[0].count = first
      pieData.value[1].value = secondPercentage
      pieData.value[1].name = rearrangeList.value[1].name
      pieData.value[1].count = second
      pieData.value[2].value = thirdPercentage
      pieData.value[2].name = rearrangeList.value[2].name
      pieData.value[2].count = third
      pieData.value[3].value = fourthPercentage
      pieData.value[3].name = rearrangeList.value[3].name
      pieData.value[3].count = fourth

      var object = {
        firstPercentage: firstPercentage,
        secondPercentage: secondPercentage,
        thirdPercentage: thirdPercentage,
        fourthPercentage: fourthPercentage
      }
      return object
    }
    const loadChart = () => {
      useDiseaseRate().clear_reports(neutral_list.value)
      useDiseaseRate().abattoir_disease()
      useDiseaseRate().aquaculture_disease()
      useDiseaseRate().laboratory_disease()
      useDiseaseRate().outbreak_disease()
      useDiseaseRate().suspicion_disease()
      useDiseaseRate().vaccination_disease()
      useDiseaseRate().veterinarian_disease()
    }

    onMounted(() => {
      loadChart()
    })

    return { pieStyles, pieData, loadChart }
  }
})
</script>

<template>
  <div class="w-full xl:w-1/2 py-8 text-left">
    <div class="pl-4 text-black">
      <div class="text-xl">Disease Summary (Last 5 Months)</div>
    </div>
    <div class="md:flex pt-4">
      <div class="transform -rotate-45 -mt-10 md:mt-8">
        <div class="relative w-52 h-52 pl-4 pt-5">
          <div
            class="text-center absolute shadow rounded-full mx-auto w-52 h-52"
            :style="pieStyles()"
          ></div>
          <div class="w-28 h-28 absolute bg-gray-50 top-1/3 left-16 rounded-full"></div>
        </div>
      </div>
      <div class="pl-8 pt-20 md:pt-12">
        <div>
          <div
            class="rounded-2xl w-2 h-2 inline-block"
            :style="{ backgroundColor: pieData[0].color }"
          ></div>
          <div class="inline-block text-xs pl-2">
            {{ pieData[0].name }}: {{ pieData[0].count }} reports
          </div>
        </div>
        <div class="">
          <div
            class="rounded-2xl w-2 h-2 inline-block"
            :style="{ backgroundColor: pieData[1].color }"
          ></div>
          <div class="inline-block text-xs pl-2">
            {{ pieData[1].name }}: {{ pieData[1].count }} reports
          </div>
        </div>
        <div class="">
          <div
            class="rounded-2xl w-2 h-2 inline-block"
            :style="{ backgroundColor: pieData[2].color }"
          ></div>
          <div class="inline-block text-xs pl-2">
            {{ pieData[2].name }}: {{ pieData[2].count }} reports
          </div>
        </div>
        <div class="">
          <div
            class="rounded-2xl w-2 h-2 inline-block"
            :style="{ backgroundColor: pieData[3].color }"
          ></div>
          <div class="inline-block text-xs pl-2">
            {{ pieData[3].name }}: {{ pieData[3].count }} reports
          </div>
        </div>
      </div>
    </div>
    <div class="relative mt-6 md:-mt-10">
      <div
        class="md:absolute inline left-1/2 -top-52 rounded bg-card-5 hover:bg-gray-100 cursor-pointer shadow-md px-3 py-2"
        @click="loadChart()"
      >
        Get current count
      </div>
    </div>
  </div>
</template>

<style>
.pie {
  @apply h-52;
  @apply w-52;
  border-radius: 50%;
}
.pie::before {
  content: ’;
  @apply block;
  margin-left: 50%;
  @apply h-full;
  border-radius: 0 100% 100% 0 / 50%;
  background-color: inherit;
  transform-origin: left;
}
</style>
