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
    Item("witt-lit-014", "witt-lit-m4b-001", "안락국전", "작자미상", "안락국전", "화셜"),
    Item("witt-lit-016", "witt-lit-m4b-002", "사냥", "이태준", "사냥", None),
    Item("witt-lit-018", "witt-lit-m4b-003", "이춘풍전", "작자미상", "이춘풍전", None),
    Item("witt-lit-058", "witt-lit-m4b-004", "박씨전", "작자미상", "박씨전", "화셜"),
    Item("witt-lit-076", "witt-lit-m4b-005", "성산별곡", "정철", "성산별곡", "엇그제 겨울 지나"),
    Item("witt-lit-077", "witt-lit-m4b-006", "몽천요", "윤선도", "몽천요", "꿈에"),
    Item("witt-lit-079", "witt-lit-m4b-007", "동동", "작자미상", "동동", "正月"),
    Item("witt-lit-080", "witt-lit-m4b-008", "가시리", "작자미상", "가시리", "가시리"),
    Item("witt-lit-081", "witt-lit-m4b-009", "누항사", "박인로", "누항사", "누항"),
    Item("witt-lit-083", "witt-lit-m4b-010", "도산십이곡", "이황", "도산십이곡", "이런들"),
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
        print(f"[{i+1:02d}/10] {it.title} len={len(excerpt)} src={src}")

    with open("witt_lit_batch2_payload_20260212.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    with open("witt_lit_batch2_sources_20260212.json", "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    token = api_login()
    for it in ITEMS:
        api_deactivate(token, it.old_id)
    print("deactivated_old", len(ITEMS))
    imp = api_import(token, payload)
    print("import_response", imp)

    active = api_list(token)
    lit_count = sum(1 for q in active if str(q.get("category", "")).strip() == CATEGORY)
    new_count = sum(1 for q in active if str(q.get("id", "")).startswith("witt-lit-m4b-"))
    print("active_literature_count", lit_count)
    print("active_batch2_count", new_count)


if __name__ == "__main__":
    main()
