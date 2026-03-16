# 일일 퀴즈 JSON 구조 명세서

이 문서는 `frontend/public/daily-quiz`의 **실제 데이터 구조**와 프론트 엔진 템플릿(`frontend/src/data/learning/templates/dailyQuiz_quiz.json`)을 기준으로 작성합니다.

## 파일 경로 규칙

```
frontend/public/daily-quiz/{레벨폴더}/{일차}.json
```

- 레벨폴더: `saussure1` ~ `wittgenstein3` (총 12개)
- 일차: `001.json` ~ `365.json` (3자리 zero-padding)
- 예시: `frontend/public/daily-quiz/russell1/042.json`

---

## 레벨 목록

| 레벨 ID | 레벨명 | 대상 학년 |
|---------|--------|----------|
| saussure1 | 소쉬르 1 | 초1 |
| saussure2 | 소쉬르 2 | 초2 |
| saussure3 | 소쉬르 3 | 초3 |
| frege1 | 프레게 1 | 초4 |
| frege2 | 프레게 2 | 초5 |
| frege3 | 프레게 3 | 초6 |
| russell1 | 러셀 1 | 중1 |
| russell2 | 러셀 2 | 중2 |
| russell3 | 러셀 3 | 중3 |
| wittgenstein1 | 비트겐슈타인 1 | 고1 |
| wittgenstein2 | 비트겐슈타인 2 | 고2 |
| wittgenstein3 | 비트겐슈타인 3 | 고3 |

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

## contentId 레벨 약어 규칙

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

## JSON 전체 구조

```json
{
  "contentId": "dq-{레벨약어}-{일차3자리}",
  "contentType": "DAILY_QUIZ",
  "title": "일일 퀴즈 - {레벨한글명} Day {일차}",
  "description": "{일차별 설명 텍스트}",
  "targetLevel": "{TARGET_LEVEL}",
  "area": "GENERAL",
  "subArea": "DAILY",
  "competencies": ["VOCAB", "READING", "GRAMMAR"],
  "tags": ["daily"],
  "seedReward": {
    "seedType": "WHEAT",
    "count": 3,
    "multiplier": 1
  },
  "timeLimitSec": 180,
  "payload": {
    "pageStack": true,
    "layout": "EXAM_SHEET",
    "questions": [ ... 10문항 ... ]
  }
}
```

---

## 최상위 필드 설명

| 필드 | 타입 | 고정/변동 | 설명 |
|------|------|----------|------|
| contentId | string | 변동 | `"dq-{레벨약어}-{일차3자리}"` |
| contentType | string | 고정 | `"DAILY_QUIZ"` |
| title | string | 변동 | `"일일 퀴즈 - {레벨명} Day {일차}"` |
| description | string | 변동 | 일차별 주제/설명 텍스트 |
| targetLevel | string | 레벨별 고정 | 위 매핑표 참고 |
| area | string | 변동 가능 | 주로 `"GENERAL"` 또는 `"VOCAB"` |
| subArea | string | 고정 | `"DAILY"` |
| competencies | string[] | 변동 가능 | 예: `["VOCAB", "READING", "GRAMMAR"]` |
| tags | string[] | 변동 가능 | 예: `["daily", "science"]` |
| seedReward | object | 고정 | `{ "seedType": "WHEAT", "count": 3, "multiplier": 1 }` |
| timeLimitSec | number | 고정 | `180` |
| payload | object | 고정 | `pageStack/layout/questions` 포함 |

---

## questions(10문항) 규칙

### questionKind 값(10슬롯)

일일 퀴즈는 10문항이 아래 10종 `questionKind`를 1개씩 갖도록 운영합니다.

1. `WORD_TO_MEANING`
2. `READING_COMPREHENSION`
3. `STRUCTURE_READING`
4. `BACKGROUND_KNOWLEDGE`
5. `INFERENCE`
6. `CRITICAL_THINKING`
7. `CREATIVE_THINKING`
8. `PROBLEM_SOLVING`
9. `SENTENCE_BUILDING` (표현력)
10. `GRAMMAR`

### 객관식(MULTI_CHOICE) 구조

```json
{
  "id": "dq-{레벨약어}-{일차3자리}-{1~10}",
  "type": "MULTI_CHOICE",
  "questionKind": "{위 10종 중 1개(9번 제외)}",
  "competency": "{역량명(선택)}",
  "stem": "{발문}",
  "passage": "{지문(선택)}",
  "highlight": { "text": "{강조 텍스트(선택)}" },
  "prompt": "{보조 문구(선택)}",
  "choices": [
    { "id": "A", "text": "{선지 A}" },
    { "id": "B", "text": "{선지 B}" },
    { "id": "C", "text": "{선지 C}" },
    { "id": "D", "text": "{선지 D}" }
  ],
  "answerId": "{정답 선지 id}",
  "explanation": "{해설(선택)}",
  "scoring": {
    "correctDeltaSec": 20,
    "wrongDeltaSec": -20
  }
}
```

### 9번(표현력) 추론형 빈칸 채우기(FILL_BLANKS) 구조

9번 문항은 `type: "FILL_BLANKS"`를 사용합니다.

- **답안 전체를 그대로 베끼는 형태를 피합니다.**
  - 지문(`passage`)에 `template` 완성문을 그대로 넣지 말고, 읽고 추론할 수 있게 단서만 제공합니다.
- **고정 제시 구간**: 빈칸 앞/뒤 1어절 정도는 고정 텍스트로 제시합니다.
- **선택 구간**: 가운데만 빈칸으로 두고, **순서대로** 선택하게 합니다.

```json
{
  "id": "dq-{레벨약어}-{일차3자리}-9",
  "type": "FILL_BLANKS",
  "questionKind": "SENTENCE_BUILDING",
  "stem": "다음 글을 읽고, 빈칸에 들어갈 말을 순서대로 고르세요.",
  "passage": "{관련 지문 텍스트}",
  "template": "{고정 어절} ____ ____ {고정 어절}",
  "blanks": [
    {
      "id": "dq-...-9-blank-1",
      "choices": [
        { "id": "A", "text": "{선지}" },
        { "id": "B", "text": "{선지}" },
        { "id": "C", "text": "{선지}" },
        { "id": "D", "text": "{선지}" }
      ],
      "answerId": "B"
    }
  ],
  "scoring": {
    "correctDeltaSec": 15,
    "wrongDeltaSec": 0
  }
}
```

---

## 금지/권장 규칙(핵심)

- 문항/선택지에 괄호 속 부연(`(`, `)`)을 사용하지 않습니다.
- 정답은 반드시 유일해야 합니다.
- 9번은 `template`을 지문에서 그대로 복사하지 말고, 추론형으로 구성합니다.

---

## 완성 예시 (russell1/042.json 일부)

```json
{
  "contentId": "dq-r1-042",
  "contentType": "DAILY_QUIZ",
  "title": "일일 퀴즈 - 러셀1 Day 42",
  "description": "러셀 1단계 42일차 퀴즈",
  "targetLevel": "RUSSELL_1",
  "area": "GENERAL",
  "subArea": "DAILY",
  "competencies": ["VOCAB", "READING", "GRAMMAR"],
  "tags": ["daily"],
  "seedReward": { "seedType": "WHEAT", "count": 3, "multiplier": 1 },
  "timeLimitSec": 180,
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
        "scoring": { "correctDeltaSec": 20, "wrongDeltaSec": -20 }
      }
    ]
  }
}
```

