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
% v12: twoside 활성화 → fancyhdr LE/RE/LO/RO 분기 가능
\LoadClass[b5paper,twoside]{book}

% ---------- 시리즈별 geometry 차등 ----------
% v12: top 여백 + headheight + headsep 확대 (헤더 영역 충분히 확보)
\RequirePackage{geometry}
\ifcase\kf@series\relax
  % 0 = fallback (러셀 정책)
  \geometry{paperwidth=182mm,paperheight=257mm,top=20mm,bottom=16mm,inner=16mm,outer=12mm,headheight=28pt,headsep=8mm,footskip=12mm}
\or
  % 1 = Saussure
  \geometry{paperwidth=182mm,paperheight=257mm,top=24mm,bottom=18mm,inner=19mm,outer=14mm,headheight=30pt,headsep=10mm,footskip=14mm}
\or
  % 2 = Frege
  \geometry{paperwidth=182mm,paperheight=257mm,top=22mm,bottom=17mm,inner=18mm,outer=13mm,headheight=28pt,headsep=9mm,footskip=13mm}
\or
  % 3 = Russell
  \geometry{paperwidth=182mm,paperheight=257mm,top=20mm,bottom=16mm,inner=16mm,outer=12mm,headheight=28pt,headsep=8mm,footskip=12mm}
\or
  % 4 = Wittgenstein
  \geometry{paperwidth=182mm,paperheight=257mm,top=20mm,bottom=16mm,inner=16mm,outer=12mm,headheight=28pt,headsep=8mm,footskip=12mm}
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
\RequirePackage{eso-pic}

% v17: 페이지 전체 배경 PDF 삽입 (Canva 디자인)
% \IfFileExists로 가드 — 파일 없으면 무시
\newcommand{\kfPageBg}[1]{%
  \IfFileExists{#1.pdf}{%
    \AddToShipoutPictureBG*{%
      \AtPageLowerLeft{%
        \includegraphics[width=\paperwidth, height=\paperheight, keepaspectratio=false]{#1}%
      }%
    }%
  }{}%
}

% v17.1: 시리즈별 plain 배경 (영역 헤더 외 모든 페이지) — 자동 적용
% \kfPlainBgAuto는 fancy 페이지 스타일 진입 시 자동 호출
\def\kf@plainfile{}
\ifcase\kf@series\relax
  \def\kf@plainfile{rus_plain_bg_b5}%
\or
  \def\kf@plainfile{sau_plain_bg_b5}%
\or
  \def\kf@plainfile{fre_plain_bg_b5}%
\or
  \def\kf@plainfile{rus_plain_bg_b5}%
\or
  \def\kf@plainfile{wit_plain_bg_b5}%
\fi

% v18.2: 권 표지 페이지에는 반투명 마스크 비활성화
\newif\ifkf@usemask
\kf@usemasktrue

% 모든 fancy 페이지에 plain 배경 적용 — 단 영역 헤더 페이지는 자체 배경이 우선
% v18.2: plain 배경 위에 반투명 흰색 마스크를 깔아 본문 가독성 확보
\AddToShipoutPictureBG{%
  \IfFileExists{\kf@plainfile.pdf}{%
    \AtPageLowerLeft{%
      \includegraphics[width=\paperwidth, height=\paperheight, keepaspectratio=false]{\kf@plainfile}%
    }%
  }{}%
  \ifkf@usemask
    \AtPageLowerLeft{%
      \begin{tikzpicture}[remember picture, overlay]
        \fill[white, fill opacity=0.88, rounded corners=4pt]
          ($(current page.south west)+(7mm,12mm)$)
          rectangle ($(current page.north east)+(-7mm,-15mm)$);
      \end{tikzpicture}%
    }%
  \fi
  \global\kf@usemasktrue% 다음 페이지 위해 리셋
}

% v18.3: 활동/문제 배경이 마스크를 덮지 않도록 — 활동/문제 배경 위에 마스크 한 번 더
\newcommand{\kf@addMaskOverBg}{%
  \AddToShipoutPictureBG*{%
    \AtPageLowerLeft{%
      \begin{tikzpicture}[remember picture, overlay]
        \fill[white, fill opacity=0.88, rounded corners=4pt]
          ($(current page.south west)+(7mm,12mm)$)
          rectangle ($(current page.north east)+(-7mm,-15mm)$);
      \end{tikzpicture}%
    }%
  }%
}

% v18: 시리즈별 권 표지 / 챕터 표지 배경 매크로
\def\kf@bookcoverfile{}
\def\kf@chaptercoverfile{}
\ifcase\kf@series\relax
  \def\kf@bookcoverfile{rus_book_cover_bg_b5}\def\kf@chaptercoverfile{rus_chapter_cover_bg_b5}%
\or
  \def\kf@bookcoverfile{sau_book_cover_bg_b5}\def\kf@chaptercoverfile{sau_chapter_cover_bg_b5}%
\or
  \def\kf@bookcoverfile{fre_book_cover_bg_b5}\def\kf@chaptercoverfile{fre_chapter_cover_bg_b5}%
\or
  \def\kf@bookcoverfile{rus_book_cover_bg_b5}\def\kf@chaptercoverfile{rus_chapter_cover_bg_b5}%
\or
  \def\kf@bookcoverfile{wit_book_cover_bg_b5}\def\kf@chaptercoverfile{wit_chapter_cover_bg_b5}%
\fi
\newcommand{\kfBookCoverBg}{\kfPageBg{\kf@bookcoverfile}\global\kf@usemaskfalse}
\newcommand{\kfChapterCoverBg}{\kfPageBg{\kf@chaptercoverfile}}

% v18.2: 시리즈별 권 표지 텍스트 색상 (배경 밝기에 따라 흰/검 분기) + 텍스트 시작 여백
\ifcase\kf@series\relax
  \def\kfBookCoverColor{\color{white}}\def\kfBookCoverSubColor{\color{white!75!black}}\def\kfBookCoverVspace{60mm}%
\or
  \def\kfBookCoverColor{\color{kfInk}}\def\kfBookCoverSubColor{\color{kfMute}}\def\kfBookCoverVspace{50mm}%
\or
  \def\kfBookCoverColor{\color{kfInk}}\def\kfBookCoverSubColor{\color{kfMute}}\def\kfBookCoverVspace{125mm}%
\or
  \def\kfBookCoverColor{\color{white}}\def\kfBookCoverSubColor{\color{white!75!black}}\def\kfBookCoverVspace{60mm}%
\or
  \def\kfBookCoverColor{\color{white}}\def\kfBookCoverSubColor{\color{white!75!black}}\def\kfBookCoverVspace{85mm}%
\fi

% v18.5: 영역 헤더 직후 첫 컨텐츠는 needspace 무시 (영역 헤더만 있는 빈 페이지 방지)
\newif\ifkf@areaJustOpened
\kf@areaJustOpenedfalse
\newcommand{\kfMaybeNeedspace}[1]{%
  \ifkf@areaJustOpened
    \global\kf@areaJustOpenedfalse%
  \else
    \needspace{#1}%
  \fi
}
% v18.6: 영역 직후 플래그 리셋 (지문 박스 등 첫 컨텐츠 후 호출)
\newcommand{\kfResetAreaFlag}{\global\kf@areaJustOpenedfalse}

% v18.6: 지시문 앞에 붙이는 삼각 마크 — TikZ로 직접 그려 폰트 미지원(▸→⊠) 회피
\newcommand{\kfTipMark}{%
  \tikz[baseline=-0.2ex]{%
    \fill[kfPrimary] (0pt,-0.4ex) -- (3.6pt,0.6ex) -- (0pt,1.6ex) -- cycle;%
  }%
}

% v18.6 NOTE: 한자 확장 영역(筇 焼 寧 顏 등) + IPA(ŋ ɾ ʌ ː) + 위첨자/아래첨자
% 폰트 fallback은 후속 작업. 현재는 ▸→\kfTipMark 치환만 적용.
% 본문 내 한자/IPA 깨짐은 컨텐츠(JSON) 측에서 표기를 수정하는 것이 안전.
\newcommand{\kfHanja}[1]{#1}

% v18.2: 답 쓰는 그래픽 빈칸 매크로 ( ) 자동 치환용
% 인자 1개: 너비 단위 옵션 (기본 16mm). 학생이 펜으로 답을 쓸 둥근 사각 박스
\newcommand{\kfFillBlank}[1][16mm]{%
  \tikz[baseline=-0.4ex]{%
    \draw[kfRule, line width=0.4pt, rounded corners=2pt]
      (0,-1.4ex) rectangle (#1, 1.4ex);%
  }%
}

% v18.1: 시리즈별 활동/문제 강조 배경 매크로 (다음 페이지 1장에만 적용)
\def\kf@actfile{}
\def\kf@qfile{}
\ifcase\kf@series\relax
  \def\kf@actfile{rus_act_bg_b5}\def\kf@qfile{rus_q_bg_b5}%
\or
  \def\kf@actfile{sau_act_bg_b5}\def\kf@qfile{sau_q_bg_b5}%
\or
  \def\kf@actfile{fre_act_bg_b5}\def\kf@qfile{fre_q_bg_b5}%
\or
  \def\kf@actfile{rus_act_bg_b5}\def\kf@qfile{rus_q_bg_b5}%
\or
  \def\kf@actfile{wit_act_bg_b5}\def\kf@qfile{wit_q_bg_b5}%
\fi
\newcommand{\kfActivityBg}{\kfPageBg{\kf@actfile}\kf@addMaskOverBg}
\newcommand{\kfQuestionBg}{\kfPageBg{\kf@qfile}\kf@addMaskOverBg}

% ---------- 폰트 설정 (Noto Sans/Serif KR Variable Font) ----------
% v18.4: 본문 가독성↑ — weight 400→500 (Medium). 학년 수준 분기:
%   소쉬르(입문)/프레게(중급) = Sans (NotoSansKR) — 친근, 가독성↑
%   러셀(고급)/비트(수능) = Serif (NotoSerifKR) — 학구적, 인쇄 교재 분위기
\setmainfont{NotoSerifKR-VF.ttf}[
  Path = C:/WINDOWS/Fonts/,
  UprightFeatures = {RawFeature={+axis={wght=500}}},
  BoldFeatures    = {RawFeature={+axis={wght=800}}},
  AutoFakeSlant = 0.15
]
\setsansfont{NotoSansKR-VF.ttf}[
  Path = C:/WINDOWS/Fonts/,
  UprightFeatures = {RawFeature={+axis={wght=500}}},
  BoldFeatures    = {RawFeature={+axis={wght=800}}},
  AutoFakeSlant = 0.15
]
% 시리즈별 CJK 본문 폰트 분기
\ifcase\kf@series\relax
  % 0=fallback (러셀)
  \setCJKmainfont{NotoSerifKR-VF.ttf}[Path = C:/WINDOWS/Fonts/, UprightFeatures={RawFeature={+axis={wght=500}}}, BoldFeatures={RawFeature={+axis={wght=800}}}, AutoFakeSlant=0.15]
\or
  % 1=소쉬르 (입문) — Sans 친근
  \setCJKmainfont{NotoSansKR-VF.ttf}[Path = C:/WINDOWS/Fonts/, UprightFeatures={RawFeature={+axis={wght=500}}}, BoldFeatures={RawFeature={+axis={wght=800}}}, AutoFakeSlant=0.15]
\or
  % 2=프레게 (중급) — Sans 친근
  \setCJKmainfont{NotoSansKR-VF.ttf}[Path = C:/WINDOWS/Fonts/, UprightFeatures={RawFeature={+axis={wght=500}}}, BoldFeatures={RawFeature={+axis={wght=800}}}, AutoFakeSlant=0.15]
\or
  % 3=러셀 (고급) — Serif 학구적
  \setCJKmainfont{NotoSerifKR-VF.ttf}[Path = C:/WINDOWS/Fonts/, UprightFeatures={RawFeature={+axis={wght=500}}}, BoldFeatures={RawFeature={+axis={wght=800}}}, AutoFakeSlant=0.15]
\or
  % 4=비트 (수능) — Serif 학구적
  \setCJKmainfont{NotoSerifKR-VF.ttf}[Path = C:/WINDOWS/Fonts/, UprightFeatures={RawFeature={+axis={wght=500}}}, BoldFeatures={RawFeature={+axis={wght=800}}}, AutoFakeSlant=0.15]
\fi
\setCJKsansfont{NotoSansKR-VF.ttf}[
  Path = C:/WINDOWS/Fonts/,
  UprightFeatures = {RawFeature={+axis={wght=500}}},
  BoldFeatures    = {RawFeature={+axis={wght=800}}}
]
% 본문 기본 — 소쉬·프레는 Sans, 러셀·비트는 Serif
\ifcase\kf@series\relax
  \renewcommand{\familydefault}{\rmdefault}% 0
\or
  \renewcommand{\familydefault}{\sfdefault}% 1=소쉬르
\or
  \renewcommand{\familydefault}{\sfdefault}% 2=프레게
\or
  \renewcommand{\familydefault}{\rmdefault}% 3=러셀
\or
  \renewcommand{\familydefault}{\rmdefault}% 4=비트
\fi
% v18.4: 본문 텍스트 색상 진검정 (마스크 위 가독성↑)
\AtBeginDocument{\color{black}}

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

% ---------- 머리말/꼬리말 (v12: twoside LE/RE/LO/RO) ----------
% 헤더: outer=국어농장 V2, inner=영역명(\leftmark)
% 푸터: outer=페이지번호, inner=챕터명(\rightmark)
\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\footrulewidth}{0pt}

% v18.5: 국어농장 로고 매크로 (모든 시리즈 공통)
\newcommand{\kfLogo}[1][22mm]{%
  \IfFileExists{korfarm-logo.png}{\includegraphics[height=#1, keepaspectratio]{korfarm-logo}}{국어농장 V2}%
}
\newcommand{\kfLogoSm}{\kfLogo[10pt]}% 헤더용 작은 로고
\newcommand{\kfLogoMd}{\kfLogo[14mm]}% 챕터 표지용
\newcommand{\kfLogoLg}{\kfLogo[26mm]}% 권 표지용 큰 로고

% 짝수 페이지(왼쪽) — outer=좌, inner=우
\fancyhead[LE]{\raisebox{-2pt}{\kfLogoSm}}
\fancyhead[RE]{\small\color{kfPrimary}\leftmark}
\fancyfoot[LE]{\small\bfseries\color{kfInk}\thepage}
\fancyfoot[RE]{\small\color{kfMute}\rightmark}

% 홀수 페이지(오른쪽) — inner=좌, outer=우
\fancyhead[LO]{\small\color{kfPrimary}\leftmark}
\fancyhead[RO]{\raisebox{-2pt}{\kfLogoSm}}
\fancyfoot[LO]{\small\color{kfMute}\rightmark}
\fancyfoot[RO]{\small\bfseries\color{kfInk}\thepage}

% 마커 매핑: \leftmark=영역명, \rightmark=챕터명
% (area-header.tex / chapter-cover.tex 에서 \kfMarkArea{...} \kfMarkChapter{...} 호출)
\gdef\kf@currentchapter{}
\newcommand{\kfMarkChapter}[1]{%
  \gdef\kf@currentchapter{#1}%
  \markboth{}{#1}%
}
% v16: 영역+시리즈별 메모란 카테고리 자동 매핑
\def\kf@areaVocab{어휘}\def\kf@areaGrammar{문법}\def\kf@areaConcept{개념}
\def\kf@areaLit{문학}\def\kf@areaNonlit{비문학}
\newcommand{\kfMarkArea}[1]{%
  \markboth{#1}{\kf@currentchapter}%
  \def\kf@curarea{#1}%
  \ifx\kf@curarea\kf@areaVocab\gdef\kf@memocat{낱말 메모}\fi
  \ifx\kf@curarea\kf@areaGrammar\gdef\kf@memocat{규칙 정리}\fi
  \ifx\kf@curarea\kf@areaConcept\gdef\kf@memocat{핵심 정리}\fi
  \ifx\kf@curarea\kf@areaLit
    \ifcase\kf@series\relax
      \gdef\kf@memocat{감상/해석/근거}%
    \or\gdef\kf@memocat{감상/느낌}%
    \or\gdef\kf@memocat{감상/해석}%
    \or\gdef\kf@memocat{감상/해석/근거}%
    \or\gdef\kf@memocat{정의/근거/예외}%
    \fi
  \fi
  \ifx\kf@curarea\kf@areaNonlit
    \ifcase\kf@series\relax
      \gdef\kf@memocat{근거/비교/판단}%
    \or\gdef\kf@memocat{핵심 정리}%
    \or\gdef\kf@memocat{핵심 정리}%
    \or\gdef\kf@memocat{근거/비교/판단}%
    \or\gdef\kf@memocat{정의/근거/예외}%
    \fi
  \fi
}

% 챕터 표지·권 표지: 헤더/푸터 없음
\fancypagestyle{kfBlank}{%
  \fancyhf{}%
  \renewcommand{\headrulewidth}{0pt}%
  \renewcommand{\footrulewidth}{0pt}%
}

% multicols 안 여부와 무관하게 컬럼 남은 공간 가져오는 wrapper.
% multicols 안: \@colroom (한 컬럼 남은 공간)
% multicols 밖: \pagegoal-\pagetotal
\newcommand{\kfStoreColRoom}[1]{%
  \@ifundefined{@colroom}%
    {\setlength{#1}{\dimexpr\pagegoal-\pagetotal\relax}}%
    {\setlength{#1}{\dimexpr\@colroom-\pagetotal\relax}}%
}

% multicols* 환경 진입 추적 (kfQBlock의 break 분기용)
\newif\ifkfInMC
\kfInMCfalse

% 소쉬르(1)/프레게(2): 지문 박스를 항상 새 페이지에서 시작 (사용자 정책)
% 러셀(3)/비트(4): 페이지 효율 위해 새 페이지 강제 안 함
\newif\ifkfPassageNewPage
\kfPassageNewPagefalse
\ifcase\kf@series\relax\or\kfPassageNewPagetrue\or\kfPassageNewPagetrue\fi

% v16: 메모란 카테고리 라벨 (시리즈별 default)
%   소쉬르 = 감상/느낌  / 프레게 = 핵심 정리
%   러셀   = 근거/비교/판단 / 비트 = 정의/근거/예외
\def\kf@memocat{}
\ifcase\kf@series\relax
  \def\kf@memocat{근거/판단}%
\or
  \def\kf@memocat{감상/느낌}%
\or
  \def\kf@memocat{핵심 정리}%
\or
  \def\kf@memocat{근거/비교/판단}%
\or
  \def\kf@memocat{정의/근거/예외}%
\fi
\newcommand{\kfSetMemoCategory}[1]{\gdef\kf@memocat{#1}}
% 환경에서 사용: \kfBeginMC ... \kfEndMC가 multicols*를 감쌈
% v15: needspace 0.45→0.3 (라벨만 페이지 상단에 두고 빈 공간 생기는 문제 완화)
\newcommand{\kfBeginMC}{%
  \par\needspace{0.3\textheight}%
  \kfInMCtrue%
  \begin{multicols*}{2}\raggedcolumns\setlength{\columnsep}{12pt}%
}
\newcommand{\kfEndMC}{%
  \end{multicols*}%
  \kfInMCfalse%
}

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
