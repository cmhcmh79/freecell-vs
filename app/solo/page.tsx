'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FreeCellGame from '@/components/FreeCellGame'

export default function SoloPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSeed, setGameSeed] = useState<number | null>(null)
  const [gameStartTime, setGameStartTime] = useState(0)
  const [customSeed, setCustomSeed] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUserId(session.user.id)
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
      }
    }

    init()
  }, [])

  const startRandomGame = () => {
    const randomSeed = Math.floor(Math.random() * 1000000)
    setGameSeed(randomSeed)
    setGameStartTime(Date.now())
    setGameStarted(true)
  }

  const startCustomGame = () => {
    const seed = parseInt(customSeed)
    if (isNaN(seed) || seed < 0) {
      alert('유효한 번호를 입력해주세요!')
      return
    }
    setGameSeed(seed)
    setGameStartTime(Date.now())
    setGameStarted(true)
  }

  const handleGameEnd = async (isWin: boolean) => {
    if (!isWin) {
      alert('실패... 다시 도전해보세요!')
      setGameStarted(false)
      setGameSeed(null)
      return
    }

    const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000)

    // 회원만 기록 저장
    if (isLoggedIn && userId && gameSeed) {
      try {
        await supabase.from('game_results').insert({
          room_code: 'SOLO',
          game_seed: gameSeed,
          winner_id: userId,
          loser_id: null,
          winner_moves: 0,
          loser_moves: 0,
          duration_seconds: durationSeconds,
          game_type: 'solo'
        })
      } catch (err) {
        console.error('저장 실패:', err)
      }
    }

    alert(`🎉 성공!\nSeed: ${gameSeed}\n소요 시간: ${durationSeconds}초`)
    
    setGameStarted(false)
    setGameSeed(null)
  }

  if (gameStarted && gameSeed !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900">
        <FreeCellGame
          roomCode={`SOLO-${gameSeed}`}
          gameSeed={gameSeed}
          gameMode="solo"  // 추가
          isPlayer1={true}
          onWin={handleGameEnd}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">뒤로가기</span>
          </button>
        </div>

        <h1 className="text-4xl font-bold text-center mb-6">🎯 솔로 모드</h1>

        {/* 랜덤 플레이 */}
        <div className="mb-6">
          <button
            onClick={startRandomGame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors shadow-lg"
          >
            🎲 랜덤 플레이
          </button>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-gray-500 text-sm">또는</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Seed 입력 플레이 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            특정 번호로 플레이
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={customSeed}
              onChange={(e) => setCustomSeed(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && startCustomGame()}
              placeholder="예: 12345"
              min="0"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            />
            <button
              onClick={startCustomGame}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-lg transition-colors"
            >
              시작
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}