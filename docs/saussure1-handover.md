# 일일독해 소쉬르 장르 비율 재작성 및 통합 인수인계 문서

> 이 문서는 기존의 규칙들을 .agents/skills 에이전트 스킬 세트로 분리한 가볍고 명확한 **허브 문서**입니다.
> 
> 브랜치: `daily-reading-rewrite`
> 작업자: 안티그래비티
> 작성일: 2026-03-27
> 최종 머지 대상: `gh-pages`
> 총 남은 파일: **1,941파일**

---

## 1. 개편된 작업 규칙 구조 (Agent Skills 연동)
이제부터 모든 세부 작업 규칙(문항 작성법, 인덱싱 매핑, 밸런스, 지시어 금지)은 에이전트 스킬로 분리, 관리됩니다. 에이전트는 작업을 시작하거나 점검할 때 반드시 아래의 스킬들을 습득(read)하여 행동해야 합니다.

* [saussure_intensive_quality/SKILL.md](../../.agents/skills/saussure_intensive_quality/SKILL.md) : **정독(Intensive) 문항 작성 및 품질 관리 스킬**
  → 초등학교 1학년 눈높이, 밸런스 맞춤, 그리고 🚨**문장 지시 표현 절대 금지**🚨 규칙을 포함합니다.
* [saussure_recall_confirm/SKILL.md](../../.agents/skills/saussure_recall_confirm/SKILL.md) : **복기(Recall) 및 확인(Confirm) 문항 작성 스킬**
  → `answerRanges` 매핑 규칙, 다중 위치 배열화 규칙을 포함합니다.
* [saussure_theme_rotation/SKILL.md](../../.agents/skills/saussure_theme_rotation/SKILL.md) : **장르 및 주제 10일 순환 관리 메타데이터 스킬**
* [saussure_workflow_validation/SKILL.md](../../.agents/skills/saussure_workflow_validation/SKILL.md) : **에이전트 시스템 작업 흐름 및 10계명 최종 검증 스킬**

---

## 2. 전체 진행 상황 (Progress)

| # | 레벨 | 폴더 | 완료 | 남은 범위 | 남은 파일 | 복기 카드 | 지문 길이 |
|---|------|------|------|----------|----------|----------|----------|
| 1 | **소쉬르1** | saussure1 | Day 1~249 | **Day 250~365** | **116** | 4카드 | 300±30자 |
| 2 | **소쉬르2** | saussure2 | — | Day 1~365 | **365** | 4카드 | 400±30자 |
| 3 | **소쉬르3** | saussure3 | — | Day 1~365 | **365** | 4카드 | 700±50자 |
| 4 | **프레게1** | frege1 | — | Day 1~365 | **365** | 5카드 | 600±50자 |
| 5 | **프레게2** | frege2 | — | Day 1~365 | **365** | 5카드 | 900±50자 |
| 6 | **프레게3** | frege3 | — | Day 1~365 | **365** | 5카드 | 1000±50자 |

**작업 순서**: 위 표 순서대로 (현재 `saussure1` 작업 중)

### 기타 참고 문서
- `HANDOVER.md` 기존 루트 인수인계 문서 (현재 에이전트의 구체적 작업은 Skills를 우선 참조할 것)
