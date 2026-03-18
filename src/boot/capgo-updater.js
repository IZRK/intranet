import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

const VERSION_URL = 'https://izrk.github.io/intranet/version.txt'
const BUNDLE_URL = 'https://izrk.github.io/intranet/www.zip'

function withCacheBust(url) {
  const nextUrl = new URL(url)
  nextUrl.searchParams.set('_ts', String(Date.now()))
  return nextUrl.toString()
}

function parseVersionParts(version) {
  const match = String(version || '').trim().match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) {
    return null
  }

  return match.slice(1).map(Number)
}

function isServerVersionNewer(currentVersion, serverVersion) {
  const current = parseVersionParts(currentVersion)
  const next = parseVersionParts(serverVersion)

  if (!current || !next) {
    return false
  }

  for (let index = 0; index < next.length; index += 1) {
    if (next[index] > current[index]) {
      return true
    }

    if (next[index] < current[index]) {
      return false
    }
  }

  return false
}

export default defineBoot(async () => {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  console.log('[capgo-updater] boot start', {
    href: window.location.href,
    native: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
  })

  await CapacitorUpdater.notifyAppReady().catch((error) => {
    console.info('Capgo updater notifyAppReady skipped', error?.message || error)
  })

  const localVersion = process.env.BUILD_VERSION

  try {
    const response = await axios.get(withCacheBust(VERSION_URL), {
      responseType: 'text',
    })
    const serverVersion = String(response.data || '').trim()

    console.info('Capgo updater version check', {
      localVersion,
      serverVersion,
    })

    if (!isServerVersionNewer(localVersion, serverVersion)) {
      console.info('Capgo app is up to date')
      return
    }

    console.info(`Capgo update available: ${serverVersion} (local: ${localVersion})`)
    const bundle = await CapacitorUpdater.download({
      url: BUNDLE_URL,
      version: serverVersion,
    })

    if (bundle?.id) {
      await CapacitorUpdater.next({ id: bundle.id })
      console.info(`Capgo update scheduled: ${serverVersion}`)
    }
  } catch (error) {
    console.info('Capgo manual update check failed', error?.message || error)
  }
})
