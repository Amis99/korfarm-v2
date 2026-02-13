import html
import json
import random
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple


API_BASE = "http://localhost:8080"
LOGIN_ID = "hqadmin"
LOGIN_PASSWORD = "admin1234"

TARGET_SERVER = "wittgenstein"
TARGET_CATEGORY = "문학 작품"
TARGET_QUESTION_TYPE = "READING"
PASSAGE_MAX_LEN = 500


WORKS: List[Tuple[str, str]] = [
    ("백학선전", "작자미상"),
    ("자경", "박인로"),
    ("우리 동네 황씨", "이문구"),
    ("눈길", "고은"),
    ("세상에서 가장 아름다운 이별", "노희경"),
    ("적벽가", "작자미상"),
    ("김가성론", "김성한"),
    ("접동새", "김소월"),
    ("미스터 방", "채만식"),
    ("시집살이 노래", "작자미상"),
    ("구운몽", "김만중"),
    ("조웅전", "작자미상"),
    ("만세전", "염상섭"),
    ("안락국전", "작자미상"),
    ("무지개는 언제 뜨는가", "윤흥길"),
    ("사냥", "이태준"),
    ("최척전", "조위한"),
    ("이춘풍전", "작자미상"),
    ("두 파산", "염상섭"),
    ("사씨남정기", "김만중"),
    ("원미동 시인", "양귀자"),
    ("흥부전", "작자미상"),
    ("금방울전", "작자미상"),
    ("천변풍경", "박태원"),
    ("역마", "김동리"),
    ("머슴대길이", "고은"),
    ("즐거운 나의 집", "신경림"),
    ("선한 나무", "유치환"),
    ("섬진강 1", "김용택"),
    ("향현", "박두신"),
    ("우리가 물이 되어", "강은교"),
    ("눈", "박이문"),
    ("추천사", "서정주"),
    ("땅끝", "나희덕"),
    ("병원", "윤동주"),
    ("나무", "박목월"),
    ("두만강 너 우리 강아", "이용악"),
    ("눈", "김수영"),
    ("무국어", "조지훈"),
    ("구름의 파수병", "김수영"),
    ("느낌 이 극락같은", "이강백"),
    ("흰 바람벽이 있어", "백석"),
    ("느티나무로부터", "복효근"),
    ("절망을 위하여", "곽재구"),
    ("마음의 태양", "조지훈"),
    ("폭풍", "정호승"),
    ("성묘", "고은"),
    ("외할머니의 뒤안 툇마루", "서정주"),
    ("정주성", "백석"),
    ("목계장터", "신경림"),
    ("소리의 빛", "이청준"),
    ("조그만 체험기", "박완서"),
    ("삼대", "염상섭"),
    ("유자소전", "이문구"),
    ("독 짓는 늙은이", "황순원"),
    ("강", "서정인"),
    ("시장과 전장", "박경리"),
    ("박씨전", "작자미상"),
    ("회색 눈사람", "최윤"),
    ("토지", "박경리"),
    ("토지", "이형우 각색 시나리오"),
    ("큰 산", "이호철"),
    ("황만근은 이렇게 말했다", "성석제"),
    ("눈이 오면", "임철우"),
    ("불모지", "차범석"),
    ("월행", "송기원"),
    ("쥐잡기", "김소진"),
    ("탐내는 하꼬방", "염상섭"),
    ("한계령", "양귀자"),
    ("말을 찾아서", "이순원"),
    ("공동 경비 구역 JSA", "박상연 원작·박찬욱 각색"),
    ("비 오는 길", "최명익"),
    ("순이삼촌", "현기영"),
    ("오발탄", "이범신 원작·이종기 각색"),
    ("고풍 의상", "조지훈"),
    ("성산별곡", "정철"),
    ("몽천요", "윤선도"),
    ("명월음", "최현"),
    ("동동", "작자미상"),
    ("가시리", "작자미상"),
    ("누항사", "박인로"),
    ("방음시여", "신흠"),
    ("도산십이곡", "이황"),
    ("어부사시사", "윤선도"),
    ("연행가", "홍순학"),
    ("입암이십구곡", "박인로"),
    ("고완", "이태준"),
    ("사시가", "황희"),
    ("전원사시가", "신계영"),
    ("오륜가", "주세붕"),
    ("차마설", "이곡"),
    ("견회요", "윤선도"),
    ("만언사", "안조원"),
    ("덴동어미 화전가", "작자미상"),
    ("비가", "이정환"),
    ("풍란", "이병기"),
    ("면앙정가", "송순"),
    ("강호구가", "나위소"),
    ("용추유영가", "정훈"),
    ("강호연군가", "장경세"),
]


BLACKLIST_HOST = {
    "www.mrblue.com",
    "mrblue.com",
    "www.lh.or.kr",
    "lh.or.kr",
    "www.youtube.com",
    "youtube.com",
    "music.youtube.com",
}

STOP_WORDS = ["감상", "해설", "분석", "정리", "의미", "작품해설", "해석"]


@dataclass
class Excerpt:
    passage: str
    source_url: str
    source_type: str


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


def clean_html_to_text(raw_html: str) -> str:
    text = raw_html
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", text)
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", text)
    text = text.replace("<br>", "\n").replace("<br/>", "\n")
    text = re.sub(r"(?i)<br\\s*/?>", "\n", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = html.unescape(text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def korean_ratio(s: str) -> float:
    if not s:
        return 0.0
    ko = len(re.findall(r"[가-힣ㄱ-ㅎㅏ-ㅣ一-龥]", s))
    return ko / max(1, len(s))


def trim_excerpt(text: str, limit: int = PASSAGE_MAX_LEN) -> str:
    t = text.strip()
    if len(t) <= limit:
        return t
    cut = t[:limit]
    # Prefer cutting at sentence boundary.
    for token in [". ", "다 ", "요 ", "다.", "요.", "!" , "?", "\n"]:
        idx = cut.rfind(token)
        if idx >= max(80, int(limit * 0.4)):
            return cut[: idx + 1].strip()
    return cut.strip()


def extract_from_wikisource(title: str) -> Optional[Excerpt]:
    url = "https://ko.wikisource.org/wiki/" + urllib.parse.quote(title)
    try:
        raw = http_get(url, timeout=20)
    except Exception:
        return None

    if "위키문헌" not in raw:
        return None

    text = clean_html_to_text(raw)
    if "문서를 찾을 수 없습니다" in text:
        return None

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    lines = [
        ln
        for ln in lines
        if ln not in {"위키문헌", "위키백과, 우리 모두의 백과사전", "위키미디어 공용"}
        and not ln.startswith("개인 도구")
        and not ln.startswith("둘러보기")
    ]
    body = "\n".join(lines)
    body = re.sub(r"\[[0-9]+\]", "", body)
    body = body.strip()
    if len(body) < 80:
        return None
    if korean_ratio(body) < 0.2:
        return None

    passage = trim_excerpt(body)
    if len(passage) < 80:
        return None
    return Excerpt(passage=passage, source_url=url, source_type="wikisource")


def extract_from_namu(title: str) -> Optional[Excerpt]:
    url = "https://namu.wiki/w/" + urllib.parse.quote(title)
    try:
        raw = http_get(url, timeout=20)
    except Exception:
        return None

    if "나무위키" not in raw:
        return None

    # Prefer quoted poetry blocks.
    block_candidates = re.findall(
        r"(?is)<div style='margin:1\\.3em;letter-spacing:1px'.*?>(.*?)</div>",
        raw,
    )
    for blk in block_candidates:
        txt = clean_html_to_text(blk)
        txt = re.sub(r"\s*\n\s*", "\n", txt).strip()
        if len(txt) >= 80 and korean_ratio(txt) >= 0.35:
            return Excerpt(
                passage=trim_excerpt(txt),
                source_url=url,
                source_type="namu_quote_block",
            )

    # Fallback: first reasonable paragraph after cleaning.
    text = clean_html_to_text(raw)
    parts = re.split(r"\n{2,}", text)
    for p in parts:
        p = p.strip()
        if len(p) < 80:
            continue
        if "나무위키는 백과사전이 아니며" in p:
            continue
        if korean_ratio(p) < 0.3:
            continue
        # Skip obvious metadata-like lines.
        if "최근 변경" in p or "역사" in p or "토론" in p:
            continue
        return Excerpt(
            passage=trim_excerpt(p),
            source_url=url,
            source_type="namu_paragraph",
        )
    return None


def search_bing_rss(query: str) -> List[Tuple[str, str, str]]:
    url = "https://www.bing.com/search?format=rss&q=" + urllib.parse.quote(query)
    try:
        xml_text = http_get(url, timeout=20)
        root = ET.fromstring(xml_text)
    except Exception:
        return []
    out: List[Tuple[str, str, str]] = []
    for item in root.findall("./channel/item"):
        title = item.findtext("title") or ""
        link = item.findtext("link") or ""
        desc = item.findtext("description") or ""
        out.append((title, link, desc))
    return out


def extract_from_bing_snippet(title: str, author: str) -> Optional[Excerpt]:
    queries = [
        f"\"{title}\" \"{author}\" 원문",
        f"\"{title}\" \"{author}\" 전문",
        f"\"{title}\" 작품",
    ]
    for q in queries:
        items = search_bing_rss(q)
        for item_title, link, desc in items[:12]:
            host = urllib.parse.urlparse(link).netloc.lower()
            if host in BLACKLIST_HOST:
                continue
            txt = html.unescape(desc).strip()
            if not txt or len(txt) < 80:
                continue
            # Trim before commentary markers when possible.
            for sw in STOP_WORDS:
                idx = txt.find(sw)
                if idx >= 90:
                    txt = txt[:idx].strip()
            txt = re.sub(r"\s+", " ", txt).strip()
            if len(txt) < 80:
                continue
            if korean_ratio(txt) < 0.25:
                continue
            return Excerpt(
                passage=trim_excerpt(txt),
                source_url=link,
                source_type="bing_snippet",
            )
    return None


def build_excerpt(title: str, author: str) -> Excerpt:
    # 1) Wikimedia source (prefer public-domain text when available)
    ex = extract_from_wikisource(title)
    if ex:
        return ex

    # 2) Namu article quote/paragraph
    ex = extract_from_namu(title)
    if ex:
        return ex

    # 3) Search snippet fallback
    ex = extract_from_bing_snippet(title, author)
    if ex:
        return ex

    # Last-resort fallback to keep pipeline progressing.
    fallback = f"{title} ({author})"
    return Excerpt(
        passage=fallback,
        source_url="",
        source_type="fallback_title_only",
    )


def create_choices(correct: str, pool: List[str], idx: int) -> Tuple[List[dict], str]:
    # Use nearby works as distractors to keep them plausible.
    cand = []
    n = len(pool)
    for off in [1, 2, 3, 4, 5, 7, 9, 11]:
        cand.append(pool[(idx + off) % n])
        cand.append(pool[(idx - off) % n])
    cand = [x for x in cand if x != correct]
    seen = set()
    uniq = []
    for c in cand:
        if c in seen:
            continue
        seen.add(c)
        uniq.append(c)
    distractors = uniq[:3]
    options = [correct] + distractors
    random.shuffle(options)
    ids = ["A", "B", "C", "D"]
    choices = [{"id": ids[i], "text": options[i]} for i in range(4)]
    answer_id = ids[options.index(correct)]
    return choices, answer_id


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
        raise RuntimeError("Failed to login as admin.")
    return token


def api_get_questions(token: str, server_id: str) -> List[dict]:
    req = urllib.request.Request(
        API_BASE + f"/v1/admin/duel/questions?serverId={urllib.parse.quote(server_id)}",
        headers={"Authorization": "Bearer " + token},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        obj = json.loads(r.read().decode("utf-8"))
    return obj["data"] if isinstance(obj, dict) and "data" in obj else obj


def api_deactivate(token: str, qid: str) -> None:
    req = urllib.request.Request(
        API_BASE + f"/v1/admin/duel/questions/{urllib.parse.quote(qid)}",
        headers={"Authorization": "Bearer " + token},
        method="DELETE",
    )
    with urllib.request.urlopen(req, timeout=20):
        pass


def api_import(token: str, payload: List[dict]) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        API_BASE + "/v1/admin/duel/questions/import",
        data=body,
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        obj = json.loads(r.read().decode("utf-8"))
    return obj


def main() -> None:
    random.seed(20260211)

    if len(WORKS) != 100:
        raise RuntimeError(f"WORKS length must be 100, got {len(WORKS)}")

    titles_for_choices = []
    for title, author in WORKS:
        if author:
            titles_for_choices.append(f"{title} ({author})")
        else:
            titles_for_choices.append(title)

    questions: List[dict] = []
    source_rows: List[dict] = []

    for i, (title, author) in enumerate(WORKS, start=1):
        ex = build_excerpt(title, author)
        display_title = f"{title} ({author})" if author else title
        choices, answer_id = create_choices(display_title, titles_for_choices, i - 1)
        q = {
            "id": f"witt-lit-rpl-{i:03d}",
            "serverId": TARGET_SERVER,
            "questionType": TARGET_QUESTION_TYPE,
            "category": TARGET_CATEGORY,
            "stem": "윗글의 출전 작품으로 가장 적절한 것은?",
            "passage": trim_excerpt(ex.passage),
            "choices": choices,
            "answerId": answer_id,
            "timeLimitSec": 45,
            "workTitle": title,
            "workAuthor": author,
            "sourceUrl": ex.source_url,
            "sourceType": ex.source_type,
        }
        questions.append(q)
        source_rows.append(
            {
                "id": q["id"],
                "title": title,
                "author": author,
                "sourceUrl": ex.source_url,
                "sourceType": ex.source_type,
                "passageLen": len(q["passage"]),
            }
        )
        print(f"[{i:03d}/100] {title} ({author}) <- {ex.source_type}")
        time.sleep(0.08)

    # Persist generated payload before API mutation.
    out_questions = Path("witt_lit_replacement_payload_20260211.json")
    out_sources = Path("witt_lit_replacement_sources_20260211.json")
    out_questions.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
    out_sources.write_text(json.dumps(source_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    # API mutation
    token = api_login()
    active = api_get_questions(token, TARGET_SERVER)
    old_ids = sorted(
        q["id"]
        for q in active
        if str(q.get("category", "")).strip() == TARGET_CATEGORY and str(q.get("id", "")).startswith("witt-lit-")
    )
    print("old_literature_ids", len(old_ids))
    for qid in old_ids:
        api_deactivate(token, qid)
    print("deactivated", len(old_ids))

    imported = api_import(token, questions)
    print("import_response", imported)

    # Verify
    final_active = api_get_questions(token, TARGET_SERVER)
    lit_active = [q for q in final_active if str(q.get("category", "")).strip() == TARGET_CATEGORY]
    lit_new = [q for q in lit_active if str(q.get("id", "")).startswith("witt-lit-rpl-")]
    print("final_literature_active", len(lit_active))
    print("final_new_ids", len(lit_new))
    print("files_written", str(out_questions), str(out_sources))


if __name__ == "__main__":
    main()
