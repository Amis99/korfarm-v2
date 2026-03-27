#!/usr/bin/env python
"""프로 모드 챕터 테스트 시험지 PDF 생성 — XeLaTeX 버전

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

LEVEL_LABELS = {
    "saussure1": "소쉬르 1권", "saussure2": "소쉬르 2권", "saussure3": "소쉬르 3권",
    "frege1": "프레게 1권", "frege2": "프레게 2권", "frege3": "프레게 3권",
    "russell1": "러셀 1권", "russell2": "러셀 2권", "russell3": "러셀 3권",
}

# 2단 레이아웃 레벨
TWO_COLUMN_LEVELS = {"frege1", "frege2", "frege3", "russell1", "russell2", "russell3"}

CIRCLE_NUMS = ["❶", "❷", "❸", "❹", "❺", "❻", "❼", "❽", "❾", "❿",
               "⓫", "⓬", "⓭", "⓮", "⓯", "⓰", "⓱", "⓲", "⓳", "⓴"]
CHOICE_SYMS = ["①", "②", "③", "④", "⑤"]


# ═══════════ 유틸 ═══════════

def escape_latex(s):
    """LaTeX 특수문자 이스케이프"""
    if not s:
        return ""
    # 백슬래시를 먼저 처리 (다른 치환에서 생기는 \ 와 혼동 방지)
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
    # <u>...</u> → \uline{...}
    s = re.sub(r"<u>(.*?)</u>", r"\\uline{\1}", s, flags=re.DOTALL)
    # <b>...</b> → \textbf{...}
    s = re.sub(r"<b>(.*?)</b>", r"\\textbf{\1}", s, flags=re.DOTALL)
    # <i>...</i> → \textit{...}
    s = re.sub(r"<i>(.*?)</i>", r"\\textit{\1}", s, flags=re.DOTALL)
    # <br> / <br/> → 줄바꿈
    s = re.sub(r"<br\s*/?>", "\n", s)
    # 나머지 HTML 태그 제거
    s = re.sub(r"<[^>]+>", "", s)
    return s


def parse_markers(stem):
    """stem에서 <보기>, <조건> 마커를 분리"""
    if not stem:
        return "", "", ""

    main_text = stem
    bogi = ""
    condition = ""

    # <조건> 추출
    m = re.split(r"<조건>", main_text, flags=re.IGNORECASE)
    if len(m) > 1:
        main_text = m[0]
        condition = m[1].strip()

    # <보기> 추출
    m = re.split(r"<보기>", main_text, flags=re.IGNORECASE)
    if len(m) > 1:
        main_text = m[0]
        bogi = m[1].strip()

    return main_text.strip(), bogi.strip(), condition.strip()


def process_text(raw):
    """HTML → LaTeX 변환 후 이스케이프"""
    if not raw:
        return ""
    # 먼저 HTML 변환 (LaTeX 명령 생성)
    text = html_to_latex(raw)
    # LaTeX 명령 보호 (uline, textbf 등)
    # 특수문자 없는 토큰으로 대체 (escape_latex와 충돌 방지)
    protected = []
    def protect(m):
        idx = len(protected)
        protected.append(m.group(0))
        return f"XPROTECT{idx}XEND"
    text = re.sub(r"\\(?:uline|textbf|textit)\{[^}]*\}", protect, text)
    # 이스케이프
    text = escape_latex(text)
    # 복원
    for i, val in enumerate(protected):
        text = text.replace(f"XPROTECT{i}XEND", val)
    return text


def count_lines(text):
    """텍스트의 대략적 줄 수 추정"""
    if not text:
        return 0
    lines = text.split("\n")
    total = 0
    for line in lines:
        # 한 줄 약 45자 기준 (2단), 80자 (1단)
        total += max(1, len(line) // 60 + 1)
    return total


# ═══════════ LaTeX 생성 ═══════════

def make_preamble(level_id, level_label, ch_num, total_qs, total_pts):
    """LaTeX 프리앰블 생성"""
    is_twocol = level_id in TWO_COLUMN_LEVELS
    logo = LOGO_PATH.replace("\\", "/")
    fontsize = "10pt" if is_twocol else "11pt"

    return rf"""\documentclass[{fontsize},a4paper]{{article}}

% ─── 인코딩 / 폰트 ───
\usepackage{{fontspec}}
\usepackage{{xeCJK}}
\setCJKmainfont{{Noto Sans KR}}[
  Path=C:/Windows/Fonts/,
  Extension=.ttf,
  UprightFont=NotoSansKR-VF,
  BoldFont=NotoSansKR-VF,
  UprightFeatures={{RawFeature={{axis={{wght=400}}}}}},
  BoldFeatures={{RawFeature={{axis={{wght=700}}}}}},
]
\setCJKsansfont{{Noto Sans KR}}[
  Path=C:/Windows/Fonts/,
  Extension=.ttf,
  UprightFont=NotoSansKR-VF,
  BoldFont=NotoSansKR-VF,
  UprightFeatures={{RawFeature={{axis={{wght=400}}}}}},
  BoldFeatures={{RawFeature={{axis={{wght=700}}}}}},
]
\setmainfont{{Noto Sans KR}}[
  Path=C:/Windows/Fonts/,
  Extension=.ttf,
  UprightFont=NotoSansKR-VF,
  BoldFont=NotoSansKR-VF,
  UprightFeatures={{RawFeature={{axis={{wght=400}}}}}},
  BoldFeatures={{RawFeature={{axis={{wght=700}}}}}},
]

% ─── 레이아웃 ───
\usepackage[a4paper, margin=1.5cm, top=2.8cm, bottom=2cm]{{geometry}}
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

% ─── tcolorbox 스타일 ───
\tcbset{{
  passage/.style={{
    colback=passageBg, colframe=passageBorder,
    boxrule=0.5pt, arc=3pt, left=6pt, right=6pt, top=5pt, bottom=5pt,
    fontupper=\small,
  }},
  bogi/.style={{
    colback=bogiBg, colframe=bogiBorder,
    boxrule=0.5pt, arc=3pt, left=6pt, right=6pt, top=5pt, bottom=5pt,
    fontupper=\small,
    title={{\textbf{{〈보기〉}}}},
    fonttitle=\small\bfseries,
    coltitle=black,
    attach boxed title to top left={{yshift=-2mm, xshift=4mm}},
    boxed title style={{colback=bogiBg, colframe=bogiBorder, boxrule=0.3pt, arc=2pt}},
  }},
  cond/.style={{
    colback=condBg, colframe=condBorder,
    boxrule=0.5pt, arc=3pt, left=6pt, right=6pt, top=5pt, bottom=5pt,
    fontupper=\small,
    title={{\textbf{{〈조건〉}}}},
    fonttitle=\small\bfseries,
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
  \raisebox{{-4pt}}{{\includegraphics[height=20pt]{{{logo}}}}}%
  \hspace{{6pt}}%
  \textbf{{{level_label}}}%
  \hspace{{8pt}}%
  \textcolor{{gray}}{{{ch_num}장 챕터 테스트}}%
}}
\fancyhead[R]{{%
  \small\textcolor{{gray}}{{{total_qs}문항\,·\,{total_pts}점\,·\,60분}}%
}}
\fancyfoot[C]{{\small\textcolor{{gray}}{{— \thepage\ —}}}}

% ─── 기타 설정 ───
\setlength{{\headheight}}{{14pt}}
\setlength{{\parindent}}{{0pt}}
\setlength{{\parskip}}{{2pt}}
{"\\setlength{\\columnsep}{12pt}" if is_twocol else ""}

% ─── 문제번호 매크로 ───
\newcommand{{\qnum}}[1]{{%
  \tikz[baseline=(num.base)]{{%
    \node[circle, fill=numCircle, text=white, inner sep=0pt,
          minimum size=18pt, font=\small\bfseries] (num) {{#1}};%
  }}%
}}

\newcommand{{\pts}}[1]{{%
  \hfill\textcolor{{ptsBadge}}{{\small[#1점]}}%
}}

\begin{{document}}
"""


def make_header_block(level_label, ch_num):
    """첫 페이지 헤더 블록 (학교/학년/이름)"""
    return rf"""
% ─── 첫 페이지 헤더 ───
\begin{{center}}
{{\Large\bfseries {level_label}\quad {ch_num}장 챕터 테스트}}
\end{{center}}
\vspace{{2mm}}
{{\color{{korfarmBrown}}\hrule height 1.2pt}}
\vspace{{3mm}}
\begin{{minipage}}{{0.5\textwidth}}
\end{{minipage}}%
\hfill
\begin{{minipage}}{{0.45\textwidth}}
\raggedleft
\small
학교\enspace\rule{{4cm}}{{0.4pt}}\par\vspace{{4pt}}
학년\enspace\rule{{4cm}}{{0.4pt}}\par\vspace{{4pt}}
이름\enspace\rule{{4cm}}{{0.4pt}}
\end{{minipage}}
\vspace{{4mm}}
{{\color{{korfarmBrown}}\hrule height 0.6pt}}
\vspace{{5mm}}
"""


def make_question_block(num, q, is_twocol, skip_passage=False):
    """한 문제의 LaTeX 코드 생성. skip_passage=True면 지문 렌더링 생략 (중복 방지)"""
    passage_raw = q.get("passage") or ""
    stem_raw = q.get("stem") or ""
    pts = q.get("points", 0)
    choices_raw = q.get("choices") or []

    if isinstance(choices_raw, str):
        try:
            choices_raw = json.loads(choices_raw)
        except:
            choices_raw = []

    # 마커 파싱 (stem에서 보기/조건 분리)
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

    # 줄바꿈 처리: \n → LaTeX 줄바꿈
    def nl_to_latex(s):
        if not s:
            return s
        # 연속 줄바꿈 → \vspace + \\
        s = re.sub(r"\n\n+", r"\n\\vspace{3pt}\n", s)
        # 단일 줄바꿈 → \\{} ({}로 [...]가 옵션 인자로 파싱되는 것 방지)
        s = s.replace("\n", " \\\\{}\n")
        return s

    passage = nl_to_latex(passage)
    main_text = nl_to_latex(main_text)
    bogi = nl_to_latex(bogi)
    condition = nl_to_latex(condition)

    # 긴 지문 여부 (breakable 필요)
    passage_long = count_lines(passage_raw) > 55

    lines = []

    # 문제 블록 래핑 (단/페이지 바꿈 방지)
    if is_twocol:
        if not passage_long:
            lines.append(r"\begin{minipage}{\columnwidth}")
    else:
        if not passage_long:
            lines.append(r"\begin{samepage}")

    # 세로 간격
    lines.append(r"\vspace{3mm}")

    # needspace로 최소 공간 확보
    lines.append(r"\needspace{5\baselineskip}")

    # 지문 (passage) — skip_passage이면 중복 지문 생략
    if passage and not skip_passage:
        breakopt = ", breakable" if passage_long else ""
        lines.append(rf"\begin{{tcolorbox}}[passage{breakopt}]")
        lines.append(passage)
        lines.append(r"\end{tcolorbox}")
        lines.append(r"\vspace{2mm}")

    # 문제 번호 + 발문 + 배점
    lines.append(rf"\qnum{{{num}}}\enspace {main_text} \pts{{{pts}}}")
    lines.append("")

    # 보기
    if bogi:
        lines.append(r"\vspace{2mm}")
        lines.append(r"\begin{tcolorbox}[bogi]")
        lines.append(bogi)
        lines.append(r"\end{tcolorbox}")

    # 조건
    if condition:
        lines.append(r"\vspace{2mm}")
        lines.append(r"\begin{tcolorbox}[cond]")
        lines.append(condition)
        lines.append(r"\end{tcolorbox}")

    # 선택지
    if choices:
        lines.append(r"\vspace{2mm}")
        lines.append(r"\begin{itemize}[leftmargin=1.5em, labelsep=0pt, label={}, itemsep=1pt, parsep=0pt]")
        for c in choices:
            lines.append(rf"  \item {c}")
        lines.append(r"\end{itemize}")

    # 블록 닫기
    if is_twocol:
        if not passage_long:
            lines.append(r"\end{minipage}")
            lines.append(r"\vspace{3mm}")
    else:
        if not passage_long:
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
            time.sleep(0.5)  # Windows 파일시스템 안정화 대기
    raise last_err


def _compile_once(tex_content, output_name):
    """xelatex 1회 컴파일 시도"""
    with tempfile.TemporaryDirectory() as tmpdir:
        tex_path = os.path.join(tmpdir, "test.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(tex_content)

        # xelatex 2회 실행 (페이지 참조 안정화)
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
                # 로그에서 에러 추출
                log_path = os.path.join(tmpdir, "test.log")
                log_text = ""
                if os.path.exists(log_path):
                    with open(log_path, "r", encoding="utf-8", errors="replace") as f:
                        log_text = f.read()
                # 에러 줄 추출
                err_lines = [l for l in log_text.split("\n") if l.startswith("!")]
                err_msg = "\n".join(err_lines[:5]) if err_lines else result.stdout[-500:]
                raise RuntimeError(f"xelatex 컴파일 오류:\n{err_msg}")

        # PDF 복사
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

    # CloudFront 무효화
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
        pdf_url = f"https://dbtbky39ni3nn.cloudfront.net/test-pdfs/{fname}"
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

        # 문제 전체
        paper_ids = [p["test_paper_id"] for p in papers]
        placeholders = ",".join(["%s"] * len(paper_ids))
        cur.execute(f"""
            SELECT tq.test_id, tq.number, tq.type, tq.points, tq.domain,
                   tq.passage, tq.stem, tq.correct_answer, tq.choices_json AS choices
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
        print("PDF URL: https://dbtbky39ni3nn.cloudfront.net/test-pdfs/<level>_ch<nn>.pdf")


if __name__ == "__main__":
    main()
