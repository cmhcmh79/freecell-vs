'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FreeCellGame from '@/components/FreeCellGame'

// 스테이지 정의
const STAGES = [
  { id: 1, name: '초보자', seed: 12345, difficulty: '쉬움' },
  { id: 2, name: '입문', seed: 23456, difficulty: '쉬움' },
  { id: 3, name: '초급', seed: 34567, difficulty: '쉬움' },
  { id: 4, name: '중급 입문', seed: 45678, difficulty: '보통' },
  { id: 5, name: '중급', seed: 56789, difficulty: '보통' },
  { id: 6, name: '중급 상위', seed: 67890, difficulty: '보통' },
  { id: 7, name: '상급 입문', seed: 78901, difficulty: '어려움' },
  { id: 8, name: '상급', seed: 89012, difficulty: '어려움' },
  { id: 9, name: '고급', seed: 90123, difficulty: '어려움' },
  { id: 10, name: '전문가', seed: 11234, difficulty: '매우 어려움' },
  { id: 11, name: '마스터', seed: 22345, difficulty: '매우 어려움' },
  { id: 12, name: '그랜드마스터', seed: 33456, difficulty: '매우 어려움' },
]

export default function RankedPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [currentStage, setCurrentStage] = useState(1)
  const [clearedStages, setClearedStages] = useState<number[]>([])
  const [displayStage, setDisplayStage] = useState(1)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameStartTime, setGameStartTime] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        alert('랭크 모드는 회원만 이용 가능합니다.')
        router.push('/')
        return
      }

      setUserId(session.user.id)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)
      
      if (profileData) {
        const stage = profileData.solo_current_stage || 1
        const cleared = profileData.solo_cleared_stages || []
        setCurrentStage(stage)
        setClearedStages(cleared)
        setDisplayStage(stage)
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handlePrevStage = () => {
    if (displayStage > 1) {
      setDisplayStage(displayStage - 1)
    }
  }

  const handleNextStage = () => {
    if (displayStage < STAGES.length) {
      setDisplayStage(displayStage + 1)
    }
  }

  const handleStageStart = () => {
    // 현재 스테이지만 플레이 가능
    if (displayStage !== currentStage) {
      alert('현재 도전 가능한 스테이지만 플레이할 수 있습니다!')
      return
    }
    
    setGameStartTime(Date.now())
    setGameStarted(true)
  }

  const handleGameEnd = async (isWin: boolean) => {
    if (!isWin) {
      alert('실패... 다시 도전해보세요!')
      setGameStarted(false)
      return
    }

    const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000)
    
    // 클리어 처리
    const newClearedStages = [...clearedStages, currentStage]
    const newCurrentStage = currentStage + 1
    const newRating = (profile?.rating || 1000) + 1

    try {
      // DB에 저장
      await supabase
        .from('profiles')
        .update({
          solo_current_stage: newCurrentStage,
          solo_cleared_stages: newClearedStages,
          rating: newRating
        })
        .eq('id', userId)

      // 게임 결과 기록
      await supabase.from('game_results').insert({
        room_code: `RANKED-STAGE-${currentStage}`,
        game_seed: STAGES[currentStage - 1].seed,
        winner_id: userId,
        loser_id: null,
        winner_moves: 0,
        loser_moves: 0,
        duration_seconds: durationSeconds,
        game_type: 'ranked'
      })
    } catch (err) {
      console.error('저장 실패:', err)
    }

    setClearedStages(newClearedStages)
    setCurrentStage(newCurrentStage)
    setDisplayStage(newCurrentStage)
    setProfile({ ...profile, rating: newRating })
    
    if (currentStage === STAGES.length) {
      alert('🎉 축하합니다! 모든 스테이지를 클리어했습니다!')
    } else {
      alert(`🎉 스테이지 ${currentStage} 클리어! +1 RP\n다음 스테이지로 이동합니다.`)
    }

    setGameStarted(false)
  }

  const getRankName = (rating: number) => {
    if (rating >= 2000) return '🏆 그랜드마스터'
    if (rating >= 1800) return '💎 다이아몬드'
    if (rating >= 1600) return '💠 플래티넘'
    if (rating >= 1400) return '🥇 골드'
    if (rating >= 1200) return '🥈 실버'
    return '🥉 브론즈'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    )
  }

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900">
        <FreeCellGame
          roomCode={`RANKED-STAGE-${currentStage}`}
          gameSeed={STAGES[currentStage - 1].seed}
          isPlayer1={true}
          onWin={handleGameEnd}
        />
      </div>
    )
  }

  const stage = STAGES[displayStage - 1]
  const isCurrentStage = displayStage === currentStage
  const isCleared = clearedStages.includes(displayStage)
  const isPastStage = displayStage < currentStage

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

        {/* 프로필 정보 */}
        <div className="text-center mb-6 pb-6 border-b">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-2xl font-bold mb-2">{profile?.nickname || '플레이어'}</h2>
          <div className="text-lg font-semibold text-gray-600 mb-1">
            {getRankName(profile?.rating || 1000)}
          </div>
          <div className="text-3xl font-bold text-yellow-600">
            {profile?.rating || 1000} RP
          </div>
          <div className="text-sm text-gray-500 mt-2">
            스테이지 {clearedStages.length}/{STAGES.length} 클리어
          </div>
        </div>

        {/* 매칭 게임 */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/matchmaking')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
          >
            ⚔️ 매칭 게임
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            실시간 대전 | 승리 +10 RP, 패배 -10 RP
          </p>
        </div>

        {/* 광고 보기 */}
        <div className="mb-6">
          <button
            onClick={() => alert('광고 기능은 준비 중입니다!')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            📺 광고 보고 +10 포인트
          </button>
        </div>

        {/* 스테이지 네비게이션 */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={handlePrevStage}
              disabled={displayStage === 1}
              className="w-12 h-12 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-bold text-2xl transition-colors"
            >
              &lt;
            </button>
            
            <div className="text-center flex-1">
              <div className="text-4xl font-bold text-gray-800">
                {displayStage}
              </div>
              <div className="text-sm text-gray-500">/ {STAGES.length}</div>
            </div>

            <button
              onClick={handleNextStage}
              disabled={displayStage === STAGES.length}
              className="w-12 h-12 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-bold text-2xl transition-colors"
            >
              &gt;
            </button>
          </div>

          {/* 스테이지 정보 */}
          <div className={`p-6 rounded-lg border-2 ${
            isCurrentStage 
              ? 'bg-blue-50 border-blue-400' 
              : isCleared
              ? 'bg-green-50 border-green-400'
              : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {stage.name}
              </h3>
              <span className="inline-block px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700">
                {stage.difficulty}
              </span>
            </div>

            {isCleared && (
              <div className="text-center mb-4">
                <span className="text-4xl">✅</span>
                <p className="text-sm text-green-700 font-medium mt-2">클리어 완료</p>
              </div>
            )}

            {isCurrentStage && !isCleared && (
              <div className="text-center mb-4">
                <span className="text-4xl">⭐</span>
                <p className="text-sm text-blue-700 font-medium mt-2">도전 가능</p>
              </div>
            )}

            {isPastStage && !isCleared && (
              <div className="text-center mb-4">
                <span className="text-4xl">⏭️</span>
                <p className="text-sm text-gray-600 font-medium mt-2">이미 지나간 스테이지</p>
              </div>
            )}

            {!isCurrentStage && displayStage > currentStage && (
              <div className="text-center mb-4">
                <span className="text-4xl">🔒</span>
                <p className="text-sm text-gray-600 font-medium mt-2">아직 잠김</p>
              </div>
            )}

            <button
              onClick={handleStageStart}
              disabled={!isCurrentStage}
              className={`w-full font-bold py-3 px-6 rounded-lg transition-colors ${
                isCurrentStage
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCurrentStage ? '게임 시작' : '플레이 불가'}
            </button>
          </div>
        </div>

        {/* 안내 */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>랭크 모드:</strong><br />
            • 스테이지를 순서대로 클리어하세요<br />
            • 클리어 시 +1 RP 획득<br />
            • 매칭 게임으로 더 많은 RP 획득
          </p>
        </div>
      </div>
    </div>
  )
}