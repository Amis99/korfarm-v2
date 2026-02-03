import { useEffect, useMemo, useRef, useState } from "react";
import "../App.css";

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const TOKEN_KEY = "korfarm_token";

const SAMPLE_SUBMIT = {
  answers: [{ questionId: "q_001", answer: "A" }],
};

const SAMPLE_HARVEST = {
  seedType: "seed_wheat",
  useFertilizer: false,
};

const SAMPLE_WRITING = {
  content: "Write three sentences about today's reading.",
  attachmentIds: [],
};

const SAMPLE_ASSIGNMENT_SUBMIT = {
  content: {
    answer: "Assignment response goes here.",
    notes: "Draft submission.",
  },
};

const SAMPLE_POST_CREATE = {
  title: "첫 번째 게시글",
  content: "학습 내용을 공유합니다.",
  attachmentIds: [],
};

const SAMPLE_POST_UPDATE = {
  title: "수정된 게시글",
  content: "내용을 업데이트했습니다.",
  attachmentIds: [],
};

const SAMPLE_COMMENT = {
  content: "좋은 자료 감사합니다!",
};

const SAMPLE_REPORT = {
  targetType: "post",
  targetId: "post_001",
  reason: "spam",
};

const SAMPLE_PRESIGN = {
  purpose: "board_attachment",
  filename: "sample.pdf",
  mime: "application/pdf",
  size: 1048576,
};

const SAMPLE_ADDRESS = {
  recipient: "Sample User",
  phone: "010-0000-0000",
  address1: "Seoul City",
  address2: "Apt 101",
  postalCode: "06000",
};

const SAMPLE_ORDER = {
  items: [{ productId: "prod_001", quantity: 1 }],
  address: SAMPLE_ADDRESS,
};
const SAMPLE_PAYMENT_SUBSCRIPTION = {
  amount: 9900,
  subscription: true,
  method: "card",
};

const SAMPLE_PAYMENT_SHOP = {
  orderId: "order_001",
  amount: 19000,
  method: "card",
};

const SAMPLE_ORG_CREATE = {
  name: "Korfarm Academy",
  plan: "standard",
  seatLimit: 30,
  status: "active",
};

const SAMPLE_ORG_UPDATE = {
  name: "Korfarm Academy",
  plan: "premium",
  seatLimit: 50,
  status: "active",
};

const SAMPLE_ORG_ADMIN = {
  email: "admin@korfarm.local",
  name: "Org Admin",
};

const SAMPLE_STUDENT_CREATE = {
  email: "student@korfarm.local",
  name: "Student One",
  orgId: "org_001",
  classIds: ["class_001"],
};

const SAMPLE_STUDENT_UPDATE = {
  name: "Student Updated",
  status: "active",
  orgId: "org_001",
  classIds: ["class_001"],
};

const SAMPLE_CLASS_CREATE = {
  orgId: "org_001",
  name: "Class A",
  levelId: "frege1",
  grade: "G4",
  status: "active",
  startAt: "2026-03-01T09:00:00+09:00",
};

const SAMPLE_CLASS_UPDATE = {
  name: "Class A - Updated",
  levelId: "frege1",
  grade: "G4",
  status: "active",
  startAt: "2026-03-01T09:00:00+09:00",
};

const SAMPLE_CLASS_ADD = {
  userIds: ["user_001", "user_002"],
};

const SAMPLE_CONTENT_IMPORT = {
  contentType: "pro_mode",
  levelId: "frege1",
  chapterId: "chapter_001",
  schemaVersion: "1.4.0",
  content: {
    title: "Sample content",
    questions: [],
  },
};

const SAMPLE_ASSIGNMENT_CREATE = {
  assignmentType: "writing",
  title: "Weekly Writing",
  payload: {
    prompt: "Write five lines about your week.",
  },
  dueAt: "2026-03-10T23:59:00+09:00",
  targets: [{ targetType: "class", targetId: "class_001" }],
};

const SAMPLE_ASSIGNMENT_UPDATE = {
  title: "Weekly Writing v2",
  payload: {
    prompt: "Update the prompt with new guidance.",
  },
  status: "active",
};

const SAMPLE_WRITING_FEEDBACK = {
  rubric: {
    structure: 4,
    logic: 5,
    expression: 4,
  },
  comment: "Good effort. Add more evidence in paragraph 2.",
};

const SAMPLE_TEST_CREATE = {
  orgId: "org_001",
  title: "Midterm Test",
  pdfFileId: "file_001",
};

const SAMPLE_TEST_ANSWERS = {
  answers: {
    q1: "A",
    q2: "B",
  },
};

const SAMPLE_TEST_GRADE = {
  userId: "user_001",
  answers: {
    q1: "A",
    q2: "B",
  },
};

const SAMPLE_DUEL_CREATE = {
  levelId: "frege1",
  roomSize: 2,
  stakeAmount: 1,
  stakeCropType: "seed_wheat",
};

const SAMPLE_DUEL_SEASON = {
  levelId: "frege1",
  name: "Spring 2026",
  startAt: "2026-03-01T00:00:00+09:00",
  endAt: "2026-05-31T23:59:59+09:00",
};

const SAMPLE_DUEL_SNAPSHOT = {
  seasonId: "season_2026_spring_01",
  levelId: "frege1",
};

const SAMPLE_FLAG_UPDATE = {
  enabled: true,
  rolloutPercent: 100,
  description: "Enable for all users.",
};

const SAMPLE_PRODUCT = {
  name: "Workbook Set",
  price: 19000,
  stock: 20,
  status: "active",
};

const GRADE_LEVELS = [
  { label: "초1", levelId: "saussure1", levelName: "소쉬르1" },
  { label: "초2", levelId: "saussure2", levelName: "소쉬르2" },
  { label: "초3", levelId: "saussure3", levelName: "소쉬르3" },
  { label: "초4", levelId: "frege1", levelName: "프레게1" },
  { label: "초5", levelId: "frege2", levelName: "프레게2" },
  { label: "초6", levelId: "frege3", levelName: "프레게3" },
  { label: "중1", levelId: "russell1", levelName: "러셀1" },
  { label: "중2", levelId: "russell2", levelName: "러셀2" },
  { label: "중3", levelId: "russell3", levelName: "러셀3" },
  { label: "고1", levelId: "wittgenstein1", levelName: "비트겐슈타인1" },
  { label: "고2", levelId: "wittgenstein2", levelName: "비트겐슈타인2" },
  { label: "고3", levelId: "wittgenstein3", levelName: "비트겐슈타인3" },
];
const REGIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전라북도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const getPhoneDigits = (value) => value.replace(/\D/g, "");
const ACTION_GROUPS = [
  {
    id: "core",
    title: "Core & Session",
    description: "서비스 상태와 로그인 세션을 확인합니다.",
    actions: [
      {
        id: "health",
        title: "Health check",
        description: "서버 상태 확인",
        method: "GET",
        path: "/v1/health",
        scope: "public",
      },
      {
        id: "me",
        title: "내 프로필",
        description: "로그인 사용자 정보",
        method: "GET",
        path: "/v1/auth/me",
        scope: "user",
        auth: true,
      },
      {
        id: "logout",
        title: "로그아웃",
        description: "현재 토큰 로그아웃",
        method: "POST",
        path: "/v1/auth/logout",
        scope: "user",
        auth: true,
      },
    ],
  },
  {
    id: "learning",
    title: "무료 학습",
    description: "일일 퀴즈와 독해를 제공합니다.",
    actions: [
      {
        id: "dailyQuiz",
        title: "일일 퀴즈 조회",
        description: "오늘의 퀴즈 콘텐츠",
        method: "GET",
        path: "/v1/learning/daily-quiz",
        scope: "user",
        auth: true,
      },
      {
        id: "dailyQuizSubmit",
        title: "일일 퀴즈 제출",
        description: "정답 제출 후 씨앗 보상",
        method: "POST",
        path: "/v1/learning/daily-quiz/submit",
        scope: "user",
        auth: true,
        body: SAMPLE_SUBMIT,
        note: "daily-quiz 응답의 questionId를 사용하세요.",
      },
      {
        id: "dailyReading",
        title: "일일 독해 조회",
        description: "오늘의 독해 지문",
        method: "GET",
        path: "/v1/learning/daily-reading",
        scope: "user",
        auth: true,
      },
      {
        id: "dailyReadingSubmit",
        title: "일일 독해 제출",
        description: "독해 문제 제출",
        method: "POST",
        path: "/v1/learning/daily-reading/submit",
        scope: "user",
        auth: true,
        body: SAMPLE_SUBMIT,
      },
    ],
  },
  {
    id: "economy",
    title: "경제/수확",
    description: "씨앗, 수확, 장부 흐름을 확인합니다.",
    actions: [
      {
        id: "inventory",
        title: "인벤토리",
        description: "보유 씨앗/수확물 조회",
        method: "GET",
        path: "/v1/inventory",
        scope: "user",
        auth: true,
      },
      {
        id: "harvestCraft",
        title: "수확 제작",
        description: "씨앗을 수확물로 제작",
        method: "POST",
        path: "/v1/harvest/craft",
        scope: "user",
        auth: true,
        body: SAMPLE_HARVEST,
      },
      {
        id: "ledger",
        title: "장부 조회",
        description: "씨앗/수확물 거래 기록",
        method: "GET",
        path: "/v1/ledger",
        scope: "user",
        auth: true,
      },
    ],
  },
  {
    id: "season",
    title: "시즌/랭킹",
    description: "시즌 랭킹과 수상 정보",
    actions: [
      {
        id: "seasonCurrent",
        title: "현재 시즌",
        description: "진행 중인 시즌 정보",
        method: "GET",
        path: "/v1/seasons/current",
        scope: "user",
        auth: true,
      },
      {
        id: "seasonHarvestRankings",
        title: "수확 랭킹",
        description: "시즌 수확 랭킹",
        method: "GET",
        path: "/v1/seasons/:seasonId/harvest-rankings",
        scope: "user",
        auth: true,
        params: { seasonId: "season_2026_spring_01" },
        note: "feature.season.ranking 활성 필요",
      },
      {
        id: "seasonDuelRankings",
        title: "대결 랭킹",
        description: "시즌 대결 랭킹",
        method: "GET",
        path: "/v1/seasons/:seasonId/duel-rankings",
        scope: "user",
        auth: true,
        params: { seasonId: "season_2026_spring_01" },
        note: "feature.season.ranking 활성 필요",
      },
      {
        id: "seasonAwards",
        title: "시즌 수상",
        description: "시즌 수상 결과",
        method: "GET",
        path: "/v1/seasons/:seasonId/awards",
        scope: "user",
        auth: true,
        params: { seasonId: "season_2026_spring_01" },
        note: "feature.season.awards 활성 필요",
      },
    ],
  },
  {
    id: "duel",
    title: "대결 모드",
    description: "대결 방, 매칭, 랭킹을 다룹니다.",
    actions: [
      {
        id: "duelCreateRoom",
        title: "대결 방 생성",
        description: "방을 만들고 스테이크를 설정",
        method: "POST",
        path: "/v1/duel/rooms",
        scope: "user",
        auth: true,
        body: SAMPLE_DUEL_CREATE,
        note: "feature.duel.mode 활성 필요",
      },
      {
        id: "duelRooms",
        title: "대결 방 목록",
        description: "현재 열려 있는 방",
        method: "GET",
        path: "/v1/duel/rooms",
        scope: "user",
        auth: true,
      },
      {
        id: "duelJoinRoom",
        title: "대결 방 입장",
        description: "방 참여",
        method: "POST",
        path: "/v1/duel/rooms/:roomId/join",
        scope: "user",
        auth: true,
        params: { roomId: "room_001" },
      },
      {
        id: "duelLeaveRoom",
        title: "대결 방 나가기",
        description: "방 퇴장",
        method: "POST",
        path: "/v1/duel/rooms/:roomId/leave",
        scope: "user",
        auth: true,
        params: { roomId: "room_001" },
      },
      {
        id: "duelQueueJoin",
        title: "빠른 대결 입장",
        description: "매칭 큐에 참여",
        method: "POST",
        path: "/v1/duel/queue/join",
        scope: "user",
        auth: true,
        query: [
          { key: "levelId", label: "레벨", value: "frege1" },
          { key: "stakeAmount", label: "스테이크", value: "1" },
          { key: "stakeCropType", label: "씨앗", value: "seed_wheat" },
          { key: "roomSize", label: "인원", value: "2" },
        ],
      },
      {
        id: "duelQueueLeave",
        title: "빠른 대결 나가기",
        description: "매칭 큐 이탈",
        method: "POST",
        path: "/v1/duel/queue/leave",
        scope: "user",
        auth: true,
      },
      {
        id: "duelStats",
        title: "대결 통계",
        description: "개인 전적",
        method: "GET",
        path: "/v1/duel/stats",
        scope: "user",
        auth: true,
        query: [{ key: "levelId", label: "레벨", value: "frege1" }],
      },
      {
        id: "duelLeaderboards",
        title: "대결 리더보드",
        description: "승리/승률/연승 순위",
        method: "GET",
        path: "/v1/duel/leaderboards",
        scope: "user",
        auth: true,
        query: [{ key: "levelId", label: "레벨", value: "frege1" }],
      },
    ],
  },
  {
    id: "paid",
    title: "유료 학습",
    description: "구독 사용자 전용 콘텐츠",
    actions: [
      {
        id: "proLevels",
        title: "프로 모드 레벨",
        description: "유료 레벨 리스트",
        method: "GET",
        path: "/v1/pro-mode/levels",
        scope: "paid",
        auth: true,
        note: "feature.paid.pro_mode + 구독 필요",
      },
      {
        id: "proChapter",
        title: "프로 모드 챕터",
        description: "챕터 상세",
        method: "GET",
        path: "/v1/pro-mode/chapters/:chapterId",
        scope: "paid",
        auth: true,
        params: { chapterId: "chapter_001" },
      },
      {
        id: "proSubmit",
        title: "프로 모드 제출",
        description: "챕터 제출",
        method: "POST",
        path: "/v1/pro-mode/chapters/:chapterId/submit",
        scope: "paid",
        auth: true,
        params: { chapterId: "chapter_001" },
        body: SAMPLE_SUBMIT,
      },
      {
        id: "farmModes",
        title: "농장별 모드",
        description: "농장별 학습 모드",
        method: "GET",
        path: "/v1/farm-modes",
        scope: "paid",
        auth: true,
        note: "feature.paid.farm_mode + 구독 필요",
      },
      {
        id: "farmModeSubmit",
        title: "농장별 모드 제출",
        description: "농장별 모드 제출",
        method: "POST",
        path: "/v1/farm-modes/:modeId/submit",
        scope: "paid",
        auth: true,
        params: { modeId: "farm_001" },
        body: SAMPLE_SUBMIT,
      },
      {
        id: "writingPrompts",
        title: "글쓰기 과제",
        description: "글쓰기 프롬프트",
        method: "GET",
        path: "/v1/writing/prompts",
        scope: "paid",
        auth: true,
        note: "feature.paid.writing + 구독 필요",
      },
      {
        id: "writingSubmit",
        title: "글쓰기 제출",
        description: "글쓰기 과제 제출",
        method: "POST",
        path: "/v1/writing/submit",
        scope: "paid",
        auth: true,
        body: SAMPLE_WRITING,
      },
      {
        id: "testsList",
        title: "테스트 목록",
        description: "테스트 창고",
        method: "GET",
        path: "/v1/tests",
        scope: "paid",
        auth: true,
        note: "feature.paid.test_bank + 구독 필요",
      },
      {
        id: "testsSubmit",
        title: "테스트 제출",
        description: "테스트 답안 제출",
        method: "POST",
        path: "/v1/tests/:testId/submit",
        scope: "paid",
        auth: true,
        params: { testId: "test_001" },
        body: SAMPLE_SUBMIT,
      },
      {
        id: "harvestLedger",
        title: "?? ??",
        description: "?? ?? ??",
        method: "GET",
        path: "/v1/harvest-ledger",
        scope: "user",
        auth: true,
      },
    ],
  },
  {
    id: "assignments",
    title: "과제",
    description: "과제 리스트와 제출",
    actions: [
      {
        id: "assignmentsList",
        title: "과제 목록",
        description: "내 과제 리스트",
        method: "GET",
        path: "/v1/assignments",
        scope: "user",
        auth: true,
      },
      {
        id: "assignmentsDetail",
        title: "과제 상세",
        description: "과제 상세 조회",
        method: "GET",
        path: "/v1/assignments/:assignmentId",
        scope: "user",
        auth: true,
        params: { assignmentId: "assignment_001" },
      },
      {
        id: "assignmentsSubmit",
        title: "과제 제출",
        description: "과제 응답 제출",
        method: "POST",
        path: "/v1/assignments/:assignmentId/submit",
        scope: "user",
        auth: true,
        params: { assignmentId: "assignment_001" },
        body: SAMPLE_ASSIGNMENT_SUBMIT,
      },
      {
        id: "assignmentsProgress",
        title: "과제 진행률",
        description: "제출 진행 상황",
        method: "GET",
        path: "/v1/assignments/:assignmentId/progress",
        scope: "user",
        auth: true,
        params: { assignmentId: "assignment_001" },
      },
    ],
  },
  {
    id: "boards",
    title: "게시판",
    description: "커뮤니티, 질문, 자료 공유",
    actions: [
      {
        id: "boardsList",
        title: "게시판 목록",
        description: "게시판 종류",
        method: "GET",
        path: "/v1/boards",
        scope: "user",
        auth: true,
      },
      {
        id: "boardsPosts",
        title: "게시글 목록",
        description: "게시판 글 목록",
        method: "GET",
        path: "/v1/boards/:boardId/posts",
        scope: "user",
        auth: true,
        params: { boardId: "community" },
      },
      {
        id: "boardPostCreate",
        title: "게시글 작성",
        description: "게시글 생성",
        method: "POST",
        path: "/v1/boards/:boardId/posts",
        scope: "user",
        auth: true,
        params: { boardId: "community" },
        body: SAMPLE_POST_CREATE,
      },
      {
        id: "postDetail",
        title: "게시글 상세",
        description: "게시글 상세 조회",
        method: "GET",
        path: "/v1/posts/:postId",
        scope: "user",
        auth: true,
        params: { postId: "post_001" },
      },
      {
        id: "postUpdate",
        title: "게시글 수정",
        description: "게시글 수정",
        method: "PATCH",
        path: "/v1/posts/:postId",
        scope: "user",
        auth: true,
        params: { postId: "post_001" },
        body: SAMPLE_POST_UPDATE,
      },
      {
        id: "postDelete",
        title: "게시글 삭제",
        description: "게시글 삭제",
        method: "DELETE",
        path: "/v1/posts/:postId",
        scope: "user",
        auth: true,
        params: { postId: "post_001" },
      },
      {
        id: "commentCreate",
        title: "댓글 작성",
        description: "게시글 댓글",
        method: "POST",
        path: "/v1/posts/:postId/comments",
        scope: "user",
        auth: true,
        params: { postId: "post_001" },
        body: SAMPLE_COMMENT,
      },
      {
        id: "commentDelete",
        title: "댓글 삭제",
        description: "댓글 삭제",
        method: "DELETE",
        path: "/v1/comments/:commentId",
        scope: "user",
        auth: true,
        params: { commentId: "comment_001" },
      },
      {
        id: "report",
        title: "신고",
        description: "게시글/댓글 신고",
        method: "POST",
        path: "/v1/reports",
        scope: "user",
        auth: true,
        body: SAMPLE_REPORT,
      },
    ],
  },
  {
    id: "files",
    title: "파일",
    description: "파일 업로드/다운로드",
    actions: [
      {
        id: "filesPresign",
        title: "업로드 URL 발급",
        description: "presign URL 요청",
        method: "POST",
        path: "/v1/files/presign",
        scope: "user",
        auth: true,
        body: SAMPLE_PRESIGN,
      },
      {
        id: "filesDownload",
        title: "다운로드 URL",
        description: "파일 다운로드 URL",
        method: "GET",
        path: "/v1/files/:fileId/download",
        scope: "user",
        auth: true,
        params: { fileId: "file_001" },
      },
    ],
  },
  {
    id: "shop",
    title: "쇼핑몰",
    description: "교재/교구 주문",
    actions: [
      {
        id: "shopProducts",
        title: "상품 목록",
        description: "상품 리스트",
        method: "GET",
        path: "/v1/shop/products",
        scope: "user",
        auth: true,
      },
      {
        id: "shopProduct",
        title: "상품 상세",
        description: "상품 상세 정보",
        method: "GET",
        path: "/v1/shop/products/:productId",
        scope: "user",
        auth: true,
        params: { productId: "prod_001" },
      },
      {
        id: "shopOrders",
        title: "주문 목록",
        description: "내 주문 리스트",
        method: "GET",
        path: "/v1/shop/orders",
        scope: "user",
        auth: true,
      },
      {
        id: "shopOrderDetail",
        title: "주문 상세",
        description: "주문 상세 조회",
        method: "GET",
        path: "/v1/shop/orders/:orderId",
        scope: "user",
        auth: true,
        params: { orderId: "order_001" },
      },
      {
        id: "shopOrderCreate",
        title: "주문 생성",
        description: "주문 생성",
        method: "POST",
        path: "/v1/shop/orders",
        scope: "user",
        auth: true,
        body: SAMPLE_ORDER,
      },
    ],
  },
  {
    id: "payments",
    title: "결제/구독",
    description: "구독 결제와 주문 결제",
    actions: [
      {
        id: "paymentCheckout",
        title: "구독 결제",
        description: "정기 구독 결제",
        method: "POST",
        path: "/v1/payments/checkout",
        scope: "user",
        auth: true,
        body: SAMPLE_PAYMENT_SUBSCRIPTION,
      },
      {
        id: "subscription",
        title: "구독 상태",
        description: "현재 구독 상태",
        method: "GET",
        path: "/v1/subscription",
        scope: "user",
        auth: true,
      },
      {
        id: "subscriptionCancel",
        title: "구독 해지",
        description: "구독 취소",
        method: "POST",
        path: "/v1/subscription/cancel",
        scope: "user",
        auth: true,
      },
      {
        id: "paymentShop",
        title: "주문 결제",
        description: "쇼핑몰 결제",
        method: "POST",
        path: "/v1/payments/shop",
        scope: "user",
        auth: true,
        body: SAMPLE_PAYMENT_SHOP,
      },
    ],
  },
  {
    id: "admin-org",
    title: "관리자 - 조직",
    description: "기관/학생/클래스 관리",
    actions: [
      {
        id: "adminOrgCreate",
        title: "기관 생성",
        description: "HQ_ADMIN 전용",
        method: "POST",
        path: "/v1/admin/orgs",
        scope: "admin",
        auth: true,
        body: SAMPLE_ORG_CREATE,
      },
      {
        id: "adminOrgUpdate",
        title: "기관 수정",
        description: "기관 정보 업데이트",
        method: "PATCH",
        path: "/v1/admin/orgs/:orgId",
        scope: "admin",
        auth: true,
        params: { orgId: "org_001" },
        body: SAMPLE_ORG_UPDATE,
      },
      {
        id: "adminOrgDeactivate",
        title: "기관 비활성",
        description: "기관 비활성화",
        method: "POST",
        path: "/v1/admin/orgs/:orgId/deactivate",
        scope: "admin",
        auth: true,
        params: { orgId: "org_001" },
      },
      {
        id: "adminOrgAdminCreate",
        title: "기관 관리자 생성",
        description: "관리자 계정 생성",
        method: "POST",
        path: "/v1/admin/orgs/:orgId/admins",
        scope: "admin",
        auth: true,
        params: { orgId: "org_001" },
        body: SAMPLE_ORG_ADMIN,
      },
      {
        id: "adminStudentCreate",
        title: "학생 생성",
        description: "학생 계정 생성",
        method: "POST",
        path: "/v1/admin/students",
        scope: "admin",
        auth: true,
        body: SAMPLE_STUDENT_CREATE,
      },
      {
        id: "adminStudentUpdate",
        title: "학생 수정",
        description: "학생 정보 업데이트",
        method: "PATCH",
        path: "/v1/admin/students/:userId",
        scope: "admin",
        auth: true,
        params: { userId: "user_001" },
        body: SAMPLE_STUDENT_UPDATE,
      },
      {
        id: "adminStudentDisable",
        title: "학생 비활성",
        description: "학생 비활성화",
        method: "POST",
        path: "/v1/admin/students/:userId/disable",
        scope: "admin",
        auth: true,
        params: { userId: "user_001" },
      },
      {
        id: "adminClassCreate",
        title: "클래스 생성",
        description: "클래스 생성",
        method: "POST",
        path: "/v1/admin/classes",
        scope: "admin",
        auth: true,
        body: SAMPLE_CLASS_CREATE,
      },
      {
        id: "adminClassUpdate",
        title: "클래스 수정",
        description: "클래스 정보 업데이트",
        method: "PATCH",
        path: "/v1/admin/classes/:classId",
        scope: "admin",
        auth: true,
        params: { classId: "class_001" },
        body: SAMPLE_CLASS_UPDATE,
      },
      {
        id: "adminClassStudents",
        title: "클래스 학생 등록",
        description: "학생 추가",
        method: "POST",
        path: "/v1/admin/classes/:classId/students",
        scope: "admin",
        auth: true,
        params: { classId: "class_001" },
        body: SAMPLE_CLASS_ADD,
      },
    ],
  },
  {
    id: "admin-assignments",
    title: "관리자 - 과제",
    description: "과제 발행과 관리",
    actions: [
      {
        id: "adminAssignmentCreate",
        title: "과제 생성",
        description: "과제 발행",
        method: "POST",
        path: "/v1/admin/assignments",
        scope: "admin",
        auth: true,
        body: SAMPLE_ASSIGNMENT_CREATE,
      },
      {
        id: "adminAssignmentUpdate",
        title: "과제 수정",
        description: "과제 업데이트",
        method: "PATCH",
        path: "/v1/admin/assignments/:assignmentId",
        scope: "admin",
        auth: true,
        params: { assignmentId: "assignment_001" },
        body: SAMPLE_ASSIGNMENT_UPDATE,
      },
      {
        id: "adminAssignmentClose",
        title: "과제 종료",
        description: "과제 마감",
        method: "POST",
        path: "/v1/admin/assignments/:assignmentId/close",
        scope: "admin",
        auth: true,
        params: { assignmentId: "assignment_001" },
      },
      {
        id: "adminAssignmentOverview",
        title: "과제 개요",
        description: "과제 현황",
        method: "GET",
        path: "/v1/admin/assignments/overview",
        scope: "admin",
        auth: true,
      },
    ],
  },
  {
    id: "admin-content",
    title: "관리자 - 콘텐츠",
    description: "콘텐츠 업로드, 테스트 관리",
    actions: [
      {
        id: "adminContentImport",
        title: "콘텐츠 업로드",
        description: "JSON 콘텐츠 업로드",
        method: "POST",
        path: "/v1/admin/content/import",
        scope: "admin",
        auth: true,
        body: SAMPLE_CONTENT_IMPORT,
      },
      {
        id: "adminContentPreview",
        title: "콘텐츠 미리보기",
        description: "업로드 콘텐츠 미리보기",
        method: "GET",
        path: "/v1/admin/content/:contentId/preview",
        scope: "admin",
        auth: true,
        params: { contentId: "content_001" },
      },
      {
        id: "adminWritingFeedback",
        title: "글쓰기 피드백",
        description: "글쓰기 채점",
        method: "POST",
        path: "/v1/admin/writing/:submissionId/feedback",
        scope: "admin",
        auth: true,
        params: { submissionId: "submission_001" },
        body: SAMPLE_WRITING_FEEDBACK,
      },
      {
        id: "adminTestCreate",
        title: "테스트 생성",
        description: "PDF 테스트 생성",
        method: "POST",
        path: "/v1/admin/tests",
        scope: "admin",
        auth: true,
        body: SAMPLE_TEST_CREATE,
      },
      {
        id: "adminTestAnswers",
        title: "테스트 정답 저장",
        description: "정답 키 저장",
        method: "POST",
        path: "/v1/admin/tests/:testId/answers",
        scope: "admin",
        auth: true,
        params: { testId: "test_001" },
        body: SAMPLE_TEST_ANSWERS,
      },
      {
        id: "adminTestGrade",
        title: "테스트 채점",
        description: "학생 채점",
        method: "POST",
        path: "/v1/admin/tests/:testId/grade",
        scope: "admin",
        auth: true,
        params: { testId: "test_001" },
        body: SAMPLE_TEST_GRADE,
      },
    ],
  },
  {
    id: "admin-boards",
    title: "관리자 - 자료 게시판",
    description: "자료 게시글 승인",
    actions: [
      {
        id: "adminMaterialsApprove",
        title: "자료 게시글 승인",
        description: "materials 게시판 승인",
        method: "POST",
        path: "/v1/admin/boards/materials/:postId/approve",
        scope: "admin",
        auth: true,
        params: { postId: "post_001" },
      },
      {
        id: "adminMaterialsReject",
        title: "자료 게시글 반려",
        description: "materials 게시판 반려",
        method: "POST",
        path: "/v1/admin/boards/materials/:postId/reject",
        scope: "admin",
        auth: true,
        params: { postId: "post_001" },
      },
    ],
  },
  {
    id: "admin-duel",
    title: "관리자 - 대결",
    description: "시즌/스냅샷 관리",
    actions: [
      {
        id: "adminDuelSeason",
        title: "대결 시즌 생성",
        description: "시즌 생성",
        method: "POST",
        path: "/v1/admin/duel/seasons",
        scope: "admin",
        auth: true,
        body: SAMPLE_DUEL_SEASON,
      },
      {
        id: "adminDuelSnapshot",
        title: "대결 스냅샷",
        description: "수상 스냅샷 생성",
        method: "POST",
        path: "/v1/admin/duel/snapshots",
        scope: "admin",
        auth: true,
        body: SAMPLE_DUEL_SNAPSHOT,
      },
      {
        id: "adminDuelRecalculate",
        title: "대결 재계산",
        description: "리더보드 재계산",
        method: "POST",
        path: "/v1/admin/duel/recalculate",
        scope: "admin",
        auth: true,
        body: SAMPLE_DUEL_SNAPSHOT,
      },
    ],
  },
  {
    id: "admin-flags",
    title: "관리자 - 플래그",
    description: "기능 플래그 관리",
    actions: [
      {
        id: "adminFlagsList",
        title: "플래그 목록",
        description: "전체 플래그",
        method: "GET",
        path: "/v1/admin/flags",
        scope: "admin",
        auth: true,
      },
      {
        id: "adminFlagsUpdate",
        title: "플래그 수정",
        description: "플래그 토글",
        method: "PATCH",
        path: "/v1/admin/flags/:flagKey",
        scope: "admin",
        auth: true,
        params: { flagKey: "feature.paid.pro_mode" },
        body: SAMPLE_FLAG_UPDATE,
      },
    ],
  },
  {
    id: "admin-commerce",
    title: "관리자 - 쇼핑/결제",
    description: "상품, 주문, 결제 관리",
    actions: [
      {
        id: "adminShopCreate",
        title: "상품 생성",
        description: "상품 등록",
        method: "POST",
        path: "/v1/admin/shop/products",
        scope: "admin",
        auth: true,
        body: SAMPLE_PRODUCT,
      },
      {
        id: "adminShopUpdate",
        title: "상품 수정",
        description: "상품 정보 수정",
        method: "PATCH",
        path: "/v1/admin/shop/products/:productId",
        scope: "admin",
        auth: true,
        params: { productId: "prod_001" },
        body: SAMPLE_PRODUCT,
      },
      {
        id: "adminShopDelete",
        title: "상품 삭제",
        description: "상품 삭제",
        method: "DELETE",
        path: "/v1/admin/shop/products/:productId",
        scope: "admin",
        auth: true,
        params: { productId: "prod_001" },
      },
      {
        id: "adminShopOrders",
        title: "주문 전체 목록",
        description: "관리자 주문 리스트",
        method: "GET",
        path: "/v1/admin/shop/orders",
        scope: "admin",
        auth: true,
      },
      {
        id: "adminPayments",
        title: "결제 전체 목록",
        description: "관리자 결제 리스트",
        method: "GET",
        path: "/v1/admin/payments",
        scope: "admin",
        auth: true,
      },
    ],
  },
];
const SCOPE_LABELS = {
  public: "공개",
  user: "회원",
  paid: "유료",
  admin: "관리자",
};

const extractParamKeys = (path) => {
  const matches = path.match(/:([A-Za-z0-9_]+)/g);
  if (!matches) {
    return [];
  }
  return matches.map((match) => match.slice(1));
};

const formatPayload = (payload) => {
  if (payload === null || payload === undefined) {
    return "";
  }
  if (typeof payload === "string") {
    return payload;
  }
  return JSON.stringify(payload, null, 2);
};

function ActionCard({ action, request }) {
  const paramKeys = useMemo(() => extractParamKeys(action.path), [action.path]);
  const [params, setParams] = useState(() =>
    paramKeys.reduce((acc, key) => {
      acc[key] = action.params?.[key] || "";
      return acc;
    }, {})
  );
  const [query, setQuery] = useState(() =>
    (action.query || []).reduce((acc, item) => {
      acc[item.key] = item.value ?? "";
      return acc;
    }, {})
  );
  const [bodyText, setBodyText] = useState(() =>
    action.body ? JSON.stringify(action.body, null, 2) : ""
  );
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setParams(
      paramKeys.reduce((acc, key) => {
        acc[key] = action.params?.[key] || "";
        return acc;
      }, {})
    );
    setQuery(
      (action.query || []).reduce((acc, item) => {
        acc[item.key] = item.value ?? "";
        return acc;
      }, {})
    );
    setBodyText(action.body ? JSON.stringify(action.body, null, 2) : "");
    setResponse(null);
    setError("");
  }, [action.id, action.body, action.params, action.query, paramKeys]);

  const resolvedPath = useMemo(() => {
    let path = action.path;
    paramKeys.forEach((key) => {
      const value = params[key];
      if (value) {
        path = path.replace(`:${key}`, encodeURIComponent(value));
      }
    });
    const queryString = Object.entries(query)
      .filter(([, value]) => value !== "" && value !== null && value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");
    return queryString ? `${path}?${queryString}` : path;
  }, [action.path, paramKeys, params, query]);

  const hasBody = action.method !== "GET" && action.method !== "DELETE";

  const handleRun = async () => {
    setLoading(true);
    setError("");
    try {
      let body;
      if (hasBody && bodyText.trim()) {
        try {
          body = JSON.parse(bodyText);
        } catch (parseError) {
          setError("요청 본문 JSON 형식이 올바르지 않습니다.");
          setLoading(false);
          return;
        }
      }
      const result = await request({ path: resolvedPath, method: action.method, body });
      setResponse(result);
    } catch (requestError) {
      setError(requestError.message || "요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (action.body) {
      setBodyText(JSON.stringify(action.body, null, 2));
    }
  };

  return (
    <details className="action">
      <summary>
        <div className="action-head">
          <span className={`method ${action.method.toLowerCase()}`}>{action.method}</span>
          <div>
            <h4>{action.title}</h4>
            <p>{action.description}</p>
          </div>
        </div>
        <div className="action-meta">
          <code className="path">{resolvedPath}</code>
          <div className="action-tags">
            <span className={`tag scope-${action.scope}`}>{SCOPE_LABELS[action.scope]}</span>
            {action.auth ? <span className="tag">auth</span> : null}
          </div>
        </div>
      </summary>
      <div className="action-body">
        {action.note ? <p className="action-note">{action.note}</p> : null}
        {paramKeys.length ? (
          <div className="input-grid">
            {paramKeys.map((key) => (
              <label key={key} className="field">
                <span>{key}</span>
                <input
                  type="text"
                  value={params[key]}
                  onChange={(event) =>
                    setParams((prev) => ({
                      ...prev,
                      [key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
        {action.query?.length ? (
          <div className="input-grid">
            {action.query.map((item) => (
              <label key={item.key} className="field">
                <span>{item.label || item.key}</span>
                <input
                  type="text"
                  value={query[item.key]}
                  onChange={(event) =>
                    setQuery((prev) => ({
                      ...prev,
                      [item.key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
        {hasBody ? (
          <label className="field">
            <span>요청 본문</span>
            <textarea
              rows={6}
              value={bodyText}
              onChange={(event) => setBodyText(event.target.value)}
            />
          </label>
        ) : null}
        <div className="action-actions">
          <button className="btn" onClick={handleRun} disabled={loading}>
            실행
          </button>
          {action.body ? (
            <button className="btn ghost" onClick={handleReset} disabled={loading}>
              샘플 복원
            </button>
          ) : null}
        </div>
        {error ? <div className="inline-error">{error}</div> : null}
        {response ? (
          <div className="response">
            <div className="response-meta">status {response.status}</div>
            <pre>{formatPayload(response.payload)}</pre>
          </div>
        ) : null}
      </div>
    </details>
  );
}
function OpsStation() {
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [tokenInput, setTokenInput] = useState(token);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [sessionLoading, setSessionLoading] = useState(false);

  const [signupForm, setSignupForm] = useState({
    loginId: "",
    password: "",
    name: "",
    orgId: "",
    region: "",
    school: "",
    levelId: "",
    studentPhone: "",
    parentPhone: "",
    diagnosticOptIn: false,
  });
  const [loginForm, setLoginForm] = useState({ loginId: "", password: "" });
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState({
    public: true,
    user: true,
    paid: true,
    admin: false,
  });

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  useEffect(() => {
    setTokenInput(token);
  }, [token]);

  const showNotice = (message, type = "info") => {
    setNotice(message);
    setNoticeType(type);
    setTimeout(() => setNotice(""), 4000);
  };

  const apiRequest = async ({ path, method = "GET", body }) => {
    const base = apiBase.trim().replace(/\/$/, "");
    const url = base ? `${base}${path}` : path;
    const headers = { ...authHeaders };
    const options = { method, headers };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const text = await response.text();
    let payload;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (parseError) {
        payload = text;
      }
    }
    if (!response.ok || (payload && payload.success === false)) {
      const message = payload?.error?.message || payload?.message || response.statusText;
      throw new Error(message || "요청에 실패했습니다.");
    }
    return { status: response.status, payload };
  };

  const loadProfile = async () => {
    if (!token) {
      return;
    }
    try {
      const result = await apiRequest({ path: "/v1/auth/me" });
      setProfile(normalizeProfile(result.payload?.data));
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const loadSubscription = async () => {
    if (!token) {
      return;
    }
    try {
      const result = await apiRequest({ path: "/v1/subscription" });
      setSubscription(result.payload?.data || null);
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  useEffect(() => {
    if (!token) {
      setProfile(null);
      setSubscription(null);
      return;
    }
    loadProfile();
    loadSubscription();
  }, [token, apiBase]);

  const loadOrgs = async () => {
    setOrgsLoading(true);
    try {
      const result = await apiRequest({ path: "/v1/auth/orgs" });
      setOrgs(result.payload?.data || []);
    } catch (error) {
      showNotice("기관 목록을 불러오지 못했습니다.", "error");
    } finally {
      setOrgsLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, [apiBase]);

  const applyToken = (value) => {
    setToken(value);
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    if (!signupForm.orgId) {
      showNotice("소속 기관을 선택해 주세요.", "error");
      return;
    }
    if (!signupForm.levelId) {
      showNotice("학년을 선택해 주세요.", "error");
      return;
    }
    const trimmedName = signupForm.name?.trim() || "";
    const trimmedRegion = signupForm.region?.trim() || "";
    const trimmedSchool = signupForm.school?.trim() || "";
    const trimmedStudentPhone = signupForm.studentPhone?.trim() || "";
    const trimmedParentPhone = signupForm.parentPhone?.trim() || "";
    if (!trimmedName) {
      showNotice("이름을 입력해 주세요.", "error");
      return;
    }
    if (!trimmedRegion) {
      showNotice("지역을 입력해 주세요.", "error");
      return;
    }
    if (!trimmedSchool) {
      showNotice("학교를 입력해 주세요.", "error");
      return;
    }
    if (!trimmedStudentPhone) {
      showNotice("학생 전화번호를 입력해 주세요.", "error");
      return;
    }
    if (!trimmedParentPhone) {
      showNotice("학부모 전화번호를 입력해 주세요.", "error");
      return;
    }
    if (getPhoneDigits(trimmedStudentPhone).length !== 11) {
      showNotice("학생 전화번호는 11자리로 입력해 주세요.", "error");
      return;
    }
    if (getPhoneDigits(trimmedParentPhone).length !== 11) {
      showNotice("학부모 전화번호는 11자리로 입력해 주세요.", "error");
      return;
    }
    const selectedLevel = GRADE_LEVELS.find((item) => item.levelId === signupForm.levelId);
    if (!selectedLevel) {
      showNotice("학년 정보를 다시 선택해 주세요.", "error");
      return;
    }
    setSessionLoading(true);
    try {
      const result = await apiRequest({
        path: "/v1/auth/signup",
        method: "POST",
        body: {
          login_id: signupForm.loginId.trim(),
          password: signupForm.password,
          name: trimmedName,
          org_id: signupForm.orgId,
          region: trimmedRegion,
          school: trimmedSchool,
          grade_label: selectedLevel.label,
          level_id: selectedLevel.levelId,
          student_phone: trimmedStudentPhone,
          parent_phone: trimmedParentPhone,
          diagnostic_opt_in: signupForm.diagnosticOptIn,
        },
      });
      const data = result.payload?.data || {};
      const accessToken = data.accessToken || data.access_token;
      const user = normalizeProfile(data.user);
      if (accessToken) {
        applyToken(accessToken);
      }
      if (user) {
        setProfile(user);
      }
      showNotice("가입 완료!", "success");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setSessionLoading(true);
    try {
      const result = await apiRequest({
        path: "/v1/auth/login",
        method: "POST",
        body: {
          login_id: loginForm.loginId.trim(),
          password: loginForm.password,
        },
      });
      const data = result.payload?.data || {};
      const accessToken = data.accessToken || data.access_token;
      const user = normalizeProfile(data.user);
      if (accessToken) {
        applyToken(accessToken);
      }
      if (user) {
        setProfile(user);
      }
      showNotice("로그인되었습니다.", "success");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await apiRequest({ path: "/v1/auth/logout", method: "POST" });
      }
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      applyToken("");
      setProfile(null);
      setSubscription(null);
      showNotice("로그아웃 완료.", "success");
    }
  };

  const totalActions = useMemo(
    () => ACTION_GROUPS.reduce((sum, group) => sum + group.actions.length, 0),
    []
  );

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ACTION_GROUPS.map((group) => {
      const actions = group.actions.filter((action) => {
        if (!scopeFilter[action.scope]) {
          return false;
        }
        if (!term) {
          return true;
        }
        const haystack = `${action.title} ${action.description} ${action.path}`.toLowerCase();
        return haystack.includes(term);
      });
      return { ...group, actions };
    }).filter((group) => group.actions.length);
  }, [search, scopeFilter]);

  const visibleActions = filteredGroups.reduce((sum, group) => sum + group.actions.length, 0);

  const toggleScope = (key) => {
    setScopeFilter((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const normalizeProfile = (data) => {
    if (!data) {
      return null;
    }
    return {
      id: data.id,
      loginId: data.loginId || data.login_id || data.email || "",
      email: data.email || data.loginId || data.login_id || "",
      name: data.name || "",
      roles: data.roles || [],
      status: data.status || "",
    };
  };

  const wsBase = useMemo(() => {
    const base = apiBase.trim().replace(/\/$/, "");
    if (!base) {
      return "";
    }
    if (base.startsWith("https")) {
      return base.replace(/^https/, "wss");
    }
    return base.replace(/^http/, "ws");
  }, [apiBase]);

  const [wsUrl, setWsUrl] = useState(
    wsBase ? `${wsBase}/v1/duel/ws` : "ws://localhost:8080/v1/duel/ws"
  );
  const wsRef = useRef(null);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [wsLog, setWsLog] = useState([]);
  const [wsPayload, setWsPayload] = useState(
    JSON.stringify(
      {
        type: "match.join",
        payload: { roomId: "room_001" },
      },
      null,
      2
    )
  );

  useEffect(() => {
    if (wsBase) {
      setWsUrl(`${wsBase}/v1/duel/ws`);
    }
  }, [wsBase]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const pushWsLog = (type, message) => {
    setWsLog((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        message,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const buildWsUrl = () => {
    if (!token) {
      return wsUrl;
    }
    const separator = wsUrl.includes("?") ? "&" : "?";
    return `${wsUrl}${separator}token=${encodeURIComponent(token)}`;
  };

  const connectWs = () => {
    if (!wsUrl) {
      showNotice("WebSocket URL을 입력하세요.", "error");
      return;
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    const finalUrl = buildWsUrl();
    const socket = new WebSocket(finalUrl);
    wsRef.current = socket;
    setWsStatus("connecting");
    pushWsLog("system", `connecting: ${finalUrl}`);

    socket.onopen = () => {
      setWsStatus("connected");
      pushWsLog("system", "connected");
    };

    socket.onmessage = (event) => {
      pushWsLog("message", event.data);
    };

    socket.onclose = () => {
      setWsStatus("disconnected");
      pushWsLog("system", "disconnected");
    };

    socket.onerror = () => {
      pushWsLog("error", "websocket error");
    };
  };

  const disconnectWs = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendWs = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      pushWsLog("error", "socket not connected");
      return;
    }
    wsRef.current.send(wsPayload);
    pushWsLog("sent", wsPayload);
  };

  const clearWsLog = () => {
    setWsLog([]);
  };

  const wsSamples = [
    {
      label: "match.join",
      payload: { type: "match.join", payload: { roomId: "room_001" } },
    },
    {
      label: "match.answer",
      payload: { type: "match.answer", payload: { questionId: "q_001", answer: "A" } },
    },
    {
      label: "match.reconnect",
      payload: { type: "match.reconnect", payload: { roomId: "room_001" } },
    },
  ];

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-intro">
          <div className="brand-mark">
            <img src={import.meta.env.BASE_URL + "korfarm-logo.png"} alt="국어농장" />
          </div>
          <div>
            <p className="hero-title">국어농장 운영 스테이션</p>
            <p className="hero-sub">전체 기능을 한 화면에서 제어하고 검증하세요.</p>
            <div className="hero-metrics">
              <div>
                <span className="label">API Base</span>
                <span className="value">{apiBase}</span>
              </div>
              <div>
                <span className="label">Actions</span>
                <span className="value">
                  {visibleActions}/{totalActions}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-panel">
          <div className="field">
            <span>API Base</span>
            <input
              type="text"
              value={apiBase}
              onChange={(event) => setApiBase(event.target.value)}
              placeholder="http://localhost:8080"
            />
          </div>
          <div className="field">
            <span>Access Token</span>
            <input
              type="text"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Bearer 토큰 입력"
            />
          </div>
          <div className="hero-actions">
            <button
              className="btn"
              onClick={() => {
                applyToken(tokenInput.trim());
                showNotice("토큰이 적용되었습니다.", "success");
              }}
            >
              토큰 적용
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                applyToken("");
                setTokenInput("");
                showNotice("토큰이 삭제되었습니다.", "info");
              }}
            >
              토큰 삭제
            </button>
          </div>
          <div className="status-grid">
            <div>
              <span className="label">Profile</span>
              <span className="value">{profile?.loginId || profile?.email || "미로그인"}</span>
              <span className="meta">{profile?.roles?.join(", ") || ""}</span>
            </div>
            <div>
              <span className="label">Subscription</span>
              <span className="value">{subscription?.status || "미설정"}</span>
              <span className="meta">{subscription?.endAt || subscription?.end_at || ""}</span>
            </div>
          </div>
          <div className="hero-actions">
            <button className="btn ghost" onClick={loadProfile} disabled={!token}>
              프로필 새로고침
            </button>
            <button className="btn ghost" onClick={loadSubscription} disabled={!token}>
              구독 새로고침
            </button>
            <button className="btn" onClick={handleLogout} disabled={!token}>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {notice ? <div className={`notice ${noticeType}`}>{notice}</div> : null}

      <section className="session-grid">
        <div className="panel">
          <h2>회원가입</h2>
          <form className="stack" onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="아이디"
              value={signupForm.loginId}
              onChange={(event) => setSignupForm({ ...signupForm, loginId: event.target.value })}
              required
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={signupForm.password}
              onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
              required
            />
            <input
              type="text"
              placeholder="이름"
              value={signupForm.name}
              onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })}
              required
            />
            <select
              value={signupForm.region}
              onChange={(event) => setSignupForm({ ...signupForm, region: event.target.value })}
              required
            >
              <option value="">지역 선택</option>
              {REGIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="학교"
              value={signupForm.school}
              onChange={(event) => setSignupForm({ ...signupForm, school: event.target.value })}
              required
            />
            <select
              value={signupForm.levelId}
              onChange={(event) => setSignupForm({ ...signupForm, levelId: event.target.value })}
              required
            >
              <option value="">학년 선택</option>
              {GRADE_LEVELS.map((item) => (
                <option key={item.levelId} value={item.levelId}>
                  {item.levelName} · {item.label}
                </option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="학생 전화번호"
              value={signupForm.studentPhone}
              onChange={(event) =>
                setSignupForm({
                  ...signupForm,
                  studentPhone: formatPhoneNumber(event.target.value),
                })
              }
              inputMode="numeric"
              maxLength={13}
              required
            />
            <input
              type="tel"
              placeholder="학부모 전화번호"
              value={signupForm.parentPhone}
              onChange={(event) =>
                setSignupForm({
                  ...signupForm,
                  parentPhone: formatPhoneNumber(event.target.value),
                })
              }
              inputMode="numeric"
              maxLength={13}
              required
            />
            <select
              value={signupForm.diagnosticOptIn ? "yes" : "no"}
              onChange={(event) =>
                setSignupForm({ ...signupForm, diagnosticOptIn: event.target.value === "yes" })
              }
            >
              <option value="yes">진단 테스트 응시</option>
              <option value="no">나중에 응시</option>
            </select>
            <select
              value={signupForm.orgId}
              onChange={(event) => setSignupForm({ ...signupForm, orgId: event.target.value })}
              required
            >
              <option value="">소속 기관 선택</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {orgsLoading ? <p className="muted">기관 목록을 불러오는 중...</p> : null}
            {!orgsLoading && orgs.length === 0 ? (
              <p className="muted">기관이 아직 등록되지 않았습니다.</p>
            ) : null}
            <button className="btn" type="submit" disabled={sessionLoading}>
              가입하기
            </button>
          </form>
        </div>
        <div className="panel">
          <h2>로그인</h2>
          <form className="stack" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="아이디"
              value={loginForm.loginId}
              onChange={(event) => setLoginForm({ ...loginForm, loginId: event.target.value })}
              required
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              required
            />
            <button className="btn" type="submit" disabled={sessionLoading}>
              로그인
            </button>
          </form>
        </div>
      </section>

      <section className="workspace">
        <div className="panel filters">
          <h2>API 탐색</h2>
          <p>검색과 필터로 원하는 기능을 빠르게 찾으세요.</p>
          <input
            type="text"
            placeholder="검색: board, duel, admin..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="filter-row">
            {Object.keys(scopeFilter).map((key) => (
              <button
                key={key}
                className={`filter-chip ${scopeFilter[key] ? "active" : ""}`}
                onClick={() => toggleScope(key)}
                type="button"
              >
                {SCOPE_LABELS[key]}
              </button>
            ))}
          </div>
          <div className="filter-meta">
            표시 중인 액션: {visibleActions} / {totalActions}
          </div>
        </div>
        <div className="groups">
          {filteredGroups.map((group) => (
            <section key={group.id} className="action-group">
              <div className="group-head">
                <div>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
                <span className="count">{group.actions.length}</span>
              </div>
              <div className="action-list">
                {group.actions.map((action) => (
                  <ActionCard key={action.id} action={action} request={apiRequest} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="panel ws-panel">
        <div className="ws-head">
          <div>
            <h2>대결 실시간 콘솔</h2>
            <p>WebSocket 이벤트를 직접 전송하고 로그를 확인합니다.</p>
          </div>
          <span className={`ws-status ${wsStatus}`}>{wsStatus}</span>
        </div>
        <div className="ws-grid">
          <div className="ws-controls">
            <label className="field">
              <span>WebSocket URL</span>
              <input
                type="text"
                value={wsUrl}
                onChange={(event) => setWsUrl(event.target.value)}
                placeholder="ws://localhost:8080/v1/duel/ws"
              />
            </label>
            <div className="ws-actions">
              <button className="btn" onClick={connectWs}>
                연결
              </button>
              <button className="btn ghost" onClick={disconnectWs}>
                연결 해제
              </button>
              <button className="btn ghost" onClick={clearWsLog}>
                로그 삭제
              </button>
            </div>
            <label className="field">
              <span>보낼 메시지</span>
              <textarea
                rows={6}
                value={wsPayload}
                onChange={(event) => setWsPayload(event.target.value)}
              />
            </label>
            <div className="ws-samples">
              {wsSamples.map((sample) => (
                <button
                  key={sample.label}
                  className="btn ghost"
                  onClick={() => setWsPayload(JSON.stringify(sample.payload, null, 2))}
                  type="button"
                >
                  {sample.label}
                </button>
              ))}
              <button className="btn" onClick={sendWs}>
                보내기
              </button>
            </div>
          </div>
          <div className="ws-log">
            {wsLog.length ? (
              wsLog.map((entry) => (
                <div key={entry.id} className={`log-entry ${entry.type}`}>
                  <span className="time">{entry.time}</span>
                  <span className="type">{entry.type}</span>
                  <span className="message">{entry.message}</span>
                </div>
              ))
            ) : (
              <p className="muted">메시지가 아직 없습니다.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default OpsStation;
