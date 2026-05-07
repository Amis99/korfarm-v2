import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/student-home.css";

// ─── 정적 데이터 (다음 단계에서 apiGet 으로 교체) ───────────────────

const STUDENT = {
  name: "민준이",
  level: "러셀1",
  score: 2340,
  grapefruit: 64,
  notifications: 3,
  rankPos: 156,
  rankTotal: 9420,
};

// AI 튜터 페르소나 (다음 단계에서 user.preferredTutorPersona 로 교체)
const TUTOR = {
  persona: "owl",
  name: "부엉이샘",
  emoji: "🦉",
  initial: "부엉",
};

const RECOMMENDATIONS = [
  { id: "r1", color: "yellow", label: "어휘", title: "어휘 5문제", flag: "즉시 시작", meta: "약 3분 · 어제 틀린 단어 위주" },
  { id: "r2", color: "blue", label: "글쓰기", title: "글쓰기 첨삭 받기", flag: null, meta: "지난 일기 2편 첨삭 대기 중 · 평균 4분" },
  { id: "r3", color: "green", label: "진단", title: "오늘의 진단 결과 보기", flag: null, meta: "강점 2개 · 약점 1개 · 학부모님께도 공유돼요" },
];

const INITIAL_MESSAGES = [
  {
    id: "m1",
    role: "tutor",
    kind: "first-greet",
    content: (
      <p>
        <strong>민준 학생</strong>, 어서 와요! 어제 비문학 점수 <strong>80점</strong> 정말 잘했어요.<br />
        오늘은 <strong>어휘 보강</strong>이 어떨까요? 세 가지 추천드려요 👇
      </p>
    ),
    showRecommendations: true,
  },
  {
    id: "m2",
    role: "user",
    content: (
      <p>이 단어 뜻이 뭐예요? <strong>'회의적'</strong>이요</p>
    ),
  },
  {
    id: "m3",
    role: "tutor",
    content: (
      <>
        <p><strong>'회의적(懷疑的)'</strong> 좋은 어휘를 골랐어요! 시험에 자주 나오는 표현이에요.</p>
        <h4><span className="ico">📖</span> 사전적 의미</h4>
        <p>어떤 일이나 주장에 대해 <strong>의심을 품는</strong>. 또는 그런 것.</p>
        <h4><span className="ico">✏</span> 예문</h4>
        <blockquote>
          그는 새로운 계획에 대해 <strong>회의적인</strong> 태도를 보였다.
        </blockquote>
        <h4><span className="ico">💡</span> 이렇게 기억해요</h4>
        <p>'회의(懷疑)'는 한자로 '<strong>품을 회 + 의심할 의</strong>' — 마음에 의심을 품는다는 뜻이에요. 여기에 성질을 나타내는 '<strong>-적(的)</strong>'이 붙어 '의심하는 성질의'라는 뜻이 됩니다.</p>
        <div className="lex-meta">
          <span><strong>비슷한 말</strong> 부정적, 미덥지 않은</span>
          <span><strong>반대말</strong> 긍정적, 낙관적</span>
        </div>
      </>
    ),
  },
  {
    id: "m4",
    role: "user",
    content: <p>예문 더 보여주세요</p>,
  },
  {
    id: "m5",
    role: "tutor",
    typing: true,
  },
];

const WALLET = [
  { key: "grapefruit", color: "orange", name: "자몽", count: 64, primary: true },
  { key: "wheat",      color: "cream",  name: "밀",   count: 28 },
  { key: "rice",       color: "yellow", name: "쌀",   count: 18 },
  { key: "corn",       color: "yellow", name: "옥수수", count: 9 },
  { key: "grape",      color: "purple", name: "포도", count: 5 },
  { key: "apple",      color: "red",    name: "사과", count: 4 },
];

const INITIAL_PLAN = [
  { id: "p1", title: "일일 퀴즈 10문제", meta: "5분 · 비문학 + 어휘", due: "오늘", dueSoft: false, done: false },
  { id: "p2", title: "한자 성어 7개", meta: "8분 · 어제 학습 이어가기", due: "오늘", dueSoft: false, done: false },
  { id: "p3", title: "독해 5문제 — 사회", meta: "12분 · 도시화 지문", due: "내일", dueSoft: true, done: false },
  { id: "p4", title: "서평 일기 쓰기", meta: "완료 · 첨삭 대기 중", due: null, dueSoft: false, done: true },
];

const RANKING = [
  { id: "1", pos: "🥇", color: "purple", name: "김다은", score: "8,420점", me: false },
  { id: "2", pos: "🥈", color: "blue",   name: "박서준", score: "7,985점", me: false },
  { id: "3", pos: "🥉", color: "orange", name: "민준이", score: "7,612점", me: true  },
];

const QUICK_CHIPS = [
  { id: "q1", text: "📷 사진 찍어 물어보기", q: "사진 찍어서 모르는 문제 물어보고 싶어요" },
  { id: "q2", text: "🤔 '비유적' 뜻은?", q: "'비유적' 뜻이 뭐예요?" },
  { id: "q3", text: "📝 오늘 풀이 채점", q: "오늘 푼 문제 채점해 주세요" },
  { id: "q4", text: "📊 약점 진단 결과", q: "제 약점 진단 결과 알려주세요" },
];

// 무료 회원용 큰 카드 (4장)
const FREE_BIG_CARDS = [
  { id: "daily-quiz",    tint: "yellow", color: "yellow", label: "퀴즈<br/>일러스트",  tag: "무료 · 매일", title: "일일 퀴즈",    meta: "10문제 · 약 5분 · 매일 갱신돼요",   cta: "지금 풀기",    route: "/daily-quiz" },
  { id: "daily-reading", tint: "blue",   color: "blue",   label: "독해<br/>일러스트",  tag: "무료 · 매일", title: "일일 독해",    meta: "비문학 1지문 · 약 7분 · 오늘 미수행", cta: "지금 읽기",    route: "/daily-reading" },
  { id: "diagnostic",    tint: "green",  color: "green",  label: "진단<br/>일러스트",  tag: "1회 무료",    title: "진단 테스트",  meta: "10대 역량 분석 · 약 15분 · 학부모님께 결과 공유", cta: "응시하기", route: "/diagnostic/v2" },
  { id: "battle",        tint: "red",    color: "red",    label: "대결<br/>일러스트",  tag: "무료 · LIVE", title: "대결 라이브",  meta: "1:1 속독전 · 3명 대기 중", live: true, cta: "도전하기", route: "/duel" },
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
    id: "social",
    title: "💬 소통",
    titleClay: { color: "rose", label: "소통" },
    items: [
      { id: "community",      icon: "📢", label: "커뮤니티 게시판", badge: null, badgeKind: null, lockedForFree: false },
      { id: "community-chat", icon: "💬", label: "커뮤니티 채팅",   badge: null, badgeKind: null, lockedForFree: false },
      { id: "shop",           icon: "🛒", label: "쇼핑몰",          badge: null, badgeKind: null, lockedForFree: false },
    ],
  },
  {
    id: "settings",
    title: "⚙ 설정",
    titleClay: { color: "cream", label: "설정" },
    items: [
      { id: "wallet",    icon: "🍊", label: "작물 지갑",   badge: "128", badgeKind: "neutral", lockedForFree: true },
      { id: "persona",   icon: "🦉", label: "캐릭터 변경", badge: null,  badgeKind: null,      lockedForFree: false },
      { id: "profile",   icon: "👤", label: "내 정보",     badge: null,  badgeKind: null,      lockedForFree: false },
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
  "community-chat": "/community",
  "shop": "/shop",
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
  const [activeSidebar, setActiveSidebar] = useState("daily-quiz");
  const [activeTab, setActiveTab] = useState("home");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [plan, setPlan] = useState(INITIAL_PLAN);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "", subscribed: false });
  const chatHistoryRef = useRef(null);
  const toastTimerRef = useRef(null);

  // 데이터 fetch (다음 단계에서 본격 연동)
  useEffect(() => {
    if (!isLoggedIn) return;
    // TODO: 실제 데이터 연동
    // apiGet("/v1/auth/me").then(setProfile).catch(() => {});
    // apiGet("/v1/inventory").then(...);
    // apiGet("/v1/study-plans").then(...);
    // apiGet("/v1/tutor/persona").then(...);
  }, [isLoggedIn]);

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
    const tabRoutes = {
      "study": "/farm-mode",
      "writing": "/writing",
      "analysis": "/report",
    };
    const route = tabRoutes[t.id];
    if (route) navigate(route);
  }

  function handlePlanToggle(id) {
    setPlan((prev) => prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p)));
  }

  function handleSendChat(e) {
    e.preventDefault();
    const v = chatInput.trim();
    if (!v) return;
    setChatInput("");
    setMessages((prev) => {
      const filtered = prev.filter((m) => !m.typing);
      return [
        ...filtered,
        { id: `u-${Date.now()}`, role: "user", content: <p>{v}</p> },
        { id: `t-${Date.now()}`, role: "tutor", typing: true },
      ];
    });
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.typing
            ? {
                ...m,
                typing: false,
                content: <p>좋은 질문이에요! 더 자세한 답변은 실제 서비스에서 받을 수 있어요. 지금은 데모 화면이에요 🌱</p>,
              }
            : m,
        ),
      );
    }, 1200);
    console.log("[tutor chat]", v);
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
          <div className="brand">
            <div className="logo" aria-hidden="true">국</div>
            <span className="name">국어농장</span>
            <span className="ver">v2</span>
          </div>
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

          <button className="hdr-user" aria-label={`${STUDENT.name} 학생 프로필`} onClick={() => navigate("/profile")}>
            <ClaySpan color="orange" label="학생" />
            <span className="info">
              <span className="name">{STUDENT.name}</span>
              <span className="meta"><span className="lvl">{STUDENT.level}</span> · {STUDENT.score.toLocaleString()}점</span>
            </span>
          </button>

          <div className="hdr-actions">
            <button
              className="icon-btn"
              aria-label={free ? "작물 지갑 — 0개, 구독 후 활성화" : `작물 지갑 — 자몽 ${STUDENT.grapefruit}개`}
              onClick={() => free ? showToast("작물 지갑") : navigate("/my/grapefruit")}
            >
              <ClaySpan color={free ? "cream" : "orange"} label={free ? "지갑" : "자몽"} />
              <span className={`icon-count${free ? " zero" : ""}`}>{free ? 0 : STUDENT.grapefruit}</span>
              {free && <span className="icon-lock-mini" aria-hidden="true">🔒</span>}
            </button>
            <button className="icon-btn" aria-label={`알림 ${free ? 1 : STUDENT.notifications}건`}>
              <ClaySpan color="rose" label="알림" />
              <span className="icon-dot">{free ? 1 : STUDENT.notifications}</span>
            </button>
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
              <FreeMain onCardClick={(c) => navigate(c.route)} onLockedClick={(t) => showToast(t)} onSubscribe={handleSubscribe} />
            ) : (
              <PaidMain
                messages={messages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                handleSendChat={handleSendChat}
                handleQuickChip={handleQuickChip}
                handlePersonaSwap={handlePersonaSwap}
                handleRecommendationClick={handleRecommendationClick}
                chatHistoryRef={chatHistoryRef}
                navigate={navigate}
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
                  <WalletWidget onItemClick={handleWalletItemClick} />
                  <PlanWidget plan={plan} onToggle={handlePlanToggle} fullMeta />
                </>
              )}
              <RankingWidget free={free} />
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
                <WalletWidget onItemClick={handleWalletItemClick} compact />
                <PlanWidget plan={plan} onToggle={handlePlanToggle} />
              </>
            )}
            <RankingWidget free={free} />
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
    </div>
  );
}

// ─── 메인 영역 — 유료 회원 (AI 튜터 채팅) ──────────────────────────

function PaidMain({
  messages, chatInput, setChatInput, handleSendChat, handleQuickChip,
  handlePersonaSwap, handleRecommendationClick, chatHistoryRef, navigate,
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
          <span className="feature-name">일일 독해<br />비문학 1지문</span>
          <span className="feature-tag">📖 7분 · 미수행</span>
        </button>
        <button className="feature-card tint-red" role="listitem" aria-label="대결 라이브 — 3명 대기 중" onClick={() => navigate("/duel")}>
          <ClaySpan color="red" label="대결" />
          <span className="feature-name">대결 라이브<br />1:1 속독전</span>
          <span className="feature-tag"><span className="live-dot" aria-hidden="true"></span> LIVE · 3명</span>
        </button>
        <button className="feature-card tint-green" role="listitem" aria-label="시즌 랭킹 보기" onClick={() => navigate("/ranking")}>
          <ClaySpan color="green" label="랭킹" />
          <span className="feature-name">시즌 랭킹<br />전국</span>
          <span className="feature-tag">🌾 {STUDENT.rankPos}위 / {STUDENT.rankTotal.toLocaleString()}명</span>
        </button>
      </div>

      {/* AI 튜터 채팅 영역 */}
      <section className="chat-shell" data-od-id="chat-shell" aria-label="AI 선생님 대화">
        <div className="chat-meta">
          <ClaySpan color="cream" label={`${TUTOR.emoji}<br>${TUTOR.initial}`} />
          <div className="info">
            <div className="title">
              {TUTOR.name}
              <span className="ai-tag">AI 선생님</span>
            </div>
            <div className="switch">
              캐릭터 변경 가능 — <strong>{TUTOR.name}</strong> · <span>아미스샘</span> · <span>누룽지샘</span>
              <button className="swap" type="button" onClick={handlePersonaSwap}>바꾸기 ›</button>
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
                  <span className="lbl">{TUTOR.emoji}</span>
                </div>
              )}
              <div className="msg-stack">
                {m.role === "tutor" && <span className="msg-name">{TUTOR.name}</span>}
                {m.typing ? (
                  <div className="bubble typing" aria-label={`${TUTOR.name}이 답변을 작성 중`}>
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                ) : (
                  <div className={`bubble${m.kind ? ` ${m.kind}` : ""}`}>
                    {m.content}
                    {m.showRecommendations && (
                      <div className="reco-stack" role="list">
                        {RECOMMENDATIONS.map((r) => (
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
          <div className="quick-suggestions" id="quick">
            {QUICK_CHIPS.map((c) => (
              <button
                key={c.id}
                className="quick-chip"
                data-q={c.q}
                onClick={() => handleQuickChip(c.q)}
              >
                {c.text}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ─── 메인 영역 — 무료 회원 (Welcome + 무료 카드 + 잠긴 카드 + 구독 CTA) ──

function FreeMain({ onCardClick, onLockedClick, onSubscribe }) {
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
            <strong>{STUDENT.name.replace(/이$/, "")} 학생</strong>, 어서 와요!<br />
            오늘은 무료 학습부터 시작해요.
          </h1>
          <p className="greeting-meta">3일 연속 출석 중 · 시즌 점수 <strong>{STUDENT.score.toLocaleString()}</strong>점</p>
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

function WalletWidget({ onItemClick, compact = false }) {
  return (
    <section className="widget">
      <div className="widget-head">
        <h3 className="widget-title">🌾 작물 지갑</h3>
        <a className="widget-cta" href="#" onClick={(e) => e.preventDefault()}>{compact ? "상점 ›" : "상점 가기 ›"}</a>
      </div>
      <div className="wallet-grid">
        {WALLET.map((w) => (
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
        <span className="wallet-total">합계 <strong>{compact ? "128" : "128 작물"}</strong></span>
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

function RankingWidget({ free = false }) {
  return (
    <section className="widget">
      <div className="widget-head">
        <h3 className="widget-title">🏆 시즌 랭킹</h3>
        <a className="widget-cta" href="#" onClick={(e) => e.preventDefault()}>전체 ›</a>
      </div>
      <div className="rank-list">
        {RANKING.map((r) => (
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
        {free
          ? <>무료 회원도 시즌 랭킹에 참여할 수 있어요. 1위까지 <strong>808점</strong>!</>
          : <>1위까지 <strong>808점</strong>{" "}남았어요. 오늘 일일 퀴즈만 풀어도 +120점!</>
        }
      </p>
    </section>
  );
}

export default StudentHomePage;
