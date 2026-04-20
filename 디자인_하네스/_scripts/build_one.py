# -*- coding: utf-8 -*-
"""
build_one.py
1권(4챕터)을 빌드: JSON → LaTeX → xelatex (더블) → PDF

사용:
  py -3 build_one.py 소쉬르1 1
  py -3 build_one.py 비트겐슈타인1 1
  (1권=ch1~4, 2권=ch5~8, ...)
"""
from __future__ import annotations
import os, sys, re, json, subprocess, shutil, glob
from pathlib import Path

HERE = Path(__file__).resolve().parent           # _scripts
HARNESS = HERE.parent                              # 디자인_하네스
ROOT = HARNESS.parent                              # 국어농장v2홈페이지
COMPONENTS = HARNESS / '_components'
STYLES = HARNESS / '_styles'
OUTPUT = HARNESS / 'output'
DRAFT = HARNESS / 'output' / 'draft'
ORIG = ROOT / '프로모드 원고'

# render_section import
sys.path.insert(0, str(HERE))
import render_section as RS

OUTPUT.mkdir(parents=True, exist_ok=True)
DRAFT.mkdir(parents=True, exist_ok=True)

# ============================================================
# 시리즈 매핑 — v3 페이지 압축 정책
# (sty, fs, series_opt) 형식. series_opt = base.cls가 받는 시리즈 옵션
#   seriesSau / seriesFre / seriesRus / seriesWit
# ----------------------------------------------------------------
# 폰트 정책:
#   소쉬르1·2: 13pt, 소쉬르3: 12pt   (목표 안 → 유지)
#   프레게1: 11pt (경계 유지), 프레게2: 10pt, 프레게3: 9.5pt
#   러셀1·2·3: 9pt
#   비트1·2·3: 8.5pt
# ============================================================
LEVEL_MAP = {
    '소쉬르1':       ('saussure', 'fs13',  'seriesSau'),
    '소쉬르2':       ('saussure', 'fs13',  'seriesSau'),
    '소쉬르3':       ('saussure', 'fs12',  'seriesSau'),
    '프레게1':       ('frege',    'fs11',  'seriesFre'),
    '프레게2':       ('frege',    'fs95',  'seriesFre'),
    '프레게3':       ('frege',    'fs9',   'seriesFre'),
    '러셀1':         ('russell',  'fs85',  'seriesRus'),
    '러셀2':         ('russell',  'fs9',   'seriesRus'),
    '러셀3':         ('russell',  'fs9',   'seriesRus'),
    '비트겐슈타인1': ('witt',     'fs85',  'seriesWit'),
    '비트겐슈타인2': ('witt',     'fs85',  'seriesWit'),
    '비트겐슈타인3': ('witt',     'fs85',  'seriesWit'),
}

def detect_series(level: str):
    """레벨별 (sty, fs, series_opt) 반환."""
    if level in LEVEL_MAP:
        return LEVEL_MAP[level]
    # fallback: 시리즈 prefix 기준
    for k, v in LEVEL_MAP.items():
        if level.startswith(k.rstrip('123')):
            return v
    return ('russell', 'fs9', 'seriesRus')


# ============================================================
# 입력 데이터 로드
# ============================================================
def load_general_chapter(level: str, ch: int):
    """일반 9레벨 챕터 JSON 로드. 파일명 패턴 가변(공백 유무)."""
    base = ORIG / level
    pattern = re.compile(rf'^{re.escape(level)}\s*\(?챕터\s*{ch}\)?\.json$')
    for f in os.listdir(base):
        if pattern.match(f):
            with open(base / f, encoding='utf-8') as fp:
                return json.load(fp)
    raise FileNotFoundError(f'{level} ch{ch} json not found in {base}')


def load_bit_chapter(level: str, ch: int):
    """비트 챕터 폴더에서 13파일 로드 (test.json 제외)."""
    base = ORIG / level / f'ch{ch:02d}'
    if not base.exists():
        raise FileNotFoundError(f'{base} not found')
    grammar = json.load(open(base / 'grammar.json', encoding='utf-8')) if (base/'grammar.json').exists() else None
    lits = []
    for i in range(1, 6):
        p = base / f'literature_{i:02d}.json'
        if p.exists():
            lits.append(json.load(open(p, encoding='utf-8')))
    reads = []
    for i in range(1, 6):
        p = base / f'reading_{i:02d}.json'
        if p.exists():
            reads.append(json.load(open(p, encoding='utf-8')))
    pattern_data = json.load(open(base / 'pattern.json', encoding='utf-8')) if (base/'pattern.json').exists() else None
    return {'grammar': grammar, 'literature': lits, 'reading': reads, 'pattern': pattern_data}


# ============================================================
# 영역 그룹핑
# ============================================================
def group_sections_by_area(sections: list) -> dict:
    """sections를 area로 그룹핑. 같은 area 안에서는 원본 순서 유지."""
    groups = {}
    order_seen = []
    for s in sections:
        if not isinstance(s, dict):
            continue
        if s.get('type') in ('answer_explain', 'model_answer'):
            continue
        area = s.get('area') or '기타'
        if area not in groups:
            groups[area] = []
            order_seen.append(area)
        groups[area].append(s)
    return groups, order_seen


def order_areas(groups_keys: list) -> list:
    """영역 순서 강제: 어휘 → 문법(어법) → 개념 → 문학 → 비문학 → 실력확인."""
    target_order = ['어휘', '문법', '어법', '개념', '문학', '비문학', '실력확인', '실력 확인']
    ordered = []
    for a in target_order:
        if a in groups_keys:
            ordered.append(a)
    # 그 외(알 수 없는 영역) 뒤에 첨부
    for a in groups_keys:
        if a not in ordered:
            ordered.append(a)
    return ordered


# ============================================================
# 챕터 LaTeX 생성
# ============================================================
def build_general_chapter_tex(level: str, ch: int) -> str:
    data = load_general_chapter(level, ch)
    sections = data.get('sections', [])
    meta = data.get('meta', {})
    title = meta.get('title') or f'{level} 챕터 {ch}'
    title = re.sub(r'\.md$', '', title)

    out = []
    out.append(rf'\kfChapterCover{{{ch}}}{{{RS.latex_escape(title)}}}{{Chapter {ch}}}{{이번 챕터의 학습 내용을 시작합니다.}}')
    out.append('')

    # 러셀+(러셀2/3): 문제 섹션 multicols
    use_qmulticol = level.startswith('러셀') and not level.endswith('1')

    groups, _ = group_sections_by_area(sections)
    for area in order_areas(list(groups.keys())):
        guide = ''
        if groups[area]:
            t0 = groups[area][0].get('title', '') or ''
            guide = f'{area} 영역 학습' if not t0 else f'{area} 영역 — {t0}'
        out.append(RS.area_header(area, guide))

        # 같은 영역 내에서 question 섹션을 묶기
        # 패스 1: 연속된 question 섹션을 buffer에 모아 한 번에 출력
        i = 0
        sec_list = groups[area]
        while i < len(sec_list):
            s = sec_list[i]
            t = s.get('type')
            if t == 'question':
                # 연속된 question 묶음
                bucket = []
                while i < len(sec_list) and sec_list[i].get('type') == 'question':
                    bucket.append(sec_list[i])
                    i += 1
                tex = RS.render_questions_grouped(bucket, area=area, use_multicol=use_qmulticol)
                if tex:
                    out.append(tex)
            else:
                tex = RS.render_section(s, area=area)
                if tex:
                    out.append(tex)
                i += 1
        out.append('')
    return '\n'.join(out)


def build_bit_chapter_tex(level: str, ch: int) -> str:
    bundle = load_bit_chapter(level, ch)
    out = []
    title = f'{level} ch{ch:02d}'
    out.append(rf'\kfChapterCover{{{ch}}}{{{RS.latex_escape(title)}}}{{Chapter {ch}}}{{이번 챕터: 문법 → 문학 5작품 → 비문학 5지문 → 패턴 워크북.}}')
    out.append('')

    # 문법
    if bundle.get('grammar'):
        out.append(RS.render_bit_grammar(bundle['grammar']))
        out.append('')
    # 문학
    if bundle.get('literature'):
        out.append(RS.area_header('문학', f"이번 챕터 문학 작품 {len(bundle['literature'])}편"))
        for i, lit in enumerate(bundle['literature'], 1):
            out.append(RS.render_bit_literature(lit, i))
            out.append('')
    # 비문학
    if bundle.get('reading'):
        out.append(RS.area_header('비문학', f"이번 챕터 비문학 지문 {len(bundle['reading'])}편"))
        for i, rd in enumerate(bundle['reading'], 1):
            out.append(RS.render_bit_reading(rd, i))
            out.append('')
    # 패턴
    if bundle.get('pattern'):
        out.append(RS.render_bit_pattern(bundle['pattern']))
        out.append('')
    return '\n'.join(out)


# ============================================================
# 1권(4챕터) 빌드
# ============================================================
def build_volume_tex(level: str, vol: int) -> str:
    """vol=1 → ch1~4, vol=2 → ch5~8, ..."""
    is_bit = level.startswith('비트겐슈타인')
    sty, fs, series_opt = detect_series(level)
    ch_start = (vol - 1) * 4 + 1
    ch_end = ch_start + 3

    # 비트3은 ch7까지만 존재 — vol1=ch1~4 OK
    chapters = []
    for ch in range(ch_start, ch_end + 1):
        try:
            if is_bit:
                tex = build_bit_chapter_tex(level, ch)
            else:
                tex = build_general_chapter_tex(level, ch)
            chapters.append(tex)
        except FileNotFoundError as e:
            print(f'[WARN] {level} ch{ch} 누락: {e}')
            continue

    series_pkg = f'korfarm-{sty}'

    preamble = rf"""\documentclass[{fs},{series_opt}]{{korfarm-base}}
\usepackage{{{series_pkg}}}

\input{{passage-note.tex}}
\input{{condition-box.tex}}
\input{{evidence-box.tex}}
\input{{choice-list.tex}}
\input{{answer-note.tex}}
\input{{question-block.tex}}
\input{{activity-table.tex}}
\input{{activity-vocab.tex}}
\input{{activity-blank.tex}}
\input{{activity-ox.tex}}
\input{{activity-connect.tex}}
\input{{activity-writing.tex}}
\input{{activity-structure.tex}}
\input{{activity-sentence-reading.tex}}
\input{{chapter-cover.tex}}
\input{{area-header.tex}}
\input{{section-header.tex}}

\begin{{document}}
"""

    # 표지(권 표지)
    cover = rf"""
\thispagestyle{{empty}}
\vspace*{{40mm}}
\begin{{center}}
{{\Huge\bfseries\color{{kfPrimary}} {RS.latex_escape(level)}}}\\[10pt]
{{\Large\color{{kfMute}} 학생용 교재 — 제 {vol} 권}}\\[20pt]
{{\small\color{{kfMute}} (챕터 {ch_start} \textendash{{}} {ch_end})}}
\end{{center}}
\vfill
\hfill\kfSeriesBadge\hspace{{15mm}}
\clearpage
"""

    body = '\n\n\\clearpage\n\n'.join(chapters)
    return preamble + cover + body + '\n\n\\end{document}\n'


# ============================================================
# 컴파일
# ============================================================
def compile_pdf(tex_name: str, work_dir: Path) -> tuple[bool, int, str]:
    """xelatex 더블 컴파일. (성공여부, 페이지수, 마지막 로그 발췌)."""
    # TEXINPUTS는 Windows에서 ;로 구분, 끝에 ; 두 개 = 표준 경로 추가
    components_p = str(COMPONENTS).replace('\\', '/')
    styles_p = str(STYLES).replace('\\', '/')
    texinputs = f'.;{components_p};{styles_p};;'
    env = os.environ.copy()
    env['TEXINPUTS'] = texinputs

    result = None
    for run in range(2):
        result = subprocess.run(
            ['xelatex', '-interaction=nonstopmode', '-halt-on-error', tex_name],
            cwd=str(work_dir), env=env,
            capture_output=True, text=True, encoding='utf-8', errors='replace',
            timeout=300,
        )
    log_path = work_dir / (Path(tex_name).stem + '.log')
    page_count = 0
    excerpt = ''
    if log_path.exists():
        try:
            log = log_path.read_text(encoding='utf-8', errors='replace')
            m = re.search(r'Output written on .*?\((\d+) pages?', log)
            if m:
                page_count = int(m.group(1))
            # 에러 라인 발췌
            err_lines = [ln for ln in log.splitlines() if ln.startswith('!') or 'Error' in ln]
            excerpt = '\n'.join(err_lines[:10])
        except Exception:
            pass
    success = (result.returncode == 0) and ((work_dir / (Path(tex_name).stem + '.pdf')).exists())
    return success, page_count, excerpt


def build_one(level: str, vol: int) -> dict:
    print(f'\n=== Build: {level} 권{vol} ===')
    tex = build_volume_tex(level, vol)
    out_name = f'{level}_{vol}권_학생용'
    tex_path = DRAFT / f'{out_name}.tex'
    tex_path.write_text(tex, encoding='utf-8')
    print(f'  tex written: {tex_path} ({len(tex):,} chars)')

    success, pages, excerpt = compile_pdf(tex_path.name, DRAFT)
    pdf_src = DRAFT / f'{out_name}.pdf'
    pdf_dst = OUTPUT / f'{out_name}.pdf'
    if pdf_src.exists():
        shutil.copy2(pdf_src, pdf_dst)
    return {
        'level': level, 'vol': vol, 'success': success,
        'pages': pages, 'pdf': str(pdf_dst) if pdf_src.exists() else None,
        'excerpt': excerpt,
    }


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: py -3 build_one.py <level> <vol>')
        sys.exit(2)
    level = sys.argv[1]
    vol = int(sys.argv[2])
    res = build_one(level, vol)
    print(json.dumps(res, ensure_ascii=False, indent=2))
