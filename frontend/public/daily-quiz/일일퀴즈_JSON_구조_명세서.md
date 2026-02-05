# 일일 퀴즈 JSON 구조 명세서

## 파일 경로 규칙

```
frontend/public/daily-quiz/{레벨폴더}/{일차}.json
```

- 레벨폴더: `saussure1` ~ `wittgenstein3` (총 12개)
- 일차: `001.json` ~ `365.json` (3자리 zero-padding)
- 예시: `frontend/public/daily-quiz/russell1/042.json`

---

## 레벨 목록

| 레벨 ID | 레벨명 | 대상 학년 | schoolGradeRange |
|---------|--------|----------|-----------------|
| saussure1 | 소쉬르 1 | 초1 | min: 1, max: 1 |
| saussure2 | 소쉬르 2 | 초2 | min: 2, max: 2 |
| saussure3 | 소쉬르 3 | 초3 | min: 3, max: 3 |
| frege1 | 프레게 1 | 초4 | min: 4, max: 4 |
| frege2 | 프레게 2 | 초5 | min: 5, max: 5 |
| frege3 | 프레게 3 | 초6 | min: 6, max: 6 |
| russell1 | 러셀 1 | 중1 | min: 7, max: 7 |
| russell2 | 러셀 2 | 중2 | min: 8, max: 8 |
| russell3 | 러셀 3 | 중3 | min: 9, max: 9 |
| wittgenstein1 | 비트겐슈타인 1 | 고1 | min: 10, max: 10 |
| wittgenstein2 | 비트겐슈타인 2 | 고2 | min: 11, max: 11 |
| wittgenstein3 | 비트겐슈타인 3 | 고3 | min: 12, max: 12 |

---

## targetLevel 값 매핑

| 레벨 ID | targetLevel 값 |
|---------|---------------|
| saussure1 | SAUSSURE_1 |
| saussure2 | SAUSSURE_2 |
| saussure3 | SAUSSURE_3 |
| frege1 | FREGE_1 |
| frege2 | FREGE_2 |
| frege3 | FREGE_3 |
| russell1 | RUSSELL_1 |
| russell2 | RUSSELL_2 |
| russell3 | RUSSELL_3 |
| wittgenstein1 | WITTGENSTEIN_1 |
| wittgenstein2 | WITTGENSTEIN_2 |
| wittgenstein3 | WITTGENSTEIN_3 |

---

## JSON 전체 구조

```json
{
  "contentId": "dq-{레벨약어}-{일차3자리}",
  "contentType": "DAILY_QUIZ",
  "version": 1,
  "status": "PUBLISHED",
  "title": "일일 퀴즈 - {레벨한글명} Day {일차}",
  "description": "맞춤법과 기초 어휘 10문항",
  "targetLevel": "{TARGET_LEVEL}",
  "schoolGradeRange": {
    "min": {학년숫자},
    "max": {학년숫자}
  },
  "area": "VOCAB",
  "subArea": "DAILY",
  "competencies": ["VOCAB"],
  "tags": ["daily"],
  "access": {
    "mode": "FREE"
  },
  "seedReward": {
    "seedType": "WHEAT",
    "count": 3,
    "multiplier": 1
  },
  "timeLimitSec": 180,
  "assets": {
    "sheetBackground": "/learning-paper.jpg"
  },
  "payload": {
    "pageStack": true,
    "layout": "EXAM_SHEET",
    "questions": [ ... ]
  }
}
```

---

## 각 필드 설명

### 최상위 메타데이터

| 필드 | 타입 | 고정/변동 | 설명 |
|------|------|----------|------|
| contentId | string | 변동 | `"dq-{레벨약어}-{일차3자리}"` (예: `"dq-r1-042"`) |
| contentType | string | 고정 | 항상 `"DAILY_QUIZ"` |
| version | number | 고정 | 항상 `1` |
| status | string | 고정 | 항상 `"PUBLISHED"` |
| title | string | 변동 | `"일일 퀴즈 - {레벨한글명} Day {일차}"` |
| description | string | 고정 | `"맞춤법과 기초 어휘 10문항"` |
| targetLevel | string | 레벨별 고정 | 위 매핑표 참고 |
| schoolGradeRange | object | 레벨별 고정 | `{ "min": N, "max": N }` |
| area | string | 고정 | `"VOCAB"` |
| subArea | string | 고정 | `"DAILY"` |
| competencies | string[] | 고정 | `["VOCAB"]` |
| tags | string[] | 고정 | `["daily"]` |
| access.mode | string | 고정 | `"FREE"` |
| seedReward | object | 고정 | `{ "seedType": "WHEAT", "count": 3, "multiplier": 1 }` |
| timeLimitSec | number | 고정 | `180` (3분) |
| assets.sheetBackground | string | 고정 | `"/learning-paper.jpg"` |
| payload.pageStack | boolean | 고정 | `true` |
| payload.layout | string | 고정 | `"EXAM_SHEET"` |

### contentId 레벨 약어 규칙

| 레벨 | 약어 | 예시 (42일차) |
|------|------|-------------|
| saussure1 | s1 | dq-s1-042 |
| saussure2 | s2 | dq-s2-042 |
| saussure3 | s3 | dq-s3-042 |
| frege1 | f1 | dq-f1-042 |
| frege2 | f2 | dq-f2-042 |
| frege3 | f3 | dq-f3-042 |
| russell1 | r1 | dq-r1-042 |
| russell2 | r2 | dq-r2-042 |
| russell3 | r3 | dq-r3-042 |
| wittgenstein1 | w1 | dq-w1-042 |
| wittgenstein2 | w2 | dq-w2-042 |
| wittgenstein3 | w3 | dq-w3-042 |

---

## 문제(question) 구조

`payload.questions` 배열 안에 10개의 문제가 들어갑니다.

```json
{
  "id": "dq-{레벨약어}-{일차3자리}-{문제번호}",
  "type": "MULTI_CHOICE",
  "questionKind": "WORD_TO_MEANING",
  "stem": "낱말: {출제 단어}",
  "highlight": {
    "text": "{출제 단어}"
  },
  "prompt": "뜻을 고르세요.",
  "choices": [
    { "id": "A", "text": "{선지 A}" },
    { "id": "B", "text": "{선지 B}" },
    { "id": "C", "text": "{선지 C}" },
    { "id": "D", "text": "{선지 D}" }
  ],
  "answerId": "{정답 선지 id}",
  "explanation": "'{출제 단어}'은(는) '{정답 텍스트}'을(를) 뜻합니다.",
  "scoring": {
    "correct": 20,
    "wrong": -20
  }
}
```

### 서술형(문장 완성) 문제 구조 (competency: 표현력)

`type`이 `"SENTENCE_BUILDING"`인 경우의 구조입니다.

```json
{
  "id": "dq-{레벨약어}-{일차3자리}-9",
  "type": "SENTENCE_BUILDING",
  "questionKind": "SENTENCE_BUILDING",
  "competency": "표현력",
  "stem": "글의 내용을 바탕으로 빈칸을 채워 요약 문장을 완성하세요.",
  "passage": "{관련 지문 텍스트}",
  "correctSentence": "카는 사실을 '과거에 대한 사실', '역사상의 사실', '역사적 사실'로 구분했다.",
  "sentenceParts": [
    {
      "answer": "카는",
      "distractors": ["랑케는", "콜링우드는", "크로체는"]
    },
    {
      "answer": "사실을",
      "distractors": ["해석을", "기록을", "상상을"]
    },
    {
      "answer": "'과거에 대한 사실',",
      "distractors": ["'기록된 사실',", "'변형된 사실',", "'가공된 사실',"]
    },
    {
      "answer": "'역사상의 사실',",
      "distractors": ["'선별된 사실',", "'객관적 사실',", "'절대적 사실',"]
    },
    {
      "answer": "'역사적 사실'로",
      "distractors": ["'현재적 사실'로", "'미래적 사실'로", "'주관적 사실'로"]
    },
    {
      "answer": "구분했다.",
      "distractors": ["조명했다.", "비판했다.", "통합했다."]
    }
  ],
  "scoring": {
    "correct": 20,
    "wrong": 0
  }
}
```

**필드 설명 (SENTENCE_BUILDING)**
- `type`: `"SENTENCE_BUILDING"` 고정
- `questionKind`: `"SENTENCE_BUILDING"` 고정
- `correctSentence`: 완성된 정답 문장 전체 (참조용)
- `sentenceParts`: 문장을 어절 단위로 쪼갠 배열
  - `answer`: 정답 어절
  - `distractors`: 오답 선택지 (배열) - **반드시 3개** (총 4지선다 구성)
- `choices`, `answerId`: 사용하지 않음 (대신 `sentenceParts` 사용)

### 문제 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | `"dq-{레벨약어}-{일차3자리}-{1~10}"` |
| type | string | 고정 `"MULTI_CHOICE"` (4지선다) |
| questionKind | string | 고정 `"WORD_TO_MEANING"` (단어→뜻 찾기) |
| stem | string | `"낱말: {단어}"` 형식 |
| highlight.text | string | stem에서 강조할 단어 |
| prompt | string | 고정 `"뜻을 고르세요."` |
| choices | array | A/B/C/D 4개 선지. 정답 위치는 랜덤 배치 |
| answerId | string | 정답 선지의 id (`"A"`, `"B"`, `"C"`, `"D"` 중 하나) |
| explanation | string | 해설 문장 |
| scoring.correct | number | 고정 `20` (정답 시 +20점) |
| scoring.wrong | number | 고정 `-20` (오답 시 -20점) |

---

## 대량 생산 시 변동 항목 요약

파일 하나당 실제로 바꿔야 하는 값만 정리하면 다음과 같습니다.

### 파일 단위 (레벨 + 일차에 따라 결정)
- `contentId`
- `title`
- `targetLevel`, `schoolGradeRange` (레벨별 고정)

### 문제 단위 (문제 10개 × 매일 다른 단어)
- `id`
- `stem` → 출제 단어
- `highlight.text` → 출제 단어
- `choices` → 선지 4개 텍스트
- `answerId` → 정답 선지
- `explanation` → 해설

나머지 필드는 모두 고정값이므로 템플릿으로 복사하면 됩니다.

---

## 완성 예시 (russell1/042.json)

```json
{
  "contentId": "dq-r1-042",
  "contentType": "DAILY_QUIZ",
  "version": 1,
  "status": "PUBLISHED",
  "title": "일일 퀴즈 - 러셀1 Day 42",
  "description": "맞춤법과 기초 어휘 10문항",
  "targetLevel": "RUSSELL_1",
  "schoolGradeRange": { "min": 7, "max": 7 },
  "area": "VOCAB",
  "subArea": "DAILY",
  "competencies": ["VOCAB"],
  "tags": ["daily"],
  "access": { "mode": "FREE" },
  "seedReward": { "seedType": "WHEAT", "count": 3, "multiplier": 1 },
  "timeLimitSec": 180,
  "assets": { "sheetBackground": "/learning-paper.jpg" },
  "payload": {
    "pageStack": true,
    "layout": "EXAM_SHEET",
    "questions": [
      {
        "id": "dq-r1-042-1",
        "type": "MULTI_CHOICE",
        "questionKind": "WORD_TO_MEANING",
        "stem": "낱말: 합리적",
        "highlight": { "text": "합리적" },
        "prompt": "뜻을 고르세요.",
        "choices": [
          { "id": "A", "text": "감정에 따라 행동하는 것" },
          { "id": "B", "text": "이치에 맞고 논리적인 것" },
          { "id": "C", "text": "남의 말을 따르는 것" },
          { "id": "D", "text": "규칙을 어기는 것" }
        ],
        "answerId": "B",
        "explanation": "'합리적'은(는) '이치에 맞고 논리적인 것'을(를) 뜻합니다.",
        "scoring": { "correct": 20, "wrong": -20 }
      }
    ]
  }
}
```

(실제 파일에는 questions 배열 안에 문제 10개가 들어갑니다.)

---

## 생산 규모

- 12레벨 x 365일 = **4,380개 파일**
- 파일당 10문제 = **총 43,800문제**
- 파일당 용량 약 2~3KB
