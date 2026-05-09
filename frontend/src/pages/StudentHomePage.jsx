import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost, normalizeInventoryKeys } from "../utils/api";
import { FORMULA_TEXT } from "../utils/seasonScore";
import NoticeBell from "../components/NoticeBell";
import HarvestCraftModal from "../components/HarvestCraftModal";
import "../styles/student-home.css";
import "../styles/start.css";

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

// 인벤토리 팝업용 — 씨앗 5종 + 작물 5종 (시즌 점수 클릭 시 노출)
const INVENTORY_ITEMS = [
  { seedKey: "seed_wheat", cropKey: "crop_wheat", emoji: "🌾", label: "밀" },
  { seedKey: "seed_rice",  cropKey: "crop_rice",  emoji: "🍚", label: "쌀" },
  { seedKey: "seed_corn",  cropKey: "crop_corn",  emoji: "🌽", label: "옥수수" },
  { seedKey: "seed_grape", cropKey: "crop_grape", emoji: "🍇", label: "포도" },
  { seedKey: "seed_apple", cropKey: "crop_apple", emoji: "🍎", label: "사과" },
];

// 작물 6종 메타 (이름·색상 표시용 — count 는 apiGet 으로 채움)
const WALLET_META = [
  { key: "grapefruit", color: "orange", name: "자몽", primary: true },
  { key: "crop_wheat", color: "cream",  name: "밀" },
  { key: "crop_rice",  color: "yellow", name: "쌀" },
  { key: "crop_corn",  color: "yellow", name: "옥수수" },
  { key: "crop_grape", color: "purple", name: "포도" },
  { key: "crop_apple", color: "red",    name: "사과" },
];

// 채팅 헤더 day-label — 오늘 / 어제 / 날짜 + 현재 시각
function formatTodayLabel() {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return `오늘 · ${ampm} ${h12}:${mm}`;
}

// 첫 인사 추천 카드 — 학생이 어디부터 시작할지 안내 (실 라우팅)
const FALLBACK_RECOMMENDATIONS = [
  { id: "daily-quiz",    color: "yellow", label: "퀴즈",  title: "오늘의 일일 퀴즈",  meta: "10문제 · 5분",    flag: null },
  { id: "daily-reading", color: "blue",   label: "독해",  title: "오늘의 일일 독해",  meta: "정독 훈련 · 약 10분", flag: null },
  { id: "duel",          color: "red",    label: "대결",  title: "대결 라이브",       meta: "친구·AI와 라운드제", flag: "LIVE" },
  { id: "diagnostic",    color: "green",  label: "진단",  title: "역량 진단 테스트",   meta: "10대 역량 분석",    flag: null },
];

// 페르소나별 첫 인사 톤 — useEffect 안에서 학생 이름과 결합해 동적 생성
const PERSONA_GREETING = {
  owl: (name) => `${name} 학생, 어서 오세요. 오늘은 무엇을 함께 살펴볼까요?`,
  amis: (name) => `${name}야! 어서 와! 오늘 뭐 도와줄까?`,
  nurungji: (name) => `${name}아~ 안녕! 오늘은 누나가 도와줄게~ 😊`,
  null: () => "안녕하세요. 먼저 캐릭터를 골라주세요. 우측 상단에서 변경할 수 있어요.",
};

// 학습 계획표 fallback — 라우팅 정보 없는 가짜 카드 노출 X (빈 배열)
const FALLBACK_PLAN = [];

// 시즌 랭킹 fallback
const FALLBACK_RANKING = [
  { id: "1", pos: "🥇", color: "purple", name: "—", score: "—", me: false },
  { id: "2", pos: "🥈", color: "blue",   name: "—", score: "—", me: false },
  { id: "3", pos: "🥉", color: "orange", name: "—", score: "—", me: false },
];

// 무료 회원용 큰 카드 (4장)
const FREE_BIG_CARDS = [
  { id: "daily-quiz",    tint: "yellow", color: "yellow", label: "퀴즈<br/>일러스트",  image: "images/student-home/free-card-daily-quiz.png",    tag: "무료 · 매일", title: "일일 퀴즈",    meta: "10문제 · 약 5분 · 매일 갱신",   cta: "지금 풀기",    route: "/daily-quiz" },
  { id: "daily-reading", tint: "blue",   color: "blue",   label: "독해<br/>일러스트",  image: "images/student-home/free-card-daily-reading.png", tag: "무료 · 매일", title: "일일 독해",    meta: "다양한 영역 정독 훈련 · 약 10분", cta: "지금 읽기",    route: "/daily-reading" },
  { id: "diagnostic",    tint: "green",  color: "green",  label: "진단<br/>일러스트",  image: "images/student-home/free-card-diagnostic.png",    tag: "1회 무료",    title: "진단 테스트",  meta: "10대 역량 분석 · 약 50분 · 학부모님께도 결과", cta: "응시하기", route: "/diagnostic/v2" },
  { id: "battle",        tint: "red",    color: "red",    label: "대결<br/>일러스트",  image: "images/student-home/free-card-duel.png",          tag: "무료 · LIVE", title: "대결 라이브",  meta: "라운드제 서바이벌 · 친구·AI 대결", live: true, cta: "도전하기", route: "/duel" },
];

// 무료 회원용 잠긴 카드 (4장)
const LOCKED_PREVIEW_CARDS = [
  { id: "ai-tutor",     color: "cream",  label: "AI<br/>튜터",      image: "images/student-home/locked-ai-tutor.png",     title: "AI 튜터",                  tagline: "1:1 학습 코치 · 어휘·문법 즉답, 사진으로도 물어볼 수 있어요" },
  { id: "study-modes",  color: "green",  label: "12레벨<br/>심화",  image: "images/student-home/locked-study-modes.png",  title: "농장별 모드 + 프로 모드",  tagline: "교재와 연동한 12레벨 심화 학습 · 문학·비문학·어휘 단계별 마스터" },
  { id: "writing",      color: "blue",   label: "글쓰기<br/>첨삭",  image: "images/student-home/locked-writing.png",      title: "글쓰기 첨삭",              tagline: "AI가 글을 다듬어줘요 · 어휘 추천, 문장 흐름까지 친절하게" },
  { id: "analytics",    color: "purple", label: "분석<br/>리포트",  image: "images/student-home/locked-analytics.png",    title: "통합 분석표",              tagline: "모든 학습 데이터 한눈에 · 강·약점, 학부모 리포트까지" },
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
      { id: "study-plan", icon: "📅", label: "학습 계획표",  badge: null, badgeKind: "soft", lockedForFree: true },
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

function ClaySpan({ color = "", label = "", className = "", style, image, alt = "" }) {
  if (image) {
    return (
      <span className={`clay clay-${color} clay-img ${className}`} style={style} aria-hidden={alt ? undefined : "true"}>
        <img src={import.meta.env.BASE_URL + image} alt={alt} />
      </span>
    );
  }
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

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("HQ_ADMIN") || userRoles.includes("ORG_ADMIN");
  const [adminLevelOverride, setAdminLevelOverride] = useState("");
  const [adminDayOverride, setAdminDayOverride] = useState("");

  // ?free=1 강제 무료 모드 (검증용 — 추후 제거 가능)
  const forceFree = searchParams.get("free") === "1";
  const free = !isPremium || forceFree;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCraftModal, setShowCraftModal] = useState(false);
  const [showStudyModeSheet, setShowStudyModeSheet] = useState(false);
  const [showInventoryPopup, setShowInventoryPopup] = useState(false);
  const [rawInventory, setRawInventory] = useState(null);
  // 유료 회원 메인 모드 — "dashboard" (기본, 학습 계획표 + 카드) / "tutor" (AI 채팅 풀 영역)
  const [mainMode, setMainMode] = useState("dashboard");
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
        const img = data?.profile_image_url || data?.profileImageUrl || "";
        setStudent((prev) => ({
          ...prev,
          name: data?.name || prev.name,
          level: LEVEL_LABEL_MAP[lid] || lid || prev.level,
          profileImageUrl: img,
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
        setRawInventory(inv);
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

  // 관리자 레벨/일차 override — 학생 모드 검수 시 후속 페이지에 query 로 전달
  function navWithAdminOverride(path) {
    if (!isAdmin) {
      navigate(path);
      return;
    }
    const params = [];
    if (adminLevelOverride && LEVEL_LABEL_MAP[adminLevelOverride]) {
      params.push(`level=${adminLevelOverride}`);
    }
    const dayNum = parseInt(adminDayOverride, 10);
    if (Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= 365) {
      params.push(`day=${dayNum}`);
    }
    if (params.length === 0) {
      navigate(path);
      return;
    }
    const sep = path.includes("?") ? "&" : "?";
    navigate(`${path}${sep}${params.join("&")}`);
  }

  // 인벤토리 팝업용 — seeds/crops 정규화 + 비료 카운트
  const inventorySummary = (() => {
    const inv = rawInventory || {};
    const rawSeeds = inv.seeds || {};
    const rawCrops = inv.crops || {};
    const seedsObj = Array.isArray(rawSeeds)
      ? rawSeeds.reduce((acc, e) => { const k = e.type || e.itemType || e.seed; if (k) acc[k] = e.count || 0; return acc; }, {})
      : rawSeeds;
    const cropsObj = Array.isArray(rawCrops)
      ? rawCrops.reduce((acc, e) => { const k = e.type || e.itemType || e.crop; if (k) acc[k] = e.count || 0; return acc; }, {})
      : rawCrops;
    return {
      seedsObj,
      cropsObj,
      fertilizer: Number(inv.fertilizer ?? 0),
    };
  })();

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
    if (route) {
      // 학습 모드 / 일일 콘텐츠는 관리자 override 적용
      const needsOverride = ["daily-quiz", "daily-reading", "farm-mode", "pro-mode"].includes(item.id);
      if (needsOverride) navWithAdminOverride(route);
      else navigate(route);
    }
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

  function handlePersonaSwap() {
    navigate("/tutor/persona-select");
  }

  function handleWalletItemClick(key) {
    // 자몽 → 자몽 지갑 / 작물 → 수확 장부
    if (key === "grapefruit") {
      navigate("/my/grapefruit");
    } else {
      navigate("/harvest-ledger");
    }
  }

  function handleRecommendationClick(id) {
    // 추천 카드 클릭 — id 는 contentId(content_xxx) 또는 라우트 키
    if (typeof id === "string" && id.startsWith("content_")) {
      navigate(`/learning/${id}`);
      return;
    }
    if (id === "daily-quiz") navigate("/daily-quiz");
    else if (id === "daily-reading") navigate("/daily-reading");
    else if (id === "duel") navigate("/duel");
    else if (id === "diagnostic") navigate("/diagnostic/v2");
    else navigate("/farm-mode");
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
            {student.profileImageUrl ? (
              <span
                className="hdr-user-avatar"
                style={{
                  display: "inline-block",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundImage: `url(${student.profileImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  flex: "0 0 auto",
                  border: "2px solid #fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
                aria-hidden="true"
              />
            ) : (
              <ClaySpan color="orange" label="학생" />
            )}
            <span className="info">
              <span className="name">{student.name}</span>
              <span className="meta">
                <span className="lvl">{student.level}</span>
                {" · "}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="시즌 점수 자세히 보기"
                  onClick={(e) => { e.stopPropagation(); setShowInventoryPopup(true); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setShowInventoryPopup(true); } }}
                  style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  {student.score.toLocaleString()}점
                </span>
              </span>
            </span>
          </button>

          <div className="hdr-actions">
            {isAdmin && (
              <div
                className="admin-override-row"
                aria-label="관리자 — 학생 모드 검수 레벨/일차 override"
                style={{ display: "flex", gap: 6, alignItems: "center", marginRight: 6 }}
              >
                <select
                  value={adminLevelOverride}
                  onChange={(e) => setAdminLevelOverride(e.target.value)}
                  style={{ height: 32, fontSize: 12, padding: "2px 6px", borderRadius: 8, border: "1px solid #d4c8b6" }}
                  title="관리자 레벨 override"
                >
                  <option value="">레벨</option>
                  {Object.entries(LEVEL_LABEL_MAP).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={adminDayOverride}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") { setAdminDayOverride(""); return; }
                    const n = parseInt(v, 10);
                    if (!Number.isFinite(n)) return;
                    setAdminDayOverride(String(Math.max(1, Math.min(365, n))));
                  }}
                  placeholder="일차"
                  style={{ width: 56, height: 32, fontSize: 12, padding: "2px 6px", borderRadius: 8, border: "1px solid #d4c8b6" }}
                  title="관리자 일차 override (1~365)"
                />
              </div>
            )}
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
                  // 학습 계획표 — 미수행 셀 수 동적 배지
                  let dynamicBadge = item.badge;
                  if (item.id === "study-plan") {
                    const pending = plan.filter((p) => !p.done).length;
                    dynamicBadge = pending > 0 ? String(pending) : null;
                  }
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
                        dynamicBadge && (
                          <span className={`badge${item.badgeKind ? ` ${item.badgeKind}` : ""}`}>
                            {dynamicBadge}
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
                onCardClick={(c) => {
                  // 관리자 override 적용 — 일일 콘텐츠 카드는 query 동봉
                  if (["daily-quiz", "daily-reading"].includes(c.id)) navWithAdminOverride(c.route);
                  else navigate(c.route);
                }}
                onLockedClick={(t) => showToast(t)}
                onSubscribe={handleSubscribe}
                onShowInventory={() => setShowInventoryPopup(true)}
              />
            ) : (
              <PaidMain
                mainMode={mainMode}
                setMainMode={setMainMode}
                tutor={tutor}
                student={student}
                plan={plan}
                onPlanCellClick={handlePlanToggle}
                messages={messages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                handleSendChat={handleSendChat}
                handlePersonaSwap={handlePersonaSwap}
                handleRecommendationClick={handleRecommendationClick}
                chatHistoryRef={chatHistoryRef}
                navigate={navigate}
                navWithAdminOverride={navWithAdminOverride}
                tutorStatus={tutorStatus}
                onShowInventory={() => setShowInventoryPopup(true)}
              />
            )}

            {/* 모바일 위젯 스택 */}
            <div className="widgets-stack mobile-widgets" id="mobile-widgets">
              {free ? (
                <>
                  <LockedWidget title="🌾 작물 지갑" subTitle="구독 후 활성화" sub="학습으로 씨앗을 모아&#10;작물로 바꿔요." onSubscribe={handleSubscribe} />
                  <LockedWidget title="📅 학습 계획표" subTitle="선생님이 학습 계획을 짜드려요" sub="과제를 확인하고 오늘의&#10;해야 할 학습을 수행해봐요." onSubscribe={handleSubscribe} />
                </>
              ) : (
                <>
                  <WalletWidget wallet={wallet} onItemClick={handleWalletItemClick} onCharge={() => navigate("/my/grapefruit")} />
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
                <LockedWidget title="🌾 작물 지갑" subTitle="구독 후 활성화" sub="학습으로 씨앗을 모아&#10;작물로 바꿔요." onSubscribe={handleSubscribe} />
                <LockedWidget title="📅 학습 계획표" subTitle="선생님이 학습 계획을 짜드려요" sub="과제를 확인하고 오늘의&#10;해야 할 학습을 수행해봐요." onSubscribe={handleSubscribe} />
              </>
            ) : (
              <>
                <WalletWidget wallet={wallet} onItemClick={handleWalletItemClick} onCharge={() => navigate("/my/grapefruit")} compact />
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
                  onClick={() => { setShowStudyModeSheet(false); navWithAdminOverride("/farm-mode"); }}
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
                  onClick={() => { setShowStudyModeSheet(false); navWithAdminOverride("/pro-mode"); }}
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

        {/* ─── 시즌 점수 인벤토리 팝업 (씨앗·작물·비료·시즌 공식) — portal 로 body 에 마운트 ─── */}
        {showInventoryPopup && createPortal(
          <div className="start-modal-overlay" onClick={() => setShowInventoryPopup(false)} style={{ zIndex: 9600 }}>
            <div className="start-modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>보유 현황</h2>
              <div style={{ display: "grid", gap: 8 }}>
                {INVENTORY_ITEMS.map((item) => (
                  <div key={item.seedKey} className="start-inv-row">
                    <span className="inv-emoji">{item.emoji}</span>
                    <strong>{item.label}</strong>
                    <span>씨앗 {inventorySummary.seedsObj[item.seedKey] ?? 0}</span>
                    <span style={{ color: "#888" }}>·</span>
                    <span>수확물 {inventorySummary.cropsObj[item.cropKey] ?? 0}</span>
                  </div>
                ))}
              </div>
              <div className="start-inv-row" style={{ marginTop: 10 }}>
                <span className="inv-emoji">🧪</span>
                <strong>비료</strong>
                <span>{inventorySummary.fertilizer}개</span>
              </div>
              <div className="start-formula-box">
                <strong>시즌 점수 공식</strong><br />
                {FORMULA_TEXT}
              </div>
              <button type="button" className="start-modal-close" onClick={() => setShowInventoryPopup(false)}>
                닫기
              </button>
            </div>
          </div>,
          document.body
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
  mainMode, setMainMode,
  tutor, student, plan, onPlanCellClick,
  messages, chatInput, setChatInput, handleSendChat,
  handlePersonaSwap, handleRecommendationClick, chatHistoryRef,
  navigate, navWithAdminOverride, tutorStatus, onShowInventory,
}) {
  const navDaily = navWithAdminOverride || navigate;

  // 모드 토글 — 메인 영역 최상단
  const ModeToggle = (
    <div className="paid-mode-toggle" role="tablist" aria-label="메인 모드">
      <button
        type="button"
        role="tab"
        aria-selected={mainMode === "dashboard"}
        className={`paid-mode-btn${mainMode === "dashboard" ? " active" : ""}`}
        onClick={() => setMainMode("dashboard")}
      >
        🏠 대시보드
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mainMode === "tutor"}
        className={`paid-mode-btn${mainMode === "tutor" ? " active" : ""}`}
        onClick={() => setMainMode("tutor")}
      >
        🌱 AI 튜터
      </button>
    </div>
  );

  if (mainMode === "dashboard") {
    return (
      <>
        {ModeToggle}
        <PaidDashboard
          student={student}
          plan={plan}
          onPlanCellClick={onPlanCellClick}
          navigate={navigate}
          navDaily={navDaily}
          onShowInventory={onShowInventory}
        />
      </>
    );
  }

  // mainMode === "tutor" — AI 튜터 채팅 풀 영역
  return (
    <>
      {ModeToggle}
      {/* AI 튜터 채팅 영역 — 풀 메인 사이즈 (별도 박스 X) */}
      <section className="chat-shell chat-shell-fullbleed" data-od-id="chat-shell" aria-label="AI 선생님 대화">
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
          <div className="day-label">{formatTodayLabel()}</div>
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

// ─── 유료 회원 대시보드 — 학습 계획표 상단 + 큰 카드들 ──

function PaidDashboard({ student, plan, onPlanCellClick, navigate, navDaily, onShowInventory }) {
  const pendingCount = (plan || []).filter((p) => !p.done).length;
  const dispName = (student.name || "학생").replace(/이$/, "");
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearchSubmit(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  // 큰 카드 4종 — 무료 회원과 동일하지만 모두 활성
  const PAID_CARDS = [
    { id: "daily-quiz", tint: "yellow", color: "yellow", label: "퀴즈<br/>일러스트", image: "images/student-home/paid-card-daily-quiz.png", tag: "매일", title: "일일 퀴즈", meta: "10문제 · 약 5분", cta: "지금 풀기", route: "/daily-quiz", admin: true },
    { id: "daily-reading", tint: "blue", color: "blue", label: "독해<br/>일러스트", image: "images/student-home/paid-card-daily-reading.png", tag: "매일", title: "일일 독해", meta: "정독 훈련 · 약 10분", cta: "지금 읽기", route: "/daily-reading", admin: true },
    { id: "farm-mode", tint: "green", color: "green", label: "농장별<br/>모드", image: "images/student-home/paid-card-farm-mode.png", tag: "심화", title: "농장별 모드", meta: "교재와 연동한 단계별 학습", cta: "이어가기", route: "/farm-mode", admin: true },
    { id: "pro-mode", tint: "purple", color: "purple", label: "프로<br/>모드", image: "images/student-home/paid-card-pro-mode.png", tag: "고난이도", title: "프로 모드", meta: "지문 정독 + 추론·논리", cta: "도전하기", route: "/pro-mode", admin: true },
  ];

  return (
    <>
      {/* 인사 + 시즌 점수 */}
      <section className="greeting-block" data-od-id="greeting" aria-label="인사">
        <div className="greeting-art">
          <img
            src={import.meta.env.BASE_URL + "images/student-home/student-greeting-farm-morning.png"}
            alt="아침의 작은 농장 일러스트"
          />
        </div>
        <div className="greeting-text">
          <span className="greeting-eyebrow"><span className="dot" aria-hidden="true"></span>오늘의 농장</span>
          <h1 className="greeting-title">
            <strong>{dispName} 학생</strong>, 어서 와요!<br />
            {pendingCount > 0 ? `오늘 미수행 학습 ${pendingCount}건이 있어요.` : "오늘 학습 모두 끝냈어요. 이어서 도전!"}
          </h1>
          <p
            className="greeting-meta"
            role="button"
            tabIndex={0}
            onClick={() => onShowInventory && onShowInventory()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onShowInventory && onShowInventory(); } }}
            style={{ cursor: "pointer" }}
          >
            시즌 점수 <strong>{student.score.toLocaleString()}</strong>점 <span style={{ fontSize: 11, opacity: 0.65 }}>· 자세히 ›</span>
          </p>
        </div>
      </section>

      {/* 국어농장 학습 검색 */}
      <form className="paid-dash-search" onSubmit={handleSearchSubmit} role="search">
        <span className="paid-dash-search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="국어농장 학습 검색 — 지문 제목·작가·키워드"
          aria-label="국어농장 학습 검색"
        />
        <button type="submit" className="paid-dash-search-btn">검색</button>
      </form>

      {/* 학습 계획표 — 대시보드 최상단 */}
      <section className="paid-dash-section">
        <div className="paid-dash-section-head">
          <h2>📅 학습 계획표</h2>
          <Link className="more" to="/study-plan">전체 계획표 ›</Link>
        </div>
        {(!plan || plan.length === 0) ? (
          <p className="paid-dash-note">오늘 배정된 학습이 없어요. 농장별 모드에서 자유롭게 풀어볼 수 있어요.</p>
        ) : (
          <div className="paid-dash-plan-list">
            {plan.slice(0, 6).map((p) => (
              <button
                key={p.id}
                type="button"
                className={`paid-dash-plan-row${p.done ? " done" : ""}`}
                onClick={() => onPlanCellClick(p.id)}
              >
                <span className={`plan-check${p.done ? " done" : ""}`} aria-hidden="true"></span>
                <span className="plan-text">
                  <span className="plan-title">{p.title}</span>
                  {p.meta && <span className="plan-meta">{p.meta}</span>}
                </span>
                {p.due && <span className={`plan-due${p.dueSoft ? " soft" : ""}`}>{p.due}</span>}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 큰 카드 4종 */}
      <div className="free-section-head">
        <h2>🌟 오늘 학습</h2>
        <span className="sub">바로 풀어보거나 모드에서 이어갈 수 있어요.</span>
      </div>
      <div className="free-grid" role="list">
        {PAID_CARDS.map((c) => (
          <button
            key={c.id}
            className={`big-card tint-${c.tint}`}
            role="listitem"
            aria-label={`${c.title} — ${c.cta}`}
            onClick={() => (c.admin ? navDaily(c.route) : navigate(c.route))}
          >
            <ClaySpan color={c.color} label={c.label} image={c.image} />
            <span className="body-text">
              <span className="free-tag">{c.tag}</span>
              <h3>{c.title}</h3>
              <span className="meta">{c.meta}</span>
              <span className="cta">{c.cta}</span>
            </span>
          </button>
        ))}
      </div>

      {/* 추가 메뉴 — 글쓰기 / 분석 / 대결 / 랭킹 */}
      <div className="free-section-head">
        <h2>🔗 빠른 진입</h2>
      </div>
      <div className="paid-dash-quick">
        <button type="button" className="paid-dash-quick-card" onClick={() => navigate("/writing")}>
          <ClaySpan color="blue" label="쓰기" />
          <span className="qc-text"><strong>글쓰기 첨삭</strong><span>지식과 지혜</span></span>
        </button>
        <button type="button" className="paid-dash-quick-card" onClick={() => navigate("/report")}>
          <ClaySpan color="purple" label="분석" />
          <span className="qc-text"><strong>통합 분석표</strong><span>역량·영역·일별</span></span>
        </button>
        <button type="button" className="paid-dash-quick-card" onClick={() => navigate("/duel")}>
          <ClaySpan color="red" label="대결" />
          <span className="qc-text"><strong>대결 라이브</strong><span>친구·AI</span></span>
        </button>
        <button type="button" className="paid-dash-quick-card" onClick={() => navigate("/ranking")}>
          <ClaySpan color="green" label="랭킹" />
          <span className="qc-text"><strong>시즌 랭킹</strong><span>{student.rankPos > 0 ? `${student.rankPos}위 / ${student.rankTotal.toLocaleString()}명` : "아직 점수 없음"}</span></span>
        </button>
      </div>
    </>
  );
}

// ─── 메인 영역 — 무료 회원 (Welcome + 무료 카드 + 잠긴 카드 + 구독 CTA) ──

function FreeMain({ student, onCardClick, onLockedClick, onSubscribe, onShowInventory }) {
  return (
    <>
      <section className="greeting-block" data-od-id="greeting" aria-label="인사">
        <div className="greeting-art">
          <img
            src={import.meta.env.BASE_URL + "images/student-home/student-greeting-farm-morning.png"}
            alt="아침의 작은 농장 일러스트"
          />
        </div>
        <div className="greeting-text">
          <span className="greeting-eyebrow"><span className="dot" aria-hidden="true"></span>오늘의 농장</span>
          <h1 className="greeting-title">
            <strong>{student.name.replace(/이$/, "")} 학생</strong>, 어서 와요!<br />
            오늘은 무료 학습부터 시작해요.
          </h1>
          <p
            className="greeting-meta"
            role="button"
            tabIndex={0}
            onClick={() => onShowInventory && onShowInventory()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onShowInventory && onShowInventory(); } }}
            style={{ cursor: "pointer" }}
          >
            시즌 점수 <strong>{student.score.toLocaleString()}</strong>점 <span style={{ fontSize: 11, opacity: 0.65 }}>· 자세히 ›</span>
          </p>
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
            <ClaySpan color={c.color} label={c.label} image={c.image} />
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
            <ClaySpan color={c.color} label={c.label} image={c.image} />
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
          <span className="sticky-cta-meta">월 <strong>₩65,000</strong> · 장기 구독 시 할인</span>
        </span>
        <span className="sticky-cta-arrow" aria-hidden="true">→</span>
      </button>
    </>
  );
}

// ─── 위젯 컴포넌트 ──────────────────────────────────────────────────

function WalletWidget({ wallet, onItemClick, onCharge, compact = false }) {
  const total = (wallet || []).reduce((s, w) => s + (Number(w.count) || 0), 0);
  return (
    <section className="widget">
      <div className="widget-head">
        <h3 className="widget-title">🌾 작물 지갑</h3>
        <Link className="widget-cta" to="/shop">{compact ? "상점 ›" : "상점 가기 ›"}</Link>
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
        <button type="button" className="btn-charge" onClick={onCharge}>＋ 자몽 충전</button>
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
        <Link className="widget-cta" to="/study-plan">열기 ›</Link>
      </div>
      <p className="plan-meta-row">
        오늘 미수행 <strong>{pendingCount}건</strong>{fullMeta ? " · 내일까지 끝내요" : ""}
      </p>
      {plan.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13, padding: "8px 4px" }}>
          오늘 배정된 학습이 없어요. 농장별 모드에서 자유롭게 풀어볼 수 있어요.
        </p>
      ) : (
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
      )}
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
        <Link className="widget-cta" to="/ranking">전체 ›</Link>
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
