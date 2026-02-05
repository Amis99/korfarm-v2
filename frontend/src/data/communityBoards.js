export const COMMUNITY_BOARDS = [
  {
    id: "learning_request",
    name: "학습 신청 게시판",
    description: "학습 신청과 학습 일정 공유",
    tag: "학습 신청",
    requiresPaid: true,
  },
  {
    id: "community",
    name: "커뮤니티 게시판",
    description: "학습 이야기와 소식 공유",
    tag: "커뮤니티",
  },
  {
    id: "qna",
    name: "학습 질문 게시판",
    description: "학습 관련 질문과 답변",
    tag: "질문 답변",
    requiresPaid: true,
  },
  {
    id: "materials",
    name: "학습 자료 게시판",
    description: "학습 자료 공유와 다운로드",
    tag: "자료 공유",
    requiresApproval: true,
    writeRole: "admin",
    requiresPaid: true,
  },
];

export const COMMUNITY_POSTS = [
  {
    id: "post_001",
    boardId: "learning_request",
    title: "초등 국어 심화반 신청하고 싶어요",
    excerpt: "학급/학원 신청 방법과 일정 확인 부탁드립니다.",
    author: "김서연",
    time: "10분 전",
    status: "active",
  },
  {
    id: "post_002",
    boardId: "learning_request",
    title: "중1 논술 클리닉 신청 문의",
    excerpt: "중1 심화반 신청 기준과 일정이 궁금합니다.",
    author: "이준호",
    time: "1시간 전",
    status: "active",
  },
  {
    id: "post_003",
    boardId: "community",
    title: "오늘 무료 학습 10문제 완료!",
    excerpt: "맞춤 퀴즈 풀고 씨앗을 받았어요!",
    author: "박예은",
    time: "어제",
    status: "active",
  },
  {
    id: "post_004",
    boardId: "qna",
    title: "문법 질문: '은/는' 쓰임이 헷갈려요",
    excerpt: "예문에서 '은/는' 구별 방법 알려주세요.",
    author: "정민수",
    time: "어제",
    status: "active",
  },
  {
    id: "post_005",
    boardId: "materials",
    title: "중등 서술형 대비 자료 공유",
    excerpt: "중등 대비 서술형 평가 자료입니다.",
    author: "한지은",
    time: "2일 전",
    status: "active",
    attachments: [
      { id: "file_001", name: "중등_서술형_자료.pdf", size: "2.4MB" },
      { id: "file_002", name: "서술형_평가지.xlsx", size: "420KB" },
    ],
  },
  {
    id: "post_006",
    boardId: "materials",
    title: "고등 독해 훈련지 공유",
    excerpt: "고등 독해 훈련지 업로드 요청합니다.",
    author: "오하린",
    time: "3일 전",
    status: "pending",
    attachments: [
      { id: "file_003", name: "고등_독해_훈련지.pdf", size: "1.1MB" },
    ],
  },
];

export const COMMUNITY_RANKING = [
  { name: "알렉스", score: "5,240 XP" },
  { name: "수민", score: "4,980 XP" },
  { name: "진우", score: "4,560 XP" },
];
