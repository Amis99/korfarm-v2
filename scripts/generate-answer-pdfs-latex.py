#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
generate-answer-pdfs-latex.py
프로모드 교재 정답·해설 PDF 일괄 생성기 (XeLaTeX, A4)

데이터 소스: 프로모드 원고/{레벨}/{챕터}.json (소/프/러)
            프로모드 원고/비트겐슈타인N/chMM/*.json (비트)

출력: generated/test-pdfs/{level}_ch{N}_answer.pdf

레벨군별 어댑터:
  - 소쉬르/프레게/러셀: meta + sections[]. answer_explain / model_answer 섹션 추출
  - 비트겐슈타인: 챕터 폴더 안 grammar/literature_NN/reading_NN/test 등 13파일 통합.
                  각 파일의 questions[*].answer + explanation 직접 추출.

사용:
  py -3 scripts/generate-answer-pdfs-latex.py                 # 전체 12레벨 빌드
  py -3 scripts/generate-answer-pdfs-latex.py --level 소쉬르1   # 한 레벨
  py -3 scripts/generate-answer-pdfs-latex.py --level 소쉬르1 --chapter 1
"""
from __future__ import annotations
import argparse, json, os, re, subprocess, sys, glob, traceback
from pathlib import Path

# ─── 경로 설정 ───
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
ORIG_DIR = PROJECT_DIR / "프로모드 원고"
OUTPUT_DIR = PROJECT_DIR / "generated" / "test-pdfs"
LOGO_PATH = PROJECT_DIR / "frontend" / "public" / "korfarm-logo.png"
XELATEX = r"C:\Users\RENEWCOM PC\AppData\Local\Programs\MiKTeX\miktex\bin\x64\xelatex.exe"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

LEVEL_LABELS = {
    "소쉬르1": "소쉬르 1권", "소쉬르2": "소쉬르 2권", "소쉬르3": "소쉬르 3권",
    "프레게1": "프레게 1권", "프레게2": "프레게 2권", "프레게3": "프레게 3권",
    "러셀1": "러셀 1권", "러셀2": "러셀 2권", "러셀3": "러셀 3권",
    "비트겐슈타인1": "비트겐슈타인 1권", "비트겐슈타인2": "비트겐슈타인 2권", "비트겐슈타인3": "비트겐슈타인 3권",
}
LEVEL_OUTKEY = {
    "소쉬르1": "saussure1", "소쉬르2": "saussure2", "소쉬르3": "saussure3",
    "프레게1": "frege1", "프레게2": "frege2", "프레게3": "frege3",
    "러셀1": "russell1", "러셀2": "russell2", "러셀3": "russell3",
    "비트겐슈타인1": "wittgenstein1", "비트겐슈타인2": "wittgenstein2", "비트겐슈타인3": "wittgenstein3",
}
ALL_LEVELS = list(LEVEL_LABELS.keys())

# 영역 표시 순서
AREA_ORDER = ["어휘", "문법", "어법", "개념", "문학", "비문학", "독서", "실력확인", "실력 확인", "기타"]

# subtype → 사람 친화 라벨
SUBTYPE_LABEL = {
    "객관식": "객관식", "OX": "OX 판정", "연결": "선 연결", "빈칸": "빈칸",
    "빈칸형": "빈칸", "괄호_선택형": "괄호 선택", "분석훈련": "분석 훈련",
    "분석_훈련": "분석 훈련", "어법_훈련": "어법 훈련", "지시어": "지시어 연결",
    "지시어_연결": "지시어 연결", "해설_문제": "해설 문제", "해설학습": "해설 학습",
    "해설_학습": "해설 학습", "문장독해": "문장 독해", "문장_독해": "문장 독해",
    "내용확인": "내용 확인", "내용_확인": "내용 확인", "구조도": "구조도",
    "정리표": "정리표", "어휘": "어휘", "글쓰기": "글쓰기", "서술형": "서술형",
}


# ═══════════ LaTeX 안전 변환 ═══════════
def latex_escape(s: str) -> str:
    if s is None:
        return ""
    s = str(s)
    repl = {
        "\\": r"\textbackslash{}",
        "{": r"\{", "}": r"\}",
        "&": r"\&", "%": r"\%", "$": r"\$",
        "#": r"\#", "_": r"\_", "^": r"\^{}",
        "~": r"\~{}",
    }
    out = []
    for ch in s:
        out.append(repl.get(ch, ch))
    return "".join(out)


def render_inline(s: str) -> str:
    """줄바꿈만 \\\\, 나머지는 escape"""
    if s is None:
        return ""
    s = str(s)
    parts = s.split("\n")
    return r" \\ ".join(latex_escape(p) for p in parts)


# ═══════════ 데이터 어댑터 ═══════════

def adapter_general(data: dict) -> list:
    """소쉬르/프레게/러셀 — meta+sections[] 형식.
    sections 중 answer_explain, model_answer만 추출. + activity 중 'items[*].answer'가 들어 있는 것도 답으로.

    반환: [{area, kind, subtype, items: [{ref, ans, exp, type}]}]
    """
    out = []
    sections = data.get("sections", [])
    for s in sections:
        if not isinstance(s, dict):
            continue
        t = s.get("type", "")
        if t not in ("answer_explain", "model_answer"):
            continue
        area = s.get("area") or "기타"
        subtype = s.get("subtype") or ""
        c = s.get("content", {}) or {}
        items_raw = c.get("items", []) if isinstance(c, dict) else []
        items = []
        for it in items_raw:
            if not isinstance(it, dict):
                continue
            ref = str(it.get("refId") or it.get("ref") or "")
            ans = it.get("answer")
            if ans is None:
                ans_list = it.get("answers")
                if isinstance(ans_list, list):
                    ans = ", ".join(str(x) for x in ans_list)
            if ans is None:
                ans = it.get("model_answer") or it.get("modelAnswer")
            exp = it.get("explanation") or ""
            items.append({"ref": ref, "ans": ans or "", "exp": exp})
        if items:
            out.append({
                "area": area,
                "kind": "모범 답안" if t == "model_answer" else "정답·해설",
                "subtype": subtype,
                "items": items,
            })
    return out


def adapter_wittgenstein(chapter_dir: Path) -> list:
    """비트겐슈타인 — 챕터 폴더 안 grammar.json / literature_NN.json / reading_NN.json / pattern.json / test.json 통합.
    각 파일 questions[*].answer + explanation 직접 사용.

    파일 처리 순서: index.json 있으면 그 순서, 없으면 파일명 정렬.
    """
    out = []
    files = sorted(chapter_dir.glob("*.json"))
    # index.json은 메타용으로 제외
    files = [f for f in files if f.name != "index.json"]

    for f in files:
        try:
            with open(f, encoding="utf-8") as fp:
                d = json.load(fp)
        except Exception as e:
            print(f"  [WARN] 로드 실패 {f.name}: {e}")
            continue
        # 파일 종류로 area 결정
        fname = f.stem  # ex: literature_01
        if fname.startswith("grammar"):
            area = "문법"
            section_label = "문법"
        elif fname.startswith("literature_"):
            idx = fname.split("_")[-1]
            area = "문학"
            section_label = f"문학 {idx}"
        elif fname.startswith("reading_"):
            idx = fname.split("_")[-1]
            area = "비문학"
            section_label = f"비문학 {idx}"
        elif fname.startswith("pattern"):
            area = "실력확인"
            section_label = "패턴 워크북"
        elif fname.startswith("test"):
            area = "실력확인"
            section_label = "테스트"
        else:
            area = "기타"
            section_label = fname

        # questions 추출
        qs_obj = d.get("questions") or {}
        if isinstance(qs_obj, dict):
            mc = qs_obj.get("multipleChoice") or []
            sa = qs_obj.get("shortAnswer") or qs_obj.get("서술형") or []
            all_qs = list(mc) + list(sa)
        elif isinstance(qs_obj, list):
            all_qs = qs_obj
        else:
            all_qs = []

        items = []
        for q in all_qs:
            if not isinstance(q, dict):
                continue
            ref = str(q.get("number") or q.get("Lcode") or q.get("Rcode") or "")
            ans = q.get("answer") or ""
            exp = q.get("explanation") or ""
            items.append({"ref": ref, "ans": str(ans), "exp": str(exp)})
        if items:
            out.append({
                "area": area,
                "kind": "정답·해설",
                "subtype": section_label,
                "items": items,
            })
    return out


# ═══════════ 영역별 정렬 ═══════════
def sort_by_area(records: list) -> list:
    def area_key(r):
        try:
            return AREA_ORDER.index(r["area"])
        except ValueError:
            return len(AREA_ORDER)
    return sorted(records, key=area_key)


# ═══════════ LaTeX 생성 ═══════════
PREAMBLE = r"""\documentclass[11pt,a4paper]{article}
\usepackage{fontspec}
\usepackage{xeCJK}
\xeCJKsetup{CJKspace=true}
\setCJKmainfont{Noto Sans KR}[
  Path=C:/Windows/Fonts/, Extension=.ttf,
  UprightFont=NotoSansKR-VF, BoldFont=NotoSansKR-VF,
  UprightFeatures={RawFeature={axis={wght=400}}},
  BoldFeatures={RawFeature={axis={wght=700}}},
]
\setCJKsansfont{Noto Sans KR}[
  Path=C:/Windows/Fonts/, Extension=.ttf,
  UprightFont=NotoSansKR-VF, BoldFont=NotoSansKR-VF,
  UprightFeatures={RawFeature={axis={wght=400}}},
  BoldFeatures={RawFeature={axis={wght=700}}},
]
\setmainfont{Noto Sans KR}[
  Path=C:/Windows/Fonts/, Extension=.ttf,
  UprightFont=NotoSansKR-VF, BoldFont=NotoSansKR-VF,
  UprightFeatures={RawFeature={axis={wght=400}}},
  BoldFeatures={RawFeature={axis={wght=700}}},
]
\usepackage[a4paper, margin=1.8cm, top=2.6cm, bottom=2cm, heightrounded]{geometry}
\usepackage{graphicx}
\usepackage{fancyhdr}
\usepackage{xcolor}
\usepackage[most]{tcolorbox}
\usepackage{enumitem}
\usepackage{setspace}
\usepackage{needspace}
\usepackage{etoolbox}

\definecolor{korfarmBrown}{HTML}{8B6914}
\definecolor{areaBg}{HTML}{F8F4E8}
\definecolor{areaBd}{HTML}{D0C8B0}
\definecolor{ansColor}{HTML}{B2241A}
\definecolor{expColor}{HTML}{2C3E50}
\definecolor{kindBadgeBg}{HTML}{8B6914}
\definecolor{subtypeMute}{HTML}{777777}

\setlength{\parindent}{0pt}
\setlength{\parskip}{2pt plus 1pt}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\fancyhead[L]{%
  __HEADER_LEFT__%
}
\fancyhead[R]{\textcolor{gray}{\small p.\thepage}}
\fancyfoot[C]{\textcolor{gray}{\small \textcopyright\ 국어농장 V2}}

% 영역 헤더
\newcommand{\areaHead}[1]{%
  \par\needspace{6\baselineskip}%
  \vspace{4pt}%
  \begin{tcolorbox}[
    enhanced, colback=areaBg, colframe=areaBd,
    boxrule=0.6pt, arc=4pt, sharp corners=southeast,
    left=10pt, right=10pt, top=4pt, bottom=4pt,
    fontupper=\bfseries\Large\color{korfarmBrown},
  ]
  영역 #1
  \end{tcolorbox}
  \par\vspace{4pt}%
}

% 종류 배지 (정답·해설 / 모범답안)
\newcommand{\kindBadge}[2]{%
  \par\needspace{4\baselineskip}%
  \noindent\colorbox{kindBadgeBg}{\color{white}\strut\hspace{4pt}\textbf{#1}\hspace{4pt}}\hspace{6pt}{\color{subtypeMute}\small #2}\par\vspace{2pt}%
}

% 답·해설 한 항목
\newcommand{\ansItem}[3]{%
  \par\noindent\hangindent=2.4em\hangafter=1%
  \makebox[2.0em][l]{\textbf{\color{ansColor}#1}}%
  \textbf{#2}%
  \ifx\relax#3\relax\else\\ \hspace*{2.4em}{\color{expColor}\small #3}\fi%
  \par\vspace{2pt}%
}
"""


def make_header_left(level_label: str, ch: int) -> str:
    logo = str(LOGO_PATH).replace("\\", "/")
    return (
        rf"\raisebox{{-4pt}}{{\includegraphics[height=18pt]{{{logo}}}}}\hspace{{6pt}}"
        rf"\textbf{{{level_label}}}\hspace{{6pt}}\textcolor{{gray}}{{{ch}장 정답 \& 해설}}"
    )


def make_title_block(level_label: str, ch: int, ch_title: str = "") -> str:
    # title의 .md 확장자 제거
    if ch_title:
        ch_title = re.sub(r"\.(md|json)$", "", ch_title.strip())
    title_extra = f"\\\\ \\large\\color{{gray}}{latex_escape(ch_title)}" if ch_title else ""
    return rf"""\begin{{center}}
\vspace*{{-6pt}}
{{\Huge\bfseries\color{{korfarmBrown}} {level_label}\quad {ch}장 정답 \& 해설}}{title_extra}
\end{{center}}
\vspace{{6pt}}
"""


def render_records_tex(records: list) -> str:
    """records를 area로 묶어 LaTeX 본문 생성."""
    by_area = {}
    area_order_seen = []
    for r in records:
        a = r["area"]
        if a not in by_area:
            by_area[a] = []
            area_order_seen.append(a)
    # AREA_ORDER 우선 정렬
    def k(a):
        try:
            return AREA_ORDER.index(a)
        except ValueError:
            return len(AREA_ORDER)
    areas = sorted(area_order_seen, key=k)

    for r in records:
        by_area[r["area"]].append(r)

    body = []
    for a in areas:
        body.append(rf"\areaHead{{{latex_escape(a)}}}")
        for rec in by_area[a]:
            sub = SUBTYPE_LABEL.get(rec["subtype"], rec["subtype"]) if rec["subtype"] else ""
            body.append(rf"\kindBadge{{{latex_escape(rec['kind'])}}}{{{latex_escape(sub)}}}")
            for it in rec["items"]:
                ref = it.get("ref") or ""
                ans = it.get("ans") or ""
                exp = it.get("exp") or ""
                # ref display
                ref_disp = ref if ref else "•"
                body.append(rf"\ansItem{{{latex_escape(ref_disp)}}}{{{render_inline(ans)}}}{{{render_inline(exp)}}}")
            body.append(r"\vspace{4pt}")
    return "\n".join(body)


def build_tex(level: str, ch: int, records: list, ch_title: str = "") -> str:
    label = LEVEL_LABELS[level]
    preamble = PREAMBLE.replace("__HEADER_LEFT__", make_header_left(label, ch))
    title = make_title_block(label, ch, ch_title)
    body = render_records_tex(records)
    return f"{preamble}\n\\begin{{document}}\n{title}\n{body}\n\\end{{document}}\n"


# ═══════════ 챕터 데이터 로드 ═══════════
def load_chapter(level: str, ch: int) -> tuple:
    """챕터 데이터 로드 → (records, title)."""
    is_witt = level.startswith("비트겐슈타인")
    if is_witt:
        ch_dir = ORIG_DIR / level / f"ch{ch:02d}"
        if not ch_dir.exists():
            return [], ""
        records = adapter_wittgenstein(ch_dir)
        # title 추출 (index.json 또는 grammar.json)
        title = ""
        idx_p = ch_dir / "index.json"
        if idx_p.exists():
            try:
                title = json.loads(idx_p.read_text(encoding="utf-8")).get("title") or ""
            except Exception:
                pass
        return records, title
    else:
        # 소쉬르/프레게/러셀: "{level}/{level} (챕터N).json" 또는 "{level}(챕터N).json" (공백 유무 변종 모두 시도)
        candidates = [
            ORIG_DIR / level / f"{level} (챕터{ch}).json",
            ORIG_DIR / level / f"{level}(챕터{ch}).json",
        ]
        f = next((p for p in candidates if p.exists()), None)
        if not f:
            return [], ""
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"  [WARN] JSON 파싱 실패 {f.name}: {e}")
            return [], ""
        records = adapter_general(data)
        title = (data.get("meta", {}) or {}).get("title", "") or ""
        return records, title


# ═══════════ XeLaTeX 컴파일 ═══════════
def compile_pdf(tex_path: Path) -> tuple:
    """tex → pdf. 실패 시 (False, log_excerpt)."""
    cwd = tex_path.parent
    try:
        # XeLaTeX 1회 (정답·해설은 cross-ref 거의 없음)
        result = subprocess.run(
            [XELATEX, "-interaction=nonstopmode", "-halt-on-error", tex_path.name],
            cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace",
            timeout=180,
        )
        pdf_path = tex_path.with_suffix(".pdf")
        if pdf_path.exists() and pdf_path.stat().st_size > 0:
            return True, ""
        # 에러 발췌
        log_path = tex_path.with_suffix(".log")
        excerpt = ""
        if log_path.exists():
            log = log_path.read_text(encoding="utf-8", errors="replace")
            m = re.search(r"^! .*", log, re.MULTILINE)
            if m:
                excerpt = log[m.start():m.start() + 500]
        return False, excerpt or (result.stdout[-500:] if result.stdout else "(no log)")
    except subprocess.TimeoutExpired:
        return False, "TIMEOUT"
    except Exception as e:
        return False, str(e)


# ═══════════ 단일 챕터 빌드 ═══════════
def build_one(level: str, ch: int) -> dict:
    records, title = load_chapter(level, ch)
    if not records:
        return {"level": level, "ch": ch, "ok": False, "reason": "no answer records"}
    tex = build_tex(level, ch, records, title)
    out_key = LEVEL_OUTKEY[level]
    tex_path = OUTPUT_DIR / f"{out_key}_ch{ch:02d}_answer.tex"
    tex_path.write_text(tex, encoding="utf-8")
    ok, excerpt = compile_pdf(tex_path)
    pdf_path = tex_path.with_suffix(".pdf")
    return {
        "level": level, "ch": ch, "ok": ok,
        "pdf": str(pdf_path) if ok else None,
        "tex": str(tex_path),
        "excerpt": excerpt if not ok else "",
        "n_records": len(records),
        "n_items": sum(len(r["items"]) for r in records),
    }


# ═══════════ 메인 ═══════════
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--level", help="특정 레벨만 (예: 소쉬르1)")
    parser.add_argument("--chapter", type=int, help="특정 챕터만 (예: 1)")
    parser.add_argument("--keep-tex", action="store_true", help="TeX 파일 유지")
    args = parser.parse_args()

    levels = [args.level] if args.level else ALL_LEVELS
    if args.level and args.level not in LEVEL_LABELS:
        print(f"알 수 없는 레벨: {args.level}")
        sys.exit(2)

    results = []
    for level in levels:
        chapters = [args.chapter] if args.chapter else range(1, 21)
        for ch in chapters:
            print(f"[{level}] ch{ch:02d}", end=" ", flush=True)
            try:
                r = build_one(level, ch)
            except Exception as e:
                traceback.print_exc()
                r = {"level": level, "ch": ch, "ok": False, "reason": str(e)}
            results.append(r)
            if r.get("ok"):
                print(f"OK ({r['n_records']} 그룹 / {r['n_items']} 항목)")
            else:
                why = r.get("reason") or r.get("excerpt", "")[:140]
                print(f"FAIL: {why}")

    # 정리: 임시 파일(.aux, .log) 삭제, .tex는 옵션
    aux_globs = ["*.aux", "*.log", "*.out", "*.fls", "*.fdb_latexmk"]
    if not args.keep_tex:
        aux_globs.append("*_answer.tex")
    for pat in aux_globs:
        for f in OUTPUT_DIR.glob(pat):
            try:
                f.unlink()
            except Exception:
                pass

    # 요약
    ok = sum(1 for r in results if r.get("ok"))
    fail = len(results) - ok
    print(f"\n=== 빌드 완료 ===")
    print(f"  성공 {ok} / 실패 {fail} / 총 {len(results)}")
    if fail:
        print("\n실패 내역:")
        for r in results:
            if not r.get("ok"):
                print(f"  [{r['level']} ch{r['ch']}] {r.get('reason') or r.get('excerpt', '')[:160]}")


if __name__ == "__main__":
    main()
