# Claude Code 프로젝트 설정

## 통신 규칙

모든 커뮤니케이션은 **한글**로 진행합니다.
- 설명, 분석, 피드백, 모든 내용을 한글로 제공합니다.
- 코드 주석과 변수명은 영어로 유지합니다 (국제 표준).
- 사용자에게 전달하는 메시지는 항상 한글입니다.

## 프로젝트 정보

- **프로젝트명**: Task Manager (업무 관리 웹 애플리케이션)
- **기술 스택**: React 18, TypeScript, Tailwind CSS, Dexie.js (IndexedDB), Zustand
- **빌드 도구**: Vite
- **개발 서버**: localhost:5175 (또는 사용 가능한 다음 포트)

## 주요 기능

1. 카테고리 관리 (생성, 선택, 삭제)
2. 계층형 태스크 관리
3. 설명/계획/실행 3단계 워크플로우
4. 진행률 추적 (0-100%)
5. 로컬 데이터 저장 (IndexedDB)
6. 자동 저장

## 디렉토리 구조

```
src/
├── components/       # React 컴포넌트
├── store/           # Zustand 상태 관리
├── db/              # IndexedDB 설정 및 쿼리
├── types/           # TypeScript 타입 정의
└── styles/          # CSS 스타일
```

## 개발 규칙

- TypeScript를 사용하여 타입 안전성 유지
- 컴포넌트는 함수형 컴포넌트 + Hooks 사용
- 상태 관리는 Zustand Store 사용
- 스타일은 Tailwind CSS 유틸리티 클래스 사용
- 모든 파일명은 영어 (camelCase 또는 kebab-case)

## 주의사항

- 동적 클래스명 사용 금지 (Tailwind가 정적 분석하므로)
- 색상 매핑은 객체로 정의하여 사용
- Dexie.js는 `put()` 메서드로 데이터 업데이트
- 타입만 import할 때는 `import type { ... }` 문법 사용

## 진행 중인 기능

현재 개발 우선순위:
1. 드래그 앤 드롭 기능 (@dnd-kit)
2. 체크리스트 편집 기능
3. 자동 저장 (Debouncing)
