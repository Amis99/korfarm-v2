# 테스트지 PDF 생성 (XeLaTeX)

시험지 데이터를 DB에서 읽어 XeLaTeX으로 PDF를 생성하고 S3에 업로드, DB에 URL을 등록하는 스킬.

## 환경

- **XeLaTeX**: `C:\TinyTeX\TinyTeX\bin\windows\xelatex.exe`
- **Python**: `py` 명령어 사용 (Windows)
- **폰트**: Noto Sans KR VF (`C:/Windows/Fonts/NotoSansKR-VF.ttf`)
- **스크립트**: `scripts/generate-test-pdfs-latex.py`
- **출력**: `generated/test-pdfs/`
- **S3**: `s3://korfarm-frontend/test-pdfs/`
- **CloudFront**: `dbtbky39ni3nn.cloudfront.net`, Distribution ID `E29A5UX2VDFB4I`
- **DB**: `test_papers.pdf_file_id` 컬럼에 CloudFront URL 저장

## LaTeX 템플릿 규칙

### 필수 패키지
```
fontspec, xeCJK, geometry, graphicx, fancyhdr, xcolor,
tikz, tcolorbox(most), enumitem, setspace,
needspace, etoolbox, ulem
```
> **주의**: `multicol` 패키지 사용 금지 — tcolorbox breakable과 칼럼 분할 충돌.

### 한글 띄어쓰기 필수
```latex
\usepackage{xeCJK}
\xeCJKsetup{CJKspace=true}
```
> **이 설정이 없으면 한글 단어 사이 공백이 모두 제거됨!**

### 폰트 설정 (Variable Font)
```latex
\setCJKmainfont{Noto Sans KR}[
  Path=C:/Windows/Fonts/, Extension=.ttf,
  UprightFont=NotoSansKR-VF, BoldFont=NotoSansKR-VF,
  UprightFeatures={RawFeature={axis={wght=400}}},
  BoldFeatures={RawFeature={axis={wght=700}}},
]
```
`\setmainfont`도 동일하게 설정해야 ①②③ 등 기호도 Noto Sans로 렌더링됨.

### 레벨별 폰트 크기
| 레벨 | 본문pt | 행간pt | 지문행간pt | 단구성 |
|------|--------|--------|-----------|--------|
| saussure1 | 14 | 19 | 22 | 1단 |
| saussure2/3 | 13 | 17.5 | 21 | 1단 |
| frege1/2 | 12 | 16 | 19 | 2단 |
| frege3 | 11 | 15 | 18 | 2단 |
| russell1/2/3 | 10 | 14 | 16.5 | 2단 |

본문 크기 적용: `\fontsize{14pt}{19pt}\selectfont` (프리앰블에서)

### 1단/2단 레이아웃
- **saussure**: 1단, `\begin{samepage}` 로 문제 블록 보호
- **frege/russell**: 2단, **네이티브 `\twocolumn[<헤더>]`** 사용, `\begin{minipage}{\columnwidth}` 로 문제 블록 보호
- `multicol` 패키지 사용 금지: `multicol`은 자체 출력 루틴을 사용하여 tcolorbox breakable의 칼럼 분할 훅과 충돌함. 네이티브 `\twocolumn`은 LaTeX 표준 출력 루틴을 쓰므로 tcolorbox breakable과 정상 호환.
- `\twocolumn[<헤더>]` — 대괄호 안의 헤더는 전체 폭으로 출력, 이후 콘텐츠는 2단

### 헤더 구조
```
[로고] 레벨명  ㅇ장 챕터 테스트          ㅇ문항·ㅇ점·60분
═══════════════════════════════════════════════════════════
         레벨명  ㅇ장 챕터 테스트
─────────────────────────────────────────────────────────
    __________학교    __________학년    이름__________
─────────────────────────────────────────────────────────
```
학교/학년 밑줄은 좌측, 이름 밑줄은 우측. **한 줄 우측 정렬**, 위아래 충분한 여백.

### 문제 출력 순서
1. **지문 안내문** — `{\small\textbf{※ 다음 글을 읽고 물음에 답하시오.}}` (검정 볼드, 동일 지문 연속 시 생략)
2. **지문** — `tcolorbox[passage, breakable]` (연회색, **항상 breakable** — 단/페이지 바꿈 허용)
3. **발문** — `\hangindent=2em` + `\qnum{번호}\enspace 발문텍스트 \pts{배점}` (둘째 줄부터 들여쓰기)
4. **보기** — `tcolorbox[bogi]` (연파란, "〈보기〉" 타이틀)
5. **조건** — `tcolorbox[cond]` (연주황, "〈조건〉" 타이틀)
6. **선택지** — `\begin{itemize}[leftmargin=2.5em, itemsep=4pt]` (①②③④⑤, 넓은 줄간격)
7. **답안 밑줄** — 서술형/단답형일 때 `\answerlines{줄수}` (**35pt 간격** — 20pt 글씨 수용)

### 페이지 바꿈 규칙
- **지문**: breakable tcolorbox — 단/페이지 바꿈 허용
- **지문 없는 문제**: samepage/minipage로 감싸서 바꿈 방지
- **페이지 넘침(푸터 침범)**: 절대 금지

### stem 마커 파싱
`stem` 필드에서 `<보기>`, `<조건>` 텍스트를 분리:
```
"발문 텍스트\n\n<보기>\n보기 내용\n<조건>\n조건 내용"
→ main_text, bogi, condition 3개로 분리
```
> **핵심 규칙**: `<보기>`/`<조건>` 태그는 **줄에 단독으로 위치할 때만** 인식.
> 태그 뒤에 바로 텍스트가 오면 무시됨 (예: `<보기>의 민수가` → 문장 속 참조, 태그 아님).
> - 태그: `<보기>` (꺾쇠) + 같은 줄에 다른 텍스트 없음 → 보기 상자로 분리
> - 참조: `〈보기〉` (산괄호) 또는 `<보기>` 뒤에 바로 텍스트 → 발문 텍스트로 유지
> - 정규식: `(?:^|\n)[ \t]*<보기>[ \t]*(?:\n|$)`
> - DB에 새 문제 입력 시: 문장 속 참조는 반드시 `〈보기〉` (산괄호) 사용

### 중복 지문 제거
연속된 문제가 동일한 `passage`를 공유하면 첫 번째만 렌더링. 안내문도 첫 번째에서만 출력.

### LaTeX 특수문자 이스케이프
`& % $ # _ { } ~ ^` → 모두 이스케이프 필수.
HTML 태그 변환: `<u>` → `\uline{}`, `<b>` → `\textbf{}`, `<br>` → 줄바꿈.

### `\\` 뒤 `[` 방지
줄바꿈 `\\` 다음에 `[`가 오면 LaTeX가 선택적 인자로 해석함.
**반드시 `\\{}`** 로 사용하여 방지.

### 서술형/단답형 답안 밑줄
```latex
\newcommand{\answerlines}[1]{%
  \par\vspace{4pt}%
  \foreach \i in {1,...,#1} {%
    {\color{answerLine}\hrule height 0.4pt}\vspace{35pt}%
  }%
  \vspace{2pt}%
}
```
줄 수 추정: 모범답안 20자 이하 → 1줄, 60자 → 2줄, 120자 → 3줄, 그 이상 → 4줄.
모범답안 없으면 배점 기반: 8점↑ → 3줄, 5점↑ → 2줄, 나머지 1줄.

## 실행 방법

```bash
# 전체 생성 + S3 + DB
py scripts/generate-test-pdfs-latex.py

# 특정 레벨/챕터만
py scripts/generate-test-pdfs-latex.py --level saussure1 --chapter 1

# 테스트 (업로드/DB 없이)
py scripts/generate-test-pdfs-latex.py --level saussure1 --chapter 1 --no-upload --no-db

# .tex 파일도 보존
py scripts/generate-test-pdfs-latex.py --keep-tex

# .tex만 생성 (컴파일 안 함)
py scripts/generate-test-pdfs-latex.py --tex-only
```

## 새로운 테스트지 유형 추가 시

1. `LEVEL_FONT_CONFIG`에 레벨 추가
2. `LEVEL_LABELS`에 한글 레이블 추가
3. `TWO_COLUMN_LEVELS`에 2단 레이아웃 여부 추가
4. DB 쿼리 조건 수정 (테이블/조인 변경)
5. `make_preamble`, `make_header_block` 커스터마이징
6. `make_question_block`에 새 문제 유형 처리 추가

## 주의사항

- Windows `tempfile.TemporaryDirectory`에서 대량 배치 시 일시적 실패 가능 → `max_retries=2` 재시도 로직 내장
- `subprocess.run`에 `encoding="utf-8", errors="replace"` 필수 (cp949 인코딩 오류 방지)
- PDF는 S3에만 저장, git에는 커밋하지 않음
- CloudFront 도메인: `dbtbky39ni3nn.cloudfront.net` (스크립트 `CF_DOMAIN` 상수)

$ARGUMENTS
