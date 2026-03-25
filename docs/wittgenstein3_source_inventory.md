# 비트겐슈타인 3 지문 목록

## 요약

- 이 문서는 `비트겐슈타인3`의 **1단계 지문 목록** 문서다.
- 실제 날짜 배치는 `docs/wittgenstein3_schedule_365.md`에서 관리한다.
- 비문학과 문학 day 모두 **기출/수특 지문**을 우선 source로 삼는다.
- 상태값은 `source_selected`, `scheduled`, `learning_built`만 사용한다.

## 비문학 source 목록

| source_type | source 우선순위 | 사용 규칙 | status |
|---|---|---|---|
| exam-nonfiction | 고3 기출 비문학 지문 → 수특/수완 연계 지문 → EBS/교재 수록 변형 원고 | 원지문 정보 구조, 선택지 함정 포인트, 보기 연동을 유지 | source_selected |
| exam-nonfiction-humanities | 인문/철학/사회/경제/법 분야 기출 | 고3 난도의 논지 압축과 반론 구조 유지 | source_selected |
| exam-nonfiction-science | 과학/기술/환경/언어/심리 분야 기출 | 고3 난도의 정보량, 도식 관계, 추론 축 유지 | source_selected |

## 문학 source 목록

| 작품군 | source_type | source 우선순위 | 사용 규칙 | status |
|---|---|---|---|---|
| `docs/wittgenstein1_schedule_365.md`에 배치된 52개 문학 작품 전체 | exam-literature | 기출 문학 지문 → 수특/수완 문학 지문 → 작품 원문 대조 | 같은 작품을 재사용해도 발췌 구간과 해설 포인트를 고3 수준으로 다시 잡음 | source_selected |

## 화법·작문·문법 source 목록

| 영역 | source_type | source 우선순위 | 사용 규칙 | status |
|---|---|---|---|---|
| 화법 | exam-speech | 고3 기출 화법 세트 → 수특/교재 유사 문항 | 발표, 토론, 청자 반응 추론, 반박 타당성 축 유지 | source_selected |
| 작문 | exam-writing | 고3 기출 작문 세트 → 수특/교재 유사 문항 | 자료 통합, 고쳐쓰기, 개요 수정, 비교·대조, 반박문 축 유지 | source_selected |
| 문법 | exam-grammar | 고3 기출 문법 세트 → 수특/교재 유사 문항 | 음운, 품사, 문장 구조, 중세국어, 규범 적용 축 유지 | source_selected |
