'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Auth from '@/components/Auth'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        router.push('/lobby')
      }
    })

    // 로그인 / 로그아웃 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        router.push('/lobby')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      <Auth />

      <div style={{ position: 'fixed', bottom: 0 }}>
        ENV: {process.env.NODE_ENV}
      </div>

    </div>
  )
}
