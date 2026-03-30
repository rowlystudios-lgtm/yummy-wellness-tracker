// src/App.tsx
//
// On startup:
// 1. Get user's region via geolocation
// 2. Load regional claims in user's language
// 3. Show localised home screen
// 4. Global view available on any claim via tap

import React, { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView, Modal
} from 'react-native'
import { getUserRegion, Region } from './services/geolocation'
import { loadRegionalData, loadGlobalComparison } from './services/dataLoader'
import { GlobalView } from './components/GlobalView'
import { colors } from './theme/colors'

export function App() {
  const [region, setRegion]             = useState<Region>('US')
  const [language, setLanguage]         = useState('en')
  const [regionalData, setRegionalData] = useState<any>(null)
  const [loading, setLoading]           = useState(true)
  const [selectedClaim, setSelectedClaim] = useState<any>(null)
  const [globalData, setGlobalData]     = useState<any>(null)
  const [showGlobal, setShowGlobal]     = useState(false)

  useEffect(() => {
    async function init() {
      try {
        // 1. Detect where user is + their language
        const { region: r, language: l } = await getUserRegion()
        setRegion(r)
        setLanguage(l)

        // 2. Load their regional claims
        const data = await loadRegionalData(r)
        setRegionalData(data)

      } catch {
        // Graceful fallback — always show something
        const data = await loadRegionalData('US')
        setRegionalData(data)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function handleGlobalView(claim: any) {
    setSelectedClaim(claim)
    if (!globalData) {
      const global = await loadGlobalComparison()
      setGlobalData(global)
    }
    setShowGlobal(true)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={styles.loadingText}>Finding your local health debates…</Text>
      </SafeAreaView>
    )
  }

  const claims = regionalData?.top10 || []
  const headline = regionalData?.week_headline || ''

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>yummy</Text>
        <Text style={styles.tagline}>{headline}</Text>
      </View>

      {/* Claims list */}
      <FlatList
        data={claims}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ClaimCard
            claim={item}
            language={language}
            onGlobalView={() => handleGlobalView(item)}
          />
        )}
      />

      {/* Global view modal */}
      <Modal
        visible={showGlobal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGlobal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Global view</Text>
            <TouchableOpacity onPress={() => setShowGlobal(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          {selectedClaim && (
            <GlobalView claim={selectedClaim} userLanguage={language} />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

function ClaimCard({ claim, language, onGlobalView }: {
  claim: any
  language: string
  onGlobalView: () => void
}) {
  const score = claim.score || 0
  const scoreColor = score >= 85 ? colors.teal
                   : score >= 40 ? colors.peach
                   : colors.blushDeep

  const verdict = claim.verdict || ''
  const highlight = claim.verdict_highlight || ''
  const claimText = claim.claim_display || ''
  const britTake = claim.brit_take || ''
  const tag = claim.claim_tag || ''

  return (
    <View style={styles.card}>
      {/* Score + tag row */}
      <View style={styles.cardTop}>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '18' }]}>
          <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
          <Text style={[styles.scoreLabel, { color: scoreColor }]}>
            {claim.score_label || ''}
          </Text>
        </View>
        <Text style={styles.claimTag}>{tag}</Text>
      </View>

      {/* Claim text */}
      <Text style={styles.claimText}>{claimText}</Text>

      {/* Verdict */}
      <Text style={styles.verdict}>{verdict}</Text>

      {/* Brit Take */}
      {britTake ? (
        <View style={styles.britTakeBox}>
          <Text style={styles.britTakeLabel}>Brit take</Text>
          <Text style={styles.britTakeText}>{britTake}</Text>
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.platform}>{claim.platform}</Text>
        <TouchableOpacity style={styles.globalBtn} onPress={onGlobalView}>
          <Text style={styles.globalBtnText}>🌍 Global view</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FAF6EE' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF6EE' },
  loadingText:      { marginTop: 12, fontSize: 14, color: '#9A918E', fontWeight: '300' },
  header:           { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  logo:             { fontSize: 28, fontWeight: '700', color: '#1E1812', letterSpacing: -0.5 },
  tagline:          { fontSize: 13, color: '#9A918E', fontWeight: '300', marginTop: 4, lineHeight: 18 },
  list:             { paddingHorizontal: 16, paddingBottom: 32 },
  card:             { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(107,30,46,0.07)' },
  cardTop:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  scoreBadge:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  scoreNum:         { fontSize: 18, fontWeight: '600' },
  scoreLabel:       { fontSize: 11, fontWeight: '500' },
  claimTag:         { fontSize: 11, color: '#9A918E', fontWeight: '400' },
  claimText:        { fontSize: 15, color: '#1E1812', fontWeight: '500', lineHeight: 22, marginBottom: 10 },
  verdict:          { fontSize: 13, color: '#4A4240', lineHeight: 20, fontWeight: '300', marginBottom: 12 },
  britTakeBox:      { backgroundColor: '#F5EDD9', borderRadius: 10, padding: 12, marginBottom: 12 },
  britTakeLabel:    { fontSize: 10, color: '#9A7A50', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  britTakeText:     { fontSize: 13, color: '#6B4E2A', lineHeight: 19, fontWeight: '300' },
  cardFooter:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  platform:         { fontSize: 11, color: '#C0B8B0', fontWeight: '400' },
  globalBtn:        { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#E8F7F6', borderRadius: 20 },
  globalBtnText:    { fontSize: 12, color: '#3A9E94', fontWeight: '500' },
  modalContainer:   { flex: 1, backgroundColor: '#FAF6EE' },
  modalHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(107,30,46,0.08)' },
  modalTitle:       { fontSize: 17, fontWeight: '600', color: '#1E1812' },
  modalClose:       { fontSize: 16, color: '#3A9E94', fontWeight: '500' },
})
