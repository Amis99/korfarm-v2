import json
import random
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple


API_BASE = "http://localhost:8080"
LOGIN_ID = "hqadmin"
LOGIN_PASSWORD = "admin1234"

SERVER_ID = "wittgenstein"
CATEGORY = "문학 작품"
QUESTION_TYPE = "READING"
TIME_LIMIT_SEC = 45

SOURCE_DIR = Path(r"C:\Users\RENEWCOM PC\Documents\수능 국어 대비 교재 작업\문학MD")
TARGET_COUNT = 100

PAYLOAD_OUT = Path("witt_lit_local_md_payload_20260212.json")
SOURCES_OUT = Path("witt_lit_local_md_sources_20260212.json")


@dataclass
class Work:
    file_path: Path
    title: str
    author: str
    passage: str


def parse_title_author(stem: str) -> Tuple[str, str]:
    s = stem.strip()
    if "_" in s:
        title, author = s.rsplit("_", 1)
    else:
        title, author = s, "작자 미상"
    title = re.sub(r"\s+", " ", title).strip()
    author = re.sub(r"\s+", " ", author).strip() or "작자 미상"
    return title, author


def normalize_key(title: str, author: str) -> str:
    t = re.sub(r"[\s\(\)\[\]{}\-~.]", "", title).lower()
    a = re.sub(r"[\s\(\)\[\]{}\-~.]", "", author).lower()
    return f"{t}|{a}"


def should_skip_file(path: Path) -> bool:
    name = path.name
    lname = name.lower()
    if "사본" in name:
        return True
    if "(1)" in name or "(2)" in name or "(3)" in name:
        return True
    # 노이즈성 파일명 최소 필터
    if "문학_비평" in name:
        return True
    if not lname.endswith(".md"):
        return True
    return False


def collect_works() -> List[Work]:
    if not SOURCE_DIR.exists():
        raise FileNotFoundError(f"source directory not found: {SOURCE_DIR}")

    files = sorted([p for p in SOURCE_DIR.glob("*.md") if p.is_file()], key=lambda p: p.name)
    works: List[Work] = []
    seen = set()

    for p in files:
        if should_skip_file(p):
            continue
        try:
            text = p.read_text(encoding="utf-8").replace("\ufeff", "")
        except Exception:
            continue
        text = text.strip()
        if len(text) < 200:
            continue

        title, author = parse_title_author(p.stem)
        key = normalize_key(title, author)
        if key in seen:
            continue
        seen.add(key)

        works.append(
            Work(
                file_path=p,
                title=title,
                author=author,
                passage=text,
            )
        )
        if len(works) >= TARGET_COUNT:
            break

    if len(works) < TARGET_COUNT:
        raise RuntimeError(f"not enough usable works: {len(works)} / {TARGET_COUNT}")
    return works


def create_choices(correct: str, pool: List[str], idx: int) -> Tuple[List[Dict[str, str]], str]:
    n = len(pool)
    cands: List[str] = []
    for off in [1, 2, 3, 4, 5, 7, 9]:
        cands.append(pool[(idx + off) % n])
        cands.append(pool[(idx - off) % n])

    uniq: List[str] = []
    used = {correct}
    for c in cands:
        if c in used:
            continue
        used.add(c)
        uniq.append(c)
        if len(uniq) >= 3:
            break
    if len(uniq) < 3:
        for c in pool:
            if c in used:
                continue
            used.add(c)
            uniq.append(c)
            if len(uniq) >= 3:
                break

    options = [correct] + uniq[:3]
    random.shuffle(options)
    ids = ["1", "2", "3", "4"]
    choices = [{"id": ids[i], "text": options[i]} for i in range(4)]
    answer_id = ids[options.index(correct)]
    return choices, answer_id


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


def main() -> None:
    random.seed(20260212)

    works = collect_works()
    labels = [f"{w.title} ({w.author})" for w in works]

    payload: List[Dict] = []
    sources: List[Dict] = []
    for i, w in enumerate(works, start=1):
        correct = f"{w.title} ({w.author})"
        choices, answer_id = create_choices(correct, labels, i - 1)
        qid = f"witt-lit-md-{i:03d}"
        payload.append(
            {
                "id": qid,
                "serverId": SERVER_ID,
                "questionType": QUESTION_TYPE,
                "category": CATEGORY,
                "stem": "다음 지문의 출전 작품으로 가장 적절한 것은?",
                "passage": w.passage,
                "choices": choices,
                "answerId": answer_id,
                "timeLimitSec": TIME_LIMIT_SEC,
                "workTitle": w.title,
                "workAuthor": w.author,
                "sourceUrl": str(w.file_path),
                "sourceType": "local_md_exact_full",
            }
        )
        sources.append(
            {
                "id": qid,
                "title": w.title,
                "author": w.author,
                "filePath": str(w.file_path),
                "passageLen": len(w.passage),
            }
        )

    PAYLOAD_OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    SOURCES_OUT.write_text(json.dumps(sources, ensure_ascii=False, indent=2), encoding="utf-8")

    token = api_login()
    active = api_list_questions(token, SERVER_ID)
    lit_ids = sorted(
        q["id"]
        for q in active
        if str(q.get("status", "")).upper() == "ACTIVE"
        and str(q.get("id", "")).startswith("witt-lit-")
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
    after_new = [q for q in after_lit if str(q.get("id", "")).startswith("witt-lit-md-")]
    print("active_total_after", len(after_active))
    print("active_witt_lit_after", len(after_lit))
    print("active_witt_lit_md_after", len(after_new))
    print("files_written", PAYLOAD_OUT.name, SOURCES_OUT.name)


if __name__ == "__main__":
    main()

