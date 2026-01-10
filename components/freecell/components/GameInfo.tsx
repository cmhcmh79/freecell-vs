// components/freecell/components/GameInfo.tsx

import React from 'react'
import { formatTime } from '../gameLogic'

type GameInfoProps = {
  hasTimer: boolean
  timeLeft?: number
  gameSeed?: number
  moves?: number
  completedCount?: number
}

export const GameInfo: React.FC<GameInfoProps> = ({
  hasTimer,
  timeLeft,
  gameSeed,
  moves,
  completedCount,
}) => {
  if (hasTimer && timeLeft !== undefined) {
    return (
      <div className="flex-1 text-center text-white">
        <div className="font-bold text-lg">⏱ {formatTime(timeLeft)}</div>
        <div className="text-xs opacity-80">남은 시간</div>
      </div>
    )
  }

  if (moves !== undefined && completedCount !== undefined) {
    return (
      <div className="flex-1 text-center text-white">
        <div className="font-bold">이동: {moves}</div>
        <div className="text-sm">완성: {completedCount}/52</div>
      </div>
    )
  }

  return (
    <div className="flex-1 text-center text-white">
      {gameSeed !== undefined && <div className="text-xs opacity-80">#{gameSeed}</div>}
    </div>
  )
}