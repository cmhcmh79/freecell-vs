'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      setUser(session.user)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(profileData)
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const handleDisabledClick = (feature: string) => {
    alert(`${feature}은(는) 회원만 이용 가능합니다.\n로그인 후 이용해주세요!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    )
  }

  const isLoggedIn = !!user
  const displayName = isLoggedIn ? (profile?.nickname || user?.email) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {/* 프로필 정보 */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            {isLoggedIn ? (
              <>
                <p className="text-sm text-gray-500">환영합니다!</p>
                <p className="text-xl font-bold">{displayName}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">프리셀 대전</p>
                <p className="text-xl font-bold">일반 사용자</p>
              </>
            )}
          </div>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
            >
              로그인
            </button>
          )}
        </div>

        <h1 className="text-4xl font-bold text-center mb-2">프리셀 대전</h1>
        <p className="text-center text-gray-600 mb-8">게임 모드를 선택하세요</p>

        {/* 게임 모드 버튼들 */}
        <div className="space-y-3">
          {/* 랭크 모드 */}
          <button
            onClick={() => {
              if (isLoggedIn) {
                router.push('/ranked')
              } else {
                handleDisabledClick('랭크 모드')
              }
            }}
            disabled={!isLoggedIn}
            className={`w-full font-bold py-4 px-6 rounded-lg text-xl transition-colors relative ${
              isLoggedIn
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            🏆 랭크 모드
            {!isLoggedIn && (
              <span className="absolute top-2 right-2 text-xs bg-red-500 text-white px-2 py-1 rounded">
                회원 전용
              </span>
            )}
          </button>

          {/* 솔로 모드 */}
          <button
            onClick={() => router.push('/solo')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
          >
            🎯 솔로 모드
          </button>

          {/* 친구와 대결 */}
          <button
            onClick={() => router.push('/versus')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
          >
            👥 친구와 대결
          </button>

          {/* 랭킹 */}
          <button
            onClick={() => router.push('/leaderboard')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
          >
            📊 랭킹
          </button>

          {/* 내 전적 */}
          <button
            onClick={() => {
              if (isLoggedIn) {
                router.push('/stats')
              } else {
                handleDisabledClick('내 전적')
              }
            }}
            disabled={!isLoggedIn}
            className={`w-full font-bold py-4 px-6 rounded-lg text-xl transition-colors relative ${
              isLoggedIn
                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            📈 내 전적
            {!isLoggedIn && (
              <span className="absolute top-2 right-2 text-xs bg-red-500 text-white px-2 py-1 rounded">
                회원 전용
              </span>
            )}
          </button>
        </div>

        {/* 안내 */}
        {!isLoggedIn && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>회원 전용 기능:</strong> 랭크 모드, 내 전적<br />
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-800 font-semibold underline mt-2 inline-block"
              >
                로그인/회원가입하고 모든 기능 이용하기 →
              </button>
            </p>
          </div>
        )}

        {isLoggedIn && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              💡 <strong>팁:</strong><br />
              • <strong>랭크 모드:</strong> 실시간 매칭으로 레이팅 획득<br />
              • <strong>솔로 모드:</strong> 혼자서 실력 연마<br />
              • <strong>친구와 대결:</strong> 방 코드로 친구 초대
            </p>
          </div>
        )}
      </div>
    </div>
  )
}