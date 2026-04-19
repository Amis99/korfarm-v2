# -*- coding: utf-8 -*-
"""
저학년 (소쉬르1·2·3 + 프레게1·2) 객관식 소문항 추출 + 답지 매칭
출력: _mc_저학년.jsonl  (한 줄에 하나의 소문항)
"""
import json
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = r"C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고"
LEVELS = ["소쉬르1", "소쉬르2", "소쉬르3", "프레게1", "프레게2"]
OUT = os.path.join(ROOT, "_검수보고서", "_mc_저학년.jsonl")

def find_passage_for(sections, idx):
    for j in range(idx - 1, -1, -1):
        s = sections[j]
        t = s.get("type", "")
        if t == "passage":
            content = s.get("content", {})
            if isinstance(content, dict):
                txt = content.get("text") or content.get("body") or content.get("passage") or content.get("paragraphs")
                if isinstance(txt, list):
                    txt = "\n".join([str(x) for x in txt])
                if txt:
                    return s.get("title", ""), str(txt)[:2000]
            elif isinstance(content, str):
                return s.get("title", ""), content[:2000]
    return "", ""

def collect_answer_map(sections):
    """ id ending with _answer -> dict[refId] = (answer, explanation) """
    m = {}
    for s in sections:
        if s.get("type") == "answer_explain" and s.get("subtype") == "객관식":
            sid = s.get("id", "")
            base = sid[:-len("_answer")] if sid.endswith("_answer") else sid
            content = s.get("content", {})
            items = content.get("items", []) if isinstance(content, dict) else []
            d = {}
            for it in items:
                rid = str(it.get("refId", ""))
                d[rid] = {
                    "answer": it.get("answer"),
                    "explanation": it.get("explanation", ""),
                }
            m[base] = d
    return m

def extract_mc(level):
    folder = os.path.join(ROOT, level)
    files = sorted([f for f in os.listdir(folder) if f.endswith(".json")])
    out = []
    for fn in files:
        path = os.path.join(folder, fn)
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"ERR read {fn}: {e}", file=sys.stderr)
            continue
        sections = data.get("sections", [])
        amap = collect_answer_map(sections)
        for i, sec in enumerate(sections):
            if sec.get("type") != "question": continue
            if sec.get("subtype") != "객관식": continue
            content = sec.get("content", {})
            sec_id = sec.get("id", "")
            ans_d = amap.get(sec_id, {})
            options = content.get("items") or content.get("options") or []
            ptitle, ptext = find_passage_for(sections, i)
            # options 가 소문항 목록인지 확인
            for o in options:
                if not isinstance(o, dict): continue
                if "choices" not in o: continue
                num = str(o.get("number", ""))
                stem = o.get("stem", "")
                choices = o.get("choices", [])
                ainfo = ans_d.get(num, {})
                out.append({
                    "level": level,
                    "file": fn,
                    "section_id": sec_id,
                    "section_title": sec.get("title", ""),
                    "area": sec.get("area", ""),
                    "subq": num,
                    "stem": stem,
                    "choices": choices,
                    "answer": ainfo.get("answer"),
                    "explanation": ainfo.get("explanation", ""),
                    "passage_title": ptitle,
                    "passage_excerpt": ptext,
                })
    return out

all_q = []
for lv in LEVELS:
    qs = extract_mc(lv)
    print(f"{lv}: {len(qs)}건")
    all_q.extend(qs)

print(f"총: {len(all_q)}건")

with open(OUT, "w", encoding="utf-8") as f:
    for q in all_q:
        f.write(json.dumps(q, ensure_ascii=False) + "\n")

print(f"저장: {OUT}")
