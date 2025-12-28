'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RealtimeTest() {
  // 컴포넌트의 상태를 관리하는 state 변수들
  const [connected, setConnected] = useState(false) // 실시간 서버 연결 상태
  const [message, setMessage] = useState('') // 현재 입력 중인 메시지
  const [messages, setMessages] = useState<string[]>([]) // 수신된 메시지 목록
  const [onlineUsers, setOnlineUsers] = useState(0) // 현재 접속 중인 사용자 수

  useEffect(() => {
    // 'test-room'이라는 이름의 Supabase 실시간 채널을 생성하거나 가져옵니다.
    const channel = supabase.channel('test-room')

    // 채널 이벤트 리스너 설정
    channel
      // Presence: 채널에 접속한 사용자들의 상태 변경을 감지합니다.
      .on('presence', { event: 'sync' }, () => {
        // 'sync' 이벤트는 접속자 목록에 변경이 있을 때마다 발생합니다.
        const state = channel.presenceState()
        setOnlineUsers(Object.keys(state).length)
      })
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload.text])
      })
      // 채널 구독을 시작합니다.
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          // Presence를 통해 현재 클라이언트의 접속 상태를 다른 클라이언트에게 알립니다.
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    // 컴포넌트가 언마운트될 때 실행될 클린업(정리) 함수입니다.
    return () => {
      // 생성했던 채널을 정리하여 리소스 누수를 방지합니다.
      supabase.removeChannel(channel)
    }
  }, [])

  // 메시지 전송 함수
  const sendMessage = () => {
    // 입력된 메시지가 공백뿐이라면 전송하지 않습니다.
    if (!message.trim()) return

    // 'test-room' 채널을 통해 메시지를 broadcast 합니다.
    supabase.channel('test-room').send({
      type: 'broadcast',
      event: 'message',
      payload: { text: message }
    })

    // 메시지 전송 후 입력창을 비웁니다.
    setMessage('')
  }

  return (
    

<div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 p-8">
      

<div className="max-w-2xl mx-auto bg-white rounded-lg shadow-2xl p-6">
        <h1 className="text-3xl font-bold mb-4">실시간 통신 테스트</h1>
        
        

<div className="mb-4 flex gap-4">
          

<div className={`px-4 py-2 rounded ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
            {connected ? '✅ 연결됨' : '🔄 연결 중...'}
          </div>
          

<div className="px-4 py-2 rounded bg-blue-100 text-blue-700">
            👥 접속자: {onlineUsers}명
          </div>
        </div>

        

<div className="mb-4 p-4 bg-gray-50 rounded h-64 overflow-y-auto">
          <h2 className="font-bold mb-2">메시지 (실시간)</h2>
          {messages.length === 0 ? (
            <p className="text-gray-400">메시지를 보내보세요!</p>
          ) : (
            messages.map((msg, i) => (
              

<div key={i} className="mb-2 p-2 bg-white rounded shadow-sm">
                {msg}
              </div>
            ))
          )}
        </div>

        

<div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="메시지 입력..."
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold"
          >
            전송
          </button>
        </div>

        

<div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            💡 <strong>테스트 방법:</strong> 이 페이지를 2개의 브라우저 창에서 열어보세요! 
            (또는 시크릿 모드로) 메시지가 실시간으로 동기화되는 것을 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}