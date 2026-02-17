import json
import os
import random
import re
from dataclasses import dataclass
from pathlib import Path

import fitz  # PyMuPDF

BASE_DB = Path(r"C:\Users\RENEWCOM PC\Documents\국어농장 v2 학습DB")
DAILY_READING_DIR = BASE_DB / "daily-reading"
NONFICTION_DIR = BASE_DB / "비문학json" / "비문학_해설_개별"
LIT_DIR = BASE_DB / "문학MD"
MTH_DIR = BASE_DB / "마더텅"

# PDFs used only as passage sources for speech/writing/grammar.
PDF_SPEECH_WRITING = MTH_DIR / "2027_마더텅_수능기출문제집_국어_화법과_작문_문제편(정답표시O).pdf"
PDF_GRAMMAR = MTH_DIR / "2027_마더텅_수능기출문제집_국어_언어와_매체_문제편(정답표시O).pdf"

STOPWORDS = {
    "그리고",
    "그러나",
    "하지만",
    "따라서",
    "그래서",
    "또한",
    "또는",
    "즉",
    "다음",
    "글을",
    "읽고",
    "물음에",
    "답하시오",
}

CONNECTIVE_MAP = {
    "그러나": "대조",
    "하지만": "대조",
    "반면": "대조",
    "따라서": "인과",
    "그러므로": "인과",
    "그래서": "인과",
    "또한": "첨가",
    "게다가": "첨가",
    "예를 들어": "예시",
    "이를테면": "예시",
    "가령": "예시",
}

# Regenerate on reruns (rules for passage splitting/marker removal/timeline apply).
OVERWRITE_LEVELS = {
    "saussure1",
    "saussure2",
    "saussure3",
    "frege1",
    "frege2",
    "frege3",
    "russell1",
    "russell2",
    "russell3",
    "wittgenstein1",
    "wittgenstein2",
    "wittgenstein3",
}



@dataclass
class PassageSource:
    source_type: str  # nonfiction|literature|pdf
    source_path: str
    title: str
    text: str


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Remove markdown bold markers but keep content.
    text = text.replace("**", "")
    # Drop control chars (PDF extraction sometimes contains backspace/ETX/etc).
    text = re.sub(r"[\x00-\x08\x0b-\x1f]", "", text)
    # Normalize repeated spaces.
    text = re.sub(r"[ \t]+", " ", text)
    # Strip trailing spaces per line.
    text = "\n".join(line.rstrip() for line in text.split("\n"))
    return text.strip()


def strip_exam_headers(text: str) -> str:
    # Remove common instruction-only lines at the very top.
    lines = [ln.strip() for ln in text.split("\n")]
    out = []
    for i, ln in enumerate(lines):
        if i < 5 and (
            "다음 글을 읽고" in ln
            or re.match(r"^\[[0-9~\- ]+\]", ln)
            or ln.startswith("###")
        ):
            continue
        out.append(ln)
    # Drop leading empty lines.
    while out and out[0] == "":
        out.pop(0)
    return "\n".join(out).strip()


def split_paragraphs(text: str):
    # Prefer blank-line paragraph splitting.
    parts = re.split(r"\n\s*\n+", text.strip())
    parts = [p.strip() for p in parts if p.strip()]
    # If single huge block with many line breaks, collapse single newlines.
    if len(parts) == 1 and text.count("\n") > 8:
        lines = [ln.strip() for ln in parts[0].split("\n") if ln.strip()]
        if lines:
            avg = sum(len(ln) for ln in lines) / len(lines)
            mx = max(len(ln) for ln in lines)
            # Poem-like: keep line breaks to preserve reading units.
            if avg <= 25 and mx <= 60:
                return [parts[0].strip()]
        collapsed = re.sub(r"\n+", " ", parts[0])
        collapsed = re.sub(r"\s+", " ", collapsed).strip()
        return [collapsed]
    return parts


def excerpt_to_length(text: str, target_len: int) -> str:
    if len(text) <= target_len:
        return text
    cut = text[: int(target_len * 1.15)]
    if len(cut) > target_len:
        cut = cut[:target_len]
    # Try to cut at a sentence-ish boundary.
    boundary = max(cut.rfind("."), cut.rfind("!"), cut.rfind("?"), cut.rfind("\n"))
    if boundary > int(target_len * 0.85):
        cut = cut[: boundary + 1]
    # Avoid trailing half-word.
    cut = cut.rstrip()
    return cut


def _strip_md_escapes(text: str) -> str:
    # 문학MD/마크다운 원문에서 특수문자를 그대로 보여주려고 역슬래시로 이스케이프해 둔 경우가 있어 정리한다.
    # 예: "\[정답\]" -> "[정답]", "22\." -> "22.", "22\~26" -> "22~26"
    return re.sub(r"\\([\[\]().<>~+*:-])", r"\1", text)


_GANA_PART_RE = re.compile(r"(^|\n)\s*\(\s*([가-하])\s*\)\s*", flags=re.M)


def split_gana_parts(text: str):
    # (가)(나)...로 구분된 지문은 각각을 별도의 지문으로 처리한다.
    # 구분자는 최종 지문에서 삭제한다.
    matches = list(_GANA_PART_RE.finditer(text))
    if len(matches) < 2:
        return [(None, text)]

    parts = []
    for i, m in enumerate(matches):
        label = m.group(2)
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        part = text[start:end].strip()
        if part:
            parts.append((label, part))
    return parts if parts else [(None, text)]


def remove_passage_markers(text: str) -> str:
    # 지문 내 원문자 기호 및 [A], [B] 같은 구간 기호 등 삭제.
    text = _strip_md_escapes(text)

    # Remove segment markers (if any remain).
    text = re.sub(r"\([가-하]\)", "", text)

    # Remove bracket section markers.
    text = re.sub(r"\[[A-Z]\]", "", text)
    text = re.sub(r"\[\s*[0-9]+\s*~\s*[0-9]+\s*\]", "", text)
    text = re.sub(r"\[\s*[0-9]+\s*점\s*\]", "", text)

    # Remove common circled option markers / inline labels.
    text = re.sub(r"[①②③④⑤⑥⑦⑧⑨⑩]", "", text)
    text = re.sub(r"[㉠㉡㉢㉣㉤]", "", text)
    text = re.sub(r"[ⓐⓑⓒⓓⓔ]", "", text)
    text = re.sub(r"[\u24B6-\u24CF]", "", text)  # Ⓐ..Ⓩ
    text = re.sub(r"[\u24D0-\u24E9]", "", text)  # ⓐ..ⓩ

    return text


def strip_non_passage_lines(text: str) -> str:
    # 지문 본문과 무관한 시험/해설성 라인들을 제거한다.
    # (완전한 '원문 재구성'은 하지 않고, 명백한 메타/해설만 필터링)
    lines = text.split("\n")
    out = []
    content_chars = 0
    skip_next_suffix = False
    for ln in lines:
        s = ln.strip()
        if not s:
            out.append("")
            continue

        if skip_next_suffix:
            # e.g. "물음에 답하" + "시오." or "물음에 답하시" + "오."
            if re.fullmatch(r"(오\.?|하?\s*시오\.?)", s):
                skip_next_suffix = False
                continue
            skip_next_suffix = False

        # Markdown headings / separators.
        if s.startswith("#"):
            continue
        if s in {"---", "***"}:
            continue

        # Split instruction fragments sometimes appear as their own lines in PDF extracts.
        # (e.g. "물음에 답" + "하시오.")
        if re.fullmatch(r"(물음에|답하(?:시오|라|여라|세요)\.?|하(?:시오|라|여라|세요)\.?)", s):
            continue

        # Common meta lines from workbook/PDF sources.
        if re.search(r"(정답과\s*해설편|정답과\s*해설|해설편\s*p\.\s*\d+|해설편\s*p\.\s*\d+|해설편\s*p\.)", s):
            continue
        if "마더텅" in s:
            continue
        if s in {"목록", "위", "아래", "답장", "전달", "×삭제", "스팸 신고", "전체 답장"}:
            continue
        if re.search(r"\d{4}\s*(학년도|년).*(모평|학평|수능|전국연합|모의평가|학력평가)", s):
            continue
        if re.fullmatch(r"\d{1,4}", s):
            continue

        # Obvious instruction/meta lines.
        # Inline instructions sometimes appear inside otherwise useful text (esp. PDF extracts).
        # Drop just the instruction fragment and keep the rest.
        if "다음 글을 읽고" in s or re.search(r"물음에\s*답", s):
            if re.search(r"물음에\s*답\s*$", s) or re.search(r"물음에\s*답하[가-힣]{0,2}\s*$", s):
                skip_next_suffix = True
            s2 = s.replace("다음 글을 읽고", "")
            s2 = re.sub(r"물음에\s*답(?:\s*하[가-힣]{0,6})?\.?", "", s2)
            s2 = normalize_text(s2)
            if not s2:
                continue
            ln = s2
            s = s2
        if re.fullmatch(r"\[[0-9]+\s*~\s*[0-9]+\]", s):
            continue

        # Common section labels from exam formatting.
        if s in {"[본문]", "[지문]", "[자료]", "[보기]", "<보기>", "[해설]", "[정답]"}:
            continue
        if re.fullmatch(r"\[[^\]]*(상황|자료|보기|해설|정답|출전|문항|점검)[^\]]*\]", s):
            continue
        if re.search(r"앞부분\s*줄거리|중략\s*줄거리", s):
            continue

        # Exam blocks frequently appear after the passage in workbook/PDF extractions.
        # Once we have accumulated some passage content, cut at the start of those blocks
        # to avoid keeping choice lines that don't match simple regex filters.
        exam_block_start = False
        # Unnumbered exam stems (PDF extraction may lose leading numbers).
        if re.search(r"(가장\s*적절한\s*것은|적절하지\s*않은\s*것은|적절한\s*것은|옳은\s*것은|틀린\s*것은|알맞은\s*것은)", s):
            exam_block_start = True
        if re.match(r"^(정답|해설|오답\s*해설|오답해설|풀이|모범\s*답안)\b", s):
            exam_block_start = True
        if re.search(r"(정답\s*[:：]|오답해설|작품\s*해설|줄거리\s*[:：]|해설\s*$|출전\s*[:：])", s):
            exam_block_start = True
        # Numbered question stems (including markdown-escaped ordered lists already unescaped).
        if re.match(r"^\d+\s*[.)]\s*.*(\?|적절한 것은|옳은 것은|틀린 것은|알맞은 것은|내용으로)\b", s):
            exam_block_start = True
        if re.match(r"^문항\s*\d+", s):
            exam_block_start = True
        # Choice labels that often mark the start of option blocks.
        if re.match(r"^[①②③④⑤⑥⑦⑧⑨⑩]", s) or re.match(r"^[㉠㉡㉢㉣㉤]", s) or re.match(r"^[ⓐⓑⓒⓓⓔ]", s) or re.match(r"^[ⒶⒷⒸⒹⒺ]", s):
            exam_block_start = True
        if "<보기" in s or re.search(r"\[[0-9]+\s*점\]", s):
            exam_block_start = True
        if s.startswith("[") and ("해설" in s or "정답" in s or "줄거리" in s):
            exam_block_start = True

        if exam_block_start:
            if content_chars >= 60:
                break
            continue

        # Drop numbered question/explanation blocks.
        if re.match(r"^\d+\.\s", s):
            continue
        if re.match(r"^문항\s*\d+", s):
            continue

        out.append(ln)
        # Count only non-credit-ish lines as "real content" for cutting decisions.
        if not (("「" in s and "」" in s and len(s) <= 40) or s.startswith("— ")):
            content_chars += len(s)

    # Trim leading blanks
    while out and out[0].strip() == "":
        out.pop(0)
    return normalize_text("\n".join(out))


def clean_sourced_passage(text: str) -> str:
    # Sources(비문학json/문학MD/pdf)에서 가져온 지문 정제.
    text = normalize_text(text)
    text = _strip_md_escapes(text)
    # Strip meta/문항/해설 블록을 먼저 잘라낸 다음(표식이 남아 있어야 탐지 쉬움),
    # 마지막에 표식을 일괄 제거한다.
    text = strip_non_passage_lines(text)
    text = remove_passage_markers(text)
    return normalize_text(text)


def _clean_source_text_for_elementary(text: str) -> str:
    # 초등 레벨에서 방해가 되는 표식/주석/한자 등을 제거한다.
    # (러셀/비트겐슈타인 레벨은 OVERWRITE_LEVELS에 포함되지 않아 재생성되지 않으므로 영향 없음)
    text = clean_sourced_passage(text)

    # Remove parenthetical hanja (e.g., 연년(年年)).
    text = re.sub(r"\([^)]*[\u4E00-\u9FFF][^)]*\)", "", text)
    # Remove remaining hanja characters.
    text = re.sub(r"[\u4E00-\u9FFF]", "", text)

    # Remove footnote markers used in some sources.
    text = text.replace("*", "")
    return normalize_text(text)


def _simplify_sentences_for_saussure(text: str) -> str:
    # 초1~3: 너무 긴 문장/어려운 접속어를 조금 더 단순하게 만든다(완전한 재서술은 하지 않음).
    replacements = {
        "따라서": "그래서",
        "그러므로": "그래서",
        "그러나": "하지만",
        "반면": "하지만",
        "또한": "그리고",
        "게다가": "그리고",
        "이를테면": "예를 들어",
        "즉": "그래서",
    }
    for a, b in replacements.items():
        text = text.replace(a, b)
    # Break very long comma chains into shorter sentences.
    text = re.sub(r",\s*", ". ", text)
    # Normalize repeated sentence endings introduced by the rule above.
    text = re.sub(r"\.\s*\.", ".", text)
    return normalize_text(text)


_ARCHAIC_RE = re.compile(r"(하노라|하노니|하도다|이라오|다마는|왈|曰|무릇|하였더니|가노라)")


def _build_elementary_pool(sources: list[PassageSource], level: str, target_len: int) -> list[PassageSource]:
    # Filter/clean sources for 초등 레벨. 부족하면 원본 풀로 fallback한다.
    out: list[PassageSource] = []
    for src in sources:
        t = _clean_source_text_for_elementary(src.text)
        if len(t) < 220:
            continue
        if level.startswith("saussure"):
            # 초1~3: 고전적 표현/한자/주석이 남아 있으면 제외.
            if _ARCHAIC_RE.search(t):
                continue
        # For safety, exclude sources that still contain too many parentheses (often glosses).
        if t.count("(") + t.count(")") > 10:
            continue
        out.append(PassageSource(src.source_type, src.source_path, src.title, t))
    if not out:
        return sources
    # Prefer sources that can fill the target length without being too short.
    out2 = [s for s in out if len(s.text) >= int(target_len * 0.7)]
    return out2 if out2 else out
def generate_life_text(level: str, day: int) -> str:
    # 생활문은 레벨별 글자수 기준에 맞춰 excerpt_to_length로 길이를 맞춘다.
    # (사)~(프) 구간은 생활문을 직접 생성한다.

    base_common = f"""[안내문]

[제목] 학교 활동 안내
이 안내문은 오늘 진행할 활동을 안내합니다. 끝까지 읽고, 필요한 준비를 해 주세요.

[목적]
- 안전하게 활동하기
- 약속을 지키며 함께하기
- 활동 뒤에 스스로 돌아보기

[일정]
- 09:50  교실 집합(출석 확인)
- 10:00  활동 설명 듣기
- 10:10  조별 활동 시작
- 10:40  정리 및 마무리

[장소]
- 교실 또는 운동장(날씨에 따라 변경될 수 있음)

[준비물]
- 필기도구(연필/샤프)
- 물(뚜껑 있는 물병)
- 손수건 또는 물티슈
- 작은 메모지(없으면 공책 한쪽을 사용)

[기본 약속]
1) 복도에서는 뛰지 않습니다.
2) 줄을 서서 차례를 지킵니다.
3) 친구를 밀거나 장난치지 않습니다.
4) 선생님 안내를 듣고 움직입니다.
5) 쓰레기는 정해진 곳에 버립니다.

[활동 순서]
- 1단계: 준비물을 확인하고 자리에 앉습니다.
- 2단계: 조를 만들고 역할을 정합니다.
- 3단계: 역할에 따라 활동을 진행합니다.
- 4단계: 결과를 한 문장으로 정리합니다.
- 5단계: 자리 정돈과 분리수거를 합니다.

[마무리]
활동이 끝나면, 오늘 잘한 점 1가지와 다음에 더 잘하고 싶은 점 1가지를 적어 봅시다.

[문의]
궁금한 점은 담임 선생님께 물어보세요.
"""

    if level.startswith("saussure"):
        # 초1~3: 쉬운 어휘/짧은 문장, 예시를 많이 넣어 길이를 확보한다.
        return base_common + f"""

[추가 안내]
- 운동화가 있으면 더 좋아요.
- 활동이 끝나면 손을 깨끗이 씻어요.
- 친구가 어려워하면 도와줄 수 있어요.
- 조용히 말하고, 서로의 말을 들어요.

[기억하기]
안전 약속을 지키면 모두가 즐거워요.
"""

    if level.startswith("frege"):
        # 초4~6: 규칙을 더 구체적으로 제시하고, 체크리스트를 제공한다.
        return base_common + f"""

[주의 사항]
- 활동 중에는 휴대전화 사용을 하지 않습니다.
- 개인 물건(휴대전화, 지갑 등)은 가방 안에 넣어 둡니다.
- 문제가 생기면 혼자 해결하려고 하지 말고 선생님께 알립니다.

[조별 역할 예시]
- 기록 담당: 중요한 내용을 메모합니다.
- 정리 담당: 자리 정돈과 분리수거를 확인합니다.
- 발표 담당: 조의 결과를 짧게 말합니다.

[체크리스트]
□ 준비물을 챙겼다.
□ 약속을 읽었다.
□ 조별 역할을 정했다.
□ 활동 내용을 한 문장으로 정리했다.
□ 정리를 마쳤다.
"""

    return base_common



def generate_usage_text(level: str, day: int) -> str:
    # 어법은 규칙 + 예시 + 미니 점검으로 구성하고, excerpt_to_length로 길이를 맞춘다.

    if level.startswith("saussure"):
        return f"""[어법]

[주제] "안"과 "않"

1) "안"은 동사/형용사 앞에 붙어서 ‘하지 않다’의 뜻을 나타내요.
예) 안 가요 / 안 먹어요 / 안 해요 / 안 좋아요 / 안 보아요

2) "않"은 "-지 않다"처럼 뒤에 붙여서 써요.
예) 가지 않아요 / 먹지 않아요 / 하지 않아요 / 좋지 않아요 / 보지 않아요

[예문 읽기]
- 나는 오늘 학교에 안 갔어요.
- 나는 오늘 학교에 가지 않았어요.
- 우리는 약속을 안 잊어요.
- 우리는 약속을 잊지 않아요.
- 동생은 채소를 안 먹어요.
- 동생은 채소를 먹지 않아요.

[미니 점검]
다음 문장에서 ( )에 들어갈 말을 고르세요.
1) 나는 오늘 숙제를 (   ) 했어요.
2) 나는 늦게 (   ) 일어났어요.
3) 나는 친구와 싸우지 (   ).
4) 나는 텔레비전을 (   ) 봐요.

[정리]
- "안"은 앞에 붙여요.
- "않"은 "-지" 뒤에 써요.

[추가 예문]
- 나는 오늘은 안 늦을 거예요.
- 나는 오늘은 늦지 않을 거예요.
- 우리는 약속을 안 어겨요.
- 우리는 약속을 어기지 않아요.
- 동생은 아직 안 자요.
- 동생은 아직 자지 않아요.

[추가 점검]
다음 문장을 읽고, "안" 또는 "않"을 알맞게 넣어 보세요.
1) 나는 지금은 공부를 (   ) 해요.
2) 나는 과자를 (   ) 먹을 거예요.
3) 나는 친구를 (   ) 놀렸어요.
4) 나는 선생님 말씀을 잊지 (   ).
"""

    if level.startswith("frege"):
        extra = ""
        if level.endswith("2") or level.endswith("3"):
            extra = """

[주제 3] 띄어쓰기: "밖에"

"밖에"는 ‘그것 말고는’이라는 뜻을 나타내는 말입니다.
보통 앞말과 붙여 쓰고, 뒤에는 "없다" 같은 부정 표현이 이어집니다.
예) 물밖에 없다 / 시간밖에 없다 / 너밖에 없다

[예문]
1) 지금은 열쇠밖에 없다.
2) 나는 그 말밖에 기억나지 않는다.

[미니 점검]
다음 문장을 바르게 고쳐 보세요.
- (가) 우리집에는 빵 밖에 없다.
- (나) 나는 너 밖에 생각하지 않는다.
"""
        if level.endswith("3"):
            extra += """

[심화] 문장 점검
아래 문장에서 띄어쓰기가 어색한 부분을 찾아 고쳐 보세요.
1) 우리는 끝까지 할수있다.
2) 오늘은 물만 마셨을뿐이다.
3) 지금은 열쇠밖에없다.
"""
        return f"""[어법]

[주제 1] 띄어쓰기: "수 있다" / "수 없다"

"수"는 ‘방법’이나 ‘능력’을 뜻하는 말이라서 보통 "있다/없다"와 띄어 씁니다.
예) 할 수 있다 / 갈 수 없다 / 읽을 수 있다 / 볼 수 없다

[예문]
1) 나는 오늘 끝까지 해낼 수 있다.
2) 지금은 밖에 나갈 수 없다.
3) 이 문제는 조금만 생각하면 풀 수 있다.
4) 그 말은 사실인지 알 수 없다.

[미니 점검]
다음 문장을 바르게 고쳐 보세요.
- (가) 나는 지금은 갈수없다.
- (나) 우리는 같이 할수있다.
- (다) 이 책은 읽을수있다.

[주제 2] 띄어쓰기: "뿐"의 쓰임

"뿐"은 ‘그것만’이라는 뜻을 나타내는 말로, 앞말과 붙여 쓰는 경우가 많습니다.
예) 나뿐이다 / 하나뿐인 친구 / 시간뿐이다

[예문]
- 오늘은 물만 마셨을 뿐이다.
- 그는 웃기만 할 뿐, 아무 말도 하지 않았다.

[정리]
- 띄어쓰기는 문장을 다 쓴 뒤에 한 번 더 확인합니다.
- 비슷해 보이는 표현(수 있다/없다, 뿐 등)은 자주 틀리므로 예문을 떠올립니다.

[추가 예시]
- 볼 수 있다 / 볼 수 없다
- 만들 수 있다 / 만들 수 없다
- 기억할 수 있다 / 기억할 수 없다
- 한 번뿐이다 / 하나뿐이다
{extra}
"""

    return f"""[어법]

오늘은 표현의 쓰임을 확인합니다.
"""

def pick_keyword(paragraphs):
    # Prefer a unique-ish Korean word.
    text = "\n".join(paragraphs)
    words = re.findall(r"[가-힣]{2,8}", text)
    if not words:
        return None
    # Count occurrences.
    freq = {}
    for w in words:
        if w in STOPWORDS:
            continue
        freq[w] = freq.get(w, 0) + 1
    if not freq:
        return None
    # Prefer words that appear 1-2 times.
    candidates = sorted(freq.items(), key=lambda kv: (kv[1], -len(kv[0])))
    return candidates[0][0]


def find_ranges(paragraphs, needle: str):
    ranges = []
    if not needle:
        return ranges
    for idx, p in enumerate(paragraphs, 1):
        start = 0
        while True:
            pos = p.find(needle, start)
            if pos < 0:
                break
            ranges.append({"paragraphId": f"p{idx}", "start": pos, "end": pos + len(needle)})
            start = pos + 1
    return ranges


def _collapse_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def truncate_choice(text: str, max_len: int = 90) -> str:
    t = _collapse_spaces(text)
    if len(t) <= max_len:
        return t
    cut = t[:max_len]
    sp = cut.rfind(" ")
    if sp >= int(max_len * 0.7):
        cut = cut[:sp]
    return cut.strip()


def sentence_spans(paragraph: str):
    # 문장을 앞에서부터 순차적으로 나누고, 각 문장의 (start,end,text)를 반환한다.
    spans = []
    n = len(paragraph)
    i = 0
    while i < n:
        while i < n and paragraph[i].isspace():
            i += 1
        if i >= n:
            break

        j = i
        while j < n:
            ch = paragraph[j]
            if ch in ".!?":
                j += 1
                break
            if ch == "\n":
                break
            j += 1

        end = j
        if j < n and paragraph[j] == "\n":
            end = j
            while j < n and paragraph[j] == "\n":
                j += 1

        while end > i and paragraph[end - 1].isspace() and paragraph[end - 1] != "\n":
            end -= 1

        seg = paragraph[i:end].strip()
        if seg:
            spans.append({"start": i, "end": end, "text": seg})
        i = j

    # Merge very short spans into the next one (e.g., stray quotes).
    merged = []
    k = 0
    while k < len(spans):
        cur = spans[k]
        if len(cur["text"]) < 8 and k + 1 < len(spans):
            nxt = spans[k + 1]
            merged.append({"start": cur["start"], "end": nxt["end"], "text": (cur["text"] + " " + nxt["text"]).strip()})
            k += 2
        else:
            merged.append(cur)
            k += 1
    return merged


_PARTICLE_RE = re.compile(r"([가-힣]{2,12})(은|는|이|가|을|를|에|에서|에게|으로|로)(?=[^가-힣]|$)")


def build_intensive_steps(paragraphs, level_tag: str, sub_area: str):
    # - 모든 문장을 앞에서부터 순차 하이라이트 + 질문
    # - 각 문단의 문장들이 끝나면 문단 전체 하이라이트 + 중심 내용 질문
    # - 접속어/중요 어구 질문은 해당 문장 직전에 배치 가능
    steps = []
    ids = ["A", "B", "C", "D"]

    para_spans = []
    para_snips = []
    all_snips = []
    for p in paragraphs:
        spans = sentence_spans(p)
        para_spans.append(spans)
        snips = []
        for sp in spans:
            sn = truncate_choice(sp["text"])
            if sn:
                snips.append(sn)
                all_snips.append(sn)
        para_snips.append(snips)

    def pick_distractors(correct: str, same_para: list[str]):
        seen = {correct}
        pool = []
        for s in same_para:
            if s and s not in seen:
                pool.append(s)
                seen.add(s)
        for s in all_snips:
            if s and s not in seen:
                pool.append(s)
                seen.add(s)
        random.shuffle(pool)
        out = pool[:3]
        while len(out) < 3:
            out.append("지문에 없는 내용")
        return out

    def shuffled_choices(correct_text: str, distractors: list[str]):
        choices = [correct_text] + distractors[:3]
        order = list(range(4))
        random.shuffle(order)
        choices2 = [choices[k] for k in order]
        answer_idx = choices2.index(correct_text)
        return [{"id": ids[k], "text": choices2[k]} for k in range(4)], ids[answer_idx]

    for pi, spans in enumerate(para_spans, 1):
        pid = f"p{pi}"
        concept_added = False
        role_added = False

        for sp in spans:
            sent = sp["text"]
            sent_snip = truncate_choice(sent)

            # (선택) 문장 성분/호응 점검: 문단당 1회
            if not role_added:
                m = _PARTICLE_RE.search(sent)
                if m:
                    particle = m.group(2)
                    role = "주어" if particle in {"은", "는", "이", "가"} else ("목적어" if particle in {"을", "를"} else "부사어")
                    pos0 = sp["start"] + m.start()
                    pos1 = sp["start"] + m.end()
                    options = ["주어", "목적어", "부사어", "서술어"]
                    random.shuffle(options)
                    ans_id = "ABCD"[options.index(role)]
                    steps.append(
                        {
                            "stepId": f"s{len(steps)+1}",
                            "highlight": {"paragraphId": pid, "range": {"start": pos0, "end": pos1}},
                            "question": {
                                "prompt": "하이라이트된 말의 문장 성분으로 가장 알맞은 것은?",
                                "choices": [{"id": "A", "text": options[0]}, {"id": "B", "text": options[1]}, {"id": "C", "text": options[2]}, {"id": "D", "text": options[3]}],
                                "answerId": ans_id,
                                "scoring": {"correctDeltaSec": 20, "wrongDeltaSec": -20, "eliminateWrongChoice": True},
                            },
                        }
                    )
                    role_added = True

            # 접속어/관계 질문(해당 문장 직전에)
            for conn, rel in CONNECTIVE_MAP.items():
                pos = sent.find(conn)
                if pos >= 0:
                    options = ["대조", "인과", "첨가", "예시"]
                    random.shuffle(options)
                    ans_id = "ABCD"[options.index(rel)]
                    steps.append(
                        {
                            "stepId": f"s{len(steps)+1}",
                            "highlight": {"paragraphId": pid, "range": {"start": sp["start"] + pos, "end": sp["start"] + pos + len(conn)}},
                            "question": {
                                "prompt": "하이라이트된 접속어가 나타내는 관계로 가장 적절한 것은?",
                                "choices": [{"id": "A", "text": options[0]}, {"id": "B", "text": options[1]}, {"id": "C", "text": options[2]}, {"id": "D", "text": options[3]}],
                                "answerId": ans_id,
                                "scoring": {"correctDeltaSec": 20, "wrongDeltaSec": -20, "eliminateWrongChoice": True},
                            },
                        }
                    )
                    break

            # (문학) 표현법 점검: "처럼" 기반 직유(문단당 1회)
            if sub_area == "LITERATURE" and not concept_added:
                pos = sent.find("처럼")
                if pos >= 0:
                    options = ["직유법", "은유법", "의인법", "반복법"]
                    random.shuffle(options)
                    ans_id = "ABCD"[options.index("직유법")]
                    steps.append(
                        {
                            "stepId": f"s{len(steps)+1}",
                            "highlight": {"paragraphId": pid, "range": {"start": sp["start"] + pos, "end": sp["start"] + pos + len('처럼')}},
                            "question": {
                                "prompt": "하이라이트된 표현이 사용한 표현법으로 가장 적절한 것은?",
                                "choices": [{"id": "A", "text": options[0]}, {"id": "B", "text": options[1]}, {"id": "C", "text": options[2]}, {"id": "D", "text": options[3]}],
                                "answerId": ans_id,
                                "scoring": {"correctDeltaSec": 20, "wrongDeltaSec": -20, "eliminateWrongChoice": True},
                            },
                        }
                    )
                    concept_added = True

            # 문장 내용 확인(모든 문장)
            distractors = pick_distractors(sent_snip, para_snips[pi - 1])
            choices, ans_id = shuffled_choices(sent_snip, distractors)
            prompt = "하이라이트된 문장의 내용으로 알맞은 것은?" if not level_tag.startswith("SAUSSURE") else "하이라이트된 문장에서 알 수 있는 것은?"
            steps.append(
                {
                    "stepId": f"s{len(steps)+1}",
                    "highlight": {"paragraphId": pid, "range": {"start": sp["start"], "end": sp["end"]}},
                    "question": {
                        "prompt": prompt,
                        "choices": choices,
                        "answerId": ans_id,
                        "scoring": {"correctDeltaSec": 20, "wrongDeltaSec": -20, "eliminateWrongChoice": True},
                    },
                }
            )

        # 문단 중심 내용(문단 전체 하이라이트)
        para_txt = paragraphs[pi - 1]
        correct = truncate_choice(spans[0]["text"], max_len=90) if spans else truncate_choice(para_txt, max_len=90)
        other = []
        for pj, sps in enumerate(para_spans, 1):
            if pj == pi or not sps:
                continue
            other.append(truncate_choice(sps[0]["text"], max_len=90))
        distractors = pick_distractors(correct, other)
        choices, ans_id = shuffled_choices(correct, distractors)
        steps.append(
            {
                "stepId": f"s{len(steps)+1}",
                "highlight": {"paragraphId": pid, "range": {"start": 0, "end": len(para_txt)}},
                "question": {
                    "prompt": "이 문단의 중심 내용으로 가장 적절한 것은?",
                    "choices": choices,
                    "answerId": ans_id,
                    "scoring": {"correctDeltaSec": 20, "wrongDeltaSec": -20, "eliminateWrongChoice": True},
                },
            }
        )

    return steps


def build_recall(paragraphs):
    # Build 5~10 cards. Prefer paragraph-order cards.
    cards = []
    # Create base sentences per paragraph.
    for p in paragraphs:
        s = p.strip()
        if not s:
            continue
        cards.append(s[: min(len(s), 80)].strip())

    if len(cards) < 5:
        # Split long paragraphs into pseudo-cards.
        joined = " ".join(paragraphs)
        chunks = []
        step = max(1, len(joined) // 5)
        for i in range(0, len(joined), step):
            chunks.append(joined[i : i + step].strip())
            if len(chunks) >= 5:
                break
        cards = [c for c in chunks if c]

    if len(cards) > 10:
        # Keep first 10 for stability.
        cards = cards[:10]

    card_objs = []
    order = []
    for i, text in enumerate(cards, 1):
        cid = f"c{i}"
        card_objs.append({"id": cid, "text": text})
        order.append(cid)

    return {"cards": card_objs, "correctOrder": order, "seedPenalty": 1}


def build_confirm(paragraphs, level_tag: str):
    kw = pick_keyword(paragraphs)
    if not kw:
        kw = paragraphs[0][:2] if paragraphs and len(paragraphs[0]) >= 2 else ""
    ranges = find_ranges(paragraphs, kw)
    # Fallback: use first 2 chars from p1
    if not ranges and paragraphs:
        kw = paragraphs[0][:2]
        ranges = find_ranges(paragraphs, kw)
    prompt = f"지문에서 '{kw}'를 찾아 클릭하세요." if not level_tag.startswith("SAUSSURE") else f"지문에서 '{kw}'를 찾아 눌러 보세요."
    q = {
        "id": "q1",
        "prompt": prompt,
        "answerRanges": ranges[:20],
        "scoring": {"correctDeltaSec": 30, "wrongDeltaSec": -30},
        "revealOnWrong": True,
    }
    # Include match mode only when multiple ranges.
    if len(q["answerRanges"]) > 1:
        q["answerMatchMode"] = "ANY"
    return {"questions": [q]}


def load_nonfiction_sources():
    sources = []
    for path in sorted(NONFICTION_DIR.glob("*.json")):
        try:
            d = read_json(path)
        except Exception:
            continue
        text = d.get("passage_text") or ""
        if not isinstance(text, str) or len(text.strip()) < 200:
            continue
        text = normalize_text(text)
        text = _strip_md_escapes(text)
        for label, part in split_gana_parts(text):
            part2 = clean_sourced_passage(part)
            if len(part2) < 200:
                continue
            title = path.stem + (f" ({label})" if label else "")
            source_path = str(path) + (f"#part={label}" if label else "")
            sources.append(PassageSource("nonfiction", source_path, title, part2))
    return sources


def load_literature_sources():
    sources = []
    for path in sorted(LIT_DIR.glob("*.md")):
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        text = normalize_text(text)
        text = _strip_md_escapes(text)
        parts = split_gana_parts(text)
        for label, part in parts:
            part2 = clean_sourced_passage(part)
            if len(part2) < 200:
                continue
            title = path.stem + (f" ({label})" if label else "")
            source_path = str(path) + (f"#part={label}" if label else "")
            sources.append(PassageSource("literature", source_path, title, part2))
    return sources


def extract_pdf_passages(pdf_path: Path, min_len: int = 450):
    passages = []
    if not pdf_path.exists():
        return passages
    doc = fitz.open(pdf_path)
    for page_no in range(doc.page_count):
        page = doc.load_page(page_no)
        txt = page.get_text("text")
        txt = txt.replace("\r\n", "\n")
        # Remove common TOC noise
        lines = []
        for ln in txt.split("\n"):
            s = ln.strip()
            if not s:
                lines.append("")
                continue
            if s in {"문제편", "해설편", "학습체크"}:
                continue
            if re.fullmatch(r"p\.\d+", s):
                continue
            if s == "□":
                continue
            lines.append(s)
        cleaned = "\n".join(lines)
        cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned).strip()
        cleaned = normalize_text(cleaned)
        if len(cleaned) < min_len:
            continue
        # Heuristic: skip pages that are mostly numbers/TOC
        if cleaned.count("p.") > 8:
            continue
        cleaned = _strip_md_escapes(cleaned)
        parts = split_gana_parts(cleaned)
        min_len_part = max(250, int(min_len * 0.6))
        for label, part in parts:
            part2 = clean_sourced_passage(part)
            if len(part2) < min_len_part:
                continue
            title = f"{pdf_path.stem} p{page_no+1}" + (f" ({label})" if label else "")
            source_path = f"{pdf_path}#page={page_no+1}" + (f"#part={label}" if label else "")
            passages.append(PassageSource("pdf", source_path, title, part2))
    return passages


def make_schedule(type_counts: dict):
    # Interleave types to avoid long runs.
    remaining = dict(type_counts)
    schedule = []
    last = None
    types = list(remaining.keys())
    while sum(remaining.values()) > 0:
        # pick best type not equal last, with remaining highest
        candidates = sorted(types, key=lambda t: remaining[t], reverse=True)
        pick = None
        for t in candidates:
            if remaining[t] <= 0:
                continue
            if t != last:
                pick = t
                break
        if pick is None:
            pick = candidates[0]
        schedule.append(pick)
        remaining[pick] -= 1
        last = pick
    return schedule


def level_meta(level: str):
    if level.startswith("saussure"):
        n = int(level[-1])
        return {
            "targetLevel": f"SAUSSURE_{n}",
            "schoolGradeRange": {"min": n, "max": n},
            "code": f"s{n}",
        }
    if level.startswith("frege"):
        n = int(level[-1])
        grade = 3 + n
        return {
            "targetLevel": f"FREGE_{n}",
            "schoolGradeRange": {"min": grade, "max": grade},
            "code": f"f{n}",
        }
    if level.startswith("russell"):
        n = int(level[-1])
        grade = 6 + n
        return {
            "targetLevel": f"RUSSELL_{n}",
            "schoolGradeRange": {"min": grade, "max": grade},
            "code": f"r{n}",
        }
    if level.startswith("wittgenstein"):
        n = int(level[-1])
        grade = 9 + n
        return {
            "targetLevel": f"WITTGENSTEIN_{n}",
            "schoolGradeRange": {"min": grade, "max": grade},
            "code": f"w{n}",
        }
    raise ValueError(level)


def build_daily_reading(content_id: str, title: str, target_level: str, grade_range: dict, sub_area: str, source: PassageSource, passage_text: str):
    passage_text = clean_sourced_passage(passage_text)
    passage_text = strip_exam_headers(passage_text)

    paragraphs_raw = split_paragraphs(passage_text)
    # Ensure at least 2 paragraphs for better interaction.
    if len(paragraphs_raw) == 1 and len(paragraphs_raw[0]) > 240:
        t = paragraphs_raw[0]
        mid = len(t) // 2
        # split on nearest space
        split_at = t.rfind(" ", 0, mid)
        if split_at < 0:
            split_at = mid
        paragraphs_raw = [t[:split_at].strip(), t[split_at:].strip()]

    paragraph_objs = []
    for i, p in enumerate(paragraphs_raw, 1):
        paragraph_objs.append({"id": f"p{i}", "text": p})

    steps = build_intensive_steps([p["text"] for p in paragraph_objs], target_level, sub_area)
    recall = build_recall([p["text"] for p in paragraph_objs])
    confirm = build_confirm([p["text"] for p in paragraph_objs], target_level)

    return {
        "contentId": content_id,
        "contentType": "DAILY_READING",
        "version": 1,
        "status": "PUBLISHED",
        "title": title,
        "description": "일일 독해 - 정독·복기·확인",
        "targetLevel": target_level,
        "schoolGradeRange": grade_range,
        "area": "READING",
        "subArea": sub_area,
        "competencies": ["READING"],
        "tags": ["daily"],
        "access": {"mode": "FREE"},
        "seedReward": {"seedType": "WHEAT", "count": 3, "multiplier": 1},
        "timeLimitSec": 300,
        "assets": {},
        "payload": {
            "passage": {"format": "TEXT", "paragraphs": paragraph_objs},
            "intensive": {"timeline": steps},
            "recall": recall,
            "confirm": confirm,
        },
    }


def generate_all():
    nonfiction = load_nonfiction_sources()
    literature = load_literature_sources()
    pdf_sw = extract_pdf_passages(PDF_SPEECH_WRITING)
    pdf_grammar = extract_pdf_passages(PDF_GRAMMAR)

    if not nonfiction:
        raise SystemExit("No nonfiction sources loaded")
    if not literature:
        raise SystemExit("No literature sources loaded")

    print("sources:", "nonfiction", len(nonfiction), "literature", len(literature), "pdf_sw", len(pdf_sw), "pdf_grammar", len(pdf_grammar))

    # Pools with cycling indices
    idx_nf = 0
    idx_lit = 0
    idx_sw = 0
    idx_gr = 0

    index_path = DAILY_READING_DIR / "daily-reading_source_index.json"
    old_index = {}
    if index_path.exists():
        try:
            old_list = read_json(index_path)
            if isinstance(old_list, list):
                for e in old_list:
                    lv = e.get("level")
                    day = e.get("day")
                    if lv and day:
                        old_index[(lv, int(day))] = e
        except Exception:
            old_index = {}


    source_index = []

    levels = [
        "saussure1",
        "saussure2",
        "saussure3",
        "frege1",
        "frege2",
        "frege3",
        "russell1",
        "russell2",
        "russell3",
        "wittgenstein1",
        "wittgenstein2",
        "wittgenstein3",
    ]

    sa_f_targets = {
        "saussure1": 300,
        "saussure2": 400,
        "saussure3": 500,
        "frege1": 600,
        "frege2": 700,
        "frege3": 800,
    }

    for level in levels:
        meta = level_meta(level)
        target_level = meta["targetLevel"]
        grade_range = meta["schoolGradeRange"]
        code = meta["code"]

        # For elementary levels, prefer cleaned/filtered pools to avoid noisy labels/hanja/etc.
        nf_pool = nonfiction
        lit_pool = literature
        if level in sa_f_targets:
            tl = sa_f_targets[level]
            nf_pool = _build_elementary_pool(nonfiction, level, tl)
            lit_pool = _build_elementary_pool(literature, level, tl)

        if level.startswith("saussure") or level.startswith("frege"):
            counts = {"NONFICTION": 110, "LITERATURE": 110, "LIFE": 73, "USAGE": 72}
        elif level.startswith("russell"):
            counts = {"NONFICTION": 110, "LITERATURE": 110, "SPEECH": 36, "WRITING": 36, "GRAMMAR": 73}
        else:
            counts = {"NONFICTION": 146, "LITERATURE": 146, "SPEECH": 18, "WRITING": 18, "GRAMMAR": 37}

        schedule = make_schedule(counts)
        assert len(schedule) == 365

        level_dir = DAILY_READING_DIR / level
        level_dir.mkdir(parents=True, exist_ok=True)

        for day in range(1, 366):
            day_str = f"{day:03d}"
            out_path = level_dir / f"{day_str}.json"
            if out_path.exists() and level not in OVERWRITE_LEVELS:
                old = old_index.get((level, day))
                if old is None:
                    try:
                        existing = read_json(out_path)
                        old = {
                            "level": level,
                            "day": day,
                            "contentId": existing.get("contentId"),
                            "type": existing.get("subArea"),
                            "sourceType": "unknown",
                            "sourcePath": "",
                            "sourceTitle": "",
                        }
                    except Exception:
                        old = {
                            "level": level,
                            "day": day,
                            "contentId": None,
                            "type": None,
                            "sourceType": "unknown",
                            "sourcePath": "",
                            "sourceTitle": "",
                        }
                source_index.append(old)
                continue

            typ = schedule[day - 1]

            # pick a source and passage text
            if typ == "NONFICTION":
                src = nf_pool[idx_nf % len(nf_pool)]
                idx_nf += 1
                text = src.text
            elif typ == "LITERATURE":
                src = lit_pool[idx_lit % len(lit_pool)]
                idx_lit += 1
                text = src.text
            elif typ in {"SPEECH", "WRITING"}:
                src = pdf_sw[idx_sw % len(pdf_sw)] if pdf_sw else nonfiction[idx_nf % len(nonfiction)]
                idx_sw += 1
                text = src.text
            elif typ == "GRAMMAR":
                src = pdf_grammar[idx_gr % len(pdf_grammar)] if pdf_grammar else nonfiction[idx_nf % len(nonfiction)]
                idx_gr += 1
                text = src.text
            elif typ == "LIFE":
                src = PassageSource("generated", "generated://life", f"{level} day{day}", "")
                text = generate_life_text(level, day)
            elif typ == "USAGE":
                src = PassageSource("generated", "generated://usage", f"{level} day{day}", "")
                text = generate_usage_text(level, day)
            else:
                src = nonfiction[idx_nf % len(nonfiction)]
                idx_nf += 1
                text = src.text

            # Apply level-specific transformation
            if level in sa_f_targets:
                target_len = sa_f_targets[level]
                if typ in {"NONFICTION", "LITERATURE"}:
                    # Safety: even if we fell back to the original pool, still clean noisy markers.
                    text = _clean_source_text_for_elementary(text)
                    if level.startswith("saussure"):
                        text = _simplify_sentences_for_saussure(text)
                    # strip_exam_headers()는 build_daily_reading()에서도 실행되므로,
                    # 여기서 먼저 적용해 길이 보정/발췌 기준이 최종 지문과 일치하도록 한다.
                    text = strip_exam_headers(text)
                # Ensure enough material before excerpting (some poems/texts are short).
                if len(text) < int(target_len * 0.9):
                    if typ == "LITERATURE":
                        extra = lit_pool[idx_lit % len(lit_pool)].text
                        idx_lit += 1
                        text = text + "\n\n" + extra
                    elif typ == "NONFICTION":
                        extra = nf_pool[idx_nf % len(nf_pool)].text
                        idx_nf += 1
                        text = text + "\n\n" + extra
                text = excerpt_to_length(text, target_len)

            content_id = f"dr-{code}-{day_str}"
            title = {
                "NONFICTION": f"독해(비문학) Day {day}",
                "LITERATURE": f"독해(문학) Day {day}",
                "SPEECH": f"독해(화법) Day {day}",
                "WRITING": f"독해(작문) Day {day}",
                "GRAMMAR": f"독해(문법) Day {day}",
                "LIFE": f"독해(생활문) Day {day}",
                "USAGE": f"독해(어법) Day {day}",
            }.get(typ, f"일일 독해 Day {day}")

            data = build_daily_reading(
                content_id=content_id,
                title=title,
                target_level=target_level,
                grade_range=grade_range,
                sub_area=typ if typ not in {"LIFE", "USAGE"} else typ,
                source=src,
                passage_text=text,
            )

            write_json(out_path, data)

            source_index.append(
                {
                    "level": level,
                    "day": day,
                    "contentId": content_id,
                    "type": typ,
                    "sourceType": src.source_type,
                    "sourcePath": src.source_path,
                    "sourceTitle": src.title,
                }
            )

        print("generated", level)

    index_path = DAILY_READING_DIR / "daily-reading_source_index.json"
    write_json(index_path, source_index)
    print("wrote", index_path)


if __name__ == "__main__":
    random.seed(20260214)
    generate_all()





