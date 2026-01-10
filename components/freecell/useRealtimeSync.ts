// components/freecell/useRealtimeSync.ts

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { GameState } from './types'
import { checkWin } from './gameLogic'

type UseRealtimeSyncProps = {
    roomCode: string
    isPlayer1: boolean
    isMultiplayer: boolean
    onOpponentMove: (gameState: GameState) => void
    onWin: (isMe: boolean) => void
}

export const useRealtimeSync = ({
    roomCode,
    isPlayer1,
    isMultiplayer,
    onOpponentMove,
    onWin,
}: UseRealtimeSyncProps) => {
    const channelRef = useRef<RealtimeChannel | null>(null)

    useEffect(() => {
        if (!isMultiplayer) return

        const channel = supabase.channel(`game-${roomCode}`)
        channelRef.current = channel

        channel
            .on('broadcast', { event: 'move' }, ({ payload }) => {
                const expectedId = isPlayer1 ? 'player2' : 'player1'
                if (payload.playerId !== expectedId) return
                onOpponentMove(payload.gameState)
                if (checkWin(payload.gameState)) onWin(false)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            channelRef.current = null
        }
    }, [roomCode, isPlayer1, isMultiplayer, onOpponentMove, onWin])

    const broadcast = async (gameState: GameState) => {
        if (!isMultiplayer || !channelRef.current) return

        await channelRef.current.send({
            type: 'broadcast',
            event: 'move',
            payload: {
                playerId: isPlayer1 ? 'player1' : 'player2',
                gameState,
            },
        })
    }

    return { broadcast }
}