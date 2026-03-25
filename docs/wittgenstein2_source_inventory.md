# 비트겐슈타인 2 지문 목록

## 요약

- 이 문서는 `비트겐슈타인2`의 **1단계 지문 목록** 문서다.
- 실제 날짜 배치는 `docs/wittgenstein2_schedule_365.md`에서 관리한다.
- 비문학과 문학 day 모두 **기출/수특 지문**을 우선 source로 삼는다.
- 상태값은 `source_selected`, `scheduled`, `learning_built`만 사용한다.

## 비문학 source 목록

| source_type | source 우선순위 | 사용 규칙 | status |
|---|---|---|---|
| exam-nonfiction | 고2 기출 비문학 지문 → 수특 연계 지문 → EBS/교재 수록 변형 원고 | 원지문 정보 구조와 추론 포인트 유지 | source_selected |
| exam-nonfiction-humanities | 인문/철학/사회/경제/법 분야 기출 | 보기-본문 연동 구조 유지 | source_selected |
| exam-nonfiction-science | 과학/기술/환경/언어/심리 분야 기출 | 정보량과 용어 수준을 고2 기준으로 유지 | source_selected |

## 문학 source 목록

| 작품군 | source_type | source 우선순위 | 사용 규칙 | status |
|---|---|---|---|---|
| `docs/wittgenstein1_schedule_365.md`에 배치된 52개 문학 작품 전체 | exam-literature | 기출 문학 지문 → 수특 문학 지문 → 작품 원문 대조 | 같은 작품을 재사용하더라도 발췌 구간과 문제 축을 고2 수준으로 다시 잡음 | source_selected |

## 화법·작문·문법 source 목록

| 영역 | source_type | source 우선순위 | 사용 규칙 | status |
|---|---|---|---|---|
| 화법 | exam-speech | 고2 기출 화법 세트 → 수특/교재 유사 문항 | 반응 추론, 협상, 토론, 발표 평가 축 유지 | source_selected |
| 작문 | exam-writing | 고2 기출 작문 세트 → 수특/교재 유사 문항 | 자료 통합, 개요 수정, 고쳐쓰기, 논증 전개 축 유지 | source_selected |
| 문법 | exam-grammar | 고2 기출 문법 세트 → 수특/교재 유사 문항 | 음운, 문장 구조, 의미 관계, 어문 규범 축 유지 | source_selected |
