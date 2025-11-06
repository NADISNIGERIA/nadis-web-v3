// Vuetify plugin configuration
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import * as labsComponents from 'vuetify/labs/components'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Create Vuetify instance
export default createVuetify({
  components: {
    ...components,
    ...labsComponents // Include VDataTableServer from labs
  },
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107'
        }
      }
    }
  },
  defaults: {
    VDataTable: {
      fixedHeader: true,
      noDataText: 'No data available',
      itemsPerPageText: 'Rows per page:',
      itemsPerPageOptions: [
        { value: 10, title: '10' },
        { value: 20, title: '20' },
        { value: 50, title: '50' },
        { value: 100, title: '100' },
        { value: -1, title: 'All' }
      ]
    }
  }
})
