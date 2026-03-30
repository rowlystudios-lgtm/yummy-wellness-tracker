// src/components/GlobalView.tsx
//
// The "See global view" panel that appears when user taps any claim.
// Shows:
//   1. How each country scores the same claim
//   2. How the ingredient is used in different culinary traditions
//   3. Manufacturing differences if relevant
//   4. The user can switch between country views to read in each language

import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'

interface GlobalViewProps {
  claim: any  // scored claim with regional_scores + global_cooking + translations
  userLanguage: string
}

export function GlobalView({ claim, userLanguage }: GlobalViewProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'scores' | 'cooking'>('scores')

  const regions = Object.entries(claim.regional_scores || {})
  const cooking  = claim.global_cooking || {}
  const uses     = cooking.regional_uses || []

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Toggle: Regional scores vs Cooking traditions */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, viewMode === 'scores' && styles.modeBtnActive]}
          onPress={() => setViewMode('scores')}
        >
          <Text style={[styles.modeBtnText, viewMode === 'scores' && styles.modeBtnTextActive]}>
            Country scores
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, viewMode === 'cooking' && styles.modeBtnActive]}
          onPress={() => setViewMode('cooking')}
        >
          <Text style={[styles.modeBtnText, viewMode === 'cooking' && styles.modeBtnTextActive]}>
            In the kitchen
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'scores' && (
        <View>
          <Text style={styles.sectionTitle}>
            How {regions.length} countries score this claim
          </Text>

          {regions.map(([region, data]: [string, any]) => {
            const score = data.score || claim.score
            const scoreColor = score >= 85 ? colors.teal
                             : score >= 40 ? colors.peach
                             : colors.blushDeep

            return (
              <TouchableOpacity
                key={region}
                style={[styles.regionRow,
                  selectedRegion === region && styles.regionRowSelected]}
                onPress={() => setSelectedRegion(
                  selectedRegion === region ? null : region
                )}
              >
                <View style={styles.regionLeft}>
                  <Text style={styles.regionFlag}>
                    {getFlag(region)}
                  </Text>
                  <Text style={styles.regionName}>{getRegionName(region)}</Text>
                </View>
                <View style={styles.regionRight}>
                  <Text style={[styles.regionScore, { color: scoreColor }]}>
                    {score}/100
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}

          {/* Expanded region view — shows authority stance */}
          {selectedRegion && claim.regional_scores?.[selectedRegion] && (
            <View style={styles.expandedRegion}>
              <Text style={styles.authorityStance}>
                {claim.regional_scores[selectedRegion].authority_stance}
              </Text>
            </View>
          )}
        </View>
      )}

      {viewMode === 'cooking' && cooking.ingredient && (
        <View>
          <Text style={styles.cookingIngredient}>
            {cooking.ingredient}
          </Text>
          <Text style={styles.cookingSummary}>
            {cooking.summary}
          </Text>

          {uses.map((use: any, i: number) => (
            <View key={i} style={styles.cookingCard}>
              <View style={styles.cookingHeader}>
                <Text style={styles.cookingFlag}>{use.flag}</Text>
                <Text style={styles.cookingRegion}>{use.region}</Text>
              </View>
              <Text style={styles.cookingTraditional}>
                {use.traditional_use}
              </Text>
              <Text style={styles.cookingDish}>
                e.g. {use.example_dish}
              </Text>
              {use.health_implication && (
                <View style={styles.cookingImplication}>
                  <Text style={styles.cookingImplicationText}>
                    {use.health_implication}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {cooking.manufacturing_note && (
            <View style={styles.manufacturingNote}>
              <Text style={styles.manufacturingLabel}>
                Manufacturing difference
              </Text>
              <Text style={styles.manufacturingText}>
                {cooking.manufacturing_note}
              </Text>
            </View>
          )}
        </View>
      )}

    </ScrollView>
  )
}

function getFlag(region: string): string {
  const flags: Record<string, string> = {
    US:'🇺🇸', GB:'🇬🇧', DE:'🇩🇪', JP:'🇯🇵',
    FR:'🇫🇷', BR:'🇧🇷', AU:'🇦🇺', IN:'🇮🇳', KR:'🇰🇷', ES:'🇪🇸'
  }
  return flags[region] || '🌍'
}

function getRegionName(region: string): string {
  const names: Record<string, string> = {
    US:'United States', GB:'United Kingdom', DE:'Germany', JP:'Japan',
    FR:'France', BR:'Brazil', AU:'Australia', IN:'India', KR:'South Korea', ES:'Spain'
  }
  return names[region] || region
}

const styles = StyleSheet.create({
  container:              { flex: 1 },
  modeToggle:             { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  modeBtn:                { flex: 1, padding: 10, borderRadius: 20, backgroundColor: '#F5EDD9', alignItems: 'center' },
  modeBtnActive:          { backgroundColor: '#1E1812' },
  modeBtnText:            { fontSize: 13, color: '#9A918E', fontWeight: '400' },
  modeBtnTextActive:      { color: '#FFFFFF', fontWeight: '500' },
  sectionTitle:           { fontSize: 13, color: '#9A918E', fontWeight: '300', paddingHorizontal: 16, marginBottom: 10 },
  regionRow:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(107,30,46,0.08)' },
  regionRowSelected:      { backgroundColor: '#E8F7F6' },
  regionLeft:             { flexDirection: 'row', alignItems: 'center', gap: 10 },
  regionFlag:             { fontSize: 20 },
  regionName:             { fontSize: 14, color: '#1E1812', fontWeight: '400' },
  regionRight:            {},
  regionScore:            { fontSize: 16, fontWeight: '500' },
  expandedRegion:         { padding: 14, margin: 16, backgroundColor: '#E8F7F6', borderRadius: 12 },
  authorityStance:        { fontSize: 13, color: '#3A9E94', lineHeight: 20, fontWeight: '300' },
  cookingIngredient:      { fontSize: 18, color: '#1E1812', fontWeight: '500', paddingHorizontal: 16, marginBottom: 6 },
  cookingSummary:         { fontSize: 13, color: '#9A918E', lineHeight: 20, fontWeight: '300', paddingHorizontal: 16, marginBottom: 16 },
  cookingCard:            { margin: 16, marginTop: 0, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(91,191,181,0.15)' },
  cookingHeader:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cookingFlag:            { fontSize: 20 },
  cookingRegion:          { fontSize: 14, fontWeight: '500', color: '#1E1812' },
  cookingTraditional:     { fontSize: 13, color: '#4A4240', lineHeight: 20, fontWeight: '300', marginBottom: 6 },
  cookingDish:            { fontSize: 12, color: '#9A918E', fontStyle: 'italic', marginBottom: 8 },
  cookingImplication:     { backgroundColor: '#E8F7F6', borderRadius: 8, padding: 10 },
  cookingImplicationText: { fontSize: 12, color: '#3A9E94', lineHeight: 18, fontWeight: '300' },
  manufacturingNote:      { margin: 16, padding: 14, backgroundColor: '#FEF4E8', borderLeftWidth: 3, borderLeftColor: '#E8A87C', borderRadius: 8 },
  manufacturingLabel:     { fontSize: 10, color: '#E8A87C', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  manufacturingText:      { fontSize: 12, color: '#8A5020', lineHeight: 18, fontWeight: '300' },
})
