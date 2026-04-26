% ============================================================
% korfarm-base.cls
% 국어농장 V2 학생용 교재 공통 베이스 클래스
% B5(182x257), XeLaTeX, 한국어, 학생용(정답/해설 제외)
% v3 — 페이지 압축: 시리즈별 차등 폰트/행간/여백/단폭
% ============================================================
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{korfarm-base}[2026/04/19 v0.3 Korfarm V2 Student Textbook Base (compressed)]

% ---------- 옵션: 폰트 크기 (정수 ID로 관리) ----------
% 0=fallback 1=9.5pt 2=10pt 3=10.5pt 4=11pt 5=12pt 6=13pt 7=8.5pt 8=9pt
\newcommand{\kf@fsid}{2}
\DeclareOption{fs85}{\renewcommand{\kf@fsid}{7}}
\DeclareOption{fs9}{\renewcommand{\kf@fsid}{8}}
\DeclareOption{fs95}{\renewcommand{\kf@fsid}{1}}
\DeclareOption{fs10}{\renewcommand{\kf@fsid}{2}}
\DeclareOption{fs105}{\renewcommand{\kf@fsid}{3}}
\DeclareOption{fs11}{\renewcommand{\kf@fsid}{4}}
\DeclareOption{fs12}{\renewcommand{\kf@fsid}{5}}
\DeclareOption{fs13}{\renewcommand{\kf@fsid}{6}}

% ---------- 옵션: 시리즈 (행간·여백·패딩 차등) ----------
% 1=Saussure 2=Frege 3=Russell 4=Wittgenstein
\newcommand{\kf@series}{3}
\DeclareOption{seriesSau}{\renewcommand{\kf@series}{1}}
\DeclareOption{seriesFre}{\renewcommand{\kf@series}{2}}
\DeclareOption{seriesRus}{\renewcommand{\kf@series}{3}}
\DeclareOption{seriesWit}{\renewcommand{\kf@series}{4}}

% ---------- 옵션: 단 ----------
\newif\ifkf@twocol
\kf@twocolfalse
\DeclareOption{twocolumn}{\kf@twocoltrue}

% 알 수 없는 옵션은 book 클래스로 전달
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{book}}
\ProcessOptions\relax

% ---------- 베이스 클래스 ----------
\LoadClass[a4paper,oneside]{book}

% ---------- 시리즈별 geometry 차등 ----------
%   Sau/Fre: top/bottom 16mm/14mm, inner 18mm, outer 13mm
%   Rus/Wit: top/bottom 11mm,      inner 14mm, outer 11mm  (v4: 압축 강화)
\RequirePackage{geometry}
\ifcase\kf@series\relax
  % 0 = fallback (러셀 정책)
  \geometry{paperwidth=182mm,paperheight=257mm,top=11mm,bottom=11mm,inner=14mm,outer=11mm,headheight=12pt,headsep=4mm,footskip=7mm}
\or
  % 1 = Saussure
  \geometry{paperwidth=182mm,paperheight=257mm,top=16mm,bottom=16mm,inner=18mm,outer=13mm,headheight=14pt,headsep=7mm,footskip=10mm}
\or
  % 2 = Frege  (v4: top/bottom 16→14mm, headsep/footskip 미세 압축)
  \geometry{paperwidth=182mm,paperheight=257mm,top=14mm,bottom=14mm,inner=17mm,outer=12mm,headheight=13pt,headsep=5mm,footskip=8mm}
\or
  % 3 = Russell  (v4: top/bottom 13→11mm)
  \geometry{paperwidth=182mm,paperheight=257mm,top=11mm,bottom=11mm,inner=14mm,outer=11mm,headheight=12pt,headsep=4mm,footskip=7mm}
\or
  % 4 = Wittgenstein  (v4: top/bottom 13→11mm)
  \geometry{paperwidth=182mm,paperheight=257mm,top=11mm,bottom=11mm,inner=14mm,outer=11mm,headheight=12pt,headsep=4mm,footskip=7mm}
\fi

% ---------- 필수 패키지 ----------
\RequirePackage{fontspec}
\RequirePackage{xunicode}
\RequirePackage{xeCJK}
\RequirePackage{kotex}
\RequirePackage[table,dvipsnames,svgnames]{xcolor}
\RequirePackage{tcolorbox}
\tcbuselibrary{skins,breakable,raster}
\RequirePackage{multicol}
\RequirePackage{needspace}
\RequirePackage{ulem}
\normalem
\RequirePackage{fancyhdr}
\RequirePackage{tikz}
\usetikzlibrary{shapes,positioning,calc,decorations.pathmorphing}
\RequirePackage{enumitem}
\RequirePackage{array}
\RequirePackage{tabularx}
\RequirePackage{multirow}
\RequirePackage{adjustbox}
\RequirePackage{setspace}
\RequirePackage{titlesec}
\RequirePackage{ifthen}
\RequirePackage{calc}
\RequirePackage{graphicx}
\RequirePackage[hidelinks]{hyperref}

% ---------- 폰트 설정 (Noto Sans/Serif KR Variable Font) ----------
\setmainfont{NotoSerifKR-VF.ttf}[
  Path = C:/WINDOWS/Fonts/,
  UprightFeatures = {RawFeature={+axis={wght=400}}},
  BoldFeatures    = {RawFeature={+axis={wght=700}}},
  AutoFakeSlant = 0.15
]
\setsansfont{NotoSansKR-VF.ttf}[
  Path = C:/WINDOWS/Fonts/,
  UprightFeatures = {RawFeature={+axis={wght=400}}},
  BoldFeatures    = {RawFeature={+axis={wght=700}}},
  AutoFakeSlant = 0.15
]
\setCJKmainfont{NotoSansKR-VF.ttf}[
  Path = C:/WINDOWS/Fonts/,
  UprightFeatures = {RawFeature={+axis={wght=400}}},
  BoldFeatures    = {RawFeature={+axis={wght=700}}},
  AutoFakeSlant = 0.15
]
\setCJKsansfont{NotoSansKR-VF.ttf}[
  Path = C:/WINDOWS/Fonts/,
  UprightFeatures = {RawFeature={+axis={wght=400}}},
  BoldFeatures    = {RawFeature={+axis={wght=700}}}
]
% 본문 기본은 Sans (Noto Sans KR)
\renewcommand{\familydefault}{\sfdefault}

% ---------- 폰트 크기 강제 (\ifcase 분기) ----------
\AtBeginDocument{%
  \ifcase\kf@fsid\relax
    \fontsize{10}{14}\selectfont% 0=fallback
  \or
    \fontsize{9.5}{13.5}\selectfont% 1=fs95
  \or
    \fontsize{10}{14}\selectfont% 2=fs10
  \or
    \fontsize{10.5}{14.7}\selectfont% 3=fs105
  \or
    \fontsize{11}{15.4}\selectfont% 4=fs11
  \or
    \fontsize{12}{17}\selectfont% 5=fs12
  \or
    \fontsize{13}{18}\selectfont% 6=fs13
  \or
    \fontsize{8.5}{10.5}\selectfont% 7=fs85
  \or
    \fontsize{9}{11.3}\selectfont% 8=fs9
  \fi
}

% ---------- 시리즈별 줄 간격 (linespread) ----------
%   v4: Sau 1.5 / Fre 1.32 / Rus 1.22 / Wit 1.13  (페이지 압축 강화)
\ifcase\kf@series\relax
  \linespread{1.22}
\or
  \linespread{1.5}
\or
  \linespread{1.32}
\or
  \linespread{1.22}
\or
  \linespread{1.13}
\fi
\setlength{\parindent}{0pt}
\setlength{\parskip}{2pt plus 1pt minus 0.5pt}

% ---------- 학생용 플래그 (정답/해설 제외용) ----------
\newif\ifkfStudent
\kfStudenttrue % 기본 학생용
\newcommand{\kfTeacherMode}{\kfStudentfalse}
\newcommand{\kfStudentMode}{\kfStudenttrue}

\newenvironment{kfAnswer}{\ifkfStudent\setbox0\vbox\bgroup\else\par\noindent\textbf{[정답]}\fi}%
{\ifkfStudent\egroup\fi}
\newenvironment{kfExplain}{\ifkfStudent\setbox0\vbox\bgroup\else\par\noindent\textbf{[해설]}\fi}%
{\ifkfStudent\egroup\fi}
\newenvironment{kfModelAnswer}{\ifkfStudent\setbox0\vbox\bgroup\else\par\noindent\textbf{[모범 답안]}\fi}%
{\ifkfStudent\egroup\fi}

% ---------- 공통 컬러 토큰 ----------
\definecolor{kfInk}{HTML}{1A1A1A}
\definecolor{kfMute}{HTML}{6B7280}
\definecolor{kfPaper}{HTML}{FFFFFF}
\definecolor{kfRule}{HTML}{D1D5DB}

\definecolor{kfAreaVocab}{HTML}{F5C400}
\definecolor{kfAreaGrammar}{HTML}{2E8B57}
\definecolor{kfAreaConcept}{HTML}{1F6FB2}
\definecolor{kfAreaLiterature}{HTML}{C0392B}
\definecolor{kfAreaNonlit}{HTML}{6A40A8}
\definecolor{kfAreaWeekly}{HTML}{6B7280}

\definecolor{kfPrimary}{HTML}{1F6FB2}
\definecolor{kfPrimaryLight}{HTML}{E6F0FA}
\definecolor{kfAccent}{HTML}{D97706}
\definecolor{kfPassageBg}{HTML}{FAFAF7}
\definecolor{kfNoteBg}{HTML}{FFFEF6}

% ---------- 시리즈별 박스 패딩 길이 ----------
% \kfBoxPad = 지문/보기/조건 박스 내부 여백 (기본 padding)
% Sau 8pt / Fre 6pt / Rus 4pt / Wit 4pt
\newlength{\kfBoxPad}
\ifcase\kf@series\relax
  \setlength{\kfBoxPad}{4pt}
\or
  \setlength{\kfBoxPad}{8pt}
\or
  \setlength{\kfBoxPad}{6pt}
\or
  \setlength{\kfBoxPad}{4pt}
\or
  \setlength{\kfBoxPad}{4pt}
\fi

% ---------- 시리즈별 단 간격 (러셀+/비트 2단) ----------
% v4: Rus/Wit columnsep 8pt → 6pt (압축)
\newlength{\kfColSep}
\ifcase\kf@series\relax
  \setlength{\kfColSep}{6pt}
\or
  \setlength{\kfColSep}{14pt}
\or
  \setlength{\kfColSep}{12pt}
\or
  \setlength{\kfColSep}{6pt}
\or
  \setlength{\kfColSep}{6pt}
\fi

% ---------- 머리말/꼬리말 ----------
\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\footrulewidth}{0pt}
\fancyhead[L]{\small\color{kfMute}\leftmark}
\fancyhead[R]{\small\color{kfMute}국어농장 V2}
\fancyfoot[C]{\thepage}

\renewcommand{\chaptermark}[1]{\markboth{#1}{}}

% ---------- 영역 표제 ----------
\newcommand{\kfAreaHeader}[3]{%
  \par\needspace{6\baselineskip}%
  \vspace{6pt}%
  \noindent
  \begin{tikzpicture}
    \node[anchor=west, inner sep=0pt] (bar) at (0,0) {\color{#1}\rule{4pt}{20pt}};
    \node[anchor=west, inner sep=0pt, xshift=8pt] at (bar.east) {%
      \begin{tabular}{@{}l@{}}
        \large\bfseries\color{#1} #2 \\[-1pt]
        \footnotesize\color{kfMute} #3
      \end{tabular}%
    };
  \end{tikzpicture}%
  \par\vspace{4pt}
  {\color{kfRule}\hrule height 0.4pt}%
  \par\vspace{4pt}
}

\newcommand{\kfAreaVocabHeader}[1]{\kfAreaHeader{kfAreaVocab}{어휘}{#1}}
\newcommand{\kfAreaGrammarHeader}[1]{\kfAreaHeader{kfAreaGrammar}{문법}{#1}}
\newcommand{\kfAreaConceptHeader}[1]{\kfAreaHeader{kfAreaConcept}{개념}{#1}}
\newcommand{\kfAreaLitHeader}[1]{\kfAreaHeader{kfAreaLiterature}{문학}{#1}}
\newcommand{\kfAreaNonlitHeader}[1]{\kfAreaHeader{kfAreaNonlit}{비문학}{#1}}
\newcommand{\kfAreaWeeklyHeader}[1]{\kfAreaHeader{kfAreaWeekly}{실력 확인}{#1}}

% ---------- 문제 번호 배지 ----------
\newcommand{\kfQNum}[1]{%
  \tikz[baseline=(qn.base)]{%
    \node[draw=kfAccent, fill=kfAccent!10, text=kfAccent,
          rounded corners=3pt, inner sep=2.5pt, font=\small\bfseries]
          (qn) {#1};%
  }%
}

\newcommand{\kfQType}[1]{{\footnotesize\color{kfMute}\textbf{[\,#1\,]}}}

\newcommand{\kfSmartNewPage}{\needspace{10\baselineskip}}

% ---------- 단 환경 (시리즈별 \kfColSep 사용) ----------
\newenvironment{kfTwoCol}%
  {\begin{multicols}{2}\raggedcolumns\setlength{\columnsep}{\kfColSep}}%
  {\end{multicols}}

\ifkf@twocol
  \AtBeginDocument{}
\fi

% ---------- 무단절 minipage 헬퍼 ----------
\newenvironment{kfBlock}%
  {\par\smallskip\noindent\begin{minipage}{\linewidth}}%
  {\end{minipage}\par\smallskip}

% ---------- 한국어 양수 따옴표 보호 ----------
\XeTeXlinebreaklocale "ko"
\XeTeXlinebreakskip = 0pt plus 1pt
