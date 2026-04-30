#!/usr/bin/env python
"""프로 모드 챕터 테스트 시험지 PDF 생성 — SSH 터널 → DB → PDF"""

import json, os, re, sys, warnings
from collections import defaultdict
warnings.filterwarnings("ignore", category=DeprecationWarning)

from fpdf import FPDF, XPos, YPos
from sshtunnel import SSHTunnelForwarder
import mysql.connector

# ─── 설정 ───
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "generated", "test-pdfs")
FONT_PATH = "C:/Windows/Fonts/malgun.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/malgunbd.ttf"

SSH_HOST = "43.200.104.102"
SSH_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")
DB_HOST = "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com"
DB_USER = "admin"
DB_PASS = "xXoM4Ld7VAIYl9W874md5kic"
DB_NAME = "korfarm"

LEVEL_LABELS = {
    "saussure1": "소쉬르 1권", "saussure2": "소쉬르 2권", "saussure3": "소쉬르 3권",
    "frege1": "프레게 1권", "frege2": "프레게 2권", "frege3": "프레게 3권",
    "russell1": "러셀 1권", "russell2": "러셀 2권", "russell3": "러셀 3권",
}
CHOICE_LABELS = ["①", "②", "③", "④", "⑤"]


# ═══════════ PDF 클래스 ═══════════

class TestPDF(FPDF):
    def __init__(self, level_label, ch_num, total_pts, total_qs):
        super().__init__()
        self.level_label = level_label
        self.chapter_num = ch_num
        self.total_pts = total_pts
        self.total_qs = total_qs
        self.set_auto_page_break(auto=True, margin=20)
        self.add_font("MG", "", FONT_PATH)
        self.add_font("MG", "B", FONT_BOLD_PATH)

    def header(self):
        self.set_font("MG", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(100, 7, f"{self.level_label}  {self.chapter_num}장 챕터 테스트")
        self.set_font("MG", "", 8)
        self.cell(0, 7, f"{self.total_qs}문항 · {self.total_pts}점 만점 · 60분",
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")
        self.set_draw_color(180, 180, 180)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-15)
        self.set_font("MG", "", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"- {self.page_no()} -", align="C")


# ═══════════ 유틸 ═══════════

def clean(s):
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", "", s)
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    return s.strip()


def est_height(pdf, passage, stem, choices):
    """블록 높이 추정 (페이지 분할 방지)"""
    h = 8  # 문제 번호 줄
    if passage:
        h += len(pdf.multi_cell(166, 5, clean(passage), dry_run=True, output="LINES")) * 5 + 8
    h += len(pdf.multi_cell(175, 5.5, clean(stem), dry_run=True, output="LINES")) * 5.5 + 3
    for c in choices:
        h += len(pdf.multi_cell(162, 5, c, dry_run=True, output="LINES")) * 5 + 1
    return h + 6


def render_q(pdf, num, q):
    """한 문제 렌더링"""
    passage = q["passage"]
    stem = clean(q["stem"] or "")
    pts = q["points"]

    choices_raw = q["choices"]
    if isinstance(choices_raw, str):
        try:
            choices_raw = json.loads(choices_raw)
        except:
            choices_raw = []
    ctexts = []
    for i, c in enumerate(choices_raw or []):
        lab = CHOICE_LABELS[i] if i < len(CHOICE_LABELS) else f"({i+1})"
        txt = c.get("text", "") if isinstance(c, dict) else str(c)
        ctexts.append(f"{lab} {clean(txt)}")

    # 페이지 분할 방지
    bh = est_height(pdf, passage, stem, ctexts)
    if bh > (pdf.h - pdf.get_y() - pdf.b_margin) and pdf.get_y() > 50:
        pdf.add_page()

    # 문제 번호 + 배점
    pdf.set_font("MG", "B", 10)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 7, f"{num}. [{pts}점]", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # 지문
    if passage:
        pdf.set_font("MG", "", 9)
        pdf.set_text_color(60, 60, 60)
        x0 = pdf.get_x() + 4
        y0 = pdf.get_y()
        ptxt = clean(passage)
        lines = pdf.multi_cell(166, 5, ptxt, dry_run=True, output="LINES")
        bh2 = len(lines) * 5 + 6
        pdf.set_fill_color(245, 245, 245)
        pdf.set_draw_color(200, 200, 200)
        pdf.rect(x0 - 2, y0, 174, bh2, style="DF")
        pdf.set_xy(x0, y0 + 3)
        pdf.multi_cell(168, 5, ptxt, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

    # 발문
    pdf.set_font("MG", "", 10)
    pdf.set_text_color(20, 20, 20)
    pdf.multi_cell(0, 5.5, stem, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)

    # 선택지
    pdf.set_font("MG", "", 9.5)
    pdf.set_text_color(40, 40, 40)
    for ct in ctexts:
        pdf.set_x(18)
        pdf.multi_cell(170, 5, ct, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(0.5)
    pdf.ln(4)


def gen_pdf(paper, questions):
    lid = paper["level_id"]
    cn = paper["chapter_number"]
    ll = LEVEL_LABELS.get(lid, lid)

    pdf = TestPDF(ll, cn, paper["total_points"], paper["total_questions"])
    pdf.add_page()

    # 타이틀
    pdf.set_font("MG", "B", 16)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 12, f"{ll}  {cn}장 테스트", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(2)
    # 이름/날짜
    pdf.set_font("MG", "", 10)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(95, 8, "이름: ____________________", border=1)
    pdf.cell(95, 8, "날짜: ____________________", border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)

    for q in questions:
        render_q(pdf, q["number"], q)

    fname = f"{lid}_ch{cn:02d}.pdf"
    fpath = os.path.join(OUTPUT_DIR, fname)
    pdf.output(fpath)
    return fname


# ═══════════ 메인 ═══════════

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("SSH 터널 연결 중...")

    with SSHTunnelForwarder(
        SSH_HOST,
        ssh_username="ec2-user",
        ssh_pkey=SSH_KEY,
        remote_bind_address=(DB_HOST, 3306),
        local_bind_address=("127.0.0.1", 13306),
    ) as tunnel:
        print(f"터널 OK (로컬 포트 {tunnel.local_bind_port})")
        conn = mysql.connector.connect(
            host="127.0.0.1", port=tunnel.local_bind_port,
            user=DB_USER, password=DB_PASS, database=DB_NAME,
            charset="utf8mb4",
        )
        cur = conn.cursor(dictionary=True)

        # 시험지 목록
        cur.execute("""
            SELECT tp.id AS test_paper_id, tp.title, tp.total_questions, tp.total_points,
                   pc.level_id, pc.chapter_number
            FROM pro_chapter_tests pct
            JOIN test_papers tp ON tp.id = pct.test_paper_id
            JOIN pro_chapters pc ON pc.id = pct.chapter_id
            WHERE pct.status = 'active'
            ORDER BY pc.global_chapter_number
        """)
        papers = cur.fetchall()
        print(f"시험지 {len(papers)}개 로드")

        # 문제 전체
        cur.execute("""
            SELECT tq.test_id, tq.number, tq.type, tq.points, tq.domain,
                   tq.passage, tq.stem, tq.correct_answer, tq.choices_json AS choices
            FROM test_questions tq
            WHERE tq.test_id IN (
                SELECT pct.test_paper_id FROM pro_chapter_tests pct WHERE pct.status='active'
            )
            ORDER BY tq.test_id, tq.number
        """)
        all_qs = cur.fetchall()
        print(f"문제 {len(all_qs)}개 로드")

        by_paper = defaultdict(list)
        for q in all_qs:
            by_paper[q["test_id"]].append(q)

        conn.close()

    # PDF 생성
    print("PDF 생성 중...")
    ok, errs = 0, []
    for p in papers:
        qs = by_paper.get(p["test_paper_id"], [])
        if not qs:
            errs.append(f"{p['title']}: 문제 없음")
            continue
        try:
            gen_pdf(p, qs)
            ok += 1
            if ok % 30 == 0:
                print(f"  {ok}/{len(papers)} ...")
        except Exception as e:
            errs.append(f"{p['title']}: {e}")

    print(f"\n완료: {ok}/{len(papers)} PDF 생성")
    if errs:
        print(f"오류 {len(errs)}건:")
        for e in errs[:10]:
            print(f"  - {e}")
    print(f"출력: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
