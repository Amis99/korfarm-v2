# 일일독해 전면 재생성 작업 인수인계 문서

> 작성일: 2026-03-19
> 프로젝트: `C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지`
> 브랜치: `gh-pages`

---

## 1. 프로젝트 개요

**국어농장 v2** 웹사이트의 일일독해(DAILY_READING) 콘텐츠 전면 재생성 작업.

- **12레벨 × 365일 = 4,380개 JSON 파일**을 품질 규칙에 맞게 재작성
- 기존 자동 스크립트로 생성된 파일은 품질 규칙 위반 → 에이전트가 파일 하나씩 직접 작성(Write 도구)
- 모든 파일 위치: `frontend/public/daily-reading/{레벨폴더}/{NNN}.json`

### 1-1. 작업 원칙

- 자동 스크립트로 대량 생성하거나 자동 수정하지 않는다.
- 파일은 반드시 하나씩 수동으로 다시 작성한다.
- 기존 파일을 단순 보정하지 않고, 가능한 한 **전면 재생성**을 원칙으로 한다.
- 각 파일은 반드시 **정독 + 복기 + 확인** 세트를 모두 갖춘 완성본으로 만든다.
- RUSSELL 이후 비문학은 작업자가 임의로 새 주제를 잡지 않고, `참고용 기출 지문/` 폴더의 비문학 원고를 바탕으로 길이와 난도를 맞춰 수정 작성한다.

---

## 2. 현재 완료 상태 (커밋 기준)

### 2-1. 완전히 완료된 레벨 (커밋 완료)

| 레벨 | 폴더 | 상태 |
|------|------|------|
| 소쉬르1 | saussure1 | Day 1~365 전체 완료 ✅ |
| 소쉬르2 | saussure2 | Day 1~365 전체 완료 ✅ |
| 프레게1 | frege1 | Day 1~365 전체 완료 ✅ |
| 소쉬르3 | saussure3 | Day 1~365 전체 완료 ✅ |
| 프레게2 | frege2 | Day 1~365 전체 완료 ✅ |

### 2-2. 진행 중 레벨 (프레게3)

| 범위 | 상태 |
|------|------|
| Day 1~29 | 원본 양호 (커밋됨) |
| Day 30~220 (212/215/218 제외) | 전면 재생성 완료 (커밋됨) |
| **Day 212, 215, 218, 221, 222, 224, 225, 227, 228** | **좋은 품질로 재생성 완료, 아직 미커밋** → **즉시 커밋 필요** |
| Day 223, 226, 229~365 | **미작업 (구버전 파일)** → 재생성 필요 |

### 2-3. 미착수 레벨 (구버전 파일 전체 재생성 필요)

> ⚠️ 주의: 아래 레벨들의 일부 파일이 git working tree에서 "M(수정됨)" 상태로 보이지만,
> 이전 세션에서 중단된 불량 콘텐츠입니다 (복기 카드가 137~184자로 규칙 위반).
> 해당 파일들도 모두 처음부터 다시 재생성해야 합니다.

| 레벨 | 폴더 | 재생성 범위 | 특이사항 |
|------|------|------------|---------|
| 러셀1 | russell1 | Day 1~365 전체 | 중1 수준, 분야별 개념 읽기 + 화법 작문 매체 + 문학(공유 Google Drive `언어의 창 학원 자료 모음 > 중등 폴더`의 중1/중2/중3 자료에서 교과서 수록 작품 본문 발췌 + 문장 또는 구절별 해설 질문) |
| 러셀2 | russell2 | Day 1~365 전체 | 중2 수준, 분야별 개념 읽기 + 화법 작문 매체 + 문학(공유 Google Drive의 `문학 작품 워크북` 우선 참고, 필요시 `교과서 작품`, `고등 22개정 과정 (교과서)` 포함 다른 폴더의 작품 본문 발췌 + 문장 또는 구절별 해설 질문) |
| 러셀3 | russell3 | Day 1~365 전체 | 중3 수준, 분야별 개념 읽기 + 화법 작문 매체 + 문학(공유 Google Drive의 `문학 작품 워크북` 우선 참고, 필요시 `교과서 작품`, `고등 22개정 과정 (교과서)` 포함 다른 폴더의 작품 본문 발췌 + 문장 또는 구절별 해설 질문) |
| 비트1 | wittgenstein1 | Day 1~365 전체 | 비문학=기출지문 사용 |
| 비트2 | wittgenstein2 | Day 1~365 전체 | 비문학=기출지문 사용 |
| 비트3 | wittgenstein3 | Day 1~365 전체 | 비문학=기출지문 사용 |

---

## 3. 즉시 해야 할 첫 번째 작업 (STEP 0)

```bash
cd "C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지"

git add \
  frontend/public/daily-reading/frege3/212.json \
  frontend/public/daily-reading/frege3/215.json \
  frontend/public/daily-reading/frege3/218.json \
  frontend/public/daily-reading/frege3/221.json \
  frontend/public/daily-reading/frege3/222.json \
  frontend/public/daily-reading/frege3/224.json \
  frontend/public/daily-reading/frege3/225.json \
  frontend/public/daily-reading/frege3/227.json \
  frontend/public/daily-reading/frege3/228.json

git commit -m "프레게3 Day 212~228 전면 재생성 (9파일)"
```

---

## 4. 레벨별 메타데이터

| 레벨 | level_id | contentId 접두사 | 폴더 | min | max | 목표 지문길이 | timeLimitSec |
|------|----------|----------------|------|-----|-----|------------|-------------|
| 소쉬르1 | SAUSSURE_1 | dr-s1 | saussure1 | 1 | 1 | 300±30자 | 300 |
| 소쉬르2 | SAUSSURE_2 | dr-s2 | saussure2 | 2 | 3 | 400±30자 | 360 |
| 소쉬르3 | SAUSSURE_3 | dr-s3 | saussure3 | 5 | 5 | 700±50자 | 480 |
| 프레게1 | FREGE_1 | dr-f1 | frege1 | 4 | 4 | 600±50자 | 420 |
| 프레게2 | FREGE_2 | dr-f2 | frege2 | 6 | 6 | 900±50자 | 480 |
| 프레게3 | FREGE_3 | dr-f3 | frege3 | 6 | 7 | 1000±50자 | 480 |
| 러셀1 | RUSSELL_1 | dr-r1 | russell1 | 7 | 8 | 1100±50자 | 480 |
| 러셀2 | RUSSELL_2 | dr-r2 | russell2 | 8 | 9 | 1200±50자 | 480 |
| 러셀3 | RUSSELL_3 | dr-r3 | russell3 | 9 | 10 | 1300±50자 | 480 |
| 비트1 | WITTGENSTEIN_1 | dr-w1 | wittgenstein1 | 9 | 10 | 1400±50자 | 480 |
| 비트2 | WITTGENSTEIN_2 | dr-w2 | wittgenstein2 | 10 | 11 | 1500±50자 | 480 |
| 비트3 | WITTGENSTEIN_3 | dr-w3 | wittgenstein3 | 11 | 12 | 1600±50자 | 480 |

**subArea 규칙**: 홀수 Day = NONFICTION (비문학), 짝수 Day = LITERATURE (문학)

---

## 5. 콘텐츠 품질 규칙 (필수 준수)

### 5-1. 지문 (passage)

- 2~4개 문단 (p1, p2, ...)
- 각 레벨 목표 길이 ±50자 이내
- 교육 목적에 맞는 내용
- **FREGE 이하 레벨**: 직접 창작 가능 (소쉬르1/2/3, 프레게1/2/3)
- **RUSSELL 레벨**: 분야별 개념 읽기 + 화법 작문 매체 + 문학(교과서 수록 작품 + 문장 또는 구절별 해설 질문)
  - 비문학(홀수 Day): `참고용 기출 지문/` 내 비문학 원고를 바탕으로 작업하며, 직접 새 주제를 잡지 않는다.
  - 문학은 기출 문학 원고를 우선 소스로 쓰지 말고, 공유 Google Drive `언어의 창 학원 자료 모음` 폴더 안에서 작품을 찾는다.
  - **러셀1 문학**: 공유 Google Drive `언어의 창 학원 자료 모음 > 중등 폴더` 안의 중1/중2/중3 자료에서 교과서 수록 작품을 찾아 **원문 그대로 발췌**해 사용한다. 해설 PDF도 함께 참고하여 정독 문항의 표현법, 상징, 심상, 비유, 함축 의미 질문을 설계한다.
  - **러셀2/러셀3 문학**: 공유 Google Drive `언어의 창 학원 자료 모음` 안의 `문학 작품 워크북`을 우선 참고해도 된다. 필요하면 `교과서 작품`, `고등 22개정 과정 (교과서)`를 포함한 다른 폴더에서 작품을 찾아 **원문 그대로 발췌**해 사용한다.
  - 긴 소설/수필은 같은 작품의 다른 부분을 여러 날에 나누어 써도 된다. 이 경우 제목은 `작품명(1)`, `작품명(2)`처럼 붙인다.
- **WITTGENSTEIN 레벨**: `참고용 기출 지문/` 폴더의 원고를 참고하여 레벨에 맞게 재작성 (원문 복사 금지)
- 기출 원고는 **참고용**이며, 그대로 복사하지 않고 레벨 길이와 난도에 맞게 수정 작성한다.

### 5-2. 정독 (intensive) 규칙 ⚠️

- **가장 중요한 원칙**: 현재 하이라이트된 문장을 앞서 읽은 내용과 연결해 다시 떠올리게 만드는 질문을 우선한다.
- **문장 수 기반으로 구성**한다.
- **모든 문장을 순차적으로 하이라이트**해야 한다.
- **모든 문장마다 4지선다 question 필수** (question 없는 step 금지)
- 각 문단의 마지막 step: **문단 전체 하이라이트** + 중심내용 문항
- 문장별 문항은 앞서 읽은 내용을 다시 떠올리게 하는 **연결형 질문**을 반드시 포함한다.
- 문항은 요약, 연결, 치환, 전제/결론, 호응처럼 앞내용을 다시 상기하며 읽게 만드는 방식으로 작성한다.
- 즉, 지금 읽는 문장만 떼어 묻는 문제가 아니라, **방금 읽은 문장과 앞 문장들의 관계를 함께 생각하게 만드는 문제**를 적극적으로 설계한다.
- 정답: **바꾸어 말한 내용** (하이라이트 문장 그대로 복붙 금지)
- 선택지 4개, 길이 편차 15% 이내
- scoring: `{"correctDeltaSec":20,"wrongDeltaSec":-40,"eliminateWrongChoice":true}`
- **⛔ 절대 금지**: prompt에 "N번째 문장에서", "첫째 문장", "둘째 문장이 말하는", "세 번째 문장에서" 등 순서 표현 사용 금지
  - ❌ 나쁜 예: "첫째 문장에서 설명하는 것은?"
  - ✅ 좋은 예: "백색광이란 무엇을 합친 것인가요?"

### 5-3. 복기 (recall) 규칙 ⚠️

- **정확히 8카드** (카드 수 초과/부족 금지)
- **각 카드 30자 이내** (30자 초과 절대 금지)
- **요약문으로 작성** (본문 문장 분할/복붙 금지)
- 카드 8개가 문단 요약 흐름을 드러내야 함
- 본문에 없는 새 정보를 넣지 않는다.
- correctOrder: `["c1","c2","c3","c4","c5","c6","c7","c8"]`
- seedPenalty: 1

**✅ 좋은 카드 예시** (frege3/200에서):
```
c1: "겨울 방학에 기차 타고 외갓집에 갔다"  (20자)
c2: "마당에 눈과 고드름이 반짝이고 있었다"  (20자)
c3: "할아버지 품에서 장작 냄새가 났다"  (18자)
c8: "외갓집 시간을 소중한 보물로 간직했다"  (20자)
```

**❌ 나쁜 카드 예시** (구버전 russell1/007에서):
```
c1: "인공지능이란 인간의 사고 능력을 모방하여 스스로 학습하고 판단하는..."  (137자 - 텍스트 분할)
```

### 5-4. 확인 (confirm) 규칙 ⚠️

- **5~10문항**
- **질문형 필수** ("~을 찾으시오" 직접찾기 금지)
  - ❌ 나쁜 예: "지문에서 '인공지능'을 찾으시오."
  - ✅ 좋은 예: "인공지능이란 무엇을 모방하여 만든 시스템인가요?"
- **answerMatchMode**: 각 문항별로 `"ANY"` 또는 `"ALL"` 선택
  - `"ANY"`: 여러 정답 중 하나만 맞혀도 통과
  - `"ALL"`: 모든 정답을 맞혀야 통과
- 한 파일 안에 두 방식을 모두 반드시 넣을 필요는 없다.
- 지문과 질문에 따라 적절한 방식으로 배치한다.
- 답이 될 수 있는 구절이 여러 개인 경우, 하나만 골라도 되는지 모두 골라야 하는지 구분해서 설계한다.
- 정답은 본문에서 찾는 것이어야 하지만, 하이라이트된 문장이나 구절을 그대로 답으로 고르게 하는 문제는 금지한다.
- 즉, 확인 문제도 단순 복붙형이 아니라 질문을 이해하고 답을 찾아야 한다.
- scoring: `{"correctDeltaSec":30,"wrongDeltaSec":-45}`
- revealOnWrong: true
- answerRanges: 정답이 있는 paragraph와 start/end 문자 인덱스 지정

### 5-5. 선택지 규칙

- 문제 선택지는 모두 4지선다로 맞춘다.
- 정답과 오답 선택지 길이 차이가 과도하지 않도록 맞춘다.
- 오답은 헷갈릴 수는 있어도 정답이 분명히 아니어야 한다.

---

## 6. JSON 구조 템플릿

```json
{
  "contentId": "dr-f3-NNN",
  "contentType": "DAILY_READING",
  "version": 1,
  "status": "PUBLISHED",
  "title": "일일 독해(프레게 3) Day N 비문학",
  "description": "일일 독해 - 정독·복기·확인",
  "targetLevel": "FREGE_3",
  "schoolGradeRange": {"min":6,"max":7},
  "area": "READING",
  "subArea": "NONFICTION",
  "competencies": ["READING"],
  "tags": ["daily"],
  "access": {"mode":"FREE"},
  "seedReward": {"seedType":"WHEAT","count":3,"multiplier":1},
  "timeLimitSec": 480,
  "assets": {},
  "payload": {
    "passage": {
      "format": "TEXT",
      "paragraphs": [
        {"id":"p1","text":"첫 번째 문단 텍스트..."},
        {"id":"p2","text":"두 번째 문단 텍스트..."}
      ]
    },
    "intensive": {
      "timeline": [
        {
          "stepId": "s1",
          "highlight": {"ranges":[{"paragraphId":"p1","start":0,"end":46}]},
          "question": {
            "prompt": "내용 기반 질문 (N번째 문장 표현 금지)",
            "choices": [
              {"id":"A","text":"정답 선택지 (바꾸어 말하기)"},
              {"id":"B","text":"오답 선택지"},
              {"id":"C","text":"오답 선택지"},
              {"id":"D","text":"오답 선택지"}
            ],
            "answerId": "A",
            "scoring": {"correctDeltaSec":20,"wrongDeltaSec":-40,"eliminateWrongChoice":true}
          }
        },
        {
          "stepId": "s8",
          "highlight": {"ranges":[{"paragraphId":"p1","start":0,"end":513}]},
          "question": {
            "prompt": "이 문단의 중심 내용으로 가장 적절한 것은 무엇인가요?",
            "choices": [
              {"id":"A","text":"중심내용 바꿔말하기"},
              {"id":"B","text":"오답"},
              {"id":"C","text":"오답"},
              {"id":"D","text":"오답"}
            ],
            "answerId": "A",
            "scoring": {"correctDeltaSec":20,"wrongDeltaSec":-40,"eliminateWrongChoice":true}
          }
        }
      ]
    },
    "recall": {
      "cards": [
        {"id":"c1","text":"30자이내 요약문"},
        {"id":"c2","text":"30자이내 요약문"},
        {"id":"c3","text":"30자이내 요약문"},
        {"id":"c4","text":"30자이내 요약문"},
        {"id":"c5","text":"30자이내 요약문"},
        {"id":"c6","text":"30자이내 요약문"},
        {"id":"c7","text":"30자이내 요약문"},
        {"id":"c8","text":"30자이내 요약문"}
      ],
      "correctOrder": ["c1","c2","c3","c4","c5","c6","c7","c8"],
      "seedPenalty": 1
    },
    "confirm": {
      "questions": [
        {
          "id": "q1",
          "prompt": "질문형 문장",
          "answerRanges": [{"paragraphId":"p1","start":10,"end":20}],
          "scoring": {"correctDeltaSec":30,"wrongDeltaSec":-45},
          "revealOnWrong": true,
          "answerMatchMode": "ANY"
        }
      ]
    }
  }
}
```

---

## 7. 기출 지문 폴더 (RUSSELL+ 비문학용)

위치: `참고용 기출 지문/`
총 470개 파일, 이 중 비문학 171개 (경제, 과학, 기술, 사회, 인문, 예술, 철학, 심리, 환경 등)

**사용 방법**:
1. 비문학(홀수 Day)마다 기출 지문 1개를 선택
2. 해당 지문의 내용을 해당 레벨 난이도와 길이에 맞게 **재작성** (원문 복붙 금지)
3. 재작성된 지문으로 정독/복기/확인 세트 생성

**비문학 파일 목록 일부**:
- `과학기술_01_후성_유전학을_이용한_항암_치료.json`
- `과학기술_02_양자점_디스플레이.json`
- `과학_비분산형_적외선_분석기.md.json`
- `경제_(가)완전경쟁시장,(나)공정거래법.md.json`
- ... (총 171개)

---

## 8. 남은 작업 순서

### STEP 0: 프레게3 미커밋 파일 커밋 (즉시)
```bash
git add frontend/public/daily-reading/frege3/212.json \
        frontend/public/daily-reading/frege3/215.json \
        frontend/public/daily-reading/frege3/218.json \
        frontend/public/daily-reading/frege3/221.json \
        frontend/public/daily-reading/frege3/222.json \
        frontend/public/daily-reading/frege3/224.json \
        frontend/public/daily-reading/frege3/225.json \
        frontend/public/daily-reading/frege3/227.json \
        frontend/public/daily-reading/frege3/228.json
git commit -m "프레게3 Day 212~228 전면 재생성 (9파일)"
```

### STEP 1: 프레게3 Day 223, 226, 229~365 재생성 (139개 파일)
- frege3/223.json (홀수=NONFICTION)
- frege3/226.json (짝수=LITERATURE)
- frege3/229.json ~ frege3/365.json (137개)
- 레벨: FREGE_3, schoolGradeRange min:6 max:7, 1000±50자

### STEP 2: 러셀1 Day 1~365 재생성 (365개 파일)
- ⚠️ **1~006 파일은 working tree가 아닌 HEAD에 구버전 존재**
- ⚠️ **007~080 파일은 working tree에 불량 콘텐츠 존재 (이전 세션 중단)** → 덮어쓰기
- ⚠️ **081~365 파일은 HEAD에 구버전 존재**
- 레벨: RUSSELL_1, schoolGradeRange min:7 max:8, 1100±50자
- 홀수 Day 비문학: `참고용 기출 지문/` 폴더 기출 지문 참고

### STEP 3: 러셀2 Day 1~365 재생성 (365개 파일)
- 레벨: RUSSELL_2, schoolGradeRange min:8 max:9, 1200±50자

### STEP 4: 러셀3 Day 1~365 재생성 (365개 파일)
- 레벨: RUSSELL_3, schoolGradeRange min:9 max:10, 1300±50자

### STEP 5: 비트1 Day 1~365 재생성 (365개 파일)
- 레벨: WITTGENSTEIN_1, schoolGradeRange min:9 max:10, 1400±50자

### STEP 6: 비트2 Day 1~365 재생성 (365개 파일)
- 레벨: WITTGENSTEIN_2, schoolGradeRange min:10 max:11, 1500±50자

### STEP 7: 비트3 Day 1~365 재생성 (365개 파일)
- 레벨: WITTGENSTEIN_3, schoolGradeRange min:11 max:12, 1600±50자

---

## 9. 에이전트 병렬 실행 전략

- **4개 에이전트 병렬** 권장 (그 이상은 API 과부하)
- 각 에이전트: **3일분씩** 담당 (Write 도구로 파일 직접 작성)
- 완료 즉시 다음 배치 교체
- **스크립트(Node.js) 생성 금지** — 에이전트가 JSON을 직접 Write

---

## 10. 커밋 규칙

- 20~50파일 단위로 커밋
- 커밋 메시지 형식: `{레벨명} Day {시작}~{끝} 전면 재생성 ({N}파일)`
- 예: `프레게3 Day 229~253 전면 재생성 (25파일)`

---

## 11. 검증 체크리스트 (파일 생성 후 확인)

매 파일 저장 전:
1. ☐ intensive timeline 모든 step에 question 존재
2. ☐ 각 문단 마지막 step = 문단 전체 하이라이트 + 중심내용 문항
3. ☐ 정독 문항이 앞서 읽은 내용과 현재 문장을 연결해 다시 떠올리게 하는가
4. ☐ 정답이 하이라이트 복붙이 아닌 바꿔 말하기
5. ☐ 선택지 4개, 길이 편차 15% 이내
6. ☐ recall cards = 정확히 8개
7. ☐ 각 recall card ≤ 30자
8. ☐ recall cards가 요약문 (분할 아님)
9. ☐ confirm questions ≥ 5개, ≤ 10개
10. ☐ confirm 질문이 질문형 (직접찾기 아님)
11. ☐ 지문 길이 목표 ±50자 이내
12. ☐ subArea 홀짝 규칙 (홀수=NONFICTION, 짝수=LITERATURE)
13. ☐ RUSSELL+ 비문학은 기출 지문 참고
14. ☐ prompt에 "N번째 문장에서" 표현 없음

---

## 12. 좋은 예시 파일 (벤치마크)

품질 기준을 확인하려면 이 파일들을 참고:
- `frontend/public/daily-reading/frege3/200.json` — 문학(짝수), 1012자, 카드 17~21자, 확인 7문항
- `frontend/public/daily-reading/frege3/199.json` — 비문학(홀수)
- `frontend/public/daily-reading/frege3/221.json` — 비문학(홀수), 926자, 카드 최장 23자

---

## 13. title 규칙

```
"일일 독해({레벨명}) Day {N} {비문학|문학}"
```

레벨명 표기:
- SAUSSURE_1 → "소쉬르 1"
- SAUSSURE_2 → "소쉬르 2"
- SAUSSURE_3 → "소쉬르 3"
- FREGE_1 → "프레게 1"
- FREGE_2 → "프레게 2"
- FREGE_3 → "프레게 3"
- RUSSELL_1 → "러셀 1"
- RUSSELL_2 → "러셀 2"
- RUSSELL_3 → "러셀 3"
- WITTGENSTEIN_1 → "비트겐슈타인 1"
- WITTGENSTEIN_2 → "비트겐슈타인 2"
- WITTGENSTEIN_3 → "비트겐슈타인 3"

subArea에 따라 "비문학" 또는 "문학"으로 표기.

---

## 14. 파일 명명 규칙

- 파일명: 3자리 숫자. 예: `001.json`, `029.json`, `365.json`
- contentId: 접두사 + `-` + 3자리 숫자. 예: `dr-f3-001`, `dr-r1-365`
