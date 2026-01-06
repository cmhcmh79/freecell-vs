'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // 이미 로그인된 경우 메인으로
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        router.push('/')
      }
    }
    checkAuth()
  }, [router])


  /* ======================
     회원가입
  ====================== */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // 1. 닉네임 중복 체크 (기존 로직)
      const { data: nickCheck } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('nickname', nickname)
        .maybeSingle() // single() 대신 maybeSingle()이 에러 처리에 더 유연합니다

      if (nickCheck) throw new Error('이미 사용 중인 닉네임입니다.')

      // 2. [추가] 이메일 중복 체크 (profiles 테이블 기준)
      const { data: emailCheck } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle()

      if (emailCheck) throw new Error('이미 등록된 이메일 주소입니다.')

      // 3. Auth 회원가입 시도
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname }
        }
      })

      if (authError) throw authError

      // 만약 이메일 인증이 꺼져있는데도 중복 가입이 된다면
      // authData.user?.identities가 빈 배열인지 확인하는 방법도 있습니다.
      if (authData.user?.identities?.length === 0) {
        throw new Error('이미 가입된 이메일입니다. 로그인을 시도하세요.')
      }

      setMessage('회원가입 성공! 이메일 인증을 완료해주세요.')
      // ... 생략
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setMessage('로그인 성공!')

      // 메인으로 이동
      router.push('/')
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
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

        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">♠️</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isLogin ? '로그인' : '회원가입'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? '계정에 로그인하세요' : '새 계정을 만드세요'}
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              placeholder="최소 6자"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                placeholder="게임에서 사용할 이름"
              />
            </div>
          )}

          {message && (
            <div className={`text-sm p-3 rounded-lg ${message.includes('성공')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
              }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
          </button>
        </form>

        {/* 전환 버튼 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setMessage('')
            }}
            className="text-green-600 hover:text-green-800 font-medium hover:underline"
          >
            {isLogin ? '회원가입 하기' : '로그인 하기'}
          </button>
        </div>

        {/* 안내 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            💡 <strong>회원가입 시 혜택:</strong><br />
            • 랭크 게임 참여 및 레이팅 시스템<br />
            • 전적 기록 및 순위 등록<br />
            • 포인트 획득 및 보상 시스템
          </p>
        </div>
      </div>
    </div>
  )
}