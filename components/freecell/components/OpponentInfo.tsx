// components/freecell/components/OpponentInfo.tsx

import React from 'react'
import type { GameState, Suit } from '../types'
import { SUITS } from '../constants'
import { getCompletedCount } from '../gameLogic'

type OpponentInfoProps = {
  opponentGame: GameState | null
}

export const OpponentInfo: React.FC<OpponentInfoProps> = ({ opponentGame }) => {
  if (!opponentGame) {
    return <div style={{ width: '44.94%' }} />
  }

  return (
    <div className="bg-black/50 rounded-lg p-2" style={{ width: '44.94%' }}>
      <div className="text-white text-xs font-bold mb-1 text-center">
        상대방
      </div>
      <div className="relative h-0 w-full pb-[22.5%]">
        <div className="absolute inset-0 flex gap-1">
          {SUITS.map(suit => {
            const top = opponentGame.foundations[suit as Suit].at(-1)
            return (
              <div
                key={suit}
                className="w-1/4 h-full deck"
                style={
                  top
                    ? {
                        backgroundImage: `url(/cards/${top.value}${top.suit}.png)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              />
            )
          })}
        </div>
      </div>
      <div className="text-white text-xs text-center mt-1">
        완성: {getCompletedCount(opponentGame)}/52
      </div>
    </div>
  )
}