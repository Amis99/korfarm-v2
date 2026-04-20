# -*- coding: utf-8 -*-
"""
render_section.py
국어농장 V2 학생용 교재 섹션 → LaTeX 변환 라우터 (v2 — 디자인 하네스 v2)

피드백 반영:
- 1) 모든 지문 박스 + 우측 메모란 (어휘 영역 제외)
- 2) 마크다운 표 → tabularx 변환
- 3) 섹션 라벨 [지문]/[활동]/[문제] 헤더
- 4) 문제 번호만 (객관식 태그 제거) — kfQBlock 인자 #2 무시
- 5) 문장 독해 박스+묶음 양식
- 6) 영역 시작 \clearpage
- 7) 시 운문, 밑줄, 마크다운 정확 처리
- 8) 문제 그룹 minipage 무단절
- 추가: 러셀+/비트 → 문제 섹션 multicols 통합
"""
from __future__ import annotations
import re

# ============================================================
# LaTeX 이스케이프
# ============================================================
_LATEX_SPECIAL = {
    '\\': r'\textbackslash{}',
    '&': r'\&',
    '%': r'\%',
    '$': r'\$',
    '#': r'\#',
    '_': r'\_',
    '{': r'\{',
    '}': r'\}',
    '^': r'\textasciicircum{}',
    '~': r'\textasciitilde{}',
}

def latex_escape(text: str) -> str:
    """LaTeX 특수 문자 이스케이프 (텍스트용)."""
    if text is None:
        return ''
    if not isinstance(text, str):
        text = str(text)
    # 1. 제어 문자 제거 (탭·개행은 보존)
    text = ''.join(ch for ch in text if ch >= ' ' or ch in '\n\r\t')
    # 2. 폰트 미지원 이모지/기호 제거 또는 대체
    text = _strip_unsupported_glyphs(text)
    out = []
    for ch in text:
        out.append(_LATEX_SPECIAL.get(ch, ch))
    return ''.join(out)


# Noto Sans KR 미지원 글리프 처리
_GLYPH_REPLACE = {
    '⭐': '*', '✓': 'O', '✔': 'O', '✗': 'X', '✘': 'X',
    '☆': '*', '★': '*', '♡': '하트', '♥': '하트',
    '☞': '→', '☜': '←', '☝': '↑', '☟': '↓',
}
_UNSUPPORTED_RANGES = [
    (0x2600, 0x27BF),   # Misc symbols, Dingbats
    (0x1F300, 0x1FAFF), # Emoji
]
def _strip_unsupported_glyphs(s: str) -> str:
    out = []
    for ch in s:
        if ch in _GLYPH_REPLACE:
            out.append(_GLYPH_REPLACE[ch])
            continue
        cp = ord(ch)
        skip = False
        for lo, hi in _UNSUPPORTED_RANGES:
            if lo <= cp <= hi:
                skip = True
                break
        if not skip:
            out.append(ch)
    return ''.join(out)


# ============================================================
# 인라인 마크다운 변환 (이스케이프 후 일부 명령 복원)
# ============================================================
# 우선 보호 토큰 → 이스케이프 → 토큰 복원
def _inline_to_latex(s: str) -> str:
    if s is None:
        return ''
    if not isinstance(s, str):
        s = str(s)
    # 보호: <u>, **bold**, *italic*  (단, * 는 한국어 본문에 흔치 않으므로 보존적 처리)
    # 마커 치환: 유니코드 사설 영역 사용
    PH = {
        'U_OPEN':  '\uE001', 'U_CLOSE': '\uE002',
        'B_OPEN':  '\uE003', 'B_CLOSE': '\uE004',
        'I_OPEN':  '\uE005', 'I_CLOSE': '\uE006',
    }
    s = re.sub(r'<u>(.*?)</u>', PH['U_OPEN'] + r'\1' + PH['U_CLOSE'], s, flags=re.DOTALL)
    s = re.sub(r'\*\*(.+?)\*\*', PH['B_OPEN'] + r'\1' + PH['B_CLOSE'], s, flags=re.DOTALL)
    # *italic*는 ** 처리 후. 양옆이 단어 경계인 경우만.
    s = re.sub(r'(?<![\*\w])\*([^\s\*][^\*]*?)\*(?![\*\w])', PH['I_OPEN'] + r'\1' + PH['I_CLOSE'], s)
    # \_\_\_ 같은 마크다운 이스케이프 표현을 일반 _ 로 복원 (이후 latex 이스케이프 됨)
    s = re.sub(r'\\_', '_', s)
    s = re.sub(r'\\\*', '*', s)
    s = re.sub(r'\\\\', '\\\\', s)  # noop, 그대로 유지
    # 이스케이프
    esc = latex_escape(s)
    # 토큰 복원
    esc = esc.replace(PH['U_OPEN'], r'\uline{').replace(PH['U_CLOSE'], '}')
    esc = esc.replace(PH['B_OPEN'], r'\textbf{').replace(PH['B_CLOSE'], '}')
    esc = esc.replace(PH['I_OPEN'], r'\textit{').replace(PH['I_CLOSE'], '}')
    return esc


def render_inline(text, preserve_newlines: bool = False, is_verse: bool = False) -> str:
    """
    인라인 텍스트 렌더 — <u>/bold/italic + 줄바꿈 정책.
    is_verse=True: 행 = \\\\[4pt], 연(빈 줄) = \\\\[14pt]
    preserve_newlines=True: 일반 줄바꿈 = \\\\
    그 외: 단락(\n\n) → \par, 단일 줄바꿈 → 공백
    """
    if text is None:
        return ''
    s = str(text) if not isinstance(text, str) else text

    if is_verse:
        # 단락 분리(빈 줄) → 연 구분
        paras = re.split(r'\n\s*\n', s)
        out_paras = []
        for pi, p in enumerate(paras):
            lines = [ln.rstrip() for ln in p.split('\n') if ln.strip() != '']
            esc_lines = [_inline_to_latex(ln) for ln in lines]
            joined = ' \\\\[4pt]\n'.join(esc_lines)
            out_paras.append(joined)
        return ' \\\\[14pt]\n'.join(out_paras)

    if preserve_newlines:
        paras = re.split(r'\n\s*\n', s)
        out_paras = []
        for p in paras:
            lines = p.split('\n')
            esc_lines = [_inline_to_latex(ln) for ln in lines]
            out_paras.append(' \\\\\n'.join(esc_lines))
        return '\n\n'.join(out_paras)

    # 기본: 단락 단위로 분리(\n\n) → \par, 한 줄 \n은 공백
    paras = re.split(r'\n\s*\n', s)
    return ('\n\n').join(_inline_to_latex(p.replace('\n', ' ')) for p in paras)


def render_inline_oneline(text) -> str:
    """텍스트 명령 인자 안에 들어갈 한 줄 텍스트 — 줄바꿈 모두 공백."""
    if text is None:
        return ''
    s = str(text) if not isinstance(text, str) else text
    s = re.sub(r'\s+', ' ', s).strip()
    return _inline_to_latex(s)


# ============================================================
# 마크다운 표 → LaTeX tabular 변환
# ============================================================
_MD_TABLE_RE = re.compile(
    r'(?:^|\n)([ \t]*\|[^\n]+\|[ \t]*\n[ \t]*\|[ \t]*[:\-\| \t]+\|[ \t]*(?:\n[ \t]*\|[^\n]+\|[ \t]*)+)',
    re.MULTILINE
)

def _md_table_to_tex(md_block: str) -> str:
    """마크다운 표 블록 → tabular (adjustbox 래핑) LaTeX."""
    lines = [ln.strip() for ln in md_block.strip().split('\n') if ln.strip()]
    if len(lines) < 2:
        return _inline_to_latex(md_block)
    # 셀 분리 함수
    def split_row(row):
        # 좌우 | 제거 후 | 으로 split
        body = row.strip()
        if body.startswith('|'):
            body = body[1:]
        if body.endswith('|'):
            body = body[:-1]
        # \|는 셀 구분자 아님 → 임시 토큰
        body = body.replace(r'\|', '\uE010')
        cells = body.split('|')
        cells = [c.replace('\uE010', '|').strip() for c in cells]
        return cells

    header_cells = split_row(lines[0])
    sep_cells = split_row(lines[1])
    data_rows = [split_row(r) for r in lines[2:]]
    n = len(header_cells)
    # 정렬 추출
    aligns = []
    for sc in sep_cells:
        sc = sc.strip()
        if sc.startswith(':') and sc.endswith(':'):
            aligns.append('c')
        elif sc.endswith(':'):
            aligns.append('r')
        elif sc.startswith(':'):
            aligns.append('l')
        else:
            aligns.append('l')
    # 컬럼 폭: 셀 길이 기반 가중치
    widths = []
    for ci in range(n):
        max_len = max(
            [len(header_cells[ci]) if ci < len(header_cells) else 0] +
            [len(r[ci]) if ci < len(r) else 0 for r in data_rows]
        )
        widths.append(max(max_len, 4))
    total = sum(widths) or 1
    # 각 컬럼 폭을 \linewidth 비율로
    col_specs = []
    for ci in range(n):
        a = aligns[ci]
        align_cmd = {
            'l': r'\raggedright\arraybackslash',
            'c': r'\centering\arraybackslash',
            'r': r'\raggedleft\arraybackslash',
        }[a]
        # 각 컬럼: \dimexpr (widths[ci]/total)\linewidth - 12pt
        ratio = widths[ci] / total
        col_specs.append(r'|>{' + align_cmd + r'}p{\dimexpr ' + f'{ratio:.4f}' + r'\linewidth-12pt\relax}')
    col_spec = ''.join(col_specs) + '|'

    out = []
    out.append(r'\par\medskip\needspace{4\baselineskip}')
    out.append(r'\noindent\begin{adjustbox}{max width=\linewidth, center}')
    out.append(r'\renewcommand{\arraystretch}{1.45}')
    out.append(r'\arrayrulecolor{kfRule}')
    out.append(r'\begin{tabular}{' + col_spec + r'}')
    out.append(r'\hline')
    out.append(r'\rowcolor{kfPrimaryLight!50}' +
               ' & '.join(r'\textbf{\color{kfPrimary} ' + _inline_to_latex(c) + '}' for c in header_cells) +
               r' \\\hline')
    for r in data_rows:
        # 셀 부족분 채움
        cells = list(r) + [''] * max(0, n - len(r))
        cells = cells[:n]
        rendered = [_inline_to_latex(c) if c else r'\rule[-1.0em]{0pt}{2.4em}' for c in cells]
        out.append(' & '.join(rendered) + r' \\\hline')
    out.append(r'\end{tabular}')
    out.append(r'\arrayrulecolor{black}')
    out.append(r'\end{adjustbox}\par\medskip')
    return '\n'.join(out)


def render_markdown_block(text: str) -> str:
    """
    마크다운 블록 텍스트 렌더:
    - 표 블록은 _md_table_to_tex
    - 그 외는 render_inline (단락/줄바꿈)
    """
    if not text:
        return ''
    if not isinstance(text, str):
        text = str(text)
    # 표 블록 추출
    parts = []
    last = 0
    for m in _MD_TABLE_RE.finditer(text):
        if m.start() > last:
            chunk = text[last:m.start()]
            if chunk.strip():
                parts.append(('text', chunk))
        parts.append(('table', m.group(1)))
        last = m.end()
    if last < len(text):
        chunk = text[last:]
        if chunk.strip():
            parts.append(('text', chunk))

    out = []
    for kind, val in parts:
        if kind == 'table':
            out.append(_md_table_to_tex(val))
        else:
            out.append(render_inline(val))
    return '\n\n'.join(out)


# ============================================================
# 영역 헤더
# ============================================================
AREA_MACROS = {
    '어휘': r'\kfStartVocab',
    '문법': r'\kfStartGrammar',
    '어법': r'\kfStartGrammar',
    '개념': r'\kfStartConcept',
    '문학': r'\kfStartLit',
    '비문학': r'\kfStartNonlit',
    '실력확인': r'\kfStartWeekly',
    '실력 확인': r'\kfStartWeekly',
}

AREA_COLORS = {
    '어휘': 'kfAreaVocab',
    '문법': 'kfAreaGrammar',
    '어법': 'kfAreaGrammar',
    '개념': 'kfAreaConcept',
    '문학': 'kfAreaLiterature',
    '비문학': 'kfAreaNonlit',
    '실력확인': 'kfAreaWeekly',
    '실력 확인': 'kfAreaWeekly',
}

AREA_ORDER = ['어휘', '문법', '어법', '개념', '문학', '비문학', '실력확인', '실력 확인']


def area_header(area: str, guide: str = '') -> str:
    macro = AREA_MACROS.get(area, r'\kfStartConcept')
    g = render_inline_oneline(guide) if guide else f'{area} 영역 학습'
    return f'{macro}{{{g}}}\n\n'


def section_label(area: str, kind: str, sub: str = '') -> str:
    """
    섹션 라벨 헤더. kind ∈ {지문, 활동, 문제}.
    """
    color = AREA_COLORS.get(area, 'kfAreaConcept')
    sub_l = render_inline_oneline(sub) if sub else ''
    return r'\kfSecHeader{' + color + '}{' + kind + '}{' + sub_l + '}\n'


# ============================================================
# 섹션 라우팅
# ============================================================
def render_section(section: dict, area: str = '') -> str:
    """섹션 객체 → LaTeX 문자열. 학생용에서 무시되는 타입은 빈 문자열."""
    if not isinstance(section, dict):
        return ''
    t = section.get('type')
    if t in ('answer_explain', 'model_answer'):
        return ''

    a = area or section.get('area', '') or ''

    if t == 'concept':
        return render_concept(section, a)
    if t == 'vocab_list':
        return render_vocab_list(section, a)
    if t == 'passage':
        return render_passage(section, a)
    if t == 'activity':
        return render_activity(section, a)
    if t == 'question':
        return render_question(section, a)
    if t == 'writing':
        return render_writing(section, a)
    if t == 'section_group':
        return render_weekly(section, a)
    return ''


# ----- concept -----
def render_concept(s: dict, area: str = '') -> str:
    title = s.get('title', '') or ''
    c = s.get('content', {})
    text = c.get('text', '') if isinstance(c, dict) else ''
    examples = c.get('examples', []) if isinstance(c, dict) else []
    out = []
    if title:
        out.append(section_label(area, '개념', title))
    if text:
        out.append(render_markdown_block(text))
    if examples:
        out.append(r'\par\medskip\begin{itemize}[leftmargin=18pt, itemsep=2pt, topsep=2pt, label=\textbullet]')
        for ex in examples:
            out.append(r'\item ' + render_inline(ex))
        out.append(r'\end{itemize}')
    out.append('')
    return '\n'.join(out)


# ----- vocab_list (어휘 영역 — 메모란 사용 안 함) -----
def render_vocab_list(s: dict, area: str = '') -> str:
    title = s.get('title', '') or ''
    c = s.get('content', {})
    items = c.get('items', []) if isinstance(c, dict) else []
    out = []
    if title:
        out.append(section_label(area or '어휘', '어휘', title))
    out.append(r'\begin{kfVocab}')
    for i, it in enumerate(items, 1):
        meaning = it.get('meaning', '') if isinstance(it, dict) else ''
        out.append(r'\kfVocabItem{' + str(i) + '}{' + render_inline(meaning) + '}')
    out.append(r'\end{kfVocab}')
    out.append('')
    return '\n'.join(out)


# ----- passage -----
def render_passage(s: dict, area: str = '') -> str:
    title = s.get('title', '') or ''
    c = s.get('content', {})
    if isinstance(c, dict):
        text = c.get('text', '')
        ptitle = c.get('title', '') or title
        source = c.get('source', '') or ''
    else:
        text = c if isinstance(c, str) else ''
        ptitle = title
        source = ''
    text = _coerce_text(text)
    if not ptitle and source:
        ptitle = source
    elif source and source not in ptitle:
        ptitle = (ptitle + ' / ' + source) if ptitle else source
    if not ptitle:
        ptitle = '지문'
    is_verse = _looks_like_verse(text)
    body = render_inline(text, is_verse=is_verse)

    sec = section_label(area, '지문', ptitle)
    use_memo = (area != '어휘')
    if use_memo:
        return (sec +
                r'\kfPassageNote{' + latex_escape(ptitle) + '}{%' + '\n' +
                body + '\n' +
                r'}' + '\n\n')
    else:
        return (sec +
                r'\kfPassageFull{' + latex_escape(ptitle) + '}{%' + '\n' +
                body + '\n' +
                r'}' + '\n\n')


def _looks_like_verse(text) -> bool:
    if not text or not isinstance(text, str):
        return False
    lines = [ln.strip() for ln in text.split('\n') if ln.strip()]
    if len(lines) < 3:
        return False
    short = sum(1 for ln in lines if len(ln) <= 28)
    return short / max(1, len(lines)) >= 0.55


def _coerce_text(text):
    if isinstance(text, dict):
        try:
            parts = sorted(text.items(), key=lambda kv: (int(re.sub(r'\D', '', str(kv[0])) or 0), str(kv[0])))
        except Exception:
            parts = list(text.items())
        return '\n\n'.join(str(v) for _, v in parts)
    if isinstance(text, list):
        return '\n\n'.join(str(x) for x in text)
    if text is None:
        return ''
    return str(text) if not isinstance(text, str) else text


# ----- activity -----
def render_activity(s: dict, area: str = '') -> str:
    sub = (s.get('subtype') or '').strip()
    title = s.get('title', '') or ''
    c = s.get('content', {})
    if not isinstance(c, dict):
        c = {}
    instruction = c.get('instruction', '') or ''

    head = section_label(area, '활동', title or sub or '활동')
    if instruction:
        head += r'\noindent\textit{\small ' + render_inline_oneline(instruction) + r'}\par\medskip' + '\n'

    items = c.get('items', []) or []

    # 라우팅
    if sub in ('OX',):
        return head + _render_ox(items)
    if sub in ('연결',):
        return head + _render_connect(items)
    if sub in ('빈칸', '빈칸형', '괄호_선택형'):
        return head + _render_blank(items)
    if sub in ('글쓰기',):
        return head + _render_writing_activity(c, items)
    if sub in ('구조도',):
        return head + _render_structure_diagram(c, items)
    if sub in ('어휘',):
        return head + _render_vocab_act(items)
    if sub in ('내용확인', '내용_확인', '정리표'):
        return head + _render_table_activity(c)
    if sub in ('문장독해', '문장_독해'):
        return head + _render_sentence_reading(c)
    if sub in ('해설학습', '해설_학습'):
        return head + _render_unit_learning(c, area)
    if sub in ('분석훈련', '분석_훈련', '어법_훈련', '지시어', '지시어_연결', '해설_문제'):
        return head + _render_analysis_train(c, items, area)
    # fallback
    return head + _render_analysis_train(c, items, area)


def _render_ox(items):
    if not items:
        return ''
    out = [r'\begin{kfOXList}']
    for it in items:
        stem = it.get('stem', '') if isinstance(it, dict) else str(it)
        out.append(r'\kfOXItem ' + render_inline(stem) + r' \kfOX')
    out.append(r'\end{kfOXList}')
    out.append('')
    return '\n'.join(out)


def _render_connect(items):
    pairs = []
    for it in items:
        if isinstance(it, dict):
            left = it.get('left') or it.get('term') or ''
            right = it.get('right') or it.get('meaning') or ''
            if not left and not right:
                stem = it.get('stem', '') or ''
                m = re.split(r'•\s*[\u2022\-\u2014]?\s*•', stem)
                if len(m) == 2:
                    left, right = m[0].strip(), m[1].strip()
                else:
                    parts = re.split(r'\s{4,}', stem)
                    if len(parts) >= 2:
                        left, right = parts[0].strip(), parts[-1].strip()
                    else:
                        left, right = stem.strip(), ''
            pairs.append((left, right))
        else:
            pairs.append((str(it), ''))
    if not pairs:
        return ''
    out = [r'\begin{kfConnect}']
    for l, r in pairs:
        out.append(r'\kfPair{' + render_inline_oneline(l) + '}{' + render_inline_oneline(r) + '}')
    out.append(r'\end{kfConnect}')
    out.append('')
    return '\n'.join(out)


def _render_blank(items):
    if not items:
        return ''
    out = [r'\begin{kfBlankList}']
    for it in items:
        if not isinstance(it, dict):
            out.append(r'\kfBlankItem ' + render_inline(str(it)))
            continue
        stem = it.get('stem', '') or ''
        out.append(r'\kfBlankItem ' + render_inline(stem))
        box = it.get('box')
        if box:
            box_text = '\n'.join(box) if isinstance(box, list) else str(box)
            out.append(r'\begin{kfEvidence}' + render_inline(box_text) + r'\end{kfEvidence}')
        choices = it.get('choices') or []
        if choices:
            out.append(r'\begin{kfChoices}')
            for ch in choices:
                txt = ch.get('text') if isinstance(ch, dict) else str(ch)
                txt = re.sub(r'^[\s]*[\u2460\u2461\u2462\u2463\u2464\u2465\u2466\u2467\u2468]\s*', '', txt or '')
                out.append(r'\kfChoice ' + render_inline(txt))
            out.append(r'\end{kfChoices}')
    out.append(r'\end{kfBlankList}')
    out.append('')
    return '\n'.join(out)


def _render_writing_activity(c, items):
    prompt_obj = c.get('prompt') if isinstance(c, dict) else None
    out = []
    if items:
        for it in items:
            if not isinstance(it, dict):
                continue
            stem = it.get('stem', '') or ''
            if stem:
                out.append(r'\kfWritingPrompt{' + render_inline(stem) + '}')
            out.append(r'\kfWriting{답안 작성}{8}')
    elif prompt_obj:
        prompt_text = prompt_obj
        if isinstance(prompt_obj, str):
            try:
                import json as _j
                pj = _j.loads(prompt_obj)
                if isinstance(pj, dict):
                    prompt_text = pj.get('문제') or pj.get('prompt') or prompt_obj
            except Exception:
                prompt_text = prompt_obj
        out.append(r'\kfWritingPrompt{' + render_inline(str(prompt_text)) + '}')
        out.append(r'\kfWriting{답안 작성}{10}')
    out.append('')
    return '\n'.join(out)


def _render_structure_diagram(c, items):
    """
    구조도: diagram(마크다운 트리 텍스트)이 있으면 들여쓰기 보존하여 박스로,
    없으면 items 사용.
    """
    out = []
    diagram = c.get('diagram')
    if diagram and isinstance(diagram, str):
        # 마크다운 불릿 트리 → 들여쓰기 텍스트로 보존
        lines = []
        for ln in diagram.split('\n'):
            if not ln.strip():
                lines.append('')
                continue
            # 들여쓰기 단계 판정 (* 앞 공백 수)
            m = re.match(r'^(\s*)([*\-])\s+(.*)$', ln)
            if m:
                indent = len(m.group(1))
                level = indent // 2  # 2공백당 1단계
                pref = '\\quad' * level
                content = m.group(3)
                # ( ① ) 같은 마커 강조
                content_l = _inline_to_latex(content)
                lines.append(r'\noindent ' + pref + r'\textbullet\ ' + content_l + r' \\')
            else:
                lines.append(_inline_to_latex(ln) + r' \\')
        body = '\n'.join(lines)
        out.append(r'\par\medskip\needspace{6\baselineskip}')
        out.append(r'\begin{tcolorbox}[enhanced, breakable=false,')
        out.append(r'  colback=kfPaper, colframe=kfRule, boxrule=0.4pt, arc=2pt,')
        out.append(r'  left=10pt, right=10pt, top=8pt, bottom=8pt,')
        out.append(r'  title={\footnotesize\bfseries\color{kfMute} 글의 구조도},')
        out.append(r'  coltitle=kfMute, colbacktitle=kfPrimaryLight!40,')
        out.append(r'  attach boxed title to top left={yshift=-1.5mm, xshift=6pt},')
        out.append(r'  boxed title style={colframe=kfRule, boxrule=0.3pt, arc=1pt}]')
        out.append(r'\setstretch{1.4}\footnotesize')
        out.append(body)
        out.append(r'\end{tcolorbox}\par\medskip')
        return '\n'.join(out)

    # items 기반 폴백
    if not items:
        return ''
    out.append(r'\begin{kfStructure}')
    for it in items:
        label = it.get('category') or it.get('label') or it.get('stem') or ''
        content = it.get('content') or it.get('answer') or ''
        out.append(r'\kfNode{0}{' + render_inline_oneline(label) + '}{' + render_inline_oneline(content) + '}')
    out.append(r'\end{kfStructure}')
    out.append('')
    return '\n'.join(out)


def _render_vocab_act(items):
    if not items:
        return ''
    out = [r'\begin{kfVocab}']
    for i, it in enumerate(items, 1):
        if isinstance(it, dict):
            meaning = it.get('meaning') or it.get('stem') or ''
        else:
            meaning = str(it)
        out.append(r'\kfVocabItem{' + str(i) + '}{' + render_inline(meaning) + '}')
    out.append(r'\end{kfVocab}')
    out.append('')
    return '\n'.join(out)


def _render_table_activity(c):
    """내용확인 활동: table_text(마크다운 표) 변환."""
    out = []
    table_text = c.get('table_text', '') or ''
    if not table_text:
        return ''
    # table_text는 마크다운 표 + 주변 텍스트 혼합 가능
    out.append(render_markdown_block(table_text))
    return '\n'.join(out) + '\n'


def _render_sentence_reading(c):
    """
    문장 독해: passages(번호+text 리스트) + items(번호/sentence_ref/stem/choices).
    같은 sentence_ref(또는 같은 number)에 묶인 문제는 하나의 kfSentenceUnit.
    """
    passages = c.get('passages') or []
    items = c.get('items') or []
    if not passages and not items:
        return ''

    # passages를 number 키로 인덱싱
    p_by_num = {}
    for p in passages:
        if isinstance(p, dict):
            num = str(p.get('number', '')).strip()
            text = p.get('text', '') or ''
            p_by_num[num] = text

    # 문장 묶음 결정: sentence_ref가 있으면 그 키로, 없으면 number 키로 묶음
    # 키 순서는 첫 등장 순.
    groups = []  # [(sent_num, [items])]
    seen_keys = []
    group_map = {}
    for it in items:
        if not isinstance(it, dict):
            continue
        ref = str(it.get('sentence_ref') or '').strip()
        if not ref:
            ref = str(it.get('number', '')).strip() or '?'
        if ref not in group_map:
            group_map[ref] = []
            seen_keys.append(ref)
        group_map[ref].append(it)
    for k in seen_keys:
        groups.append((k, group_map[k]))

    out = []
    for sent_num, qs in groups:
        sent_text = p_by_num.get(sent_num, '')
        # 박스+문제 묶음
        out.append(r'\begin{kfSentenceUnit}{' + latex_escape(sent_num) + '}{' +
                   render_inline(sent_text) + '}')
        for q in qs:
            num = str(q.get('number', '')).strip()
            stem = q.get('stem', '') or ''
            # stem 안에 (1)/(2) 같은 소제목 + 본 발문 같이 들어있을 수 있음 → 그대로
            if num:
                out.append(r'\kfSentQ{' + latex_escape(num) + '.}{' + render_inline(stem) + '}')
            else:
                out.append(r'\par\noindent ' + render_inline(stem) + r'\par\smallskip')
            choices = q.get('choices') or []
            if choices:
                out.append(r'\begin{kfChoices}')
                for ch in choices:
                    txt = ch.get('text') if isinstance(ch, dict) else str(ch)
                    txt = re.sub(r'^[\s]*[\u2460\u2461\u2462\u2463\u2464\u2465\u2466\u2467\u2468]\s*', '', txt or '')
                    out.append(r'\kfChoice ' + render_inline(txt))
                out.append(r'\end{kfChoices}')
            else:
                out.append(r'\kfAnswerLines{1}')
        out.append(r'\end{kfSentenceUnit}')
        out.append('')
    return '\n'.join(out)


def _render_unit_learning(c, area):
    """
    해설학습: units 리스트 = [{unit_number, passage, items:[{number,stem,answer}]}].
    각 단원: 해설 박스(작은 메모란 함께) + 그에 묶인 문제들 (multicols 권장).
    """
    units = c.get('units') or []
    out = []
    for u in units:
        if not isinstance(u, dict):
            continue
        unum = u.get('unit_number', '')
        passage = u.get('passage', '') or ''
        items = u.get('items') or []
        if passage:
            out.append(r'\par\noindent\textbf{\color{kfPrimary} 해설 단원 ' + latex_escape(str(unum)) + '}\par\smallskip')
            out.append(r'\kfPassageNote{해설 ' + latex_escape(str(unum)) + '}{%')
            out.append(render_inline(passage))
            out.append(r'}')
            out.append('')
        for q in items:
            if not isinstance(q, dict):
                continue
            num = str(q.get('number', '')).strip()
            stem = q.get('stem', '') or ''
            out.append(r'\begin{kfQBlock}{' + latex_escape(num) + '}{문제}')
            out.append(r'\kfQStem{' + render_inline(stem) + '}')
            choices = q.get('choices') or []
            if choices:
                out.append(r'\begin{kfChoices}')
                for ch in choices:
                    txt = ch.get('text') if isinstance(ch, dict) else str(ch)
                    txt = re.sub(r'^[\s]*[\u2460\u2461\u2462\u2463\u2464\u2465\u2466\u2467\u2468]\s*', '', txt or '')
                    out.append(r'\kfChoice ' + render_inline(txt))
                out.append(r'\end{kfChoices}')
            else:
                out.append(r'\kfAnswerLines{1}')
            out.append(r'\end{kfQBlock}')
            out.append('')
    return '\n'.join(out)


def _render_analysis_train(c, items, area):
    """분석훈련, 어법훈련 등 일반 활동."""
    out = []
    if not items:
        return ''
    out.append(r'\begin{enumerate}[leftmargin=22pt, itemsep=6pt, topsep=4pt, label=\textbf{\arabic*.}]')
    for it in items:
        if not isinstance(it, dict):
            out.append(r'\item ' + render_inline(str(it)))
            continue
        stem = it.get('stem', '') or ''
        out.append(r'\item ' + render_inline(stem))
        box = it.get('box') or it.get('view')
        if box:
            box_text = '\n'.join(box) if isinstance(box, list) else str(box)
            if box_text.strip():
                out.append(r'\begin{kfEvidence}' + render_inline(box_text) + r'\end{kfEvidence}')
        choices = it.get('choices') or []
        if choices:
            out.append(r'\begin{kfChoices}')
            for ch in choices:
                txt = ch.get('text') if isinstance(ch, dict) else str(ch)
                txt = re.sub(r'^[\s]*[\u2460\u2461\u2462\u2463\u2464\u2465\u2466\u2467\u2468]\s*', '', txt or '')
                out.append(r'\kfChoice ' + render_inline(txt))
            out.append(r'\end{kfChoices}')
        # 정답란 표시 안 함 (학생용); 단답형 stem은 종이 위에 직접 작성 가정
    out.append(r'\end{enumerate}')
    out.append('')
    return '\n'.join(out)


# ----- question -----
def render_question(s: dict, area: str = '') -> str:
    """단일 question 섹션 렌더 — 보통 build에서 묶어서 처리되지만 fallback 용."""
    sub = (s.get('subtype') or '').strip()
    c = s.get('content', {})
    if not isinstance(c, dict):
        return ''
    items = c.get('items', []) or []
    answer_format = c.get('answer_format')

    out = []
    for idx, it in enumerate(items, 1):
        if not isinstance(it, dict):
            continue
        out.append(_render_one_question(it, sub, idx))
    if answer_format and items:
        out.append(r'\par\noindent\textit{\small ' + render_inline_oneline(str(answer_format)) + '}')
    return '\n'.join(out) + '\n'


def _render_one_question(it: dict, sub: str, idx: int) -> str:
    num = it.get('number') or idx
    stem = it.get('stem', '') or ''
    choices = it.get('choices') or []
    box = it.get('box')

    out = []
    out.append(r'\begin{kfQBlock}{' + latex_escape(str(num)) + '}{}')
    out.append(r'\kfQStem{' + render_inline(stem) + '}')
    if box:
        box_text = '\n'.join(box) if isinstance(box, list) else str(box)
        if box_text.strip():
            out.append(r'\begin{kfEvidence}' + render_inline(box_text) + r'\end{kfEvidence}')
    if choices:
        out.append(r'\begin{kfChoices}')
        for ch in choices:
            txt = ch.get('text') if isinstance(ch, dict) else str(ch)
            txt = re.sub(r'^[\s]*[\u2460\u2461\u2462\u2463\u2464\u2465\u2466\u2467\u2468]\s*', '', txt or '')
            out.append(r'\kfChoice ' + render_inline(txt))
        out.append(r'\end{kfChoices}')
    else:
        if sub == '서술형':
            out.append(r'\kfAnswerNote{답안}{4}')
        elif sub == '단답형':
            out.append(r'\kfAnswerLines{1}')
        else:
            out.append(r'\kfAnswerLines{2}')
    out.append(r'\end{kfQBlock}')
    return '\n'.join(out)


def render_questions_grouped(question_sections: list, area: str = '', use_multicol: bool = False) -> str:
    """
    여러 question 섹션(객관식/단답형/서술형)을 한 [문제] 라벨 아래에 통합 렌더.
    use_multicol=True면 multicols로 묶음 (러셀+/비트 권장).
    """
    if not question_sections:
        return ''
    out = []
    out.append(section_label(area, '문제', ''))
    if use_multicol:
        out.append(r'\begin{multicols}{2}\raggedcolumns\setlength{\columnsep}{12pt}')
    counter = 0
    for s in question_sections:
        sub = (s.get('subtype') or '').strip()
        c = s.get('content', {})
        if not isinstance(c, dict):
            continue
        items = c.get('items', []) or []
        for it in items:
            if not isinstance(it, dict):
                continue
            counter += 1
            # 원본 number를 우선 사용, 없으면 일련번호
            if not it.get('number'):
                it = dict(it)
                it['number'] = counter
            out.append(_render_one_question(it, sub, counter))
        if c.get('answer_format'):
            out.append(r'\par\noindent\textit{\small ' + render_inline_oneline(str(c['answer_format'])) + '}')
    if use_multicol:
        out.append(r'\end{multicols}')
    return '\n'.join(out) + '\n'


# ----- writing -----
def render_writing(s: dict, area: str = '') -> str:
    title = s.get('title', '') or ''
    c = s.get('content', {})
    prompt = ''
    if isinstance(c, dict):
        prompt = c.get('prompt') or ''
    elif isinstance(c, str):
        prompt = c
    out = [section_label(area, '글쓰기', title)]
    if prompt:
        ptext = prompt
        if isinstance(prompt, str) and prompt.strip().startswith('{'):
            try:
                import json as _j
                pj = _j.loads(prompt)
                if isinstance(pj, dict):
                    ptext = pj.get('문제') or pj.get('prompt') or prompt
            except Exception:
                pass
        out.append(r'\kfWritingPrompt{' + render_inline(str(ptext)) + '}')
    out.append(r'\kfWriting{글쓰기 답안}{12}')
    out.append('')
    return '\n'.join(out)


# ----- section_group (실력 확인) -----
def render_weekly(s: dict, area: str = '') -> str:
    c = s.get('content', {})
    if not isinstance(c, dict):
        return ''
    out = []
    def k(name):
        return c.get(f'실력_확인_{name}') or c.get(f'주간_실력_확인_{name}')

    안내 = k('안내') or ''
    if 안내:
        out.append(r'\noindent\textit{\small ' + render_inline_oneline(안내) + r'}\par\medskip')

    지문맵 = k('문제_지문') or {}
    if isinstance(지문맵, dict):
        for key, p in 지문맵.items():
            if not isinstance(p, dict):
                continue
            지침 = _coerce_text(p.get('지침', '') or '')
            지문 = _coerce_text(p.get('지문', '') or '')
            if 지침:
                out.append(r'\par\noindent\textbf{' + render_inline_oneline(지침) + r'}\par\medskip')
            if 지문:
                is_verse = _looks_like_verse(지문)
                body = render_inline(지문, is_verse=is_verse)
                out.append(r'\kfPassageNote{지문 ' + latex_escape(str(key)) + '}{%' + '\n' + body + '\n}')

    객문 = k('객관식_문제') or []
    객보기 = k('객관식_보기') or {}
    객선택 = k('객관식_선택지') or {}
    if isinstance(객문, list):
        for q in 객문:
            if not isinstance(q, dict):
                continue
            번 = q.get('번호') or q.get('number') or ''
            문 = q.get('문제') or q.get('stem') or ''
            out.append(r'\begin{kfQBlock}{' + latex_escape(str(번)) + '}{}')
            out.append(r'\kfQStem{' + render_inline(문) + '}')
            box = None
            if isinstance(객보기, dict):
                box = 객보기.get(str(번)) or 객보기.get(번)
            if box:
                box_text = box if isinstance(box, str) else (box.get('보기') if isinstance(box, dict) else str(box))
                if box_text and str(box_text).strip():
                    out.append(r'\begin{kfEvidence}' + render_inline(str(box_text)) + r'\end{kfEvidence}')
            sels = None
            if isinstance(객선택, dict):
                sels = 객선택.get(str(번)) or 객선택.get(번)
            if sels:
                out.append(r'\begin{kfChoices}')
                if isinstance(sels, list):
                    for ch in sels:
                        if isinstance(ch, dict):
                            txt = ch.get('선택지') or ch.get('text') or ''
                        else:
                            txt = str(ch)
                        txt = re.sub(r'^[\s]*[\u2460\u2461\u2462\u2463\u2464\u2465\u2466\u2467\u2468]\s*', '', txt or '')
                        out.append(r'\kfChoice ' + render_inline(txt))
                elif isinstance(sels, dict):
                    for kk, vv in sels.items():
                        out.append(r'\kfChoice ' + render_inline(str(vv)))
                out.append(r'\end{kfChoices}')
            else:
                out.append(r'\kfAnswerLines{1}')
            out.append(r'\end{kfQBlock}')
            out.append('')

    서문 = k('서술형_문제') or []
    서보기 = k('서술형_보기') or {}
    if isinstance(서문, list):
        for q in 서문:
            if not isinstance(q, dict):
                continue
            번 = q.get('번호') or q.get('number') or ''
            문 = q.get('문제') or q.get('stem') or ''
            out.append(r'\begin{kfQBlock}{' + latex_escape(str(번)) + '}{}')
            out.append(r'\kfQStem{' + render_inline(문) + '}')
            box = None
            if isinstance(서보기, dict):
                box = 서보기.get(str(번)) or 서보기.get(번)
            if box:
                box_text = box if isinstance(box, str) else (box.get('보기') if isinstance(box, dict) else str(box))
                if box_text and str(box_text).strip():
                    out.append(r'\begin{kfEvidence}' + render_inline(str(box_text)) + r'\end{kfEvidence}')
            out.append(r'\kfAnswerNote{답안}{4}')
            out.append(r'\end{kfQBlock}')
            out.append('')

    out.append('')
    return '\n'.join(out)


# ============================================================
# 비트 시리즈 전용 렌더링 — 모든 문제는 multicols 통합, [문제] 라벨 1번
# ============================================================
def render_bit_grammar(data: dict) -> str:
    out = []
    out.append(area_header('문법', f"이번 챕터 문법 영역 — {data.get('domain','')} / {data.get('subDomain','')}"))
    qs = data.get('questions') or []
    out.append(section_label('문법', '문제', ''))
    out.append(r'\begin{multicols}{2}\raggedcolumns\setlength{\columnsep}{12pt}')
    out.append(_render_bit_questions_inner(qs))
    out.append(r'\end{multicols}')
    return '\n'.join(out) + '\n'


def render_bit_literature(data: dict, idx: int) -> str:
    out = []
    title = data.get('title', '') or '문학 작품'
    author = data.get('author', '') or ''
    genre = data.get('genre', '') or ''
    pheader = f'{title}'
    if author:
        pheader += f' — {author}'
    if genre:
        pheader += f' ({genre})'

    passage = data.get('passage') or {}
    if isinstance(passage, dict):
        text = passage.get('text', '') or ''
        source = passage.get('source', '') or ''
    else:
        text = passage
        source = ''
    text = _coerce_text(text)
    src_disp = pheader + (f' / {source}' if source else '')
    is_verse = _looks_like_verse(text)
    body = render_inline(text, is_verse=is_verse)

    out.append(section_label('문학', '지문', src_disp))
    out.append(r'\kfPassageNote{' + latex_escape(src_disp) + '}{%' + '\n' + body + '\n}')

    summary = data.get('summaryTable') or {}
    if isinstance(summary, dict) and summary.get('rows'):
        out.append(section_label('문학', '활동', summary.get('title', '작품 정리표')))
        instr = summary.get('instruction', '') or ''
        if instr:
            out.append(r'\noindent\textit{\small ' + render_inline_oneline(instr) + r'}\par\medskip')
        out.append(r'\begin{kfActTable}{|>{\centering\arraybackslash}m{2.6cm}|m{6cm}|m{4cm}|}')
        out.append(r'\rowcolor{kfPrimaryLight!50}\textbf{\color{kfPrimary}항목} & \textbf{\color{kfPrimary}내용 (빈칸 채우기)} & \textbf{\color{kfPrimary}답안 작성}\\\hline')
        for row in summary['rows']:
            cat = row.get('category', '') or ''
            it = row.get('item', '') or ''
            out.append(latex_escape(cat) + ' & ' + render_inline(it) + r' & \kfTBlank \\\hline')
        out.append(r'\end{kfActTable}')

    qs_obj = data.get('questions') or {}
    if isinstance(qs_obj, dict):
        mc = qs_obj.get('multipleChoice') or []
        sa = qs_obj.get('shortAnswer') or qs_obj.get('서술형') or []
        all_qs = list(mc) + list(sa)
    elif isinstance(qs_obj, list):
        all_qs = qs_obj
    else:
        all_qs = []
    if all_qs:
        out.append(section_label('문학', '문제', ''))
        out.append(r'\begin{multicols}{2}\raggedcolumns\setlength{\columnsep}{12pt}')
        out.append(_render_bit_questions_inner(all_qs))
        out.append(r'\end{multicols}')
    return '\n'.join(out)


def render_bit_reading(data: dict, idx: int) -> str:
    out = []
    title = data.get('title', '') or '비문학 지문'
    genre = data.get('genre', '') or ''
    pheader = title + (f' ({genre})' if genre else '')

    passage = data.get('passage') or {}
    text = passage.get('text', '') if isinstance(passage, dict) else passage
    source = passage.get('source', '') if isinstance(passage, dict) else ''
    text = _coerce_text(text)
    src_disp = pheader + (f' / {source}' if source else '')
    body = render_inline(text)

    out.append(section_label('비문학', '지문', src_disp))
    out.append(r'\kfPassageNote{' + latex_escape(src_disp) + '}{%' + '\n' + body + '\n}')

    qs_obj = data.get('questions') or {}
    if isinstance(qs_obj, dict):
        mc = qs_obj.get('multipleChoice') or []
        sa = qs_obj.get('shortAnswer') or qs_obj.get('서술형') or []
        all_qs = list(mc) + list(sa)
    elif isinstance(qs_obj, list):
        all_qs = qs_obj
    else:
        all_qs = []
    if all_qs:
        out.append(section_label('비문학', '문제', ''))
        out.append(r'\begin{multicols}{2}\raggedcolumns\setlength{\columnsep}{12pt}')
        out.append(_render_bit_questions_inner(all_qs))
        out.append(r'\end{multicols}')
    return '\n'.join(out)


def render_bit_pattern(data: dict) -> str:
    out = [area_header('실력 확인', f"패턴 워크북 — 총 {data.get('questionCount','?')}문항")]
    qs = data.get('questions') or []
    for q in qs:
        if not isinstance(q, dict):
            continue
        num = q.get('number', '')
        pname = q.get('patternName', '') or q.get('patternCode', '')
        stem = q.get('stem', '')
        passage = q.get('passage') or {}
        ptext = passage.get('text', '') if isinstance(passage, dict) else passage
        ptext = _coerce_text(ptext)
        if ptext:
            out.append(section_label('실력 확인', '지문', f'문항 {num} 지문 / {pname}'))
            out.append(r'\kfPassageNote{' + latex_escape(f'문항 {num} 지문 / {pname}') + '}{%' + '\n' +
                       render_inline(ptext) + '\n}')

        out.append(r'\begin{kfQBlock}{' + latex_escape(str(num)) + '}{}')
        out.append(r'\kfQStem{' + render_inline(stem) + '}')
        box = q.get('box')
        if box:
            box_text = '\n'.join(box) if isinstance(box, list) else str(box)
            if box_text.strip():
                out.append(r'\begin{kfEvidence}' + render_inline(box_text) + r'\end{kfEvidence}')
        choices = q.get('choices') or q.get('choiceSet') or []
        if choices:
            out.append(r'\begin{kfChoices}')
            for ch in choices:
                txt = ch.get('text') if isinstance(ch, dict) else str(ch)
                txt = re.sub(r'^[\s]*[\u2460\u2461\u2462\u2463\u2464\u2465\u2466\u2467\u2468]\s*', '', txt or '')
                out.append(r'\kfChoice ' + render_inline(txt))
            out.append(r'\end{kfChoices}')
        else:
            out.append(r'\kfAnswerLines{2}')
        out.append(r'\end{kfQBlock}')
        out.append('')
    return '\n'.join(out)


def _render_bit_questions_inner(qs):
    """문항 리스트를 [문제] 라벨 없이 minipage로 묶어 출력."""
    out = []
    for q in qs:
        if not isinstance(q, dict):
            continue
        num = q.get('number', '')
        stem = q.get('stem', '') or ''
        passage = q.get('passage')
        if isinstance(passage, dict) and passage.get('text'):
            ptext = _coerce_text(passage.get('text'))
            ptype = passage.get('type', '')
            out.append(r'\kfPassageFull{' + latex_escape(f'문항 {num} 지문' + (f' ({ptype})' if ptype else '')) + '}{%' +
                       '\n' + render_inline(ptext) + '\n}')
        out.append(r'\begin{kfQBlock}{' + latex_escape(str(num)) + '}{}')
        out.append(r'\kfQStem{' + render_inline(stem) + '}')
        box = q.get('box')
        if box:
            box_text = '\n'.join(box) if isinstance(box, list) else str(box)
            if box_text.strip():
                out.append(r'\begin{kfEvidence}' + render_inline(box_text) + r'\end{kfEvidence}')
        choices = q.get('choices') or []
        if choices:
            out.append(r'\begin{kfChoices}')
            for ch in choices:
                txt = ch.get('text') if isinstance(ch, dict) else str(ch)
                txt = re.sub(r'^[\s]*[\u2460\u2461\u2462\u2463\u2464\u2465\u2466\u2467\u2468]\s*', '', txt or '')
                out.append(r'\kfChoice ' + render_inline(txt))
            out.append(r'\end{kfChoices}')
        else:
            qtype = q.get('type', '') or ''
            if '서술' in qtype:
                out.append(r'\kfAnswerNote{답안}{4}')
            elif '단답' in qtype:
                out.append(r'\kfAnswerLines{1}')
            else:
                out.append(r'\kfAnswerLines{2}')
        out.append(r'\end{kfQBlock}')
        out.append('')
    return '\n'.join(out)
