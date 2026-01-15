// components/freecell/components/FreeCellArea.tsx

import React from 'react'
import type { Card, Location } from '../types'
import { isSameLocation } from '../gameLogic'
import { CARD_SKIN } from '../constants'

type FreeCellAreaProps = {
  freeCells: (Card | null)[]
  selected: Location | null
  onClick: (location: Location) => void
}

export const FreeCellArea: React.FC<FreeCellAreaProps> = ({
  freeCells,
  selected,
  onClick,
}) => {
  return (
    <div className="relative h-0 w-[44.94%] pb-[15.19%]">
      <div className="absolute inset-0 flex">
        {freeCells.map((card, i) => (
          <div
            key={i}
            onClick={() => onClick({ type: 'freeCell', index: i })}
            className={`w-1/4 h-full deck ${
              isSameLocation(selected, { type: 'freeCell', index: i })
                ? 'ring-2 ring-yellow-400'
                : ''
            }`}
            style={
              card
                ? {
                    backgroundImage: `url(/cards/${CARD_SKIN}/${card.value}${card.suit}.png)`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}