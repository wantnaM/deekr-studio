import KeyvStorage from '@kangfenmao/keyv-storage'

import { startAutoSync } from './services/BackupService'
import { startNutstoreAutoSync } from './services/NutstoreService'
import storeSyncService from './services/StoreSyncService'
import store from './store'

function initKeyv() {
  window.keyv = new KeyvStorage()
  window.keyv.init()
}

function initAutoSync() {
  setTimeout(() => {
    const { webdavAutoSync } = store.getState().settings
    const { nutstoreAutoSync } = store.getState().nutstore
    if (webdavAutoSync) {
      startAutoSync()
    }
    if (nutstoreAutoSync) {
      startNutstoreAutoSync()
    }
  }, 8000)
}

function initStoreSync() {
  storeSyncService.subscribe()
}

initKeyv()
initAutoSync()
initStoreSync()
