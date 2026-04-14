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
    name: "커뮤니티 채팅",
    description: "실시간 채팅으로 학습 이야기와 소식 공유",
    tag: "채팅",
    chatMode: true,
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
    writeRole: "admin",
    requiresPaid: true,
  },
  {
    id: "inquiry",
    name: "문의/상담",
    description: "문의사항을 남겨주시면 관리자가 답변드립니다",
    tag: "문의",
    isSecret: true,
  },
];
