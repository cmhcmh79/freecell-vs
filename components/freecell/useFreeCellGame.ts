// components/freecell/useFreeCellGame.ts

import { useState, useEffect, useCallback } from 'react'
import type { GameState, Location, Card, Suit } from './types'
import {
  initGame,
  canPlaceOnColumn,
  canPlaceOnFoundation,
  checkWin,
  getCompletedCount,
  getMaxMovableCards,
  getMovableSequence,
  autoMoveToFoundations,
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

  // 이동 처리 (슈퍼무브 지원)
  const makeMove = useCallback(async (from: Location, to: Location) => {
    if (!myGame) return
    if (hasTimer && timeLeft === 0) return

    setHistory(prev => [...prev, structuredClone(myGame)])

    const next = structuredClone(myGame)
    let ok = false

    // 컬럼 → 컬럼: 슈퍼무브 가능
    if (from.type === 'column' && to.type === 'column') {
      const fromCol = next.columns[from.index]
      const toCol = next.columns[to.index]
      
      debugLogger.log(`컬럼 ${from.index} → 컬럼 ${to.index}`)
      debugLogger.log(`출발 컬럼 카드 수: ${fromCol.length}, 도착 컬럼 카드 수: ${toCol.length}`)
      
      // 이동 가능한 연속된 카드 시퀀스 찾기
      const fullSequence = getMovableSequence(fromCol)
      
      debugLogger.log(`전체 시퀀스: ${fullSequence.map(c => c.value + c.suit).join(', ')}`)
      
      // 최대 이동 가능한 카드 수 확인
      const maxMovable = getMaxMovableCards(next, to.index)
      
      debugLogger.log(`전체 시퀀스 ${fullSequence.length}장, 최대 ${maxMovable}장 가능`)
      
      // 이동 가능한 만큼만 시퀀스를 자름
      let candidateSequence = fullSequence.slice(-maxMovable)
      
      // 시퀀스 중에서 실제로 배치 가능한 부분 찾기
      let sequence: Card[] = []
      for (let i = 0; i < candidateSequence.length; i++) {
        const testSequence = candidateSequence.slice(i)
        const topCard = testSequence[0]
        
        if (canPlaceOnColumn(topCard, toCol)) {
          sequence = testSequence
          break
        }
      }
      
      if (sequence.length === 0) {
        debugLogger.log(`슈퍼무브 실패: 배치 가능한 카드 없음`)
        setHistory(prev => prev.slice(0, -1))
        return
      }
      
      debugLogger.log(`실제 이동할 시퀀스: ${sequence.map(c => c.value + c.suit).join(', ')}`)
      
      // 시퀀스 전체를 목적지로 이동
      sequence.forEach(card => toCol.push(card))
      // 원래 컬럼에서 시퀀스 제거
      fromCol.splice(fromCol.length - sequence.length, sequence.length)
      ok = true
      
      debugLogger.log(`이동 성공: ${sequence.length}장 이동`)
    }
    // 프리셀 → 컬럼
    else if (from.type === 'freeCell' && to.type === 'column') {
      const card = next.freeCells[from.index]
      if (card && canPlaceOnColumn(card, next.columns[to.index])) {
        next.columns[to.index].push(card)
        next.freeCells[from.index] = null
        ok = true
      }
    }
    // 컬럼 → 프리셀
    else if (from.type === 'column' && to.type === 'freeCell') {
      const card = next.columns[from.index].at(-1)
      if (card && !next.freeCells[to.index]) {
        next.freeCells[to.index] = card
        next.columns[from.index].pop()
        ok = true
      }
    }
    // 컬럼 → Foundation
    else if (from.type === 'column' && to.type === 'foundation') {
      const card = next.columns[from.index].at(-1)
      if (card && canPlaceOnFoundation(card, next.foundations[to.suit])) {
        next.foundations[to.suit].push(card)
        next.columns[from.index].pop()
        ok = true
      }
    }
    // 프리셀 → Foundation
    else if (from.type === 'freeCell' && to.type === 'foundation') {
      const card = next.freeCells[from.index]
      if (card && canPlaceOnFoundation(card, next.foundations[to.suit])) {
        next.foundations[to.suit].push(card)
        next.freeCells[from.index] = null
        ok = true
      }
    }

    if (!ok) {
      setHistory(prev => prev.slice(0, -1))
      return
    }

    next.moves++
    
    // 자동으로 Foundation에 올릴 수 있는 카드들 이동
    const afterAuto = autoMoveToFoundations(next)
    setMyGame(afterAuto)

    await broadcast(afterAuto)

    if (checkWin(afterAuto)) onWin(true)
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