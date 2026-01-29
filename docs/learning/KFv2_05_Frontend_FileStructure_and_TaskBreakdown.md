# 국어농장 v2 프런트엔드 파일 구조 및 구현 작업 분해서
기술 스택
- React 19.2.1
- JavaScript
- AWS Amplify 배포

## 1. 폴더 구조 제안

```
src/
  app/
    routes/
      public/
      auth/
      learner/
      admin/
    layout/
    providers/
  domain/
    content/
    session/
    wallet/
    harvest/
    assignment/
    ranking/
  engine/
    core/
      EngineShell.jsx
      EngineStore.js
      time/
      modal/
      highlight/
      result/
    modules/
      reading_intensive/
      recall_cards/
      confirm_click/
      choice_judgement/
      phoneme_change/
      word_formation/
      sentence_structure/
    shared/
      components/
      hooks/
      utils/
  ui/
    components/
    styles/
  api/
    client.js
    endpoints.js
    schemas/
  tests/
```

## 2. 학습 엔진 구현 순서

### 2.1 1단계: 공통 골격
- EngineShell
- TimeBar
- Modal
- HighlightLayer
- Footer Actions
- ResultSummary

### 2.2 2단계: 핵심 학습 모듈
- 독해 정독형
- 복기 카드 배치형
- 확인 학습 클릭 판정형
- 선택지 판별형

### 2.3 3단계: 문법 및 분석 모듈
- 음운 변동 박스형
- 단어 형성 분석형
- 문장의 짜임 분석형

### 2.4 4단계: 관리자 미리보기 연동
- 스키마 조회
- JSON 검증
- 엔진 미리보기 실행

## 3. 공통 유틸

### 3.1 토큰화
- 텍스트를 렌더링할 때 단순 문자열이 아니라 토큰 단위 span으로 렌더링합니다.
- 클릭 판정은 tokenId를 기준으로 합니다.

### 3.2 시간 계산
- 타임바는 requestAnimationFrame 기반으로 부드럽게 감소시키되
- 서버에는 초 단위로 정규화된 결과를 저장합니다.

### 3.3 접근성
- 키보드로 선택지 이동 가능
- 모바일 터치 대응

## 4. 테스트 기준

- 모듈별 단위 테스트
  - judge 함수 입력과 출력 검증
- 엔진 통합 테스트
  - step 전환과 타임바 이벤트 검증
- E2E 테스트
  - 샘플 콘텐츠를 실제로 수행하여 씨앗 지급까지 확인

## 5. 코딩 에이전트 지시문 템플릿

아래를 그대로 복사해 사용합니다.

> 작업: 선택지 판별형 모듈 구현  
> 입력: KFv2_01, KFv2_02 문서  
> 요구: 선택지 클릭 시 명제 카드가 순차 제시되고, 근거 클릭 판정과 OX 카드 생성, 선택지에 연필 표시, 시간 증감이 동작해야 한다.  
> 결과: src/engine/modules/choice_judgement 완성, 샘플 JSON 1개 포함, 단위 테스트 포함
