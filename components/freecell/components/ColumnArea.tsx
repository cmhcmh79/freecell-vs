// components/freecell/components/ColumnArea.tsx

import React from 'react'
import type { Card, Location } from '../types'
import { isSameLocation } from '../gameLogic'

type ColumnAreaProps = {
  columns: Card[][]
  selected: Location | null
  onClick: (location: Location) => void
}

export const ColumnArea: React.FC<ColumnAreaProps> = ({
  columns,
  selected,
  onClick,
}) => {
  return (
    <div className="flex flex-1 justify-evenly">
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="relative w-[11.24%]">
          {col.length === 0 ? (
            <div
              onClick={() => onClick({ type: 'column', index: colIdx })}
              className="w-full h-0 pb-[135.2%] deck"
            />
          ) : (
            col.map((card, cardIdx) => (
              <div
                key={cardIdx}
                onClick={() =>
                  cardIdx === col.length - 1 &&
                  onClick({ type: 'column', index: colIdx })
                }
                className={`relative w-full h-0 pb-[135.2%] ${
                  cardIdx !== 0 ? '-mt-[109%]' : ''
                } ${
                  isSameLocation(selected, {
                    type: 'column',
                    index: colIdx,
                  }) && cardIdx === col.length - 1
                    ? 'ring-2 ring-yellow-400'
                    : ''
                }`}
                style={{
                  zIndex: 10 + cardIdx,
                  backgroundImage: `url(/cards/${card.value}${card.suit}.png)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ))
          )}
        </div>
      ))}
    </div>
  )
}