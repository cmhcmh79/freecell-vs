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
  return card.suit === top.suit && getCardValue(card) === getCardValue(top) + 1
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



// 빈 프리셀 개수 계산
export const countEmptyFreeCells = (state: GameState): number => {
  return state.freeCells.filter(cell => cell === null).length
}

// 빈 컬럼 개수 계산
export const countEmptyColumns = (state: GameState): number => {
  return state.columns.filter(col => col.length === 0).length
}

// 한 번에 이동 가능한 최대 카드 수 계산
// 공식: (빈 프리셀 수 + 1) * 2^(빈 컬럼 수)
export const getMaxMovableCards = (state: GameState, toColumn: number): number => {
  const emptyFreeCells = countEmptyFreeCells(state)
  const emptyColumns = countEmptyColumns(state)
  
  // 목적지가 빈 컬럼이면 빈 컬럼 수에서 1을 빼야 함
  const adjustedEmptyColumns = state.columns[toColumn].length === 0 
    ? Math.max(0, emptyColumns - 1) 
    : emptyColumns
  
  return (emptyFreeCells + 1) * Math.pow(2, adjustedEmptyColumns)
}

// 컬럼의 하단부터 연속된 정렬된 카드 시퀀스 찾기
export const getMovableSequence = (column: Card[]): Card[] => {
  if (column.length === 0) return []
  
  const sequence: Card[] = [column[column.length - 1]]
  
  for (let i = column.length - 2; i >= 0; i--) {
    const current = column[i]
    const below = sequence[0]
    
    // 색이 다르고 값이 1 큰지 확인
    if (
      isRed(current.suit) !== isRed(below.suit) &&
      getCardValue(current) === getCardValue(below) + 1
    ) {
      sequence.unshift(current)
    } else {
      break
    }
  }
  
  return sequence
}



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