import json
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple


API_BASE = "http://localhost:8080"
LOGIN_ID = "hqadmin"
LOGIN_PASSWORD = "admin1234"

SERVER_ID = "wittgenstein"
CATEGORY = "문학 작품"
QUESTION_TYPE = "READING"
TIME_LIMIT_SEC = 45

SOURCE_LIST_JSON = Path("witt_lit_local_md_sources_20260212.json")
TARGET_COUNT = 100

PAYLOAD_OUT = Path("witt_lit_local_md_examq_payload_20260212.json")
SOURCES_OUT = Path("witt_lit_local_md_examq_sources_20260212.json")
MISSING_OUT = Path("witt_lit_local_md_examq_missing_20260212.json")


# Some source files have answer key only in explanation text.
MANUAL_ANSWER_BY_NEW_ID = {
    "witt-lit-man-026": 3,
    "witt-lit-man-023": 2,
    "witt-lit-man-052": 3,
    "witt-lit-man-063": 2,
}


QUESTION_HEADER_RE = re.compile(r"^\s*\**\s*(\d+)\s*\\?\.\s*(.+)")
ANSWER_RE = re.compile(r"(?:정답|답)\s*[:：]?\s*([①②③④⑤1-5])")
CHOICE_SYMBOL_RE = re.compile(r"[①②③④⑤]")
CHOICE_DIGIT_LINE_RE = re.compile(r"^\s*([1-5])[\.\)]\s*(.+?)\s*$")


@dataclass
class ParsedQuestion:
    stem: str
    choices: List[Dict[str, str]]
    answer_id: str


@dataclass
class Work:
    old_id: str
    new_id: str
    title: str
    author: str
    file_path: Path
    passage: str
    question: ParsedQuestion


def parse_title_author(stem: str) -> Tuple[str, str]:
    s = stem.strip()
    if "_" in s:
        title, author = s.rsplit("_", 1)
    else:
        title, author = s, "작자 미상"
    title = re.sub(r"\s+", " ", title).strip()
    author = re.sub(r"\s+", " ", author).strip() or "작자 미상"
    return title, author


def normalize_line(line: str) -> str:
    return line.replace("\ufeff", "").rstrip("\n\r")


def clean_markdown_inline(text: str) -> str:
    s = text.strip()
    s = re.sub(r"^\*+|\*+$", "", s).strip()
    s = s.replace("\\<", "<").replace("\\>", ">")
    s = re.sub(r"\\([.\[\]~])", r"\1", s)
    s = s.replace("~~", "")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def strip_question_prefix(line: str) -> Tuple[Optional[int], str]:
    m = QUESTION_HEADER_RE.match(line.strip())
    if not m:
        return None, clean_markdown_inline(line)
    q_no = int(m.group(1))
    content = clean_markdown_inline(m.group(2))
    content = re.sub(r"\s*(?:정답|답)\s*[:：]?\s*[①②③④⑤1-5]\s*$", "", content).strip()
    return q_no, content


def parse_answer_symbol(sym: str) -> Optional[int]:
    s = sym.strip()
    circled = {"①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5}
    if s in circled:
        return circled[s]
    if s.isdigit():
        v = int(s)
        if 1 <= v <= 5:
            return v
    return None


def is_question_header(line: str) -> bool:
    s = line.strip()
    m = QUESTION_HEADER_RE.match(s)
    if not m:
        return False
    # Question headers for test items are expected to include '?'
    return "?" in s


def looks_like_meta(line: str) -> bool:
    s = line.strip()
    if not s:
        return True
    if s.startswith("#") or s == "---":
        return True
    if re.match(r"^\[?\d+\s*[~\-]\s*\d+\]?", s):
        return True
    if re.match(r"^\*+\s*\[?\d+\s*[~\-]\s*\d+\]?", s):
        return True
    if s.startswith("* "):
        return True
    meta_tokens = [
        "다음 글",
        "다음을 읽고",
        "물음에 답",
        "문항 해설",
        "출제의도",
        "오답풀이",
        "해설",
        "갈래",
        "성격",
        "주제",
        "특징",
        "이해와 감상",
    ]
    return any(tok in s for tok in meta_tokens)


def extract_passage(lines: List[str]) -> str:
    q_start = None
    for i, line in enumerate(lines):
        if is_question_header(line):
            q_start = i
            break
    if q_start is None:
        q_start = len(lines)

    body = [normalize_line(x) for x in lines[:q_start]]
    if not body:
        return ""

    start = 0
    while start < len(body) and looks_like_meta(body[start]):
        start += 1

    trimmed = body[start:]
    if not trimmed:
        return ""

    passage_lines: List[str] = []
    for ln in trimmed:
        s = ln.strip()
        if s == "---":
            break
        if looks_like_meta(ln):
            # Skip metadata mixed in body while keeping passage flow.
            continue
        passage_lines.append(ln)

    while passage_lines and not passage_lines[-1].strip():
        passage_lines.pop()

    passage = "\n".join(passage_lines).strip()
    if len(passage) > 500:
        passage = passage[:500].rstrip()
    return passage


def parse_choices_from_block(block_text: str) -> List[Tuple[int, str]]:
    text = block_text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("~~", "")
    text = text.replace("\\<", "<").replace("\\>", ">")

    # Primary: circled-number choices (①~⑤), including one-line compact style.
    matches = list(CHOICE_SYMBOL_RE.finditer(text))
    if matches:
        parsed: List[Tuple[int, str]] = []
        circled = {"①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5}
        for i, m in enumerate(matches):
            num = circled[m.group(0)]
            start = m.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            raw = text[start:end]
            raw = re.sub(r"\s*정답\s*[:：]?\s*[①②③④⑤1-5]\s*$", "", raw).strip()
            raw = clean_markdown_inline(raw)
            if raw:
                parsed.append((num, raw))
        # Keep first appearance per option number.
        uniq: Dict[int, str] = {}
        for n, t in parsed:
            if n not in uniq:
                uniq[n] = t
        return [(n, uniq[n]) for n in sorted(uniq.keys())]

    # Fallback: digit-numbered choices (1.~5. / 1)~5)).
    parsed2: List[Tuple[int, str]] = []
    for ln in text.split("\n"):
        s = clean_markdown_inline(ln)
        m = CHOICE_DIGIT_LINE_RE.match(s)
        if not m:
            continue
        n = int(m.group(1))
        t = clean_markdown_inline(m.group(2))
        if t:
            parsed2.append((n, t))
    uniq2: Dict[int, str] = {}
    for n, t in parsed2:
        if n not in uniq2:
            uniq2[n] = t
    return [(n, uniq2[n]) for n in sorted(uniq2.keys())]


def extract_first_question(lines: List[str], new_id: str) -> Optional[ParsedQuestion]:
    q_start = None
    for i, ln in enumerate(lines):
        if is_question_header(ln):
            q_start = i
            break
    if q_start is None:
        return None

    q_end = len(lines)
    for i in range(q_start + 1, len(lines)):
        if is_question_header(lines[i]):
            q_end = i
            break

    block_lines = [normalize_line(x) for x in lines[q_start:q_end]]
    if not block_lines:
        return None

    raw_header = block_lines[0].strip()
    q_no, stem = strip_question_prefix(raw_header)
    if not stem:
        return None

    # Parse choices from the rest of the first question block.
    block_text = "\n".join(block_lines[1:])
    raw_choices = parse_choices_from_block(block_text)
    if len(raw_choices) < 5:
        return None
    raw_choices = raw_choices[:5]

    # Resolve answer symbol from header/block.
    answer_num = None
    m = ANSWER_RE.search(raw_header)
    if m:
        answer_num = parse_answer_symbol(m.group(1))
    if answer_num is None:
        for ln in block_lines[1:]:
            m2 = ANSWER_RE.search(ln)
            if m2:
                answer_num = parse_answer_symbol(m2.group(1))
                if answer_num is not None:
                    break
    if answer_num is None:
        answer_num = MANUAL_ANSWER_BY_NEW_ID.get(new_id)
    if answer_num is None:
        return None

    # Keep source order of choices in output IDs 1..5.
    choices = [{"id": str(i + 1), "text": raw_choices[i][1]} for i in range(5)]

    answer_id = None
    for i, (orig_num, _txt) in enumerate(raw_choices):
        if orig_num == answer_num:
            answer_id = str(i + 1)
            break
    if answer_id is None:
        return None

    return ParsedQuestion(stem=stem, choices=choices, answer_id=answer_id)


def api_login() -> str:
    req = urllib.request.Request(
        API_BASE + "/v1/auth/login",
        data=json.dumps({"login_id": LOGIN_ID, "password": LOGIN_PASSWORD}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        obj = json.loads(r.read().decode("utf-8"))
    token = obj.get("data", {}).get("access_token")
    if not token:
        raise RuntimeError("login failed")
    return token


def api_list_questions(token: str, server_id: str) -> List[Dict]:
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions?serverId=" + urllib.parse.quote(server_id),
        headers={"Authorization": "Bearer " + token},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        obj = json.loads(r.read().decode("utf-8"))
    return obj["data"]


def api_deactivate(token: str, qid: str) -> None:
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions/" + urllib.parse.quote(qid),
        headers={"Authorization": "Bearer " + token},
        method="DELETE",
    )
    with urllib.request.urlopen(req, timeout=20):
        return None


def api_import(token: str, payload: List[Dict]) -> Dict:
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions/import",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=240) as r:
        return json.loads(r.read().decode("utf-8"))


def build_works() -> Tuple[List[Work], List[Dict]]:
    rows = json.loads(SOURCE_LIST_JSON.read_text(encoding="utf-8"))
    if len(rows) < TARGET_COUNT:
        raise RuntimeError(f"source list too short: {len(rows)}")

    works: List[Work] = []
    missing: List[Dict] = []

    for i, r in enumerate(rows[:TARGET_COUNT], start=1):
        old_id = r["id"]
        new_id = f"witt-lit-man-{i:03d}"
        file_path = Path(r["filePath"])
        if not file_path.exists():
            missing.append(
                {"oldId": old_id, "newId": new_id, "reason": "file_not_found", "filePath": str(file_path)}
            )
            continue

        title, author = parse_title_author(file_path.stem)
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")

        passage = extract_passage(lines)
        if len(passage) < 120:
            missing.append(
                {
                    "oldId": old_id,
                    "newId": new_id,
                    "title": title,
                    "author": author,
                    "reason": "passage_too_short",
                    "passageLen": len(passage),
                    "filePath": str(file_path),
                }
            )
            continue

        q = extract_first_question(lines, new_id)
        if q is None:
            missing.append(
                {
                    "oldId": old_id,
                    "newId": new_id,
                    "title": title,
                    "author": author,
                    "reason": "question_parse_failed",
                    "filePath": str(file_path),
                }
            )
            continue

        works.append(
            Work(
                old_id=old_id,
                new_id=new_id,
                title=title,
                author=author,
                file_path=file_path,
                passage=passage,
                question=q,
            )
        )

    return works, missing


def main() -> None:
    if not SOURCE_LIST_JSON.exists():
        raise FileNotFoundError(f"missing {SOURCE_LIST_JSON}")

    works, missing = build_works()
    if missing:
        MISSING_OUT.write_text(json.dumps(missing, ensure_ascii=False, indent=2), encoding="utf-8")
        raise RuntimeError(f"build failed: missing={len(missing)} (see {MISSING_OUT.name})")
    if len(works) != TARGET_COUNT:
        raise RuntimeError(f"build failed: works={len(works)} expected={TARGET_COUNT}")

    payload: List[Dict] = []
    sources: List[Dict] = []

    for w in works:
        payload.append(
            {
                "id": w.new_id,
                "serverId": SERVER_ID,
                "questionType": QUESTION_TYPE,
                "category": CATEGORY,
                "title": f"{w.title} ({w.author})",
                "stem": w.question.stem,
                "passage": w.passage,
                "choices": w.question.choices,
                "answerId": w.question.answer_id,
                "timeLimitSec": TIME_LIMIT_SEC,
                "workTitle": w.title,
                "workAuthor": w.author,
                "sourceUrl": str(w.file_path),
                "sourceType": "local_md_passage_examq_v2",
            }
        )
        sources.append(
            {
                "oldId": w.old_id,
                "newId": w.new_id,
                "title": w.title,
                "author": w.author,
                "filePath": str(w.file_path),
                "passageLen": len(w.passage),
                "choiceCount": len(w.question.choices),
                "answerId": w.question.answer_id,
            }
        )

    PAYLOAD_OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    SOURCES_OUT.write_text(json.dumps(sources, ensure_ascii=False, indent=2), encoding="utf-8")

    token = api_login()
    active = api_list_questions(token, SERVER_ID)
    lit_ids = sorted(
        q["id"]
        for q in active
        if str(q.get("status", "")).upper() == "ACTIVE" and str(q.get("id", "")).startswith("witt-lit-")
    )
    print("active_witt_lit_before", len(lit_ids))
    for qid in lit_ids:
        api_deactivate(token, qid)
    print("deactivated", len(lit_ids))

    res = api_import(token, payload)
    print("import_response", res)

    after = api_list_questions(token, SERVER_ID)
    after_active = [q for q in after if str(q.get("status", "")).upper() == "ACTIVE"]
    after_lit = [q for q in after_active if str(q.get("id", "")).startswith("witt-lit-")]
    after_new = [q for q in after_lit if str(q.get("id", "")).startswith("witt-lit-man-")]
    print("active_total_after", len(after_active))
    print("active_witt_lit_after", len(after_lit))
    print("active_witt_lit_man_after", len(after_new))
    print("files_written", PAYLOAD_OUT.name, SOURCES_OUT.name)


if __name__ == "__main__":
    main()
