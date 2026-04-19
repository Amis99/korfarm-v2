# -*- coding: utf-8 -*-
"""
4-페르소나 휴리스틱 점검 — 일반 저학년 (소쉬르1·2·3 + 프레게1·2)
입력: _mc_저학년.jsonl
출력: _persona4_저학년_signals.jsonl  (의심 신호가 있는 항목만)

신호 코드:
  T1 교과서 통설과 어긋난 정답·해설
  T2 교육과정 외 개념
  T3 학년 수준 초과 어휘·개념
  T4 단순 암기형 (사고력 X)
  S1 글 안 읽어도 정답 추측 가능 (상식·일반 진리)
  S2 오답이 너무 황당해서 자동 제거됨
  S3 발문이 모호해서 무엇을 묻는지 불분명
  S4 정답·오답 경계가 모호
  S5 단정어 형식 단서로 정답 추측
  M1 사실 오류·시대착오·작품 원문 왜곡
  M2 데이터 무결성 결함 (정답 누락·매칭 실패)
  M3 AI 어투 명확
  M4 5선지/explanation 표현 단조 (LLM 흔적)
  M5 학습 가치 낮은 시간 낭비형
  I1 함정 패턴 단조
  I2 정답 위치 편향
  I3 변별력 낮음
  I4 explanation에 "왜 오답인지" 없음
  I5 어휘·개념 단답이 시중 교재 단어 선택과 어색
"""
import json
import os
import re

ROOT = r"C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서"
IN = os.path.join(ROOT, "_mc_저학년.jsonl")
OUT = os.path.join(ROOT, "_persona4_저학년_signals.jsonl")

# 도덕격언·일상상식 키워드 (B1 → S1)
MORAL_KW = [
    "노력", "포기하지", "도와", "도와야", "친구를 도와", "사이좋게", "양보", "예의",
    "정직", "솔직하게", "감사", "고마움", "사랑", "효도", "부모님께",
    "안전하게", "조심", "건강", "운동", "골고루", "편식하지", "꾸준히",
    "쓰레기", "재활용", "분리수거", "환경 보호", "자연 보호", "동물을 사랑",
    "약속을 지", "거짓말", "친절", "미소", "행복", "긍정",
    "심호흡", "깊이 숨", "마음을 진정",
    "배려", "협동", "함께", "용기",
]

# 비상식 함정 키워드 (S2: 오답이 명백히 비상식)
ABSURD_PATTERNS = [
    r"발로 (찬|차)",
    r"소리(를)?\s*(지|질)",
    r"물건을 던",
    r"때린다",
    r"부수",
    r"불을 (지른|놓)",
    r"학교를 안 가",
    r"잠을 안 자",
    r"밥을 안 먹",
    r"숫자가 (걸어|뛰)",
    r"하늘이 (땅|바닥)",
    r"물고기가 (날아|걸어)",
    r"나무가 (말|걷|뛰)",
    r"집을 부수",
]

def detect_signals(item):
    sigs = []  # list of (code, note)
    stem = (item.get("stem") or "").strip()
    choices = item.get("choices") or []
    answer = item.get("answer")
    explanation = (item.get("explanation") or "").strip()
    passage = (item.get("passage_excerpt") or "").strip()
    area = item.get("area") or ""

    # M2: 정답 누락
    if answer is None or str(answer).strip() == "":
        sigs.append(("M2", "정답 필드 비어있음"))

    # M2: 답이 선지 id 중에 없음
    if answer:
        ids = [str(c.get("id","")).strip() for c in choices if isinstance(c, dict)]
        if ids and str(answer).strip() not in ids:
            sigs.append(("M2", f"정답 '{answer}'이 선지 id {ids}에 없음"))

    # 정답 텍스트 추출
    ans_text = ""
    for c in choices:
        if isinstance(c, dict) and str(c.get("id","")).strip() == str(answer).strip():
            ans_text = c.get("text", "")
            break

    # M2: explanation 비어있음
    if not explanation:
        sigs.append(("M2", "해설 비어있음"))

    # I4: explanation 너무 짧음 (정답만 적시, 왜 오답이 함정인지 없음)
    if explanation and len(explanation) < 25:
        sigs.append(("I4", f"해설 짧음({len(explanation)}자) — 오답 분석 없음"))

    # S1: 도덕격언/상식 정답
    if ans_text:
        for kw in MORAL_KW:
            if kw in ans_text:
                sigs.append(("S1", f"정답 텍스트에 도덕격언/상식 키워드 '{kw}' 포함"))
                break

    # S2: 오답에 명백 비상식 패턴 (정답 자동 도출)
    other_texts = [c.get("text","") for c in choices if isinstance(c, dict) and str(c.get("id","")).strip() != str(answer).strip()]
    absurd_count = 0
    absurd_examples = []
    for txt in other_texts:
        for pat in ABSURD_PATTERNS:
            if re.search(pat, txt):
                absurd_count += 1
                absurd_examples.append(txt[:30])
                break
    if absurd_count >= 2:
        sigs.append(("S2", f"오답 {absurd_count}개가 비상식 ({'·'.join(absurd_examples[:2])})"))

    # S3: stem이 너무 짧음 (모호)
    if stem and len(stem) < 8:
        sigs.append(("S3", f"발문 너무 짧음({len(stem)}자)"))

    # 발문에 "본문/시/글/지문" 언급 없는데 본문 의존이 의심되는 케이스 패스 (false positive 많음)

    # M3/M4: AI 어투 — 해설에 단조 어미 반복
    if explanation:
        # 같은 종결어미 패턴 반복
        endings = re.findall(r"(어요\.|이에요\.|예요\.|입니다\.|아요\.|네요\.)", explanation)
        if len(endings) >= 4 and len(set(endings)) == 1:
            sigs.append(("M4", f"해설 종결어미 단조 반복 ({endings[0]} ×{len(endings)})"))
        # 따옴표 인용만으로 구성된 해설
        if explanation.count('"') >= 2 and len(explanation.replace('"','').strip()) < 30:
            sigs.append(("M4", "해설이 본문 인용만으로 구성"))

    # T3: 학년 수준 초과 어휘 (소쉬르군에 한자어 5자 이상 단어 빈출)
    level = item.get("level","")
    if level.startswith("소쉬르"):
        # 한자어 추정: 받침 없는 두/세 글자가 아니라, 추상명사
        hard_words = ["관념", "범주", "추상", "구체화", "본질", "양상", "인식", "총체", "현상학", "변증", "포섭"]
        for w in hard_words:
            if w in stem or w in ans_text:
                sigs.append(("T3", f"초저 수준 초과 단어 '{w}'"))
                break

    # I3: 변별력 — 4선지인데 stem이 단답형(어휘 매칭) — 시각적 즉답
    # (휴리스틱 한계, 별도 처리)

    # S5: 정답에만 단정어 ("항상/모두/완전히/반드시")
    determiners = ["항상", "모두", "전혀", "완전히", "반드시", "절대"]
    if ans_text:
        for d in determiners:
            if d in ans_text and not any(d in c.get("text","") for c in choices if isinstance(c, dict) and str(c.get("id","")).strip() != str(answer).strip()):
                sigs.append(("S5", f"정답에만 단정어 '{d}'"))
                break

    return sigs

# 정답 위치 편향 (I2) — 챕터별/레벨별 정답 분포
def position_bias(items):
    from collections import Counter
    by_file = {}
    for it in items:
        key = (it["level"], it["file"])
        by_file.setdefault(key, []).append(str(it.get("answer","")).strip())
    biased = []
    for key, ans_list in by_file.items():
        c = Counter(ans_list)
        total = sum(c.values())
        if total < 4: continue
        for pos, cnt in c.items():
            if pos and cnt / total >= 0.6:
                biased.append((key, pos, cnt, total))
    return biased

with open(IN, encoding="utf-8") as f:
    items = [json.loads(l) for l in f]

print(f"총 점검: {len(items)}건")

with open(OUT, "w", encoding="utf-8") as f:
    flagged = 0
    sig_counts = {}
    for it in items:
        sigs = detect_signals(it)
        if sigs:
            it["_signals"] = sigs
            f.write(json.dumps(it, ensure_ascii=False) + "\n")
            flagged += 1
            for s, _ in sigs:
                sig_counts[s] = sig_counts.get(s, 0) + 1

print(f"의심 발견: {flagged}건")
print("신호별 카운트:")
for s in sorted(sig_counts):
    print(f"  {s}: {sig_counts[s]}")

# 위치 편향
biased = position_bias(items)
print(f"\n정답 위치 편향(I2) 챕터: {len(biased)}건")
for key, pos, cnt, total in biased[:20]:
    print(f"  {key[0]} / {key[1]}: '{pos}' {cnt}/{total}")
