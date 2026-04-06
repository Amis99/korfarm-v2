#!/usr/bin/env python
"""진단 테스트 v2 시험지 PDF 생성 (XeLaTeX)

generate-test-pdfs-latex.py와 동일한 패턴.
SSH 터널 → DB 쿼리 (test_papers.series='diagnostic') → .tex 생성 → xelatex 컴파일 → S3 업로드 → DB 업데이트
"""

import os, sys, subprocess, shutil, argparse, tempfile
from collections import defaultdict

from sshtunnel import SSHTunnelForwarder
import mysql.connector

# generate-test-pdfs-latex.py의 헬퍼 함수 재사용
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module
_pdf_mod = import_module("generate-test-pdfs-latex")

escape_latex = _pdf_mod.escape_latex
html_to_latex = _pdf_mod.html_to_latex
parse_markers = _pdf_mod.parse_markers
process_text = _pdf_mod.process_text
nl_to_latex = _pdf_mod.nl_to_latex
make_question_block = _pdf_mod.make_question_block
compile_tex = _pdf_mod.compile_tex
CHOICE_SYMS = _pdf_mod.CHOICE_SYMS

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

# 진단 tier 라벨
TIER_LABELS = {
    "sohssure": "소쉬르 단계",
    "frege": "프레게 단계",
    "russell": "러셀 단계",
    "wittgenstein": "비트겐슈타인 단계",
}

# 2단 레이아웃 — 소쉬르는 1단 (큰 글씨), 나머지는 2단
TWO_COLUMN_LEVELS = {"frege", "russell", "wittgenstein"}

# tier별 폰트: (문서클래스pt, 본문pt, 행간pt, 지문행간pt)
TIER_FONT_CONFIG = {
    "sohssure":     (12, 14, 19, 22),  # 초등 저학년 — 가장 큰 글씨
    "frege":        (12, 12, 16, 19),  # 초등 고학년
    "russell":      (11, 11, 15, 18),  # 중학생
    "wittgenstein": (10, 10, 14, 16.5),  # 고등학생
}


# ═══════════ LaTeX 생성 (진단 전용 프리앰블) ═══════════

def make_diag_preamble(tier, tier_label, total_qs, total_pts):
    is_twocol = tier in TWO_COLUMN_LEVELS
    logo = LOGO_PATH.replace("\\", "/")
    doc_pt, base_pt, base_skip, passage_skip = TIER_FONT_CONFIG.get(
        tier, (11, 11, 15, 18)
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
\usepackage{{enumitem}}
\usepackage{{setspace}}
\usepackage{{needspace}}
\usepackage{{etoolbox}}
\usepackage[normalem]{{ulem}}

\fontsize{{{base_pt}pt}}{{{base_skip}pt}}\selectfont

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
\definecolor{{noticeBg}}{{HTML}}{{FFF7E8}}
\definecolor{{noticeBorder}}{{HTML}}{{D4B980}}

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
  notice/.style={{
    colback=noticeBg, colframe=noticeBorder,
    boxrule=0.8pt, arc=4pt, left=10pt, right=10pt, top=8pt, bottom=8pt,
    fontupper=\fontsize{{{base_pt}pt}}{{{base_skip}pt}}\selectfont,
  }},
}}

\pagestyle{{fancy}}
\fancyhf{{}}
\renewcommand{{\headrulewidth}}{{0pt}}
\fancyhead[L]{{%
  \raisebox{{-4pt}}{{\includegraphics[height=18pt]{{{logo}}}}}%
  \hspace{{6pt}}%
  \textbf{{[진단] {tier_label}}}%
  \hspace{{6pt}}%
  \textcolor{{gray}}{{역량 진단 시험지}}%
}}
\fancyhead[R]{{%
  \small\textcolor{{gray}}{{{total_qs}문항\,·\,{total_pts}점\,·\,60분}}%
}}
\fancyfoot[C]{{\small\textcolor{{gray}}{{— \thepage\ —}}}}

\raggedbottom
\setlength{{\headheight}}{{20pt}}
\addtolength{{\topmargin}}{{-6pt}}
\setlength{{\parindent}}{{0pt}}
\setlength{{\parskip}}{{3pt}}
{"\\setlength{\\columnsep}{12pt}" if is_twocol else ""}

\newcommand{{\qnum}}[1]{{%
  \tikz[baseline=(num.base)]{{%
    \node[circle, fill=numCircle, text=white, inner sep=0pt,
          minimum size=18pt, font=\small\bfseries] (num) {{#1}};%
  }}%
}}

\newcommand{{\pts}}[1]{{%
  \hfill\textcolor{{ptsBadge}}{{[#1점]}}%
}}

\newcommand{{\answerlines}}[1]{{%
  \par\vspace{{4pt}}%
  \foreach \i in {{1,...,#1}} {{%
    {{\color{{answerLine}}\hrule height 0.4pt}}\vspace{{35pt}}%
  }}%
  \vspace{{2pt}}%
}}

\begin{{document}}
"""


def make_diag_header(tier_label, total_qs):
    """첫 페이지 헤더 + 응시 안내 박스"""
    return rf"""
% ─── 첫 페이지 헤더 ───
\begin{{center}}
{{\Large\bfseries [진단] {tier_label} 역량 진단}}
\end{{center}}
\vspace{{3mm}}
{{\color{{korfarmBrown}}\hrule height 1.2pt}}
\vspace{{4mm}}
\hfill\rule{{3.5cm}}{{0.4pt}}\,학교\hspace{{10mm}}%
\rule{{2cm}}{{0.4pt}}\,학년\hspace{{10mm}}%
이름\,\rule{{3.5cm}}{{0.4pt}}
\vspace{{4mm}}
{{\color{{korfarmBrown}}\hrule height 0.6pt}}
\vspace{{4mm}}

% ─── 응시 안내 박스 ───
\begin{{tcolorbox}}[notice]
\textbf{{응시 안내}}\\[2pt]
$\bullet$\ 객관식 {total_qs}문항\,·\,60분 제한\\
$\bullet$\ \textbf{{문제를 다 풀면 답안을 바로 제출하세요.}}\\
$\bullet$\ 찍고 넘어간 문제는 풀이속도 측정 시 1문항당 3분이 가산됩니다.\\
$\bullet$\ 종이로 푼 답안은 국어농장 사이트의 OMR 입력 화면에 옮겨 적어 제출해 주세요.
\end{{tcolorbox}}
\vspace{{4mm}}
"""


def generate_diag_tex(tier, tier_label, total_qs, total_pts, questions):
    """진단 시험지 .tex 생성"""
    is_twocol = tier in TWO_COLUMN_LEVELS

    tex = make_diag_preamble(tier, tier_label, total_qs, total_pts)

    if is_twocol:
        header = make_diag_header(tier_label, total_qs)
        tex += f"\\twocolumn[{header}]\n"
    else:
        tex += make_diag_header(tier_label, total_qs)

    last_passage = None
    for q in questions:
        cur_passage = (q.get("passage") or "").strip()
        skip = (cur_passage == last_passage and cur_passage != "")
        tex += make_question_block(q["number"], q, is_twocol, skip_passage=skip)
        tex += "\n\n"
        if cur_passage:
            last_passage = cur_passage

    tex += "\\end{document}\n"
    return tex


# ═══════════ S3 + DB ═══════════

def upload_to_s3():
    print("\nS3 업로드 중...")
    cmd = [
        AWS_CLI, "s3", "sync",
        OUTPUT_DIR,
        f"s3://{S3_BUCKET}/test-pdfs/",
        "--exclude", "*",
        "--include", "diagnostic_*.pdf",
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
        "--paths", "/test-pdfs/diagnostic_*",
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    print("  CloudFront 무효화 요청 완료")
    return True


def update_db(papers, tunnel_port):
    print("\nDB 업데이트 중...")
    conn = mysql.connector.connect(
        host="127.0.0.1", port=tunnel_port,
        user=DB_USER, password=DB_PASS, database=DB_NAME,
        charset="utf8mb4",
    )
    cur = conn.cursor()
    updated = 0
    for p in papers:
        tier = p["tier"]
        fname = f"diagnostic_{tier}.pdf"
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
    parser = argparse.ArgumentParser(description="진단 테스트 v2 시험지 PDF 생성")
    parser.add_argument("--tier", help="특정 tier만 생성 (sohssure/frege/russell/wittgenstein)")
    parser.add_argument("--no-upload", action="store_true", help="S3 업로드 건너뛰기")
    parser.add_argument("--no-db", action="store_true", help="DB 업데이트 건너뛰기")
    parser.add_argument("--tex-only", action="store_true", help=".tex 파일만 생성")
    parser.add_argument("--keep-tex", action="store_true", help="컴파일 후 .tex 파일도 보존")
    args = parser.parse_args()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("SSH 터널 연결 중...")

    with SSHTunnelForwarder(
        SSH_HOST,
        ssh_username="ec2-user",
        ssh_pkey=SSH_KEY,
        remote_bind_address=(DB_HOST, 3306),
        local_bind_address=("127.0.0.1", 13308),
    ) as tunnel:
        print(f"터널 OK (로컬 포트 {tunnel.local_bind_port})")
        conn = mysql.connector.connect(
            host="127.0.0.1", port=tunnel.local_bind_port,
            user=DB_USER, password=DB_PASS, database=DB_NAME,
            charset="utf8mb4",
        )
        cur = conn.cursor(dictionary=True)

        # 진단 시험지 목록 (series='diagnostic')
        # diag_paper_<tier> 패턴에서 tier 추출 → level_id로도 동일
        query = """
            SELECT id AS test_paper_id, title, total_questions, total_points, level_id AS tier
            FROM test_papers
            WHERE series = 'diagnostic'
        """
        params = []
        if args.tier:
            query += " AND level_id = %s"
            params.append(args.tier)
        query += " ORDER BY FIELD(level_id, 'sohssure','frege','russell','wittgenstein')"

        cur.execute(query, params)
        papers = cur.fetchall()
        print(f"진단 시험지 {len(papers)}개 로드")

        if not papers:
            print("대상 시험지가 없습니다. V0048 마이그레이션이 적용되었는지 확인하세요.")
            return

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

        print("\nPDF 생성 중...")
        ok, errs = 0, []
        for p in papers:
            tier = p["tier"]
            tier_label = TIER_LABELS.get(tier, tier)
            qs = by_paper.get(p["test_paper_id"], [])
            fname = f"diagnostic_{tier}"

            if not qs:
                errs.append(f"{tier_label}: 문제 없음")
                continue

            try:
                tex_content = generate_diag_tex(
                    tier, tier_label,
                    p["total_questions"], p["total_points"],
                    qs
                )

                if args.tex_only or args.keep_tex:
                    tex_path = os.path.join(OUTPUT_DIR, f"{fname}.tex")
                    with open(tex_path, "w", encoding="utf-8") as f:
                        f.write(tex_content)
                    if args.tex_only:
                        ok += 1
                        continue

                compile_tex(tex_content, f"{fname}.pdf")
                ok += 1
                print(f"  {ok}/{len(papers)} 완료: {tier_label}")
            except Exception as e:
                errs.append(f"{tier_label}: {e}")

        print(f"\n생성 완료: {ok}/{len(papers)} PDF")
        if errs:
            print(f"\n오류 {len(errs)}건:")
            for e in errs:
                print(f"  - {e}")

        if not args.no_upload and not args.tex_only and ok > 0:
            upload_to_s3()

        if not args.no_db and not args.tex_only and ok > 0:
            update_db(papers, tunnel.local_bind_port)

    print(f"\n출력 디렉토리: {OUTPUT_DIR}")
    if ok > 0 and not args.no_upload:
        print(f"PDF URL: https://{CF_DOMAIN}/test-pdfs/diagnostic_<tier>.pdf")


if __name__ == "__main__":
    main()
