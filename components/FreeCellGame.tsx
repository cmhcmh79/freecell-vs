'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import './FreeCellGame.css'
import DebugLogPanel from '@/components/DebugLogPanel'
import { debugLogger } from '@/utils/debugLogger'
import { IS_DEV } from '@/config/env'


/* =====================
   Types
===================== */

type Suit = 'S' | 'H' | 'D' | 'C'
type Value =
  | 'A' | '2' | '3' | '4' | '5'
  | '6' | '7' | '8' | '9' | '10'
  | 'J' | 'Q' | 'K'

type Card = {
  suit: Suit
  value: Value
}

type GameState = {
  columns: Card[][]
  freeCells: (Card | null)[]
  foundations: Record<Suit, Card[]>
  moves: number
}

type Location =
  | { type: 'column'; index: number }
  | { type: 'freeCell'; index: number }
  | { type: 'foundation'; suit: Suit }

type Props = {
  roomCode: string
  gameSeed: number
  isPlayer1: boolean
  onWin: (isMe: boolean) => void
}

/* =====================
   Helpers
===================== */

const isRed = (suit: Suit) => suit === 'H' || suit === 'D'

const getCardValue = (card: Card): number => {
  const map: Record<Value, number> = {
    A: 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    J: 11, Q: 12, K: 13,
  }
  return map[card.value]
}

const canPlaceOnColumn = (card: Card, column: Card[]) => {
  if (column.length === 0) return true
  const top = column[column.length - 1]
  return (
    isRed(card.suit) !== isRed(top.suit) &&
    getCardValue(card) === getCardValue(top) - 1
  )
}

const canPlaceOnFoundation = (card: Card, foundation: Card[]) => {
  if (foundation.length === 0) return card.value === 'A'
  const top = foundation[foundation.length - 1]
  return getCardValue(card) === getCardValue(top) + 1
}

const checkWin = (state: GameState) =>
  Object.values(state.foundations).every(f => f.length === 13)

const isSameLocation = (a: Location | null, b: Location): boolean => {
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

/* =====================
   Component
===================== */

export default function FreeCellGame(props: Props) {
  const { roomCode, gameSeed, isPlayer1, onWin } = props

  const [myGame, setMyGame] = useState<GameState | null>(null)
  const [opponentGame, setOpponentGame] = useState<GameState | null>(null)
  const [selected, setSelected] = useState<Location | null>(null)
  const [history, setHistory] = useState<GameState[]>([])

  const channelRef = useRef<RealtimeChannel | null>(null)

  /* =====================
     Deck / Init
  ===================== */

  const createDeck = (seed: number): Card[] => {
    const suits: Suit[] = ['S', 'H', 'D', 'C']
    const values: Value[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const deck: Card[] = []

    suits.forEach(s => values.forEach(v => deck.push({ suit: s, value: v })))

    let r = seed
    for (let i = deck.length - 1; i > 0; i--) {
      r = (r * 9301 + 49297) % 233280
      const j = r % (i + 1)
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }

    return deck
  }

  const initGame = (seed: number): GameState => {
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

  /* =====================
     Init / Realtime
  ===================== */

  useEffect(() => {
    const state = initGame(gameSeed)
    setMyGame(state)
    setOpponentGame(JSON.parse(JSON.stringify(state)))

    const channel = supabase.channel(`game-${roomCode}`)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        const expectedId = isPlayer1 ? 'player2' : 'player1'
        if (payload.playerId !== expectedId) return
        setOpponentGame(payload.gameState)
        if (checkWin(payload.gameState)) onWin(false)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [gameSeed, roomCode, isPlayer1])





  /* =====================
     Move
  ===================== */

  const makeMove = async (from: Location, to: Location) => {
    if (!myGame) return

    // 히스토리 저장
    setHistory([...history, structuredClone(myGame)])

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
      // 실패하면 히스토리도 제거
      setHistory(history.slice(0, -1))
      return
    }

    if (from.type === 'column') next.columns[from.index].pop()
    if (from.type === 'freeCell') next.freeCells[from.index] = null

    next.moves++
    setMyGame(next)

    await supabase.channel(`game-${roomCode}`).send({
      type: 'broadcast',
      event: 'move',
      payload: {
        playerId: isPlayer1 ? 'player1' : 'player2',
        gameState: next,
      },
    })

    if (checkWin(next)) onWin(true)
  }

  const handleClick = (loc: Location) => {
    if (!selected) setSelected(loc)
    else {
      makeMove(selected, loc)
      setSelected(null)
    }
  }


  /* =====================
     테스트 기능들
  ===================== */

  // 자동 완성 (승리)
  const autoWin = async () => {
    if (!myGame) return

    const next = structuredClone(myGame)

    // 모든 카드를 파운데이션으로
    const allCards: Card[] = []
    next.columns.forEach(col => allCards.push(...col))
    next.freeCells.forEach(card => card && allCards.push(card))

    // 순서대로 파운데이션에 배치
    next.foundations = { S: [], H: [], D: [], C: [] }
    const values: Value[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

    values.forEach(val => {
      (['S', 'H', 'D', 'C'] as Suit[]).forEach(suit => {
        const card = allCards.find(c => c.suit === suit && c.value === val)
        if (card) next.foundations[suit].push(card)
      })
    })

    next.columns = Array.from({ length: 8 }, () => [])
    next.freeCells = [null, null, null, null]

    setMyGame(next)

    await supabase.channel(`game-${roomCode}`).send({
      type: 'broadcast',
      event: 'move',
      payload: {
        playerId: isPlayer1 ? 'player1' : 'player2',
        gameState: next,
      },
    })

    onWin(true)
  }

  // 포기
  const surrender = () => {
    if (confirm('포기하시겠습니까?')) {
      onWin(false)
    }
  }

  // 되돌리기
  const undo = () => {
    if (history.length === 0) {
      alert('되돌릴 수 없습니다.')
      return
    }

    const prev = history[history.length - 1]
    setMyGame(prev)
    setHistory(history.slice(0, -1))
  }

  // 리셋
  const reset = async () => {
    if (!confirm('게임을 리셋하시겠습니까?')) return

    const state = initGame(gameSeed)
    setMyGame(state)
    setHistory([])
    setSelected(null)

    await supabase.channel(`game-${roomCode}`).send({
      type: 'broadcast',
      event: 'move',
      payload: {
        playerId: isPlayer1 ? 'player1' : 'player2',
        gameState: state,
      },
    })
  }



  if (!myGame || !opponentGame) return null

  /* =====================
     Render
  ===================== */

  return (
    <div className='relative m-0 h-screen overflow-hidden p-0'>
      <div className='flex h-full w-full flex-col'>

        <div
          tabIndex={0}
          className="board relative z-0 h-full w-full bg-[#169f54] pt-2 select-none flex items-center justify-center"
        >
          <div className="flex w-full flex-col h-full" style={{ width: '800px' }}>

            {/* 상단 */}
            <div className="flex w-full items-center justify-between">

              {/* FreeCell */}
              <div className="relative h-0 w-[44.94%] pb-[15.19%]">
                <div className="absolute inset-0 flex">
                  {myGame.freeCells.map((card, i) => (
                    <div
                      key={i}
                      onClick={() => handleClick({ type: 'freeCell', index: i })}
                      className={`w-1/4 h-full deck ${isSameLocation(selected, { type: 'freeCell', index: i })
                          ? 'ring-2 ring-yellow-400'
                          : ''
                        }`}
                      style={
                        card
                          ? {
                            backgroundImage: `url(/cards/${card.value}${card.suit}.png)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>

              {/* 중앙 정보 */}
              <div className="flex-1 text-center text-white">
                <div className="font-bold">이동: {myGame.moves}</div>
                <div className="text-sm">
                  완성:{' '}
                  {Object.values(myGame.foundations).reduce(
                    (s, f) => s + f.length,
                    0
                  )}
                  /52
                </div>
              </div>

              {/* Foundation */}
              <div className="relative h-0 w-[44.94%] pb-[15.19%]">
                <div className="absolute inset-0 flex">
                  {(['S', 'H', 'D', 'C'] as Suit[]).map(suit => {
                    const top = myGame.foundations[suit].at(-1)
                    return (
                      <div
                        key={suit}
                        onClick={() => handleClick({ type: 'foundation', suit })}
                        className="w-1/4 h-full deck"
                        style={
                          top
                            ? {
                              backgroundImage: `url(/cards/${top.value}${top.suit}.png)`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                            : undefined
                        }
                      />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Columns */}
            <div className="flex flex-1 justify-evenly mt-4">
              {myGame.columns.map((col, colIdx) => (
                <div key={colIdx} className="relative w-[11.24%]">
                  {col.length === 0 ? (
                    <div
                      onClick={() => handleClick({ type: 'column', index: colIdx })}
                      className="w-full h-0 pb-[135.2%] deck"
                    />
                  ) : (
                    col.map((card, cardIdx) => (
                      <div
                        key={cardIdx}
                        onClick={() =>
                          cardIdx === col.length - 1 &&
                          handleClick({ type: 'column', index: colIdx })
                        }
                        className={`relative w-full h-0 pb-[135.2%] ${cardIdx !== 0 ? '-mt-[109%]' : ''
                          } ${isSameLocation(selected, {
                            type: 'column',
                            index: colIdx,
                          }) && cardIdx === col.length - 1
                            ? 'ring-2 ring-yellow-400'
                            : ''
                          }`}
                        style={{
                          zIndex: 10 + cardIdx,
                          backgroundImage: `url(/cards/${card.value}${card.suit}.png)`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                    ))
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>




        {/* 상대방 파운데이션 (오른쪽 상단 고정) */}
        <div className="fixed top-4 right-4 bg-black/70 rounded-lg p-3" style={{ width: '200px' }}>
          <div className="text-white text-sm font-bold mb-2 text-center">
            상대방
          </div>
          <div className="relative h-0 w-full pb-[33.8%]">
            <div className="absolute inset-0 flex gap-1">
              {(['S', 'H', 'D', 'C'] as Suit[]).map(suit => {
                const top = opponentGame.foundations[suit].at(-1)
                return (
                  <div
                    key={suit}
                    className="w-1/4 h-full deck"
                    style={
                      top
                        ? {
                          backgroundImage: `url(/cards/${top.value}${top.suit}.png)`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                        : undefined
                    }
                  />
                )
              })}
            </div>
          </div>
          <div className="text-white text-xs text-center mt-2">
            완성: {Object.values(opponentGame.foundations).reduce((s, f) => s + f.length, 0)}/52
          </div>
        </div>


        {/* 테스트 버튼들 (오른쪽 하단 고정) */}

        {IS_DEV && (

          <div className="fixed bottom-4 right-4 flex flex-col gap-2" style={{ width: '200px' }}>
            <button
              onClick={autoWin}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
            >
              🏆 자동 승리
            </button>
            <button
              onClick={surrender}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
            >
              🏳️ 포기
            </button>
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded transition"
            >
              ↩️ 되돌리기 ({history.length})
            </button>
            <button
              onClick={reset}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition"
            >
              🔄 리셋
            </button>
          </div>
        )}


      </div>


      {process.env.NODE_ENV !== 'production' && <DebugLogPanel />}

    </div>
  )
}
