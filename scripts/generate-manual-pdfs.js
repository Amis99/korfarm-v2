#!/usr/bin/env node
/**
 * 매뉴얼 Markdown → 표지/목차/스크린샷 삽입 → HTML → PDF 변환
 *
 * 요구사항:
 *  - 표지 페이지 (로고, 제목, 부제, 발행일)
 *  - 목차 페이지 (별도 페이지, .toc 스타일)
 *  - 내용 누락/잘림 없음
 *  - 페이지 배치 깔끔하게 (orphan/widow 방지)
 *  - 내용 요소 중간에 페이지 바꿈 안 생기게
 *  - <!-- IMG: name --> 마커 기반 스크린샷 삽입
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const { marked } = require("marked");

const DOCS_DIR = path.join(__dirname, "..", "docs");
const SS_DIR = path.join(DOCS_DIR, "screenshots");
const LOGO_PATH = path.join(__dirname, "..", "frontend", "public", "korfarm-logo.png");

// 매뉴얼별 부제
const MANUAL_SUBTITLES = {
  "manual-admin": "관리자를 위한 운영 가이드",
  "manual-student": "학생을 위한 학습 가이드",
  "manual-parent": "학부모를 위한 모니터링 가이드",
};

/**
 * 로고 파일을 base64 data URI로 변환
 */
function loadLogoBase64() {
  if (!fs.existsSync(LOGO_PATH)) {
    console.warn(`  경고: 로고 파일 없음 — ${LOGO_PATH}`);
    return null;
  }
  const imgData = fs.readFileSync(LOGO_PATH);
  return `data:image/png;base64,${imgData.toString("base64")}`;
}

/**
 * 표지 HTML 생성
 */
function buildCoverHtml(logoBase64, title, subtitle) {
  const logoTag = logoBase64
    ? `<img class="logo" src="${logoBase64}" alt="국어농장 로고" />`
    : "";
  return `<div class="cover-page">
  <div class="brand-line"></div>
  ${logoTag}
  <div class="title">${title}</div>
  <div class="subtitle">${subtitle}</div>
  <div class="date">2026년 3월</div>
  <div class="publisher">국어농장</div>
</div>`;
}

// ─── UI 목업 데이터: 각 화면별 mock 정의 ───
const UI_MOCKS = {
  // ── 공개 ──
  "landing":    { title: "국어농장", theme: "light", topBar: ["프로그램 소개","학습 안내","진단 안내","요금 안내","FAQ","상담"], elements: ["히어로: 스스로 완성하는 국어 근육, 국어농장과 함께하세요","통계: 9 교재 시리즈 · 12 레벨 · 180+ 콘텐츠 · AI 자동 채점","6가지 학습 모드 카드 그리드","4서버 12레벨 진단 시스템","요금 안내 (Basic / Pro / Academy)"] },
  "login":      { title: "로그인", theme: "light", topBar: [], elements: ["왼쪽: 환영 메시지 — '국어농장과 함께 시작해요'","오른쪽: 아이디 입력란","비밀번호 입력란","[로그인] 버튼","비밀번호 찾기 · 회원가입 링크"] },
  "signup":     { title: "회원가입", theme: "light", topBar: [], elements: ["왼쪽: 안내 — '국어농장을 시작할 준비가 되셨나요?'","소속 기관 드롭다운","회원 유형: 학생 / 학부모 / 기관 관리자","아이디 (실시간 중복 확인)","비밀번호 · 이름 · 학년 · 지역","[회원가입] 버튼"] },

  // ── 관리자 기본 ──
  "admin-dashboard":  { title: "운영 대시보드", theme: "dark", topBar: ["사이드바"], elements: ["오늘 가입자: 5 · 활성 사용자: 26 · 전체 사용자: 26 · 활성 기관: 2","오늘 학습 참여: 3 · 승인 대기: 0 · 학부모 연결 대기: 0","빠른 이동: 기관 관리 · 학생 관리 · 콘텐츠 관리","관리 메뉴: 과제/피드백 · 시즌 관리 · 상점 관리"] },
  "admin-approvals":  { title: "가입 승인", theme: "dark", topBar: ["사이드바"], table: { cols: ["이름","아이디","유형","기관","지역","학교","신청일","조치"], rows: [["김민수","student01","학생","국어농장","서울","한빛초","2026-03-28","[승인] [거절]"],["이지은","parent02","학부모","테스트학원","경기","—","2026-03-27","[승인] [거절]"]] } },
  "admin-orgs":       { title: "기관 관리", theme: "dark", topBar: ["사이드바","[신규 기관 등록]"], table: { cols: ["기관명","종류","주소","플랜","좌석","관리자","상태","조치"], rows: [["국어농장","—","—","Pro","50","1","●활성","[수정]"],["테스트학원","학원","서울","Basic","30","1","●활성","[수정]"]] } },
  "admin-classes":    { title: "반 관리", theme: "dark", topBar: ["사이드바","[반 생성]"], elements: ["좌측: 반 리스트 테이블 (반명/설명/기관/학생수/상태/조치)","우측: 학생 현황 패널 — 소속 학생 + 배정 영역"] },
  "admin-students":   { title: "학생 관리", theme: "dark", topBar: ["사이드바","[학생 등록]"], table: { cols: ["학생","레벨","기관","학교","구독","상태","조치"], rows: [["김민수","러셀1","국어농장","한빛중","유료","●","[수정] [인벤토리]"],["이서연","프레게2","테스트학원","테스트초","유료","●","[수정] [인벤토리]"],["박지호","소쉬르1","국어농장","한빛초","무료","●","[수정] [인벤토리]"]] } },
  "admin-parents":    { title: "학부모 연결 관리", theme: "dark", topBar: ["사이드바"], elements: ["연결 생성: 학부모 아이디 + 학생 아이디 → [생성]","상태 필터: [전체 5] [연결됨 3] [승인 대기 2]"], table: { cols: ["학부모","학생","학생 이름","상태","요청 코드","조치"], rows: [["testparent","paidstudent","유료학생","연결됨","482901","[해제]"],["parent02","student01","김민수","승인 대기","—","[승인] [거절]"]] } },
  "admin-content":    { title: "콘텐츠 관리", theme: "dark", topBar: ["사이드바","[표준 양식]","[콘텐츠 업로드]"], table: { cols: ["제목","유형","레벨","농장","상태","관리"], rows: [["소쉬르1 독해 1일차","일일독해","소쉬르1","독해","●","👁 { }"],["러셀1 어휘 기본 1","어휘퀴즈","러셀1","어휘","●","👁 { }"],["프레게2 배경지식 1","배경지식","프레게2","배경지식","●","👁 { }"]] } },
  "admin-assignments":{ title: "과제/피드백", theme: "dark", topBar: ["사이드바","[과제 생성]"], elements: ["탭: [과제] [피드백]","과제 탭: 과제명/유형/마감일/상태 테이블","피드백 탭: 학생명/주제/상태/제출일/[피드백 작성]"] },
  "admin-tests":      { title: "테스트 관리", theme: "dark", topBar: ["사이드바","[시험 추가]"], table: { cols: ["제목","레벨","시행일","문항 수","배점","응시자"], rows: [["러셀1 3장 테스트","러셀1","2026-03-22","30","100","3"],["프레게2 5장 테스트","프레게2","2026-03-20","20","100","5"],["소쉬르1 1장 테스트","소쉬르1","2026-03-18","25","100","2"]] } },
  "admin-study-plans":{ title: "학습 계획표", theme: "dark", topBar: ["사이드바","[새 계획표]"], table: { cols: ["☐","제목","기간","대상","상태","생성일"], rows: [["☐","러셀1 중간고사 대비","3/15~4/15","5명","진행중","2026-03-15"],["☐","프레게2 주간 계획","3/20~3/27","3명","진행중","2026-03-20"]] } },
  "admin-pro":        { title: "프로 모드 관리", theme: "dark", topBar: ["사이드바","레벨: [러셀1 ▼]"], table: { cols: ["#","챕터명","콘텐츠","해설","시험"], rows: [["1","러셀1 1장","4 ✓","✓","v1"],["2","러셀1 2장","4 ✓","✓","v1"],["3","러셀1 3장","3 ⚠","—","미등록"]] } },
  "admin-learning-db":{ title: "학습자료 DB", theme: "dark", topBar: ["사이드바"], elements: ["탭: [교재 원고] [시험지] [해설서] [문제은행]","각 탭별 파일 관리 테이블"] },
  "admin-duel":       { title: "대결 관리", theme: "dark", topBar: ["사이드바"], elements: ["탭: [문제 관리] [시즌]","문제 관리: 대결 문제 등록/수정/삭제","시즌: 시즌 기간, 보상 설정"] },
  "admin-shop":       { title: "상점 관리", theme: "dark", topBar: ["사이드바","[상품 등록]"], elements: ["탭: [상품] [주문]","상품 탭: 상품명/카테고리/가격/재고/상태/조치","주문 탭: 주문번호/고객/금액/상태/조치"] },
  "admin-inquiry":    { title: "문의 관리", theme: "dark", topBar: ["사이드바"], table: { cols: ["번호","제목","작성자 / 연락처","작성일"], rows: [["3","학습 진행이 안 됩니다","김학부모 · 010-1234-5678 [비회원]","2026-03-28"],["2","구독 해지 방법","student01","2026-03-27"],["1","레벨 변경 요청","이서연","2026-03-25"]] } },
  "admin-wisdom":     { title: "지식과 지혜 관리", theme: "dark", topBar: ["사이드바","레벨: [전체 레벨 ▼]"], table: { cols: ["#","레벨","주제","작성자","유형","피드백","상태","작성일"], rows: [["5","러셀1","경제와 시장","김민수","원고지","●완료","게시","3/28"],["4","프레게2","과학 탐구","이서연","업로드","○미완료","게시","3/27"]] } },
  "admin-edit-history":{ title: "수정 이력", theme: "dark", topBar: ["사이드바"], elements: ["탭: [관리자별] [학습별]","관리자별: 관리자/아이디/수정횟수/최근수정/[이력 보기]","학습별: 콘텐츠/유형/수정횟수/최근수정"] },
  "admin-reports":    { title: "보고 관리", theme: "dark", topBar: ["사이드바"], elements: ["보고 관리 대시보드","기간별 학습 통계 리포트"] },

  // ── 관리자 서브 ──
  "admin-student-detail":      { title: "학생 상세 — 김민수", theme: "dark", topBar: ["[← 목록]"], elements: ["탭: [기본 정보] [학습 현황] [테스트 성적] [인벤토리] [대결 전적] [통합 성적표]","이름: 김민수 · 아이디: student01 · 레벨: 러셀1","학교: 한빛중 · 학년: 중1 · 기관: 국어농장","상태: ACTIVE · 구독: 유료 ~2027-12-31"] },
  "admin-student-detail-tests":{ title: "학생 상세 — 테스트 성적 탭", theme: "dark", topBar: ["[← 목록]"], table: { cols: ["시험명","시험일","점수","만점","정답","총문항","정답률","제출일"], rows: [["러셀1 3장 테스트","3/22","85","100","17","20","85%","3/22"],["소쉬르1 1장 테스트","3/18","92","100","23","25","92%","3/18"]] } },
  "admin-content-upload":      { title: "콘텐츠 업로드", theme: "dark", topBar: ["[← 콘텐츠 목록]"], elements: ["모드 토글: [단건 업로드] / [배치 업로드]","모듈 선택 드롭다운 (일일 퀴즈/일일 독해/농장 모드/프로 모드)","[표준 양식 다운로드]","JSON 편집 영역 (16줄 텍스트)","[미리보기] [콘텐츠 등록]"] },
  "admin-content-editor":      { title: "콘텐츠 비주얼 에디터", theme: "dark", topBar: ["[← 콘텐츠 목록]"], elements: ["콘텐츠 제목 · 유형 · 레벨 표시","비주얼 편집 패널 (GUI 기반)","JSON 원본 보기 토글","[저장] [삭제]"] },
  "admin-test-detail":         { title: "시험 상세 — 러셀1 3장 테스트", theme: "dark", topBar: ["[← 시험 목록]"], elements: ["탭: [기본 정보] [시험지 PDF] [문항 관리] [답안 입력] [응시 현황] [서술형 채점]","제목: 러셀1 3장 테스트 · 레벨: 러셀1 · 시행일: 2026-03-22","시리즈: chapter · 총 문항: 30 · 총 배점: 100","[저장] [삭제]"] },
  "admin-test-detail-questions":{ title: "시험 상세 — 문항 관리 탭", theme: "dark", topBar: ["[← 시험 목록]","문항 30개 · 배점 합계 100"], table: { cols: ["번호","유형","영역","세부영역","배점","정답","출제의도"], rows: [["1","객관식","독해","비문학","4","3","지문 내용 파악"],["2","객관식","어휘","기본","3","2","어휘 의미 추론"],["3","서술형","독해","문학","5","—","서술형 답안 작성"]] } },
  "admin-test-detail-omr":     { title: "시험 상세 — 답안 입력 (OMR)", theme: "dark", topBar: ["[← 시험 목록]","학생: [김민수 ▼] [◀] [▶]"], elements: ["OMR 그리드: 5문항씩 한 행","객관식: ① ② ③ ④ ⑤ 버블 버튼","서술형: 텍스트 입력란","[저장] → 점수: 85/100, 정답: 17/20"] },
  "admin-study-plan-detail":   { title: "계획표 상세 — 러셀1 중간고사 대비", theme: "dark", topBar: ["[← 계획표 목록]"], elements: ["좌측: 학생 목록 사이드바 (이름 + 진행률 바)","우측 탭: [매트릭스] [캘린더] [설정]","매트릭스: 범위(행) x 에셋(열) 격자","셀 상태: 완료(초록) / 진행중(주황) / 대기(회색)"] },
  "admin-inquiry-detail":      { title: "문의 상세", theme: "dark", topBar: ["[← 목록으로]"], elements: ["문의 내용 카드: 제목 · 작성자(비회원 뱃지) · 작성일","문의 본문 표시","답변 카드: 기존 답변 목록","답변 입력 영역 + [답변 등록]"] },
  "admin-pro-chapter":         { title: "프로 챕터 상세 — 러셀1 1장", theme: "dark", topBar: ["[← 목록으로]","러셀1"], elements: ["영상 URL 카드: 유튜브 URL 입력 + [저장]","탭: [콘텐츠] [정답과 해설] [테스트 관리]","콘텐츠 탭: 제목/유형(독해·어휘·배경·논리)/최종수정일/액션","정답과 해설: 미리보기 / JSON 편집 / 파일 업로드"] },

  // ── 관리자 모달 ──
  "admin-org-create-modal":       { title: "신규 기관 등록", theme: "modal", fields: ["기관명 (필수)","기관 종류: [선택 안 함 ▼]","플랜: [Basic ▼]","시/도: [선택 안 함 ▼]","좌석 수: 50","상세주소"], buttons: ["[등록]","[취소]"] },
  "admin-org-edit-modal":         { title: "기관 수정", theme: "modal-wide", elements: ["섹션 1 — 기관 정보: 기관명 · 종류 · 플랜 · 시/도 · 좌석 수 · 상세주소","섹션 2 — 기관 관리자: 아이디/이름/연락처/역할/[해제] 테이블","관리자 추가: 아이디 입력 + [관리자 추가]"], buttons: ["[저장]","[비활성화]","[취소]"] },
  "admin-class-create-modal":     { title: "반 생성", theme: "modal", fields: ["기관: [국어농장 ▼]","반 이름 (필수)","설명"], buttons: ["[생성]","[취소]"] },
  "admin-student-edit-modal":     { title: "학생 수정", theme: "modal-wide", elements: ["섹션 1 — 개인정보: 이름 · 학교 · 학년 · 지역 · 연락처","섹션 2 — 소속 정보: 기관 · 레벨 · 수강반(체크박스) · 상태","섹션 3 — 구독 정보: 유형(무료/유료) · 구독 종료일"], buttons: ["[저장]","[비활성화]","[취소]"] },
  "admin-student-inventory-modal":{ title: "인벤토리", theme: "modal-wide", elements: ["보유 현황: 🌾밀 12 · 🍚쌀 8 · 🌽옥수수 5 · 🍇포도 3 · 🍎사과 2","수확물: 🌾밀 2 · 🍚쌀 1 · 비료: 3개 · 시즌 점수: 1,250","지급/차감: 유형[씨앗 ▼] · 아이템[밀 ▼] · 수량 · 사유","경제 내역: 날짜/유형/아이템/변동량/사유 (최근 20건)"], buttons: ["[지급]","[차감]","[닫기]"] },
  "admin-assignment-create-modal":{ title: "과제 생성", theme: "modal-wide", elements: ["과제명 (필수) · 유형: [농장 학습 ▼] · 마감일","콘텐츠 선택: 카테고리 필터 + 체크박스 목록","대상 지정: 기관 → 반 → 학생 (계단식 선택)"], buttons: ["[생성]","[취소]"] },
  "admin-feedback-modal":         { title: "피드백 작성", theme: "modal", elements: ["학생: 김민수 · 주제: 과학 탐구 보고서 · 상태: 대기","평가: 내용 [4점 ▼] · 구성 [3점 ▼] · 표현 [4점 ▼]","코멘트 입력 영역"], buttons: ["[피드백 저장]","[취소]"] },
  "admin-product-create-modal":   { title: "상품 등록", theme: "modal", fields: ["상품명 (필수)","가격","재고"], buttons: ["[등록]","[취소]"] },

  // ── 학생 기본 ──
  "student-start":          { title: "학습 홈", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["인사: '유료학생 농부님, 안녕하세요!'","시즌 점수: 1,250점 · 레벨: 소쉬르1","오늘의 학습: 일일 퀴즈 3/10 · 일일 독해 1일차","학습 메뉴 카드: 농장 모드 · 프로 모드 · 역량 진단 · 테스트 창고","과제 바구니 · 시험 공부 · 씨앗 교환","통계: 순위 · 수확 장부 · 씨앗 원장 · 통합 성적표"] },
  "student-daily-learning": { title: "일일 학습", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["일일 퀴즈 카드: 오늘의 퀴즈 10문제","일일 독해 카드: 오늘의 독해 지문","진행 현황 표시"] },
  "student-daily-quiz":     { title: "일일 퀴즈", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["퀴즈 진행 화면","문제: '다음 중 밑줄 친 단어의 뜻으로 알맞은 것은?'","선택지: ① 낮은 곳 ② 높은 곳 ③ 넓은 곳 ④ 좁은 곳","진행률: 3/10 · 남은 씨앗: 🌾×3","타이머 바"] },
  "student-daily-reading":  { title: "일일 독해", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["정독 단계: 지문 읽기 + 핵심어 체크","복기 단계: 지문 가리고 내용 떠올리기","확인 단계: 이해도 확인 퀴즈 5문제","진행률 바 · 씨앗 보상: 🍚 쌀 씨앗"] },
  "student-duel":           { title: "대결 모드", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["서버 선택 카드 4개:","🌱 소쉬르 (초등 저학년)","🌾 프레게 (초등 고학년)","🌿 러셀 (중학교)","🌳 비트겐슈타인 (고등학교)","내 전적: 5승 / 2패 / 승률 71% / 최고연승 3"] },
  "student-diagnostic":     { title: "역량 진단", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["'온라인 역량 진단' 제목","티어 카드 4개: 소쉬르 · 프레게 · 러셀 · 비트겐슈타인","완료된 티어: TCI 점수 + [결과 보기]","미완료 티어: [진단 시작]"] },
  "student-farm-mode":      { title: "농장 모드", theme: "light", topBar: ["국어농장","학습 홈","서버: [소쉬르 ▼]"], elements: ["히어로: '나의 농장을 선택하세요'","농장 카드 그리드:","🌾 어휘 농장 · 📖 독해 농장 · 🌍 배경지식 농장","📚 이야기 농장 · 📜 고전 농장","각 카드: 농장명 · 설명 · 학습 N개"] },
  "student-pro-mode":       { title: "프로 모드 학습", theme: "light", topBar: ["국어농장","학습 홈"], table: { cols: ["번호","챕터","진행률","상태","영상"], rows: [["1","소쉬르1 1장","▓▓▓░░ 60%","진행중","▶"],["2","소쉬르1 2장","░░░░░ 0%","🔒 잠김","▶"],["3","소쉬르1 3장","░░░░░ 0%","🔒 잠김","▶"]] } },
  "student-tests":          { title: "시험 저장소", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["탭: [시험 목록] [응시 이력]","필터: 출처 [전체 ▼] · 레벨 [전체 과정 ▼]","시험 카드: 제목 · 점수/미응시 · 설명 · 메타정보"] },
  "student-writing":        { title: "지식과 지혜", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["'지식과 지혜' 타이틀","12개 레벨 카드 그리드:","소쉬르 1~3 · 프레게 1~3 · 러셀 1~3 · 비트겐슈타인 1~3","안내: 레벨별 주제에 맞춰 글을 쓰고 첨삭을 받아보세요"] },
  "student-assignments":    { title: "과제 바구니", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["과제 카드 목록:","[농장 학습] 러셀1 어휘 과제 — 마감: 4/5 — 진행중","[글쓰기] 독서 감상문 — 마감: 4/10 — 진행중","[프로 학습] 러셀1 3장 복습 — 완료"] },
  "student-study-plan":     { title: "시험 공부", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["탭: [할일 목록] [캘린더]","매트릭스: 범위(행) x 에셋(열) 격자","셀 상태: 완료(초록) / 진행중(주황) / 대기(회색)","캘린더: 월간 학습 일정 시각화"] },
  "student-harvest-ledger": { title: "수확 장부", theme: "light", topBar: ["국어농장","학습 홈"], table: { cols: ["날짜","학습명","레벨","영역","수행시간","진행률","정답률","획득 씨앗"], rows: [["3/28","러셀1 어휘 1","러셀1","어휘","5:23","100%","85%","🌾×3"],["3/28","일일 퀴즈","소쉬르1","—","3:10","100%","90%","🌾×5"],["3/27","독해 농장 1","소쉬르1","독해","8:45","100%","75%","🍚×3"]] } },
  "student-seed-log":       { title: "씨앗 원장", theme: "light", topBar: ["국어농장","학습 홈"], table: { cols: ["날짜","씨앗 종류","수량","사유"], rows: [["3/28","🌾 밀","+5","일일 퀴즈 보상"],["3/28","🍚 쌀","+3","독해 농장 완료"],["3/27","🌾 밀","-2","대결 패배"],["3/27","🌽 옥수수","+4","배경지식 농장 완료"]] } },
  "student-shop":           { title: "쇼핑몰", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["카테고리: [전체] [교재] [교구]","상품 카드 그리드:","국어농장 러셀1 교재 — 25,000원 — [상세 보기]","국어농장 어휘카드 — 12,000원 — [상세 보기]","사이드바: 배송지 관리"] },
  "student-ranking":        { title: "시즌 랭킹", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["기간: [시즌 랭킹] / [누적 랭킹]","범위: [레벨별] / [레벨 통합]","#1 김민수 · 러셀1 · 2,450점","#2 이서연 · 프레게2 · 1,890점","#3 박지호 · 소쉬르1 · 1,250점 ← (나)"] },
  "student-community":      { title: "커뮤니티", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["게시판 5개 탭:","학습 신청 · 커뮤니티 · 학습 질문 · 학습 자료 · 문의/상담","게시글 테이블: 번호/제목/작성자/작성일","[글쓰기] 버튼"] },
  "student-report":         { title: "통합 성적표", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["기간 설정: 시작일 ~ 종료일 + [조회]","종합 요약 카드","레이더 차트: 영역별 능력치","추이 차트: 시간별 성장","[인쇄] [뒤로]"] },
  "student-subscription":   { title: "구독 관리", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["현재 상태: 구독 중","플랜 카드: 1개월 65,000원 · 3개월 175,500원 (10%↓)","6개월 312,000원 (20%↓) · 12개월 546,000원 (30%↓)","구독 정보: 시작일 ~ 만료일 · 다음 결제일","결제 내역 테이블"] },
  "student-profile":        { title: "내 프로필", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["이름 · 아이디 · 레벨 · 학교 · 학년","지역 · 연락처","비밀번호 변경 · 프로필 수정"] },

  // ── 학생 서브 ──
  "student-duel-lobby":        { title: "대결 로비 — 러셀 서버", theme: "light", topBar: ["국어농장","[← 서버 목록으로]"], elements: ["러셀 서버","[방 만들기] 버튼","방 목록: AI 학생 대결 — 베팅 2씨앗 — 3/4명","방 만들기 팝업: 방 이름 · 베팅 씨앗(1~50) · [만들기]"] },
  "student-farm-list":         { title: "어휘 농장 — 콘텐츠 목록", theme: "light", topBar: ["국어농장","[← 농장 선택]"], table: { cols: ["#","제목","레벨","영역","학습수","완료","상태","영상"], rows: [["1","소쉬르1 어휘 기본 1","소쉬르1","기본","15","8","학습전","▶"],["2","소쉬르1 어휘 사전 1","소쉬르1","사전","12","5","진행중","▶"],["3","프레게1 어휘 기본 1","프레게1","기본","20","10","완료","▶"]] } },
  "student-learning-engine":   { title: "학습 실행", theme: "light", topBar: ["제목: 소쉬르1 어휘 기본 1","유형: 어휘 학습","레벨: 소쉬르1"], elements: ["씨앗: 🌾×3 · 타이머 바","문제: '다음 중 밑줄 친 단어와 바꿔 쓸 수 있는 것은?'","선택지: ① ② ③ ④","하단: [학습 종료] · 진행 3/10"] },
  "student-pro-chapter":       { title: "챕터 학습 — 소쉬르1 1장", theme: "light", topBar: ["국어농장","[← 챕터 목록]"], elements: ["학습 아이템 카드:","✅ 독해 모드 — 완료","✅ 어휘 학습 — 완료","→ 배경지식 — 학습하기","🔒 논리 사고력 — 잠김","🔒 정답해설 — 기본 학습 4개 완료 시 해제","🔒 챕터별 테스트 — 잠김"] },
  "student-pro-test":          { title: "챕터 테스트", theme: "light", topBar: ["국어농장","[← 학습 목록]"], elements: ["챕터 테스트 정보:","제한 시간: 60분 · 통과 기준: 70점 · 남은 버전: 2","[인쇄하기] — PDF 시험지 인쇄 + OMR 입력","[온라인 풀기] — 화면에서 직접 풀이"] },
  "student-pro-answer-key":    { title: "정답해설", theme: "light", topBar: ["국어농장","[← 학습 목록]"], elements: ["챕터 제목","섹션별 정답: 객관식 / OX / 단답형 / 서술형","컴팩트 답안: 1.③ 2.② 3.④ 4.① 5.③","해설: [펼치기/접기] 상세 해설","[인쇄] [학습 목록]"] },
  "student-test-detail":       { title: "시험 응시 — 러셀1 3장 테스트", theme: "light", topBar: ["국어농장","[← 홈으로]"], elements: ["시험 정보: 레벨 러셀1 · 문항 30 · 만점 100 · 제한시간 60분","좌측: PDF 시험지 표시","우측: OMR 답안 입력 패널 (①②③④⑤ 버블)","[제출] 버튼"] },
  "student-test-report":       { title: "성적표 — 러셀1 3장 테스트", theme: "light", topBar: ["국어농장","[← 홈으로]"], elements: ["요약: 총점 85/100 · 정답 17/20 · 정답률 85%","객관식 70/80 · 서술형 15/20","영역별 레이더 차트","시험 점수 추이 차트","[인쇄] [오답 노트] [목록으로]"] },
  "student-test-wrong-note":   { title: "오답노트 — 러셀1 3장 테스트", theme: "light", topBar: ["국어농장","[← 홈으로]"], elements: ["요약: 오답 3문항 · 손실 15점 · 오답 영역 2개 · 최다 오답: 독해","오답 카드 #5: 객관식 · 독해 · 4점 · 내 답 ② / 정답 ④","출제 의도: 지문 내용 정확히 파악","해설: 두 번째 문단에서…","[인쇄] [성적표] [목록으로]"] },
  "student-wisdom-board":      { title: "지혜 게시판 — 러셀1", theme: "light", topBar: ["국어농장","[← 레벨 선택]","주제: [전체 ▼]","[글쓰기]"], table: { cols: ["#","주제","작성자","좋아요","피드백","작성일","삭제"], rows: [["3","경제와 시장","나의 글","♥ 5","완료","3/28","🗑"],["2","고전 철학","익명","♥ 2","대기","3/27","—"],["1","헌법 원리","🔒","♥ 0","대기","3/26","—"]] } },
  "student-wisdom-write":      { title: "글 작성", theme: "light", topBar: ["국어농장","[← 게시판]"], elements: ["주제 선택 드롭다운","작성 탭: [원고지 작성] / [파일 업로드]","원고지: 20열 × 25행 (500자) 디지털 원고지","파일 업로드: 이미지/PDF 파일 선택","[제출하기]"] },
  "student-wisdom-post":       { title: "글 상세", theme: "light", topBar: ["국어농장","[← 게시판]"], elements: ["글 정보: 주제 · 작성자 · 작성일 · 유형(원고지)","본문: 원고지 형태 표시","선생님 피드백: 코멘트 + 첨삭 내용","좋아요 ♥ 5 · 댓글 섹션"] },
  "student-diagnostic-report": { title: "진단 결과 보고서", theme: "light", topBar: ["국어농장","[← 진단 목록]"], elements: ["종합 요약 카드 · TCI 게이지: 72점","전체 응시자 통계: 상위 35%","10대 역량 레이더 차트","역량 상세 분석 (아코디언)","문항 유형별 정답률 · 장르별 비교","추천 학습 방향","[진단 목록] [학습 시작하기]"] },
  "student-community-post":    { title: "커뮤니티 게시글 상세", theme: "light", topBar: ["국어농장","[← 게시판]"], elements: ["제목 · 작성자 · 작성일","게시글 본문","댓글 목록 + 댓글 입력란 + [댓글 등록]"] },

  // ── 학부모 기본 ──
  "parent-start":       { title: "학부모 홈", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["인사: '테스트학부모 학부모님, 안녕하세요!'","자녀 선택 메뉴","학습 메뉴: 테스트 창고 · 수확 장부 · 역량 진단 · 통합 성적표","시즌 랭킹 · 커뮤니티 · 쇼핑몰"] },
  "parent-links":       { title: "자녀 연결", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["연결된 자녀 목록","자녀 연결하기: 학생 이름 + 전화번호로 요청","연결 상태: 연결됨 / 승인 대기"] },
  "parent-ranking":     { title: "시즌 랭킹", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["기간: [시즌 랭킹] / [누적 랭킹]","자녀 하이라이트: 주황색 배경으로 강조","#1 김민수 · 2,450점","#2 이서연 · 1,890점","#3 (자녀) 유료학생 · 1,250점 ← 하이라이트"] },
  "parent-community":   { title: "커뮤니티", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["게시판 탭 5개","학습 이야기와 소식 공유","검색 · 글쓰기 · 게시글 목록"] },
  "parent-shop":        { title: "쇼핑몰", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["교재/교구 상품 카드","배송지 관리 사이드바"] },
  "parent-profile":     { title: "프로필 수정", theme: "light", topBar: ["국어농장","학습 홈"], elements: ["이름 · 아이디 · 연락처","비밀번호 변경"] },

  // ── 학부모 서브 ──
  "parent-tests":             { title: "자녀 시험 — 테스트 창고", theme: "light", topBar: ["국어농장","[← 홈으로]"], elements: ["제목: '[자녀이름]의 시험'","탭: [시험 목록] [응시 이력]","필터: 출처 · 과정(레벨)","시험 카드 목록: 제목 · 점수 · 메타 정보"] },
  "parent-test-report":       { title: "자녀 성적표", theme: "light", topBar: ["국어농장","[← 홈으로]"], elements: ["요약 카드: 총점 85/100 · 정답률 85%","영역별 레이더 차트","점수 추이 차트","영역별 점수 테이블 · 문항별 결과","[인쇄] [오답 노트] [목록으로]"] },
  "parent-harvest-ledger":    { title: "자녀 학습 기록 (수확 장부)", theme: "light", topBar: ["국어농장","[← 홈으로]"], table: { cols: ["날짜","학습명","레벨","영역","수행시간","진행률","정답률","획득 씨앗"], rows: [["3/28","러셀1 어휘 1","러셀1","어휘","5:23","100%","85%","🌾×3"],["3/27","독해 농장 1","소쉬르1","독해","8:45","100%","75%","🍚×3"]] } },
  "parent-diagnostic":        { title: "자녀 역량 진단", theme: "light", topBar: ["국어농장","[← 홈으로]"], elements: ["제목: '자녀 역량 진단 결과'","티어 카드 4개: 소쉬르 · 프레게 · 러셀 · 비트겐슈타인","완료 카드: TCI 점수 + [결과 보기]"] },
  "parent-diagnostic-report": { title: "자녀 진단 리포트", theme: "light", topBar: ["국어농장","[← 진단 목록]"], elements: ["리포트 헤더: 티어 · 모드 · 문항수 · 완료일시","종합 요약 · TCI 게이지 · 전체 응시자 통계","10대 역량 레이더 차트","역량 상세 · 문항 유형별 · 장르별 비교","[진단 목록]"] },
  "parent-report":            { title: "자녀 통합 성적표", theme: "light", topBar: ["국어농장","[← 홈으로]"], elements: ["기간 설정: 시작일 ~ 종료일 + [조회]","종합 요약 카드 · 레이더 차트 · 추이 차트","영역별 상세 분석","[인쇄] [뒤로]"] },
  "parent-study-plan":        { title: "자녀 학습계획표", theme: "light", topBar: ["국어농장","[← 홈으로]"], elements: ["제목: '[자녀이름]의 학습 계획표'","계획 선택 메뉴 (여러 계획 선택 가능)","탭: [학습 현황] [캘린더]","매트릭스: 범위 x 에셋 격자 (조회 전용)","캘린더: 월간 학습 일정"] },
};

/**
 * UI 목업 HTML 생성 — 스크린샷 대신 HTML/CSS로 화면을 렌더링
 */
function buildMockHtml(name, mock) {
  if (!mock) return null;

  const isDark = mock.theme === "dark";
  const isModal = mock.theme === "modal" || mock.theme === "modal-wide";
  const isWide = mock.theme === "modal-wide";
  const bgColor = isDark ? "#1e2228" : isModal ? "#f5f0ea" : "#faf6f0";
  const textColor = isDark ? "#e0ddd8" : "#333";
  const headerBg = isDark ? "#2a2f38" : isModal ? "#fff" : "#fff";
  const borderColor = isDark ? "#3a3f48" : "#e0d8cc";
  const accentColor = "#E8740C";

  let inner = "";

  // 상단바
  if (mock.topBar && mock.topBar.length) {
    const items = mock.topBar.map(t => `<span style="margin-right:12px;font-size:8pt;color:${isDark ? '#aaa' : '#888'}">${t}</span>`).join("");
    inner += `<div style="padding:6px 12px;background:${isDark ? '#22272e' : '#fff8f0'};border-bottom:1px solid ${borderColor};display:flex;align-items:center;flex-wrap:wrap;">${items}</div>`;
  }

  // 제목
  inner += `<div style="padding:10px 14px 6px;font-size:12pt;font-weight:700;color:${isDark ? '#fff' : '#1a1a1a'}">${mock.title}</div>`;

  // 모달: 필드
  if (mock.fields) {
    let fieldsHtml = mock.fields.map(f => {
      const isDropdown = f.includes("▼");
      return `<div style="margin:4px 0;padding:5px 10px;background:${isDark ? '#2a2f38' : '#fff'};border:1px solid ${borderColor};border-radius:4px;font-size:8.5pt;color:${textColor}">${f}</div>`;
    }).join("");
    inner += `<div style="padding:6px 14px;">${fieldsHtml}</div>`;
  }

  // 테이블
  if (mock.table) {
    const thBg = isDark ? "#2a2f38" : "#f7f0e8";
    const thColor = isDark ? "#ddd" : "#333";
    let ths = mock.table.cols.map(c => `<th style="background:${thBg};color:${thColor};padding:4px 6px;border:1px solid ${borderColor};font-size:7.5pt;white-space:nowrap">${c}</th>`).join("");
    let rows = mock.table.rows.map((row, ri) => {
      const rowBg = ri % 2 === 0 ? (isDark ? "#1e2228" : "#fff") : (isDark ? "#22272e" : "#faf8f5");
      let tds = row.map(c => `<td style="padding:4px 6px;border:1px solid ${borderColor};font-size:7.5pt;color:${textColor};background:${rowBg}">${c}</td>`).join("");
      return `<tr>${tds}</tr>`;
    }).join("");
    inner += `<div style="padding:4px 14px 8px;overflow:hidden;"><table style="width:100%;border-collapse:collapse;"><tr>${ths}</tr>${rows}</table></div>`;
  }

  // 요소 목록
  if (mock.elements) {
    let items = mock.elements.map(e => `<div style="padding:3px 0;font-size:8pt;color:${isDark ? '#bbb' : '#555'};line-height:1.4;">${e}</div>`).join("");
    inner += `<div style="padding:4px 14px 8px;">${items}</div>`;
  }

  // 모달: 버튼
  if (mock.buttons) {
    let btns = mock.buttons.map(b => {
      const isPrimary = b.includes("등록") || b.includes("생성") || b.includes("저장") || b.includes("지급");
      return `<span style="display:inline-block;padding:4px 14px;margin-right:6px;border-radius:4px;font-size:8pt;font-weight:600;color:#fff;background:${isPrimary ? accentColor : '#666'}">${b}</span>`;
    }).join("");
    inner += `<div style="padding:6px 14px 10px;">${btns}</div>`;
  }

  // 모달 프레임
  if (isModal) {
    const width = isWide ? "92%" : "70%";
    return `<div class="mock-frame" style="background:rgba(0,0,0,0.15);padding:16px;border-radius:8px;text-align:center;">
      <div style="display:inline-block;width:${width};background:#fff;border-radius:8px;text-align:left;overflow:hidden;border:1px solid #ddd;box-shadow:0 4px 20px rgba(0,0,0,0.15);">${inner}</div>
    </div>`;
  }

  return `<div class="mock-frame" style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;overflow:hidden;">${inner}</div>`;
}

/**
 * 마크다운을 줄 단위로 처리하면서 <!-- IMG: name --> 마커에 HTML 목업 UI 삽입
 */
function mdToHtmlWithScreenshots(mdContent) {
  const lines = mdContent.split("\n");
  const processedLines = [];
  let figureCount = 0;
  let lastHeading = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const hMatch = line.match(/^#{1,4}\s+(.+)/);
    if (hMatch) {
      lastHeading = hMatch[1].replace(/[*_`]/g, "").trim();
    }

    const imgMatch = line.match(/<!--\s*IMG:\s*(.+?)\s*-->/);
    if (imgMatch) {
      const name = imgMatch[1];
      const mock = UI_MOCKS[name];
      if (mock) {
        figureCount++;
        const captionText = lastHeading ? `${lastHeading} 화면` : "화면";
        const mockHtml = buildMockHtml(name, mock);
        processedLines.push("");
        processedLines.push(`<figure class="img-block">`);
        processedLines.push(mockHtml);
        processedLines.push(`<figcaption>그림 ${figureCount}. ${captionText}</figcaption>`);
        processedLines.push(`</figure>`);
        processedLines.push("");
      } else {
        // 목업 정의 없음 → 스킵 (주석 유지)
        processedLines.push(line);
      }
    } else {
      processedLines.push(line);
    }
  }

  const finalMd = processedLines.join("\n");
  marked.setOptions({ breaks: true, gfm: true });
  return marked.parse(finalMd);
}

/**
 * 목차 영역에 .toc 클래스 적용 (HTML 후처리)
 *
 * "## 목차" 뒤에 나오는 <ul>/<ol> 리스트를 <div class="toc">로 감싼다.
 */
function wrapTocSection(html) {
  // <h2>목차</h2> 패턴 찾기
  const tocHeadingRe = /<h2[^>]*>목차<\/h2>/i;
  const match = html.match(tocHeadingRe);
  if (!match) return html;

  const tocStart = match.index;
  const afterHeading = tocStart + match[0].length;

  // 목차 헤딩 다음에 오는 연속된 <ul>...</ul> 또는 <ol>...</ol> 블록을 찾기
  const rest = html.slice(afterHeading);
  // 목차 리스트: <ul>로 시작해서 다음 <h 태그 전까지
  const nextHeadingIdx = rest.search(/<h[1-6][^>]*>/);
  const tocContent = nextHeadingIdx >= 0 ? rest.slice(0, nextHeadingIdx) : rest;

  // 목차 헤딩 + 내용을 .toc div로 감싸기
  const wrappedToc = `<div class="toc">${match[0]}${tocContent}</div>`;
  const before = html.slice(0, tocStart);
  const after = nextHeadingIdx >= 0 ? rest.slice(nextHeadingIdx) : "";

  return before + wrappedToc + after;
}

function buildFullHtml(coverHtml, bodyHtml, title) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: A4;
    margin: 20mm 18mm 25mm 18mm;
  }

  body {
    font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
    font-size: 10.5pt;
    line-height: 1.7;
    color: #222;
    background: #fff;
    word-break: keep-all;
    overflow-wrap: break-word;
  }

  /* ───── 표지 페이지 ───── */
  .cover-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    page-break-after: always;
  }
  .cover-page .brand-line {
    width: 80%;
    height: 4px;
    background: #E8740C;
    margin-bottom: 60px;
  }
  .cover-page .logo {
    max-height: 120px;
    margin-bottom: 40px;
    border: none;
    box-shadow: none;
    border-radius: 0;
  }
  .cover-page .title {
    font-size: 28pt;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 16px;
  }
  .cover-page .subtitle {
    font-size: 14pt;
    color: #666;
    margin-bottom: 60px;
  }
  .cover-page .date {
    font-size: 11pt;
    color: #999;
    margin-bottom: 12px;
  }
  .cover-page .publisher {
    font-size: 12pt;
    color: #E8740C;
    font-weight: 600;
  }

  /* ───── 목차 ───── */
  .toc {
    page-break-after: always;
  }
  .toc h2 {
    break-before: auto;
    page-break-before: auto;
  }
  .toc ul, .toc ol {
    font-size: 9pt;
    line-height: 1.4;
    list-style: none;
    margin-left: 0;
    padding-left: 0;
  }
  .toc li {
    margin-bottom: 3pt;
    padding-left: 12pt;
  }
  .toc a {
    color: #333;
    text-decoration: none;
  }
  .toc a:hover {
    color: #E8740C;
  }

  /* ───── 페이지 바꿈 제어 ───── */
  h1, h2, h3, h4 {
    break-after: avoid;
    page-break-after: avoid;
  }

  body {
    orphans: 3;
    widows: 3;
  }

  h1 {
    font-size: 22pt;
    font-weight: 700;
    color: #1a1a1a;
    margin-top: 40pt;
    margin-bottom: 12pt;
    padding-bottom: 8pt;
    border-bottom: 3px solid #E8740C;
    break-before: page;
    page-break-before: always;
  }

  /* 첫 번째 h1 — 표지 뒤 본문 시작이므로 페이지 바꿈 불필요 */
  h1:first-of-type {
    break-before: auto;
    page-break-before: auto;
    margin-top: 0;
    font-size: 28pt;
    text-align: center;
    border-bottom: 4px solid #E8740C;
    padding-bottom: 16pt;
    margin-bottom: 24pt;
  }

  h2 {
    font-size: 16pt;
    font-weight: 700;
    color: #333;
    margin-top: 28pt;
    margin-bottom: 10pt;
    padding-bottom: 4pt;
    border-bottom: 1.5px solid #ddd;
    break-before: page;
    page-break-before: always;
  }

  h3 {
    font-size: 13pt;
    font-weight: 600;
    color: #444;
    margin-top: 20pt;
    margin-bottom: 8pt;
  }

  h4 {
    font-size: 11pt;
    font-weight: 600;
    color: #555;
    margin-top: 14pt;
    margin-bottom: 6pt;
  }

  p {
    margin-bottom: 8pt;
  }

  /* ───── 헤딩 + 뒤따르는 모든 콘텐츠 묶음 ───── */
  h1 + *, h2 + *, h3 + *, h4 + *,
  h1 + * + *, h2 + * + *, h3 + * + * {
    break-before: avoid;
    page-break-before: avoid;
  }

  /* ───── 테이블 ───── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0 16pt 0;
    font-size: 9.5pt;
    break-inside: auto;
    page-break-inside: auto;
  }

  /* 테이블 행은 분리 방지 */
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* 헤더 행은 다음 행과 함께 */
  thead {
    display: table-header-group;
  }
  thead tr {
    break-after: avoid;
    page-break-after: avoid;
  }

  th, td {
    border: 1px solid #ccc;
    padding: 6pt 8pt;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #f7f0e8;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
  }

  tr:nth-child(even) td {
    background: #faf8f5;
  }

  /* ───── 목록 ───── */
  ul, ol {
    margin: 6pt 0 12pt 20pt;
  }

  /* 핵심: 리스트 항목 내부에서 번호와 내용이 분리되지 않도록 */
  li {
    margin-bottom: 4pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  li > ul, li > ol {
    margin-top: 4pt;
    margin-bottom: 4pt;
  }

  /* ───── 코드 ───── */
  code {
    font-family: 'Consolas', 'D2Coding', monospace;
    background: #f5f1ec;
    padding: 1pt 4pt;
    border-radius: 3pt;
    font-size: 9pt;
    color: #c7254e;
  }

  pre {
    background: #2d2d2d;
    color: #e0e0e0;
    padding: 10pt 14pt;
    border-radius: 6pt;
    overflow-x: auto;
    font-size: 8.5pt;
    line-height: 1.5;
    margin: 8pt 0 14pt 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  pre code {
    background: none;
    color: inherit;
    padding: 0;
  }

  /* ───── 인용구 ───── */
  blockquote {
    border-left: 4pt solid #E8740C;
    background: #fef8f0;
    padding: 10pt 14pt;
    margin: 10pt 0 14pt 0;
    color: #555;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  blockquote p {
    margin-bottom: 4pt;
  }

  /* ───── 수평선 ───── */
  hr {
    border: none;
    border-top: 1px solid #ddd;
    margin: 16pt 0;
  }

  /* ───── 강조 ───── */
  strong {
    font-weight: 600;
    color: #1a1a1a;
  }

  em {
    font-style: italic;
    color: #555;
  }

  /* ───── 이미지 / 목업 프레임 ───── */
  figure.img-block {
    margin: 10pt 0 16pt 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  figure.img-block .mock-frame {
    font-family: 'Noto Sans KR', sans-serif;
  }

  figure.img-block .mock-frame table {
    margin: 0;
    break-inside: auto;
    page-break-inside: auto;
  }

  figcaption {
    font-size: 8.5pt;
    color: #888;
    margin-top: 4pt;
    text-align: center;
    font-style: italic;
  }

  /* 일반 img (figure 밖) — 폴백 */
  img:not(.logo) {
    max-width: 100%;
    height: auto;
    border: 1px solid #ddd;
    border-radius: 6pt;
    margin: 8pt 0 14pt 0;
    box-shadow: 0 2pt 8pt rgba(0,0,0,0.08);
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* ───── 링크 ───── */
  a {
    color: #E8740C;
    text-decoration: none;
  }

  /* blockquote 내부 분리 방지 */
  blockquote {
    break-inside: avoid;
    page-break-inside: avoid;
  }
</style>
</head>
<body>
${coverHtml}
${bodyHtml}
</body>
</html>`;
}

async function generatePdf(htmlPath, pdfPath) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  // 이미지 로드 대기
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.onload = img.onerror = resolve;
            })
        )
    );
  });

  await new Promise((r) => setTimeout(r, 2000));

  await page.pdf({
    path: pdfPath,
    format: "A4",
    margin: { top: "20mm", bottom: "25mm", left: "18mm", right: "18mm" },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8pt;color:#aaa;width:100%;text-align:center;margin-top:6mm;"></div>`,
    footerTemplate: `<div style="font-size:9pt;color:#888;width:100%;text-align:center;margin-bottom:2mm;">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>`,
    preferCSSPageSize: false,
  });

  await browser.close();
  return pdfPath;
}

async function processManual(mdFile, manualKey, title) {
  console.log(`\n[${title}]`);

  const mdPath = path.join(DOCS_DIR, mdFile);
  const mdContent = fs.readFileSync(mdPath, "utf-8");
  console.log(`  MD 읽기 완료: ${mdContent.length}자`);

  // 로고 로드
  const logoBase64 = loadLogoBase64();

  // 표지 HTML 생성
  const subtitle = MANUAL_SUBTITLES[manualKey] || "";
  const coverHtml = buildCoverHtml(logoBase64, title, subtitle);

  // MD → HTML (<!-- IMG: ... --> 마커 기반 스크린샷 삽입)
  let bodyHtml = mdToHtmlWithScreenshots(mdContent);

  // 목차 영역 후처리 (.toc 클래스 적용)
  bodyHtml = wrapTocSection(bodyHtml);

  const fullHtml = buildFullHtml(coverHtml, bodyHtml, title);

  // HTML 임시 저장
  const htmlPath = path.join(DOCS_DIR, `${manualKey}.html`);
  fs.writeFileSync(htmlPath, fullHtml, "utf-8");
  console.log(`  HTML 생성: ${htmlPath}`);

  // HTML → PDF
  const pdfPath = path.join(DOCS_DIR, `${manualKey}.pdf`);
  await generatePdf(htmlPath, pdfPath);

  const stat = fs.statSync(pdfPath);
  console.log(`  PDF 생성 완료: ${pdfPath} (${(stat.size / 1024 / 1024).toFixed(1)}MB)`);

  // HTML 임시 파일 삭제
  fs.unlinkSync(htmlPath);

  return pdfPath;
}

async function main() {
  console.log("매뉴얼 PDF 생성 시작...");

  await processManual("manual-admin.md", "manual-admin", "국어농장 관리자 매뉴얼");
  await processManual("manual-student.md", "manual-student", "국어농장 학생 매뉴얼");
  await processManual("manual-parent.md", "manual-parent", "국어농장 학부모 매뉴얼");

  console.log("\n모든 PDF 생성 완료!");
}

main().catch(console.error);
