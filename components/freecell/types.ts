
// components/freecell/types.ts

export type Suit = 'S' | 'H' | 'D' | 'C'

export type Value =
    | 'A' | '2' | '3' | '4' | '5'
    | '6' | '7' | '8' | '9' | '10'
    | 'J' | 'Q' | 'K'

export type Card = {
    suit: Suit
    value: Value
}

export type GameState = {
    columns: Card[][]
    freeCells: (Card | null)[]
    foundations: Record<Suit, Card[]>
    moves: number
}

export type Location =
    | { type: 'column'; index: number }
    | { type: 'freeCell'; index: number }
    | { type: 'foundation'; suit: Suit }

// 게임 모드 타입 정의
export type GameMode =
    | 'matchmaking'  // 랭크 모드 - 매칭 게임 (타이머 O, 대전)
    | 'ranked'       // 랭크 모드 - 스테이지 (타이머 X, 솔로)
    | 'solo'         // 솔로 모드 (타이머 X, 솔로)
    | 'versus'       // 친구 대결 (타이머 X, 대전)

export type FreeCellGameProps  = {
    roomCode: string
    gameSeed: number
    gameMode: GameMode  // 추가
    isPlayer1: boolean
    onWin: (isMe: boolean) => void
}