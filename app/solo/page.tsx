'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FreeCellGame from '@/components/FreeCellGame'

export default function SoloPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [soloRating, setSoloRating] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSeed] = useState(() => Math.floor(Math.random() * 1000000))
  const [gameStartTime] = useState(Date.now())

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/')
        return
      }

      setUserId(session.user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('solo_rating')
        .eq('id', session.user.id)
        .single()

      setSoloRating(profile?.solo_rating || 0)
    }

    init()
  }, [router])

  const handleGameEnd = async (isWin: boolean) => {
    if (!isWin) {
      alert('😢 실패... 점수 변동 없음')
      router.push('/lobby')
      return
    }

    const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000)

    try {
      // 게임 결과 저장
      const { data: gameResult, error: gameError } = await supabase
        .from('game_results')
        .insert({
          room_code: 'SOLO',
          game_seed: gameSeed,
          winner_id: userId,
          loser_id: null,
          winner_moves: 0,
          loser_moves: 0,
          duration_seconds: durationSeconds,
          game_type: 'solo'
        })
        .select()
        .single()

      if (gameError) throw gameError

      // 점수 업데이트
      const newRating = soloRating + 1
      const { error: ratingError } = await supabase
        .from('profiles')
        .update({ solo_rating: newRating })
        .eq('id', userId)

      if (ratingError) throw ratingError

      // 점수 변동 기록
      await supabase.from('rating_history').insert({
        user_id: userId,
        game_type: 'solo',
        rating_change: 1,
        old_rating: soloRating,
        new_rating: newRating,
        game_result_id: gameResult.id
      })

      alert(`🎉 성공! +1점 (${soloRating} → ${newRating})`)
    } catch (err) {
      console.error('점수 저장 실패:', err)
    }

    router.push('/lobby')
  }

  const startGame = () => {
    setGameStarted(true)
  }

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900">
        <FreeCellGame
          roomCode="SOLO"
          gameSeed={gameSeed}
          isPlayer1={true}
          onWin={handleGameEnd}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="mb-4">
          <button
            onClick={() => router.push('/lobby')}
            className="text-gray-600 hover:underline"
          >
            ← 뒤로 가기
          </button>
        </div>

        <h1 className="text-4xl font-bold text-center mb-6">솔로 모드</h1>

        <div className="mb-6 p-4 bg-blue-100 rounded-lg text-center">
          <div className="text-sm text-gray-600">현재 점수</div>
          <div className="text-4xl font-bold text-blue-600">{soloRating}</div>
        </div>

        <button
          onClick={startGame}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors mb-4"
        >
          🎯 게임 시작
        </button>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>솔로 모드:</strong><br />
            • 혼자서 프리셀을 클리어하세요<br />
            • 성공하면 +1점<br />
            • 실패해도 점수 차감 없음
          </p>
        </div>
      </div>
    </div>
  )
}