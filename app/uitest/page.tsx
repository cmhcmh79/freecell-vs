'use client'

import FreeCellGame from '@/components/FreeCellGame'

export default function UITestPage() {
  return (
    <div className="min-h-screen bg-black">
      <FreeCellGame
        roomCode="ui-test"
        gameSeed={12345}   // 고정 시드 (원하면 제거)
        isPlayer1={true} 
        onWin={(isMe) => {
          alert(isMe ? '🎉 승리!' : '😢 패배')
        }}
      />
    </div>
  )
}
