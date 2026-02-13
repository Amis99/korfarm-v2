import json
import random
import urllib.parse
import urllib.request
from typing import List

from replace_witt_lit_manual_batch1_v4 import Item, extract_excerpt, resolve_redirect


API_BASE = "http://localhost:8080"
LOGIN_ID = "hqadmin"
LOGIN_PASSWORD = "admin1234"

SERVER_ID = "wittgenstein"
CATEGORY = "문학 작품"
QTYPE = "READING"


ITEMS: List[Item] = [
    Item("witt-lit-084", "witt-lit-m4c-001", "어부사시사", "윤선도", "어부사시사", None),
    Item("witt-lit-088", "witt-lit-m4c-002", "사시가", "황희", "사시가", None),
    Item("witt-lit-090", "witt-lit-m4c-003", "오륜가", "주세붕", "오륜가", None),
    Item("witt-lit-092", "witt-lit-m4c-004", "견회요", "윤선도", "견회요", None),
    Item("witt-lit-093", "witt-lit-m4c-005", "만언사", "안조원", "만언사", None),
    Item("witt-lit-097", "witt-lit-m4c-006", "면앙정가", "송순", "면앙정가", None),
]


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


def api_deactivate(token: str, qid: str) -> None:
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions/" + urllib.parse.quote(qid),
        headers={"Authorization": "Bearer " + token},
        method="DELETE",
    )
    with urllib.request.urlopen(req, timeout=20):
        return None


def api_import(token: str, payload: List[dict]) -> dict:
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions/import",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=80) as r:
        return json.loads(r.read().decode("utf-8"))


def api_list(token: str) -> List[dict]:
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions?serverId=" + urllib.parse.quote(SERVER_ID),
        headers={"Authorization": "Bearer " + token},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        obj = json.loads(r.read().decode("utf-8"))
    return obj["data"]


def create_choices(correct: str, pool: List[str], idx: int) -> tuple[list[dict], str]:
    n = len(pool)
    cands = []
    for off in [1, 2, 3, 4, 5]:
        cands.append(pool[(idx + off) % n])
        cands.append(pool[(idx - off) % n])
    uniq = []
    seen = set()
    for c in cands:
        if c == correct or c in seen:
            continue
        seen.add(c)
        uniq.append(c)
    options = [correct] + uniq[:3]
    random.shuffle(options)
    ids = ["1", "2", "3", "4"]
    choices = [{"id": ids[i], "text": options[i]} for i in range(4)]
    return choices, ids[options.index(correct)]


def main() -> None:
    random.seed(20260212)
    titles = [f"{x.title} ({x.author})" for x in ITEMS]
    payload = []
    rows = []

    for i, it in enumerate(ITEMS):
        target = resolve_redirect(it.page)
        excerpt = extract_excerpt(it)
        correct = f"{it.title} ({it.author})"
        choices, answer = create_choices(correct, titles, i)
        src = "https://ko.wikisource.org/wiki/" + urllib.parse.quote(target)
        payload.append(
            {
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
                "sourceUrl": src,
                "sourceType": "wikisource_parse_clean_v2",
            }
        )
        rows.append(
            {
                "oldId": it.old_id,
                "newId": it.new_id,
                "title": it.title,
                "author": it.author,
                "sourceUrl": src,
                "passageLen": len(excerpt),
            }
        )
        print(f"[{i+1:02d}/6] {it.title} len={len(excerpt)} src={src}")

    with open("witt_lit_batch3_payload_20260212.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    with open("witt_lit_batch3_sources_20260212.json", "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    token = api_login()
    for it in ITEMS:
        api_deactivate(token, it.old_id)
    print("deactivated_old", len(ITEMS))
    imp = api_import(token, payload)
    print("import_response", imp)

    active = api_list(token)
    lit_count = sum(1 for q in active if str(q.get("category", "")).strip() == CATEGORY)
    new_count = sum(1 for q in active if str(q.get("id", "")).startswith("witt-lit-m4c-"))
    print("active_literature_count", lit_count)
    print("active_batch3_count", new_count)


if __name__ == "__main__":
    main()
