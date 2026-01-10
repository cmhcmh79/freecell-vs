

// components/freecell/deckUtils.ts

import type { Card, Suit, Value } from './types'
import { SUITS, CARD_VALUES } from './constants'


export  const createDeck = (seed: number): Card[] => {

    const deck: Card[] = []

    SUITS.forEach(s => CARD_VALUES.forEach(v => deck.push({ suit: s, value: v })))

    let r = seed
    for (let i = deck.length - 1; i > 0; i--) {
      r = (r * 9301 + 49297) % 233280
      const j = r % (i + 1)
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }

    return deck
  }