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
    start_key: Optional[str] = None


ITEMS: List[Item] = [
    Item("witt-lit-m3-001", "witt-lit-m4-001", "백학선전", "작자미상", "백학선전", "화셜"),
    Item("witt-lit-m3-002", "witt-lit-m4-002", "자경", "박인로", "자경", "明鏡"),
    Item("witt-lit-m3-003", "witt-lit-m4-003", "적벽가", "작자미상", "적벽가", "한(漢)나라"),
    Item("witt-lit-m3-004", "witt-lit-m4-004", "접동새", "김소월", "접동새", "접동"),
    Item("witt-lit-m3-005", "witt-lit-m4-005", "미스터 방", "채만식", "미스터 방", "주인과 나그네가"),
    Item("witt-lit-m3-006", "witt-lit-m4-006", "구운몽", "김만중", "구운몽", "구운몽 샹"),
    Item("witt-lit-m3-007", "witt-lit-m4-007", "조웅전", "작자미상", "조웅전", "송문제 즉위"),
    Item("witt-lit-m3-008", "witt-lit-m4-008", "최척전", "조위한", "최척전", "崔陟"),
    Item("witt-lit-m3-009", "witt-lit-m4-009", "흥부전", "작자미상", "흥부전_(경판_25장본)", "화셜"),
    Item("witt-lit-m3-010", "witt-lit-m4-010", "금방울전", "작자미상", "금방울전", "화셜"),
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
    raw = http_get("https://ko.wikisource.org/wiki/" + urllib.parse.quote(page) + "?action=raw")
    m = re.match(r"#넘겨주기\s*\[\[([^\]]+)\]\]", raw.strip())
    if not m:
        return page
    return resolve_redirect(m.group(1).strip(), depth + 1)


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
    t = html.unescape(t).replace("\xa0", " ").replace("\u200b", "")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def parse_api_plain_text(page: str) -> str:
    url = (
        "https://ko.wikisource.org/w/api.php?action=parse&prop=text&format=json&page="
        + urllib.parse.quote(page)
    )
    obj = json.loads(http_get(url))
    t = obj["parse"]["text"]["*"]
    t = re.sub(r"(?is)<script.*?>.*?</script>", " ", t)
    t = re.sub(r"(?is)<style.*?>.*?</style>", " ", t)
    t = re.sub(r"(?i)<br\s*/?>", "\n", t)
    t = re.sub(
        r"(?i)</(p|div|li|h1|h2|h3|h4|h5|h6|section|article|blockquote|tr|dd|dt)>",
        "\n",
        t,
    )
    t = re.sub(r"(?is)<[^>]+>", " ", t)
    t = html.unescape(t).replace("\xa0", " ").replace("\u200b", "")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def is_meta_line(line: str) -> bool:
    ln = line.strip()
    if not ln:
        return True
    if re.fullmatch(r"[0-9]+", ln):
        return True
    bad_prefix = (
        "←",
        "→",
        "저작권",
        "라이선스",
        "[ 편집 ]",
        "Public domain",
        "이 문서는",
        "관련 글꼴",
        "이 판에 대한 서지 정보",
        "자매 프로젝트",
        "위키백과",
        "출전:",
        "자료가 있습니다",
        "원문",
        "상권",
        "완판",
        "경판",
    )
    if ln.startswith(bad_prefix):
        return True
    if "위키백과 에 이 글과 관련된" in ln:
        return True
    return False


def clip_excerpt(body: str) -> str:
    excerpt = body[:PASSAGE_MAX].strip()
    if len(excerpt) >= 340:
        cut = max(excerpt.rfind("\n"), excerpt.rfind("."), excerpt.rfind("다."))
        if cut >= 220:
            excerpt = excerpt[: cut + 1].strip()
    return excerpt


def extract_excerpt(item: Item) -> str:
    target = resolve_redirect(item.page)

    if "접동새" in target:
        raw = http_get("https://ko.wikisource.org/wiki/" + urllib.parse.quote(target) + "?action=raw")
        if "'''원문'''" in raw:
            raw = raw.split("'''원문'''", 1)[1]
        if "== 라이선스 ==" in raw:
            raw = raw.split("== 라이선스 ==", 1)[0]
        body = cleanup_wikitext(raw)
    else:
        parsed = parse_api_plain_text(target)
        lines = [ln.strip() for ln in parsed.splitlines() if ln.strip()]
        lines = [ln for ln in lines if not is_meta_line(ln)]
        body = "\n".join(lines).strip()

    if item.start_key and item.start_key in body:
        body = body.split(item.start_key, 1)[1]
        body = item.start_key + body

    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    if len(body) < 120:
        raise RuntimeError(f"source too short: {item.title}")
    excerpt = clip_excerpt(body)
    if len(excerpt) < 120:
        raise RuntimeError(f"excerpt too short: {item.title}")
    return excerpt


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
        print(f"[{i+1:02d}/10] {it.title} len={len(excerpt)}")

    with open("witt_lit_batch1_v4_payload_20260212.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    with open("witt_lit_batch1_v4_sources_20260212.json", "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    token = api_login()
    for it in ITEMS:
        api_deactivate(token, it.old_id)
    print("deactivated_old", len(ITEMS))
    imp = api_import(token, payload)
    print("import_response", imp)

    active = api_list(token)
    lit_count = sum(1 for q in active if str(q.get("category", "")).strip() == CATEGORY)
    new_count = sum(1 for q in active if str(q.get("id", "")).startswith("witt-lit-m4-"))
    print("active_literature_count", lit_count)
    print("active_batch1_v4_count", new_count)


if __name__ == "__main__":
    main()
