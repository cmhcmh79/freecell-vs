'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VersusPage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')

  // 숫자 6자리 방 코드 생성
  const generateRoomCode = () => {
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += Math.floor(Math.random() * 10)
    }
    return code
  }

  // 방 만들기
  const createRoom = () => {
    const code = generateRoomCode()
    router.push(`/room/${code}`)
  }

  // 방 입장
  const joinRoom = () => {
    if (!roomCode.trim()) {
      alert('방 코드를 입력해주세요!')
      return
    }
    if (roomCode.length !== 6) {
      alert('방 코드는 6자리 숫자입니다.')
      return
    }
    router.push(`/room/${roomCode}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">

        {/* 제목 */}
        <h1 className="text-4xl font-bold text-center mb-2">
          프리셀 대전
        </h1>
        <p className="text-center text-gray-600 mb-8">
          친구와 실시간 대결!
        </p>

        {/* 새 방 만들기 */}
        <div className="mb-6">
          <button
            onClick={createRoom}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
          >
            🎮 새 방 만들기
          </button>
          <p className="text-sm text-gray-500 text-center mt-2">
            6자리 방 코드가 자동 생성됩니다
          </p>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-gray-500">또는</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* 방 입장 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            방 코드 입력
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(e.target.value.replace(/\D/g, ''))
            }
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            placeholder="예: 483920"
            maxLength={6}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                       text-center text-2xl font-bold tracking-wider
                       focus:border-green-500 focus:outline-none"
          />

          <button
            onClick={joinRoom}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700
                       text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🚪 방 입장하기
          </button>
        </div>

        {/* 안내 */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>사용 방법</strong><br />
            1. 방을 만들고 친구에게 코드를 알려주세요<br />
            2. 친구가 같은 코드로 입장하면 게임이 시작됩니다
          </p>
        </div>

        {/* 뒤로가기 */}
        <button
          onClick={() => router.push('/')}
          className="w-full mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          메인으로 돌아가기
        </button>
      </div>
    </div>
  )
}
