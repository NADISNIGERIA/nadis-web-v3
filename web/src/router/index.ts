import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import RegisterPage from '../views/Register/RegisterPage.vue'
import AdminDetails from '../views/Register/AdminDetails.vue'
import ReportsPage from '../views/ReportsPage.vue'
import FormsPage from '../views/FormsPage.vue'
import OfficialsPage from '../views/OfficialsPage.vue'
import AgentsPage from '../views/AgentsPage.vue'
import ExportToAuIbar from '../views/Export/ExportToAuIBar.vue'
import ExportToFao from '../views/Export/ExportToFao.vue'
import ExportToNcdc from '../views/Export/ExportToNcdc.vue'
import ExportToDhis from '../views/Export/ExportToDhis.vue'
import ExportToOie from '../views/Export/ExportToOie.vue'
import PrivacyPolicy from '../views/PrivacyPolicy.vue'
import { useUnsubscriber } from '@/stores/unsubscriber'

const metaTags = (title: string, content: string) => {
  return {
    title: title,
    metaTags: [
      {
        name: 'description',
        content: content
      },
      {
        name: 'og:description',
        content: content
      },
      {
        name: 'og:title',
        content: title
      }
    ]
  }
}

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomePage,
      meta: metaTags('Dashboard | NADIS', 'Overview of all reports.')
    },
    {
      path: '/welcome',
      name: 'Register',
      component: RegisterPage,
      meta: metaTags('Register | NADIS', 'Register on NADIS Admin.')
    },
    {
      path: '/reports',
      name: 'Reports',
      component: ReportsPage,
      meta: metaTags('Reports Page | NADIS', 'Lists of all reports.')
    },
    {
      path: '/forms',
      name: 'Forms',
      component: FormsPage,
      meta: metaTags('Forms Page | NADIS', 'Add, View and Delete Forms.')
    },
    {
      path: '/officials',
      name: 'Officials',
      component: OfficialsPage,
      meta: metaTags('Officials | NADIS', 'Add, View or Remove Offcials.')
    },
    {
      path: '/agents',
      name: 'Agents',
      component: AgentsPage,
      meta: metaTags('Agents | NADIS', 'Add, View or Remove Agents.')
    },
    {
      path: '/admin_details',
      name: 'AdminDetails',
      component: AdminDetails,
      meta: metaTags('Registration Continues | NADIS', 'Complete Registration.')
    },
    {
      path: '/interoperability/au_ibar',
      name: 'ExportToAuIbar',
      component: ExportToAuIbar,
      meta: metaTags('Export Au Ibar | NADIS', 'Export Au Ibar.')
    },
    {
      path: '/interoperability/fao',
      name: 'ExportToFao',
      component: ExportToFao,
      meta: metaTags('Export FAO | NADIS', 'Export FAO.')
    },
    {
      path: '/interoperability/ncdc',
      name: 'ExportToNcdc',
      component: ExportToNcdc,
      meta: metaTags('Export NCDC | NADIS', 'Export NCDC.')
    },
    {
      path: '/interoperability/dhis2',
      name: 'ExportToDhis',
      component: ExportToDhis,
      meta: metaTags('Export Dhis | NADIS', 'Export Dhis.')
    },
    {
      path: '/interoperability/oie',
      name: 'ExportToOie',
      component: ExportToOie,
      meta: metaTags('Export Oie | NADIS', 'Export Oie.')
    },
    {
      path: '/privacy_policy',
      name: 'PrivacyPolicy',
      component: PrivacyPolicy,
      meta: metaTags('Privacy Policy | NADIS', 'Privacy Policy of the NADIS App.')
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

// This callback runs before every route change, including on page load.
router.beforeEach((to, from, next) => {
  // This goes through the matched routes from last to first, finding the closest route with a title.
  // e.g., if we have `/some/deep/nested/route` and `/some`, `/deep`, and `/nested` have titles,
  // `/nested`'s will be chosen.
  useUnsubscriber().unsubscribeAllSnapshot()
  const nearestWithTitle = to.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.title)

  // Find the nearest route element with meta tags.
  const nearestWithMeta = to.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.metaTags) as any

  const previousNearestWithMeta = from.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.metaTags)

  // If a route with a title was found, set the document (page) title to that value.
  if (nearestWithTitle) {
    document.title = nearestWithTitle.meta.title as any
  } else if (previousNearestWithMeta) {
    document.title = previousNearestWithMeta.meta.title as any
  }

  // Remove any stale meta tags from the document using the key attribute we set below.
  Array.from(document.querySelectorAll('[data-vue-router-controlled]')).map((el: any) =>
    el.parentNode.removeChild(el)
  )

  // Skip rendering meta tags if there are none.
  if (!nearestWithMeta) return next()

  // Turn the meta tag definitions into actual elements in the head.
  nearestWithMeta.meta.metaTags
    .map((tagDef: any) => {
      const tag = document.createElement('meta')

      Object.keys(tagDef).forEach((key) => {
        tag.setAttribute(key, tagDef[key])
      })

      // We use this to track which meta tags we create so we don't interfere with other ones.
      tag.setAttribute('data-vue-router-controlled', '')

      return tag
    })
    // Add the meta tags to the document head.
    .forEach((tag: any) => document.head.appendChild(tag))

  next()
})

export default router
