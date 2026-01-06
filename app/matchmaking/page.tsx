'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FreeCellGame from '@/components/FreeCellGame'
import DebugLogPanel from '@/components/DebugLogPanel'
import { debugLogger } from '@/utils/debugLogger'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { IS_DEV } from '@/config/env'

type QueueUser = {
    user_id: string
    nickname: string
    rp: number
    joined_at: number
}

export default function MatchmakingPage() {
    const router = useRouter()
    const [inQueue, setInQueue] = useState(false)
    const [queueTime, setQueueTime] = useState(0)
    const [myRp, setMyRp] = useState(0)
    const [myNickname, setMyNickname] = useState('')
    const [userId, setUserId] = useState('')

    // 게임 상태
    const [gameStarted, setGameStarted] = useState(false)
    const [gameSeed, setGameSeed] = useState<number | null>(null)
    const [roomCode, setRoomCode] = useState<string>('')
    const [opponentId, setOpponentId] = useState<string>('')
    const [gameStartTime, setGameStartTime] = useState(0)
    const [isPlayer1, setIsPlayer1] = useState(false)

    const matchedRef = useRef(false)
    const gameEndedRef = useRef(false)

    const gameChannelRef = useRef<RealtimeChannel | null>(null)
    const gameChannelReadyRef = useRef(false)
    const autoJoinedRef = useRef(false)

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
                .select('rp, nickname')
                .eq('id', session.user.id)
                .single()

            setMyRp(profile?.rp || 1000)
            setMyNickname(profile?.nickname || '')
        }

        init()
    }, [router])

    useEffect(() => {
        if (!userId) return
        if (autoJoinedRef.current) return

        autoJoinedRef.current = true
        joinQueue()
    }, [userId])


    useEffect(() => {
        if (!inQueue || !userId || matchedRef.current) return

        const channel = supabase.channel('matchmaking-queue')

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const users: QueueUser[] = []

                Object.keys(state).forEach(key => {
                    const presence = state[key][0] as any
                    users.push({
                        user_id: presence.user_id,
                        nickname: presence.nickname,
                        rp: presence.rp,
                        joined_at: presence.joined_at
                    })
                })

                if (!matchedRef.current) {
                    tryMatch(users)
                }
            })
            .on('broadcast', { event: 'match-found' }, ({ payload }) => {
                if (payload.player2_id === userId && !matchedRef.current) {
                    matchedRef.current = true
                    startGame(payload.room_code, payload.seed, payload.opponent_id, false)
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: userId,
                        nickname: myNickname,
                        rp: myRp,
                        joined_at: Date.now()
                    })
                }
            })

        const timer = setInterval(() => {
            setQueueTime(prev => prev + 1)
        }, 1000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(timer)
        }
    }, [inQueue, userId, myRp, myNickname])

    // 게임 중 game-over 이벤트 리스닝
    useEffect(() => {
        if (!gameStarted || !roomCode) return

        if (gameChannelRef.current) return

        console.log(`Creating game channel: game-${roomCode}`)
        const gameChannel = supabase.channel(`game-${roomCode}`)
        gameChannelRef.current = gameChannel

        gameChannel
            .on('broadcast', { event: 'game-over' }, ({ payload }) => {
                console.log('game-over received:', payload)
                if (payload.winner_id === userId) return // 내가 보낸 건 무시

                // 상대방이 이겼다는 신호를 받음
                if (payload.loser_id === userId && !gameEndedRef.current) {
                    gameEndedRef.current = true
                    handleGameEnd(false)
                }
            })
            .subscribe((status) => {
                console.log('Game channel status:', status)
                if (status === 'SUBSCRIBED') {
                    gameChannelReadyRef.current = true
                }
            })

        return () => {
            console.log('Cleaning up game channel')
            if (gameChannelRef.current) {
                supabase.removeChannel(gameChannelRef.current)
                gameChannelRef.current = null
            }
        }
    }, [gameStarted, roomCode, userId])

    const tryMatch = async (users: QueueUser[]) => {
        if (users.length < 2 || matchedRef.current) return

        const others = users.filter(u => u.user_id !== userId)
        if (others.length === 0) return

        const sorted = others.sort((a, b) =>
            Math.abs(a.rp - myRp) - Math.abs(b.rp - myRp)
        )

        const opponent = sorted[0]

        matchedRef.current = true

        const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
        const seed = Math.floor(Math.random() * 1000000)

        const channel = supabase.channel('matchmaking-queue')
        await channel.send({
            type: 'broadcast',
            event: 'match-found',
            payload: {
                player2_id: opponent.user_id,
                room_code: code,
                seed: seed,
                opponent_id: userId
            }
        })

        startGame(code, seed, opponent.user_id, true)
    }

    const startGame = (code: string, seed: number, oppId: string, isP1: boolean) => {
        setRoomCode(code)
        setGameSeed(seed)
        setOpponentId(oppId)
        setIsPlayer1(isP1)
        setGameStartTime(Date.now())
        setInQueue(false)
        setGameStarted(true)
        gameChannelReadyRef.current = false
        gameEndedRef.current = false
    }

    const handleGameEnd = async (isMe: boolean) => {
        debugLogger.log('handleGameEnd isMe : ' + isMe)

        if (gameEndedRef.current) {
            console.log('Already ended, skipping')
            return
        }
        gameEndedRef.current = true

        const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000)

        // 상대방에게 게임 종료 알림 (승자만 보냄)
        if (isMe && gameChannelRef.current && gameChannelReadyRef.current) {
            console.log('Sending game-over event to opponent')
            await gameChannelRef.current.send({
                type: 'broadcast',
                event: 'game-over',
                payload: {
                    winner_id: userId,
                    loser_id: opponentId
                }
            })

            // 약간의 딜레이 후 cleanup (메시지가 전송될 시간을 줌)
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        if (isMe) {
            try {
                const { data: gameResult, error: gameError } = await supabase
                    .from('game_results')
                    .insert({
                        room_code: roomCode,
                        game_seed: gameSeed,
                        winner_id: userId,
                        loser_id: opponentId,
                        winner_moves: 0,
                        loser_moves: 0,
                        duration_seconds: durationSeconds,
                        game_type: 'pvp'
                    })
                    .select()
                    .single()

                if (gameError) throw gameError

                // 내 점수 +10
                const { data: myProfile } = await supabase
                    .from('profiles')
                    .select('rp')
                    .eq('id', userId)
                    .single()

                const newRp = (myProfile?.rp || 1000) + 10

                await supabase
                    .from('profiles')
                    .update({ rp: newRp })
                    .eq('id', userId)

                await supabase.from('rating_history').insert({
                    user_id: userId,
                    game_type: 'pvp',
                    rating_change: 10,
                    old_rating: myProfile?.rp || 1000,
                    new_rating: newRp,
                    game_result_id: gameResult.id
                })

                // 상대 점수 -10
                const { data: oppProfile } = await supabase
                    .from('profiles')
                    .select('rp')
                    .eq('id', opponentId)
                    .single()

                const oppNewRp = Math.max(0, (oppProfile?.rp || 1000) - 10)

                await supabase
                    .from('profiles')
                    .update({ rp: oppNewRp })
                    .eq('id', opponentId)

                await supabase.from('rating_history').insert({
                    user_id: opponentId,
                    game_type: 'pvp',
                    rating_change: -10,
                    old_rating: oppProfile?.rp || 1000,
                    new_rating: oppNewRp,
                    game_result_id: gameResult.id
                })

                alert(`🎉 승리! +10 RP (${myProfile?.rp} → ${newRp})`)
            } catch (err) {
                console.error('결과 저장 실패:', err)
                alert('🎉 승리!')
            }
        } else {
            // 패배
            const { data: myProfile } = await supabase
                .from('profiles')
                .select('rp')
                .eq('id', userId)
                .single()

            const oldRp = myProfile?.rp || 1000
            const newRp = Math.max(0, oldRp - 10)

            alert(`😢 패배... -10 RP (${oldRp} → ${newRp})`)
        }

        if (isMe) {
            setTimeout(() => router.push('/ranked'), 2000)
        } else {
            router.push('/ranked')
        }

    }

    const joinQueue = () => {
        setInQueue(true)
        setQueueTime(0)
        matchedRef.current = false
        gameEndedRef.current = false
        gameChannelReadyRef.current = false
    }

    const leaveQueue = () => {
        setInQueue(false)
        setQueueTime(0)
        matchedRef.current = false
    }

    const getRankName = (rp: number) => {
        if (rp >= 2000) return '🏆 그랜드마스터'
        if (rp >= 1800) return '💎 다이아몬드'
        if (rp >= 1600) return '💍 플래티넘'
        if (rp >= 1400) return '🥇 골드'
        if (rp >= 1200) return '🥈 실버'
        return '🥉 브론즈'
    }

    // 게임 화면
    if (gameStarted && gameSeed !== null) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900">
                <FreeCellGame
                    roomCode={roomCode}
                    gameSeed={gameSeed}
                    gameMode="matchmaking"  // 추가
                    isPlayer1={isPlayer1}
                    onWin={handleGameEnd}
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
                {/* 헤더 */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/ranked')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">뒤로가기</span>
                    </button>
                </div>

                <h1 className="text-4xl font-bold text-center mb-6">랭크 게임</h1>

                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg">
                    <div className="text-center">
                        <div className="text-2xl font-bold mb-2">{getRankName(myRp)}</div>
                        <div className="text-3xl font-bold text-yellow-700">{myRp} RP</div>
                        <div className="text-sm text-gray-600 mt-1">{myNickname}</div>
                    </div>
                </div>

                {!inQueue ? (
                    <>
                        <button
                            onClick={joinQueue}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors mb-4"
                        >
                            상대 찾기
                        </button>

                    </>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4 animate-pulse">🔍</div>
                            <div className="text-2xl font-bold mb-2">상대 찾는 중...</div>
                            <div className="text-gray-600">
                                대기 시간: {Math.floor(queueTime / 60)}:{(queueTime % 60).toString().padStart(2, '0')}
                            </div>
                        </div>

                        <button
                            onClick={leaveQueue}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg"
                        >
                            취소
                        </button>
                    </>
                )}
            </div>

            {IS_DEV && <DebugLogPanel />}

        </div>
    )
}