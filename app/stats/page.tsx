'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Stats = {
  wins: number
  losses: number
  total_games: number
  win_rate: number
  avg_moves_when_win: number
}

type RecentGame = {
  id: string
  room_code: string
  created_at: string
  is_winner: boolean
  opponent_nickname: string
  moves: number
  duration_seconds: number
}

export default function StatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentGames, setRecentGames] = useState<RecentGame[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    const loadStats = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/')
        return
      }

      setUserId(session.user.id)

      // 통계 가져오기
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setStats(statsData)

      // 최근 게임 가져오기
      const { data: gamesData } = await supabase
        .from('game_results')
        .select(`
          id,
          room_code,
          created_at,
          winner_id,
          loser_id,
          winner_moves,
          loser_moves,
          duration_seconds,
          winner:profiles!game_results_winner_id_fkey(nickname),
          loser:profiles!game_results_loser_id_fkey(nickname)
        `)
        .or(`winner_id.eq.${session.user.id},loser_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
        .limit(10)

      const formatted = gamesData?.map((game: any) => ({
        id: game.id,
        room_code: game.room_code,
        created_at: game.created_at,
        is_winner: game.winner_id === session.user.id,
        opponent_nickname: game.winner_id === session.user.id 
          ? game.loser.nickname 
          : game.winner.nickname,
        moves: game.winner_id === session.user.id 
          ? game.winner_moves 
          : game.loser_moves,
        duration_seconds: game.duration_seconds
      })) || []

      setRecentGames(formatted)
      setLoading(false)
    }

    loadStats()
  }, [router])

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
          <h1 className="text-4xl font-bold mb-6 text-center">내 전적</h1>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats?.wins || 0}
              </div>
              <div className="text-sm text-gray-600">승리</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-red-600">
                {stats?.losses || 0}
              </div>
              <div className="text-sm text-gray-600">패배</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats?.total_games || 0}
              </div>
              <div className="text-sm text-gray-600">총 게임</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {stats?.win_rate || 0}%
              </div>
              <div className="text-sm text-gray-600">승률</div>
            </div>
          </div>

          {/* 최근 게임 */}
          <div>
            <h2 className="text-2xl font-bold mb-4">최근 게임</h2>
            {recentGames.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                아직 게임 기록이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {recentGames.map((game) => (
                  <div
                    key={game.id}
                    className={`p-4 rounded-lg border-2 ${
                      game.is_winner
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold">
                          {game.is_winner ? '🏆 승리' : '😢 패배'}
                        </div>
                        <div className="text-sm text-gray-600">
                          vs {game.opponent_nickname}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div>이동: {game.moves}회</div>
                        <div className="text-gray-500">
                          {Math.floor(game.duration_seconds / 60)}분 {game.duration_seconds % 60}초
                        </div>
                        <div className="text-gray-400 text-xs">
                          {new Date(game.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}