'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FreeCellGame from '@/components/FreeCellGame'

export default function RankedPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [displayStage, setDisplayStage] = useState(1)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameStartTime, setGameStartTime] = useState(0)
  const [loading, setLoading] = useState(true)

  const [lastClearedStage, setLastClearedStage] = useState(0)
  const currentStage = lastClearedStage + 1
  const maxDisplayStage = currentStage + 1

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
        const last = profileData.solo_last_cleared_stage || 0
        console.log('last:', last)
        setLastClearedStage(last)
        setDisplayStage(last + 1)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

    /* =====================
     displayStage 안전장치
  ===================== */
  useEffect(() => {
    if (displayStage > maxDisplayStage) {
      setDisplayStage(maxDisplayStage)
    }
  }, [displayStage, maxDisplayStage])

  /* =====================
     스테이지 이동
  ===================== */


  // 1개씩 이동
  const handlePrevStage = () => {
    if (displayStage > 1) {
      setDisplayStage(displayStage - 1)
    }
  }

  const handleNextStage = () => {
    setDisplayStage(prev => Math.min(prev + 1, maxDisplayStage))
  }

  // 10개씩 이동
  const handlePrev10Stage = () => {
    const newStage = Math.max(1, displayStage - 10)
    setDisplayStage(newStage)
  }

  const handleNext10Stage = () => {
    setDisplayStage(prev => Math.min(prev + 10, maxDisplayStage))
  }

  const canPlayStage = (stage: number) => {
    return stage === lastClearedStage + 1
  }

  const handleStageStart = () => {
    if (!canPlayStage(displayStage)) {
      if (displayStage <= lastClearedStage) {
        alert('이미 클리어한 스테이지입니다!')
      } else if (displayStage < currentStage) {
        alert('이미 지나간 스테이지입니다!')
      } else {
        alert('아직 잠겨있는 스테이지입니다!')
      }
      return
    }

    setGameStartTime(Date.now())
    setGameStarted(true)
  }

  const handleAdSkip = async () => {
    if (displayStage !== currentStage) {
      alert('현재 도전 가능한 스테이지만 스킵할 수 있습니다!')
      return
    }

    if (!confirm(`광고를 보고 스테이지 ${displayStage}을(를) 클리어하시겠습니까?`)) {
      return
    }

    alert('광고를 시청합니다... (준비 중)')

    const clearedStage = currentStage
    const newRp = (profile?.rp || 1000) + 1
    const newAdViews = (profile?.total_ad_views || 0) + 1

    try {
      await supabase
        .from('profiles')
        .update({
          solo_last_cleared_stage: clearedStage,
          rp: newRp,
          total_ad_views: newAdViews
        })
        .eq('id', userId)

      await supabase.from('game_results').insert({
        room_code: `RANKED-AD-CLEAR-${clearedStage}`,
        game_seed: clearedStage,
        winner_id: userId,
        loser_id: null,
        winner_moves: 0,
        loser_moves: 0,
        duration_seconds: 0,
        game_type: 'ad_clear'
      })

      // 프론트 상태 동기화
      setLastClearedStage(clearedStage)
      setDisplayStage(clearedStage + 1)
      setProfile({
        ...profile,
        rp: newRp,
        total_ad_views: newAdViews
      })

      alert(`🎉 스테이지 ${clearedStage} 클리어! +1 RP`)
    } catch (err) {
      console.error('저장 실패:', err)
      alert('저장에 실패했습니다.')
    }
  }

  const handleGameEnd = async (isWin: boolean) => {
    if (!isWin) {
      alert('실패... 다시 도전해보세요!')
      setGameStarted(false)
      return
    }

    const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000)

    // 클리어 처리
    const newRp = (profile?.rp || 1000) + 1
    const newLastCleared = currentStage
    try {
      // DB에 저장
      await supabase
        .from('profiles')
        .update({
          solo_last_cleared_stage: newLastCleared,
          rp: newRp
        })
        .eq('id', userId)

      // 게임 결과 기록
      await supabase.from('game_results').insert({
        room_code: `RANKED-${currentStage}`,
        game_seed: currentStage,
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

    setProfile({ ...profile, rp: newRp })

    setLastClearedStage(newLastCleared)
    setDisplayStage(newLastCleared + 1)
    setGameStarted(false)
    alert(`🎉 스테이지 ${currentStage} 클리어! +1 RP`)
  }

  const getRankName = (rp: number) => {
    if (rp >= 2000) return '🏆 그랜드마스터'
    if (rp >= 1800) return '💎 다이아몬드'
    if (rp >= 1600) return '💍 플래티넘'
    if (rp >= 1400) return '🥇 골드'
    if (rp >= 1200) return '🥈 실버'
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
          roomCode={`RANKED-${currentStage}`}
          gameSeed={currentStage}
          gameMode="ranked"  // 추가
          isPlayer1={true}
          onWin={handleGameEnd}
        />
      </div>
    )
  }

  const isCleared = displayStage <= lastClearedStage
  const isCurrent = displayStage === lastClearedStage + 1
  const isPast = displayStage < currentStage
  const isFuture = displayStage > lastClearedStage + 1

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
            {getRankName(profile?.rp || 1000)}
          </div>
          <div className="text-3xl font-bold text-yellow-600">
            {profile?.rp || 1000} RP
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {lastClearedStage}개 클리어
          </div>
        </div>

        {/* 매칭 게임 */}
        <div className="mb-6">
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
                {isCurrent && '⭐ 도전 가능'}
                {isPast && '✅ 클리어'}
                {isFuture && '🔒 잠김'}
              </div>
            </div>

            {/* 1개씩 다음 */}
            <button
              onClick={handleNextStage}
              className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl transition-colors"
              title="1개 다음"
            >
              ›
            </button>

            {/* 10개씩 다음 */}
            <button
              onClick={handleNext10Stage}
              className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-lg transition-colors"
              title="10개 다음"
            >
              »
            </button>
          </div>

          {/* 스테이지 정보 */}
          <div className={`p-6 rounded-lg border-2 ${isCleared
            ? 'bg-green-50 border-green-400'
            : isCurrent
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

            {isCurrent && (
              <div className="text-center mb-4">
                <span className="text-4xl">⭐</span>
                <p className="text-sm text-blue-700 font-medium mt-2">도전 가능</p>
              </div>
            )}

            {isFuture && (
              <div className="text-center mb-4">
                <span className="text-4xl">🔒</span>
                <p className="text-sm text-gray-600 font-medium mt-2">
                  이전 스테이지 클리어 필요
                </p>
              </div>
            )}

            {isPast && !isCleared && (
              <div className="text-center mb-4">
                <span className="text-4xl">⭕️</span>
                <p className="text-sm text-gray-600 font-medium mt-2">
                  지나간 스테이지
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleStageStart}
                disabled={!isCurrent}
                className={`w-full font-bold py-3 px-6 rounded-lg transition-colors ${isCurrent
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isCleared ? '이미 클리어함' : isCurrent ? '게임 시작' : '플레이 불가'}
              </button>

              {/* 광고 스킵 버튼 (현재 스테이지만) */}
              {isCurrent && (
                <button
                  onClick={handleAdSkip}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  📺 광고 보고 스킵하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>랭크 모드:</strong><br />
            • 스테이지를 순서대로 클리어하세요<br />
            • 클리어 시 +1 RP 획득<br />
            • 광고 스킵 시 RP 없음 (다음 스테이지만 해금)
          </p>
        </div>
      </div>
    </div>
  )
}