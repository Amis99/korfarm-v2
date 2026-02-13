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
from typing import Dict, List, Optional, Tuple


API_BASE = "http://localhost:8080"
LOGIN_ID = "hqadmin"
LOGIN_PASSWORD = "admin1234"

TARGET_SERVER = "wittgenstein"
TARGET_CATEGORY = "문학 작품"
TARGET_QUESTION_TYPE = "READING"
PASSAGE_MAX_LEN = 500


# User-provided target list (100 works).
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
    ("오발탄", "이범선 원작·이종기 각색"),
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


BAD_HOSTS = {
    "www.youtube.com",
    "youtube.com",
    "music.youtube.com",
    "m.youtube.com",
    "www.instagram.com",
    "instagram.com",
    "www.facebook.com",
    "facebook.com",
    "www.wooribank.com",
    "wooribank.com",
}

UI_KEYWORDS = [
    "로그인",
    "회원가입",
    "쿠키",
    "이용약관",
    "개인정보",
    "메뉴",
    "검색",
    "공유",
    "댓글",
    "광고",
    "이 페이지",
]

ANALYSIS_KEYWORDS = [
    "해설",
    "분석",
    "정답",
    "오답",
    "문제",
    "해제",
    "감상",
    "작품해설",
    "주제",
    "특징",
]


@dataclass
class Excerpt:
    passage: str
    source_url: str
    source_type: str


def normalize_text(s: str) -> str:
    return re.sub(r"[^0-9A-Za-z가-힣]", "", s).lower()


def korean_ratio(s: str) -> float:
    if not s:
        return 0.0
    ko = len(re.findall(r"[가-힣ㄱ-ㅎㅏ-ㅣ]", s))
    return ko / max(1, len(s))


def trim_head_excerpt(text: str, limit: int = PASSAGE_MAX_LEN) -> str:
    t = text.strip()
    if len(t) <= limit:
        return t
    cut = t[:limit]
    # Keep contiguous head excerpt; end at nearby natural boundary when possible.
    boundary = max(cut.rfind("\n"), cut.rfind(". "), cut.rfind("다."), cut.rfind("요."))
    if boundary >= int(limit * 0.65):
        return cut[: boundary + 1].strip()
    return cut.strip()


def decode_bytes(raw: bytes, content_type: str) -> str:
    enc_candidates: List[str] = []
    m = re.search(r"charset=([A-Za-z0-9_\-]+)", content_type or "", flags=re.I)
    if m:
        enc_candidates.append(m.group(1))
    enc_candidates.extend(["utf-8", "cp949", "euc-kr"])
    for enc in enc_candidates:
        try:
            return raw.decode(enc)
        except Exception:
            pass
    return raw.decode("utf-8", "ignore")


def http_get(url: str, timeout: int = 10) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "ko,en;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
        ct = str(r.headers.get("Content-Type", ""))
    return decode_bytes(raw, ct)


def clean_html_to_text(raw_html: str) -> str:
    text = raw_html
    text = re.sub(r"(?is)<script.*?>.*?</script>", "\n", text)
    text = re.sub(r"(?is)<style.*?>.*?</style>", "\n", text)
    text = re.sub(r"(?i)</(p|div|li|h1|h2|h3|h4|h5|h6|section|article|blockquote|tr)>", "\n", text)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = html.unescape(text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def page_seems_relevant(page_text: str, title: str, author: str) -> bool:
    p = normalize_text(page_text)
    t = normalize_text(title)
    a = normalize_text(author)
    if len(t) >= 3 and t not in p:
        return False
    # Short titles are ambiguous; require author too.
    if len(t) <= 2 and len(a) >= 2 and a not in p:
        return False
    return True


def paragraph_candidates(clean_text: str) -> List[str]:
    parts = [p.strip() for p in re.split(r"\n{2,}", clean_text) if p.strip()]
    out: List[str] = []
    for p in parts:
        if len(p) >= 80:
            out.append(p)

    # Add poem-like windows from short contiguous lines.
    lines = [ln.strip() for ln in clean_text.splitlines() if ln.strip()]
    for i in range(0, max(0, len(lines) - 5)):
        window = lines[i : i + 10]
        if len(window) < 5:
            continue
        if sum(1 for ln in window if len(ln) <= 36) >= 6:
            out.append("\n".join(window))
    return out


def score_candidate(text: str) -> float:
    if len(text) < 80:
        return -1e9
    kr = korean_ratio(text)
    if kr < 0.48:
        return -1e9
    score = 0.0
    score += 80.0 * kr
    score += min(len(text), 700) * 0.02
    score += text.count("\n") * 1.5
    score -= sum(text.count(k) for k in UI_KEYWORDS) * 8.0
    score -= sum(text.count(k) for k in ANALYSIS_KEYWORDS) * 4.0
    return score


def pick_best_excerpt_from_page(raw_html: str, title: str, author: str) -> Optional[str]:
    clean = clean_html_to_text(raw_html)
    if not page_seems_relevant(clean, title, author):
        return None
    cands = paragraph_candidates(clean)
    if not cands:
        return None
    ranked = sorted(((score_candidate(c), c) for c in cands), key=lambda x: x[0], reverse=True)
    best_score, best = ranked[0]
    if best_score < 18.0:
        return None
    passage = trim_head_excerpt(best)
    if len(passage) < 80:
        return None
    if sum(passage.count(k) for k in UI_KEYWORDS) >= 2:
        return None
    return passage


def wikisource_api_extract(title: str) -> Optional[Excerpt]:
    api = (
        "https://ko.wikisource.org/w/api.php?action=query&prop=extracts"
        "&explaintext=1&redirects=1&format=json&titles="
        + urllib.parse.quote(title)
    )
    try:
        body = http_get(api, timeout=10)
        obj = json.loads(body)
        pages = obj.get("query", {}).get("pages", {})
    except Exception:
        return None
    if not isinstance(pages, dict):
        return None
    for _, page in pages.items():
        extract = str(page.get("extract", "")).strip()
        if len(extract) < 80:
            continue
        if korean_ratio(extract) < 0.4:
            continue
        return Excerpt(
            passage=trim_head_excerpt(extract),
            source_url="https://ko.wikisource.org/wiki/" + urllib.parse.quote(title),
            source_type="wikisource_api",
        )
    return None


def search_bing_rss(query: str) -> List[Tuple[str, str, str]]:
    url = "https://www.bing.com/search?format=rss&q=" + urllib.parse.quote(query)
    try:
        xml_text = http_get(url, timeout=10)
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


def candidate_title_variants(title: str) -> List[str]:
    out = [title]
    # e.g. "토지 (이형우 각색 시나리오)" -> "토지"
    paren_removed = re.sub(r"\s*\([^)]*\)", "", title).strip()
    if paren_removed and paren_removed not in out:
        out.append(paren_removed)
    # Normalize spaces for search.
    no_space = title.replace(" ", "")
    if no_space and no_space not in out:
        out.append(no_space)
    return out


def extract_from_web_pages(title: str, author: str) -> Optional[Excerpt]:
    queries = [
        f"\"{title}\" \"{author}\" 원문",
        f"\"{title}\" \"{author}\" 기출 지문",
        f"\"{title}\" \"{author}\" 전문",
        f"\"{title}\" \"{author}\"",
    ]
    seen_links = set()
    fetch_count = 0
    for q in queries:
        items = search_bing_rss(q)
        for item_title, link, _desc in items[:10]:
            if not link:
                continue
            if link in seen_links:
                continue
            seen_links.add(link)
            host = urllib.parse.urlparse(link).netloc.lower()
            if host in BAD_HOSTS:
                continue
            fetch_count += 1
            if fetch_count > 18:
                return None
            try:
                raw = http_get(link, timeout=8)
            except Exception:
                continue
            passage = pick_best_excerpt_from_page(raw, title, author)
            if not passage:
                continue
            return Excerpt(
                passage=passage,
                source_url=link,
                source_type="web_page_extract",
            )
    return None


def build_excerpt(title: str, author: str) -> Optional[Excerpt]:
    # 1) Try wikisource first (best for public-domain texts).
    for tv in candidate_title_variants(title):
        ex = wikisource_api_extract(tv)
        if ex:
            return ex

    # 2) General web pages containing quoted original text.
    ex = extract_from_web_pages(title, author)
    if ex:
        return ex

    return None


def create_choices(correct: str, pool: List[str], idx: int) -> Tuple[List[dict], str]:
    # Nearby works in the same list tend to be relatively plausible distractors.
    n = len(pool)
    cand: List[str] = []
    for off in [1, 2, 3, 4, 5, 7, 9, 11]:
        cand.append(pool[(idx + off) % n])
        cand.append(pool[(idx - off) % n])
    cand = [x for x in cand if x != correct]
    uniq: List[str] = []
    seen = set()
    for x in cand:
        if x in seen:
            continue
        seen.add(x)
        uniq.append(x)
    distractors = uniq[:3]
    options = [correct] + distractors
    random.shuffle(options)
    ids = ["1", "2", "3", "4"]
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
        raise RuntimeError("Failed to login as admin")
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
        return None


def api_import(token: str, payload: List[dict]) -> Dict:
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
    with urllib.request.urlopen(req, timeout=90) as r:
        obj = json.loads(r.read().decode("utf-8"))
    return obj


def main() -> None:
    random.seed(20260211)
    if len(WORKS) != 100:
        raise RuntimeError(f"WORKS length must be 100, got {len(WORKS)}")

    titles_for_choices = [f"{t} ({a})" if a else t for t, a in WORKS]

    payload: List[dict] = []
    source_rows: List[dict] = []
    missing: List[Tuple[int, str, str]] = []

    # Build all excerpts first. If any miss, fail fast and do not mutate DB.
    for i, (title, author) in enumerate(WORKS, start=1):
        print(f"[{i:03d}/100] collecting {title} ({author}) ...")
        ex = build_excerpt(title, author)
        if not ex:
            print(f"[{i:03d}/100] {title} ({author}) <- MISSING")
            missing.append((i, title, author))
            continue

        display_title = f"{title} ({author})" if author else title
        choices, answer_id = create_choices(display_title, titles_for_choices, i - 1)
        q = {
            "id": f"witt-lit-rpl-{i:03d}",
            "serverId": TARGET_SERVER,
            "questionType": TARGET_QUESTION_TYPE,
            "category": TARGET_CATEGORY,
            "stem": "윗글의 출전 작품으로 가장 적절한 것은?",
            "passage": trim_head_excerpt(ex.passage),
            "choices": choices,
            "answerId": answer_id,
            "timeLimitSec": 45,
            "workTitle": title,
            "workAuthor": author,
            "sourceUrl": ex.source_url,
            "sourceType": ex.source_type,
        }
        payload.append(q)
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

    if missing:
        missing_path = Path("witt_lit_replacement_missing_20260211.json")
        missing_path.write_text(
            json.dumps(
                [{"idx": i, "title": t, "author": a} for i, t, a in missing],
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        raise RuntimeError(
            f"Missing excerpts for {len(missing)} works. "
            f"See {missing_path.name}. DB not mutated."
        )

    out_payload = Path("witt_lit_replacement_payload_strict_20260211.json")
    out_sources = Path("witt_lit_replacement_sources_strict_20260211.json")
    out_payload.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    out_sources.write_text(json.dumps(source_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    token = api_login()
    active = api_get_questions(token, TARGET_SERVER)
    old_ids = sorted(
        q["id"]
        for q in active
        if str(q.get("category", "")).strip() == TARGET_CATEGORY
        and (str(q.get("id", "")).startswith("witt-lit-") or str(q.get("id", "")).startswith("witt-lit-rpl-"))
    )
    print("old_literature_ids", len(old_ids))
    for qid in old_ids:
        api_deactivate(token, qid)
    print("deactivated", len(old_ids))

    imported = api_import(token, payload)
    print("import_response", imported)

    final_active = api_get_questions(token, TARGET_SERVER)
    lit_active = [q for q in final_active if str(q.get("category", "")).strip() == TARGET_CATEGORY]
    lit_new = [q for q in lit_active if str(q.get("id", "")).startswith("witt-lit-rpl-")]
    print("final_literature_active", len(lit_active))
    print("final_new_ids", len(lit_new))
    print("files_written", out_payload.name, out_sources.name)


if __name__ == "__main__":
    main()
