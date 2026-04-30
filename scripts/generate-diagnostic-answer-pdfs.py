#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
generate-diagnostic-answer-pdfs.py
진단 테스트 4종(소쉬르/프레게/러셀/비트겐슈타인) 정답·해설 PDF 생성 (XeLaTeX, A4)

데이터 소스: docs/test-analysis/raw/{name}.json (over-escaped: \\\\ → \\ 한 단계 unescape 필요)
출력: generated/test-pdfs/diagnostic_{name}_answer.pdf

각 PDF 구성:
  - 헤더: 로고 + "진단 테스트 정답·해설 — {레벨}"
  - 영역(subDomain)별 그룹
  - 각 문항: 번호, 발문, 정답, 각 선택지 + 정답 표시 + error_path(오답 이유)
"""
from __future__ import annotations
import json, re, subprocess, sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
RAW_DIR = PROJECT_DIR / "docs" / "test-analysis" / "raw"
OUTPUT_DIR = PROJECT_DIR / "generated" / "test-pdfs"
LOGO_PATH = PROJECT_DIR / "frontend" / "public" / "korfarm-logo.png"
XELATEX = r"C:\Users\RENEWCOM PC\AppData\Local\Programs\MiKTeX\miktex\bin\x64\xelatex.exe"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

NAMES = [
    ("sohssure", "소쉬르 단계 진단 테스트"),
    ("frege", "프레게 단계 진단 테스트"),
    ("russell", "러셀 단계 진단 테스트"),
    ("wittgenstein", "비트겐슈타인 단계 진단 테스트"),
]

CHOICE_LABELS = {"A": "①", "B": "②", "C": "③", "D": "④", "E": "⑤"}


# ═══════════ 데이터 로드 ═══════════
def load_questions(name: str) -> list:
    """raw/{name}.json 로드 + over-escape 정정 → questions 리스트."""
    p = RAW_DIR / f"{name}.json"
    txt = p.read_text(encoding="utf-8")
    fixed = txt.replace(chr(92) * 2, chr(92))  # \\ → \
    data = json.loads(fixed)
    qs = data if isinstance(data, list) else data.get("questions", [])
    return qs


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


# ═══════════ LaTeX 본문 ═══════════
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
\definecolor{areaBg}{HTML}{F8F4E8}
\definecolor{areaBd}{HTML}{D0C8B0}
\definecolor{ansColor}{HTML}{B2241A}
\definecolor{correctGreen}{HTML}{2A8C3D}
\definecolor{wrongGray}{HTML}{888888}
\definecolor{expColor}{HTML}{2C3E50}
\definecolor{badgeBg}{HTML}{8B6914}

\setlength{\parindent}{0pt}
\setlength{\parskip}{2pt plus 1pt}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\fancyhead[L]{__HEADER_LEFT__}
\fancyhead[R]{\textcolor{gray}{\small p.\thepage}}
\fancyfoot[C]{\textcolor{gray}{\small \textcopyright\ 국어농장 V2 — 진단 테스트}}

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
  \par\vspace{2pt}%
}

% 문항 번호 + 발문
\newcommand{\qHead}[3]{%
  \par\needspace{4\baselineskip}\vspace{6pt}%
  \noindent\textbf{\large 문항 #1.}\hspace{4pt}%
  \textcolor{gray}{\small [#2점]}\par%
  \vspace{2pt}\noindent #3\par\vspace{2pt}%
}

% 정답 배지 (한 줄)
\newcommand{\correctBadge}[1]{%
  \par\noindent\colorbox{badgeBg}{\color{white}\strut\hspace{4pt}\textbf{정답}\hspace{4pt}}\hspace{6pt}%
  \textbf{\color{ansColor}#1}\par\vspace{2pt}%
}
"""


def make_header_left(level_label: str) -> str:
    logo = str(LOGO_PATH).replace("\\", "/")
    return (
        rf"\raisebox{{-4pt}}{{\includegraphics[height=18pt]{{{logo}}}}}\hspace{{6pt}}"
        rf"\textbf{{진단 테스트 정답 \& 해설}}\hspace{{6pt}}\textcolor{{gray}}{{{level_label}}}"
    )


def make_title_block(level_label: str) -> str:
    return rf"""\begin{{center}}
\vspace*{{-4pt}}
{{\Huge\bfseries\color{{korfarmBrown}} 진단 테스트 정답 \& 해설}}\\[4pt]
{{\large\color{{gray}} {latex_escape(level_label)}}}
\end{{center}}
\vspace{{6pt}}
"""


def render_choices_tex(choices: list, correct_id: str) -> str:
    """choicesJson 결과 list[{text, choice_id, error_path}]를 LaTeX로."""
    out = []
    for c in choices:
        cid = c.get("choice_id") or c.get("id") or ""
        label = CHOICE_LABELS.get(cid, cid or "·")
        text = c.get("text") or ""
        err = c.get("error_path") or ""
        is_correct = (cid == correct_id)
        # 색상 분기
        if is_correct:
            line = (
                rf"\noindent\hangindent=2.4em\hangafter=1"
                rf"\makebox[2.0em][l]{{\textbf{{\color{{correctGreen}}{label}}}}}"
                rf"\textbf{{\color{{correctGreen}}{render_inline(text)}}}"
            )
            if err and err.strip() not in ("정답", "정답 ", " 정답"):
                line += rf"\\ \hspace*{{2.4em}}{{\color{{expColor}}\small {render_inline(err)}}}"
        else:
            line = (
                rf"\noindent\hangindent=2.4em\hangafter=1"
                rf"\makebox[2.0em][l]{{{label}}}"
                rf"{{\color{{wrongGray}}{render_inline(text)}}}"
            )
            if err:
                line += rf"\\ \hspace*{{2.4em}}{{\color{{expColor}}\small {render_inline(err)}}}"
        out.append(line + r"\par\vspace{2pt}")
    return "\n".join(out)


def render_questions_tex(questions: list) -> str:
    # subDomain별 그룹핑
    by_area = {}
    area_seen = []
    for q in questions:
        area = q.get("subDomain") or q.get("domain") or "기타"
        if area not in by_area:
            by_area[area] = []
            area_seen.append(area)
        by_area[area].append(q)

    # 영역 우선순위 정렬
    AREA_ORDER = ["어휘", "문법", "어법", "개념", "문학", "비문학", "독서", "화법", "작문", "기타"]
    def k(a):
        try:
            return AREA_ORDER.index(a)
        except ValueError:
            return len(AREA_ORDER)
    areas = sorted(area_seen, key=k)

    body = []
    for area in areas:
        body.append(rf"\areaHead{{{latex_escape(area)}}}")
        # 문항 번호 정렬
        qs_sorted = sorted(by_area[area], key=lambda q: q.get("number", 0))
        for q in qs_sorted:
            num = q.get("number", "?")
            stem = q.get("stem", "")
            pts = q.get("points", "")
            qtype = q.get("type", "")
            correct = q.get("correctAnswer", "")
            # 발문
            body.append(rf"\qHead{{{num}}}{{{latex_escape(str(pts))}}}{{{render_inline(stem)}}}")
            # 정답 배지
            if correct:
                ans_label = CHOICE_LABELS.get(correct, correct)
                body.append(rf"\correctBadge{{{latex_escape(ans_label)}}}")
            # 객관식이면 선택지 + error_path
            if qtype == "객관식":
                cj_raw = q.get("choicesJson")
                if cj_raw:
                    try:
                        choices = json.loads(cj_raw)
                        body.append(render_choices_tex(choices, correct))
                    except Exception:
                        pass
            # 서술형이면 modelAnswer
            ma = q.get("modelAnswer", "")
            if ma:
                body.append(
                    r"\par\vspace{4pt}\noindent\textbf{[모범 답안]}\\"
                    + render_inline(ma) + r"\par"
                )
            # 해설 (choiceExplanationsJson 등이 있다면 추가)
            ce_raw = q.get("choiceExplanationsJson")
            if ce_raw:
                try:
                    expls = json.loads(ce_raw) if isinstance(ce_raw, str) else ce_raw
                    if expls:
                        body.append(r"\par\textbf{\small [선택지별 해설]}\\")
                        for k_, v_ in (expls.items() if isinstance(expls, dict) else []):
                            body.append(
                                rf"\noindent {latex_escape(k_)}: {render_inline(str(v_))}\par"
                            )
                except Exception:
                    pass
            body.append(r"\vspace{6pt}")
    return "\n".join(body)


def build_one(name: str, level_label: str) -> dict:
    questions = load_questions(name)
    if not questions:
        return {"name": name, "ok": False, "reason": "no questions"}
    preamble = PREAMBLE.replace("__HEADER_LEFT__", make_header_left(level_label))
    title = make_title_block(level_label)
    body = render_questions_tex(questions)
    tex = f"{preamble}\n\\begin{{document}}\n{title}\n{body}\n\\end{{document}}\n"
    tex_path = OUTPUT_DIR / f"diagnostic_{name}_answer.tex"
    tex_path.write_text(tex, encoding="utf-8")
    pdf_path = tex_path.with_suffix(".pdf")
    try:
        subprocess.run(
            [XELATEX, "-interaction=nonstopmode", "-halt-on-error", tex_path.name],
            cwd=tex_path.parent, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=180,
        )
    except subprocess.TimeoutExpired:
        return {"name": name, "ok": False, "reason": "timeout"}
    if pdf_path.exists() and pdf_path.stat().st_size > 0:
        return {"name": name, "ok": True, "pdf": str(pdf_path), "n_questions": len(questions)}
    # 에러 발췌
    log_path = tex_path.with_suffix(".log")
    excerpt = ""
    if log_path.exists():
        log = log_path.read_text(encoding="utf-8", errors="replace")
        m = re.search(r"^! .*", log, re.MULTILINE)
        if m:
            excerpt = log[m.start():m.start() + 400]
    return {"name": name, "ok": False, "reason": excerpt or "(no log)"}


def main():
    results = []
    for name, label in NAMES:
        print(f"[{name}] ", end="", flush=True)
        r = build_one(name, label)
        results.append(r)
        if r.get("ok"):
            print(f"OK ({r['n_questions']}문항) → {Path(r['pdf']).name}")
        else:
            print(f"FAIL: {r.get('reason', '')[:120]}")

    # 정리
    for pat in ["diagnostic_*_answer.aux", "diagnostic_*_answer.log",
                "diagnostic_*_answer.out", "diagnostic_*_answer.tex"]:
        for f in OUTPUT_DIR.glob(pat):
            try:
                f.unlink()
            except Exception:
                pass

    ok = sum(1 for r in results if r.get("ok"))
    print(f"\n=== 완료 === 성공 {ok}/{len(results)}")


if __name__ == "__main__":
    main()
