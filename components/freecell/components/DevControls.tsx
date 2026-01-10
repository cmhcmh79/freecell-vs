// components/freecell/components/DevControls.tsx

import React from 'react'

type DevControlsProps = {
  onAutoWin: () => void
  onSurrender: () => void
  onUndo: () => void
  onReset: () => void
  historyLength: number
}

export const DevControls: React.FC<DevControlsProps> = ({
  onAutoWin,
  onSurrender,
  onUndo,
  onReset,
  historyLength,
}) => {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2" style={{ width: '200px' }}>
      <button
        onClick={onAutoWin}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
      >
        🏆 자동 승리
      </button>
      <button
        onClick={onSurrender}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
      >
        🏳️ 포기
      </button>
      <button
        onClick={onUndo}
        disabled={historyLength === 0}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded transition"
      >
        ↩️ 되돌리기 ({historyLength})
      </button>
      <button
        onClick={onReset}
        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition"
      >
        🔄 리셋
      </button>
    </div>
  )
}