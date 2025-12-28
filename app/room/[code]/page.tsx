'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FreeCellGame from '@/components/FreeCellGame'

type User = {
  id: string
  ready: boolean
}

export default function Room() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code as string

  const [users, setUsers] = useState<User[]>([])
  const [myId] = useState(() => Math.random().toString(36).substring(7))
  const [isReady, setIsReady] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSeed, setGameSeed] = useState<number | null>(null)

  useEffect(() => {
    const channel = supabase.channel(`room-${roomCode}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const userList: User[] = []
        
        Object.keys(state).forEach(key => {
          const presence = state[key][0] as any
          userList.push({
            id: presence.user_id,
            ready: presence.ready || false
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
      }
    }
  }

  const leaveRoom = () => {
    router.push('/lobby')
  }

  if (gameStarted && gameSeed !== null) {
    return (
      

<div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900">
        <FreeCellGame
          roomCode={roomCode}
          gameSeed={gameSeed}
          isPlayer1={users[0]?.id === myId}
          onWin={(isMe) => {
            alert(isMe ? '🎉 승리!' : '😢 패배...')
            router.push('/lobby')
          }}
        />
      </div>
    )
  }

  return (
    

<div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      

<div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        

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

          <button
            onClick={leaveRoom}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            방 나가기
          </button>
        </div>

        {/* 안내 */}
        

<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 친구에게 방 코드 <strong>{roomCode}</strong>를 알려주세요!
          </p>
        </div>
      </div>
    </div>
  )
}