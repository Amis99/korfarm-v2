# 일일독해 소쉬르·프레게 장르 비율 재작성 인수인계

> 브랜치: `daily-reading-rewrite`
> 작업자: 안티그래비티
> 작성일: 2026-03-27
> 최종 머지 대상: `gh-pages`
> 총 남은 파일: **1,941파일**

---

## 1. 전체 진행 상황

| # | 레벨 | 폴더 | 완료 | 남은 범위 | 남은 파일 | 복기 카드 | 지문 길이 |
|---|------|------|------|----------|----------|----------|----------|
| 1 | **소쉬르1** | saussure1 | Day 1~249 | **Day 250~365** | **116** | 4카드 | 300±30자 |
| 2 | **소쉬르2** | saussure2 | — | Day 1~365 | **365** | 4카드 | 400±30자 |
| 3 | **소쉬르3** | saussure3 | — | Day 1~365 | **365** | 4카드 | 700±50자 |
| 4 | **프레게1** | frege1 | — | Day 1~365 | **365** | 5카드 | 600±50자 |
| 5 | **프레게2** | frege2 | — | Day 1~365 | **365** | 5카드 | 900±50자 |
| 6 | **프레게3** | frege3 | — | Day 1~365 | **365** | 5카드 | 1000±50자 |

**작업 순서**: 위 표 순서대로

---

## 2. 병렬 작업 주의사항

- `codex/2026-03-19` 브랜치에서 다른 AI(코덱스)가 러셀~비트겐슈타인 작업 중
- 이 브랜치(`daily-reading-rewrite`)는 소쉬르1~프레게3만 담당
- `gh-pages` 브랜치에서 사용자가 별도 작업 중
- **세 브랜치 모두 최종적으로 `gh-pages`에 머지**
- 충돌 방지: `frontend/public/daily-reading/saussure1~3/`, `frege1~3/` 폴더만 수정할 것

---

## 3. 레벨별 메타데이터

| 레벨 | contentId | targetLevel | schoolGradeRange | timeLimitSec |
|------|-----------|-------------|-----------------|-------------|
| 소쉬르1 | dr-s1-{NNN} | SAUSSURE_1 | {"min":1,"max":1} | 300 |
| 소쉬르2 | dr-s2-{NNN} | SAUSSURE_2 | {"min":2,"max":3} | 360 |
| 소쉬르3 | dr-s3-{NNN} | SAUSSURE_3 | {"min":5,"max":5} | 480 |
| 프레게1 | dr-f1-{NNN} | FREGE_1 | {"min":4,"max":4} | 420 |
| 프레게2 | dr-f2-{NNN} | FREGE_2 | {"min":6,"max":6} | 480 |
| 프레게3 | dr-f3-{NNN} | FREGE_3 | {"min":6,"max":7} | 480 |

공통 필드:
```json
"contentType": "DAILY_READING", "version": 1, "status": "PUBLISHED",
"area": "READING", "competencies": ["READING"], "tags": ["daily"],
"access": {"mode":"FREE"}, "seedReward": {"seedType":"WHEAT","count":3,"multiplier":1},
"assets": {}, "description": "일일 독해 - 정독·복기·확인"
```

---

## 4. 10일 순환 장르 규칙

### 소쉬르 계열 (설명문 50%, 문학 30%, 생활문 20%)

| (N-1)%10 | 장르 | subArea |
|----------|------|---------|
| 0 | 설명문 | NONFICTION |
| 1 | 문학 | LITERATURE |
| 2 | 설명문 | NONFICTION |
| 3 | 생활문 | NONFICTION |
| 4 | 설명문 | NONFICTION |
| 5 | 문학 | LITERATURE |
| 6 | 설명문 | NONFICTION |
| 7 | 문학 | LITERATURE |
| 8 | 설명문 | NONFICTION |
| 9 | 생활문 | NONFICTION |

### 프레게 계열 (설명문 50%, 문학 30%, 논설문 20%)

| (N-1)%10 | 장르 | subArea |
|----------|------|---------|
| 0 | 설명문 | NONFICTION |
| 1 | 문학 | LITERATURE |
| 2 | 설명문 | NONFICTION |
| 3 | 논설문 | NONFICTION |
| 4 | 설명문 | NONFICTION |
| 5 | 문학 | LITERATURE |
| 6 | 설명문 | NONFICTION |
| 7 | 문학 | LITERATURE |
| 8 | 설명문 | NONFICTION |
| 9 | 논설문 | NONFICTION |

---

## 5. title 규칙

실제 글의 제목 사용 (구식 "일일 독해(소쉬르 1) Day N 비문학" 형식 금지).
- 설명문: "물의 세 가지 모습", "그림자가 생기는 까닭"
- 문학: "토끼와 거북이", "백설 공주"
- 생활문: "안전한 자전거 타기"
- 논설문: "일회용품을 줄여야 하는 까닭"

---

## 6. 복기·확인 규칙

| | 소쉬르1/2/3 | 프레게1/2/3 |
|---|---|---|
| 복기 카드 수 | **4카드** (c1~c4) | **5카드** (c1~c5) |
| 카드 글자 수 | 25~35자 | 25~35자 |
| correctOrder | ["c1","c2","c3","c4"] | ["c1","c2","c3","c4","c5"] |
| seedPenalty | 1 | 1 |
| 확인 문항 수 | 5~8 | 5~10 |

---

## 7. 주제 관리

### 설명문 교과 순환 (10과목)
과학 → 사회 → 국어 → 음악 → 미술 → 체육 → 수학 → 역사 → 지리 → 보건 → (반복)

### 소쉬르 문학 순환
전래동화 → 외국동화 → 동시감성 → 우화 → (반복)

### 소쉬르 생활문 순환
예절 → 안전 → 건강 → 환경 → 생활습관 → (반복)

### 프레게 문학 순환
동화 → 소설발췌 → 동시 → (반복, 레벨 난이도에 맞게)

### 프레게 논설문 주제 순환
환경 → 건강 → 사회 → 교육 → 과학기술 → (반복)

**주의**: 10일 이내 같은 주제 반복 금지. 레벨 전환 시 주제 순환은 처음부터 시작.

### 소쉬르1 Day 250~ 현재 위치
- 설명문: Day 249=과학 → **Day 251**: 사회부터
- 문학: Day 248=외국동화 → **Day 252**: 동시감성부터
- 생활문: Day 244=생활습관 → **Day 250**: 예절부터

---

## 8. 정독 (intensive) 규칙

- 모든 문장 순차 하이라이트, 모든 문장마다 4지선다
- 각 문단 마지막 step: 문단 전체 하이라이트 + 중심내용
- 정답: 바꿔 말하기 (하이라이트 복붙 금지)
- 선택지 4개, 길이 편차 15% 이내
- scoring: `{"correctDeltaSec":20,"wrongDeltaSec":-40,"eliminateWrongChoice":true}`
- **"N번째 문장" 표현 절대 금지**
- 앞 내용과 연결하는 질문 포함
- 문학: 표현법, 인물의 마음, 교훈, 상징, 심상 등

---

## 9. 확인 (confirm) 규칙

- 질문형 필수 ("~을 찾으시오" 금지)
- answerMatchMode: "ANY" 또는 "ALL"
- scoring: `{"correctDeltaSec":30,"wrongDeltaSec":-45}`
- revealOnWrong: true
- answerRanges: 0-based, end exclusive

---

## 10. 인덱스 규칙

- 0-based, end exclusive
- 마침표(.) 포함하여 end
- 문장 사이 공백 없이 마침표 직후 다음 문장
- **반드시 실제 텍스트와 대조하여 정확한 인덱스 계산**

---

## 11. 에이전트 실행 전략

- 4개 에이전트 병렬 (4파일 동시)
- 4파일 완료 → 즉시 git add + commit + push
- 커밋 메시지: `{레벨명} Day {시작}~{끝} 장르 비율 재작성 ({N}파일, {카드수}카드 복기)`
- 레벨 전환 시 첫 파일 수동 검증
- 자동 스크립트 생성 금지

---

## 12. 에이전트 프롬프트 템플릿

```
{레벨명} Day {N} 일일독해 JSON 파일을 작성하라.

## 파일 경로
`C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/frontend/public/daily-reading/{폴더}/{N}.json`

## 장르: {장르} ({subArea}) / 주제: {교과} — "{title}"
## title: "{title}"

## 메타데이터
- contentId: "{접두사}-{NNN}", contentType: "DAILY_READING", version: 1, status: "PUBLISHED"
- targetLevel: "{targetLevel}", schoolGradeRange: {schoolGradeRange}
- area: "READING", subArea: "{subArea}", competencies: ["READING"], tags: ["daily"]
- access: {"mode":"FREE"}, seedReward: {"seedType":"WHEAT","count":3,"multiplier":1}
- timeLimitSec: {timeLimitSec}, assets: {}

## 지문: {학년}수준 {장르}, {길이범위}자, 2~3문단
- {주제 설명}
- 문장 사이 공백 없이 마침표 연결

## 핵심 규칙
- 정독: 4지선다, 문단 마지막=전체+중심내용, 바꿔 말하기, "N번째 문장" 금지, 앞 내용 연결
- 복기: **정확히 {카드수}카드**, 25~35자, correctOrder, seedPenalty: 1
- 확인: 5~{max}문항, 질문형, answerRanges 정확, 0-based end exclusive 마침표 포함

기존 파일을 덮어쓴다. Write 도구로 작성 후 검증 보고.
```

---

## 13. 검증 체크리스트

1. JSON 파싱 정상
2. 하이라이트 인덱스가 실제 텍스트와 일치
3. answerRanges 인덱스가 실제 텍스트와 일치
4. 복기 카드 수 정확 (소쉬르=4, 프레게=5), 각 25~35자
5. 지문 길이가 레벨별 목표 범위 이내
6. 선택지 4개, 길이 편차 15% 이내
7. 정답이 바꿔 말하기
8. prompt에 "N번째 문장" 표현 없음
9. 확인 문항이 질문형
10. 앞 내용과 연결하는 질문 포함

---

## 14. 참고 문서

- `HANDOVER.md` 섹션 4~6: 메타데이터, 품질 규칙, JSON 템플릿
- `HANDOVER.md` 섹션 19: 소쉬르 장르 비율
- `HANDOVER.md` 섹션 20: 프레게 장르 비율
- `HANDOVER.md` 섹션 21: 작업 순서
