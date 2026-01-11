// components/RewardAdModal.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'

interface RewardAdModalProps {
    isOpen: boolean
    onClose: () => void
    onRewardEarned: () => void
    rewardDescription?: string
}

// YouTube IFrame API 타입 선언
declare global {
    interface Window {
        YT: any
        onYouTubeIframeAPIReady: () => void
        youtubeApiReady?: boolean
    }
}

export default function RewardAdModal({
    isOpen,
    onClose,
    onRewardEarned,
    rewardDescription = '스테이지 스킵'
}: RewardAdModalProps) {
    const [timeLeft, setTimeLeft] = useState(30)
    const [canSkip, setCanSkip] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [adClosed, setAdClosed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)
    const playerRef = useRef<any>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // 임베드 가능한 유튜브 영상 ID 목록
    const youtubeVideoIds = [
        '_9vgaBtKBsQ', // 예시 영상
        '4wS9_gI1dYw',
        'r5djepjmrDo',
    ]

    const [currentVideoId, setCurrentVideoId] = useState('')

    // YouTube API 전역 로드 (앱 전체에서 한 번만)
    useEffect(() => {
        if (typeof window === 'undefined') return

        // 이미 API가 로드되어 있으면 스킵
        if (window.youtubeApiReady || document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            return
        }

        console.log('Loading YouTube IFrame API...')

        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        tag.async = true

        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

        // API 로드 완료 콜백 (전역에서 한 번만 설정)
        window.onYouTubeIframeAPIReady = () => {
            console.log('YouTube IFrame API Ready!')
            window.youtubeApiReady = true
        }
    }, [])

    // 모달 열릴 때 플레이어 초기화
    useEffect(() => {
        if (!isOpen) {
            // 모달 닫힐 때 정리
            if (playerRef.current) {
                try {
                    playerRef.current.destroy()
                } catch (e) {
                    console.error('Player destroy error:', e)
                }
                playerRef.current = null
            }
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current)
                loadTimeoutRef.current = null
            }
            setTimeLeft(30)
            setCanSkip(false)
            setIsPlaying(false)
            setAdClosed(false)
            setIsLoading(true)
            setLoadError(false)
            setCurrentVideoId('')
            return
        }

        // 모달 열릴 때 랜덤 영상 선택
        const randomVideoId = youtubeVideoIds[Math.floor(Math.random() * youtubeVideoIds.length)]
        setCurrentVideoId(randomVideoId)
        setIsLoading(true)
        setLoadError(false)

        console.log('Modal opened, selected video:', randomVideoId)

        // 15초 타임아웃 설정
        loadTimeoutRef.current = setTimeout(() => {
            console.error('YouTube player loading timeout')
            setLoadError(true)
            setIsLoading(false)
        }, 15000)

        // 플레이어 생성 함수
        const createPlayer = () => {
            console.log('Creating YouTube player...')

            // 기존 플레이어가 있으면 제거
            if (playerRef.current) {
                try {
                    playerRef.current.destroy()
                } catch (e) {
                    console.error('Error destroying old player:', e)
                }
                playerRef.current = null
            }

            // 플레이어 컨테이너 확인
            const container = document.getElementById('youtube-player')
            if (!container) {
                console.error('Player container not found')
                setTimeout(createPlayer, 100)
                return
            }

            try {
                playerRef.current = new window.YT.Player('youtube-player', {
                    height: '360',
                    width: '640',
                    videoId: randomVideoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        modestbranding: 1,
                        rel: 0,
                        mute: 1,
                    },
                    events: {
                        onReady: (event: any) => {
                            console.log('YouTube player ready')
                            setIsLoading(false)
                            if (loadTimeoutRef.current) {
                                clearTimeout(loadTimeoutRef.current)
                                loadTimeoutRef.current = null
                            }
                            event.target.playVideo()
                            // 1초 후 음소거 해제
                            setTimeout(() => {
                                try {
                                    event.target.unMute()
                                } catch (e) {
                                    console.error('Error unmuting:', e)
                                }
                            }, 1000)
                        },
                        onStateChange: (event: any) => {
                            console.log('YouTube player state:', event.data)
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                setIsPlaying(true)
                                setIsLoading(false)
                                if (loadTimeoutRef.current) {
                                    clearTimeout(loadTimeoutRef.current)
                                    loadTimeoutRef.current = null
                                }
                            } else if (event.data === window.YT.PlayerState.PAUSED) {
                                try {
                                    event.target.playVideo()
                                } catch (e) {
                                    console.error('Error resuming play:', e)
                                }
                            } else if (event.data === window.YT.PlayerState.CUED) {
                                try {
                                    event.target.playVideo()
                                } catch (e) {
                                    console.error('Error playing cued video:', e)
                                }
                            }
                        },
                        onError: (event: any) => {
                            console.error('YouTube player error:', event.data)
                            setLoadError(true)
                            setIsLoading(false)
                            if (loadTimeoutRef.current) {
                                clearTimeout(loadTimeoutRef.current)
                                loadTimeoutRef.current = null
                            }
                        }
                    },
                })
            } catch (error) {
                console.error('Failed to create player:', error)
                setLoadError(true)
                setIsLoading(false)
                if (loadTimeoutRef.current) {
                    clearTimeout(loadTimeoutRef.current)
                    loadTimeoutRef.current = null
                }
            }
        }

        // API 로드 대기 및 플레이어 생성
        let checkCount = 0
        const maxChecks = 150 // 15초

        const checkAndCreatePlayer = () => {
            checkCount++

            if (window.YT && window.YT.Player) {
                console.log('YouTube API available, creating player')
                createPlayer()
            } else if (checkCount < maxChecks) {
                console.log(`Waiting for YouTube API... (${checkCount}/${maxChecks})`)
                setTimeout(checkAndCreatePlayer, 100)
            } else {
                console.error('YouTube API failed to load after maximum retries')
                setLoadError(true)
                setIsLoading(false)
                if (loadTimeoutRef.current) {
                    clearTimeout(loadTimeoutRef.current)
                    loadTimeoutRef.current = null
                }
            }
        }

        checkAndCreatePlayer()

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current)
            }
        }
    }, [isOpen])

    // 타이머 시작
    useEffect(() => {
        if (!isPlaying || adClosed || timerRef.current) return

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setCanSkip(true)
                    if (timerRef.current) {
                        clearInterval(timerRef.current)
                        timerRef.current = null
                    }
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }, [isPlaying, adClosed])

    const handleClose = () => {
        if (!canSkip) {
            alert('광고를 끝까지 시청해야 보상을 받을 수 있습니다!')
            return
        }

        setAdClosed(true)
        if (playerRef.current) {
            try {
                playerRef.current.destroy()
            } catch (e) {
                console.error('Player destroy error:', e)
            }
            playerRef.current = null
        }
        onRewardEarned()
        onClose()
    }

    const handleCancel = () => {
        if (confirm('광고를 취소하시겠습니까? 보상을 받을 수 없습니다.')) {
            setAdClosed(true)
            if (playerRef.current) {
                try {
                    playerRef.current.destroy()
                } catch (e) {
                    console.error('Player destroy error:', e)
                }
                playerRef.current = null
            }
            onClose()
        }
    }

    const handleRetry = () => {
        onClose()
        alert('광고 버튼을 다시 클릭해주세요.')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4">
                {/* 헤더 */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">📺 광고 시청</h2>
                        <button
                            onClick={handleCancel}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 비디오 영역 */}
                <div className="p-6">
                    <div
                        className="bg-black rounded-lg overflow-hidden mb-4 flex items-center justify-center relative"
                        style={{ height: '360px' }}
                    >
                        {isLoading && !loadError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                                <div className="text-white text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                    <p>광고 로딩 중...</p>
                                    <p className="text-xs text-gray-400 mt-2">잠시만 기다려주세요</p>
                                </div>
                            </div>
                        )}

                        {loadError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                                <div className="text-white text-center p-4">
                                    <div className="text-4xl mb-4">😢</div>
                                    <p className="mb-2">광고를 불러올 수 없습니다.</p>
                                    <p className="text-sm text-gray-300 mb-4">
                                        이 영상은 외부 사이트에서<br />재생할 수 없습니다.
                                    </p>
                                    <button
                                        onClick={handleRetry}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                        )}

                        <div id="youtube-player"></div>
                    </div>

                    {/* 타이머 */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                {canSkip ? '✅  광고 시청 완료!' : isLoading ? '광고를 준비 중입니다...' : '광고를 시청 중입니다...'}
                            </span>
                            <span className="text-2xl font-bold text-purple-600">
                                {timeLeft}초
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-1000"
                                style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* 보상 정보 */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="text-4xl">🎁</div>
                            <div>
                                <p className="font-semibold text-gray-800">시청 보상</p>
                                <p className="text-sm text-gray-600">{rewardDescription}</p>
                            </div>
                        </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleClose}
                            disabled={!canSkip}
                            className={`flex-1 font-bold py-3 px-6 rounded-lg transition-colors ${canSkip
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {canSkip ? '보상 받기' : `${timeLeft}초 후 가능`}
                        </button>
                    </div>

                    {/* 안내 문구 */}
                    <p className="text-xs text-gray-500 text-center mt-4">
                        💡 광고를 끝까지 시청하면 보상을 받을 수 있습니다
                    </p>
                </div>
            </div>
        </div>
    )
}