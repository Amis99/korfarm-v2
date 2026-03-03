/**
 * 국어 영역별 색상 매핑
 * 모든 차트 컴포넌트에서 공유
 */

const DOMAIN_MAP = {
  // 파랑 계열 — 화법/작문/매체
  "화법": { main: "#3b82f6", bg: "rgba(59,130,246,0.18)" },
  "작문": { main: "#60a5fa", bg: "rgba(96,165,250,0.18)" },
  "화법과 작문": { main: "#3b82f6", bg: "rgba(59,130,246,0.18)" },
  "매체": { main: "#818cf8", bg: "rgba(129,140,248,0.18)" },
  "언어와 매체": { main: "#818cf8", bg: "rgba(129,140,248,0.18)" },

  // 초록 계열 — 문법
  "문법": { main: "#22c55e", bg: "rgba(34,197,94,0.18)" },
  "언어": { main: "#22c55e", bg: "rgba(34,197,94,0.18)" },

  // 노랑/주황 계열 — 문학
  "문학": { main: "#f59e0b", bg: "rgba(245,158,11,0.18)" },

  // 빨강 계열 — 비문학/독서
  "비문학": { main: "#ef4444", bg: "rgba(239,68,68,0.18)" },
  "독서": { main: "#ef4444", bg: "rgba(239,68,68,0.18)" },
};

const DEFAULT_COLOR = { main: "#94a3b8", bg: "rgba(148,163,184,0.18)" };

export function getDomainColor(domain) {
  if (!domain) return DEFAULT_COLOR;
  // 정확히 매칭되면 반환
  if (DOMAIN_MAP[domain]) return DOMAIN_MAP[domain];
  // 부분 매칭 (예: "화법과작문" → "화법과 작문")
  const key = Object.keys(DOMAIN_MAP).find(k => domain.includes(k) || k.includes(domain));
  return key ? DOMAIN_MAP[key] : DEFAULT_COLOR;
}

// 차트용 배열 색상 추출
export function getDomainColors(domains) {
  return domains.map(d => getDomainColor(d));
}
