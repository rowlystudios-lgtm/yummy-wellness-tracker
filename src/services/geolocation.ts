// src/services/geolocation.ts
//
// Three-layer geolocation strategy:
// 1. Device GPS (most accurate — user must grant permission)
// 2. IP-based geolocation (fallback — no permission needed)
// 3. Device locale (last resort — infers from language setting)
//
// The country code drives:
//   a) Which geo/[COUNTRY].json file to load
//   b) Which language to display by default
//   c) Which claims appear first (localised debates)

import * as Location from 'expo-location'
import { NativeModules, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const SUPPORTED_REGIONS = ['US','GB','DE','JP','FR','BR','AU','IN','KR','ES'] as const
export type Region = typeof SUPPORTED_REGIONS[number]

export const REGION_LANGUAGE: Record<string, string> = {
  US:'en', GB:'en', AU:'en',
  DE:'de', AT:'de', CH:'de',
  FR:'fr', BE:'fr',
  JP:'ja',
  BR:'pt', PT:'pt',
  ES:'es', MX:'es', AR:'es', CO:'es',
  KR:'ko',
  IN:'hi',
}

// Get device locale (en-US → 'en', de-DE → 'de', ja-JP → 'ja')
function getDeviceLocale(): string {
  const locale = NativeModules.I18nManager?.localeIdentifier
    || (Platform.OS === 'ios'
      ? NativeModules.SettingsManager?.settings?.AppleLocale
      : 'en_US')
  return (locale || 'en').substring(0, 2).toLowerCase()
}

// Infer region from device locale as last resort
function inferRegionFromLocale(): Region {
  const locale = getDeviceLocale()
  const map: Record<string, Region> = {
    en:'US', de:'DE', fr:'FR', ja:'JP',
    pt:'BR', es:'ES', ko:'KR', hi:'IN'
  }
  return map[locale] || 'US'
}

// IP-based geolocation — free, no key, no permission needed
async function getRegionFromIP(): Promise<Region> {
  try {
    const resp = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) })
    const data = await resp.json()
    const code = data.country_code as Region
    return SUPPORTED_REGIONS.includes(code) ? code : inferRegionFromLocale()
  } catch {
    return inferRegionFromLocale()
  }
}

export async function getUserRegion(): Promise<{ region: Region; language: string; method: string }> {
  // Check cache first — don't re-geolocate every app open
  const cached = await AsyncStorage.getItem('user_region')
  if (cached) {
    const { region, language, cachedAt } = JSON.parse(cached)
    // Cache valid for 7 days
    if (Date.now() - cachedAt < 7 * 24 * 60 * 60 * 1000) {
      return { region, language, method: 'cache' }
    }
  }

  let region: Region
  let method: string

  // Try GPS first
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })
      const code = geocode[0]?.isoCountryCode as Region
      region = SUPPORTED_REGIONS.includes(code) ? code : await getRegionFromIP()
      method = 'gps'
    } else {
      region = await getRegionFromIP()
      method = 'ip'
    }
  } catch {
    region = await getRegionFromIP()
    method = 'ip'
  }

  // Language: device locale overrides region default if supported
  const deviceLocale = getDeviceLocale()
  const regionLanguage = REGION_LANGUAGE[region] || 'en'
  const language = Object.values(REGION_LANGUAGE).includes(deviceLocale)
    ? deviceLocale
    : regionLanguage

  // Cache result
  await AsyncStorage.setItem('user_region', JSON.stringify({
    region, language, method, cachedAt: Date.now()
  }))

  return { region, language, method }
}
