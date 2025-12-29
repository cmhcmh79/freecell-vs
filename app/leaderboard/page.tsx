'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type LeaderboardEntry = {
  id: string
  nickname: string
  wins: number
  losses: number
  total_games: number
  win_rate: number
  avg_moves_when_win: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'win_rate' | 'wins' | 'total_games'>('win_rate')

  useEffect(() => {
    loadLeaderboard()
  }, [sortBy])

  const loadLeaderboard = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .gte('total_games', 1)  // 최소 1게임 이상 한 사람만
      .order(sortBy, { ascending: false })
      .limit(50)

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
        <div className="mb-4">
          <button
            onClick={() => router.push('/lobby')}
            className="text-white hover:underline"
          >
            ← 로비로 돌아가기
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h1 className="text-4xl font-bold mb-6 text-center">🏆 리더보드</h1>

          {/* 정렬 버튼 */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setSortBy('win_rate')}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                sortBy === 'win_rate'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              승률 순
            </button>
            <button
              onClick={() => setSortBy('wins')}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                sortBy === 'wins'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              승리 순
            </button>
            <button
              onClick={() => setSortBy('total_games')}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                sortBy === 'total_games'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              게임 수 순
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
                    <th className="py-3 px-2 text-center">승률</th>
                    <th className="py-3 px-2 text-center">승</th>
                    <th className="py-3 px-2 text-center">패</th>
                    <th className="py-3 px-2 text-center">총 게임</th>
                    <th className="py-3 px-2 text-center">평균 이동</th>
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
                        {entry.win_rate}%
                      </td>
                      <td className="py-3 px-2 text-center text-green-600 font-bold">
                        {entry.wins}
                      </td>
                      <td className="py-3 px-2 text-center text-red-600">
                        {entry.losses}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {entry.total_games}
                      </td>
                      <td className="py-3 px-2 text-center text-blue-600">
                        {entry.avg_moves_when_win || '-'}
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