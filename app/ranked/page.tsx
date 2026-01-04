'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FreeCellGame from '@/components/FreeCellGame'

const STAGES_PER_GROUP = 10
const UNLOCK_PERCENTAGE = 0.8 // 80% (10개 중 8개)

export default function RankedPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [clearedStages, setClearedStages] = useState<number[]>([])
  const [displayStage, setDisplayStage] = useState(1)
  const [maxAvailableStage, setMaxAvailableStage] = useState(10)
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
        const cleared = profileData.solo_cleared_stages || []
        setClearedStages(cleared)
        
        // 최대 플레이 가능 스테이지 계산
        const maxStage = calculateMaxAvailableStage(cleared)
        setMaxAvailableStage(maxStage)
        
        // 마지막 클리어한 다음 스테이지로 이동
        const maxCleared = cleared.length > 0 ? Math.max(...cleared) : 0
        setDisplayStage(Math.min(maxCleared + 1, maxStage))
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const calculateMaxAvailableStage = (cleared: number[]): number => {
    // 현재 완료된 그룹 확인
    let currentGroup = 0
    
    while (true) {
      const groupStart = currentGroup * STAGES_PER_GROUP + 1
      const groupEnd = (currentGroup + 1) * STAGES_PER_GROUP
      
      // 현재 그룹의 클리어 개수
      const clearedInGroup = cleared.filter(s => s >= groupStart && s <= groupEnd).length
      const requiredClears = Math.ceil(STAGES_PER_GROUP * UNLOCK_PERCENTAGE) // 8개
      
      // 80% 이상 클리어했으면 다음 그룹 해금
      if (clearedInGroup >= requiredClears) {
        currentGroup++
      } else {
        break
      }
    }
    
    return (currentGroup + 1) * STAGES_PER_GROUP
  }

  // 1개씩 이동
  const handlePrevStage = () => {
    if (displayStage > 1) {
      setDisplayStage(displayStage - 1)
    }
  }

  const handleNextStage = () => {
    if (displayStage < maxAvailableStage) {
      setDisplayStage(displayStage + 1)
    }
  }

  // 10개씩 이동
  const handlePrev10Stage = () => {
    const newStage = Math.max(1, displayStage - 10)
    setDisplayStage(newStage)
  }

  const handleNext10Stage = () => {
    const newStage = Math.min(maxAvailableStage, displayStage + 10)
    setDisplayStage(newStage)
  }

  const canPlayStage = (stageNum: number): boolean => {
    // 이미 클리어한 스테이지는 다시 플레이 불가
    if (clearedStages.includes(stageNum)) {
      return false
    }
    // 해금된 범위 내에서만 플레이 가능
    return stageNum <= maxAvailableStage
  }

  const handleStageStart = () => {
    if (!canPlayStage(displayStage)) {
      if (clearedStages.includes(displayStage)) {
        alert('이미 클리어한 스테이지입니다!')
      } else {
        alert(`스테이지 ${displayStage}은(는) 아직 잠겨있습니다!\n이전 구간 80% 클리어 시 해금됩니다.`)
      }
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
    const newClearedStages = [...clearedStages, displayStage]
    const newRating = (profile?.rating || 1000) + 1

    // 새로운 구간 해금 체크
    const oldMaxStage = maxAvailableStage
    const newMaxStage = calculateMaxAvailableStage(newClearedStages)
    const unlockedNewGroup = newMaxStage > oldMaxStage

    try {
      // DB에 저장
      await supabase
        .from('profiles')
        .update({
          solo_cleared_stages: newClearedStages,
          rating: newRating
        })
        .eq('id', userId)

      // 게임 결과 기록
      await supabase.from('game_results').insert({
        room_code: `RANKED-${displayStage}`,
        game_seed: displayStage,
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
    setMaxAvailableStage(newMaxStage)
    setProfile({ ...profile, rating: newRating })
    
    // 알림
    if (unlockedNewGroup) {
      alert(`🎉 스테이지 ${displayStage} 클리어! +1 RP\n\n🔓 새로운 구간 (${oldMaxStage + 1}-${newMaxStage})이 해금되었습니다!`)
    } else {
      alert(`🎉 스테이지 ${displayStage} 클리어! +1 RP`)
    }

    // 다음 미클리어 스테이지로 이동
    let nextStage = displayStage + 1
    while (nextStage <= newMaxStage && newClearedStages.includes(nextStage)) {
      nextStage++
    }
    setDisplayStage(Math.min(nextStage, newMaxStage))

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
          roomCode={`RANKED-${displayStage}`}
          gameSeed={displayStage}
          isPlayer1={true}
          onWin={handleGameEnd}
        />
      </div>
    )
  }

  const isCleared = clearedStages.includes(displayStage)
  const isPlayable = canPlayStage(displayStage)
  const isLocked = displayStage > maxAvailableStage

  // 현재 구간 진행도
  const currentGroupNum = Math.floor((displayStage - 1) / STAGES_PER_GROUP)
  const currentGroupStart = currentGroupNum * STAGES_PER_GROUP + 1
  const currentGroupEnd = (currentGroupNum + 1) * STAGES_PER_GROUP
  const clearedInCurrentGroup = clearedStages.filter(s => s >= currentGroupStart && s <= currentGroupEnd).length
  const progressRate = Math.round((clearedInCurrentGroup / STAGES_PER_GROUP) * 100)

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
            총 {clearedStages.length}개 클리어
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
          <div className="flex items-center justify-center gap-2 mb-4">
            {/* 10개씩 이전 */}
            <button
              onClick={handlePrev10Stage}
              disabled={displayStage <= 10}
              className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-bold text-lg transition-colors"
              title="10개 이전"
            >
              «
            </button>
            
            {/* 1개씩 이전 */}
            <button
              onClick={handlePrevStage}
              disabled={displayStage === 1}
              className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-bold text-xl transition-colors"
              title="1개 이전"
            >
              ‹
            </button>
            
            {/* 스테이지 번호 */}
            <div className="text-center flex-1">
              <div className="text-4xl font-bold text-gray-800">
                {displayStage}
              </div>
              <div className="text-xs text-gray-500">
                {isLocked ? '🔒 잠김' : `${currentGroupStart}-${Math.min(currentGroupEnd, maxAvailableStage)}`}
              </div>
            </div>

            {/* 1개씩 다음 */}
            <button
              onClick={handleNextStage}
              disabled={displayStage >= maxAvailableStage}
              className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-bold text-xl transition-colors"
              title="1개 다음"
            >
              ›
            </button>

            {/* 10개씩 다음 */}
            <button
              onClick={handleNext10Stage}
              disabled={displayStage >= maxAvailableStage - 9}
              className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-bold text-lg transition-colors"
              title="10개 다음"
            >
              »
            </button>
          </div>

          {/* 현재 구간 진행도 */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                현재 구간 ({currentGroupStart}-{currentGroupEnd})
              </span>
              <span className="text-sm font-bold text-blue-600">
                {clearedInCurrentGroup}/{STAGES_PER_GROUP} ({progressRate}%)
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progressRate}%` }}
              />
            </div>
            {progressRate < 80 && (
              <p className="text-xs text-gray-600 mt-2 text-center">
                80% (8개) 달성 시 다음 10개 스테이지 해금
              </p>
            )}
          </div>

          {/* 스테이지 정보 */}
          <div className={`p-6 rounded-lg border-2 ${
            isCleared
              ? 'bg-green-50 border-green-400'
              : isPlayable
              ? 'bg-blue-50 border-blue-400'
              : 'bg-gray-100 border-gray-300'
          }`}>
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                스테이지 {displayStage}
              </h3>
              <span className="inline-block px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700">
                Seed #{displayStage}
              </span>
            </div>

            {isCleared && (
              <div className="text-center mb-4">
                <span className="text-4xl">✅</span>
                <p className="text-sm text-green-700 font-medium mt-2">클리어 완료</p>
              </div>
            )}

            {!isCleared && isPlayable && (
              <div className="text-center mb-4">
                <span className="text-4xl">⭐</span>
                <p className="text-sm text-blue-700 font-medium mt-2">도전 가능</p>
              </div>
            )}

            {isLocked && (
              <div className="text-center mb-4">
                <span className="text-4xl">🔒</span>
                <p className="text-sm text-gray-600 font-medium mt-2">
                  이전 구간 80% 클리어 필요
                </p>
              </div>
            )}

            <button
              onClick={handleStageStart}
              disabled={!isPlayable}
              className={`w-full font-bold py-3 px-6 rounded-lg transition-colors ${
                isPlayable
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCleared ? '이미 클리어함' : isPlayable ? '게임 시작' : '플레이 불가'}
            </button>
          </div>
        </div>

        {/* 안내 */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>랭크 모드:</strong><br />
            • 스테이지 번호 = Seed 번호<br />
            • 처음 클리어 시 +1 RP 획득<br />
            • 10개 구간의 80% (8개) 클리어 시 다음 해금
          </p>
        </div>
      </div>
    </div>
  )
}