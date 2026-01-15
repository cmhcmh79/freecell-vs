// components/freecell/constants.ts

export const CARD_SKIN = 'v3'

export const MATCH_TIME = 5 * 60 // 5분

export const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const

export const SUITS = ['S', 'H', 'D', 'C'] as const

export const CARD_VALUE_MAP = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
} as const