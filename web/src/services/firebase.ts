import { initializeApp } from 'firebase/app'
// Add the Firebase products that you want to use
import { getAnalytics } from 'firebase/analytics'
import {
  getFirestore,
  // initializeFirestore,
  // persistentLocalCache,
  // persistentMultipleTabManager
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

interface Base {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId: string
}
let firebaseConfig = {} as Base

firebaseConfig = {
    apiKey: 'AIzaSyAlLV0-2w2C-sfhcnLjSHWro-CN3VOwvY4',
    authDomain: 'nadis-test.firebaseapp.com',
    projectId: 'nadis-test',
    storageBucket: 'nadis-test.appspot.com',
    messagingSenderId: '414958316193',
    appId: '1:414958316193:web:8edb412cff074f02049ee0',
    measurementId: ''
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
getAnalytics(app)
// Memory cache is the default if no config is specified.
// initializeFirestore(app, {
//   cacheSizeBytes: CACHE_SIZE_UNLIMITED
// })

// // This is the default behavior if no persistence is specified.
// initializeFirestore(app, { localCache: memoryLocalCache() })

// // Defaults to single-tab persistence if no tab manager is specified.
// initializeFirestore(app, { localCache: persistentLocalCache(/*settings*/ {}) })

// // Same as `initializeFirestore(app, {localCache: persistentLocalCache(/*settings*/{})})`,
// // but more explicit about tab management.
// initializeFirestore(app, {
//   localCache: persistentLocalCache(/*settings*/ { tabManager: persistentSingleTabManager() })
// })

// Use multi-tab IndexedDb persistence.
// initializeFirestore(app, {
//   localCache: persistentLocalCache(/*settings*/ { tabManager: persistentMultipleTabManager() })
// })

// firebase utils
const db = getFirestore(app)

export default {
  db,
  auth
}
