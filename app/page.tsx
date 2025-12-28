'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const testConnection = async () => {
      try {
        await supabase.auth.getSession()
        setConnected(true)
      } catch {
        setConnected(false)
      }
    }

    testConnection()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl bg-white p-10 text-center shadow-2xl">
        
        {/* 타이틀 */}
        <h1 className="mb-4 text-5xl font-extrabold text-green-800">
          🃏 대전 프리셀
        </h1>

        {/* 설명 */}
        <p className="mb-8 text-lg text-gray-600">
          실시간으로 즐기는 프리셀 대전 게임
        </p>

        {/* 메인 버튼 */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push('/lobby')}
            className="rounded-xl bg-green-600 py-4 text-xl font-bold text-white hover:bg-green-700 transition"
          >
            🎮 대전 시작하기
          </button>

          <button
            onClick={() => router.push('/uitest')}
            className="rounded-xl border border-gray-300 py-3 text-gray-600 hover:bg-gray-100 transition"
          >
            🧪 UI 테스트 9999 222 9999
          </button>
        </div>

        {/* 상태 표시 */}
        <div className="mt-8 text-sm text-gray-400">
          서버 상태 :
          {connected ? (
            <span className="ml-2 text-green-600 font-semibold">● Online</span>
          ) : (
            <span className="ml-2 text-red-500 font-semibold">● Offline</span>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-400">테스트</div>
      </div>
    </main>
  )
}
