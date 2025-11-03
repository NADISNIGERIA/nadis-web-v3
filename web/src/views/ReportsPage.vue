<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import PagesTop from '../components/PagesTop.vue'
import ReportStatsCards from '../components/ReportStatsCards.vue'
import AbattoirView from '../components/Tables/AbattoirView.vue'
import AquacultureView from '../components/Tables/AquacultureView.vue'
import LaboratoryView from '../components/Tables/LaboratoryView.vue'
import OutbreakView from '../components/Tables/OutbreakView.vue'
import SuspicionView from '../components/Tables/SuspicionView.vue'
import VaccinationView from '../components/Tables/VaccinationView.vue'
import VeterinarianView from '../components/Tables/VeterinarianView.vue'
import DropArrowIcon from '../components/icons/DropArrowIcon.vue'
import ExportIcon from '../components/icons/ExportIcon.vue'
import { useAuth } from './../stores/auth'
import { useMiddleware } from './../stores/middleware'
import { useAdmin } from './../stores/admin'
import router from './../router'
import { useHome } from './../stores/home'
import { useUnsubscriber } from '../stores/unsubscriber'
import { useAbattoir } from '../stores/abattoir'
import { useOutbreak } from '../stores/outbreak'
import { useVaccination } from '../stores/vaccination'
import { useSuspicion } from '../stores/suspicion'
import { useVeterinarian } from '../stores/veterinarian'
import { useLaboratory } from '../stores/laboratory'
import { useAquaculture } from '../stores/aquaculture'
import { useRoute } from 'vue-router'
import ReportStatsService, { ReportType } from '../services/reportStatsService'
import { useReportStatsUpdates } from '../services/reportStatsEventBus'
import DateRangePicker from '../components/inputs/DateRangePicker.vue'

export default defineComponent({
  components: {
    PagesTop,
    ReportStatsCards,
    AbattoirView,
    OutbreakView,
    VaccinationView,
    SuspicionView,
    VeterinarianView,
    DropArrowIcon,
    ExportIcon,
    LaboratoryView,
    AquacultureView,
    DateRangePicker
  },
  props: {
    full: Boolean
  },
  setup(props, ctx) {
    const active_menu = ref(2)
    const selected_category = ref('Approved')
    const selected_state = ref('All States')
    const states = ref([
      {
        name: 'Abia State',
        id: 1,
        locals: [
          { name: 'Aba South', id: 1 },
          { name: 'Arochukwu', id: 2 },
          { name: 'Bende', id: 3 },
          { name: 'Ikwuano', id: 4 },
          { name: 'Isiala Ngwa North', id: 5 },
          { name: 'Isiala Ngwa South', id: 6 },
          { name: 'Isuikwuato', id: 7 },
          { name: 'Obi Ngwa', id: 8 },
          { name: 'Ohafia', id: 9 },
          { name: 'Osisioma', id: 10 },
          { name: 'Ugwunagbo', id: 11 },
          { name: 'Ukwa East', id: 12 },
          { name: 'Ukwa West', id: 13 },
          { name: 'Umuahia North', id: 14 },
          { name: 'Umuahia South', id: 15 },
          { name: 'Umu Nneochi', id: 16 }
        ]
      },
      {
        name: 'Adamawa State',
        id: 2,
        locals: [
          { name: 'Fufure', id: 1 },
          { name: 'Ganye', id: 2 },
          { name: 'Gayuk', id: 3 },
          { name: 'Gombi', id: 4 },
          { name: 'Grie', id: 5 },
          { name: 'Hong', id: 6 },
          { name: 'Jada', id: 7 },
          { name: 'Lamurde', id: 8 },
          { name: 'Madagali', id: 9 },
          { name: 'Maiha', id: 10 },
          { name: 'Mayo Belwa', id: 11 },
          { name: 'Michika', id: 12 },
          { name: 'Mubi North', id: 13 },
          { name: 'Mubi South', id: 14 },
          { name: 'Numan', id: 15 },
          { name: 'Shelleng', id: 16 },
          { name: 'Song', id: 17 },
          { name: 'Toungo', id: 18 },
          { name: 'Yola North', id: 19 },
          { name: 'Yola South', id: 20 }
        ]
      },
      {
        name: 'Akwa Ibom State',
        id: 3,
        locals: [
          { name: 'Eastern Obolo', id: 1 },
          { name: 'Eket', id: 2 },
          { name: 'Esit Eket', id: 3 },
          { name: 'Essien Udim', id: 4 },
          { name: 'Etim Ekpo', id: 5 },
          { name: 'Etinan', id: 6 },
          { name: 'Ibeno', id: 7 },
          { name: 'Ibesikpo Asutan', id: 8 },
          { name: 'Ibiono-Ibom', id: 9 },
          { name: 'Ika', id: 10 },
          { name: 'Ikono', id: 11 },
          { name: 'Ikot Abasi', id: 12 },
          { name: 'Ikot Ekpene', id: 13 },
          { name: 'Ini', id: 14 },
          { name: 'Itu', id: 15 },
          { name: 'Mbo', id: 16 },
          { name: 'Mkpat-Enin', id: 17 },
          { name: 'Nsit-Atai', id: 18 },
          { name: 'Nsit-Ibom', id: 19 },
          { name: 'Nsit-Ubium', id: 20 },
          { name: 'Obot Akara', id: 21 },
          { name: 'Okobo', id: 22 },
          { name: 'Onna', id: 23 },
          { name: 'Oron', id: 24 },
          { name: 'Oruk Anam', id: 25 },
          { name: 'Udung-Uko', id: 26 },
          { name: 'Ukanafun', id: 27 },
          { name: 'Uruan', id: 28 },
          { name: 'Urue-Offong/Oruko', id: 29 },
          { name: 'Uyo', id: 30 }
        ]
      },
      {
        name: 'Anambra State',
        id: 4,
        locals: [
          { name: 'Anambra East', id: 1 },
          { name: 'Anambra West', id: 2 },
          { name: 'Anaocha', id: 3 },
          { name: 'Awka North', id: 4 },
          { name: 'Awka South', id: 5 },
          { name: 'Ayamelum', id: 6 },
          { name: 'Dunukofia', id: 7 },
          { name: 'Ekwusigo', id: 8 },
          { name: 'Idemili North', id: 9 },
          { name: 'Idemili South', id: 10 },
          { name: 'Ihiala', id: 11 },
          { name: 'Njikoka', id: 12 },
          { name: 'Nnewi North', id: 13 },
          { name: 'Nnewi South', id: 14 },
          { name: 'Ogbaru', id: 15 },
          { name: 'Onitsha North', id: 16 },
          { name: 'Onitsha South', id: 17 },
          { name: 'Orumba North', id: 18 },
          { name: 'Orumba South', id: 19 },
          { name: 'Oyi', id: 20 }
        ]
      },
      {
        name: 'Bauchi State',
        id: 5,
        locals: [
          { name: 'Bauchi', id: 1 },
          { name: 'Bogoro', id: 2 },
          { name: 'Damban', id: 3 },
          { name: 'Darazo', id: 4 },
          { name: 'Dass', id: 5 },
          { name: 'Gamawa', id: 6 },
          { name: 'Ganjuwa', id: 7 },
          { name: 'Giade', id: 8 },
          { name: 'Itas/Gadau', id: 9 },
          { name: "Jama'are", id: 10 },
          { name: 'Katagum', id: 11 },
          { name: 'Kirfi', id: 12 },
          { name: 'Misau', id: 13 },
          { name: 'Ningi', id: 14 },
          { name: 'Shira', id: 15 },
          { name: 'Tafawa Balewa', id: 16 },
          { name: 'Toro', id: 17 },
          { name: 'Warji', id: 18 },
          { name: 'Zaki', id: 19 }
        ]
      },
      {
        name: 'Bayelsa State',
        id: 6,
        locals: [
          { name: 'Ekeremor', id: 1 },
          { name: 'Kolokuma/Opokuma', id: 2 },
          { name: 'Nembe', id: 3 },
          { name: 'Ogbia', id: 4 },
          { name: 'Sagbama', id: 5 },
          { name: 'Southern Ijaw', id: 6 },
          { name: 'Yenagoa', id: 7 }
        ]
      },
      {
        name: 'Benue State',
        id: 7,
        locals: [
          { name: 'Apa', id: 1 },
          { name: 'Ado', id: 2 },
          { name: 'Buruku', id: 3 },
          { name: 'Gboko', id: 4 },
          { name: 'Guma', id: 5 },
          { name: 'Gwer East', id: 6 },
          { name: 'Gwer West', id: 7 },
          { name: 'Katsina-Ala', id: 8 },
          { name: 'Konshisha', id: 9 },
          { name: 'Kwande', id: 10 },
          { name: 'Logo', id: 11 },
          { name: 'Makurdi', id: 12 },
          { name: 'Obi', id: 13 },
          { name: 'Ogbadibo', id: 14 },
          { name: 'Ohimini', id: 15 },
          { name: 'Oju', id: 16 },
          { name: 'Okpokwu', id: 17 },
          { name: 'Oturkpo', id: 18 },
          { name: 'Tarka', id: 19 },
          { name: 'Ukum', id: 20 },
          { name: 'Ushongo', id: 21 },
          { name: 'Vandeikya', id: 22 }
        ]
      },
      {
        name: 'Borno State',
        id: 8,
        locals: [
          { name: 'Askira/Uba', id: 1 },
          { name: 'Bama', id: 2 },
          { name: 'Bayo', id: 3 },
          { name: 'Biu', id: 4 },
          { name: 'Chibok', id: 5 },
          { name: 'Damboa', id: 6 },
          { name: 'Dikwa', id: 7 },
          { name: 'Gubio', id: 8 },
          { name: 'Guzamala', id: 9 },
          { name: 'Gwoza', id: 10 },
          { name: 'Hawul', id: 11 },
          { name: 'Jere', id: 12 },
          { name: 'Kaga', id: 13 },
          { name: 'Kala/Balge', id: 14 },
          { name: 'Konduga', id: 15 },
          { name: 'Kukawa', id: 16 },
          { name: 'Kwaya Kusar', id: 17 },
          { name: 'Mafa', id: 18 },
          { name: 'Magumeri', id: 19 },
          { name: 'Maiduguri', id: 20 },
          { name: 'Marte', id: 21 },
          { name: 'Mobbar', id: 22 },
          { name: 'Monguno', id: 23 },
          { name: 'Ngala', id: 24 },
          { name: 'Nganzai', id: 25 },
          { name: 'Shani', id: 26 }
        ]
      },
      {
        name: 'Cross River State',
        id: 9,
        locals: [
          { name: 'Akamkpa', id: 1 },
          { name: 'Akpabuyo', id: 2 },
          { name: 'Bakassi', id: 3 },
          { name: 'Bekwarra', id: 4 },
          { name: 'Biase', id: 5 },
          { name: 'Boki', id: 6 },
          { name: 'Calabar Municipal', id: 7 },
          { name: 'Calabar South', id: 8 },
          { name: 'Etung', id: 9 },
          { name: 'Ikom', id: 10 },
          { name: 'Obanliku', id: 11 },
          { name: 'Obubra', id: 12 },
          { name: 'Obudu', id: 13 },
          { name: 'Odukpani', id: 14 },
          { name: 'Ogoja', id: 15 },
          { name: 'Yakuur', id: 16 },
          { name: 'Yala', id: 17 }
        ]
      },
      {
        name: 'Delta State',
        id: 10,
        locals: [
          { name: 'Aniocha South', id: 1 },
          { name: 'Bomadi', id: 2 },
          { name: 'Burutu', id: 3 },
          { name: 'Ethiope East', id: 4 },
          { name: 'Ethiope West', id: 5 },
          { name: 'Ika North East', id: 6 },
          { name: 'Ika South', id: 7 },
          { name: 'Isoko North', id: 8 },
          { name: 'Isoko South', id: 9 },
          { name: 'Ndokwa East', id: 10 },
          { name: 'Ndokwa West', id: 11 },
          { name: 'Okpe', id: 12 },
          { name: 'Oshimili North', id: 13 },
          { name: 'Oshimili South', id: 14 },
          { name: 'Patani', id: 15 },
          { name: 'Sapele', id: 16 },
          { name: 'Udu', id: 17 },
          { name: 'Ughelli North', id: 18 },
          { name: 'Ughelli South', id: 19 },
          { name: 'Ukwuani', id: 20 },
          { name: 'Uvwie', id: 21 },
          { name: 'Warri North', id: 22 },
          { name: 'Warri South', id: 23 },
          { name: 'Warri South West', id: 24 }
        ]
      },
      {
        name: 'Ebonyi State',
        id: 11,
        locals: [
          { name: 'Afikpo North', id: 1 },
          { name: 'Afikpo South', id: 2 },
          { name: 'Ebonyi', id: 3 },
          { name: 'Ezza North', id: 4 },
          { name: 'Ezza South', id: 5 },
          { name: 'Ikwo', id: 6 },
          { name: 'Ishielu', id: 7 },
          { name: 'Ivo', id: 8 },
          { name: 'Izzi', id: 9 },
          { name: 'Ohaozara', id: 10 },
          { name: 'Ohaukwu', id: 11 },
          { name: 'Onicha', id: 12 }
        ]
      },
      {
        name: 'Edo State',
        id: 12,
        locals: [
          { name: 'Egor', id: 1 },
          { name: 'Esan Central', id: 2 },
          { name: 'Esan North-East', id: 3 },
          { name: 'Esan South-East', id: 4 },
          { name: 'Esan West', id: 5 },
          { name: 'Etsako Central', id: 6 },
          { name: 'Etsako East', id: 7 },
          { name: 'Etsako West', id: 8 },
          { name: 'Igueben', id: 9 },
          { name: 'Ikpoba Okha', id: 10 },
          { name: 'Orhionmwon', id: 11 },
          { name: 'Oredo', id: 12 },
          { name: 'Ovia North-East', id: 13 },
          { name: 'Ovia South-West', id: 14 },
          { name: 'Owan East', id: 15 },
          { name: 'Owan West', id: 16 },
          { name: 'Uhunmwonde', id: 17 }
        ]
      },
      {
        name: 'Ekiti State',
        id: 13,
        locals: [
          { name: 'Efon', id: 1 },
          { name: 'Ekiti East', id: 2 },
          { name: 'Ekiti South-West', id: 3 },
          { name: 'Ekiti West', id: 4 },
          { name: 'Emure', id: 5 },
          { name: 'Gbonyin', id: 6 },
          { name: 'Ido Osi', id: 7 },
          { name: 'Ijero', id: 8 },
          { name: 'Ikere', id: 9 },
          { name: 'Ikole', id: 10 },
          { name: 'Ilejemeje', id: 11 },
          { name: 'Irepodun/Ifelodun', id: 12 },
          { name: 'Ise/Orun', id: 13 },
          { name: 'Moba', id: 14 },
          { name: 'Oye', id: 15 }
        ]
      },
      {
        name: 'Enugu State',
        id: 14,
        locals: [
          { name: 'Awgu', id: 1 },
          { name: 'Enugu East', id: 2 },
          { name: 'Enugu North', id: 3 },
          { name: 'Enugu South', id: 4 },
          { name: 'Ezeagu', id: 5 },
          { name: 'Igbo Etiti', id: 6 },
          { name: 'Igbo Eze North', id: 7 },
          { name: 'Igbo Eze South', id: 8 },
          { name: 'Isi Uzo', id: 9 },
          { name: 'Nkanu East', id: 10 },
          { name: 'Nkanu West', id: 11 },
          { name: 'Nsukka', id: 12 },
          { name: 'Oji River', id: 13 },
          { name: 'Udenu', id: 14 },
          { name: 'Udi', id: 15 },
          { name: 'Uzo Uwani', id: 16 }
        ]
      },
      {
        name: 'FCT',
        id: 15,
        locals: [
          { name: 'Bwari', id: 1 },
          { name: 'Gwagwalada', id: 2 },
          { name: 'Kuje', id: 3 },
          { name: 'Kwali', id: 4 },
          { name: 'Municipal Area Council', id: 5 }
        ]
      },
      {
        name: 'Gombe State',
        id: 16,
        locals: [
          { name: 'Balanga', id: 1 },
          { name: 'Billiri', id: 2 },
          { name: 'Dukku', id: 3 },
          { name: 'Funakaye', id: 4 },
          { name: 'Gombe', id: 5 },
          { name: 'Kaltungo', id: 6 },
          { name: 'Kwami', id: 7 },
          { name: 'Nafada', id: 8 },
          { name: 'Shongom', id: 9 },
          { name: 'Yamaltu/Deba', id: 10 }
        ]
      },
      {
        name: 'Imo State',
        id: 17,
        locals: [
          { name: 'Ahiazu Mbaise', id: 1 },
          { name: 'Ehime Mbano', id: 2 },
          { name: 'Ezinihitte', id: 3 },
          { name: 'Ideato North', id: 4 },
          { name: 'Ideato South', id: 5 },
          { name: 'Ihitte/Uboma', id: 6 },
          { name: 'Ikeduru', id: 7 },
          { name: 'Isiala Mbano', id: 8 },
          { name: 'Isu', id: 9 },
          { name: 'Mbaitoli', id: 10 },
          { name: 'Ngor Okpala', id: 11 },
          { name: 'Njaba', id: 12 },
          { name: 'Nkwerre', id: 13 },
          { name: 'Nwangele', id: 14 },
          { name: 'Obowo', id: 15 },
          { name: 'Oguta', id: 16 },
          { name: 'Ohaji/Egbema', id: 17 },
          { name: 'Okigwe', id: 18 },
          { name: 'Orlu', id: 19 },
          { name: 'Orsu', id: 20 },
          { name: 'Oru East', id: 21 },
          { name: 'Oru West', id: 22 },
          { name: 'Owerri Municipal', id: 23 },
          { name: 'Owerri North', id: 24 },
          { name: 'Owerri West', id: 25 },
          { name: 'Unuimo', id: 26 }
        ]
      },
      {
        name: 'Jigawa State',
        id: 18,
        locals: [
          { name: 'Babura', id: 1 },
          { name: 'Biriniwa', id: 2 },
          { name: 'Birnin Kudu', id: 3 },
          { name: 'Buji', id: 4 },
          { name: 'Dutse', id: 5 },
          { name: 'Gagarawa', id: 6 },
          { name: 'Garki', id: 7 },
          { name: 'Gumel', id: 8 },
          { name: 'Guri', id: 9 },
          { name: 'Gwaram', id: 10 },
          { name: 'Gwiwa', id: 11 },
          { name: 'Hadejia', id: 12 },
          { name: 'Jahun', id: 13 },
          { name: 'Kafin Hausa', id: 14 },
          { name: 'Kazaure', id: 15 },
          { name: 'Kiri Kasama', id: 16 },
          { name: 'Kiyawa', id: 17 },
          { name: 'Kaugama', id: 18 },
          { name: 'Maigatari', id: 19 },
          { name: 'Malam Madori', id: 20 },
          { name: 'Miga', id: 21 },
          { name: 'Ringim', id: 22 },
          { name: 'Roni', id: 23 },
          { name: 'Sule Tankarkar', id: 24 },
          { name: 'Taura', id: 25 },
          { name: 'Yankwashi', id: 26 }
        ]
      },
      {
        name: 'Kaduna State',
        id: 19,
        locals: [
          { name: 'Chikun', id: 1 },
          { name: 'Giwa', id: 2 },
          { name: 'Igabi', id: 3 },
          { name: 'Ikara', id: 4 },
          { name: 'Jaba', id: 5 },
          { name: "Jema'a", id: 6 },
          { name: 'Kachia', id: 7 },
          { name: 'Kaduna North', id: 8 },
          { name: 'Kaduna South', id: 9 },
          { name: 'Kagarko', id: 10 },
          { name: 'Kajuru', id: 11 },
          { name: 'Kaura', id: 12 },
          { name: 'Kauru', id: 13 },
          { name: 'Kubau', id: 14 },
          { name: 'Kudan', id: 15 },
          { name: 'Lere', id: 16 },
          { name: 'Makarfi', id: 17 },
          { name: 'Sabon Gari', id: 18 },
          { name: 'Sanga', id: 19 },
          { name: 'Soba', id: 20 },
          { name: 'Zangon Kataf', id: 21 },
          { name: 'Zaria', id: 22 }
        ]
      },
      {
        name: 'Kano State',
        id: 20,
        locals: [
          { name: 'Albasu', id: 1 },
          { name: 'Bagwai', id: 2 },
          { name: 'Bebeji', id: 3 },
          { name: 'Bichi', id: 4 },
          { name: 'Bunkure', id: 5 },
          { name: 'Dala', id: 6 },
          { name: 'Dambatta', id: 7 },
          { name: 'Dawakin Kudu', id: 8 },
          { name: 'Dawakin Tofa', id: 9 },
          { name: 'Doguwa', id: 10 },
          { name: 'Fagge', id: 11 },
          { name: 'Gabasawa', id: 12 },
          { name: 'Garko', id: 13 },
          { name: 'Garun Mallam', id: 14 },
          { name: 'Gaya', id: 15 },
          { name: 'Gezawa', id: 16 },
          { name: 'Gwale', id: 17 },
          { name: 'Gwarzo', id: 18 },
          { name: 'Kabo', id: 19 },
          { name: 'Kano Municipal', id: 20 },
          { name: 'Karaye', id: 21 },
          { name: 'Kibiya', id: 22 },
          { name: 'Kiru', id: 23 },
          { name: 'Kumbotso', id: 24 },
          { name: 'Kunchi', id: 25 },
          { name: 'Kura', id: 26 },
          { name: 'Madobi', id: 27 },
          { name: 'Makoda', id: 28 },
          { name: 'Minjibir', id: 29 },
          { name: 'Nasarawa', id: 30 },
          { name: 'Rano', id: 31 },
          { name: 'Rimin Gado', id: 32 },
          { name: 'Rogo', id: 33 },
          { name: 'Shanono', id: 34 },
          { name: 'Sumaila', id: 35 },
          { name: 'Takai', id: 36 },
          { name: 'Tarauni', id: 37 },
          { name: 'Tofa', id: 38 },
          { name: 'Tsanyawa', id: 39 },
          { name: 'Tudun Wada', id: 40 },
          { name: 'Ungogo', id: 41 },
          { name: 'Warawa', id: 42 },
          { name: 'Wudil', id: 43 }
        ]
      },
      {
        name: 'Katsina State',
        id: 21,
        locals: [
          { name: 'Batagarawa', id: 1 },
          { name: 'Batsari', id: 2 },
          { name: 'Baure', id: 3 },
          { name: 'Bindawa', id: 4 },
          { name: 'Charanchi', id: 5 },
          { name: 'Dandume', id: 6 },
          { name: 'Danja', id: 7 },
          { name: 'Dan Musa', id: 8 },
          { name: 'Daura', id: 9 },
          { name: 'Dutsi', id: 10 },
          { name: 'Dutsin Ma', id: 11 },
          { name: 'Faskari', id: 12 },
          { name: 'Funtua', id: 13 },
          { name: 'Ingawa', id: 14 },
          { name: 'Jibia', id: 15 },
          { name: 'Kafur', id: 16 },
          { name: 'Kaita', id: 17 },
          { name: 'Kankara', id: 18 },
          { name: 'Kankia', id: 19 },
          { name: 'Katsina', id: 20 },
          { name: 'Kurfi', id: 21 },
          { name: 'Kusada', id: 22 },
          { name: "Mai'Adua", id: 23 },
          { name: 'Malumfashi', id: 24 },
          { name: 'Mani', id: 25 },
          { name: 'Mashi', id: 26 },
          { name: 'Matazu', id: 27 },
          { name: 'Musawa', id: 28 },
          { name: 'Rimi', id: 29 },
          { name: 'Sabuwa', id: 30 },
          { name: 'Safana', id: 31 },
          { name: 'Sandamu', id: 32 },
          { name: 'Zango', id: 33 }
        ]
      },
      {
        name: 'Kebbi State',
        id: 22,
        locals: [
          { name: 'Arewa Dandi', id: 1 },
          { name: 'Argungu', id: 2 },
          { name: 'Augie', id: 3 },
          { name: 'Bagudo', id: 4 },
          { name: 'Birnin Kebbi', id: 5 },
          { name: 'Bunza', id: 6 },
          { name: 'Dandi', id: 7 },
          { name: 'Fakai', id: 8 },
          { name: 'Gwandu', id: 9 },
          { name: 'Jega', id: 10 },
          { name: 'Kalgo', id: 11 },
          { name: 'Koko/Besse', id: 12 },
          { name: 'Maiyama', id: 13 },
          { name: 'Ngaski', id: 14 },
          { name: 'Sakaba', id: 15 },
          { name: 'Shanga', id: 16 },
          { name: 'Suru', id: 17 },
          { name: 'Wasagu/Danko', id: 18 },
          { name: 'Yauri', id: 19 },
          { name: 'Zuru', id: 20 }
        ]
      },
      {
        name: 'Kogi State',
        id: 23,
        locals: [
          { name: 'Ajaokuta', id: 1 },
          { name: 'Ankpa', id: 2 },
          { name: 'Bassa', id: 3 },
          { name: 'Dekina', id: 4 },
          { name: 'Ibaji', id: 5 },
          { name: 'Idah', id: 6 },
          { name: 'Igalamela Odolu', id: 7 },
          { name: 'Ijumu', id: 8 },
          { name: 'Kabba/Bunu', id: 9 },
          { name: 'Kogi', id: 10 },
          { name: 'Lokoja', id: 11 },
          { name: 'Mopa Muro', id: 12 },
          { name: 'Ofu', id: 13 },
          { name: 'Ogori/Magongo', id: 14 },
          { name: 'Okehi', id: 15 },
          { name: 'Okene', id: 16 },
          { name: 'Olamaboro', id: 17 },
          { name: 'Omala', id: 18 },
          { name: 'Yagba East', id: 19 },
          { name: 'Yagba West', id: 20 }
        ]
      },
      {
        name: 'Kwara State',
        id: 24,
        locals: [
          { name: 'Baruten', id: 1 },
          { name: 'Edu', id: 2 },
          { name: 'Ekiti', id: 3 },
          { name: 'Ifelodun', id: 4 },
          { name: 'Ilorin East', id: 5 },
          { name: 'Ilorin South', id: 6 },
          { name: 'Ilorin West', id: 7 },
          { name: 'Irepodun', id: 8 },
          { name: 'Isin', id: 9 },
          { name: 'Kaiama', id: 10 },
          { name: 'Moro', id: 11 },
          { name: 'Offa', id: 12 },
          { name: 'Oke Ero', id: 13 },
          { name: 'Oyun', id: 14 },
          { name: 'Pategi', id: 15 }
        ]
      },
      {
        name: 'Lagos State',
        id: 25,
        locals: [
          { name: 'Ajeromi-Ifelodun', id: 1 },
          { name: 'Alimosho', id: 2 },
          { name: 'Amuwo-Odofin', id: 3 },
          { name: 'Apapa', id: 4 },
          { name: 'Badagry', id: 5 },
          { name: 'Epe', id: 6 },
          { name: 'Eti Osa', id: 7 },
          { name: 'Ibeju-Lekki', id: 8 },
          { name: 'Ifako-Ijaiye', id: 9 },
          { name: 'Ikeja', id: 10 },
          { name: 'Ikorodu', id: 11 },
          { name: 'Kosofe', id: 12 },
          { name: 'Lagos Island', id: 13 },
          { name: 'Lagos Mainland', id: 14 },
          { name: 'Mushin', id: 15 },
          { name: 'Ojo', id: 16 },
          { name: 'Oshodi-Isolo', id: 17 },
          { name: 'Shomolu', id: 18 },
          { name: 'Surulere', id: 19 }
        ]
      },
      {
        name: 'Nasarawa State',
        id: 26,
        locals: [
          { name: 'Awe', id: 1 },
          { name: 'Doma', id: 2 },
          { name: 'Karu', id: 3 },
          { name: 'Keana', id: 4 },
          { name: 'Keffi', id: 5 },
          { name: 'Kokona', id: 6 },
          { name: 'Lafia', id: 7 },
          { name: 'Nasarawa', id: 8 },
          { name: 'Nasarawa Egon', id: 9 },
          { name: 'Obi', id: 10 },
          { name: 'Toto', id: 11 },
          { name: 'Wamba', id: 12 }
        ]
      },
      {
        name: 'Niger State',
        id: 27,
        locals: [
          { name: 'Agwara', id: 1 },
          { name: 'Bida', id: 2 },
          { name: 'Borgu', id: 3 },
          { name: 'Bosso', id: 4 },
          { name: 'Chanchaga', id: 5 },
          { name: 'Edati', id: 6 },
          { name: 'Gbako', id: 7 },
          { name: 'Gurara', id: 8 },
          { name: 'Katcha', id: 9 },
          { name: 'Kontagora', id: 10 },
          { name: 'Lapai', id: 11 },
          { name: 'Lavun', id: 12 },
          { name: 'Magama', id: 13 },
          { name: 'Mariga', id: 14 },
          { name: 'Mashegu', id: 15 },
          { name: 'Mokwa', id: 16 },
          { name: 'Moya', id: 17 },
          { name: 'Paikoro', id: 18 },
          { name: 'Rafi', id: 19 },
          { name: 'Rijau', id: 20 },
          { name: 'Shiroro', id: 21 },
          { name: 'Suleja', id: 22 },
          { name: 'Tafa', id: 23 },
          { name: 'Wushishi', id: 24 }
        ]
      },
      {
        name: 'Ogun State',
        id: 28,
        locals: [
          { name: 'Abeokuta South', id: 1 },
          { name: 'Ado-Odo/Ota', id: 2 },
          { name: 'Egbado North', id: 3 },
          { name: 'Egbado South', id: 4 },
          { name: 'Ewekoro', id: 5 },
          { name: 'Ifo', id: 6 },
          { name: 'Ijebu East', id: 7 },
          { name: 'Ijebu North', id: 8 },
          { name: 'Ijebu North East', id: 9 },
          { name: 'Ijebu Ode', id: 10 },
          { name: 'Ikenne', id: 11 },
          { name: 'Imeko Afon', id: 12 },
          { name: 'Ipokia', id: 13 },
          { name: 'Obafemi Owode', id: 14 },
          { name: 'Odeda', id: 15 },
          { name: 'Odogbolu', id: 16 },
          { name: 'Ogun Waterside', id: 17 },
          { name: 'Remo North', id: 18 },
          { name: 'Shagamu', id: 19 }
        ]
      },
      {
        name: 'Ondo State',
        id: 29,
        locals: [
          { name: 'Akoko North-West', id: 1 },
          { name: 'Akoko South-West', id: 2 },
          { name: 'Akoko South-East', id: 3 },
          { name: 'Akure North', id: 4 },
          { name: 'Akure South', id: 5 },
          { name: 'Ese Odo', id: 6 },
          { name: 'Idanre', id: 7 },
          { name: 'Ifedore', id: 8 },
          { name: 'Ilaje', id: 9 },
          { name: 'Ile Oluji/Okeigbo', id: 10 },
          { name: 'Irele', id: 11 },
          { name: 'Odigbo', id: 12 },
          { name: 'Okitipupa', id: 13 },
          { name: 'Ondo East', id: 14 },
          { name: 'Ondo West', id: 15 },
          { name: 'Ose', id: 16 },
          { name: 'Owo', id: 17 }
        ]
      },
      {
        name: 'Osun State',
        id: 30,
        locals: [
          { name: 'Atakunmosa West', id: 1 },
          { name: 'Aiyedaade', id: 2 },
          { name: 'Aiyedire', id: 3 },
          { name: 'Boluwaduro', id: 4 },
          { name: 'Boripe', id: 5 },
          { name: 'Ede North', id: 6 },
          { name: 'Ede South', id: 7 },
          { name: 'Ife Central', id: 8 },
          { name: 'Ife East', id: 9 },
          { name: 'Ife North', id: 10 },
          { name: 'Ife South', id: 11 },
          { name: 'Egbedore', id: 12 },
          { name: 'Ejigbo', id: 13 },
          { name: 'Ifedayo', id: 14 },
          { name: 'Ifelodun', id: 15 },
          { name: 'Ila', id: 16 },
          { name: 'Ilesa East', id: 17 },
          { name: 'Ilesa West', id: 18 },
          { name: 'Irepodun', id: 19 },
          { name: 'Irewole', id: 20 },
          { name: 'Isokan', id: 21 },
          { name: 'Iwo', id: 22 },
          { name: 'Obokun', id: 23 },
          { name: 'Odo Otin', id: 24 },
          { name: 'Ola Oluwa', id: 25 },
          { name: 'Olorunda', id: 26 },
          { name: 'Oriade', id: 27 },
          { name: 'Orolu', id: 28 },
          { name: 'Osogbo', id: 29 }
        ]
      },
      {
        name: 'Oyo State',
        id: 31,
        locals: [
          { name: 'Akinyele', id: 1 },
          { name: 'Atiba', id: 2 },
          { name: 'Atisbo', id: 3 },
          { name: 'Egbeda', id: 4 },
          { name: 'Ibadan North', id: 5 },
          { name: 'Ibadan North-East', id: 6 },
          { name: 'Ibadan North-West', id: 7 },
          { name: 'Ibadan South-East', id: 8 },
          { name: 'Ibadan South-West', id: 9 },
          { name: 'Ibarapa Central', id: 10 },
          { name: 'Ibarapa East', id: 11 },
          { name: 'Ibarapa North', id: 12 },
          { name: 'Ido', id: 13 },
          { name: 'Irepo', id: 14 },
          { name: 'Iseyin', id: 15 },
          { name: 'Itesiwaju', id: 16 },
          { name: 'Iwajowa', id: 17 },
          { name: 'Kajola', id: 18 },
          { name: 'Lagelu', id: 19 },
          { name: 'Ogbomosho North', id: 20 },
          { name: 'Ogbomosho South', id: 21 },
          { name: 'Ogo Oluwa', id: 22 },
          { name: 'Olorunsogo', id: 23 },
          { name: 'Oluyole', id: 24 },
          { name: 'Ona Ara', id: 25 },
          { name: 'Orelope', id: 26 },
          { name: 'Ori Ire', id: 27 },
          { name: 'Oyo', id: 28 },
          { name: 'Oyo East', id: 29 },
          { name: 'Saki East', id: 30 },
          { name: 'Saki West', id: 31 },
          { name: 'Surulere', id: 32 }
        ]
      },
      {
        name: 'Plateau State',
        id: 32,
        locals: [
          { name: 'Barkin Ladi', id: 1 },
          { name: 'Bassa', id: 2 },
          { name: 'Jos East', id: 3 },
          { name: 'Jos North', id: 4 },
          { name: 'Jos South', id: 5 },
          { name: 'Kanam', id: 6 },
          { name: 'Kanke', id: 7 },
          { name: 'Langtang South', id: 8 },
          { name: 'Langtang North', id: 9 },
          { name: 'Mangu', id: 10 },
          { name: 'Mikang', id: 11 },
          { name: 'Pankshin', id: 12 },
          { name: "Qua'an Pan", id: 13 },
          { name: 'Riyom', id: 14 },
          { name: 'Shendam', id: 15 },
          { name: 'Wase', id: 16 }
        ]
      },
      {
        name: 'Rivers State',
        id: 33,
        locals: [
          { name: 'Ahoada East', id: 1 },
          { name: 'Ahoada West', id: 2 },
          { name: 'Akuku-Toru', id: 3 },
          { name: 'Andoni', id: 4 },
          { name: 'Asari-Toru', id: 5 },
          { name: 'Bonny', id: 6 },
          { name: 'Degema', id: 7 },
          { name: 'Eleme', id: 8 },
          { name: 'Emuoha', id: 9 },
          { name: 'Etche', id: 10 },
          { name: 'Gokana', id: 11 },
          { name: 'Ikwerre', id: 12 },
          { name: 'Khana', id: 13 },
          { name: 'Obio/Akpor', id: 14 },
          { name: 'Ogba/Egbema/Ndoni', id: 15 },
          { name: 'Ogu/Bolo', id: 16 },
          { name: 'Okrika', id: 17 },
          { name: 'Omuma', id: 18 },
          { name: 'Opobo/Nkoro', id: 19 },
          { name: 'Oyigbo', id: 20 },
          { name: 'Port Harcourt', id: 21 },
          { name: 'Tai', id: 22 }
        ]
      },
      {
        name: 'Sokoto State',
        id: 34,
        locals: [
          { name: 'Bodinga', id: 1 },
          { name: 'Dange Shuni', id: 2 },
          { name: 'Gada', id: 3 },
          { name: 'Goronyo', id: 4 },
          { name: 'Gudu', id: 5 },
          { name: 'Gwadabawa', id: 6 },
          { name: 'Illela', id: 7 },
          { name: 'Isa', id: 8 },
          { name: 'Kebbe', id: 9 },
          { name: 'Kware', id: 10 },
          { name: 'Rabah', id: 11 },
          { name: 'Sabon Birni', id: 12 },
          { name: 'Shagari', id: 13 },
          { name: 'Silame', id: 14 },
          { name: 'Sokoto North', id: 15 },
          { name: 'Sokoto South', id: 16 },
          { name: 'Tambuwal', id: 17 },
          { name: 'Tangaza', id: 18 },
          { name: 'Tureta', id: 19 },
          { name: 'Wamako', id: 20 },
          { name: 'Wurno', id: 21 },
          { name: 'Yabo', id: 22 }
        ]
      },
      {
        name: 'Taraba State',
        id: 35,
        locals: [
          { name: 'Bali', id: 1 },
          { name: 'Donga', id: 2 },
          { name: 'Gashaka', id: 3 },
          { name: 'Gassol', id: 4 },
          { name: 'Ibi', id: 5 },
          { name: 'Jalingo', id: 6 },
          { name: 'Karim Lamido', id: 7 },
          { name: 'Kumi', id: 8 },
          { name: 'Lau', id: 9 },
          { name: 'Sardauna', id: 10 },
          { name: 'Takum', id: 11 },
          { name: 'Ussa', id: 12 },
          { name: 'Wukari', id: 13 },
          { name: 'Yorro', id: 14 },
          { name: 'Zing', id: 15 }
        ]
      },
      {
        name: 'Yobe State',
        id: 36,
        locals: [
          { name: 'Bursari', id: 1 },
          { name: 'Damaturu', id: 2 },
          { name: 'Fika', id: 3 },
          { name: 'Fune', id: 4 },
          { name: 'Geidam', id: 5 },
          { name: 'Gujba', id: 6 },
          { name: 'Gulani', id: 7 },
          { name: 'Jakusko', id: 8 },
          { name: 'Karasuwa', id: 9 },
          { name: 'Machina', id: 10 },
          { name: 'Nangere', id: 11 },
          { name: 'Nguru', id: 12 },
          { name: 'Potiskum', id: 13 },
          { name: 'Tarmuwa', id: 14 },
          { name: 'Yunusari', id: 15 },
          { name: 'Yusufari', id: 16 }
        ]
      },
      {
        name: 'Zamfara State',
        id: 37,
        locals: [
          { name: 'Bakura', id: 1 },
          { name: 'Birnin Magaji/Kiyaw', id: 2 },
          { name: 'Bukkuyum', id: 3 },
          { name: 'Bungudu', id: 4 },
          { name: 'Gummi', id: 5 },
          { name: 'Gusau', id: 6 },
          { name: 'Kaura Namoda', id: 7 },
          { name: 'Maradun', id: 8 },
          { name: 'Maru', id: 9 },
          { name: 'Shinkafi', id: 10 },
          { name: 'Talata Mafara', id: 11 },
          { name: 'Chafe', id: 12 },
          { name: 'Zurmi', id: 13 }
        ]
      }
    ])
    const show_category = ref(false)
    const show_state = ref(false)
    // Improved: Single state management
    enum ReportType {
      ABATTOIR = 'abattoir',
      OUTBREAK = 'outbreak',
      VACCINATION = 'vaccination',
      SUSPICION = 'suspicion',
      VETERINARIAN = 'veterinarian',
      LABORATORY = 'laboratory',
      AQUACULTURE = 'aquaculture'
    }

    const activeReportType = ref<ReportType>(ReportType.ABATTOIR)

    // Configuration for report types
    const reportTypeConfig = [
      { key: ReportType.ABATTOIR, label: 'Abattoir Disease', id: 'abattoir' },
      { key: ReportType.OUTBREAK, label: 'Outbreak', id: 'outbreak' },
      { key: ReportType.VACCINATION, label: 'Vaccination', id: 'vaccination' },
      { key: ReportType.SUSPICION, label: 'Disease Suspicion', id: 'suspicion' },
      { key: ReportType.VETERINARIAN, label: 'Private Veterinarian Disease', id: 'veterinarian' },
      { key: ReportType.LABORATORY, label: 'Laboratory Disease', id: 'laboratory' },
      { key: ReportType.AQUACULTURE, label: 'Aquaculture Disease', id: 'aquaculture' }
    ]

    // Computed properties for backward compatibility
    const abattoir = computed(() => activeReportType.value === ReportType.ABATTOIR)
    const outbreak = computed(() => activeReportType.value === ReportType.OUTBREAK)
    const vaccination = computed(() => activeReportType.value === ReportType.VACCINATION)
    const suspicion = computed(() => activeReportType.value === ReportType.SUSPICION)
    const veterinarian = computed(() => activeReportType.value === ReportType.VETERINARIAN)
    const laboratory = computed(() => activeReportType.value === ReportType.LABORATORY)
    const aquaculture = computed(() => activeReportType.value === ReportType.AQUACULTURE)
    const export_to_excel = ref(1)
    
    // Date range state for filtering and export
    const selectedStartDate = ref<string | null>(null)
    const selectedEndDate = ref<string | null>(null)
    const showExportModal = ref(false)
    const selectedExportFormat = ref<'excel' | 'csv' | 'pdf'>('excel')
    
    // Loading and error states
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    
    // Stats for the active report type
    const reportStats = ref({
      total: 0,
      approved: 0,
      pending: 0,
      inProgress: 0
    })

    // Setup stats update event listener
    const { onStatsUpdate } = useReportStatsUpdates()

    // Function to fetch stats for the current report type
    const fetchReportStats = async () => {
      if (!activeReportType.value) return

      try {
        const reportTypeMap: Record<string, ReportType> = {
          'abattoir': 'abattoir_reports',
          'outbreak': 'outbreak_reports', 
          'vaccination': 'vaccination_reports',
          'suspicion': 'suspicion_reports',
          'veterinarian': 'veterinarian_reports',
          'laboratory': 'laboratory_reports',
          'aquaculture': 'aquaculture_reports'
        }

        const firebaseReportType = reportTypeMap[activeReportType.value]
        if (!firebaseReportType) return

        const state = selected_state.value === 'All States' ? undefined : selected_state.value
        const stats = await ReportStatsService.getReportStats(firebaseReportType, state)
        reportStats.value = stats

      } catch (err) {
        console.error('Error fetching report stats:', err)
        // Reset to zeros on error
        reportStats.value = {
          total: 0,
          approved: 0,
          pending: 0,
          inProgress: 0
        }
      }
    }

    const isUserAlreadySignedIn = computed(() => useAuth().user.uid)
    const role = computed(() => useMiddleware().role)
    const admin = computed(() => useAdmin().admin) as any
    const route = useRoute()

    // Initialize report type and date filters from URL query parameters
    const initializeFromURL = () => {
      const urlReportType = route.query.type as string
      const validReportType = Object.values(ReportType).find(type => type === urlReportType)
      if (validReportType) {
        activeReportType.value = validReportType as ReportType
      }
      
      // Restore date filters from URL
      const urlStartDate = route.query.startDate as string
      const urlEndDate = route.query.endDate as string
      
      if (urlStartDate && isValidDate(urlStartDate)) {
        selectedStartDate.value = urlStartDate
      }
      if (urlEndDate && isValidDate(urlEndDate)) {
        selectedEndDate.value = urlEndDate
      }
    }

    // Helper function to validate date strings
    const isValidDate = (dateString: string): boolean => {
      const date = new Date(dateString)
      return date instanceof Date && !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/)
    }

    watch(role, () => {
      const new_role = role.value.toLocaleLowerCase()
      if (new_role != 'federal') {
        selected_state.value = admin.value.state
      }
    })

    const selectCategory = async (val: any) => {
      selected_category.value = val
      show_category.value = false
      // Refresh stats when category changes
      await fetchReportStats()
    }
    const selectState = async (index: any) => {
      if (index === 'All States') {
        selected_state.value = index
        show_state.value = false
      } else {
        const state = states.value[index].name
        selected_state.value = state
        show_state.value = false
      }
      // Refresh stats when state changes
      await fetchReportStats()
    }
    // Improved: Single method to handle all selections with loading state
    const selectReportType = async (reportType: ReportType) => {
      if (activeReportType.value === reportType) return // Already selected
      
      try {
        isLoading.value = true
        error.value = null
        useUnsubscriber().unsubscribeAllSnapshot()
        
        // Update URL to reflect current selection (preserve date filters in URL)
        const newQuery = { 
          ...route.query, 
          type: reportType,
          startDate: selectedStartDate.value || undefined,
          endDate: selectedEndDate.value || undefined
        }
        
        router.replace({ query: newQuery }).catch(() => {}) // Ignore navigation errors
        
        activeReportType.value = reportType
        
        // Preload data for the selected report type with improved caching
        await preloadReportData(reportType)
        
        // Fetch stats for the selected report type
        await fetchReportStats()
      } catch (err) {
        error.value = `Failed to load ${reportType} reports`
        console.error('Error selecting report type:', err)
      } finally {
        isLoading.value = false
      }
    }

    // Preload data for the selected report type
    const preloadReportData = async (reportType: ReportType) => {
      const values = {
        category: selected_category.value === 'Approved',
        state: selected_state.value,
        in_progress: selected_category.value === 'In Progress'
      }

      try {
        switch (reportType) {
          case ReportType.ABATTOIR:
            await useAbattoir().getAbattoir(values)
            break
          case ReportType.OUTBREAK:
            await useOutbreak().getOutbreak(values)
            break
          case ReportType.VACCINATION:
            await useVaccination().getVaccination(values)
            break
          case ReportType.SUSPICION:
            await useSuspicion().getSuspicion(values)
            break
          case ReportType.VETERINARIAN:
            await useVeterinarian().getVeterinarian(values)
            break
          case ReportType.LABORATORY:
            await useLaboratory().getLaboratory(values)
            break
          case ReportType.AQUACULTURE:
            await useAquaculture().getAquaculture(values)
            break
        }
      } catch (err) {
        console.error(`Error preloading ${reportType} data:`, err)
        throw err
      }
    }

    // Date range handling
    const handleDateRangeChange = ({ startDate, endDate }: { startDate: string | null; endDate: string | null }) => {
      selectedStartDate.value = startDate
      selectedEndDate.value = endDate
      
      // Update URL to persist date filters across report type switches
      const newQuery = { 
        ...route.query, 
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }
      
      router.replace({ query: newQuery }).catch(() => {})
    }

    const openExportModal = () => {
      showExportModal.value = true
    }

    const closeExportModal = () => {
      showExportModal.value = false
    }

    const clearDateRange = () => {
      selectedStartDate.value = null
      selectedEndDate.value = null
    }

    // Export functions
    const exportToExcel = () => {
      openExportModal()
    }

    // Actual export function called from modal
    let exportTimeout: NodeJS.Timeout | null = null
    const performExport = () => {
      if (exportTimeout) {
        clearTimeout(exportTimeout)
      }
      exportTimeout = setTimeout(() => {
        // Pass date range and format to export functionality
        const exportData = {
          startDate: selectedStartDate.value,
          endDate: selectedEndDate.value,
          reportType: activeReportType.value,
          state: selected_state.value,
          category: selected_category.value,
          format: selectedExportFormat.value
        }
        
        // Store export data for table components to access
        window.exportFilters = exportData
        
        export_to_excel.value++
        closeExportModal()
        exportTimeout = null
      }, 300)
    }

    // Specific selection methods for backward compatibility
    const selectAbattoir = () => selectReportType(ReportType.ABATTOIR)
    const selectOutbreak = () => selectReportType(ReportType.OUTBREAK)
    const selectVaccination = () => selectReportType(ReportType.VACCINATION)
    const selectSuspicion = () => selectReportType(ReportType.SUSPICION)
    const selectVeterinarian = () => selectReportType(ReportType.VETERINARIAN)
    const selectLaboratory = () => selectReportType(ReportType.LABORATORY)
    const selectAquaculture = () => selectReportType(ReportType.AQUACULTURE)

    onMounted(async () => {
      ctx.emit('active-menu', active_menu.value)
      
      if (isUserAlreadySignedIn.value == undefined) {
        router.push({ name: 'Register' })
        return
      }

      // Initialize report type from URL
      initializeFromURL()
      
      if (role.value != 'Federal') {
        if (admin.value != undefined) {
          if (admin.value.state != undefined) {
            selected_state.value = admin.value.state
          }
        }
      }
      
      // Setup stats update listener
      onStatsUpdate((event) => {
        // Only refresh stats if the event is for the currently active report type
        const reportTypeMap: Record<string, ReportType> = {
          'abattoir': 'abattoir_reports',
          'outbreak': 'outbreak_reports', 
          'vaccination': 'vaccination_reports',
          'suspicion': 'suspicion_reports',
          'veterinarian': 'veterinarian_reports',
          'laboratory': 'laboratory_reports',
          'aquaculture': 'aquaculture_reports'
        }

        const currentFirebaseReportType = reportTypeMap[activeReportType.value]
        if (event.reportType === currentFirebaseReportType) {
          // Refresh stats after a short delay to allow database to update
          setTimeout(() => {
            fetchReportStats()
          }, 500)
        }
      })
      
      // Fetch initial stats for the active report type (default is abattoir)
      await fetchReportStats()
      
      useHome().hasAccess()
    })

    return {
      // State
      role,
      states,
      abattoir,
      outbreak,
      vaccination,
      suspicion,
      veterinarian,
      laboratory,
      aquaculture,
      export_to_excel,
      show_state,
      show_category,
      selected_category,
      selected_state,
      isUserAlreadySignedIn,
      isLoading,
      error,
      reportStats,
      selectedStartDate,
      selectedEndDate,
      showExportModal,
      selectedExportFormat,
      
      // Configuration
      reportTypeConfig,
      activeReportType,
      
      // Methods
      selectCategory,
      selectState,
      selectReportType,
      selectAbattoir,
      selectOutbreak,
      selectVaccination,
      selectSuspicion,
      selectVeterinarian,
      selectLaboratory,
      selectAquaculture,
      exportToExcel,
      fetchReportStats,
      handleDateRangeChange,
      openExportModal,
      closeExportModal,
      clearDateRange,
      performExport,
      isValidDate
    }
  }
})
</script>

<template>
  <div class="text-left">
    <pages-top :title="'All Reports'"></pages-top>
    
    <!-- Error Display -->
    <div v-if="error" class="mx-5 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-800">{{ error }}</p>
          <button @click="error = null" class="mt-2 text-sm text-red-600 hover:text-red-500">
            Dismiss
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay for Tab Switching -->
    <div v-if="isLoading" class="mx-5 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div class="flex items-center">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-blue-800">Switching report type...</span>
      </div>
    </div>
    
    <div class="pt-7 px-5 w-full overflow-x-scroll">
      <div class="w-1400">
        <div
          id="abattoir"
          @click="selectAbattoir()"
          class="px-4 py-3 text-xl mr-2 inline-block cursor-pointer rounded mb-3"
          :class="{
            'bg-primary hover:bg-primary-2 text-white': abattoir,
            'text-gray-400 hover:border-gray-300 border border-white': !abattoir
          }"
        >
          Abattoir Disease
        </div>
        <div
          id="outbreak"
          @click="selectOutbreak()"
          class="px-4 py-3 text-xl mr-2 inline-block cursor-pointer rounded mb-3"
          :class="{
            'bg-primary hover:bg-primary-2 text-white': outbreak,
            'text-gray-400 hover:border-gray-300 border border-white': !outbreak
          }"
        >
          Outbreak
        </div>
        <div
          id="vaccination"
          @click="selectVaccination()"
          class="px-4 py-3 text-xl mr-2 inline-block cursor-pointer rounded mb-3"
          :class="{
            'bg-primary hover:bg-primary-2 text-white': vaccination,
            'text-gray-400 hover:border-gray-300 border border-white': !vaccination
          }"
        >
          Vaccination
        </div>
        <div
          id="suspicion"
          @click="selectSuspicion()"
          class="px-4 py-3 text-xl mr-2 inline-block cursor-pointer rounded mb-3"
          :class="{
            'bg-primary hover:bg-primary-2 text-white': suspicion,
            'text-gray-400 hover:border-gray-300 border border-white': !suspicion
          }"
        >
          Disease Suspicion
        </div>
        <div
          id="veterinarian"
          @click="selectVeterinarian()"
          class="px-4 py-3 text-xl mr-2 inline-block cursor-pointer rounded mb-3"
          :class="{
            'bg-primary hover:bg-primary-2 text-white': veterinarian,
            'text-gray-400 hover:border-gray-300 border border-white': !veterinarian
          }"
        >
          Private Veterinarian Disease
        </div>
        <div
          id="laboratory"
          @click="selectLaboratory()"
          class="px-4 py-3 text-xl mr-2 inline-block cursor-pointer rounded mb-3"
          :class="{
            'bg-primary hover:bg-primary-2 text-white': laboratory,
            'text-gray-400 hover:border-gray-300 border border-white': !laboratory
          }"
        >
          Laboratory Disease
        </div>
        <div
          id="aquaculture"
          @click="selectAquaculture()"
          class="px-4 py-3 text-xl mr-2 inline-block cursor-pointer rounded mb-3"
          :class="{
            'bg-primary hover:bg-primary-2 text-white': aquaculture,
            'text-gray-400 hover:border-gray-300 border border-white': !aquaculture
          }"
        >
          Aquaculture Disease
        </div>
      </div>
    </div>
    <div class="px-5 py-5">
      <div
        class="p-3 text-sm sm:px-4 sm:py-3 bg-card-5 rounded inline-block cursor-pointer shadow-md"
      >
        <div class="text-primary" :class="{ 'pb-2': show_state }" @click="show_state = !show_state">
          {{ selected_state }}
          <div class="inline-block pl-1 sm:pl-2" v-if="role == 'Federal'">
            <drop-arrow-icon></drop-arrow-icon>
          </div>
        </div>
        <div
          v-if="show_state && role == 'Federal'"
          class="pt-2 absolute bg-card-5 -ml-4 border border-card-9 rounded rounded-t-none h-96 overflow-y-scroll"
        >
          <div
            class="text-primary hover:bg-card-4 py-2 pl-4 pr-10"
            @click="selectState('All States')"
          >
            All States
          </div>
          <div
            class="text-primary py-2 hover:bg-card-4 pl-4 pr-10"
            v-for="(state, index) in states"
            :key="index"
            @click="selectState(index)"
          >
            {{ state.name }}
          </div>
        </div>
      </div>
      <div class="float-right sm:space-x-4 space-x-2">
        <div
          class="p-3 text-sm sm:px-4 sm:py-3 bg-card-5 rounded inline-block cursor-pointer shadow-md"
        >
          <div
            class="text-primary"
            :class="{ 'pb-2': show_category }"
            @click="show_category = !show_category"
          >
            {{ selected_category }}
            <div class="inline-block sm:pl-2 pl-1">
              <drop-arrow-icon></drop-arrow-icon>
            </div>
          </div>
          <div class="relative">
            <div
              v-if="show_category"
              class="pt-2 absolute w-36 bg-card-5 pl-4 pr-10 -ml-4 border border-card-9 rounded rounded-t-none"
            >
              <div class="text-primary pb-2" @click="selectCategory('Approved')">Approved</div>
              <div class="text-primary pb-2" @click="selectCategory('Pending')">Pending</div>
              <div class="text-primary pb-2" @click="selectCategory('In Progress')">
                In Progress
              </div>
            </div>
          </div>
        </div>
        <div
          class="p-3 text-sm sm:px-4 sm:py-3 bg-card-5 rounded inline-block cursor-pointer shadow-md"
          @click="exportToExcel"
        >
          <a href="javascript:;" class="">Export</a>
          <div class="inline-block sm:pl-2 pl-1">
            <export-icon></export-icon>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Export Modal with Date Range -->
    <div v-if="showExportModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-gray-900">Export Reports</h3>
            <button
              @click="closeExportModal"
              class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div class="mb-6">
            <h4 class="text-lg font-medium text-gray-800 mb-2">Current Filters</h4>
            <div class="bg-gray-50 p-4 rounded-md">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="font-medium text-gray-600">Report Type:</span>
                  <span class="ml-2 text-gray-800">{{ reportTypeConfig.find(config => config.key === activeReportType)?.label || 'Unknown' }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">State:</span>
                  <span class="ml-2 text-gray-800">{{ selected_state }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Status:</span>
                  <span class="ml-2 text-gray-800">{{ selected_category }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h4 class="text-lg font-medium text-gray-800 mb-3">Export Format</h4>
            <div class="grid grid-cols-3 gap-3 mb-6">
              <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50" 
                     :class="{'border-primary bg-primary bg-opacity-5': selectedExportFormat === 'excel'}">
                <input type="radio" v-model="selectedExportFormat" value="excel" class="hidden">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-green-100 rounded flex items-center justify-center mr-3">
                    <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium">Excel</div>
                    <div class="text-xs text-gray-500">.xlsx</div>
                  </div>
                </div>
              </label>
              
              <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                     :class="{'border-primary bg-primary bg-opacity-5': selectedExportFormat === 'csv'}">
                <input type="radio" v-model="selectedExportFormat" value="csv" class="hidden">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                    <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium">CSV</div>
                    <div class="text-xs text-gray-500">.csv</div>
                  </div>
                </div>
              </label>
              
              <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                     :class="{'border-primary bg-primary bg-opacity-5': selectedExportFormat === 'pdf'}">
                <input type="radio" v-model="selectedExportFormat" value="pdf" class="hidden">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-red-100 rounded flex items-center justify-center mr-3">
                    <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium">PDF</div>
                    <div class="text-xs text-gray-500">.pdf</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div class="mb-6">
            <h4 class="text-lg font-medium text-gray-800 mb-3">Date Range (Optional)</h4>
            <p class="text-sm text-gray-600 mb-4">Select a date range to filter the export, or leave empty to export all records.</p>
            
            <date-range-picker
              v-model:startDate="selectedStartDate"
              v-model:endDate="selectedEndDate"
              @rangeChanged="handleDateRangeChange"
            />
            
            <div v-if="selectedStartDate || selectedEndDate" class="mt-4 p-3 bg-blue-50 rounded-md">
              <p class="text-sm text-blue-700">
                <strong>Selected Range:</strong>
                <span v-if="selectedStartDate && selectedEndDate">
                  {{ new Date(selectedStartDate).toLocaleDateString() }} - {{ new Date(selectedEndDate).toLocaleDateString() }}
                </span>
                <span v-else-if="selectedStartDate">
                  From {{ new Date(selectedStartDate).toLocaleDateString() }}
                </span>
                <span v-else-if="selectedEndDate">
                  Until {{ new Date(selectedEndDate).toLocaleDateString() }}
                </span>
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              @click="clearDateRange"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Date Range
            </button>
            
            <div class="flex space-x-3">
              <button
                @click="closeExportModal"
                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                @click="performExport"
                class="px-6 py-2 bg-primary hover:bg-primary-2 text-white rounded-md text-sm font-medium flex items-center"
              >
                <export-icon class="mr-2"></export-icon>
                Export to {{ selectedExportFormat.toUpperCase() }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Stats Cards Section -->
    <div class="px-5 mb-6">
      <report-stats-cards :stats="reportStats" />
    </div>
    
    <div class="px-4 pb-10">
      <abattoir-view
        v-if="abattoir"
        :selected_category="selected_category"
        :selected_state="selected_state"
        :full="full"
        :export_to_excel="export_to_excel"
      ></abattoir-view>
      <outbreak-view
        v-if="outbreak"
        :selected_category="selected_category"
        :selected_state="selected_state"
        :full="full"
        :export_to_excel="export_to_excel"
      ></outbreak-view>
      <vaccination-view
        v-if="vaccination"
        :selected_category="selected_category"
        :selected_state="selected_state"
        :full="full"
        :export_to_excel="export_to_excel"
      ></vaccination-view>
      <suspicion-view
        v-if="suspicion"
        :selected_category="selected_category"
        :selected_state="selected_state"
        :full="full"
        :export_to_excel="export_to_excel"
      ></suspicion-view>
      <veterinarian-view
        v-if="veterinarian"
        :selected_category="selected_category"
        :selected_state="selected_state"
        :full="full"
        :export_to_excel="export_to_excel"
      ></veterinarian-view>
      <laboratory-view
        v-if="laboratory"
        :selected_category="selected_category"
        :selected_state="selected_state"
        :full="full"
        :export_to_excel="export_to_excel"
      ></laboratory-view>
      <aquaculture-view
        v-if="aquaculture"
        :selected_category="selected_category"
        :selected_state="selected_state"
        :full="full"
        :export_to_excel="export_to_excel"
      ></aquaculture-view>
    </div>
  </div>
</template>

<style scoped>
.w-1400 {
  width: 1400px;
}
</style>
