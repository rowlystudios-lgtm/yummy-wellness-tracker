// src/theme/colors.ts
// Yummy brand colour palette

export const colors = {
  // Backgrounds
  cream:      '#FAF6EE',
  warmWhite:  '#FFFFFF',
  sand:       '#F5EDD9',

  // Text
  espresso:   '#1E1812',
  warmGrey:   '#4A4240',
  muted:      '#9A918E',
  pale:       '#C0B8B0',

  // Score colours
  teal:       '#3A9E94',  // true / well supported (score 85-100)
  tealLight:  '#E8F7F6',
  peach:      '#E8A87C',  // mixed / nuanced (score 40-84)
  peachLight: '#FEF4E8',
  blushDeep:  '#6B1E2E',  // false / misleading (score 0-39)
  blushLight: '#F7E8EB',

  // Accents
  caramel:    '#9A7A50',
  border:     'rgba(107,30,46,0.08)',
} as const

export type ColorKey = keyof typeof colors
