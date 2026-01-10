// components/freecell/useGameTimer.ts

import { useState, useEffect } from 'react'
import { MATCH_TIME } from './constants'

export const useGameTimer = (hasTimer: boolean) => {
  const [timeLeft, setTimeLeft] = useState(MATCH_TIME)

  useEffect(() => {
    if (!hasTimer) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasTimer])

  return timeLeft
}