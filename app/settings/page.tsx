'use client'

import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        
        {/* 헤더 */}
        <div className="mb-6 pb-4 border-b">
          <h1 className="text-3xl font-bold">⚙️ 설정</h1>
          <p className="text-sm text-gray-500 mt-1">Settings</p>
        </div>

        {/* 공사중 표시 */}
        <div className="py-8">
          <div className="text-6xl mb-4">🚧</div>
          <p className="text-xl font-bold mb-2">공사중입니다</p>
          <p className="text-gray-600">
            설정 기능을 준비하고 있어요.<br />
            곧 업데이트될 예정입니다!
          </p>
        </div>

        {/* 하단 버튼 */}
        <button
          onClick={() => router.back()}
          className="mt-6 w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          ← 이전 화면으로
        </button>
      </div>
    </div>
  )
}
