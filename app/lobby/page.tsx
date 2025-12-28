'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Lobby() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 로그인 확인
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/')
        return
      }
      
      setUser(session.user)
      
      // 프로필 가져오기
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profileData)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // 랜덤 방 코드 생성
  // const generateRoomCode = () => {
  //   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  //   let code = ''
  //   for (let i = 0; i < 6; i++) {
  //     code += chars.charAt(Math.floor(Math.random() * chars.length))
  //   }
  //   return code
  // }

  const generateRoomCode = () => {
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += Math.floor(Math.random() * 10) // 0~9
    }
    return code
  }


  // 방 만들기
  const createRoom = () => {
    const code = generateRoomCode()
    router.push(`/room/${code}`)
  }

  // 방 입장하기
  const joinRoom = () => {
    if (roomCode.trim().length === 0) {
      alert('방 코드를 입력해주세요!')
      return
    }
    router.push(`/room/${roomCode.toUpperCase()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {/* 상단: 프로필 정보 */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <p className="text-sm text-gray-500">환영합니다!</p>
            <p className="text-xl font-bold">{profile?.nickname || user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            로그아웃
          </button>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2">프리셀 대전</h1>
        <p className="text-center text-gray-600 mb-8">친구와 실시간 대결!</p>

        {/* 방 만들기 */}
        <div className="mb-6">
          <button
            onClick={createRoom}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
          >
            🎮 새 방 만들기
          </button>
          <p className="text-sm text-gray-500 text-center mt-2">
            방 코드가 자동으로 생성됩니다
          </p>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-gray-500">또는</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* 방 입장하기 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            방 코드 입력
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
            onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            placeholder="예: 483920"
            maxLength={6}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-bold tracking-wider uppercase focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={joinRoom}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🚪 방 입장하기
          </button>
        </div>

        {/* 안내 */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>사용 방법:</strong><br />
            1. 방을 만들고 친구에게 코드를 알려주세요<br />
            2. 친구가 같은 코드로 입장하면 게임 시작!
          </p>
        </div>
      </div>
    </div>
  )
}