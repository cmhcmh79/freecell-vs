// components/freecell/components/GameControls.tsx

import React from 'react'

type GameControlsProps = {
  onSurrender: () => void
  onUndo: () => void
  onReset: () => void
  historyLength: number
}

export const GameControls: React.FC<GameControlsProps> = ({
  onSurrender,
  onUndo,
  onReset,
  historyLength,
}) => {
  return (
    <div className="flex gap-1" style={{ width: '44.94%' }}>
      <button
        onClick={onSurrender}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded transition text-xs flex-1"
      >
        🏳️ 포기
      </button>
      <button
        onClick={onUndo}
        disabled={historyLength === 0}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-1 px-2 rounded transition text-xs flex-1"
      >
        ↩️ 되돌리기
      </button>
      <button
        onClick={onReset}
        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded transition text-xs flex-1"
      >
        🔄 다시하기
      </button>
    </div>
  )
}