/**
 * 자유 주제 (지식과 지혜) — 모든 레벨 공통.
 * 학생이 본인이 주제(제목)를 직접 입력해 글쓰기. 같은 free_topic 끼리 게시판 공유.
 */
export const FREE_TOPIC_KEY = "free_topic";

export const FREE_TOPIC_DEFAULT_LABEL = "자유 주제 (학생이 직접 입력)";

/** 학생/어드민에게 보일 자유 주제 항목. 정적 JSON 과 합쳐 최상단에 노출. */
export const FREE_TOPIC_ENTRY = Object.freeze({
  key: FREE_TOPIC_KEY,
  label: FREE_TOPIC_DEFAULT_LABEL,
  isFree: true,
});

/** topics 배열 앞에 자유 주제를 prepend. 이미 있으면 중복 추가 안 함. */
export function withFreeTopic(topics) {
  const list = Array.isArray(topics) ? topics : [];
  if (list.some((t) => t.key === FREE_TOPIC_KEY)) return list;
  return [FREE_TOPIC_ENTRY, ...list];
}

export function isFreeTopic(topic) {
  if (!topic) return false;
  if (typeof topic === "string") return topic === FREE_TOPIC_KEY;
  return topic.key === FREE_TOPIC_KEY || topic.isFree === true;
}
