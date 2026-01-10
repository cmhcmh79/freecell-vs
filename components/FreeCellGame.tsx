'use client'

// components/FreeCellGame.tsx

import React from 'react'
import './FreeCellGame.css'
import DebugLogPanel from '@/components/DebugLogPanel'
import { IS_DEV } from '@/config/env'

import type { FreeCellGameProps } from './freecell/types'
import { useGameTimer } from './freecell/useGameTimer'
import { useRealtimeSync } from './freecell/useRealtimeSync'
import { useFreeCellGame } from './freecell/useFreeCellGame'
import { getCompletedCount } from './freecell/gameLogic'

import { GameControls } from './freecell/components/GameControls'
import { GameInfo } from './freecell/components/GameInfo'
import { OpponentInfo } from './freecell/components/OpponentInfo'
import { FreeCellArea } from './freecell/components/FreeCellArea'
import { FoundationArea } from './freecell/components/FoundationArea'
import { ColumnArea } from './freecell/components/ColumnArea'
import { DevControls } from './freecell/components/DevControls'

export default function FreeCellGame(props: FreeCellGameProps) {
  const { roomCode, gameSeed, gameMode, isPlayer1, onWin } = props

  // 게임 모드별 특성
  const isMultiplayer = gameMode === 'matchmaking' || gameMode === 'versus'
  const hasTimer = gameMode === 'matchmaking'

  // 타이머
  const timeLeft = useGameTimer(hasTimer)

  // Realtime 동기화
  const { broadcast } = useRealtimeSync({
    roomCode,
    isPlayer1,
    isMultiplayer,
    onOpponentMove: (gameState) => setOpponentGame(gameState),
    onWin,
  })

  // 게임 상태 관리
  const {
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
  } = useFreeCellGame({
    gameSeed,
    isMultiplayer,
    hasTimer,
    timeLeft,
    isPlayer1,
    onWin,
    broadcast,
  })

  if (!myGame) return null
  if (isMultiplayer && !opponentGame) return null

  return (
    <div className='relative m-0 h-screen overflow-hidden p-0'>
      <div className='flex h-full w-full flex-col'>
        <div
          tabIndex={0}
          className="board relative z-0 h-full w-full bg-[#169f54] pt-2 select-none flex items-center justify-center"
        >
          <div className="flex w-full flex-col h-full" style={{ width: '800px' }}>
            
            {/* 상단 영역 */}
            <div className="w-full mb-2">
              {/* 첫 번째 줄: 버튼 + 중앙 정보 + 상대방 */}
              <div className="flex w-full items-center justify-between mb-2">
                <GameControls
                  onSurrender={surrender}
                  onUndo={undo}
                  onReset={reset}
                  historyLength={history.length}
                />

                <GameInfo
                  hasTimer={hasTimer}
                  timeLeft={timeLeft}
                  gameSeed={gameSeed}
                />

                <OpponentInfo opponentGame={isMultiplayer ? opponentGame : null} />
              </div>

              {/* 두 번째 줄: FreeCell + 중앙 정보 + Foundation */}
              <div className="flex w-full items-center justify-between">
                <FreeCellArea
                  freeCells={myGame.freeCells}
                  selected={selected}
                  onClick={handleClick}
                />

                <GameInfo
                  hasTimer={false}
                  moves={myGame.moves}
                  completedCount={getCompletedCount(myGame)}
                />

                <FoundationArea
                  foundations={myGame.foundations}
                  onClick={handleClick}
                />
              </div>
            </div>

            {/* Columns */}
            <ColumnArea
              columns={myGame.columns}
              selected={selected}
              onClick={handleClick}
            />

          </div>
        </div>

        {/* 개발자 컨트롤 */}
        {IS_DEV && (
          <DevControls
            onAutoWin={autoWin}
            onSurrender={surrender}
            onUndo={undo}
            onReset={reset}
            historyLength={history.length}
          />
        )}

      </div>

      {process.env.NODE_ENV !== 'production' && <DebugLogPanel />}
    </div>
  )
}