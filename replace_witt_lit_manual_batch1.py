import html
import json
import random
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import List, Optional


API_BASE = "http://localhost:8080"
LOGIN_ID = "hqadmin"
LOGIN_PASSWORD = "admin1234"

SERVER_ID = "wittgenstein"
CATEGORY = "문학 작품"
QTYPE = "READING"
PASSAGE_MAX = 500


@dataclass
class Item:
    old_id: str
    new_id: str
    title: str
    author: str
    page: str


ITEMS: List[Item] = [
    Item("witt-lit-001", "witt-lit-m1-001", "백학선전", "작자미상", "백학선전"),
    Item("witt-lit-002", "witt-lit-m1-002", "자경", "박인로", "자경"),
    Item("witt-lit-006", "witt-lit-m1-003", "적벽가", "작자미상", "적벽가"),
    Item("witt-lit-008", "witt-lit-m1-004", "접동새", "김소월", "접동새"),
    Item("witt-lit-009", "witt-lit-m1-005", "미스터 방", "채만식", "미스터 방"),
    Item("witt-lit-011", "witt-lit-m1-006", "구운몽", "김만중", "구운몽"),
    Item("witt-lit-012", "witt-lit-m1-007", "조웅전", "작자미상", "조웅전"),
    Item("witt-lit-017", "witt-lit-m1-008", "최척전", "조위한", "최척전"),
    Item("witt-lit-022", "witt-lit-m1-009", "흥부전", "작자미상", "흥부전"),
    Item("witt-lit-023", "witt-lit-m1-010", "금방울전", "작자미상", "금방울전"),
]


def http_get(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "ko,en;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
    return raw.decode("utf-8", "ignore")


def strip_templates(text: str) -> str:
    # Best-effort removal of nested templates.
    prev = None
    cur = text
    for _ in range(50):
        if cur == prev:
            break
        prev = cur
        cur = re.sub(r"\{\{[^{}]*\}\}", "", cur, flags=re.S)
    return cur


def cleanup_wikitext(raw: str) -> str:
    t = raw
    t = strip_templates(t)
    t = re.sub(r"(?is)<ref[^>]*>.*?</ref>", " ", t)
    t = re.sub(r"(?is)<[^>]+>", " ", t)
    t = re.sub(r"\[\[파일:[^\]]+\]\]", " ", t)
    t = re.sub(r"\[\[분류:[^\]]+\]\]", " ", t)
    t = re.sub(r"\[\[([^|\]]+)\|([^\]]+)\]\]", r"\2", t)
    t = re.sub(r"\[\[([^\]]+)\]\]", r"\1", t)
    t = re.sub(r"^={1,6}.*?={1,6}\s*$", "", t, flags=re.M)
    t = re.sub(r"^\{\|.*?$", "", t, flags=re.M)
    t = re.sub(r"^\|[-+].*$", "", t, flags=re.M)
    t = re.sub(r"^\|.*$", "", t, flags=re.M)
    t = re.sub(r"^!.*$", "", t, flags=re.M)
    t = re.sub(r"^\}\s*$", "", t, flags=re.M)
    t = html.unescape(t)
    t = t.replace("\xa0", " ")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def fetch_wikisource_raw(page: str, depth: int = 0) -> str:
    if depth > 4:
        raise RuntimeError(f"redirect loop for {page}")
    url = "https://ko.wikisource.org/wiki/" + urllib.parse.quote(page) + "?action=raw"
    raw = http_get(url, timeout=20).strip()
    m = re.match(r"#넘겨주기\s*\[\[([^\]]+)\]\]", raw)
    if m:
        target = m.group(1).strip()
        return fetch_wikisource_raw(target, depth + 1)
    return raw


def extract_excerpt(page: str) -> str:
    raw = fetch_wikisource_raw(page)
    text = cleanup_wikitext(raw)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    drop_prefix = ("머리말", "제목", "저자", "역자", "부제", "설명", "출처", "위키백과", "분류")
    body_lines = [ln for ln in lines if not ln.startswith(drop_prefix)]
    body = "\n".join(body_lines).strip()
    body = re.sub(r"\n{3,}", "\n\n", body)
    if len(body) < 120:
        raise RuntimeError(f"too short body for {page}")

    excerpt = body[:PASSAGE_MAX].strip()
    if len(excerpt) >= 350:
        cut = max(excerpt.rfind("\n"), excerpt.rfind("."), excerpt.rfind("다."))
        if cut >= 250:
            excerpt = excerpt[: cut + 1].strip()
    if len(excerpt) < 120:
        raise RuntimeError(f"too short excerpt for {page}")
    return excerpt


def api_login() -> str:
    body = json.dumps({"login_id": LOGIN_ID, "password": LOGIN_PASSWORD}).encode("utf-8")
    req = urllib.request.Request(
        API_BASE + "/v1/auth/login",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        obj = json.loads(r.read().decode("utf-8"))
    token = obj.get("data", {}).get("access_token")
    if not token:
        raise RuntimeError("admin login failed")
    return token


def api_deactivate(token: str, qid: str) -> None:
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions/" + urllib.parse.quote(qid),
        headers={"Authorization": "Bearer " + token},
        method="DELETE",
    )
    with urllib.request.urlopen(req, timeout=20):
        return None


def api_import(token: str, payload: List[dict]) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions/import",
        data=body,
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def api_list(server_id: str, token: str) -> List[dict]:
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions?serverId=" + urllib.parse.quote(server_id),
        headers={"Authorization": "Bearer " + token},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        obj = json.loads(r.read().decode("utf-8"))
    return obj["data"]


def create_choices(correct: str, pool: List[str], idx: int) -> tuple[list[dict], str]:
    n = len(pool)
    cand = []
    for off in [1, 2, 3, 4, 5]:
        cand.append(pool[(idx + off) % n])
        cand.append(pool[(idx - off) % n])
    uniq = []
    seen = set()
    for c in cand:
        if c == correct or c in seen:
            continue
        seen.add(c)
        uniq.append(c)
    options = [correct] + uniq[:3]
    random.shuffle(options)
    ids = ["1", "2", "3", "4"]
    choices = [{"id": ids[i], "text": options[i]} for i in range(4)]
    answer = ids[options.index(correct)]
    return choices, answer


def main() -> None:
    random.seed(20260212)
    display_titles = [f"{x.title} ({x.author})" for x in ITEMS]
    payload = []
    source_rows = []

    for i, it in enumerate(ITEMS):
        excerpt = extract_excerpt(it.page)
        correct = f"{it.title} ({it.author})"
        choices, answer = create_choices(correct, display_titles, i)
        page_url = "https://ko.wikisource.org/wiki/" + urllib.parse.quote(it.page)
        q = {
            "id": it.new_id,
            "serverId": SERVER_ID,
            "questionType": QTYPE,
            "category": CATEGORY,
            "stem": "윗글의 출전 작품으로 가장 적절한 것은?",
            "passage": excerpt,
            "choices": choices,
            "answerId": answer,
            "timeLimitSec": 45,
            "workTitle": it.title,
            "workAuthor": it.author,
            "sourceUrl": page_url,
            "sourceType": "wikisource_raw",
        }
        payload.append(q)
        source_rows.append(
            {
                "oldId": it.old_id,
                "newId": it.new_id,
                "title": it.title,
                "author": it.author,
                "sourceUrl": page_url,
                "passageLen": len(excerpt),
            }
        )
        print(f"[{i+1:02d}/10] {it.title} ({it.author}) len={len(excerpt)}")

    with open("witt_lit_batch1_payload_20260212.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    with open("witt_lit_batch1_sources_20260212.json", "w", encoding="utf-8") as f:
        json.dump(source_rows, f, ensure_ascii=False, indent=2)

    token = api_login()
    for it in ITEMS:
        api_deactivate(token, it.old_id)
    print("deactivated_old", len(ITEMS))
    imp = api_import(token, payload)
    print("import_response", imp)

    active = api_list(SERVER_ID, token)
    lit_count = sum(1 for q in active if str(q.get("category", "")).strip() == CATEGORY)
    batch_new = sum(1 for q in active if str(q.get("id", "")).startswith("witt-lit-m1-"))
    print("active_literature_count", lit_count)
    print("active_batch1_new_count", batch_new)


if __name__ == "__main__":
    main()
