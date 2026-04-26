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
    # v18.2: 빈 괄호 ( ) → 그래픽 빈칸 매크로 (학생 답쓸 공간 확보)
    # 공백만 있는 괄호만 변환. 안에 글자가 있으면 그대로 (지문 보호)
    def _replace_blank(m):
        n = len(m.group(1))
        if n <= 1:
            w = '12mm'
        elif n <= 3:
            w = '20mm'
        elif n <= 6:
            w = '30mm'
        else:
            w = '42mm'
        return r'\kfFillBlank[' + w + r']{}'
    esc = re.sub(r'\(([\s\u3000]+)\)', _replace_blank, esc)
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
        # 시 행 구분 빗금(\, /, \-, /-) → 실제 줄바꿈
        # 양옆 공백 있는 빗금만 (산문/단어 내 슬래시 보호)
        s = re.sub(r' +[\\/]+\-? +', '\n', s)
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
            # \\ 다음 줄이 [...]로 시작하면 옵션 인자로 잡힘 → \relax로 차단
            out_paras.append(' \\\\\\relax\n'.join(esc_lines))
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
    """마크다운 표 블록 → tabular (adjustbox 래핑) LaTeX.
    v6:
      - 같은 좌측 셀이 연속 반복되면 \multirow로 병합
      - 컬럼 폭: 셀 길이 가중치 + 짧은 단어 컬럼은 좁게(min cap), 긴 텍스트는 넓게
    """
    lines = [ln.strip() for ln in md_block.strip().split('\n') if ln.strip()]
    if len(lines) < 2:
        return _inline_to_latex(md_block)
    # 셀 분리 함수
    def split_row(row):
        body = row.strip()
        if body.startswith('|'):
            body = body[1:]
        if body.endswith('|'):
            body = body[:-1]
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
    # v9: 컬럼 폭 — 마지막 컬럼(의미/설명)에 1.5x 가중치로 텍스트 줄바꿈 억제
    widths = []
    for ci in range(n):
        col_lens = (
            [len(header_cells[ci]) if ci < len(header_cells) else 0] +
            [len(r[ci]) if ci < len(r) else 0 for r in data_rows]
        )
        max_len = max(col_lens) if col_lens else 0
        avg_len = sum(col_lens) / max(1, len(col_lens))
        w = avg_len * 0.6 + max_len * 0.4
        if max_len <= 4:
            w = max(w, 3)
        elif max_len <= 8:
            w = max(w, 5)
        else:
            w = max(w, 6)
        # v9: 마지막 컬럼(콘텐츠 성격)은 1.5x
        if ci == n - 1 and n >= 3:
            w *= 1.5
        widths.append(w)
    total = sum(widths) or 1
    col_specs = []
    for ci in range(n):
        a = aligns[ci]
        align_cmd = {
            'l': r'\raggedright\arraybackslash',
            'c': r'\centering\arraybackslash',
            'r': r'\raggedleft\arraybackslash',
        }[a]
        ratio = widths[ci] / total
        col_specs.append(r'|>{' + align_cmd + r'}p{\dimexpr ' + f'{ratio:.4f}' + r'\linewidth-12pt\relax}')
    col_spec = ''.join(col_specs) + '|'

    # v6: 좌측 컬럼 multirow 병합 — 첫 컬럼 같은 값이 연속되면 묶기
    # row별 cell 사전처리: cells = [[(text, rowspan, is_first)]]
    # 단순화: 첫 컬럼만 병합 처리
    norm_rows = []
    for r in data_rows:
        cells = list(r) + [''] * max(0, n - len(r))
        norm_rows.append(cells[:n])

    # v9: 첫 컬럼 병합 — 같은 값 연속 + 빈 셀 연속(위 non-empty 셀에 속함)
    first_col_span = [None] * len(norm_rows)  # rowspan or 0(skip) or 1(normal)
    i = 0
    while i < len(norm_rows):
        v = norm_rows[i][0].strip()
        if not v:
            # 선행 non-empty가 없으면 단독 빈칸 처리
            first_col_span[i] = 1
            i += 1
            continue
        # v와 같은 값이 이어지거나, 빈 셀이 이어지면 모두 같은 그룹
        j = i + 1
        while j < len(norm_rows):
            nv = norm_rows[j][0].strip()
            if nv == v or nv == '':
                j += 1
            else:
                break
        span = j - i
        first_col_span[i] = span
        for k in range(i + 1, j):
            first_col_span[k] = 0
        i = j

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
    for ri, cells in enumerate(norm_rows):
        rendered = []
        for ci, c in enumerate(cells):
            if ci == 0 and first_col_span[ri] == 0:
                # multirow 본체: 빈 셀
                rendered.append('')
            elif ci == 0 and first_col_span[ri] is not None and first_col_span[ri] > 1:
                # multirow 시작 셀
                rendered.append(r'\multirow{' + str(first_col_span[ri]) + r'}{*}{' + _inline_to_latex(c) + r'}')
            else:
                rendered.append(_inline_to_latex(c) if c else r'\rule[-1.0em]{0pt}{2.4em}')
        # 행 끝: cline 처리
        if first_col_span[ri] == 0:
            # multirow 안의 행 — 첫 컬럼 hline 생략
            # \cline{2-n}
            out.append(' & '.join(rendered) + r' \\\cline{2-' + str(n) + '}')
        elif first_col_span[ri] is not None and first_col_span[ri] > 1:
            # multirow 시작 — 다음 행이 multirow 안이면 cline{2-n}, 아니면 hline
            out.append(' & '.join(rendered) + r' \\\cline{2-' + str(n) + '}')
        else:
            out.append(' & '.join(rendered) + r' \\\hline')
    # 마지막 행이 multirow 안이라면 hline 보강
    if norm_rows and (first_col_span[-1] == 0 or (first_col_span[-1] is not None and first_col_span[-1] > 1)):
        # \cline{1-n}으로 마무리
        out.append(r'\hline')
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


# v5: 첫 헤딩 추출 — placeholder 자동 제거
_AREA_PLACEHOLDER_TITLES = {'_root', '작품', '지문', '활동', '문제', ''}

# v7: 문학 영역 부제용 작가 추출 블랙리스트 (false-positive 방지).
# 패턴 `([가-힣]{2,5}) 시인|작가` 등에 걸린 잡음 단어들.
_AUTHOR_BLACKLIST = {
    '소설은', '이유는', '남성인', '같은', '다음', '이번', '이런', '저런', '어떤', '어느',
    '화자는', '화자가', '화자의', '화자를', '화자도', '화자에', '화자와',
    '시인은', '시인이', '시인의', '시인을', '시인도', '시인에', '시인과',
    '작가는', '작가가', '작가의', '작가를', '작가도', '작가에', '작가와',
    '주인공', '대표적', '일반적', '최고의', '진정한', '단순한',
    '표현한', '서술한', '묘사한', '드러낸', '보여준', '제시한', '강조한', '나타낸',
    '이처럼', '이런', '저런', '그런', '때문', '동시에', '결국', '바로',
    '소설가', '시인이', '인물의', '내용을', '주제를',
}

# 한국 작가 성씨 화이트리스트 — 두 글자 성도 일부 허용
_KOREAN_SURNAMES = {
    '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신',
    '권', '황', '안', '송', '류', '전', '홍', '고', '문', '양', '손', '배', '백', '허',
    '유', '남', '심', '노', '하', '곽', '성', '차', '주', '우', '구', '민', '진', '엄',
    '채', '원', '천', '방', '공', '현', '함', '변', '염', '여', '추', '도', '소', '석',
    '선', '설', '마', '길', '연', '위', '표', '명', '기', '반', '왕', '금', '옥', '육',
    '인', '맹', '제', '모', '탁', '국', '여', '진', '편', '계', '복', '태', '지',
    # 두 글자 성
    '남궁', '황보', '제갈', '사공', '선우', '서문', '독고',
}


def _is_likely_author(name: str) -> bool:
    """이름이 한국 인명일 가능성 — 첫 글자가 성씨 화이트리스트에 있으면 허용."""
    if not name or len(name) < 2 or len(name) > 4:
        return False
    if name in _AUTHOR_BLACKLIST:
        return False
    # 첫 1자 성 또는 첫 2자 성
    if name[0] in _KOREAN_SURNAMES:
        return True
    if len(name) >= 2 and name[:2] in _KOREAN_SURNAMES:
        return True
    return False


def _extract_literature_work_info(sections: list) -> tuple:
    """
    문학 영역 sections에서 (작품명, 작가) 추출.
    탐색 대상:
      1) passage subtype='해설_지문' 의 content.text 첫 600자
      2) activity subtype 에 '해설'이 포함된 섹션의 content.units[0].passage 첫 600자
    작품명: 첫 등장 「...」 (placeholder 제외)
    작가: 한국인 성씨 화이트리스트 통과한 [가-힣]{2,4} 만 허용
      - 'X 시인' / 'X 작가' / 'X의 「' / 'X은/는의 시·소설'
    """
    work_title = ''
    author = ''

    def _try_text(text):
        nonlocal work_title, author
        if not text:
            return
        t = str(text)[:600]
        if not work_title:
            m = re.search(r'「([^」\n]+?)」', t)
            if m:
                cand = m.group(1).strip()
                if cand and cand not in _AREA_PLACEHOLDER_TITLES:
                    work_title = cand
        if not author:
            # 우선 'X의 「...」' 패턴 (가장 신뢰도 높음)
            for ma in re.finditer(r'([가-힣]{2,4})의\s*(?:시\s*「|소설\s*「|「)', t):
                cand = ma.group(1).strip()
                if _is_likely_author(cand):
                    author = cand
                    break
            # 'X 시인' / 'X 작가'
            if not author:
                for ma in re.finditer(r'([가-힣]{2,4})\s*(?:시인|작가|선생)', t):
                    cand = ma.group(1).strip()
                    if _is_likely_author(cand):
                        author = cand
                        break

    for s in sections:
        if not isinstance(s, dict):
            continue
        c = s.get('content', {})
        if not isinstance(c, dict):
            continue
        st = s.get('subtype', '') or ''
        tt = s.get('type', '') or ''
        title = s.get('title', '') or ''
        # 1) 해설_지문 passage
        if tt == 'passage' and ('해설' in st or '해설' in title):
            _try_text(c.get('text', ''))
        # 2) activity 해설학습 — units[0].passage
        if tt == 'activity' and '해설' in st:
            units = c.get('units') or []
            if units and isinstance(units, list) and isinstance(units[0], dict):
                _try_text(units[0].get('passage', ''))
        if work_title and author:
            break
    return work_title, author


def extract_area_subtitle(area: str, sections: list) -> str:
    """
    영역의 sections에서 부제로 쓸 첫 의미 있는 title 추출.
    비트는 본 함수 사용 안 함 (별도 처리).

    v7: 문학 영역 특별 처리 — 해설 본문에서 「작품명」·작가 추출 →
        '「작품명」 — 작가' 또는 '「작품명」' 부제 생성.
        추출 실패 시 기존 로직 폴백.
    """
    # v7: 문학 영역 — 작품명·작가 우선
    if area == '문학':
        work_title, author = _extract_literature_work_info(sections)
        if work_title:
            # 이미 「」가 감싸진 경우 중복 방지
            if work_title.startswith('「') and work_title.endswith('」'):
                work_fmt = work_title
            else:
                work_fmt = f'「{work_title}」'
            if author:
                return f'{work_fmt} — {author}'
            return work_fmt

    for s in sections:
        if not isinstance(s, dict):
            continue
        t = s.get('type')
        if t in ('concept', 'vocab_list', 'passage'):
            title = (s.get('title') or '').strip()
            # content.title도 시도
            c = s.get('content', {})
            if isinstance(c, dict):
                ctitle = (c.get('title') or '').strip()
            else:
                ctitle = ''
            for cand in (title, ctitle):
                if cand and cand not in _AREA_PLACEHOLDER_TITLES and cand != area:
                    return cand
        # passage에서 작품·작가 형태 시도
        if t == 'passage' and area == '문학':
            c = s.get('content', {})
            if isinstance(c, dict):
                src = (c.get('source') or '').strip()
                if src:
                    return src
    return ''


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
def render_section(section: dict, area: str = '', use_multicol: bool = False) -> str:
    """섹션 객체 → LaTeX 문자열. 학생용에서 무시되는 타입은 빈 문자열.
    use_multicol: 러셀+/비트에서 활동(문장독해)을 multicols{2}로 래핑.
    """
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
        return r'\kfActivityBg ' + render_activity(section, a, use_multicol=use_multicol)
    if t == 'question':
        return r'\kfQuestionBg ' + render_question(section, a)
    if t == 'writing':
        return render_writing(section, a)
    if t == 'section_group':
        return render_weekly(section, a)
    return ''


# ----- concept -----
def render_concept(s: dict, area: str = '') -> str:
    """
    v5: 섹션 라벨(section_label) 호출 생략. 개념 본문을 title 없는 지문 박스(\kfPassageNoteNT)로 렌더.
    영역 헤더(\kfStartXxx)에 부제로 title이 이미 담기므로 중복 회피.
    """
    title = s.get('title', '') or ''
    c = s.get('content', {})
    text = c.get('text', '') if isinstance(c, dict) else ''
    examples = c.get('examples', []) if isinstance(c, dict) else []
    out = []
    body_parts = []
    if text:
        body_parts.append(render_markdown_block(text))
    if examples:
        body_parts.append(r'\par\medskip\begin{itemize}[leftmargin=18pt, itemsep=2pt, topsep=2pt, label=\textbullet]')
        for ex in examples:
            body_parts.append(r'\item ' + render_inline(ex))
        body_parts.append(r'\end{itemize}')
    if body_parts:
        body = '\n'.join(body_parts)
        out.append(r'\kfPassageNoteNT{%')
        out.append(body)
        out.append(r'}')
    out.append('')
    return '\n'.join(out)


# ----- vocab_list (어휘 영역 — 메모란 사용 안 함) -----
def render_vocab_list(s: dict, area: str = '') -> str:
    """v5: 섹션 라벨 생략 (영역 헤더 부제 통합)."""
    c = s.get('content', {})
    items = c.get('items', []) if isinstance(c, dict) else []
    out = []
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

    # v5: section_label 생략 — 영역 헤더에 부제로 통합됨.
    # ptitle이 의미 있는 값일 때만 박스 title로 사용. ('지문', '작품', '_root' 같은 자리표시자는 제거)
    placeholder = {'지문', '작품', '_root', area, ''}
    if ptitle in placeholder:
        ptitle_for_box = ''
    else:
        ptitle_for_box = ptitle
    use_memo = (area != '어휘')
    if use_memo:
        return (r'\kfPassageNote{' + latex_escape(ptitle_for_box) + '}{%' + '\n' +
                body + '\n' +
                r'}' + '\n\n')
    else:
        return (r'\kfPassageFull{' + latex_escape(ptitle_for_box) + '}{%' + '\n' +
                body + '\n' +
                r'}' + '\n\n')


def _looks_like_verse(text) -> bool:
    if not text or not isinstance(text, str):
        return False
    # 빗금 행 구분자가 3개 이상이면 시로 확정
    if len(re.findall(r' +[\\/]+\-? +', text)) >= 3:
        return True
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
# v5: 활동 라벨은 분석훈련/문장독해/해설학습에만 얇게 유지, 나머지는 생략.
_ACT_LABEL_KEEP = {
    '문장독해', '문장_독해', '분석훈련', '분석_훈련', '해설학습', '해설_학습',
    '어법_훈련', '지시어', '지시어_연결', '해설_문제',
}
_ACT_LABEL_NAME = {
    '문장독해': '문장 독해', '문장_독해': '문장 독해',
    '분석훈련': '분석 훈련', '분석_훈련': '분석 훈련',
    '해설학습': '해설 학습', '해설_학습': '해설 학습',
    '어법_훈련': '어법 훈련',
    '지시어': '지시어 연결', '지시어_연결': '지시어 연결',
    '해설_문제': '해설 문제',
}

def render_activity(s: dict, area: str = '', use_multicol: bool = False) -> str:
    sub = (s.get('subtype') or '').strip()
    title = s.get('title', '') or ''
    c = s.get('content', {})
    if not isinstance(c, dict):
        c = {}
    instruction = c.get('instruction', '') or ''

    # 라벨: 분석훈련·문장독해·해설학습만 얇게 표시. 그 외 생략.
    if sub in _ACT_LABEL_KEEP:
        label_sub = _ACT_LABEL_NAME.get(sub, sub)
        head = section_label(area, '활동', label_sub)
    else:
        head = ''

    if instruction:
        # v18.5: 정리표는 50줄로 보장. 영역 헤더 직후는 \kfMaybeNeedspace로 무시.
        if sub in ('정리표',):
            guard_lines = 50
        elif sub in ('내용확인', '내용_확인', '어휘', '문장독해', '문장_독해', '구조도', '해설학습', '해설_학습'):
            guard_lines = 32
        elif sub in ('OX', '연결', '빈칸', '빈칸형', '괄호_선택형', '분석훈련', '분석_훈련', '어법_훈련'):
            guard_lines = 24
        else:
            guard_lines = 18
        # v17.1: instruction 안에 마크다운 표/헤더가 있으면 markdown block 처리
        if '|---' in instruction or '| :---' in instruction or '\n###' in instruction or instruction.count('|') > 8:
            head += rf'\par\kfMaybeNeedspace{{{guard_lines}\baselineskip}}' + \
                    render_markdown_block(instruction) + r'\nopagebreak[4]\par\nopagebreak[4]' + '\n'
        else:
            head += rf'\par\kfMaybeNeedspace{{{guard_lines}\baselineskip}}' + \
                    r'\noindent{\kfTipMark\,\,}{\small\color{kfInk} ' + render_inline_oneline(instruction) + r'}\par\nopagebreak[4]\smallskip\nopagebreak[4]' + '\n'

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
        # v5: 러셀+/비트는 multicols{2}로 래핑
        # v9: 활동 헤더+지시문+본문 첫 몇 줄 같은 페이지 강제
        body = _render_sentence_reading(c)
        if use_multicol and body.strip():
            body = (r'\kfBeginMC' + '\n' +
                    body + '\n' + r'\kfEndMC' + '\n')
        guard = r'\par\needspace{15\baselineskip}' + '\n'
        return guard + head + body
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
            out.append(r'\begin{kfEvidence}' + render_inline(_format_box_text(box_text), preserve_newlines=True) + r'\end{kfEvidence}')
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


def _convert_blank_pattern(text: str) -> str:
    r"""
    구조도 안의 빈칸 패턴을 LaTeX 밑줄 빈칸으로 변환.
    - (① _____) / (② ___) 등 원문자+밑줄 → 원문자 뒤 \underline{\hspace{2.2cm}}
    - _____ (3+개 연속) → \underline{\hspace{1.8cm}}
    """
    if not text:
        return ''
    s = str(text)
    # 패턴 A: (원문자 공백? __+ 공백? ) 형태
    s = re.sub(
        r'\(\s*([\u2460-\u2473])\s*_{2,}\s*\)',
        r'(\1 \\underline{\\hspace{2.2cm}})',
        s
    )
    # 패턴 B: 독립 밑줄 3개 이상
    s = re.sub(r'_{3,}', r'\\underline{\\hspace{1.8cm}}', s)
    # 이제 _inline_to_latex에 넣을 건데, \underline이 이미 들어있으므로 latex 이스케이프가 깨짐.
    # 토큰으로 보호 후 렌더.
    PH_U = '\uE020'
    PH_H = '\uE021'
    s2 = s.replace(r'\underline{\hspace{2.2cm}}', PH_U + '2.2cm' + PH_H)
    s2 = s2.replace(r'\underline{\hspace{1.8cm}}', PH_U + '1.8cm' + PH_H)
    out = _inline_to_latex(s2)
    out = re.sub(re.escape(PH_U) + r'(\d+\.\d+cm)' + re.escape(PH_H),
                 r'\\underline{\\hspace{\1}}', out)
    return out


def _parse_structure_diagram(diagram: str):
    """
    마크다운 트리 diagram 파싱:
      * 1문단: 서론
        * 항목 = (① _____)
        * 항목2 = (② _____)
      * 2문단: 본론
        * 항목 = (③ _____)
    → rows = [
        {level:0, dan:'1문단', title:'서론', content:'1문단: 서론', content_tex:'...', value_tex:''},
        {level:1, label:'항목', value_tex:'(① \\underline{...})'},
        ...
      ]
    """
    rows = []
    for ln in diagram.split('\n'):
        if not ln.strip():
            continue
        m = re.match(r'^(\s*)([*\-])\s+(.*)$', ln)
        if not m:
            continue
        indent = len(m.group(1))
        level = indent // 2
        content = m.group(3).strip()
        row = {'level': level, 'content': content}
        if level == 0:
            # 'N문단: 제목' 파싱
            m2 = re.match(r'^(\d+\s*문단)\s*[:：]\s*(.+)$', content)
            if m2:
                row['dan'] = m2.group(1).strip()
                row['title'] = m2.group(2).strip()
            else:
                row['dan'] = content
                row['title'] = ''
            row['content_tex'] = _convert_blank_pattern(content)
            row['value_tex'] = ''
        else:
            # '항목 = 값' 또는 '항목: 값' 또는 '항목 값'
            m2 = re.match(r'^([^=:]+?)\s*[=:]\s*(.+)$', content)
            if m2:
                row['label'] = m2.group(1).strip()
                row['value_tex'] = _convert_blank_pattern(m2.group(2).strip())
            else:
                row['label'] = ''
                row['value_tex'] = _convert_blank_pattern(content)
        rows.append(row)
    return rows


def _render_structure_diagram(c, items):
    r"""
    구조도: diagram(마크다운 트리 텍스트)이 있으면 3열 표 형식으로 렌더.
    v9:
      - 1레벨 (* N문단: 제목) → [단 | 제목 | (내용 줄 병합)]
      - 2레벨 (  * 항목 = (① _____)) → [~ | 항목 | 밑줄 빈칸]
      - (① _____), (② ___) 원문자 + _ 패턴 → \underline{\hspace{2.5cm}}
    없으면 items 사용.
    """
    out = []
    diagram = c.get('diagram')
    if diagram and isinstance(diagram, str):
        rows = _parse_structure_diagram(diagram)
        if rows:
            out.append(r'\par\medskip\needspace{8\baselineskip}')
            out.append(r'\begin{tcolorbox}[enhanced, breakable=true,')
            out.append(r'  colback=kfPaper, colframe=kfRule, boxrule=0.4pt, arc=2pt,')
            out.append(r'  left=8pt, right=8pt, top=6pt, bottom=6pt,')
            out.append(r'  title={\footnotesize\bfseries\color{kfMute} 글의 구조도},')
            out.append(r'  coltitle=kfMute, colbacktitle=kfPrimaryLight!40,')
            out.append(r'  attach boxed title to top left={yshift=-1.5mm, xshift=6pt},')
            out.append(r'  boxed title style={colframe=kfRule, boxrule=0.3pt, arc=1pt}]')
            out.append(r'\footnotesize\setstretch{1.3}')
            out.append(r'\renewcommand{\arraystretch}{1.35}')
            out.append(r'\arrayrulecolor{kfRule}')
            out.append(r'\noindent\begin{tabularx}{\linewidth}{|>{\centering\arraybackslash}p{1.6cm}|>{\raggedright\arraybackslash}p{3.4cm}|>{\raggedright\arraybackslash}X|}')
            out.append(r'\hline')
            out.append(r'\rowcolor{kfPrimaryLight!40}\textbf{\color{kfPrimary}단} & \textbf{\color{kfPrimary}항목} & \textbf{\color{kfPrimary}내용} \\\hline')
            # 1레벨 항목을 multirow로 묶어 하위 항목 그룹화
            i = 0
            while i < len(rows):
                r = rows[i]
                if r['level'] == 0:
                    # 자식 찾기
                    j = i + 1
                    while j < len(rows) and rows[j]['level'] >= 1:
                        j += 1
                    children = rows[i+1:j]
                    # 본인: 단 이름(ex: "1문단") + 제목(ex: "서론") + 내용(children 없으면 r['content'])
                    dan = _inline_to_latex(r.get('dan', '') or '')
                    title = _inline_to_latex(r.get('title', '') or r.get('content', '') or '')
                    if children:
                        # multirow: 자식 갯수만큼 병합
                        span = len(children)
                        if span > 1:
                            out.append(r'\multirow{' + str(span) + r'}{*}{' + dan + '} & ' +
                                       _inline_to_latex(children[0].get('label', '') or '') + ' & ' +
                                       children[0].get('value_tex', '') + r' \\\cline{2-3}')
                            for k, ch in enumerate(children[1:], 1):
                                out.append(' & ' + _inline_to_latex(ch.get('label', '') or '') + ' & ' +
                                           ch.get('value_tex', '') + r' \\\cline{2-3}')
                            out.append(r'\hline')
                        else:
                            out.append(dan + ' & ' +
                                       _inline_to_latex(children[0].get('label', '') or '') + ' & ' +
                                       children[0].get('value_tex', '') + r' \\\hline')
                        # 제목 자체를 별도 행이 아니라 dan 옆 행에 둘지? 여기선 이미 children이 내용 담음.
                        # 만약 title이 있으면 맨 앞 "제목" 행 추가
                        if r.get('title') and r.get('title') != r.get('content'):
                            # 이 경우 다른 처리 필요하지만 일반적이지 않음
                            pass
                    else:
                        out.append(dan + ' & ' + title + ' & ' + r.get('value_tex', r.get('content_tex', '')) + r' \\\hline')
                    i = j
                else:
                    # orphan children
                    out.append(' & ' + _inline_to_latex(r.get('label', '') or '') + ' & ' +
                               r.get('value_tex', '') + r' \\\hline')
                    i += 1
            out.append(r'\end{tabularx}')
            out.append(r'\arrayrulecolor{black}')
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
    각 단원: 해설 박스(작은 메모란 함께) + 그에 묶인 문제들.
    v5: '해설 단원 N' 라벨 제거 → \medskip만.
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
            out.append(r'\par\medskip')
            out.append(r'\kfPassageNoteNT{%')
            out.append(render_inline(passage))
            out.append(r'}')
            out.append('')
        for idx_q, q in enumerate(items, 1):
            if not isinstance(q, dict):
                continue
            stem = q.get('stem', '') or ''
            out.append(r'\begin{kfQBlock}{' + _fmt_qnum(idx_q) + '}{' + _qtype_from_item(q) + '}')
            out.append(r'\kfQStem{' + _ul_neg(render_inline(stem)) + '}')
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


def _is_short_blank_items(items) -> bool:
    """v5: 8개 이상이고 모두 짧은 단답(보기·선택지 없음, stem 60자 이하)이면 multicols{2}."""
    if not items or len(items) < 8:
        return False
    for it in items:
        if not isinstance(it, dict):
            return False
        if it.get('box') or it.get('view') or it.get('choices'):
            return False
        stem = it.get('stem', '') or ''
        if len(stem) > 60:
            return False
    return True


def _render_analysis_train(c, items, area):
    """분석훈련, 어법훈련 등 일반 활동. v5: 짧은 단답 8개+ → multicols{2}."""
    out = []
    if not items:
        return ''
    use_mc = _is_short_blank_items(items)
    if use_mc:
        out.append(r'\kfBeginMC')
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
                out.append(r'\begin{kfEvidence}' + render_inline(_format_box_text(box_text), preserve_newlines=True) + r'\end{kfEvidence}')
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
    if use_mc:
        out.append(r'\kfEndMC')
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


def _fmt_qnum(n) -> str:
    """문제 번호 2자리 0 패딩 (01, 02, …, 99)."""
    try:
        return f'{int(n):02d}'
    except (TypeError, ValueError):
        return str(n)


def _qtype_label(sub: str) -> str:
    """JSON subtype → kfQBlock 유형 라벨 (객관식/단답형/서술형)."""
    s = (sub or '').strip()
    if s in ('단답형', 'short_answer', 'short'):
        return '단답형'
    if s in ('서술형', 'descriptive', 'essay'):
        return '서술형'
    return '객관식'


# 발문 부정 표현 자동 밑줄 (사용자 요청 v14)
_NEG_PATTERN = re.compile(r'(않은|없는|아닌|다른 하나)')


def _ul_neg(text: str) -> str:
    """발문에서 부정 표현(않은/없는/아닌/다른 하나)을 \\underline 처리."""
    if not text:
        return text
    return _NEG_PATTERN.sub(r'\\underline{\g<1>}', text)


def _format_box_text(text: str) -> str:
    """<보기> 박스 본문 정리:
    1) 본문 첫머리의 '<보기>' 라벨 제거 (박스 자체에 '보기' 타이틀 있음)
    2) 한 줄에 'ㄱ. … ㄴ. … ㄷ. …' 같이 들어 있는 자모 항목을 줄바꿈으로 분리
       (음운 기호와 항목 기호 구분 명확화)
    """
    if not text:
        return text
    # 첫머리 <보기> 라벨 제거
    text = re.sub(r'^\s*<\s*보기\s*>\s*', '', text)
    # 자모 항목(ㄱ.ㄴ.ㄷ.… 또는 ㉠ ㉡ ㉢…) 앞 공백을 줄바꿈으로
    text = re.sub(r'\s+(?=[ㄱ-ㅎ]\.\s)', '\n', text)
    text = re.sub(r'\s+(?=[\u3260-\u326F]\s)', '\n', text)  # ㉠ ㉡ ㉢ ...
    return text.strip()


# 비트 stem 안에 <보기> 참조 + 빈 줄 + 본문 패턴이 있으면 본문만 박스로 분리
# 단순 <보기> 참조만 있고 본문 단락이 없으면 분리 X
_BOX_INLINE_PATTERN = re.compile(
    r'(<\s*보기\s*>[^\n]*)\n\s*\n+(.+?)(?=\n\s*[\u2460\u2461\u2462\u2463\u2464\u2465]|\Z)',
    re.DOTALL
)


def _split_stem_box(stem: str):
    """stem에 <보기> 참조 + 빈 줄 + 본문 단락이 있으면 (stem포함참조, box본문). 없으면 (stem, None)."""
    if not stem or ('<보기>' not in stem and '< 보기 >' not in stem):
        return stem, None
    m = _BOX_INLINE_PATTERN.search(stem)
    if not m:
        return stem, None
    new_stem = stem[:m.end(1)].rstrip()
    box_text = m.group(2).strip()
    return new_stem, box_text


def _qtype_from_item(q: dict) -> str:
    """문항 dict에서 유형 추정: choices 있으면 객관식, type/필드에 '서술'→서술형, '단답'→단답형."""
    if not isinstance(q, dict):
        return '객관식'
    if q.get('choices') or q.get('choiceSet'):
        return '객관식'
    t = (q.get('type') or q.get('subtype') or '') or ''
    s = str(t)
    if '서술' in s or 'descriptive' in s.lower() or 'essay' in s.lower():
        return '서술형'
    if '단답' in s or 'short' in s.lower():
        return '단답형'
    return '단답형'


def _render_one_question(it: dict, sub: str, idx: int) -> str:
    num = idx  # v13: JSON number 무시 → 전체 연속 번호
    stem = it.get('stem', '') or ''
    choices = it.get('choices') or []
    box = it.get('box')

    qtype = _qtype_label(sub)
    out = []
    out.append(r'\begin{kfQBlock}{' + _fmt_qnum(num) + '}{' + qtype + '}')
    out.append(r'\kfQStem{' + _ul_neg(render_inline(stem)) + '}')
    if box:
        box_text = '\n'.join(box) if isinstance(box, list) else str(box)
        if box_text.strip():
            out.append(r'\begin{kfEvidence}' + render_inline(_format_box_text(box_text), preserve_newlines=True) + r'\end{kfEvidence}')
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
    여러 question 섹션(객관식/단답형/서술형)을 통합 렌더.
    v6: [문제] 라벨 1번 출력 (영역 안 모든 question 한 묶음으로).
    use_multicol=True면 multicols로 묶음 (러셀+/비트 강제).
    """
    if not question_sections:
        return ''
    out = []
    # v6: [문제] 라벨 1번
    out.append(section_label(area, '문제', ''))
    if use_multicol:
        out.append(r'\par\medskip')
        out.append(r'\kfBeginMC')
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
            # v13: 타입별 리셋 제거 — 전체 연속 번호(counter) 강제
            out.append(_render_one_question(it, sub, counter))
        if c.get('answer_format'):
            out.append(r'\par\noindent\textit{\small ' + render_inline_oneline(str(c['answer_format'])) + '}')
    if use_multicol:
        out.append(r'\kfEndMC')
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
        for idx_q, q in enumerate(객문, 1):
            if not isinstance(q, dict):
                continue
            번 = q.get('번호') or q.get('number') or idx_q
            문 = q.get('문제') or q.get('stem') or ''
            out.append(r'\begin{kfQBlock}{' + _fmt_qnum(idx_q) + '}{객관식}')
            out.append(r'\kfQStem{' + _ul_neg(render_inline(문)) + '}')
            box = None
            if isinstance(객보기, dict):
                box = 객보기.get(str(번)) or 객보기.get(번)
            if box:
                box_text = box if isinstance(box, str) else (box.get('보기') if isinstance(box, dict) else str(box))
                if box_text and str(box_text).strip():
                    out.append(r'\begin{kfEvidence}' + render_inline(_format_box_text(str(box_text)), preserve_newlines=True) + r'\end{kfEvidence}')
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
        base_idx = len(객문) if isinstance(객문, list) else 0
        for idx_q, q in enumerate(서문, 1):
            if not isinstance(q, dict):
                continue
            번 = q.get('번호') or q.get('number') or (base_idx + idx_q)
            문 = q.get('문제') or q.get('stem') or ''
            out.append(r'\begin{kfQBlock}{' + _fmt_qnum(base_idx + idx_q) + '}{서술형}')
            out.append(r'\kfQStem{' + _ul_neg(render_inline(문)) + '}')
            box = None
            if isinstance(서보기, dict):
                box = 서보기.get(str(번)) or 서보기.get(번)
            if box:
                box_text = box if isinstance(box, str) else (box.get('보기') if isinstance(box, dict) else str(box))
                if box_text and str(box_text).strip():
                    out.append(r'\begin{kfEvidence}' + render_inline(_format_box_text(str(box_text)), preserve_newlines=True) + r'\end{kfEvidence}')
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
    domain = data.get('domain', '') or ''
    sub_domain = data.get('subDomain', '') or ''
    if domain and sub_domain:
        sub = f'{domain} / {sub_domain}'
    elif domain:
        sub = domain
    else:
        sub = '문법 영역 학습'
    out.append(area_header('문법', sub))
    qs = data.get('questions') or []
    # v6: [문제] 라벨 1번 + multicols 강제
    out.append(section_label('문법', '문제', ''))
    out.append(r'\kfBeginMC')
    out.append(_render_bit_questions_inner(qs))
    out.append(r'\kfEndMC')
    return '\n'.join(out) + '\n'


def render_bit_literature(data: dict, idx: int) -> str:
    out = []
    title = data.get('title', '') or '문학 작품'
    author = data.get('author', '') or ''
    genre = data.get('genre', '') or ''
    # v14: 비트 문학 지문 박스 제목 = 「제목」 — 작가 (장르·출처 제외)
    pheader = f'「{title}」'
    if author:
        pheader += f' — {author}'

    passage = data.get('passage') or {}
    if isinstance(passage, dict):
        text = passage.get('text', '') or ''
    else:
        text = passage
    text = _coerce_text(text)
    is_verse = _looks_like_verse(text)
    body = render_inline(text, is_verse=is_verse)

    out.append(r'\kfPassageNote{' + latex_escape(pheader) + r'}{%' + '\n' + body + '\n' + r'}\kfResetAreaFlag')

    summary = data.get('summaryTable') or {}
    if isinstance(summary, dict) and summary.get('rows'):
        instr = summary.get('instruction', '') or ''
        if instr:
            # v18.5: 50줄 needspace + 영역 헤더 직후는 kfMaybeNeedspace로 무시 + 통일 마크업
            out.append(r'\par\kfMaybeNeedspace{50\baselineskip}\noindent{\kfTipMark\,\,}{\small\color{kfInk} ' + render_inline_oneline(instr) + r'}\par\nopagebreak[4]\smallskip\nopagebreak[4]')
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
        # v6: [문제] 라벨 1번 + multicols 강제
        out.append(section_label('문학', '문제', ''))
        out.append(r'\kfBeginMC')
        out.append(_render_bit_questions_inner(all_qs))
        out.append(r'\kfEndMC')
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

    # v5: section_label 생략
    out.append(r'\kfPassageNote{' + latex_escape(src_disp) + r'}{%' + '\n' + body + '\n' + r'}\kfResetAreaFlag')

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
        # v6: [문제] 라벨 1번 + multicols 강제
        out.append(section_label('비문학', '문제', ''))
        out.append(r'\kfBeginMC')
        out.append(_render_bit_questions_inner(all_qs))
        out.append(r'\kfEndMC')
    return '\n'.join(out)


def render_bit_pattern(data: dict) -> str:
    out = [area_header('실력 확인', f"패턴 워크북 — 총 {data.get('questionCount','?')}문항")]
    qs = data.get('questions') or []
    for idx_q, q in enumerate(qs, 1):
        if not isinstance(q, dict):
            continue
        num = idx_q
        pname = q.get('patternName', '') or q.get('patternCode', '')
        stem = q.get('stem', '')
        passage = q.get('passage') or {}
        ptext = passage.get('text', '') if isinstance(passage, dict) else passage
        ptext = _coerce_text(ptext)
        if ptext:
            # v5: section_label 생략. 박스 title은 패턴명만.
            out.append(r'\kfPassageNote{' + latex_escape(f'문항 {num} / {pname}') + '}{%' + '\n' +
                       render_inline(ptext) + '\n}')

        out.append(r'\begin{kfQBlock}{' + _fmt_qnum(num) + '}{' + _qtype_from_item(q) + '}')
        out.append(r'\kfQStem{' + _ul_neg(render_inline(stem)) + '}')
        box = q.get('box')
        if box:
            box_text = '\n'.join(box) if isinstance(box, list) else str(box)
            if box_text.strip():
                out.append(r'\begin{kfEvidence}' + render_inline(_format_box_text(box_text), preserve_newlines=True) + r'\end{kfEvidence}')
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
    for idx_q, q in enumerate(qs, 1):
        if not isinstance(q, dict):
            continue
        num = idx_q
        stem = q.get('stem', '') or ''
        passage = q.get('passage')
        if isinstance(passage, dict) and passage.get('text'):
            ptext = _coerce_text(passage.get('text'))
            # v18.6: 지문 제목 = passage.title → q.subDomain → q.concept 1줄 → '지문'
            #   영문 type(concept 등) 라벨 출력 금지
            ptitle = (passage.get('title') or q.get('subDomain') or '').strip()
            if not ptitle:
                cc = (q.get('concept') or '').strip()
                if cc:
                    # concept 1문장에서 ~30자만 (긴 설명은 자름)
                    ptitle = cc.split('.')[0].strip()
                    if len(ptitle) > 28:
                        ptitle = ptitle[:28] + '…'
            if not ptitle:
                ptitle = '지문'
            # v18.6: 지문+첫 문제 한 페이지 — 25줄 needspace 후 nobreak로 결속
            out.append(r'\par\needspace{25\baselineskip}')
            out.append(r'\kfPassageFull{' + latex_escape(ptitle) + r'}{%' +
                       '\n' + render_inline(ptext) + '\n' + r'}\par\nobreak\nopagebreak[4]\kfResetAreaFlag')
        out.append(r'\begin{kfQBlock}{' + _fmt_qnum(num) + '}{' + _qtype_from_item(q) + '}')
        # v14: stem 안 인라인 <보기>가 있으면 분리해서 박스로
        stem_clean, inline_box = _split_stem_box(stem)
        out.append(r'\kfQStem{' + _ul_neg(render_inline(stem_clean)) + '}')
        box = q.get('box')
        # 우선순위: q.box 필드 → stem 분리된 inline_box
        box_text = ''
        if box:
            box_text = '\n'.join(box) if isinstance(box, list) else str(box)
        elif inline_box:
            box_text = inline_box
        if box_text.strip():
            # v14.1: 자모 항목 자동 줄바꿈 + <보기> 라벨 제거
            box_text = _format_box_text(box_text)
            out.append(r'\begin{kfEvidence}' + render_inline(box_text, preserve_newlines=True) + r'\end{kfEvidence}')
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
