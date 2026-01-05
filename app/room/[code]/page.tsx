'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FreeCellGame from '@/components/FreeCellGame'

type User = {
  id: string
  ready: boolean
  userId: string
}

export default function Room() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code as string

  const [users, setUsers] = useState<User[]>([])
  const [myId] = useState(() => Math.random().toString(36).substring(7))
  // const [myUserId, setMyUserId] = useState<string>('')
  const [isReady, setIsReady] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSeed, setGameSeed] = useState<number | null>(null)
  const [gameStartTime, setGameStartTime] = useState<number>(0)

  useEffect(() => {
    
    // 현재 로그인 사용자 확인
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      // if (!session?.user) {
      //   router.push('/')
      //   return
      // }
      // setMyUserId(session.user.id)
    }
    checkAuth()

    const channel = supabase.channel(`room-${roomCode}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const userList: User[] = []
        
        Object.keys(state).forEach(key => {
          const presence = state[key][0] as any
          userList.push({
            id: presence.user_id,
            ready: presence.ready || false,
            userId: presence.supabase_user_id || ''
          })
        })

        setUsers(userList)

        // 3명 이상이면 거부
        if (userList.length > 2) {
          alert('방이 가득 찼습니다!')
          router.push('/lobby')
        }
      })
      .on('broadcast', { event: 'start-game' }, ({ payload }) => {
        setGameSeed(payload.seed)
        setGameStarted(true)
        setGameStartTime(Date.now())  // 게임 시작 시간 기록
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: myId,
            ready: false
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomCode, myId, router])

  const toggleReady = async () => {
    const newReady = !isReady
    setIsReady(newReady)

    const channel = supabase.channel(`room-${roomCode}`)
    await channel.track({
      user_id: myId,
      ready: newReady
    })

    // 2명 모두 준비 완료 시 게임 시작
    if (newReady && users.length === 2) {
      const otherUser = users.find(u => u.id !== myId)
      if (otherUser?.ready) {
        // 게임 시작 신호 전송
        const seed = Math.floor(Math.random() * 1000000)
        await channel.send({
          type: 'broadcast',
          event: 'start-game',
          payload: { seed }
        })

        // 본인도 게임 시작 (추가!)
        setGameSeed(seed)
        setGameStarted(true)
        setGameStartTime(Date.now())           
      }
    }
  }

  const leaveRoom = () => {
    router.push('/lobby')
  }

  // 게임 종료 처리 (수정)
  const handleGameEnd = async (isMe: boolean) => {
    console.log("handleGameEnd called with isMe")
    
    // const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000)
    
    // 상대방 찾기
    // const opponent = users.find(u => u.id !== myId)
    // if (!opponent || !gameSeed) return

    // // 게임 결과 저장 (승자만 저장 - 중복 방지)
    // if (isMe) {
    //   try {
    //     const { error } = await supabase.from('game_results').insert({
    //       room_code: roomCode,
    //       game_seed: gameSeed,
    //       winner_id: myUserId,
    //       loser_id: opponent.userId,
    //       winner_moves: 0,  // TODO: 실제 이동 횟수로 교체
    //       loser_moves: 0,   // TODO: 실제 이동 횟수로 교체
    //       duration_seconds: durationSeconds
    //     })

    //     if (error) {
    //       console.error('결과 저장 실패:', error)
    //     }
    //   } catch (err) {
    //     console.error('결과 저장 오류:', err)
    //   }
    // }

    alert(isMe ? '🎉 승리!' : '😢 패배...')
    router.push('/versus')
  }




  if (gameStarted && gameSeed !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900">
        <FreeCellGame
          roomCode={roomCode}
          gameSeed={gameSeed}
          isPlayer1={users[0]?.id === myId}
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
    onClick={() => router.back()}
    className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
  >
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
    <span className="text-sm font-medium">뒤로가기</span>
  </button>
</div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">대기실</h1>
          <div className="inline-block bg-gray-100 px-6 py-2 rounded-lg">
            <span className="text-sm text-gray-600">방 코드</span>
            <div className="text-3xl font-bold tracking-wider">{roomCode}</div>
          </div>
        </div>

        {/* 플레이어 목록 */}
        <div className="mb-6">
          <h2 className="font-bold mb-3">플레이어 ({users.length}/2)</h2>
          <div className="space-y-2">
            {users.map((user, index) => (
              <div
                key={user.id}
                className={`p-4 rounded-lg border-2 ${
                  user.id === myId
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {index === 0 ? '👤' : '👥'}
                    </span>
                    <span className="font-medium">
                      플레이어 {index + 1}
                      {user.id === myId && ' (나)'}
                    </span>
                  </div>
                  <div>
                    {user.ready ? (
                      <span className="text-green-600 font-bold">✓ 준비완료</span>
                    ) : (
                      <span className="text-gray-400">대기중...</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {users.length < 2 && (
              <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center text-gray-400">
                    상대방을 기다리는 중...
              </div>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="space-y-3">
          <button
            onClick={toggleReady}
            disabled={users.length < 2}
            className={`w-full font-bold py-3 rounded-lg transition-colors ${
              isReady
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
            }`}
          >
            {isReady ? '준비 취소' : '준비 완료'}
          </button>


        </div>

        {/* 안내 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            myId : {myId}<br/>
            roomCode : {roomCode}<br/>
            gameSeed : {gameSeed}<br/>
            gameStartTime : {gameStartTime}<br/>
            gameStarted : {gameStarted}<br/>
            users : {JSON.stringify(users)}<br/>
            isReady : {isReady}<br/> 
          </p>
        </div>

      </div>
    </div>
  )
}