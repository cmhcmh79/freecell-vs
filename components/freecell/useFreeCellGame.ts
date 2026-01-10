// components/freecell/useFreeCellGame.ts

import { useState, useEffect, useCallback } from 'react'
import type { GameState, Location, Card, Suit } from './types'
import {
  initGame,
  canPlaceOnColumn,
  canPlaceOnFoundation,
  checkWin,
  getCompletedCount,
} from './gameLogic'
import { debugLogger } from '@/utils/debugLogger'
import { CARD_VALUES, SUITS } from './constants'

type UseFreeCellGameProps = {
  gameSeed: number
  isMultiplayer: boolean
  hasTimer: boolean
  timeLeft: number
  isPlayer1: boolean
  onWin: (isMe: boolean) => void
  broadcast: (gameState: GameState) => Promise<void>
}

export const useFreeCellGame = ({
  gameSeed,
  isMultiplayer,
  hasTimer,
  timeLeft,
  isPlayer1,
  onWin,
  broadcast,
}: UseFreeCellGameProps) => {
  const [myGame, setMyGame] = useState<GameState | null>(null)
  const [opponentGame, setOpponentGame] = useState<GameState | null>(null)
  const [selected, setSelected] = useState<Location | null>(null)
  const [history, setHistory] = useState<GameState[]>([])

  // 게임 초기화
  useEffect(() => {
    const state = initGame(gameSeed)
    setMyGame(state)

    if (isMultiplayer) {
      setOpponentGame(JSON.parse(JSON.stringify(state)))
    }
  }, [gameSeed, isMultiplayer])

  // 타임오버 처리
  useEffect(() => {
    if (!hasTimer || timeLeft > 0 || !myGame || !opponentGame) return

    debugLogger.log('handleTimeOver: 시간 종료!')

    const myScore = getCompletedCount(myGame)
    const oppScore = getCompletedCount(opponentGame)

    debugLogger.log(`내 점수: ${myScore}, 상대 점수: ${oppScore}`)
    
    if (myScore > oppScore) {
      debugLogger.log('내가 승리!')
      onWin(true)
    } else if (myScore < oppScore) {
      debugLogger.log('상대가 승리!')
      onWin(false)
    } else {
      debugLogger.log('무승부 - Player1 우선')
      onWin(isPlayer1)
    }
  }, [timeLeft, myGame, opponentGame, hasTimer, isPlayer1, onWin])

  // 이동 처리
  const makeMove = useCallback(async (from: Location, to: Location) => {
    if (!myGame) return
    if (hasTimer && timeLeft === 0) return

    setHistory(prev => [...prev, structuredClone(myGame)])

    const next = structuredClone(myGame)
    let card: Card | null = null

    if (from.type === 'column') card = next.columns[from.index].at(-1) ?? null
    else if (from.type === 'freeCell') card = next.freeCells[from.index]

    if (!card) return

    let ok = false

    if (to.type === 'column' && canPlaceOnColumn(card, next.columns[to.index])) {
      next.columns[to.index].push(card)
      ok = true
    }

    if (to.type === 'freeCell' && !next.freeCells[to.index]) {
      next.freeCells[to.index] = card
      ok = true
    }

    if (to.type === 'foundation' && canPlaceOnFoundation(card, next.foundations[to.suit])) {
      next.foundations[to.suit].push(card)
      ok = true
    }

    if (!ok) {
      setHistory(prev => prev.slice(0, -1))
      return
    }

    if (from.type === 'column') next.columns[from.index].pop()
    if (from.type === 'freeCell') next.freeCells[from.index] = null

    next.moves++
    setMyGame(next)

    await broadcast(next)

    if (checkWin(next)) onWin(true)
  }, [myGame, hasTimer, timeLeft, broadcast, onWin])

  const handleClick = useCallback((loc: Location) => {
    if (!selected) {
      setSelected(loc)
    } else {
      makeMove(selected, loc)
      setSelected(null)
    }
  }, [selected, makeMove])

  // 자동 승리
  const autoWin = useCallback(async () => {
    if (!myGame) return

    const next = structuredClone(myGame)

    const allCards: Card[] = []
    next.columns.forEach(col => allCards.push(...col))
    next.freeCells.forEach(card => card && allCards.push(card))

    next.foundations = { S: [], H: [], D: [], C: [] }

    CARD_VALUES.forEach(val => {
      SUITS.forEach(suit => {
        const card = allCards.find(c => c.suit === suit && c.value === val)
        if (card) next.foundations[suit as Suit].push(card)
      })
    })

    next.columns = Array.from({ length: 8 }, () => [])
    next.freeCells = [null, null, null, null]

    setMyGame(next)
    await broadcast(next)
    onWin(true)
  }, [myGame, broadcast, onWin])

  // 포기
  const surrender = useCallback(() => {
    if (confirm('포기하시겠습니까?')) {
      onWin(false)
    }
  }, [onWin])

  // 되돌리기
  const undo = useCallback(() => {
    if (history.length === 0) {
      alert('되돌릴 수 없습니다.')
      return
    }

    const prev = history[history.length - 1]
    setMyGame(prev)
    setHistory(prev => prev.slice(0, -1))
  }, [history])

  // 리셋
  const reset = useCallback(async () => {
    if (!confirm('게임을 리셋하시겠습니까?')) return

    const state = initGame(gameSeed)
    setMyGame(state)
    setHistory([])
    setSelected(null)

    await broadcast(state)
  }, [gameSeed, broadcast])

  return {
    myGame,
    opponentGame,
    selected,
    history,
    handleClick,
    autoWin,
    surrender,
    undo,
    reset,
    setOpponentGame,
  }
}