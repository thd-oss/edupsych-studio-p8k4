# DESIGN.md — EduPsych Interactive Studio Visual & Interaction Contract

## 1. Product Essence & Surface Mode
- **Domain & Audience**: 교육심리·학교상담 대학원 입시 및 임용 면접 준비생을 위한 듀얼 모드(스크롤 스토리텔링 + 90-Node 도메인 지식 그래프 워크스페이스) 학습 스튜디오.
- **Primary Mode**: **Operate × Experience Hybrid** — 좌측 학술 서사 레일(`Read`/`Operate`)과 우측 고정 인터랙티브 도식 스테이지·90노드 지식 그래프 캔버스(`Experience`/`Operate`)의 결합.
- **Signature Visual Artifact**:
  1. **Stage 1**: 스크롤 비트(`IntersectionObserver`)와 동기화되는 우측 고정 8대 개념 토폴로지 도식 & 작업기억(CLT) 보철 실험기.
  2. **Stage 2**: 숙련도(`Mastered` / `Review` / `Weak` / `Unseen`)가 실시간 반영되는 90-Node 도메인 지식 그래프 캔버스.

## 2. Color Tokens (60 / 30 / 10 Architecture)
- **60% Tinted Neutral Ground**:
  - `--bg-canvas`: `#f8f9fb` (차분한 쿨 뉴트럴 배경)
  - `--bg-surface`: `#ffffff` (인플로우 학습 카드 및 패널 표면)
  - `--bg-subtle`: `#f1f4f9` (보조 그룹 박스, 입력창 기본 배경, 메타 바)
- **30% WCAG AA Ink & Hairline Hierarchy**:
  - `--ink-primary`: `#0f172a` (본문 헤딩 및 핵심 명제)
  - `--ink-secondary`: `#334155` (학술 정의 및 설명 본문)
  - `--ink-tertiary`: `#64748b` (원서 출처 매핑, 보조 캡션, 노드 ID)
  - `--border-hairline`: `rgba(15, 23, 42, 0.08)` (`1px` 정밀 헤어라인 보더)
  - `--border-strong`: `rgba(15, 23, 42, 0.15)` (강조 컨트롤 및 호버 보더)
- **<= 10% Intentional Domain & Semantic Accents**:
  - `--accent-solid`: `#4f46e5` (주요 CTA, 활성 비트·탭·모드 선택 인디케이터)
  - **Mastery Status Signals**:
    - `Mastered`: `#10b981` (Emerald)
    - `Review`: `#f59e0b` (Amber)
    - `Weak / Again`: `#f43f5e` (Rose)
    - `Unseen`: `#475569` (Slate)
- **Dark Chrome Discipline**:
  - 어두운 배경(`#0f172a` / `#020617`)은 **상단 글로벌 모드 바**와 **SVG 지식 그래프 캔버스**에만 제한하여 시각적 앵커 집중도를 유지한다. 일반 인플로우 카드 헤더에 무거운 다크 블록을 반복 사용하지 않는다.

## 3. Typography & Korean/Latin Discipline
- **Font Stack**: `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`
- **Scale & Tracking**:
  - 섹션 헤딩 (`h1`, `h2`, `h3`): `letter-spacing: -0.025em`, `line-height: 1.28`, `word-break: keep-all`, `overflow-wrap: anywhere`
  - 박스형 카드 내부 소제목 (`h4`, `h5`, `h6`): `letter-spacing: -0.015em`, `word-break: keep-all` (박스 우측 공백 방지를 위해 `text-wrap: balance` 미적용)
  - 학술 본문 (`p`, `li`): `line-height: 1.65`, `text-wrap: pretty`
- **Numeric Rule**: 모든 카운터, 진도율, 90초 면접 타이머, CLT 게이지 수치에 `font-variant-numeric: tabular-nums` 강제 적용.

## 4. Concentric Geometry, Top-Layer & Motion Contract
- **Concentric Radii (`outer_radius = inner_radius + padding`)**:
  - `--radius-card`: `16px` (`1rem`) — 주요 카드 및 스테이지 컨테이너
  - `--radius-inner`: `10px` (`0.625rem`) — 카드 내부 서브 박스 및 입력 영역
  - `--radius-control`: `8px` (`0.5rem`) — 버튼, 배지, 필터 칩
- **Top-Layer Overlays (`<dialog>`)**:
  - `CommandSearchModal` (`⌘K`)과 `NodeDetailDrawer` 모두 네이티브 `<dialog>`(`showModal()`)를 사용하여 브라우저 Top-Layer 승격, 배경 `inert`, `Esc` 닫기, 포커스 복귀를 보장한다.
  - `transition-property: opacity, transform, display, overlay` 및 별도 선언된 `transition-behavior: allow-discrete`를 사용한다.
- **Explicit Bans**:
  - `transition: all` 전면 금지 (GPU `transform`, `opacity`, `clip-path`만 허용)
  - 무지개·인디고-퍼플 배경 그라데이션 배너 금지
  - 영문 ALL-CAPS 장식 아이브로우 및 버튼 텍스트 내 `[...]`, `->` 기호 용접 금지
