#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
generate-witt-test-pdfs.py
비트겐슈타인 1/2/3 챕터 테스트 시험지 PDF 60개 생성 (XeLaTeX, A4)

데이터 소스: 프로모드 원고/비트겐슈타인N/chMM/test.json
출력: generated/test-pdfs/wittgenstein{N}_ch{MM}.pdf

각 PDF 구성:
  - 헤더: 로고 + "비트겐슈타인 N권   M장 챕터 테스트"
  - 타이틀 박스 (총 문항/총 점수 표시)
  - 영역(section)별 그룹 — 문법, 문학, 비문학, 패턴 분석
  - 각 문항: 번호 + [점수], passage(있으면), stem, 선택지 5개
  - 정답·해설은 PDF에 미포함 (별도 정답·해설 PDF가 있음)
"""
from __future__ import annotations
import json, re, subprocess, sys, traceback
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
ORIG_DIR = PROJECT_DIR / "프로모드 원고"
OUTPUT_DIR = PROJECT_DIR / "generated" / "test-pdfs"
LOGO_PATH = PROJECT_DIR / "frontend" / "public" / "korfarm-logo.png"
XELATEX = r"C:\Users\RENEWCOM PC\AppData\Local\Programs\MiKTeX\miktex\bin\x64\xelatex.exe"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

LEVELS = [
    ("비트겐슈타인1", "wittgenstein1", "비트겐슈타인 1권"),
    ("비트겐슈타인2", "wittgenstein2", "비트겐슈타인 2권"),
    ("비트겐슈타인3", "wittgenstein3", "비트겐슈타인 3권"),
]

# section 정렬
SECTION_ORDER = ["문법", "문학", "비문학", "패턴 분석", "패턴분석", "기타"]


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
    return "".join(repl.get(ch, ch) for ch in s)


def render_inline(s: str) -> str:
    if s is None:
        return ""
    parts = str(s).split("\n")
    return r" \\ ".join(latex_escape(p) for p in parts)


def render_passage_block(text: str) -> str:
    """지문은 \par로 단락 구분, 한 단락 안 줄바꿈은 \\\\."""
    if not text:
        return ""
    text = str(text).strip()
    paras = re.split(r"\n\s*\n", text)
    out = []
    for p in paras:
        out.append(render_inline(p))
    return r"\par\smallskip ".join(out)


# ═══════════ LaTeX ═══════════
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

\definecolor{korfarmBrown}{HTML}{8B6914}
\definecolor{passageBg}{HTML}{F5F5F0}
\definecolor{passageBd}{HTML}{D0C8B0}
\definecolor{areaBg}{HTML}{F8F4E8}
\definecolor{areaBd}{HTML}{D0C8B0}
\definecolor{ptsBadge}{HTML}{6B7280}
\definecolor{numCircle}{HTML}{2C3E50}

\setlength{\parindent}{0pt}
\setlength{\parskip}{2pt plus 1pt}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\fancyhead[L]{__HEADER_LEFT__}
\fancyhead[R]{\textcolor{gray}{\small p.\thepage}}
\fancyfoot[C]{\textcolor{gray}{\small \textcopyright\ 국어농장 V2 — 챕터 테스트}}

\tcbset{
  passage/.style={
    enhanced, colback=passageBg, colframe=passageBd,
    boxrule=0.5pt, arc=3pt, left=8pt, right=8pt, top=6pt, bottom=6pt,
    breakable,
  },
}

% 영역 헤더
\newcommand{\areaHead}[1]{%
  \par\needspace{6\baselineskip}\vspace{4pt}%
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

% 문항 번호 + 점수 + 발문
\newcommand{\qHead}[3]{%
  \par\needspace{5\baselineskip}\vspace{4pt}%
  \noindent\textbf{\large #1.}\hspace{4pt}\textcolor{ptsBadge}{\small [#2점]}\par\vspace{2pt}%
  \noindent #3\par\vspace{2pt}%
}

% 선택지 한 줄
\newcommand{\choiceLine}[2]{%
  \par\noindent\hangindent=2.0em\hangafter=1%
  \makebox[1.8em][l]{#1}#2\par\vspace{1pt}%
}
"""


def make_header_left(level_label: str, ch: int) -> str:
    logo = str(LOGO_PATH).replace("\\", "/")
    return (
        rf"\raisebox{{-4pt}}{{\includegraphics[height=18pt]{{{logo}}}}}\hspace{{6pt}}"
        rf"\textbf{{{level_label}}}\hspace{{6pt}}\textcolor{{gray}}{{{ch}장 챕터 테스트}}"
    )


def make_title_block(level_label: str, ch: int, total_q: int, total_pts: int) -> str:
    return rf"""\begin{{center}}
\vspace*{{-4pt}}
{{\Huge\bfseries\color{{korfarmBrown}} {level_label}\quad {ch}장 챕터 테스트}}\\[6pt]
{{\large\color{{gray}} 총 {total_q}문항 \quad / \quad 총 {total_pts}점}}
\end{{center}}
\vspace{{6pt}}
"""


def render_question(q: dict, prev_passage: str | None, prev_passage_qs: list) -> tuple:
    """단일 문항 LaTeX 생성. 같은 passage가 이전과 동일하면 한 번만 출력.
    반환: (tex_string, this_passage)
    """
    num = q.get("number", "?")
    pts = q.get("points", "")
    stem = q.get("stem", "")
    passage = q.get("passage") or ""
    choices = q.get("choices") or []

    parts = []
    # passage가 이전 문항과 다르면 새로 출력
    if passage and passage != prev_passage:
        parts.append(r"\par\needspace{8\baselineskip}\smallskip")
        parts.append(r"\begin{tcolorbox}[passage]")
        parts.append(render_passage_block(passage))
        parts.append(r"\end{tcolorbox}")
        parts.append(r"\smallskip")

    # 발문
    parts.append(rf"\qHead{{{num}}}{{{latex_escape(str(pts))}}}{{{render_inline(stem)}}}")

    # 선택지
    for c in choices:
        cid = c.get("id") or ""
        text = c.get("text") or ""
        parts.append(rf"\choiceLine{{{latex_escape(cid)}}}{{{render_inline(text)}}}")

    parts.append(r"\vspace{4pt}")
    return "\n".join(parts), passage


def render_questions_tex(questions: list) -> str:
    """number 순서 유지. 영역(section)이 바뀌는 지점에서 영역 헤더 자동 삽입.
    같은 passage 연속이면 한 번만 출력."""
    qs = sorted(questions, key=lambda q: q.get("number", 0))
    body = []
    prev_section = None
    prev_passage = None
    for q in qs:
        sec = q.get("section") or "기타"
        if sec != prev_section:
            body.append(rf"\areaHead{{{latex_escape(sec)}}}")
            prev_section = sec
            prev_passage = None  # 영역이 바뀌면 passage도 재출력
        tex, prev_passage_new = render_question(q, prev_passage, qs)
        body.append(tex)
        prev_passage = prev_passage_new
    return "\n".join(body)


def build_tex(level_label: str, ch: int, data: dict) -> str:
    questions = data.get("questions") or []
    total_q = data.get("totalQuestions") or len(questions)
    total_pts = data.get("totalPoints") or sum(int(q.get("points", 0) or 0) for q in questions)
    preamble = PREAMBLE.replace("__HEADER_LEFT__", make_header_left(level_label, ch))
    title = make_title_block(level_label, ch, total_q, total_pts)
    body = render_questions_tex(questions)
    return f"{preamble}\n\\begin{{document}}\n{title}\n{body}\n\\end{{document}}\n"


# ═══════════ 컴파일 ═══════════
def compile_pdf(tex_path: Path) -> tuple:
    cwd = tex_path.parent
    try:
        subprocess.run(
            [XELATEX, "-interaction=nonstopmode", "-halt-on-error", tex_path.name],
            cwd=cwd, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=240,
        )
        pdf_path = tex_path.with_suffix(".pdf")
        if pdf_path.exists() and pdf_path.stat().st_size > 0:
            return True, ""
        log_path = tex_path.with_suffix(".log")
        excerpt = ""
        if log_path.exists():
            log = log_path.read_text(encoding="utf-8", errors="replace")
            m = re.search(r"^! .*", log, re.MULTILINE)
            if m:
                excerpt = log[m.start():m.start() + 400]
        return False, excerpt or "(no log)"
    except subprocess.TimeoutExpired:
        return False, "TIMEOUT"
    except Exception as e:
        return False, str(e)


def build_one(level_kr: str, level_out: str, level_label: str, ch: int) -> dict:
    test_path = ORIG_DIR / level_kr / f"ch{ch:02d}" / "test.json"
    if not test_path.exists():
        return {"level": level_kr, "ch": ch, "ok": False, "reason": f"missing {test_path.name}"}
    try:
        data = json.loads(test_path.read_text(encoding="utf-8"))
    except Exception as e:
        return {"level": level_kr, "ch": ch, "ok": False, "reason": f"JSON 파싱 실패: {e}"}
    tex = build_tex(level_label, ch, data)
    tex_path = OUTPUT_DIR / f"{level_out}_ch{ch:02d}.tex"
    tex_path.write_text(tex, encoding="utf-8")
    ok, excerpt = compile_pdf(tex_path)
    return {
        "level": level_kr, "ch": ch, "ok": ok,
        "pdf": str(tex_path.with_suffix(".pdf")) if ok else None,
        "n_q": len(data.get("questions") or []),
        "excerpt": excerpt if not ok else "",
    }


def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--level", help="비트겐슈타인1/2/3 중 하나")
    p.add_argument("--chapter", type=int)
    p.add_argument("--keep-tex", action="store_true")
    args = p.parse_args()

    targets = LEVELS
    if args.level:
        targets = [t for t in LEVELS if t[0] == args.level]
        if not targets:
            print(f"알 수 없는 레벨: {args.level}")
            sys.exit(2)

    results = []
    for level_kr, level_out, level_label in targets:
        chapters = [args.chapter] if args.chapter else range(1, 21)
        for ch in chapters:
            print(f"[{level_kr}] ch{ch:02d}", end=" ", flush=True)
            try:
                r = build_one(level_kr, level_out, level_label, ch)
            except Exception as e:
                traceback.print_exc()
                r = {"level": level_kr, "ch": ch, "ok": False, "reason": str(e)}
            results.append(r)
            if r.get("ok"):
                print(f"OK ({r['n_q']}문항)")
            else:
                print(f"FAIL: {(r.get('reason') or r.get('excerpt', ''))[:120]}")

    aux_globs = ["wittgenstein*_ch*.aux", "wittgenstein*_ch*.log",
                 "wittgenstein*_ch*.out", "wittgenstein*_ch*.fls", "wittgenstein*_ch*.fdb_latexmk"]
    if not args.keep_tex:
        aux_globs.append("wittgenstein*_ch*.tex")
    for pat in aux_globs:
        for f in OUTPUT_DIR.glob(pat):
            try:
                f.unlink()
            except Exception:
                pass

    ok = sum(1 for r in results if r.get("ok"))
    print(f"\n=== 완료 === 성공 {ok}/{len(results)}")
    if ok != len(results):
        for r in results:
            if not r.get("ok"):
                print(f"  FAIL [{r['level']} ch{r['ch']}]: {(r.get('reason') or r.get('excerpt',''))[:200]}")


if __name__ == "__main__":
    main()
