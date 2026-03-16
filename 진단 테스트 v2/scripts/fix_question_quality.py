# -*- coding: utf-8 -*-
import json
import re
from pathlib import Path

import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from core import COMPETENCIES, COMPETENCIES_SET, ERROR_PATHS
from core.vectors import normalize_positive, normalize_negative

ROOT = Path('data')

NEGATIVE_PATTERNS = [
    r"않은", r"아닌", r"적절하지", r"옳지", r"틀린", r"일치하지", r"맞지 않는", r"부적절한", r"부적절하지",
]

GRAMMAR_KEYWORDS = [
    "품사", "형태소", "음운", "맞춤법", "발음", "문법", "조사", "어미", "문장 성분",
    "안은문장", "피동", "사동", "활용", "용언", "받침", "표준 발음", "연음", "된소리",
]
VOCAB_KEYWORDS = [
    "뜻", "의미", "유의", "반의", "바꿔", "한자", "성어", "속담", "어휘", "어법",
]

BAD_ERROR_SUBSTRINGS = [
    "오답 분석 내용 없음",
    "정답 없음",
]

QUANTIFIERS = ["모두", "항상", "전부", "절대", "반드시", "모든", "완전히", "전혀"]
CAUSE_WORDS = ["때문", "따라", "그래서", "결과", "원인", "이므로", "이라서", "이면"]


def is_negative(stem: str) -> bool:
    if not stem:
        return False
    return any(re.search(pat, stem) for pat in NEGATIVE_PATTERNS)


def is_grammar_question(stem: str, box: str) -> bool:
    text = f"{stem} {box}" if box else stem
    return any(k in text for k in GRAMMAR_KEYWORDS)


def is_vocab_question(stem: str, box: str) -> bool:
    text = f"{stem} {box}" if box else stem
    return any(k in text for k in VOCAB_KEYWORDS)


def default_competencies(qtype: str, stem: str, box: str):
    if qtype == "어휘단독형":
        if is_grammar_question(stem, box):
            return ["어법·문법 능력", "국어 개념 적용 능력"]
        return ["어휘력", "문장 독해력"]
    if qtype == "논리추론형":
        return ["논리 사고력", "문장 독해력"]
    if qtype == "지문근거형":
        return ["문장 독해력", "구조 독해력"]
    if qtype == "외부지식형":
        return ["국어 관련 배경지식", "논리 사고력"]
    return ["문장 독해력", "논리 사고력"]


def pick_error_path(qtype: str, stem: str, choice_text: str, used):
    is_neg = is_negative(stem)
    heuristic = None
    if any(q in (choice_text or "") for q in QUANTIFIERS):
        heuristic = "과도한 일반화"
    elif any(w in (choice_text or "") for w in CAUSE_WORDS):
        heuristic = "인과 관계 왜곡"

    if qtype == "어휘단독형":
        key = "어휘단독형_grammar" if is_grammar_question(stem, "") else "어휘단독형_vocab"
    else:
        key = qtype if qtype in ERROR_PATHS else "default"

    candidates = ERROR_PATHS.get(key, ERROR_PATHS["default"]).copy()
    if heuristic and heuristic in candidates:
        candidates.remove(heuristic)
        candidates.insert(0, heuristic)

    for cand in candidates:
        label = f"부정형 문항 오독: {cand}" if is_neg else cand
        if label not in used:
            return label

    base = "부정형 문항 오독: 근거 혼동" if is_neg else "근거 혼동"
    idx = 1
    label = f"{base} ({idx})"
    while label in used:
        idx += 1
        label = f"{base} ({idx})"
    return label


def should_replace_error_path(ep: str) -> bool:
    if not ep:
        return True
    return any(bad in ep for bad in BAD_ERROR_SUBSTRINGS)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=4) + "\n", encoding="utf-8")


question_files = list(ROOT.rglob("questions/*.json"))
modified = 0

for qfile in question_files:
    data = load_json(qfile)
    updated = False

    # Sync passage metadata
    passage_dir = qfile.parent.parent
    meta_path = passage_dir / "metadata.json"
    if meta_path.exists():
        meta = load_json(meta_path)
        passage = data.get("passage", {})
        if meta.get("level") is not None and passage.get("level") != meta.get("level"):
            passage["level"] = meta.get("level")
            updated = True
        if meta.get("genre") is not None and passage.get("genre") != meta.get("genre"):
            passage["genre"] = meta.get("genre")
            updated = True
        if meta.get("passage_id") and passage.get("passage_id") != meta.get("passage_id"):
            passage["passage_id"] = meta.get("passage_id")
            updated = True
        data["passage"] = passage

    q = data.get("question", {})
    qtype = q.get("type") or ""
    stem = q.get("stem") or ""
    box = q.get("box") or ""

    if "choices" in data and data.get("correct_choice"):
        correct_id = data.get("correct_choice")
        default_keys = default_competencies(qtype, stem, box)

        for choice in data["choices"]:
            vec = choice.get("vector")
            if not isinstance(vec, dict):
                vec = {}

            vec = {k: v for k, v in vec.items() if k in COMPETENCIES_SET}

            if choice.get("choice_id") == correct_id:
                if not vec:
                    vec = {k: 10 for k in default_keys[:2]}
                else:
                    vec = {k: normalize_positive(v) for k, v in vec.items()}
            else:
                if not vec:
                    vec = {k: -3 for k in default_keys[:2]}
                else:
                    vec = {k: normalize_negative(int(v)) for k, v in vec.items()}

            if len(vec) > 4:
                trimmed = {}
                for k in list(vec.keys())[:4]:
                    trimmed[k] = vec[k]
                vec = trimmed

            choice["vector"] = vec
            updated = True

        all_keys = set()
        for choice in data["choices"]:
            all_keys.update(choice.get("vector", {}).keys())
        if len(all_keys) < 2:
            for k in default_keys:
                if k not in all_keys:
                    for choice in data["choices"]:
                        if choice.get("choice_id") == correct_id:
                            if len(choice["vector"]) < 4:
                                choice["vector"][k] = 10
                                all_keys.add(k)
                                updated = True
                            break
                    break

        used = set()
        for choice in data["choices"]:
            if choice.get("choice_id") == correct_id:
                ep = choice.get("error_path")
                if not ep:
                    choice["error_path"] = "정답"
                    updated = True
                continue

            ep = choice.get("error_path")
            force_negative = is_negative(stem) and ep and "부정형" not in ep
            if should_replace_error_path(ep) or ep in used or force_negative:
                new_ep = pick_error_path(qtype, stem, choice.get("text", ""), used)
                choice["error_path"] = new_ep
                used.add(new_ep)
                updated = True
            else:
                used.add(ep)

    if "grading_criteria" in data:
        for crit in data.get("grading_criteria", []):
            vec = crit.get("vector")
            if not isinstance(vec, dict):
                vec = {}
            vec = {k: v for k, v in vec.items() if k in COMPETENCIES_SET}
            if not vec:
                default_keys = default_competencies(qtype, stem, box)
                vec = {k: 10 for k in default_keys[:2]}
            else:
                vec = {k: 10 for k in vec.keys()}
            if len(vec) > 4:
                trimmed = {}
                for k in list(vec.keys())[:4]:
                    trimmed[k] = vec[k]
                vec = trimmed
            crit["vector"] = vec
            updated = True

    if updated:
        save_json(qfile, data)
        modified += 1

print(f"Modified {modified} question files.")
