import html
import json
import random
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import List


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


# Replace previously imported batch1(m1) with improved batch1(m2).
ITEMS: List[Item] = [
    Item("witt-lit-m1-001", "witt-lit-m2-001", "백학선전", "작자미상", "백학선전"),
    Item("witt-lit-m1-002", "witt-lit-m2-002", "자경", "박인로", "자경"),
    Item("witt-lit-m1-003", "witt-lit-m2-003", "적벽가", "작자미상", "적벽가"),
    Item("witt-lit-m1-004", "witt-lit-m2-004", "접동새", "김소월", "접동새"),
    Item("witt-lit-m1-005", "witt-lit-m2-005", "미스터 방", "채만식", "미스터 방"),
    Item("witt-lit-m1-006", "witt-lit-m2-006", "구운몽", "김만중", "구운몽"),
    Item("witt-lit-m1-007", "witt-lit-m2-007", "조웅전", "작자미상", "조웅전"),
    Item("witt-lit-m1-008", "witt-lit-m2-008", "최척전", "조위한", "최척전"),
    Item("witt-lit-m1-009", "witt-lit-m2-009", "흥부전", "작자미상", "흥부전_(경판_25장본)"),
    Item("witt-lit-m1-010", "witt-lit-m2-010", "금방울전", "작자미상", "금방울전"),
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
        return r.read().decode("utf-8", "ignore")


def resolve_redirect(page: str, depth: int = 0) -> str:
    if depth > 4:
        return page
    url = "https://ko.wikisource.org/wiki/" + urllib.parse.quote(page) + "?action=raw"
    raw = http_get(url, timeout=20).strip()
    m = re.match(r"#넘겨주기\s*\[\[([^\]]+)\]\]", raw)
    if not m:
        return page
    target = m.group(1).strip()
    return resolve_redirect(target, depth + 1)


def strip_templates(text: str) -> str:
    prev = None
    cur = text
    for _ in range(80):
        if cur == prev:
            break
        prev = cur
        cur = re.sub(r"\{\{[^{}]*\}\}", "", cur, flags=re.S)
    return cur


def cleanup_wikitext(raw: str) -> str:
    t = strip_templates(raw)
    t = re.sub(r"(?is)<ref[^>]*>.*?</ref>", " ", t)
    t = re.sub(r"(?is)<[^>]+>", " ", t)
    t = re.sub(r"\[\[([^|\]]+)\|([^\]]+)\]\]", r"\2", t)
    t = re.sub(r"\[\[([^\]]+)\]\]", r"\1", t)
    t = re.sub(r"^={1,6}.*?={1,6}\s*$", "", t, flags=re.M)
    t = html.unescape(t)
    t = t.replace("\xa0", " ").replace("\u200b", "")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def parse_api_plain_text(page: str) -> str:
    url = (
        "https://ko.wikisource.org/w/api.php?action=parse&prop=text&format=json&page="
        + urllib.parse.quote(page)
    )
    obj = json.loads(http_get(url, timeout=20))
    html_part = obj["parse"]["text"]["*"]

    t = html_part
    t = re.sub(r"(?is)<script.*?>.*?</script>", " ", t)
    t = re.sub(r"(?is)<style.*?>.*?</style>", " ", t)
    t = re.sub(r"(?i)<br\s*/?>", "\n", t)
    t = re.sub(
        r"(?i)</(p|div|li|h1|h2|h3|h4|h5|h6|section|article|blockquote|tr|dd|dt)>",
        "\n",
        t,
    )
    t = re.sub(r"(?is)<[^>]+>", " ", t)
    t = html.unescape(t)
    t = t.replace("\xa0", " ").replace("\u200b", "")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    return t


def extract_excerpt(page: str) -> str:
    target_page = resolve_redirect(page)

    # For pages that include both modernized and original blocks in raw text.
    if "접동새" in target_page:
        raw = http_get("https://ko.wikisource.org/wiki/" + urllib.parse.quote(target_page) + "?action=raw")
        if "'''원문'''" in raw:
            raw = raw.split("'''원문'''", 1)[1]
        if "== 라이선스 ==" in raw:
            raw = raw.split("== 라이선스 ==", 1)[0]
        body = cleanup_wikitext(raw)
    else:
        parsed = parse_api_plain_text(target_page)
        lines = [ln.strip() for ln in parsed.splitlines() if ln.strip()]
        skip_starts = (
            "←",
            "→",
            "저작권",
            "라이선스",
            "[ 편집 ]",
            "Public domain",
            "이 문서는 옛한글",
            "관련 글꼴",
            "이 판에 대한 서지 정보",
            "위키문헌",
        )
        clean_lines = []
        for ln in lines:
            if ln.startswith(skip_starts):
                continue
            if re.fullmatch(r"[0-9]+", ln):
                continue
            if len(ln) <= 2:
                continue
            clean_lines.append(ln)
        body = "\n".join(clean_lines).strip()

    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    if len(body) < 120:
        raise RuntimeError(f"excerpt source too short: {target_page}")

    excerpt = body[:PASSAGE_MAX].strip()
    if len(excerpt) >= 340:
        cut = max(excerpt.rfind("\n"), excerpt.rfind("."), excerpt.rfind("다."))
        if cut >= 230:
            excerpt = excerpt[: cut + 1].strip()
    if len(excerpt) < 120:
        raise RuntimeError(f"excerpt extracted too short: {target_page}")
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
    candidates = []
    for off in [1, 2, 3, 4, 5]:
        candidates.append(pool[(idx + off) % n])
        candidates.append(pool[(idx - off) % n])
    uniq = []
    seen = set()
    for c in candidates:
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
        target_page = resolve_redirect(it.page)
        excerpt = extract_excerpt(it.page)
        correct = f"{it.title} ({it.author})"
        choices, answer = create_choices(correct, display_titles, i)
        source_url = "https://ko.wikisource.org/wiki/" + urllib.parse.quote(target_page)
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
            "sourceUrl": source_url,
            "sourceType": "wikisource_parse",
        }
        payload.append(q)
        source_rows.append(
            {
                "oldId": it.old_id,
                "newId": it.new_id,
                "title": it.title,
                "author": it.author,
                "sourceUrl": source_url,
                "passageLen": len(excerpt),
            }
        )
        print(f"[{i+1:02d}/10] {it.title} len={len(excerpt)} source={source_url}")

    with open("witt_lit_batch1_v2_payload_20260212.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    with open("witt_lit_batch1_v2_sources_20260212.json", "w", encoding="utf-8") as f:
        json.dump(source_rows, f, ensure_ascii=False, indent=2)

    token = api_login()
    for it in ITEMS:
        api_deactivate(token, it.old_id)
    print("deactivated_old", len(ITEMS))
    imp = api_import(token, payload)
    print("import_response", imp)

    active = api_list(token)
    lit_count = sum(1 for q in active if str(q.get("category", "")).strip() == CATEGORY)
    new_count = sum(1 for q in active if str(q.get("id", "")).startswith("witt-lit-m2-"))
    print("active_literature_count", lit_count)
    print("active_batch1_v2_count", new_count)


if __name__ == "__main__":
    main()
