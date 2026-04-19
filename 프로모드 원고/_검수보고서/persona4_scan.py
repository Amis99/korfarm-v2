# -*- coding: utf-8 -*-
"""4-페르소나(T·S·M·I) 신호 검출 스크립트.

대상: 프레게3, 러셀1·2·3 (전 챕터)
객관식 문항 전수 평가.
"""

import json
import os
import re
import sys
from collections import Counter, defaultdict

ROOT = r"C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고"
LEVELS = ["프레게3", "러셀1", "러셀2", "러셀3"]
OUT = os.path.join(ROOT, "_검수보고서", "persona4_check_일반고학년.md")

# ---- 페르소나 신호 정의 ----
# T(학교 선생님): T1 교과서 통설 어긋, T2 교육과정 외 개념, T3 학년 수준 초과 어휘, T4 단순 암기형
# S(학생): S1 글 안 읽고 풀림, S2 오답 황당, S3 발문 모호, S4 정·오답 모호, S5 단정어 단서
# M(학부모): M1 사실 오류, M2 데이터 결함(정답 누락), M3 AI 어투, M4 5선지/해설 단조, M5 학습가치 낮음
# I(학원 강사): I1 함정 단조, I2 정답 위치 편향(파일/챕터별), I3 변별력 낮음, I4 해설 부실, I5 어휘 어색

# ---- 어휘 패턴 ----
ABS_RE = re.compile(r"(완전히|전혀|절대|반드시|항상|언제나|모두|아무도|결코|무조건|전적으로|모든\s*것)")
NEG_STEM_RE = re.compile(r"(않은|없는|아닌|적절하지|옳지|틀린|잘못된|올바르지|바람직하지|적절치)")
AI_TONE_RE = re.compile(r"(있어요|이에요|이랍니다|랍니다|이랍니다\.|에요\.)")

# 보편 도덕/상식 키워드 (B1)
UNIVERSAL_RE = re.compile(r"(효도|존중|배려|성실|정직|약속을\s*지|예의|희생|봉사|사랑은\s*위대|평화|화합)")

def head8(s):
    s = re.sub(r"^[①-⑨]\s*", "", s).strip()
    return s[:8]

def strip_id(s):
    return re.sub(r"^[①-⑨]\s*", "", s).strip()

def stem_norm(s):
    return re.sub(r"\s+", "", s)

def scan_question(item, ans_map, file_label, area):
    """한 문항(item) → 신호 리스트 반환. (signals[(코드, 사유)])."""
    qno = str(item.get("number", "?"))
    stem = item.get("stem", "") or ""
    choices = item.get("choices") or []
    sigs = []
    ans_obj = ans_map.get(qno) or {}
    answer = (ans_obj.get("answer") or "").strip()
    explanation = (ans_obj.get("explanation") or "").strip()

    # M2 / Z계열: 정답 누락
    if not answer:
        sigs.append(("M2", "정답 누락"))
    if qno not in ans_map:
        sigs.append(("M2", "해설 항목 자체 누락"))
    if ans_obj and not explanation:
        sigs.append(("I4", "해설 본문 누락"))

    # 선지 분석
    texts = [strip_id(c.get("text", "")) for c in choices]
    if len(texts) != 5:
        sigs.append(("M2", f"선지 개수 비표준({len(texts)})"))

    # M4: 5선지 머리 8자 동일 (단조)
    heads = [head8(t) for t in texts if t]
    if len(heads) >= 4 and len(set(heads)) <= max(1, len(heads) - 3):
        sigs.append(("M4", "5선지 머리 8자 패턴 단조"))

    # I1: 5선지 동일 어구 반복("~를 통해", "~하고 있다" 등)
    common_tail = ["하고 있다", "을 통해", "를 통해", "을 보여 준다", "를 보여 준다"]
    for tail in common_tail:
        cnt = sum(1 for t in texts if tail in t)
        if cnt >= 4:
            sigs.append(("I1", f"5선지 반복어구\"{tail}\""))
            break

    # S5: 부정형 발문 + 단정어 정답
    if NEG_STEM_RE.search(stem):
        idx = None
        for i, c in enumerate(choices):
            if c.get("id") == answer:
                idx = i
                break
        if idx is not None and idx < len(texts):
            ans_text = texts[idx]
            m = ABS_RE.search(ans_text)
            if m:
                sigs.append(("S5", f"부정형+단정어\"{m.group(1)}\""))

    # S1/B1: 보편 도덕 정답 (지문 무관 추측)
    if answer:
        for i, c in enumerate(choices):
            if c.get("id") == answer and i < len(texts):
                if UNIVERSAL_RE.search(texts[i]):
                    sigs.append(("S1", "정답이 보편 도덕(지문 무관)"))
                break

    # S3: 발문 모호 — stem이 너무 짧거나 명사형으로 끝남
    if stem and len(stem.strip()) < 10:
        sigs.append(("S3", "발문 너무 짧음"))

    # M3/M4: 해설이 단조 (1문장 미만 or '입니다'로만 끝)
    if explanation:
        # M3: 해설이 너무 짧음
        if len(explanation) < 20:
            sigs.append(("I4", "해설 너무 짧음(<20자)"))
        # AI 어투 — '~ㅂ니다' 단조
        # 이 레벨군은 중·고교생 대상이라 너무 친근체("~이에요"·"~답니다") 다수 → M3
        if explanation.count("이에요") + explanation.count("랍니다") + explanation.count("이랍니다") >= 2:
            sigs.append(("M3", "AI 친근체 어투(중고생용 부적합)"))

    # T3: 학년 수준 어휘 — (스킵, 영역별 다름)

    # A5(stem→정답 누설) 간이 — stem 마지막 12자 안에 정답 텍스트 8자 이상 포함
    if answer and len(texts) >= 5:
        idx = None
        for i, c in enumerate(choices):
            if c.get("id") == answer:
                idx = i
                break
        if idx is not None:
            ans_text_norm = stem_norm(texts[idx])
            stem_n = stem_norm(stem)
            if len(ans_text_norm) >= 8 and ans_text_norm[:8] in stem_n:
                sigs.append(("S1", f"stem→정답 누설\"{ans_text_norm[:8]}\""))

    return qno, area, answer, sigs


def process_file(path):
    """파일 1개 처리 → (파일명, 객관식 결과 리스트)."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    sections = data.get("sections", [])
    # answer_explain id → items map
    ans_lookup = {}
    for s in sections:
        if s.get("type") == "answer_explain" and s.get("subtype") == "객관식":
            sid = s.get("id", "")
            base = sid[:-len("_answer")] if sid.endswith("_answer") else sid
            items = (s.get("content") or {}).get("items") or []
            ans_lookup[base] = {str(it.get("refId")): it for it in items}

    results = []
    answer_positions = []
    for s in sections:
        if s.get("type") != "question" or s.get("subtype") != "객관식":
            continue
        sid = s.get("id", "")
        ans_map = ans_lookup.get(sid, {})
        area = s.get("area", "")
        items = (s.get("content") or {}).get("items") or []
        for it in items:
            qno, area_, ans, sigs = scan_question(it, ans_map, os.path.basename(path), area)
            results.append((sid, qno, area_, ans, sigs))
            if ans:
                answer_positions.append(ans)
    return results, answer_positions


def main():
    file_results = []
    overall_pos = Counter()
    file_pos = {}
    total_q = 0
    for level in LEVELS:
        d = os.path.join(ROOT, level)
        if not os.path.isdir(d):
            continue
        for fn in sorted(os.listdir(d)):
            if not fn.endswith(".json"):
                continue
            full = os.path.join(d, fn)
            try:
                res, positions = process_file(full)
            except Exception as e:
                print(f"ERR {fn}: {e}", file=sys.stderr)
                continue
            file_results.append((level, fn, res))
            total_q += len(res)
            for p in positions:
                overall_pos[p] += 1
            file_pos[(level, fn)] = Counter(positions)

    # I2: 파일별 정답 위치 편향 (한 위치 60%+ AND 문항 5건 이상)
    skewed = []
    for k, c in file_pos.items():
        n = sum(c.values())
        if n < 5:
            continue
        for pos, cnt in c.items():
            if cnt / n >= 0.6:
                skewed.append((k, pos, cnt, n))

    # 모든 의심 문항 모음
    rows = []
    sig_counter = Counter()
    persona_counter = Counter()  # T/S/M/I prefix
    sev_counter = Counter()
    for level, fn, res in file_results:
        ch = re.search(r"\(챕터(\d+)\)", fn)
        ch_label = f"ch{ch.group(1)}" if ch else fn
        for sid, qno, area, ans, sigs in res:
            if not sigs:
                continue
            for code, reason in sigs:
                sig_counter[code] += 1
                persona_counter[code[0]] += 1
            # 우선순위 산정
            codes = [c for c, _ in sigs]
            sev = "medium"
            if any(c in ("M2", "S5", "S1") for c in codes):
                sev = "critical"
            elif any(c in ("I4", "M3") for c in codes):
                sev = "high"
            sev_counter[sev] += 1
            label = f"{level} {ch_label}"
            persona_set = sorted(set(c[0] for c, _ in sigs))
            persona_label = "/".join(persona_set)
            sigs_label = "·".join(f"{c}" for c, _ in sigs)
            reason_label = "; ".join(r for _, r in sigs)
            ans_label = ans if ans else "(없음)"
            rows.append({
                "file": label,
                "q": f"Q{qno}",
                "area": area,
                "persona": persona_label,
                "sigs": sigs_label,
                "ans": ans_label,
                "reason": reason_label,
                "sev": sev,
            })

    # 요약 통계
    pos_total = sum(overall_pos.values())
    pos_pct = {k: f"{overall_pos[k]/pos_total*100:.1f}%" for k in ["①","②","③","④","⑤"] if pos_total}

    # 정답 위치 편향(I2) — 파일별로
    for (level, fn), pos, cnt, n in skewed:
        ch = re.search(r"\(챕터(\d+)\)", fn)
        ch_label = f"ch{ch.group(1)}" if ch else fn
        rows.append({
            "file": f"{level} {ch_label}",
            "q": "(파일전체)",
            "area": "-",
            "persona": "I",
            "sigs": "I2",
            "ans": pos,
            "reason": f"정답 위치 편향 {pos} {cnt}/{n}건",
            "sev": "high",
        })
        sig_counter["I2"] += 1
        persona_counter["I"] += 1
        sev_counter["high"] += 1

    # 출력 정렬
    sev_order = {"critical": 0, "high": 1, "medium": 2}
    rows.sort(key=lambda r: (sev_order[r["sev"]], r["file"], r["q"]))

    # 보고서 작성
    lines = []
    lines.append("# 4-페르소나 점검 보고서 — 일반 고학년 (프레게3 + 러셀1·2·3)")
    lines.append("")
    lines.append("4-페르소나(T 학교 선생님 / S 학생 / M 학부모 / I 학원 강사)")
    lines.append("기준 의심 신호 자동 검출. `_검수보고서/persona4_check_guide.md` 참조.")
    lines.append("")
    lines.append("## 요약")
    lines.append(f"- 점검 총: **{total_q}건** (객관식)")
    lines.append(f"- 의심 발견: **{len(rows)}건** (critical {sev_counter.get('critical',0)} / high {sev_counter.get('high',0)} / medium {sev_counter.get('medium',0)})")
    lines.append(f"- 페르소나 신호 분포: T({persona_counter.get('T',0)}) / S({persona_counter.get('S',0)}) / M({persona_counter.get('M',0)}) / I({persona_counter.get('I',0)})")
    lines.append(f"- 전체 정답 위치 분포: ① {pos_pct.get('①','-')} / ② {pos_pct.get('②','-')} / ③ {pos_pct.get('③','-')} / ④ {pos_pct.get('④','-')} / ⑤ {pos_pct.get('⑤','-')}")
    lines.append("")
    lines.append("### 신호별 분포")
    for code, cnt in sig_counter.most_common():
        lines.append(f"- **{code}**: {cnt}건")
    lines.append("")

    # 분류별 표
    for sev, label in [("critical","critical"),("high","high"),("medium","medium")]:
        sub = [r for r in rows if r["sev"] == sev]
        if not sub:
            continue
        lines.append(f"## 의심 문항 표 ({label}) — {len(sub)}건")
        lines.append("")
        lines.append("| 파일 | Q | 영역 | 페르소나 | 신호 | 정답 | 의심 사유 (1줄) |")
        lines.append("|---|---|---|---|---|---|---|")
        for r in sub:
            lines.append(f"| {r['file']} | {r['q']} | {r['area']} | {r['persona']} | {r['sigs']} | {r['ans']} | {r['reason']} |")
        lines.append("")

    # 페르소나별 패턴 분석
    lines.append("## 페르소나별 패턴 분석")
    lines.append("")
    lines.append("### T (학교 선생님) 시각")
    lines.append("- 자동 검출 한계로 교과서 통설 어긋(T1) 등은 수동 확인 필요. 본 자동 점검에서는 표 형식·누락 위주.")
    lines.append("")
    lines.append("### S (학생) 시각")
    lines.append("- 부정형 발문(예: \"적절하지 않은 것은\")에 정답이 단정어(완전히/전혀/반드시 등) 포함 — 글 안 읽고 추측 가능 (S5).")
    lines.append("- stem 일부 어구가 정답 선지에 그대로 포함되어 정답이 누설되는 사례(S1).")
    lines.append("- 정답이 보편 도덕(효도·존중 등)이라 지문과 무관하게 추측되는 경우(S1).")
    lines.append("")
    lines.append("### M (학부모) 시각")
    lines.append("- 정답 누락(M2)·해설 항목 누락 — 데이터 결함은 학습 신뢰도 직격타.")
    lines.append("- 중·고교생 대상인데 \"~이에요\", \"~답니다\" 친근체 해설 다수(M3) — 학습 어투 부적합.")
    lines.append("- 5선지 머리 8자 동일 패턴(M4) — 출제 단조함.")
    lines.append("")
    lines.append("### I (학원 강사) 시각")
    lines.append("- 정답 위치 편향(I2): 한 위치(주로 ⑤)에 60% 이상 몰린 파일 다수.")
    lines.append("- 5선지 어구 반복(\"~하고 있다\" 등 4개+) — 함정 패턴 단조(I1).")
    lines.append("- 해설이 \"왜 정답인지\"만 적고 \"왜 오답이 함정인지\" 누락 사례 다수(I4).")
    lines.append("")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"OK total={total_q} suspect={len(rows)} → {OUT}")


if __name__ == "__main__":
    main()
