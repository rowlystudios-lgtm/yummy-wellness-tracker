// src/services/dataLoader.ts
//
// Loads the right regional JSON from GitHub raw URL.
// Falls back through: geo/[REGION].json → geo/US.json → bundled fallback
//
// The global cross-reference (geo/global.json) is loaded separately
// when user taps "See global view" on any claim.

import AsyncStorage from '@react-native-async-storage/async-storage'
import { Region } from './geolocation'

const BASE_URL = 'https://raw.githubusercontent.com/rowlystudios-lgtm/yummy-wellness-tracker/main/data'

export async function loadRegionalData(region: Region) {
  const cacheKey = `regional_data_${region}`
  const cacheTimeKey = `regional_data_${region}_time`

  // Check cache — refresh after 6 hours
  const cached = await AsyncStorage.getItem(cacheKey)
  const cachedTime = await AsyncStorage.getItem(cacheTimeKey)
  if (cached && cachedTime) {
    const age = Date.now() - parseInt(cachedTime)
    if (age < 6 * 60 * 60 * 1000) {
      return JSON.parse(cached)
    }
  }

  // Try regional file first, fall back to US, then global
  const urls = [
    `${BASE_URL}/geo/${region}.json`,
    `${BASE_URL}/geo/US.json`,
    `${BASE_URL}/daily.json`,
  ]

  for (const url of urls) {
    try {
      const resp = await fetch(url + `?t=${Date.now()}`)
      if (!resp.ok) continue
      const data = await resp.json()
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data))
      await AsyncStorage.setItem(cacheTimeKey, Date.now().toString())
      return data
    } catch { continue }
  }

  // Return bundled fallback if all fetches fail
  return require('../data/fallbackClaims').FALLBACK_WEEK
}

export async function loadGlobalComparison() {
  try {
    const resp = await fetch(`${BASE_URL}/geo/global.json?t=${Date.now()}`)
    return await resp.json()
  } catch {
    return null
  }
}
