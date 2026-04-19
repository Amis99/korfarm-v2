# -*- coding: utf-8 -*-
"""신호 발견 항목 + 정답 위치 편향 챕터를 사람이 읽을 수 있는 텍스트로 덤프"""
import json
import os
from collections import Counter

ROOT = r"C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서"
SIG = os.path.join(ROOT, "_persona4_저학년_signals.jsonl")
ALL = os.path.join(ROOT, "_mc_저학년.jsonl")
OUT = os.path.join(ROOT, "_persona4_저학년_dump.txt")

with open(SIG, encoding="utf-8") as f:
    sigs = [json.loads(l) for l in f]
with open(ALL, encoding="utf-8") as f:
    items = [json.loads(l) for l in f]

# 위치 편향 챕터의 항목들도 함께 보기 위해 (level, file)별 정답 카운트
by_file = {}
for it in items:
    by_file.setdefault((it["level"], it["file"]), []).append(it)

biased_files = []
for key, lst in by_file.items():
    ans = [str(it.get("answer","")).strip() for it in lst]
    c = Counter(ans)
    total = sum(c.values())
    for pos, cnt in c.items():
        if pos and cnt/total >= 0.6 and total >= 4:
            biased_files.append((key, pos, cnt, total))

with open(OUT, "w", encoding="utf-8") as f:
    f.write("# 신호 발견 항목 상세\n\n")
    for it in sigs:
        f.write(f"--- {it['level']} | {it['file']} | {it.get('section_id','')} | Q{it['subq']} ---\n")
        f.write(f"area: {it.get('area','')}\n")
        f.write(f"signals: {it['_signals']}\n")
        f.write(f"stem: {it.get('stem','')}\n")
        for c in it.get('choices', []):
            mark = " <- 정답" if str(c.get('id','')).strip() == str(it.get('answer','')).strip() else ""
            f.write(f"  {c.get('id','')}. {c.get('text','')}{mark}\n")
        f.write(f"explanation: {it.get('explanation','')}\n")
        passage = it.get('passage_excerpt','')
        if passage:
            f.write(f"passage: {passage[:300]}...\n")
        f.write("\n")

    f.write("\n\n# 정답 위치 편향 (I2)\n\n")
    for key, pos, cnt, total in biased_files:
        f.write(f"{key[0]} | {key[1]} | 정답 '{pos}' 비율 {cnt}/{total} ({cnt/total*100:.0f}%)\n")

print(f"덤프 저장: {OUT}")
print(f"신호 항목: {len(sigs)} / 위치 편향 챕터: {len(biased_files)}")
