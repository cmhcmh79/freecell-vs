'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import './FreeCellGame.css'
import DebugLogPanel from '@/components/DebugLogPanel'
import { debugLogger } from '@/utils/debugLogger'
import { IS_DEV } from '@/config/env'

import type { FreeCellGameProps, Suit, Card, Value, GameState, Location} from './freecell/types'
import { MATCH_TIME, CARD_VALUES, CARD_VALUE_MAP, SUITS } from './freecell/constants'
import { createDeck} from './freecell/deckUtils'
import { getCompletedCount, canPlaceOnColumn, canPlaceOnFoundation, checkWin, formatTime, isSameLocation} from './freecell/gameLogic'



/* =====================
   Component
===================== */

export default function FreeCellGame(props: FreeCellGameProps) {
  const { roomCode, gameSeed, gameMode, isPlayer1, onWin } = props

  // 게임 모드별 특성 계산
  const isMultiplayer = gameMode === 'matchmaking' || gameMode === 'versus'  // 대전 게임 여부
  const hasTimer = gameMode === 'matchmaking'  // 타이머 사용 여부
  const isSoloGame = gameMode === 'solo' || gameMode === 'ranked'  // 솔로 게임 여부

  const [myGame, setMyGame] = useState<GameState | null>(null)
  const [opponentGame, setOpponentGame] = useState<GameState | null>(null)
  const [selected, setSelected] = useState<Location | null>(null)
  const [history, setHistory] = useState<GameState[]>([])

  const channelRef = useRef<RealtimeChannel | null>(null)

  /* =====================
   Timer (매칭 게임에서만)
===================== */
  const [timeLeft, setTimeLeft] = useState(MATCH_TIME)

  /* =====================
     Deck / Init
  ===================== */


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

    // 대전 게임일 때만 상대방 상태 초기화
    if (isMultiplayer) {
      setOpponentGame(JSON.parse(JSON.stringify(state)))
    }
    // 대전 게임일 때만 채널 구독
    if (isMultiplayer) {
      const channel = supabase.channel(`game-${roomCode}`)
      channelRef.current = channel

      channel
        .on('broadcast', { event: 'move' }, ({ payload }) => {
          const expectedId = isPlayer1 ? 'player2' : 'player1'
          if (payload.playerId !== expectedId) return
          setOpponentGame(payload.gameState)
          if (checkWin(payload.gameState)) onWin(false)
        })

      return () => {
        supabase.removeChannel(channel)
        channelRef.current = null
      }
    }


  }, [gameSeed, roomCode, isPlayer1, onWin, isMultiplayer])

  // 타이머 (매칭 게임에서만)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasTimer])

  // 타임오버 체크 (매칭 게임에서만))
  useEffect(() => {
    if (!hasTimer) return

    if (timeLeft === 0 && myGame && opponentGame) {
      handleTimeOver()
    }
  }, [timeLeft, myGame, opponentGame, hasTimer])

  /* =====================
     Move
  ===================== */

  const makeMove = async (from: Location, to: Location) => {
    if (!myGame) return

    // 매칭 게임에서만 타이머 체크
    if (hasTimer && timeLeft === 0) return

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
      setHistory(history.slice(0, -1))
      return
    }

    if (from.type === 'column') next.columns[from.index].pop()
    if (from.type === 'freeCell') next.freeCells[from.index] = null

    next.moves++
    setMyGame(next)

    // 대전 게임일 때만 브로드캐스트
    if (isMultiplayer && channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'move',
        payload: {
          playerId: isPlayer1 ? 'player1' : 'player2',
          gameState: next,
        },
      })
    }

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
   타임 함수
===================== */

  const handleTimeOver = () => {
    if (!hasTimer || !opponentGame) return

    debugLogger.log('handleTimeOver: 시간 종료!')

    const myScore = getCompletedCount(myGame!)
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
  }

  /* =====================
     테스트 기능들
  ===================== */

  const autoWin = async () => {
    if (!myGame) return

    const next = structuredClone(myGame)

    const allCards: Card[] = []
    next.columns.forEach(col => allCards.push(...col))
    next.freeCells.forEach(card => card && allCards.push(card))

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

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'move',
        payload: {
          playerId: isPlayer1 ? 'player1' : 'player2',
          gameState: next,
        },
      })
    }
    onWin(true)
  }

  const surrender = () => {
    if (confirm('포기하시겠습니까?')) {
      onWin(false)
    }
  }

  const undo = () => {
    if (history.length === 0) {
      alert('되돌릴 수 없습니다.')
      return
    }

    const prev = history[history.length - 1]
    setMyGame(prev)
    setHistory(history.slice(0, -1))
  }

  const reset = async () => {
    if (!confirm('게임을 리셋하시겠습니까?')) return

    const state = initGame(gameSeed)
    setMyGame(state)
    setHistory([])
    setSelected(null)

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'move',
        payload: {
          playerId: isPlayer1 ? 'player1' : 'player2',
          gameState: state,
        },
      })
    }
  }

  // autoWin, surrender, undo, reset 함수들도 isMultiplayer로 브로드캐스트 조건 처리

  if (!myGame) return null
  if (isMultiplayer && !opponentGame) return null

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

            {/* 상단 영역 - 2줄 구조 */}
            <div className="w-full mb-2">
              {/* 첫 번째 줄: 버튼 영역 + 중앙 정보 + 상대방 영역 */}
              <div className="flex w-full items-center justify-between mb-2">
                {/* 왼쪽: 게임 컨트롤 버튼들 (FreeCell 위쪽) */}
                <div className="flex gap-1" style={{ width: '44.94%' }}>
                  <button
                    onClick={surrender}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded transition text-xs flex-1"
                  >
                    🏳️ 포기
                  </button>
                  <button
                    onClick={undo}
                    disabled={history.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-1 px-2 rounded transition text-xs flex-1"
                  >
                    ↩️ 되돌리기
                  </button>
                  <button
                    onClick={reset}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded transition text-xs flex-1"
                  >
                    🔄 다시하기
                  </button>
                </div>

                {/* 중앙 정보 */}
                <div className="flex-1 text-center text-white">
                  {hasTimer ? (
                    <>
                      <div className="font-bold text-lg">⏱ {formatTime(timeLeft)}</div>
                      <div className="text-xs opacity-80">남은 시간</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs opacity-80">#{gameSeed}</div>
                    </>
                  )}
                </div>

                {/* 오른쪽: 상대방 파운데이션 (대전 게임에서만) */}
                {isMultiplayer && opponentGame ? (<div className="bg-black/50 rounded-lg p-2" style={{ width: '44.94%' }}>
                  <div className="text-white text-xs font-bold mb-1 text-center">
                    상대방
                  </div>
                  <div className="relative h-0 w-full pb-[22.5%]">
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
                  <div className="text-white text-xs text-center mt-1">
                    완성: {Object.values(opponentGame.foundations).reduce((s, f) => s + f.length, 0)}/52
                  </div>
                </div>
                ) : (
                  <div style={{ width: '44.94%' }} />
                )}
              </div>

              {/* 두 번째 줄: FreeCell + Foundation */}
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

                {/* 중앙 빈 공간 */}
                <div className="flex-1 text-center text-white">
                  <div className="font-bold">이동: {myGame.moves}</div>
                  <div className="text-sm">
                    완성:{' '}
                    {Object.values(myGame.foundations).reduce((s, f) => s + f.length, 0)}
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
            </div>

            {/* Columns */}
            <div className="flex flex-1 justify-evenly">
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