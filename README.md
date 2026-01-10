# ♠️ Freecell VS (대전 프리셀)

온라인 **대전 프리셀(Freecell) 게임**을 개발 중인 프로젝트입니다.  
Next.js 기반 웹 게임으로, 실시간 대전을 지원하며 회원 관리와 게임 로직을 분리한 구조로 설계되었습니다.

🔗 **배포 링크:** [https://freecell-vs.vercel.app/](https://freecell-vs.vercel.app/)

---

## 🎮 주요 기능

- **프리셀 게임 플레이**
  - 기본 Freecell 규칙 구현
  - 카드 이동, 컬럼 / 프리셀 / 파운데이션 처리
- ⚔️ **대전 모드**
  - 실시간 1:1 대전
  - 방 생성 및 참가
  - 상대방 카드 이동 동기화 (Realtime)
- 👤 **회원 시스템**
  - 자체 회원 관리 (MariaDB) 및 Supabase Auth 연동
  - JWT 기반 인증
- 🌐 **웹 기반 플레이**
  - 별도 설치 없이 브라우저에서 바로 플레이

---

## 개발 계획 (Roadmap)

### 1단계: 메뉴 구성 변경
- [] Supabase Auth로 로그인/회원가입
- [] 닉네임 설정
- [] 프로필 페이지



---
## 기능 개선
- [ ] foundation 영역에 동일한 모양이 아니라 색으로 올라가는 문제
- [ ] 상대쪽 화면이 카드 위쪽으로 올라가는 문제
- [ ] 정답 자동이동 기능 추가
- [ ] 여러장 카드 이동 기능 추가

---

## 기능 개선(파일 분리하기)
components/
├── FreeCellGame.tsx (120줄) - 메인 컴포넌트             [ ]
├── FreeCellGame.css                                    [ ]
└── freecell/                                           [ ]
    ├── types.ts - 타입 정의                             [V]
    ├── constants.ts - 상수                              [V]
    ├── deckUtils.ts - 덱 생성 로직                       [V]
    ├── gameLogic.ts - 게임 로직 (검증, 승리 조건 등)     [V]
    ├── useGameTimer.ts - 타이머 훅                      [ ]
    ├── useRealtimeSync.ts - Realtime 동기화 훅         [ ]
    ├── useFreeCellGame.ts - 게임 상태 관리 훅            [ ]
    └── components/                                       [ ]
        ├── GameControls.tsx - 게임 컨트롤 버튼            [ ]
        ├── GameInfo.tsx - 게임 정보 표시                 [ ]
        ├── OpponentInfo.tsx - 상대방 정보                [ ]
        ├── FreeCellArea.tsx - FreeCell 영역              [ ]
        ├── FoundationArea.tsx - Foundation 영역          [ ]
        ├── ColumnArea.tsx - 컬럼 영역                     [ ]
        └── DevControls.tsx - 개발자 테스트 버튼           [ ]


## 기술 스택

### Frontend / Server
- **Next.js** (App Router)
- **TypeScript**
- **Vercel** (배포)

### Realtime / Game Server
- **Supabase**
  - Realtime Channel (대전 동기화)
  - 게임 방 / 매치 데이터 관리

### Database
- **MariaDB**
  - 회원 / 계정 / 프로필 관리
- **Supabase PostgreSQL**
  - 대전 방 / 매치 결과 저장

---

## 아키텍처 개요

```text
Client (Browser)
    ↓
Next.js (Vercel)
  ├─ MariaDB (회원 / 인증)
  └─ Supabase (대전 / 실시간 / 매치)