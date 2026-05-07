import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost, normalizeInventoryKeys } from "../utils/api";
import NoticeBell from "../components/NoticeBell";
import HarvestCraftModal from "../components/HarvestCraftModal";
import "../styles/student-home.css";

// 채팅 마크다운 렌더러 — 표·이미지·링크·코드블록 모두 지원
function ChatMarkdown({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        img: ({ node, ...props }) => <img {...props} loading="lazy" />,
      }}
    >
      {text || ""}
    </ReactMarkdown>
  );
}

// ─── fallback / 기본값 (API 응답이 늦거나 실패 시) ───────────────────

const DEFAULT_STUDENT = {
  name: "학생",
  level: "—",
  score: 0,
  grapefruit: 0,
  notifications: 0,
  rankPos: 0,
  rankTotal: 0,
};

// 페르소나 키 → 표시용 메타
const PERSONA_MAP = {
  owl:      { name: "부엉이샘", emoji: "🦉", initial: "부엉" },
  amis:     { name: "아미스샘", emoji: "👨‍🌾", initial: "아미스" },
  nurungji: { name: "누룽지샘", emoji: "👩‍🌾", initial: "누룽지" },
};
const DEFAULT_TUTOR = { persona: null, name: "AI 선생님", emoji: "🌱", initial: "AI" };

// 레벨 코드 → 한글 (표시용)
const LEVEL_LABEL_MAP = {
  saussure1: "소쉬르 1", saussure2: "소쉬르 2", saussure3: "소쉬르 3",
  frege1: "프레게 1", frege2: "프레게 2", frege3: "프레게 3",
  russell1: "러셀 1", russell2: "러셀 2", russell3: "러셀 3",
  wittgenstein1: "비트겐슈타인 1", wittgenstein2: "비트겐슈타인 2", wittgenstein3: "비트겐슈타인 3",
};

// 작물 6종 메타 (이름·색상 표시용 — count 는 apiGet 으로 채움)
const WALLET_META = [
  { key: "grapefruit", color: "orange", name: "자몽", primary: true },
  { key: "crop_wheat", color: "cream",  name: "밀" },
  { key: "crop_rice",  color: "yellow", name: "쌀" },
  { key: "crop_corn",  color: "yellow", name: "옥수수" },
  { key: "crop_grape", color: "purple", name: "포도" },
  { key: "crop_apple", color: "red",    name: "사과" },
];

// RECOMMENDATIONS — daily-analysis 응답으로 동적 채움. fallback 빈 배열.
const FALLBACK_RECOMMENDATIONS = [];

// 페르소나별 첫 인사 톤 — useEffect 안에서 학생 이름과 결합해 동적 생성
const PERSONA_GREETING = {
  owl: (name) => `${name} 학생, 어서 오세요. 오늘은 무엇을 함께 살펴볼까요?`,
  amis: (name) => `${name}야! 어서 와! 오늘 뭐 도와줄까?`,
  nurungji: (name) => `${name}아~ 안녕! 오늘은 누나가 도와줄게~ 😊`,
  null: () => "안녕하세요. 먼저 캐릭터를 골라주세요. 우측 상단에서 변경할 수 있어요.",
};

// 학습 계획표 fallback (API 실패 시)
const FALLBACK_PLAN = [
  { id: "p1", title: "일일 퀴즈 10문제", meta: "5분 · 비문학 + 어휘", due: "오늘", dueSoft: false, done: false },
];

// 시즌 랭킹 fallback
const FALLBACK_RANKING = [
  { id: "1", pos: "🥇", color: "purple", name: "—", score: "—", me: false },
  { id: "2", pos: "🥈", color: "blue",   name: "—", score: "—", me: false },
  { id: "3", pos: "🥉", color: "orange", name: "—", score: "—", me: false },
];

const QUICK_CHIPS = [
  { id: "q1", text: "📷 사진으로 물어보기", q: "사진을 찍어서 모르는 문제를 물어보고 싶어요" },
  { id: "q2", text: "💡 어휘 도움", q: "헷갈리는 단어 뜻을 알려주세요" },
  { id: "q3", text: "✏ 글쓰기 첨삭", q: "오늘 쓴 글 첨삭해 주세요" },
  { id: "q4", text: "📊 약점 분석", q: "제 약점 영역을 분석해 주세요" },
];

// 무료 회원용 큰 카드 (4장)
const FREE_BIG_CARDS = [
  { id: "daily-quiz",    tint: "yellow", color: "yellow", label: "퀴즈<br/>일러스트",  tag: "무료 · 매일", title: "일일 퀴즈",    meta: "10문제 · 약 5분 · 매일 갱신",   cta: "지금 풀기",    route: "/daily-quiz" },
  { id: "daily-reading", tint: "blue",   color: "blue",   label: "독해<br/>일러스트",  tag: "무료 · 매일", title: "일일 독해",    meta: "다양한 영역 정독 훈련 · 약 10분", cta: "지금 읽기",    route: "/daily-reading" },
  { id: "diagnostic",    tint: "green",  color: "green",  label: "진단<br/>일러스트",  tag: "1회 무료",    title: "진단 테스트",  meta: "10대 역량 분석 · 약 15분 · 학부모님께도 결과", cta: "응시하기", route: "/diagnostic/v2" },
  { id: "battle",        tint: "red",    color: "red",    label: "대결<br/>일러스트",  tag: "무료 · LIVE", title: "대결 라이브",  meta: "라운드제 서바이벌 · 친구·AI 대결", live: true, cta: "도전하기", route: "/duel" },
];

// 무료 회원용 잠긴 카드 (4장)
const LOCKED_PREVIEW_CARDS = [
  { id: "ai-tutor",     color: "cream",  label: "AI<br/>튜터",      title: "AI 튜터",                  tagline: "1:1 학습 코치 · 어휘·문법 즉답, 사진으로도 물어볼 수 있어요" },
  { id: "study-modes",  color: "green",  label: "12레벨<br/>심화",  title: "농장별 모드 + 프로 모드",  tagline: "12레벨 심화 학습 · 문학·비문학·어휘 단계별 마스터" },
  { id: "writing",      color: "blue",   label: "글쓰기<br/>첨삭",  title: "글쓰기 첨삭",              tagline: "AI가 글을 다듬어줘요 · 어휘 추천, 문장 흐름까지 친절하게" },
  { id: "analytics",    color: "purple", label: "분석<br/>리포트",  title: "통합 분석표",              tagline: "모든 학습 데이터 한눈에 · 강·약점, 학부모 리포트까지" },
];

const TABS = [
  { id: "home",     color: "orange", label: "홈" },
  { id: "study",    color: "yellow", label: "학습", short: "학습" },
  { id: "writing",  color: "blue",   label: "글쓰기", short: "쓰기" },
  { id: "analysis", color: "green",  label: "분석", short: "분석" },
  { id: "more",     color: "purple", label: "더보기", short: "메뉴" },
];

// 무료 회원에게 잠긴 탭
const FREE_LOCKED_TABS = new Set(["writing", "analysis"]);

// 사이드바 항목 — locked 플래그 추가 (무료 회원에게 적용됨)
const SIDEBAR_GROUPS = [
  {
    id: "free",
    title: "🌟 무료 기능",
    titleClay: { color: "yellow", label: "★" },
    items: [
      { id: "daily-quiz",    icon: "📝", label: "일일 퀴즈",    badge: "무료", badgeKind: "free", lockedForFree: false },
      { id: "daily-reading", icon: "📖", label: "일일 독해",    badge: "무료", badgeKind: "free", lockedForFree: false },
      { id: "duel",          icon: "⚔",  label: "대결 라이브",  badge: "3",   badgeKind: "live", lockedForFree: false },
      { id: "ranking",       icon: "🏆", label: "시즌 랭킹",    badge: null,  badgeKind: null,   lockedForFree: false },
    ],
  },
  {
    id: "study",
    title: "🌾 학습",
    titleClay: { color: "green", label: "학습" },
    items: [
      { id: "farm-mode",  icon: "🌱", label: "농장별 모드",  badge: null, badgeKind: null,   lockedForFree: true },
      { id: "pro-mode",   icon: "🎓", label: "프로 모드",    badge: null, badgeKind: null,   lockedForFree: true },
      { id: "recommend",  icon: "✨", label: "추천 학습",    badge: null, badgeKind: null,   lockedForFree: true },
      { id: "study-plan", icon: "📅", label: "학습 계획표",  badge: "3",  badgeKind: "soft", lockedForFree: true },
    ],
  },
  {
    id: "writing",
    title: "✏ 글쓰기",
    titleClay: { color: "blue", label: "쓰기" },
    items: [
      { id: "wisdom", icon: "📚", label: "지식과 지혜", badge: null, badgeKind: null, lockedForFree: true },
    ],
  },
  {
    id: "analysis",
    title: "📊 분석",
    titleClay: { color: "purple", label: "분석" },
    items: [
      { id: "diagnostic",   icon: "🎯", label: "역량 진단",       badge: "1회 무료", badgeKind: "free", lockedForFree: false },
      { id: "test-report",  icon: "📈", label: "테스트별 성적표", badge: null, badgeKind: null, lockedForFree: true },
      { id: "unified",      icon: "📋", label: "통합 분석표",     badge: null, badgeKind: null, lockedForFree: true },
    ],
  },
  {
    id: "tests",
    title: "📝 테스트",
    titleClay: { color: "yellow", label: "시험" },
    items: [
      { id: "tests",       icon: "📚", label: "테스트 창고",     badge: null, badgeKind: null, lockedForFree: true },
      { id: "ai-study",    icon: "✨", label: "AI 학습 만들기",  badge: null, badgeKind: null, lockedForFree: true },
    ],
  },
  {
    id: "social",
    title: "💬 소통",
    titleClay: { color: "rose", label: "소통" },
    items: [
      { id: "community", icon: "📢", label: "커뮤니티", badge: null, badgeKind: null, lockedForFree: false },
      { id: "shop",      icon: "🛒", label: "쇼핑몰",   badge: null, badgeKind: null, lockedForFree: false },
    ],
  },
  {
    id: "harvest",
    title: "🌾 수확",
    titleClay: { color: "green", label: "수확" },
    items: [
      { id: "harvest-ledger", icon: "📒", label: "수확 장부",      badge: null, badgeKind: null, lockedForFree: false },
      { id: "seed-log",       icon: "🌱", label: "씨앗 획득 내역", badge: null, badgeKind: null, lockedForFree: false },
      { id: "seed-craft",     icon: "🔄", label: "씨앗 → 작물 교환", badge: null, badgeKind: null, lockedForFree: false },
    ],
  },
  {
    id: "settings",
    title: "⚙ 설정",
    titleClay: { color: "cream", label: "설정" },
    items: [
      { id: "wallet",    icon: "🍊", label: "작물 지갑",   badge: null,  badgeKind: null,      lockedForFree: true },
      { id: "persona",   icon: "🦉", label: "캐릭터 변경", badge: null,  badgeKind: null,      lockedForFree: true },
      { id: "profile",   icon: "👤", label: "내 정보",     badge: null,  badgeKind: null,      lockedForFree: false },
      { id: "logout",    icon: "🚪", label: "로그아웃",    badge: null,  badgeKind: null,      lockedForFree: false },
    ],
  },
];

// 사이드바 항목 → 라우트 매핑
const SIDEBAR_ROUTES = {
  "daily-quiz": "/daily-quiz",
  "daily-reading": "/daily-reading",
  "duel": "/duel",
  "ranking": "/ranking",
  "farm-mode": "/farm-mode",
  "pro-mode": "/pro-mode",
  "recommend": "/my/tutor",
  "study-plan": "/study-plan",
  "wisdom": "/writing",
  "diagnostic": "/diagnostic/v2",
  "test-report": "/tests?tab=history",
  "unified": "/report",
  "community": "/community",
  "shop": "/shop",
  "tests": "/tests",
  "ai-study": "/my/ai-study",
  "harvest-ledger": "/harvest-ledger",
  "seed-log": "/seed-log",
  "wallet": "/my/grapefruit",
  "persona": "/tutor/persona-select",
  "profile": "/profile",
};

// ─── 컴포넌트 ───────────────────────────────────────────────────────

function ClaySpan({ color = "", label = "", className = "", style }) {
  return (
    <span className={`clay clay-${color} ${className}`} aria-hidden="true" style={style}>
      <span className="lbl" dangerouslySetInnerHTML={{ __html: label }} />
    </span>
  );
}

function StudentHomePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, isPremium, logout } = useAuth();
  const [searchParams] = useSearchParams();

  // ?free=1 강제 무료 모드 (검증용 — 추후 제거 가능)
  const forceFree = searchParams.get("free") === "1";
  const free = !isPremium || forceFree;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCraftModal, setShowCraftModal] = useState(false);
  const [showStudyModeSheet, setShowStudyModeSheet] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState("daily-quiz");
  const [activeTab, setActiveTab] = useState("home");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [tutorStatus, setTutorStatus] = useState({ dailyFreeRemaining: null, dailyFreeLimit: null });
  const [plan, setPlan] = useState(FALLBACK_PLAN);
  const [toast, setToast] = useState({ show: false, msg: "", subscribed: false });
  const chatHistoryRef = useRef(null);
  const toastTimerRef = useRef(null);

  // ─── 실제 API 데이터 state ─────────────────────────────────
  const [student, setStudent] = useState(DEFAULT_STUDENT);
  const [tutor, setTutor] = useState(DEFAULT_TUTOR);
  const [wallet, setWallet] = useState(WALLET_META.map((w) => ({ ...w, count: 0 })));
  const [ranking, setRanking] = useState(FALLBACK_RANKING);

  // 1) 학생 프로필 — /v1/auth/me
  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet("/v1/auth/me")
      .then((data) => {
        const lid = data?.level_id || data?.levelId;
        setStudent((prev) => ({
          ...prev,
          name: data?.name || prev.name,
          level: LEVEL_LABEL_MAP[lid] || lid || prev.level,
        }));
      })
      .catch((e) => console.error("[auth/me]", e));
  }, [isLoggedIn]);

  // 2) 페르소나 — /v1/tutor/persona
  useEffect(() => {
    if (!isLoggedIn || free) return;
    apiGet("/v1/tutor/persona")
      .then((data) => {
        const persona = data?.persona;
        if (persona && PERSONA_MAP[persona]) {
          setTutor({ persona, ...PERSONA_MAP[persona] });
        } else {
          setTutor(DEFAULT_TUTOR);
        }
      })
      .catch((e) => console.error("[tutor/persona]", e));
  }, [isLoggedIn, free]);

  // 3) 작물 잔액 — /v1/inventory
  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet("/v1/inventory")
      .then((d) => {
        const inv = normalizeInventoryKeys(d) || {};
        // grapefruit
        const gp = inv.grapefruit ?? inv.grapefruits ?? d?.grapefruit ?? d?.grapefruits ?? 0;
        // crops — 배열 또는 객체 형태
        const rawCrops = inv.crops || d?.crops || {};
        const cropsObj = Array.isArray(rawCrops)
          ? rawCrops.reduce((acc, e) => {
              const k = e.type || e.itemType || e.crop;
              if (k) acc[k] = e.count || 0;
              return acc;
            }, {})
          : rawCrops;
        setWallet(WALLET_META.map((w) => ({
          ...w,
          count: w.key === "grapefruit" ? Number(gp) || 0 : Number(cropsObj?.[w.key] ?? 0),
        })));
        setStudent((prev) => ({ ...prev, grapefruit: Number(gp) || 0 }));
      })
      .catch((e) => console.error("[inventory]", e));
  }, [isLoggedIn]);

  // 4) 학습 계획표 미수행 셀 — /v1/study-plans + 각 plan 의 matrix
  useEffect(() => {
    if (!isLoggedIn || free) return;
    apiGet("/v1/study-plans")
      .then(async (data) => {
        const plans = Array.isArray(data) ? data : [];
        if (plans.length === 0) {
          setPlan([]);
          return;
        }
        // 가장 최근 plan 의 cells 만 가져와 보여줌 (간단화 — 풀 통합은 다음 단계)
        const tasks = [];
        for (const p of plans.slice(0, 1)) {
          try {
            const matrix = await apiGet(`/v1/study-plans/${p.planId || p.id}/matrix`);
            const cells = Array.isArray(matrix?.cells) ? matrix.cells : [];
            cells.forEach((c, idx) => {
              const isPending =
                c.status === "pending" ||
                c.status === "partial" ||
                c.status === "retry" ||
                c.status === "in_progress";
              if (!isPending && c.status !== "completed") return;
              tasks.push({
                id: c.id || `c-${idx}`,
                title: c.assignedLabel || c.title || c.cellRefId || "학습",
                meta: c.scopeName || c.assetType || "",
                due: c.dueAt ? "오늘" : null,
                dueSoft: false,
                done: c.status === "completed",
                // 라우팅 정보 — plan_row 클릭 시 사용
                refId: c.cellRefId || c.refId,
                assetType: c.assetType,
                assetKind: c.assetKind,
                status: c.status,
                wisdomPostId: c.wisdomPostId || c.wisdom_post_id,
                cellAction: c.cellAction,
              });
            });
          } catch (err) {
            console.error("[matrix]", err);
          }
        }
        setPlan(tasks.length > 0 ? tasks.slice(0, 8) : FALLBACK_PLAN);
      })
      .catch((e) => console.error("[study-plans]", e));
  }, [isLoggedIn, free]);

  // 5) 시즌 랭킹 + 시즌 점수 — /v1/seasons/current → harvest-rankings
  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet("/v1/seasons/current")
      .then((season) => {
        const sid = season?.id || season?.seasonId;
        if (!sid) return;
        return apiGet(`/v1/seasons/${sid}/harvest-rankings`).then((r) => {
          const items = r?.items || r || [];
          const myUid = user?.id || user?.userId;
          const myRow = items.find((x) => x.userId === myUid);
          const top3 = items.slice(0, 3).map((x, i) => ({
            id: String(i + 1),
            pos: ["🥇", "🥈", "🥉"][i] || `${i + 1}`,
            color: ["purple", "blue", "orange"][i] || "cream",
            name: x.userName || x.name || "—",
            score: `${(x.value ?? x.totalCrops ?? x.score ?? 0).toLocaleString()}점`,
            me: x.userId === myUid,
          }));
          setRanking(top3.length > 0 ? top3 : FALLBACK_RANKING);
          if (myRow) {
            const myPos = items.findIndex((x) => x.userId === myUid) + 1;
            setStudent((prev) => ({
              ...prev,
              score: Number(myRow.value ?? myRow.totalCrops ?? myRow.score ?? prev.score),
              rankPos: myPos || prev.rankPos,
              rankTotal: items.length,
            }));
          } else {
            setStudent((prev) => ({ ...prev, rankTotal: items.length }));
          }
        });
      })
      .catch((e) => console.error("[seasons]", e));
  }, [isLoggedIn, user]);

  // 6) AI 튜터 — 가장 최근 활성 세션 + 메시지 이력 로드 (유료만)
  useEffect(() => {
    if (!isLoggedIn || free) return;
    apiGet("/v1/tutor/sessions")
      .then(async (data) => {
        const sessions = Array.isArray(data) ? data : [];
        if (sessions.length === 0) {
          // 세션 없음 — 페르소나 기반 첫 인사만 노출 (아래 인사 useEffect 가 처리)
          setSessionId(null);
          return;
        }
        const latest = sessions[0]; // 백엔드가 updatedAt desc 로 정렬
        setSessionId(latest.id);
        const msgs = await apiGet(`/v1/tutor/sessions/${latest.id}/messages`).catch(() => []);
        const list = Array.isArray(msgs) ? msgs : [];
        if (list.length === 0) return;
        setMessages(
          list
            .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
            .map((m, i) => ({
              id: m.id || `h-${i}`,
              role: m.role === "user" ? "user" : "tutor",
              content: <ChatMarkdown text={m.content} />,
            })),
        );
      })
      .catch((e) => console.error("[tutor/sessions]", e));
  }, [isLoggedIn, free]);

  // 7) 페르소나 기반 첫 인사 (세션 없거나 빈 메시지일 때만)
  useEffect(() => {
    if (free) return;
    if (messages.length > 0) return; // 이미 이력 있음
    if (!student.name || student.name === DEFAULT_STUDENT.name) return;
    const dispName = student.name.replace(/이$/, "");
    const greetFn = (tutor.persona && PERSONA_GREETING[tutor.persona]) || PERSONA_GREETING.null;
    const greetText = typeof greetFn === "function" ? greetFn(dispName) : "안녕하세요. 먼저 캐릭터를 골라주세요.";
    setMessages([
      {
        id: "greet-1",
        role: "tutor",
        kind: "first-greet",
        content: <p>{greetText}</p>,
        showRecommendations: tutor.persona !== null && tutor.persona !== undefined,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.name, tutor.persona, free]);

  // 8) 튜터 status — 일일 무료 잔여
  useEffect(() => {
    if (!isLoggedIn || free) return;
    apiGet("/v1/tutor/status")
      .then((d) => {
        if (!d) return;
        setTutorStatus({
          dailyFreeRemaining: d.dailyFreeRemaining ?? null,
          dailyFreeLimit: d.dailyFreeLimit ?? null,
        });
      })
      .catch((e) => console.error("[tutor/status]", e));
  }, [isLoggedIn, free, messages.length]);

  // 채팅 자동 스크롤 — 메시지 변경 시
  useEffect(() => {
    if (free) return;
    const el = chatHistoryRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, free]);

  // ESC → 모바일 drawer 닫기
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && drawerOpen) setDrawerOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [drawerOpen]);

  // toast cleanup
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  function showToast(featureName, opts = {}) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (opts.subscribed) {
      setToast({ show: true, msg: featureName, subscribed: true });
    } else {
      const msg = (featureName ? `«${featureName}» — ` : "") + "구독하면 사용할 수 있어요!";
      setToast({ show: true, msg, subscribed: false });
    }
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 2400);
  }

  function handleSubscribe() {
    navigate("/subscription");
  }

  function handleSidebarClick(item) {
    if (free && item.lockedForFree) {
      showToast(item.label);
      return;
    }
    if (item.id === "logout") {
      logout();
      return;
    }
    if (item.id === "seed-craft") {
      setShowCraftModal(true);
      if (window.matchMedia && window.matchMedia("(max-width: 767px)").matches) {
        setDrawerOpen(false);
      }
      return;
    }
    setActiveSidebar(item.id);
    if (window.matchMedia && window.matchMedia("(max-width: 767px)").matches) {
      setDrawerOpen(false);
    }
    const route = SIDEBAR_ROUTES[item.id];
    if (route) navigate(route);
  }

  function handleTabClick(t) {
    if (free && FREE_LOCKED_TABS.has(t.id)) {
      showToast(t.label);
      return;
    }
    setActiveTab(t.id);
    // 더보기 = 사이드바 열기 (커뮤니티/쇼핑몰/설정 등 접근)
    if (t.id === "more") {
      setDrawerOpen(true);
      return;
    }
    // 학습 탭 — 프로 모드 / 농장별 모드 선택 시트
    if (t.id === "study") {
      setShowStudyModeSheet(true);
      return;
    }
    const tabRoutes = {
      "writing": "/writing",
      "analysis": "/report",
    };
    const route = tabRoutes[t.id];
    if (route) navigate(route);
  }

  function handlePlanToggle(id) {
    // 완료 체크는 학생이 누르는 동작이 아니라 학습 페이지로 이동시키는 동작.
    // (체크는 학습 결과 제출 시 자동 처리됨)
    const cell = plan.find((p) => p.id === id);
    if (!cell) return;
    if (cell.done) {
      // 이미 완료된 항목은 다시 풀어볼 수 있게 학습 페이지로
    }
    const aType = cell.assetType;
    const aKind = cell.assetKind;
    const refId = cell.refId;
    if (aType === "korfarm" && refId) {
      navigate(`/learning/${refId}`);
      return;
    }
    if (aKind === "test" && refId) {
      navigate(`/tests/${refId}/omr`);
      return;
    }
    if (aType === "writing" || aKind === "write") {
      const wisdomPostId = cell.wisdomPostId;
      if (wisdomPostId) {
        navigate(`/writing/post/${wisdomPostId}`);
        return;
      }
      navigate("/writing");
      return;
    }
    // fallback — 학습 계획표 페이지로
    navigate("/study-plan");
  }

  async function handleSendChat(e) {
    e.preventDefault();
    const v = chatInput.trim();
    if (!v) return;
    setChatInput("");
    const userMsgId = `u-${Date.now()}`;
    const typingId = `t-${Date.now()}`;
    setMessages((prev) => {
      const filtered = prev.filter((m) => !m.typing);
      return [
        ...filtered,
        { id: userMsgId, role: "user", content: <p>{v}</p> },
        { id: typingId, role: "tutor", typing: true },
      ];
    });
    try {
      const res = await apiPost("/v1/tutor/turns", {
        session_id: sessionId,
        message: v,
      });
      const newSid = res?.sessionId || res?.session_id;
      if (newSid && newSid !== sessionId) setSessionId(newSid);
      const reply = res?.assistantText || res?.assistant_text || "(응답 없음)";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { ...m, typing: false, content: <ChatMarkdown text={reply} /> }
            : m,
        ),
      );
      // 무료 잔여 갱신
      apiGet("/v1/tutor/status")
        .then((d) => {
          if (d) setTutorStatus({
            dailyFreeRemaining: d.dailyFreeRemaining ?? null,
            dailyFreeLimit: d.dailyFreeLimit ?? null,
          });
        })
        .catch(() => {});
    } catch (err) {
      console.error("[tutor/turns]", err);
      const errMsg = err?.message || "전송 실패. 다시 시도해 주세요.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { ...m, typing: false, content: <p style={{ color: "var(--accent-deep)" }}>⚠ {errMsg}</p> }
            : m,
        ),
      );
    }
  }

  function handleQuickChip(q) {
    setChatInput(q);
    const inputEl = document.getElementById("student-chat-input");
    if (inputEl) inputEl.focus();
  }

  function handlePersonaSwap() {
    navigate("/tutor/persona-select");
  }

  function handleWalletItemClick(key) {
    console.log("[wallet]", key);
  }

  function handleRecommendationClick(id) {
    console.log("[recommendation]", id);
  }

  return (
    <div className="student-home">
      <div className="app" id="student-app" data-od-id="dashboard" data-drawer={drawerOpen ? "open" : undefined}>
        {/* ─── HEADER ─────────────────────────────── */}
        <header className="top-bar" data-od-id="top-bar">
          <button
            className="hamburger"
            id="open-drawer"
            aria-label="메뉴 열기"
            aria-controls="sidebar"
            onClick={() => setDrawerOpen(true)}
          >
            <span></span>
          </button>
          <Link className="brand" to="/start" aria-label="국어농장 홈">
            <img
              src={import.meta.env.BASE_URL + "korfarm-logo.png"}
              alt="국어농장"
              style={{ height: 36, width: "auto", display: "block" }}
            />
          </Link>
          <div className="hdr-spacer"></div>

          {free && (
            <button
              className="cta-pill"
              aria-label="구독하기 — 모든 기능 풀기"
              onClick={handleSubscribe}
            >
              <span className="spark" aria-hidden="true">＋</span>
              구독하기
            </button>
          )}

          <button className="hdr-user" aria-label={`${student.name} 학생 프로필`} onClick={() => navigate("/profile")}>
            <ClaySpan color="orange" label="학생" />
            <span className="info">
              <span className="name">{student.name}</span>
              <span className="meta"><span className="lvl">{student.level}</span> · {student.score.toLocaleString()}점</span>
            </span>
          </button>

          <div className="hdr-actions">
            <button
              className="icon-btn"
              aria-label={free ? "작물 지갑 — 0개, 구독 후 활성화" : `작물 지갑 — 자몽 ${student.grapefruit}개`}
              onClick={() => free ? showToast("작물 지갑") : navigate("/my/grapefruit")}
            >
              <ClaySpan color={free ? "cream" : "orange"} label={free ? "지갑" : "자몽"} />
              <span className={`icon-count${free ? " zero" : ""}`}>{free ? 0 : student.grapefruit}</span>
              {free && <span className="icon-lock-mini" aria-hidden="true">🔒</span>}
            </button>
            <NoticeBell />
            <button className="icon-btn" aria-label="설정" onClick={() => navigate("/profile")}>
              <ClaySpan color="green" label="설정" />
            </button>
          </div>
        </header>

        {/* ─── BODY ─────────────────────────────── */}
        <div className="body" data-od-id="body">
          <button
            className="scrim"
            id="close-drawer"
            aria-label="메뉴 닫기"
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
          ></button>

          {/* ─── SIDEBAR ─── */}
          <aside className="sidebar" id="sidebar" data-od-id="sidebar" aria-label="주요 메뉴">
            {SIDEBAR_GROUPS.map((group) => (
              <div className="sb-group" key={group.id}>
                <div className="sb-title">
                  <ClaySpan color={group.titleClay.color} label={group.titleClay.label} />
                  <span className="sb-title-text">{group.title}</span>
                </div>
                {group.items.map((item) => {
                  const locked = free && item.lockedForFree;
                  const isActive = !locked && activeSidebar === item.id;
                  return (
                    <a
                      key={item.id}
                      className={`sb-item${isActive ? " active" : ""}${locked ? " locked" : ""}`}
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleSidebarClick(item); }}
                    >
                      <span className="icon">{item.icon}</span>
                      <span>{item.label}</span>
                      {locked ? (
                        <span className="lock-tag">유료</span>
                      ) : (
                        item.badge && (
                          <span className={`badge${item.badgeKind ? ` ${item.badgeKind}` : ""}`}>
                            {item.badge}
                          </span>
                        )
                      )}
                    </a>
                  );
                })}
              </div>
            ))}

            {/* 무료 회원 — 사이드바 하단 업그레이드 카드 */}
            {free && (
              <div className="sb-upgrade" data-od-id="sb-upgrade">
                <div className="icon-row" aria-hidden="true">
                  <ClaySpan color="orange" label="자몽" />
                  <ClaySpan color="blue" label="AI" />
                  <ClaySpan color="purple" label="진단" />
                </div>
                <div className="title">함께 더 배워볼래요?</div>
                <div className="meta">AI 튜터 · 농장별 모드 · 글쓰기 첨삭 · 통합 분석표 모두 사용해요.</div>
                <button className="btn" onClick={handleSubscribe}>＋ 구독하고 풀기</button>
              </div>
            )}
          </aside>

          {/* ─── MAIN CENTER ─── */}
          <main className="center" id="center">
            {free ? (
              <FreeMain
                student={student}
                onCardClick={(c) => navigate(c.route)}
                onLockedClick={(t) => showToast(t)}
                onSubscribe={handleSubscribe}
              />
            ) : (
              <PaidMain
                tutor={tutor}
                student={student}
                messages={messages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                handleSendChat={handleSendChat}
                handleQuickChip={handleQuickChip}
                handlePersonaSwap={handlePersonaSwap}
                handleRecommendationClick={handleRecommendationClick}
                chatHistoryRef={chatHistoryRef}
                navigate={navigate}
                tutorStatus={tutorStatus}
              />
            )}

            {/* 모바일 위젯 스택 */}
            <div className="widgets-stack mobile-widgets" id="mobile-widgets">
              {free ? (
                <>
                  <LockedWidget title="🌾 작물 지갑" subTitle="구독 후 활성화" sub="자몽으로 AI 튜터를 부르고,&#10;학습으로 작물을 모아봐요." onSubscribe={handleSubscribe} />
                  <LockedWidget title="📅 학습 계획표" subTitle="선생님이 학습 계획을 짜드려요" sub="매일 풀 분량을 학년·실력에 맞춰&#10;알맞게 추천해드려요." onSubscribe={handleSubscribe} />
                </>
              ) : (
                <>
                  <WalletWidget wallet={wallet} onItemClick={handleWalletItemClick} />
                  <PlanWidget plan={plan} onToggle={handlePlanToggle} fullMeta />
                </>
              )}
              <RankingWidget ranking={ranking} student={student} free={free} />
            </div>
          </main>

          {/* ─── DESKTOP RIGHT ASIDE ─── */}
          <aside className="right-aside" data-od-id="right-aside" aria-label="요약 위젯">
            {free ? (
              <>
                <LockedWidget title="🌾 작물 지갑" subTitle="구독 후 활성화" sub="자몽으로 AI 튜터를 부르고,&#10;학습으로 작물을 모아봐요." onSubscribe={handleSubscribe} />
                <LockedWidget title="📅 학습 계획표" subTitle="선생님이 학습 계획을 짜드려요" sub="매일 풀 분량을 학년·실력에 맞춰&#10;알맞게 추천해드려요." onSubscribe={handleSubscribe} />
              </>
            ) : (
              <>
                <WalletWidget wallet={wallet} onItemClick={handleWalletItemClick} compact />
                <PlanWidget plan={plan} onToggle={handlePlanToggle} />
              </>
            )}
            <RankingWidget ranking={ranking} student={student} free={free} />
          </aside>
        </div>

        {/* ─── BOTTOM TAB BAR (모바일) ─── */}
        <nav className="tab-bar" data-od-id="tab-bar" role="tablist" aria-label="주요 탭">
          {TABS.map((t) => {
            const locked = free && FREE_LOCKED_TABS.has(t.id);
            return (
              <a
                key={t.id}
                className={`tab${locked ? " locked" : ""}`}
                href="#"
                role="tab"
                aria-current={!locked && activeTab === t.id ? "page" : undefined}
                aria-label={locked ? `${t.label} — 유료 기능` : t.label}
                onClick={(e) => { e.preventDefault(); handleTabClick(t); }}
              >
                <span className={`clay clay-${t.color}`} aria-hidden="true">
                  <span className="lbl">{t.short || t.label}</span>
                  {locked && <span className="tab-lock" aria-hidden="true">🔒</span>}
                </span>
                <span className="tab-label">{t.label}</span>
              </a>
            );
          })}
        </nav>

        {/* ─── 학습 모드 선택 시트 (모바일 학습 탭) ─── */}
        {showStudyModeSheet && (
          <>
            <button
              type="button"
              className="study-mode-backdrop"
              aria-label="모드 선택 닫기"
              onClick={() => setShowStudyModeSheet(false)}
            />
            <div className="study-mode-sheet" role="dialog" aria-label="학습 모드 선택">
              <div className="study-mode-head">
                <h3>학습 모드 선택</h3>
                <button
                  type="button"
                  className="study-mode-close"
                  aria-label="닫기"
                  onClick={() => setShowStudyModeSheet(false)}
                >✕</button>
              </div>
              <div className="study-mode-list">
                <button
                  type="button"
                  className="study-mode-item"
                  onClick={() => { setShowStudyModeSheet(false); navigate("/farm-mode"); }}
                >
                  <ClaySpan color="green" label="농장" />
                  <span className="study-mode-text">
                    <span className="study-mode-title">농장별 모드</span>
                    <span className="study-mode-desc">레벨별 5영역 단계학습</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="study-mode-item"
                  onClick={() => { setShowStudyModeSheet(false); navigate("/pro-mode"); }}
                >
                  <ClaySpan color="purple" label="프로" />
                  <span className="study-mode-text">
                    <span className="study-mode-title">프로 모드</span>
                    <span className="study-mode-desc">고난이도 정독·추론</span>
                  </span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ─── TOAST (무료 회원 잠긴 항목 클릭 시) ─── */}
        {free && (
          <div className={`toast${toast.show ? " show" : ""}`} role="status" aria-live="polite">
            <span className="ico" aria-hidden="true">🔒</span>
            <span className="msg">{toast.msg}</span>
            {!toast.subscribed && (
              <span className="cta-link" onClick={handleSubscribe}>구독하기</span>
            )}
          </div>
        )}
      </div>

      <HarvestCraftModal
        open={showCraftModal}
        onClose={() => setShowCraftModal(false)}
        onCrafted={() => {
          setShowCraftModal(false);
          // 작물 잔액 갱신
          apiGet("/v1/inventory")
            .then((d) => {
              if (!d) return;
              const inv = normalizeInventoryKeys(d);
              setWallet(WALLET_META.map((w) => ({
                ...w,
                count: Number(inv?.[w.key] ?? 0),
              })));
            })
            .catch(() => {});
        }}
      />
    </div>
  );
}

// ─── 메인 영역 — 유료 회원 (AI 튜터 채팅) ──────────────────────────

function PaidMain({
  tutor, student, messages, chatInput, setChatInput, handleSendChat, handleQuickChip,
  handlePersonaSwap, handleRecommendationClick, chatHistoryRef, navigate, tutorStatus,
}) {
  return (
    <>
      {/* 모바일에서만 보이는 무료 기능 가로 스크롤 */}
      <div className="mobile-features-head">
        <h2>🌟 무료 기능</h2>
        <a className="more" href="#" aria-label="무료 기능 전체 보기" onClick={(e) => e.preventDefault()}>전체</a>
      </div>
      <div className="mobile-features" role="list">
        <button className="feature-card tint-yellow" role="listitem" aria-label="일일 퀴즈 시작하기" onClick={() => navigate("/daily-quiz")}>
          <ClaySpan color="yellow" label="퀴즈" />
          <span className="feature-name">일일 퀴즈<br />10문제</span>
          <span className="feature-tag">⏱ 5분 · 매일 갱신</span>
        </button>
        <button className="feature-card tint-blue" role="listitem" aria-label="일일 독해 시작하기" onClick={() => navigate("/daily-reading")}>
          <ClaySpan color="blue" label="독해" />
          <span className="feature-name">일일 독해<br />정독 훈련</span>
          <span className="feature-tag">📖 약 10분 · 미수행</span>
        </button>
        <button className="feature-card tint-red" role="listitem" aria-label="대결 라이브" onClick={() => navigate("/duel")}>
          <ClaySpan color="red" label="대결" />
          <span className="feature-name">대결 라이브<br />서바이벌</span>
          <span className="feature-tag"><span className="live-dot" aria-hidden="true"></span> LIVE</span>
        </button>
        <button className="feature-card tint-green" role="listitem" aria-label="시즌 랭킹 보기" onClick={() => navigate("/ranking")}>
          <ClaySpan color="green" label="랭킹" />
          <span className="feature-name">시즌 랭킹<br />전국</span>
          <span className="feature-tag">🌾 {student.rankPos}위 / {student.rankTotal.toLocaleString()}명</span>
        </button>
      </div>

      {/* AI 튜터 채팅 영역 */}
      <section className="chat-shell" data-od-id="chat-shell" aria-label="AI 선생님 대화">
        <div className="chat-meta">
          <ClaySpan color="cream" label={`${tutor.emoji}<br>${tutor.initial}`} />
          <div className="info">
            <div className="title">
              {tutor.name}
              <span className="ai-tag">AI 선생님</span>
            </div>
            <div className="switch">
              {tutor.persona
                ? <>캐릭터 변경 가능 — <strong>{tutor.name}</strong> · <span>다른 선생님</span></>
                : <>아직 선생님을 고르지 않았어요</>
              }
              <button className="swap" type="button" onClick={handlePersonaSwap}>{tutor.persona ? "바꾸기 ›" : "고르기 ›"}</button>
            </div>
          </div>
          <button className="menu-btn" aria-label="대화 메뉴"></button>
        </div>

        <div className="chat-history" id="chat-history" data-od-id="chat-history" ref={chatHistoryRef}>
          <div className="day-label">오늘 · 오후 4:12</div>
          {messages.map((m) => (
            <div key={m.id} className={`msg msg-${m.role}`}>
              {m.role === "tutor" && (
                <div className="clay clay-cream msg-avatar" aria-hidden="true">
                  <span className="lbl">{tutor.emoji}</span>
                </div>
              )}
              <div className="msg-stack">
                {m.role === "tutor" && <span className="msg-name">{tutor.name}</span>}
                {m.typing ? (
                  <div className="bubble typing" aria-label={`${tutor.name}이 답변을 작성 중`}>
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                ) : (
                  <div className={`bubble${m.kind ? ` ${m.kind}` : ""}`}>
                    {m.content}
                    {m.showRecommendations && (
                      <div className="reco-stack" role="list">
                        {FALLBACK_RECOMMENDATIONS.map((r) => (
                          <button
                            key={r.id}
                            className="reco-card"
                            role="listitem"
                            onClick={() => handleRecommendationClick(r.id)}
                          >
                            <ClaySpan color={r.color} label={r.label} />
                            <span className="reco-text">
                              <span className="reco-title">
                                {r.title}
                                {r.flag && <span className="reco-flag">{r.flag}</span>}
                              </span>
                              <span className="reco-meta">{r.meta}</span>
                            </span>
                            <span className="chev" aria-hidden="true">›</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input">
          {tutorStatus?.dailyFreeRemaining !== null && tutorStatus?.dailyFreeRemaining !== undefined && (
            <div style={{ fontSize: 11.5, color: "var(--muted)", padding: "4px 14px 6px", textAlign: "center" }}>
              {tutorStatus.dailyFreeRemaining > 0
                ? `오늘 무료 채팅 ${tutorStatus.dailyFreeRemaining}/${tutorStatus.dailyFreeLimit ?? 5}회 남음`
                : "무료 채팅 소진 — 자몽 1개 차감 후 사용"}
            </div>
          )}
          <form className="input-bar" id="chat-form" autoComplete="off" onSubmit={handleSendChat}>
            <button type="button" className="attach-btn" aria-label="사진 찍어서 모르는 문제 물어보기">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 8.5a2 2 0 0 1 2-2h2.2l1.2-1.6a1.5 1.5 0 0 1 1.2-.6h2.8a1.5 1.5 0 0 1 1.2.6l1.2 1.6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </button>
            <input
              id="student-chat-input"
              type="text"
              placeholder="선생님께 물어보기..."
              inputMode="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="send-btn" aria-label="질문 보내기">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12.5L20 4l-4.2 16-3.4-6.5L4 12.5z" fill="white" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

// ─── 메인 영역 — 무료 회원 (Welcome + 무료 카드 + 잠긴 카드 + 구독 CTA) ──

function FreeMain({ student, onCardClick, onLockedClick, onSubscribe }) {
  return (
    <>
      <section className="greeting-block" data-od-id="greeting" aria-label="인사">
        <div className="greeting-art" role="img" aria-label="새싹과 농장 일러스트 — 아침의 농장">
          <div className="ph">
            <span className="ph-emoji" aria-hidden="true">🌱</span>
            <span className="ph-tag">FARM ART</span>
          </div>
        </div>
        <div className="greeting-text">
          <span className="greeting-eyebrow"><span className="dot" aria-hidden="true"></span>오늘의 농장</span>
          <h1 className="greeting-title">
            <strong>{student.name.replace(/이$/, "")} 학생</strong>, 어서 와요!<br />
            오늘은 무료 학습부터 시작해요.
          </h1>
          <p className="greeting-meta">시즌 점수 <strong>{student.score.toLocaleString()}</strong>점</p>
        </div>
      </section>

      <div className="free-section-head">
        <div>
          <h2>🌟 무료로 시작해요</h2>
          <span className="sub">매일 새 문제가 나와요. 친구와 대결도 가능해요!</span>
        </div>
      </div>
      <div className="free-grid" role="list">
        {FREE_BIG_CARDS.map((c) => (
          <button
            key={c.id}
            className={`big-card tint-${c.tint}`}
            role="listitem"
            aria-label={`${c.title} — ${c.cta}`}
            onClick={() => onCardClick(c)}
          >
            <ClaySpan color={c.color} label={c.label} />
            <span className="body-text">
              <span className="free-tag">{c.tag}</span>
              <h3>{c.title}</h3>
              <span className="meta">
                {c.live && <span className="live-dot" aria-hidden="true"></span>}
                {c.meta}
              </span>
              <span className="cta">{c.cta}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="free-section-head">
        <div>
          <h2>🔒 유료로 사용 가능</h2>
          <span className="sub">함께 더 배워볼래요? 구독하면 모두 풀려요.</span>
        </div>
      </div>
      <div className="locked-grid" role="list">
        {LOCKED_PREVIEW_CARDS.map((c) => (
          <button
            key={c.id}
            className="locked-card"
            role="listitem"
            onClick={() => onLockedClick(c.title)}
          >
            <ClaySpan color={c.color} label={c.label} />
            <span className="lock-overlay" aria-hidden="true"></span>
            <span className="text">
              <h3>{c.title} <span className="pro-tag">PRO</span></h3>
              <span className="tagline">{c.tagline}</span>
              <span className="open-link">구독하고 풀기 →</span>
            </span>
          </button>
        ))}
      </div>

      <button className="sticky-cta" onClick={onSubscribe} aria-label="구독하고 모든 기능 풀기">
        <span className="sticky-cta-text">
          <span className="sticky-cta-title">구독하고 모든 기능 풀기</span>
          <span className="sticky-cta-meta">월 <strong>₩9,900</strong> · 첫 <strong>7일 무료</strong> · 언제든 해지</span>
        </span>
        <span className="sticky-cta-arrow" aria-hidden="true">→</span>
      </button>
    </>
  );
}

// ─── 위젯 컴포넌트 ──────────────────────────────────────────────────

function WalletWidget({ wallet, onItemClick, compact = false }) {
  const total = (wallet || []).reduce((s, w) => s + (Number(w.count) || 0), 0);
  return (
    <section className="widget">
      <div className="widget-head">
        <h3 className="widget-title">🌾 작물 지갑</h3>
        <a className="widget-cta" href="#" onClick={(e) => e.preventDefault()}>{compact ? "상점 ›" : "상점 가기 ›"}</a>
      </div>
      <div className="wallet-grid">
        {(wallet || []).map((w) => (
          <div
            key={w.key}
            className={`wallet-item${w.primary ? " primary" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={w.primary ? `${w.name}, AI 결제 통화, ${w.count}개` : `${w.name} ${w.count}개`}
            onClick={() => onItemClick(w.key)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemClick(w.key); } }}
          >
            <ClaySpan color={w.color} label={w.name} />
            <span className="wallet-name">{w.name}</span>
            <span className="wallet-count">{w.count}</span>
          </div>
        ))}
      </div>
      <div className="wallet-cta-row">
        <span className="wallet-total">합계 <strong>{compact ? `${total}` : `${total} 작물`}</strong></span>
        <button className="btn-charge">＋ 자몽 충전</button>
      </div>
    </section>
  );
}

function PlanWidget({ plan, onToggle, fullMeta = false }) {
  const pendingCount = plan.filter((p) => !p.done).length;
  return (
    <section className="widget">
      <div className="widget-head">
        <h3 className="widget-title">📅 학습 계획표</h3>
        <a className="widget-cta" href="#" onClick={(e) => e.preventDefault()}>열기 ›</a>
      </div>
      <p className="plan-meta-row">
        오늘 미수행 <strong>{pendingCount}건</strong>{fullMeta ? " · 내일까지 끝내요" : ""}
      </p>
      <div className="plan-list">
        {plan.map((p) => (
          <div
            key={p.id}
            className={`plan-row${p.done ? " done" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(p.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(p.id); } }}
          >
            <span className={`plan-check${p.done ? " done" : ""}`} aria-hidden="true"></span>
            <span className="plan-text">
              <span className="plan-title">{p.title}</span>
              <span className="plan-meta">{p.meta}</span>
            </span>
            {p.due && <span className={`plan-due${p.dueSoft ? " soft" : ""}`}>{p.due}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function LockedWidget({ title, subTitle, sub, onSubscribe }) {
  return (
    <section className="widget locked">
      <div className="widget-head">
        <h3 className="widget-title">{title}</h3>
      </div>
      <div className="widget-locked-shell">
        <div className="lock-art" aria-hidden="true"></div>
        <div className="title">{subTitle}</div>
        <div className="sub" style={{ whiteSpace: "pre-line" }}>{sub}</div>
        <button className="link" onClick={onSubscribe} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>구독하고 풀기 →</button>
      </div>
    </section>
  );
}

function RankingWidget({ ranking, student, free = false }) {
  // 1위 점수 - 내 점수 = 남은 점수
  const top1Score = ranking?.[0] ? Number(String(ranking[0].score).replace(/[^0-9]/g, "")) : 0;
  const myScore = Number(student?.score) || 0;
  const gap = Math.max(0, top1Score - myScore);
  return (
    <section className="widget">
      <div className="widget-head">
        <h3 className="widget-title">🏆 시즌 랭킹</h3>
        <a className="widget-cta" href="#" onClick={(e) => e.preventDefault()}>전체 ›</a>
      </div>
      <div className="rank-list">
        {(ranking || []).map((r) => (
          <div key={r.id} className={`rank-row${r.me ? " me" : ""}`}>
            <span className="rank-pos gold" aria-label={`${r.id}위`}>{r.pos}</span>
            <span className={`clay clay-${r.color} rank-avatar`} aria-hidden="true">
              <span className="lbl">{r.me ? "나" : `${r.id}위`}</span>
            </span>
            <span className="rank-name">{r.name}</span>
            <span className="rank-score">{r.score}</span>
          </div>
        ))}
      </div>
      <p className="rank-foot">
        {gap > 0
          ? <>1위까지 <strong>{gap.toLocaleString()}점</strong> 남았어요. 오늘도 화이팅!</>
          : free
            ? <>무료 회원도 시즌 랭킹에 참여할 수 있어요!</>
            : <>지금 페이스 좋아요. 계속 달려봐요!</>
        }
      </p>
    </section>
  );
}

export default StudentHomePage;
