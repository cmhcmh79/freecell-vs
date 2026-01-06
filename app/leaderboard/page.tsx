'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type LeaderboardEntry = {
  id: string
  nickname: string
  rp: number
  solo_last_cleared_stage: number
  total_ad_views: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'rp' | 'solo_last_cleared_stage' | 'total_ad_views'>('rp')

  useEffect(() => {
    loadLeaderboard()
  }, [sortBy])

  const loadLeaderboard = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, rp, solo_last_cleared_stage, total_ad_views')
      .order(sortBy, { ascending: false })
      .limit(50)

    if (error) {
      console.error('Leaderboard 로드 에러:', error)
    } else {
      console.log('Leaderboard 데이터:', data)
    }

    setLeaderboard(data || [])
    setLoading(false)
  }

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 p-4">
      <div className="max-w-4xl mx-auto">
 
        

        <div className="bg-white rounded-lg shadow-2xl p-8">


         {/* 뒤로가기 */}
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


          <h1 className="text-4xl font-bold mb-6 text-center">🏆 리더보드</h1>

          {/* 정렬 버튼 */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setSortBy('rp')}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                sortBy === 'rp'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              RP 순
            </button>
            <button
              onClick={() => setSortBy('solo_last_cleared_stage')}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                sortBy === 'solo_last_cleared_stage'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Stage 순
            </button>
            <button
              onClick={() => setSortBy('total_ad_views')}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                sortBy === 'total_ad_views'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              광고 시청 순
            </button>
          </div>

          {/* 리더보드 테이블 */}
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              아직 기록이 없습니다
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-3 px-2 text-left">순위</th>
                    <th className="py-3 px-2 text-left">닉네임</th>
                    <th className="py-3 px-2 text-center">RP</th>
                    <th className="py-3 px-2 text-center">최고 Stage</th>
                    <th className="py-3 px-2 text-center">광고 시청</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        index < 3 ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="py-3 px-2 font-bold text-lg">
                        {getRankEmoji(index)}
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {entry.nickname || '익명'}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-yellow-600">
                        {entry.rp}
                      </td>
                      <td className="py-3 px-2 text-center text-green-600 font-bold">
                        {entry.solo_last_cleared_stage}
                      </td>
                      <td className="py-3 px-2 text-center text-blue-600">
                        {entry.total_ad_views}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}