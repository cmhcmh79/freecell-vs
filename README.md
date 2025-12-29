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

### 1단계: 회원 시스템 (필수)
- [x] Supabase Auth로 로그인/회원가입
- [x] 닉네임 설정
- [x] 프로필 페이지

### 2단계: 전적 시스템
- [x] 게임 결과 DB에 저장
- [x] 승/패 기록
- [x] 플레이 시간 기록 (진행 중)
- [x] 내 전적 보기

### 3단계: 리더보드
- [x] 승률 순위
- [x] 최단 시간 순위
- [x] 최소 이동 순위

### 4단계: 랜덤 매칭
- [x] 대기열 시스템
- [x] 자동 매칭

### 5단계: 배포 🚀
- [x] Vercel 배포
- [x] 도메인 연결

---
## 기능 개선
- [ ] foundation 영역에 동일한 모양이 아니라 색으로 올라가는 문제
- [ ] 상대쪽 화면이 카드 위쪽으로 올라가는 문제
- [ ] 정답 자동이동 기능 추가
- [ ] 여러장 카드 이동 기능 추가

---

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