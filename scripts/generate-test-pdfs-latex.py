#!/usr/bin/env python
"""프로 모드 챕터 테스트 시험지 PDF 생성 — XeLaTeX 버전 v2

SSH 터널 → DB 쿼리 → .tex 생성 → xelatex 컴파일 → S3 업로드 → DB 업데이트
"""

import json, os, re, sys, subprocess, shutil, argparse, tempfile
from collections import defaultdict

from sshtunnel import SSHTunnelForwarder
import mysql.connector

# ─── 설정 ───
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(SCRIPT_DIR, "..")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "generated", "test-pdfs")
LOGO_PATH = os.path.join(PROJECT_DIR, "frontend", "public", "korfarm-logo.png")
XELATEX = r"C:\TinyTeX\TinyTeX\bin\windows\xelatex.exe"

SSH_HOST = "43.200.104.102"
SSH_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")
DB_HOST = "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com"
DB_USER = "admin"
DB_PASS = "xXoM4Ld7VAIYl9W874md5kic"
DB_NAME = "korfarm"

AWS_CLI = r"C:\Program Files\Amazon\AWSCLIV2\aws.exe"
S3_BUCKET = "korfarm-frontend"
CF_DIST = "E29A5UX2VDFB4I"
CF_DOMAIN = "dbtbky39ni3nn.cloudfront.net"

LEVEL_LABELS = {
    "saussure1": "소쉬르 1권", "saussure2": "소쉬르 2권", "saussure3": "소쉬르 3권",
    "frege1": "프레게 1권", "frege2": "프레게 2권", "frege3": "프레게 3권",
    "russell1": "러셀 1권", "russell2": "러셀 2권", "russell3": "러셀 3권",
}

# 2단 레이아웃 레벨
TWO_COLUMN_LEVELS = {"frege1", "frege2", "frege3", "russell1", "russell2", "russell3"}

# 레벨별 폰트 크기 설정: (문서클래스pt, 본문pt, 행간pt, 지문행간pt)
LEVEL_FONT_CONFIG = {
    "saussure1": (12, 14, 19, 22),
    "saussure2": (12, 13, 17.5, 21),
    "saussure3": (12, 13, 17.5, 21),
    "frege1":    (12, 12, 16, 19),
    "frege2":    (12, 12, 16, 19),
    "frege3":    (11, 11, 15, 18),
    "russell1":  (10, 10, 14, 16.5),
    "russell2":  (10, 10, 14, 16.5),
    "russell3":  (10, 10, 14, 16.5),
}

CHOICE_SYMS = ["①", "②", "③", "④", "⑤"]


# ═══════════ 유틸 ═══════════

def escape_latex(s):
    """LaTeX 특수문자 이스케이프"""
    if not s:
        return ""
    s = s.replace("\\", "\x00BACKSLASH\x00")
    s = s.replace("&", "\\&")
    s = s.replace("%", "\\%")
    s = s.replace("$", "\\$")
    s = s.replace("#", "\\#")
    s = s.replace("_", "\\_")
    s = s.replace("{", "\\{")
    s = s.replace("}", "\\}")
    s = s.replace("~", "\\textasciitilde{}")
    s = s.replace("^", "\\textasciicircum{}")
    s = s.replace("\x00BACKSLASH\x00", "\\textbackslash{}")
    return s


def html_to_latex(s):
    """HTML 태그 → LaTeX 변환"""
    if not s:
        return ""
    s = re.sub(r"<u>(.*?)</u>", r"\\uline{\1}", s, flags=re.DOTALL)
    s = re.sub(r"<b>(.*?)</b>", r"\\textbf{\1}", s, flags=re.DOTALL)
    s = re.sub(r"<i>(.*?)</i>", r"\\textit{\1}", s, flags=re.DOTALL)
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    return s


def parse_markers(stem):
    """stem에서 <보기>, <조건> 마커를 분리.
    줄 시작 또는 빈줄 뒤에 오는 독립적인 <보기>/<조건> 태그만 인식.
    문장 중간의 '조건' 텍스트는 건드리지 않음."""
    if not stem:
        return "", "", ""
    main_text = stem
    bogi = ""
    condition = ""
    # <조건> — 줄 시작에 위치한 태그만 매칭
    m = re.split(r"(?:^|\n)\s*<조건>\s*\n?", main_text)
    if len(m) > 1:
        main_text = m[0]
        condition = m[1].strip()
    # <보기> — 줄 시작에 위치한 태그만 매칭
    m = re.split(r"(?:^|\n)\s*<보기>\s*\n?", main_text)
    if len(m) > 1:
        main_text = m[0]
        bogi = m[1].strip()
    return main_text.strip(), bogi.strip(), condition.strip()


def process_text(raw):
    """HTML → LaTeX 변환 후 이스케이프"""
    if not raw:
        return ""
    text = html_to_latex(raw)
    protected = []
    def protect(m):
        idx = len(protected)
        protected.append(m.group(0))
        return f"XPROTECT{idx}XEND"
    text = re.sub(r"\\(?:uline|textbf|textit)\{[^}]*\}", protect, text)
    text = escape_latex(text)
    for i, val in enumerate(protected):
        text = text.replace(f"XPROTECT{i}XEND", val)
    return text


def nl_to_latex(s):
    """줄바꿈 → LaTeX 줄바꿈"""
    if not s:
        return s
    s = re.sub(r"\n\n+", r"\n\\vspace{4pt}\n", s)
    s = s.replace("\n", " \\\\{}\n")
    return s


def count_lines(text):
    """텍스트의 대략적 줄 수 추정"""
    if not text:
        return 0
    lines = text.split("\n")
    total = 0
    for line in lines:
        total += max(1, len(line) // 60 + 1)
    return total


def estimate_answer_lines(q):
    """서술형/단답형의 답안 분량 추정 → 밑줄 줄 수"""
    qtype = (q.get("type") or "").strip()
    model = q.get("model_answer") or q.get("correct_answer") or ""

    if qtype == "객관식":
        return 0

    if not model:
        # 배점 기반 추정: 8점 이상 → 3줄, 5점 → 2줄, 나머지 1줄
        pts = q.get("points", 0)
        if pts >= 8:
            return 3
        elif pts >= 5:
            return 2
        return 1

    # 모범답안 길이 기반
    length = len(model)
    if length <= 20:
        return 1
    elif length <= 60:
        return 2
    elif length <= 120:
        return 3
    else:
        return 4


# ═══════════ LaTeX 생성 ═══════════

def make_preamble(level_id, level_label, ch_num, total_qs, total_pts):
    """LaTeX 프리앰블 생성"""
    is_twocol = level_id in TWO_COLUMN_LEVELS
    logo = LOGO_PATH.replace("\\", "/")
    doc_pt, base_pt, base_skip, passage_skip = LEVEL_FONT_CONFIG.get(
        level_id, (11, 11, 15, 18)
    )

    return rf"""\documentclass[{doc_pt}pt,a4paper]{{article}}

% ─── 인코딩 / 폰트 ───
\usepackage{{fontspec}}
\usepackage{{xeCJK}}
\xeCJKsetup{{CJKspace=true}}
\setCJKmainfont{{Noto Sans KR}}[
  Path=C:/Windows/Fonts/, Extension=.ttf,
  UprightFont=NotoSansKR-VF, BoldFont=NotoSansKR-VF,
  UprightFeatures={{RawFeature={{axis={{wght=400}}}}}},
  BoldFeatures={{RawFeature={{axis={{wght=700}}}}}},
]
\setCJKsansfont{{Noto Sans KR}}[
  Path=C:/Windows/Fonts/, Extension=.ttf,
  UprightFont=NotoSansKR-VF, BoldFont=NotoSansKR-VF,
  UprightFeatures={{RawFeature={{axis={{wght=400}}}}}},
  BoldFeatures={{RawFeature={{axis={{wght=700}}}}}},
]
\setmainfont{{Noto Sans KR}}[
  Path=C:/Windows/Fonts/, Extension=.ttf,
  UprightFont=NotoSansKR-VF, BoldFont=NotoSansKR-VF,
  UprightFeatures={{RawFeature={{axis={{wght=400}}}}}},
  BoldFeatures={{RawFeature={{axis={{wght=700}}}}}},
]

% ─── 레이아웃 ───
\usepackage[a4paper, margin=1.5cm, top=2.8cm, bottom=2cm, heightrounded]{{geometry}}
\usepackage{{graphicx}}
\usepackage{{fancyhdr}}
\usepackage{{xcolor}}
\usepackage{{tikz}}
\usepackage[most]{{tcolorbox}}
{"\\usepackage{multicol}" if is_twocol else ""}
\usepackage{{enumitem}}
\usepackage{{setspace}}
\usepackage{{needspace}}
\usepackage{{etoolbox}}
\usepackage[normalem]{{ulem}}

% ─── 본문 폰트 크기 설정 ───
\fontsize{{{base_pt}pt}}{{{base_skip}pt}}\selectfont

% ─── 색상 정의 ───
\definecolor{{korfarmBrown}}{{HTML}}{{8B6914}}
\definecolor{{passageBg}}{{HTML}}{{F5F5F0}}
\definecolor{{passageBorder}}{{HTML}}{{D0C8B0}}
\definecolor{{bogiBg}}{{HTML}}{{EBF2FA}}
\definecolor{{bogiBorder}}{{HTML}}{{A8C8E8}}
\definecolor{{condBg}}{{HTML}}{{FFF4E6}}
\definecolor{{condBorder}}{{HTML}}{{E8C890}}
\definecolor{{numCircle}}{{HTML}}{{2C3E50}}
\definecolor{{ptsBadge}}{{HTML}}{{6B7280}}
\definecolor{{answerLine}}{{HTML}}{{B0B0B0}}

% ─── tcolorbox 스타일 ───
\tcbset{{
  passage/.style={{
    colback=passageBg, colframe=passageBorder,
    boxrule=0.5pt, arc=3pt, left=8pt, right=8pt, top=6pt, bottom=6pt,
    fontupper=\fontsize{{{base_pt}pt}}{{{passage_skip}pt}}\selectfont,
    breakable,
  }},
  bogi/.style={{
    colback=bogiBg, colframe=bogiBorder,
    boxrule=0.5pt, arc=3pt, left=8pt, right=8pt, top=6pt, bottom=6pt,
    fontupper=\fontsize{{{base_pt}pt}}{{{base_skip}pt}}\selectfont,
    title={{\textbf{{〈보기〉}}}},
    fonttitle=\bfseries,
    coltitle=black,
    attach boxed title to top left={{yshift=-2mm, xshift=4mm}},
    boxed title style={{colback=bogiBg, colframe=bogiBorder, boxrule=0.3pt, arc=2pt}},
  }},
  cond/.style={{
    colback=condBg, colframe=condBorder,
    boxrule=0.5pt, arc=3pt, left=8pt, right=8pt, top=6pt, bottom=6pt,
    fontupper=\fontsize{{{base_pt}pt}}{{{base_skip}pt}}\selectfont,
    title={{\textbf{{〈조건〉}}}},
    fonttitle=\bfseries,
    coltitle=black,
    attach boxed title to top left={{yshift=-2mm, xshift=4mm}},
    boxed title style={{colback=condBg, colframe=condBorder, boxrule=0.3pt, arc=2pt}},
  }},
}}

% ─── 헤더/푸터 ───
\pagestyle{{fancy}}
\fancyhf{{}}
\renewcommand{{\headrulewidth}}{{0pt}}
\fancyhead[L]{{%
  \raisebox{{-4pt}}{{\includegraphics[height=18pt]{{{logo}}}}}%
  \hspace{{6pt}}%
  \textbf{{{level_label}}}%
  \hspace{{6pt}}%
  \textcolor{{gray}}{{{ch_num}장 챕터 테스트}}%
}}
\fancyhead[R]{{%
  \small\textcolor{{gray}}{{{total_qs}문항\,·\,{total_pts}점\,·\,60분}}%
}}
\fancyfoot[C]{{\small\textcolor{{gray}}{{— \thepage\ —}}}}

% ─── 기타 설정 ───
\raggedbottom
\setlength{{\headheight}}{{20pt}}
\addtolength{{\topmargin}}{{-6pt}}
\setlength{{\parindent}}{{0pt}}
\setlength{{\parskip}}{{3pt}}
{"\\setlength{\\columnsep}{12pt}" if is_twocol else ""}

% ─── 문제번호 매크로 ───
\newcommand{{\qnum}}[1]{{%
  \tikz[baseline=(num.base)]{{%
    \node[circle, fill=numCircle, text=white, inner sep=0pt,
          minimum size=18pt, font=\small\bfseries] (num) {{#1}};%
  }}%
}}

\newcommand{{\pts}}[1]{{%
  \hfill\textcolor{{ptsBadge}}{{[#1점]}}%
}}

% ─── 답안 밑줄 매크로 ───
\newcommand{{\answerlines}}[1]{{%
  \par\vspace{{4pt}}%
  \foreach \i in {{1,...,#1}} {{%
    {{\color{{answerLine}}\hrule height 0.4pt}}\vspace{{35pt}}%
  }}%
  \vspace{{2pt}}%
}}

\begin{{document}}
"""


def make_header_block(level_label, ch_num):
    """첫 페이지 헤더 블록 (학교/학년/이름 한 줄)"""
    return rf"""
% ─── 첫 페이지 헤더 ───
\begin{{center}}
{{\Large\bfseries {level_label}\quad {ch_num}장 챕터 테스트}}
\end{{center}}
\vspace{{3mm}}
{{\color{{korfarmBrown}}\hrule height 1.2pt}}
\vspace{{5mm}}
\hfill\rule{{3.5cm}}{{0.4pt}}\,학교\hspace{{10mm}}%
\rule{{2cm}}{{0.4pt}}\,학년\hspace{{10mm}}%
이름\,\rule{{3.5cm}}{{0.4pt}}
\vspace{{5mm}}
{{\color{{korfarmBrown}}\hrule height 0.6pt}}
\vspace{{6mm}}
"""


def make_question_block(num, q, is_twocol, skip_passage=False):
    """한 문제의 LaTeX 코드 생성"""
    passage_raw = q.get("passage") or ""
    stem_raw = q.get("stem") or ""
    pts = q.get("points", 0)
    choices_raw = q.get("choices") or []

    if isinstance(choices_raw, str):
        try:
            choices_raw = json.loads(choices_raw)
        except:
            choices_raw = []

    # 마커 파싱
    main_text, bogi, condition = parse_markers(stem_raw)

    # 텍스트 처리
    passage = process_text(passage_raw)
    main_text = process_text(main_text)
    bogi = process_text(bogi)
    condition = process_text(condition)

    choices = []
    for i, c in enumerate(choices_raw):
        sym = CHOICE_SYMS[i] if i < len(CHOICE_SYMS) else f"({i+1})"
        txt = c.get("text", "") if isinstance(c, dict) else str(c)
        choices.append(f"{sym} {process_text(txt)}")

    passage = nl_to_latex(passage)
    main_text = nl_to_latex(main_text)
    bogi = nl_to_latex(bogi)
    condition = nl_to_latex(condition)

    # 서술형/단답형 답안 줄 수
    answer_line_count = estimate_answer_lines(q)

    lines = []

    # 세로 간격
    lines.append(r"\vspace{4mm}")
    lines.append(r"\needspace{5\baselineskip}")

    # 지문 (passage 스타일에 breakable 내장 — 넘치면 자동 분할)
    if passage and not skip_passage:
        lines.append(r"\begin{tcolorbox}[passage]")
        lines.append(passage)
        lines.append(r"\end{tcolorbox}")
        lines.append(r"\vspace{3mm}")

    # ── 발문+보기+조건+선택지+답안밑줄 블록 (바꿈 방지) ──
    if is_twocol:
        lines.append(r"\begin{minipage}{\columnwidth}")
    else:
        lines.append(r"\begin{samepage}")

    # 문제 번호 + 발문 + 배점 (둘째 줄부터 들여쓰기)
    lines.append(r"{\hangindent=2em\hangafter=1")
    lines.append(rf"\qnum{{{num}}}\enspace {main_text} \pts{{{pts}}}")
    lines.append(r"\par}")
    lines.append("")

    # 보기
    if bogi:
        lines.append(r"\vspace{3mm}")
        lines.append(r"\begin{tcolorbox}[bogi]")
        lines.append(bogi)
        lines.append(r"\end{tcolorbox}")

    # 조건
    if condition:
        lines.append(r"\vspace{3mm}")
        lines.append(r"\begin{tcolorbox}[cond]")
        lines.append(condition)
        lines.append(r"\end{tcolorbox}")

    # 선택지 (줄간격 넓게, 들여쓰기)
    if choices:
        lines.append(r"\vspace{3mm}")
        lines.append(r"\begin{itemize}[leftmargin=2.5em, labelsep=0.3em, label={}, itemsep=4pt, parsep=1pt, topsep=0pt]")
        for c in choices:
            lines.append(rf"  \item {c}")
        lines.append(r"\end{itemize}")

    # 서술형/단답형 답안 밑줄
    if answer_line_count > 0:
        lines.append(r"\vspace{3mm}")
        lines.append(rf"\answerlines{{{answer_line_count}}}")

    # 발문~선택지 블록 닫기
    if is_twocol:
        lines.append(r"\end{minipage}")
        lines.append(r"\vspace{4mm}")
    else:
        lines.append(r"\end{samepage}")

    return "\n".join(lines)


def generate_tex(paper, questions):
    """시험지 전체 .tex 파일 생성"""
    lid = paper["level_id"]
    cn = paper["chapter_number"]
    ll = LEVEL_LABELS.get(lid, lid)
    total_qs = paper["total_questions"]
    total_pts = paper["total_points"]
    is_twocol = lid in TWO_COLUMN_LEVELS

    tex = make_preamble(lid, ll, cn, total_qs, total_pts)
    tex += make_header_block(ll, cn)

    if is_twocol:
        tex += "\\begin{multicols}{2}\n"

    last_passage = None
    for q in questions:
        cur_passage = (q.get("passage") or "").strip()
        skip = (cur_passage == last_passage and cur_passage != "")
        tex += make_question_block(q["number"], q, is_twocol, skip_passage=skip)
        tex += "\n\n"
        if cur_passage:
            last_passage = cur_passage

    if is_twocol:
        tex += "\\end{multicols}\n"

    tex += "\\end{document}\n"
    return tex


# ═══════════ 컴파일 ═══════════

def compile_tex(tex_content, output_name, max_retries=2):
    """xelatex으로 .tex → .pdf 컴파일 (실패 시 재시도)"""
    last_err = None
    for attempt in range(max_retries):
        try:
            return _compile_once(tex_content, output_name)
        except RuntimeError as e:
            last_err = e
            import time
            time.sleep(0.5)
    raise last_err


def _compile_once(tex_content, output_name):
    """xelatex 1회 컴파일 시도"""
    with tempfile.TemporaryDirectory() as tmpdir:
        tex_path = os.path.join(tmpdir, "test.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(tex_content)

        for pass_num in range(2):
            result = subprocess.run(
                [XELATEX, "-interaction=nonstopmode", "-halt-on-error", "test.tex"],
                cwd=tmpdir,
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=120,
            )
            if result.returncode != 0 and pass_num == 1:
                log_path = os.path.join(tmpdir, "test.log")
                log_text = ""
                if os.path.exists(log_path):
                    with open(log_path, "r", encoding="utf-8", errors="replace") as f:
                        log_text = f.read()
                err_lines = [l for l in log_text.split("\n") if l.startswith("!")]
                err_msg = "\n".join(err_lines[:5]) if err_lines else result.stdout[-500:]
                raise RuntimeError(f"xelatex 컴파일 오류:\n{err_msg}")

        pdf_src = os.path.join(tmpdir, "test.pdf")
        if not os.path.exists(pdf_src):
            raise RuntimeError("PDF 생성 실패 — 출력 파일 없음")

        pdf_dst = os.path.join(OUTPUT_DIR, output_name)
        shutil.copy2(pdf_src, pdf_dst)
        return pdf_dst


# ═══════════ S3 업로드 + DB 업데이트 ═══════════

def upload_to_s3():
    """generated/test-pdfs/ → S3 동기화"""
    print("\nS3 업로드 중...")
    cmd = [
        AWS_CLI, "s3", "sync",
        OUTPUT_DIR,
        f"s3://{S3_BUCKET}/test-pdfs/",
        "--delete",
        "--content-type", "application/pdf",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  S3 업로드 오류: {result.stderr}")
        return False
    print("  S3 업로드 완료")

    print("  CloudFront 무효화 중...")
    cmd = [
        AWS_CLI, "cloudfront", "create-invalidation",
        "--distribution-id", CF_DIST,
        "--paths", "/test-pdfs/*",
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    print("  CloudFront 무효화 요청 완료")
    return True


def update_db(papers, tunnel_port):
    """DB의 test_papers.pdf_file_id 업데이트"""
    print("\nDB 업데이트 중...")
    conn = mysql.connector.connect(
        host="127.0.0.1", port=tunnel_port,
        user=DB_USER, password=DB_PASS, database=DB_NAME,
        charset="utf8mb4",
    )
    cur = conn.cursor()
    updated = 0
    for p in papers:
        lid = p["level_id"]
        cn = p["chapter_number"]
        fname = f"{lid}_ch{cn:02d}.pdf"
        pdf_url = f"https://{CF_DOMAIN}/test-pdfs/{fname}"
        cur.execute(
            "UPDATE test_papers SET pdf_file_id = %s, updated_at = NOW() WHERE id = %s",
            (pdf_url, p["test_paper_id"])
        )
        updated += cur.rowcount
    conn.commit()
    conn.close()
    print(f"  {updated}건 업데이트")


# ═══════════ 메인 ═══════════

def main():
    parser = argparse.ArgumentParser(description="프로 모드 시험지 PDF 생성 (XeLaTeX)")
    parser.add_argument("--level", help="특정 레벨만 생성 (예: saussure1)")
    parser.add_argument("--chapter", type=int, help="특정 챕터만 생성 (예: 1)")
    parser.add_argument("--no-upload", action="store_true", help="S3 업로드 건너뛰기")
    parser.add_argument("--no-db", action="store_true", help="DB 업데이트 건너뛰기")
    parser.add_argument("--tex-only", action="store_true", help=".tex 파일만 생성 (컴파일 안 함)")
    parser.add_argument("--keep-tex", action="store_true", help="컴파일 후 .tex 파일도 보존")
    args = parser.parse_args()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("SSH 터널 연결 중...")

    with SSHTunnelForwarder(
        SSH_HOST,
        ssh_username="ec2-user",
        ssh_pkey=SSH_KEY,
        remote_bind_address=(DB_HOST, 3306),
        local_bind_address=("127.0.0.1", 13307),
    ) as tunnel:
        print(f"터널 OK (로컬 포트 {tunnel.local_bind_port})")
        conn = mysql.connector.connect(
            host="127.0.0.1", port=tunnel.local_bind_port,
            user=DB_USER, password=DB_PASS, database=DB_NAME,
            charset="utf8mb4",
        )
        cur = conn.cursor(dictionary=True)

        # 시험지 목록
        query = """
            SELECT tp.id AS test_paper_id, tp.title, tp.total_questions, tp.total_points,
                   pc.level_id, pc.chapter_number
            FROM pro_chapter_tests pct
            JOIN test_papers tp ON tp.id = pct.test_paper_id
            JOIN pro_chapters pc ON pc.id = pct.chapter_id
            WHERE pct.status = 'active'
        """
        conditions = []
        params = []
        if args.level:
            conditions.append("pc.level_id = %s")
            params.append(args.level)
        if args.chapter:
            conditions.append("pc.chapter_number = %s")
            params.append(args.chapter)
        if conditions:
            query += " AND " + " AND ".join(conditions)
        query += " ORDER BY pc.global_chapter_number"

        cur.execute(query, params)
        papers = cur.fetchall()
        print(f"시험지 {len(papers)}개 로드")

        if not papers:
            print("대상 시험지가 없습니다.")
            return

        # 문제 전체 (model_answer 포함)
        paper_ids = [p["test_paper_id"] for p in papers]
        placeholders = ",".join(["%s"] * len(paper_ids))
        cur.execute(f"""
            SELECT tq.test_id, tq.number, tq.type, tq.points, tq.domain,
                   tq.passage, tq.stem, tq.correct_answer, tq.model_answer,
                   tq.choices_json AS choices
            FROM test_questions tq
            WHERE tq.test_id IN ({placeholders})
            ORDER BY tq.test_id, tq.number
        """, paper_ids)
        all_qs = cur.fetchall()
        print(f"문제 {len(all_qs)}개 로드")

        by_paper = defaultdict(list)
        for q in all_qs:
            by_paper[q["test_id"]].append(q)

        conn.close()

        # PDF 생성
        print("\nPDF 생성 중...")
        ok, errs = 0, []
        for p in papers:
            lid = p["level_id"]
            cn = p["chapter_number"]
            ll = LEVEL_LABELS.get(lid, lid)
            qs = by_paper.get(p["test_paper_id"], [])
            fname = f"{lid}_ch{cn:02d}"

            if not qs:
                errs.append(f"{ll} {cn}장: 문제 없음")
                continue

            try:
                tex_content = generate_tex(p, qs)

                if args.tex_only or args.keep_tex:
                    tex_path = os.path.join(OUTPUT_DIR, f"{fname}.tex")
                    with open(tex_path, "w", encoding="utf-8") as f:
                        f.write(tex_content)
                    if args.tex_only:
                        ok += 1
                        continue

                compile_tex(tex_content, f"{fname}.pdf")
                ok += 1
                sys.stdout.write(f"\r  {ok}/{len(papers)} 완료")
                sys.stdout.flush()
            except Exception as e:
                errs.append(f"{ll} {cn}장: {e}")

        print(f"\n\n생성 완료: {ok}/{len(papers)} PDF")
        if errs:
            print(f"\n오류 {len(errs)}건:")
            for e in errs:
                print(f"  - {e}")

        # S3 업로드
        if not args.no_upload and not args.tex_only and ok > 0:
            upload_to_s3()

        # DB 업데이트
        if not args.no_db and not args.tex_only and ok > 0:
            update_db(papers, tunnel.local_bind_port)

    print(f"\n출력 디렉토리: {OUTPUT_DIR}")
    if ok > 0 and not args.no_upload:
        print(f"PDF URL: https://{CF_DOMAIN}/test-pdfs/<level>_ch<nn>.pdf")


if __name__ == "__main__":
    main()
