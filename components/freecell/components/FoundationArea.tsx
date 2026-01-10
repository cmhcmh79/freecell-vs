// components/freecell/components/FoundationArea.tsx

import React from 'react'
import type { Card, Suit, Location } from '../types'
import { SUITS } from '../constants'

type FoundationAreaProps = {
  foundations: Record<Suit, Card[]>
  onClick: (location: Location) => void
}

export const FoundationArea: React.FC<FoundationAreaProps> = ({
  foundations,
  onClick,
}) => {
  return (
    <div className="relative h-0 w-[44.94%] pb-[15.19%]">
      <div className="absolute inset-0 flex">
        {SUITS.map(suit => {
          const top = foundations[suit as Suit].at(-1)
          return (
            <div
              key={suit}
              onClick={() => onClick({ type: 'foundation', suit: suit as Suit })}
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
  )
}