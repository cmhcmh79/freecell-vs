// components/freecell/gameLogic.ts

import type { Card, GameState, Location, Suit } from './types'
import { CARD_VALUE_MAP } from './constants'
import { createDeck } from './deckUtils'

export const isRed = (suit: Suit) => suit === 'H' || suit === 'D'

export const getCardValue = (card: Card): number => {
  return CARD_VALUE_MAP[card.value]
}

export const canPlaceOnColumn = (card: Card, column: Card[]) => {
  if (column.length === 0) return true
  const top = column[column.length - 1]
  return (
    isRed(card.suit) !== isRed(top.suit) &&
    getCardValue(card) === getCardValue(top) - 1
  )
}

export const canPlaceOnFoundation = (card: Card, foundation: Card[]) => {
  if (foundation.length === 0) return card.value === 'A'
  const top = foundation[foundation.length - 1]
  return getCardValue(card) === getCardValue(top) + 1
}

export const checkWin = (state: GameState) =>
  Object.values(state.foundations).every(f => f.length === 13)

export const isSameLocation = (a: Location | null, b: Location): boolean => {
  if (!a) return false
  if (a.type !== b.type) return false

  if (a.type === 'foundation' && b.type === 'foundation') {
    return a.suit === b.suit
  }

  if (
    (a.type === 'column' || a.type === 'freeCell') &&
    (b.type === 'column' || b.type === 'freeCell')
  ) {
    return a.index === b.index
  }

  return false
}

export const getCompletedCount = (game: GameState) =>
  Object.values(game.foundations).reduce((s, f) => s + f.length, 0)

export const initGame = (seed: number): GameState => {
  const deck = createDeck(seed)
  const columns: Card[][] = Array.from({ length: 8 }, () => [])

  deck.forEach((card, i) => {
    columns[i % 8].push(card)
  })

  return {
    columns,
    freeCells: [null, null, null, null],
    foundations: { S: [], H: [], D: [], C: [] },
    moves: 0,
  }
}

export const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}