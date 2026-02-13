import json
import random
import urllib.parse
import urllib.request

from replace_witt_lit_manual_batch1_v4 import Item, extract_excerpt, resolve_redirect


API_BASE = "http://localhost:8080"
LOGIN_ID = "hqadmin"
LOGIN_PASSWORD = "admin1234"


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


def api_import(token: str, payload: list[dict]) -> dict:
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions/import",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=80) as r:
        return json.loads(r.read().decode("utf-8"))


def main() -> None:
    random.seed(20260212)
    item = Item(
        old_id="witt-lit-m4b-003",
        new_id="witt-lit-m4b-011",
        title="이춘풍전",
        author="작자미상",
        page="이춘풍전_(국립한글박물관)",
        start_key="이츈풍젼 권지단이라",
    )
    excerpt = extract_excerpt(item)
    target = resolve_redirect(item.page)
    source_url = "https://ko.wikisource.org/wiki/" + urllib.parse.quote(target)

    options = [
        "안락국전 (작자미상)",
        "박씨전 (작자미상)",
        "이춘풍전 (작자미상)",
        "사냥 (이태준)",
    ]
    random.shuffle(options)
    ids = ["1", "2", "3", "4"]
    choices = [{"id": ids[i], "text": options[i]} for i in range(4)]
    answer = ids[options.index("이춘풍전 (작자미상)")]

    payload = [
        {
            "id": item.new_id,
            "serverId": "wittgenstein",
            "questionType": "READING",
            "category": "문학 작품",
            "stem": "윗글의 출전 작품으로 가장 적절한 것은?",
            "passage": excerpt,
            "choices": choices,
            "answerId": answer,
            "timeLimitSec": 45,
            "workTitle": item.title,
            "workAuthor": item.author,
            "sourceUrl": source_url,
            "sourceType": "wikisource_parse_clean_v2",
        }
    ]

    with open("witt_lit_fix_m4b_003_payload_20260212.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    token = api_login()
    api_deactivate(token, item.old_id)
    print("deactivated", item.old_id)
    imp = api_import(token, payload)
    print("import_response", imp)
    print("new_id", item.new_id, "len", len(excerpt), "source", source_url)


if __name__ == "__main__":
    main()
