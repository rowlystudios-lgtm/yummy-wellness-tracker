// src/data/fallbackClaims.ts
//
// Bundled fallback data — shown when all network fetches fail.
// Updated manually when the live data pipeline is not yet running.
// This ensures the app always shows something meaningful on first open.

export const FALLBACK_WEEK = {
  region: 'US',
  language: 'en',
  published: '2026-03-29T06:00:00Z',
  next_refresh: '2026-03-30T11:00:00Z',
  week_headline: 'Seed oil myths dominate feeds while fermented food science goes mainstream',
  stats: {
    total_claims_tracked: 0,
    misleading_pct: '—',
    true_pct: '—',
    most_active_region: 'US',
    most_contested_claim: 'Seed oils and inflammation',
  },
  top10: [
    {
      rank: 1,
      score: 12,
      score_type: 'false',
      claim_tag: 'Conspiracy framing',
      authority_stance: 'CDC data unambiguous — raw milk is a public health risk',
      claim_display: 'Raw milk is dramatically healthier than pasteurised',
      verdict: 'No credible evidence supports nutritional superiority of raw milk over pasteurised. The CDC documents 840 times more illness outbreaks linked to raw milk. What you gain in unverified "probiotics" you offset with genuine pathogen exposure.',
      verdict_highlight: '840 times more illness risk',
      brit_take: "We have unpasteurised cheese traditions back home — and we'd never drink the raw milk either. Different product, different risk.",
      score_label: 'Misleading',
      sources: ['CDC 2023', 'EFSA Food Safety'],
      platform: 'Reddit',
      url: '',
      hours_ago: 8,
      global_cooking: {
        ingredient: 'Milk / dairy',
        summary: 'Pasteurisation laws differ dramatically — France permits raw milk cheeses, Japan bans raw milk sale entirely, US allows it in some states',
        regional_uses: [
          {
            region: 'France',
            flag: '🇫🇷',
            traditional_use: 'Raw milk used in aged cheeses like Comté and Camembert — the ageing process reduces but does not eliminate pathogen risk',
            health_implication: 'Long ageing reduces but does not eliminate pathogens — ANSES distinguishes aged cheese from drinking raw milk',
            example_dish: 'Camembert de Normandie (AOP) — must use raw milk by law',
          },
          {
            region: 'Japan',
            flag: '🇯🇵',
            traditional_use: 'Dairy is not a traditional Japanese food — milk culture arrived post-1868. Raw milk sale is completely prohibited.',
            health_implication: "Japan's near-zero raw milk culture means this debate is largely irrelevant there — the health risk context is very different",
            example_dish: 'Pasteurised milk used in yogurt and processed dairy only',
          },
          {
            region: 'United States',
            flag: '🇺🇸',
            traditional_use: 'Raw milk legal in some states, illegal in others — creates a patchwork of access and inconsistent safety messaging',
            health_implication: 'CDC records show raw milk causes disproportionate illness outbreaks relative to consumption volume',
            example_dish: "Raw milk consumed directly or as 'artisan' cheese",
          },
          {
            region: 'Germany',
            flag: '🇩🇪',
            traditional_use: 'Vorzugsmilch (premium raw milk) is legal but tightly regulated — sold only at farm gates with strict hygiene controls',
            health_implication: 'BfR warns even compliant raw milk carries listeria and campylobacter risk for vulnerable groups',
            example_dish: 'Vorzugsmilch — sold direct from farm, not supermarkets',
          },
        ],
        manufacturing_note: 'Pasteurisation temperature and duration vary between countries. HTST (High Temperature Short Time) used in US and UK. UHT (Ultra-High Temperature) common in France and Germany — extends shelf life but slightly alters nutritional profile. These manufacturing differences are real but minor compared to the pathogen risk difference between raw and pasteurised.',
      },
      translations: {
        en: {
          claim_display: 'Raw milk is dramatically healthier than pasteurised',
          verdict: 'No credible evidence supports nutritional superiority of raw milk. The CDC documents 840 times more illness outbreaks. What you gain in alleged probiotics you offset with real pathogen exposure.',
          verdict_highlight: '840 times more illness risk',
          brit_take: "We have unpasteurised cheese traditions back home — and we'd never drink the raw milk either.",
          sources: ['CDC 2023', 'EFSA'],
          score_label: 'Misleading',
        },
        de: {
          claim_display: 'Rohmilch ist wesentlich gesünder als pasteurisierte Milch',
          verdict: 'Es gibt keine glaubwürdigen Belege für ernährungsphysiologische Vorteile von Rohmilch. Das BfR dokumentiert erhebliche Krankheitserregungsrisiken.',
          verdict_highlight: '840-mal höheres Krankheitsrisiko',
          brit_take: 'Wir kennen unbehandelte Käsetraditionen von zu Hause — aber die Rohmilch trinkt dort auch niemand.',
          sources: ['BfR 2023', 'EFSA Lebensmittelsicherheit'],
          score_label: 'Irreführend',
        },
      },
      regional_scores: {
        US: { score: 11, authority_stance: 'CDC data unambiguous — raw milk is a public health risk' },
        GB: { score: 14, authority_stance: 'FSA strongly advises against raw milk consumption' },
        DE: { score: 9,  authority_stance: 'BfR: no evidence of benefit, significant pathogen risk' },
        FR: { score: 18, authority_stance: 'ANSES: raw milk acceptable only in aged cheeses' },
        JP: { score: 8,  authority_stance: 'Raw milk sale prohibited in Japan since 1951' },
        AU: { score: 10, authority_stance: 'FSANZ advises strongly against raw milk consumption' },
        IN: { score: 22, authority_stance: 'FSSAI permits raw milk but urban distribution is regulated' },
      },
    },
  ],
}
