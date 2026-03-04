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
