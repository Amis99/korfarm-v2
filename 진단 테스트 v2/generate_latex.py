#!/usr/bin/env python3
"""
국어농장 진단 테스트 LaTeX 시험지 생성기
JSON 데이터를 읽어 XeLaTeX 소스 파일을 자동 생성한다.
"""

import json
import os
import re
import glob as globmod

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 레벨별 설정
LEVEL_CONFIG = {
    "sohssure": {
        "korean_name": "소쉬르",
        "target": "초등 저학년 (1~3학년)",
        "body_size": "12pt",
        "passage_size": "11.5pt",
        "line_spread": "1.8",
        "num_choices": 3,
    },
    "frege": {
        "korean_name": "프레게",
        "target": "초등 고학년 (4~6학년)",
        "body_size": "11pt",
        "passage_size": "10.5pt",
        "line_spread": "1.7",
        "num_choices": 5,
    },
    "russell": {
        "korean_name": "러셀",
        "target": "중학생 (7~9학년)",
        "body_size": "10pt",
        "passage_size": "9.5pt",
        "line_spread": "1.6",
        "num_choices": 5,
    },
    "wittgenstein": {
        "korean_name": "비트겐슈타인",
        "target": "고등학생 (10~12학년)",
        "body_size": "9.5pt",
        "passage_size": "9pt",
        "line_spread": "1.55",
        "num_choices": 5,
    },
}

CHOICE_CIRCLES = {
    "A": "①",
    "B": "②",
    "C": "③",
    "D": "④",
    "E": "⑤",
}


def escape_latex(text: str) -> str:
    """LaTeX 특수문자 이스케이프. 유니코드 원문자/고어 문자는 그대로 유지."""
    if not text:
        return ""
    # 순서 중요: backslash를 먼저 처리
    text = text.replace("\\", "\\textbackslash{}")
    for ch in ["&", "%", "$", "#", "_", "{", "}"]:
        text = text.replace(ch, "\\" + ch)
    text = text.replace("~", "\\textasciitilde{}")
    text = text.replace("^", "\\textasciicircum{}")
    return text


def md_bold_to_latex(text: str) -> str:
    """마크다운 **bold** → \\textbf{bold} 변환. 이스케이프 전에 호출."""
    return re.sub(r"\*\*(.+?)\*\*", r"\\textbf{\1}", text)


def process_text(text: str) -> str:
    """텍스트 처리 파이프라인: md→latex 변환 후 이스케이프."""
    if not text:
        return ""
    # 먼저 bold 처리 (** 마크를 제거하고 \textbf로)
    # bold 안의 내용도 이스케이프해야 하므로 단계적으로 처리
    parts = re.split(r"(\*\*.+?\*\*)", text)
    result = []
    for part in parts:
        m = re.match(r"^\*\*(.+?)\*\*$", part)
        if m:
            result.append("\\textbf{" + escape_latex(m.group(1)) + "}")
        else:
            result.append(escape_latex(part))
    return "".join(result)


def process_passage_text(text: str) -> str:
    """지문 텍스트 처리. 줄바꿈을 LaTeX 줄바꿈으로 변환."""
    lines = text.strip().split("\n")
    processed = []
    for line in lines:
        line = line.rstrip()
        if line == "":
            processed.append("")  # 빈 줄은 단락 구분
        else:
            processed.append(process_text(line))

    # 빈 줄을 \\[0.5em]으로, 일반 줄바꿈을 \\로 변환
    result_lines = []
    for i, line in enumerate(processed):
        if line == "":
            result_lines.append("\\\\[0.5em]")
        else:
            if i < len(processed) - 1 and processed[i + 1] != "":
                result_lines.append(line + " \\\\")
            else:
                result_lines.append(line)
    return "\n".join(result_lines)


def load_config():
    with open(os.path.join(BASE_DIR, "config.json"), "r", encoding="utf-8") as f:
        return json.load(f)


def load_passage_data(passage_dir: str):
    """지문 디렉토리에서 metadata, passage text, questions를 로드."""
    full_path = os.path.join(BASE_DIR, passage_dir)

    with open(os.path.join(full_path, "metadata.json"), "r", encoding="utf-8") as f:
        metadata = json.load(f)

    with open(os.path.join(full_path, "passage.md"), "r", encoding="utf-8") as f:
        passage_text = f.read()

    questions = []
    q_dir = os.path.join(full_path, "questions")
    q_files = sorted(globmod.glob(os.path.join(q_dir, "*.json")))
    for qf in q_files:
        with open(qf, "r", encoding="utf-8") as f:
            questions.append(json.load(f))

    return {
        "metadata": metadata,
        "passage_text": passage_text,
        "questions": questions,
    }


def load_all_passages(test_info: dict):
    """테스트의 모든 지문 데이터를 로드."""
    passages = []
    for p_dir in test_info["passages"]:
        passages.append(load_passage_data(p_dir))
    return passages


def generate_preamble(test_name: str) -> str:
    """레벨별 LaTeX 프리앰블 생성."""
    cfg = LEVEL_CONFIG[test_name]
    # XeLaTeX에서 유효한 documentclass 크기: 10pt, 11pt, 12pt
    # 9.5pt 등은 fontsize로 직접 설정
    doc_size = cfg["body_size"]
    if doc_size not in ("10pt", "11pt", "12pt"):
        doc_class_size = "10pt"
    else:
        doc_class_size = doc_size

    return rf"""\documentclass[{doc_class_size}, a4paper]{{article}}

% === 인코딩 & 폰트 ===
\usepackage{{fontspec}}
\setmainfont{{Noto Sans KR Medium}}[
  BoldFont=Noto Sans KR Bold,
  Script=Hangul,
  Renderer=HarfBuzz
]
\setsansfont{{Noto Sans KR Medium}}[
  BoldFont=Noto Sans KR Bold,
  Script=Hangul,
  Renderer=HarfBuzz
]

% === 레이아웃 ===
\usepackage[top=20mm, bottom=20mm, left=15mm, right=15mm]{{geometry}}
\usepackage{{multicol}}
\setlength{{\columnsep}}{{8mm}}
\setlength{{\columnseprule}}{{0.4pt}}

% === 색상 ===
\usepackage[dvipsnames]{{xcolor}}
\definecolor{{accentbrown}}{{HTML}}{{8B6914}}
\definecolor{{passagebg}}{{gray}}{{0.95}}

% === 그래픽 ===
\usepackage{{graphicx}}
\usepackage{{tikz}}

% === 기타 패키지 ===
\usepackage{{enumitem}}
\usepackage{{tcolorbox}}
\tcbuselibrary{{breakable, skins}}
\usepackage{{tabularx}}
\usepackage{{booktabs}}
\usepackage{{fancyhdr}}
\usepackage{{lastpage}}
\usepackage{{setspace}}

% === 폰트 크기 재설정 (레벨별) ===
\makeatletter
\renewcommand{{\normalsize}}{{\@setfontsize\normalsize{{{cfg["body_size"].replace("pt", "")}pt}}{{%
  {float(cfg["body_size"].replace("pt", "")) * float(cfg["line_spread"]):.1f}pt}}}}
\makeatother
\normalsize

% === 행간 ===
\linespread{{{cfg["line_spread"]}}}

% === 지문 폰트 크기 ===
\newcommand{{\passagefontsize}}{{\fontsize{{{cfg["passage_size"].replace("pt", "")}pt}}}{{%
  {float(cfg["passage_size"].replace("pt", "")) * float(cfg["line_spread"]):.1f}pt}}\selectfont}}

% === 지문 박스 스타일 ===
\newtcolorbox{{passagebox}}[1][]{{
  enhanced,
  breakable,
  colback=passagebg,
  colframe=black!30,
  boxrule=0.3pt,
  left=4mm,
  right=3mm,
  top=2mm,
  bottom=2mm,
  borderline west={{2pt}}{{0pt}}{{accentbrown}},
  fontupper=\passagefontsize,
  before upper={{\setstretch{{{cfg["line_spread"]}}}}},
  #1
}}

% === 보기 박스 스타일 ===
\newtcolorbox{{boxibox}}[1][]{{
  enhanced,
  colback=white,
  colframe=black!50,
  boxrule=0.4pt,
  left=3mm,
  right=3mm,
  top=1.5mm,
  bottom=1.5mm,
  #1
}}

% === 페이지 번호 ===
\pagestyle{{fancy}}
\fancyhf{{}}
\renewcommand{{\headrulewidth}}{{0pt}}
\fancyfoot[C]{{\small \thepage~/~\pageref{{LastPage}}}}

% === 하이픈 방지 ===
\tolerance=1
\emergencystretch=\maxdimen
\hyphenpenalty=10000
\hbadness=10000

\begin{{document}}
"""


def generate_header(test_name: str) -> str:
    """헤더: 로고 + 타이틀 + 학교/학년/이름."""
    cfg = LEVEL_CONFIG[test_name]
    return rf"""
% === 헤더 ===
\noindent
\begin{{minipage}}{{0.12\textwidth}}
\includegraphics[height=1.5cm]{{korfarm-logo.png}}
\end{{minipage}}%
\hfill
\begin{{minipage}}{{0.85\textwidth}}
\raggedright
{{\Large\bfseries 국어농장 진단 평가 --- {cfg["korean_name"]}}} \\[2pt]
{{\small {cfg["target"]}}}
\end{{minipage}}

\vspace{{3mm}}
\noindent
\begin{{tabularx}}{{\textwidth}}{{@{{}}X X X@{{}}}}
학교: \hrulefill & 학년: \hrulefill & 이름: \hrulefill
\end{{tabularx}}

\vspace{{1mm}}
\noindent\rule{{\textwidth}}{{1.2pt}}
\vspace{{3mm}}

\begin{{multicols}}{{2}}
"""


def format_passage(passage_data: dict, idx: int) -> str:
    """지문 박스 포맷."""
    metadata = passage_data["metadata"]
    genre = metadata["genre"]
    passage_text = passage_data["passage_text"]

    genre_label = "문학 지문" if genre == "문학" else "비문학 지문"
    header = f"[{idx}] {genre_label}"

    processed = process_passage_text(passage_text)

    return rf"""
\vspace{{2mm}}
\noindent{{\bfseries\small {process_text(header)}}}
\vspace{{1mm}}

\begin{{passagebox}}
{processed}
\end{{passagebox}}
\vspace{{2mm}}
"""


def is_short_choices(choices: list) -> bool:
    """선택지 텍스트가 짧은지 판단 (가로 배열 여부)."""
    max_len = max(len(c["text"]) for c in choices)
    return max_len <= 15


def format_question(q_json: dict, q_number: int, test_name: str) -> str:
    """문항 포맷 (객관식/서술형)."""
    q = q_json["question"]
    stem = process_text(q["stem"])
    q_type = q.get("type", "")
    is_descriptive = q_type == "서술형"

    parts = []
    parts.append(r"\noindent\begin{minipage}{\columnwidth}")
    parts.append(rf"\vspace{{2mm}}")
    parts.append(rf"\noindent{{\bfseries {q_number}.}} {stem}")
    parts.append("")

    # 보기 박스
    if "box" in q and q["box"]:
        box_text = process_text(q["box"])
        # <보기> 제목 추출 및 본문 분리
        box_lines = box_text.split("\\n") if "\\n" in q["box"] else q["box"].split("\n")
        parts.append(r"\vspace{1mm}")
        parts.append(r"\begin{boxibox}[title={\small\bfseries <보기>}]")
        for bl in box_lines:
            bl = bl.strip()
            if bl and bl != "<보기>":
                parts.append(process_text(bl) + r" \\")
        parts.append(r"\end{boxibox}")
        parts.append(r"\vspace{1mm}")
        parts.append("")

    if is_descriptive:
        # 서술형 답안 작성란
        parts.append(r"\vspace{2mm}")
        parts.append(r"\noindent\hrulefill")
        parts.append(r"\vspace{1mm}")
        parts.append(r"\noindent\hrulefill")
        parts.append(r"\vspace{1mm}")
        parts.append(r"\noindent\hrulefill")
        parts.append(r"\vspace{2mm}")
    else:
        # 객관식 선택지
        choices = q_json.get("choices", [])
        short = is_short_choices(choices)

        if short and len(choices) <= 5:
            # 가로 배열
            parts.append(r"\vspace{1mm}")
            parts.append(r"\noindent")
            choice_strs = []
            for c in choices:
                cid = c["choice_id"]
                circle = CHOICE_CIRCLES.get(cid, cid)
                choice_strs.append(f"{circle} {process_text(c['text'])}")
            parts.append("\\hspace{1em}".join(choice_strs))
            parts.append("")
        else:
            # 세로 배열
            parts.append(r"\vspace{1mm}")
            parts.append(r"\begin{enumerate}[label={}, leftmargin=1.5em, itemsep=0pt, parsep=0pt]")
            for c in choices:
                cid = c["choice_id"]
                circle = CHOICE_CIRCLES.get(cid, cid)
                parts.append(rf"\item {circle} {process_text(c['text'])}")
            parts.append(r"\end{enumerate}")

    parts.append(r"\vspace{2mm}")
    parts.append(r"\end{minipage}")
    parts.append(r"\par")
    parts.append("")

    return "\n".join(parts)


def format_answer_key(passages: list, test_name: str) -> str:
    """정답표 생성."""
    parts = []
    parts.append(r"\end{multicols}")
    parts.append(r"\newpage")
    parts.append(r"")
    parts.append(r"\noindent{\Large\bfseries 정답표}")
    parts.append(r"\vspace{3mm}")
    parts.append(r"\noindent\rule{\textwidth}{0.8pt}")
    parts.append(r"\vspace{3mm}")
    parts.append(r"")

    q_global = 0
    has_descriptive = False
    descriptive_answers = []

    # 객관식 정답 격자
    parts.append(r"\noindent{\bfseries 객관식 정답}")
    parts.append(r"\vspace{2mm}")
    parts.append(r"")

    # 실제 데이터에서 최대 선택지 수 결정
    num_choices = 0
    for pdata in passages:
        for q in pdata["questions"]:
            if "choices" in q and q["choices"]:
                num_choices = max(num_choices, len(q["choices"]))
    if num_choices == 0:
        num_choices = 5
    # 테이블 헤더
    choice_headers = " & ".join(
        [CHOICE_CIRCLES[chr(65 + i)] for i in range(num_choices)]
    )
    col_spec = "c|c|" + "|".join(["c"] * num_choices)

    parts.append(rf"\begin{{tabularx}}{{\textwidth}}{{|{col_spec}|}}")
    parts.append(r"\hline")
    parts.append(rf"\textbf{{지문}} & \textbf{{번호}} & {choice_headers} \\")
    parts.append(r"\hline")

    for p_idx, pdata in enumerate(passages, 1):
        genre = pdata["metadata"]["genre"]
        genre_short = "문" if genre == "문학" else "비"

        for q in pdata["questions"]:
            q_global += 1
            q_type = q["question"].get("type", "")

            if q_type == "서술형":
                has_descriptive = True
                descriptive_answers.append(
                    {
                        "number": q_global,
                        "passage": p_idx,
                        "model_answer": q.get("model_answer", ""),
                    }
                )
                # 정답 격자에서 서술형은 빈칸
                empty_cells = " & ".join(["--"] * num_choices)
                parts.append(
                    rf"[{p_idx}]{genre_short} & {q_global} & {empty_cells} \\"
                )
            else:
                correct = q.get("correct_choice", "")
                cells = []
                for i in range(num_choices):
                    letter = chr(65 + i)
                    if letter == correct:
                        cells.append(r"\textbf{O}")
                    else:
                        cells.append("")
                row_cells = " & ".join(cells)
                parts.append(
                    rf"[{p_idx}]{genre_short} & {q_global} & {row_cells} \\"
                )
            parts.append(r"\hline")

    parts.append(r"\end{tabularx}")
    parts.append(r"\vspace{5mm}")
    parts.append(r"")

    # 서술형 모범답안
    if has_descriptive:
        parts.append(r"\noindent{\bfseries 서술형 모범답안}")
        parts.append(r"\vspace{2mm}")
        parts.append(r"")
        parts.append(r"\begin{enumerate}[label={}, leftmargin=0em, itemsep=2pt]")
        for da in descriptive_answers:
            answer = process_text(da["model_answer"])
            parts.append(
                rf"\item \textbf{{{da['number']}번}} (지문 [{da['passage']}]): {answer}"
            )
        parts.append(r"\end{enumerate}")

    return "\n".join(parts)


def generate_latex(test_name: str, test_info: dict, passages: list) -> str:
    """전체 LaTeX 소스 생성."""
    parts = []

    # 프리앰블
    parts.append(generate_preamble(test_name))

    # 헤더
    parts.append(generate_header(test_name))

    # 지문 + 문항
    q_global = 0
    for p_idx, pdata in enumerate(passages, 1):
        # 지문 박스
        parts.append(format_passage(pdata, p_idx))

        # 문항
        for q in pdata["questions"]:
            q_global += 1
            parts.append(format_question(q, q_global, test_name))

    # 정답표
    parts.append(format_answer_key(passages, test_name))

    # 문서 종료
    parts.append(r"")
    parts.append(r"\end{document}")
    parts.append(r"")

    return "\n".join(parts)


def write_file(filepath: str, content: str):
    """파일 저장."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  생성 완료: {filepath}")


def main():
    config = load_config()
    print("=== 국어농장 진단 테스트 LaTeX 시험지 생성 ===\n")

    for test_name in config["test_order"]:
        test_info = config["tests"][test_name]
        print(f"[{test_name}] 데이터 로드 중...")
        passages = load_all_passages(test_info)

        total_q = sum(len(p["questions"]) for p in passages)
        print(f"  지문 {len(passages)}개, 문항 {total_q}개 로드됨")

        print(f"  LaTeX 생성 중...")
        latex_src = generate_latex(test_name, test_info, passages)

        out_path = os.path.join(BASE_DIR, "output", "papers", f"{test_name}.tex")
        write_file(out_path, latex_src)

    print(f"\n완료! output/papers/ 디렉토리에 4개 .tex 파일 생성됨")


if __name__ == "__main__":
    main()
