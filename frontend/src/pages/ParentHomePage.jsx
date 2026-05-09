import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost, normalizeInventoryKeys } from "../utils/api";
import NoticeBell from "../components/NoticeBell";
import { requestTossPayment } from "../utils/tossPayment";
import "../styles/student-home.css";
import "../styles/parent-home.css";

// ─── 정적 메타 ───────────────────────────────────────────────────────

const LEVEL_LABEL_MAP = {
  saussure1: "소쉬르 1", saussure2: "소쉬르 2", saussure3: "소쉬르 3",
  frege1: "프레게 1", frege2: "프레게 2", frege3: "프레게 3",
  russell1: "러셀 1", russell2: "러셀 2", russell3: "러셀 3",
  wittgenstein1: "비트겐슈타인 1", wittgenstein2: "비트겐슈타인 2", wittgenstein3: "비트겐슈타인 3",
};

const CHILD_COLORS = ["orange", "blue", "green", "purple", "rose", "yellow"];

// 자녀 인벤토리 위젯 — 자몽 + 5작물
const WALLET_META = [
  { key: "grapefruit", color: "orange", name: "자몽" },
  { key: "crop_wheat", color: "cream",  name: "밀" },
  { key: "crop_rice",  color: "yellow", name: "쌀" },
  { key: "crop_corn",  color: "yellow", name: "옥수수" },
  { key: "crop_grape", color: "purple", name: "포도" },
  { key: "crop_apple", color: "rose",   name: "사과" },
];

// ─── 사이드바 — 매칭 검증된 라우트만 (가상 기능 X) ───────────────────
//
// 미존재 매핑은 alert 로 처리. fake URL 보내지 않음.
//   - 자녀 학습 현황: 별도 라우트 없음 → 통합 분석표로 대체 또는 "준비 중"
//   - 공지사항: 별도 라우트 없음 → 메뉴 제거
const SIDEBAR_GROUPS = [
  {
    id: "child",
    title: "👀 자녀 학습",
    titleClay: { color: "orange", label: "자녀" },
    items: [
      { id: "report",   icon: "🏠", label: "자녀 학습 현황", routeKey: "report" },
      { id: "plan",     icon: "📅", label: "학습 계획표",   routeKey: "plan" },
      { id: "report2",  icon: "📋", label: "통합 분석표",   routeKey: "report" },
      { id: "writing",  icon: "✏",  label: "글쓰기 검토",   routeKey: "writing" },
    ],
  },
  {
    id: "social",
    title: "💬 소통",
    titleClay: { color: "blue", label: "소통" },
    items: [
      { id: "board",  icon: "📌", label: "커뮤니티 게시판", routeKey: "community" },
      { id: "chat",   icon: "💬", label: "커뮤니티 채팅",   routeKey: "community" },
      { id: "notice", icon: "📢", label: "공지사항",        routeKey: "notice" },
    ],
  },
  {
    id: "shop",
    title: "🎁 쇼핑몰",
    titleClay: { color: "yellow", label: "쇼핑" },
    items: [
      { id: "shop", icon: "📦", label: "교재 · 교구 구매", routeKey: "shop" },
    ],
  },
  {
    id: "settings",
    title: "⚙ 설정",
    titleClay: { color: "cream", label: "설정" },
    items: [
      { id: "link",    icon: "👨‍👩‍👧", label: "자녀 연결 관리", routeKey: "parents-links" },
      { id: "billing", icon: "💳", label: "결제·구독",          routeKey: "subscription" },
      { id: "profile", icon: "👤", label: "내 정보",             routeKey: "profile" },
      { id: "logout",  icon: "🚪", label: "로그아웃",            routeKey: null },
    ],
  },
];

// 채팅 미리보기는 단일 글로벌 community 방의 최근 메시지 N개를 fetch (상대시각 포맷)
function formatRelTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "방금";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    const days = Math.floor(diff / 86400);
    if (days < 7) return `${days}일 전`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "";
  }
}

// ─── 헬퍼 ────────────────────────────────────────────────────────────

function ClaySpan({ color = "", label = "", className = "", style }) {
  return (
    <span className={`clay clay-${color} ${className}`} aria-hidden="true" style={style}>
      <span className="lbl" dangerouslySetInnerHTML={{ __html: label }} />
    </span>
  );
}

function buildRoute(routeKey, studentId) {
  // routeKey → 실제 라우트. studentId 가 필요한 자녀 관련 라우트는 query 로 첨부.
  const sid = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
  switch (routeKey) {
    case "report":         return `/report${sid}`;
    case "plan":           return `/study-plan${sid}`;
    case "writing":        return `/writing${sid}`;
    case "community":      return "/community";
    case "shop":           return "/shop";
    case "parents-links":  return "/parents/links";
    case "subscription":   return "/subscription";
    case "profile":        return "/profile";
    default:               return null;
  }
}

// ─── 컴포넌트 ────────────────────────────────────────────────────────

function ParentHomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [linkedChildren, setLinkedChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProfile, setChildProfile] = useState(null);
  const [childInventory, setChildInventory] = useState(null);
  const [childActivity, setChildActivity] = useState([]);
  const [seasonRanking, setSeasonRanking] = useState([]);
  const [seasonScore, setSeasonScore] = useState(null);
  const [pendingPlan, setPendingPlan] = useState([]);

  // 채팅 미리보기 (단일 community 방 최근 3개)
  const [chatPreview, setChatPreview] = useState([]);
  // 자녀 구독 상태
  const [childSubscription, setChildSubscription] = useState(null);
  // 결제 진행 중 잠금
  const [subscribing, setSubscribing] = useState(false);

  const noticeBellRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [childMenuOpen, setChildMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [activeSidebar, setActiveSidebar] = useState("report");
  const [toast, setToast] = useState("");

  const parentName = user?.name || "학부모";

  // 1) 연결된 자녀 목록 (active 만)
  useEffect(() => {
    apiGet("/v1/parents/links")
      .then((data) => {
        const active = (data || []).filter((l) => l.status === "active");
        setLinkedChildren(active);
        if (active.length > 0) {
          setSelectedChild(active[0]);
        }
      })
      .catch((e) => console.error("[parent-home] /v1/parents/links failed", e));
  }, []);

  // 2) selectedChild 변경 시 — profile + inventory + activity 동시 fetch
  useEffect(() => {
    if (!selectedChild?.studentUserId) return;
    const sid = selectedChild.studentUserId;

    apiGet(`/v1/parents/children/${sid}/profile`)
      .then(setChildProfile)
      .catch((e) => { console.error("[parent-home] profile failed", e); setChildProfile(null); });

    apiGet(`/v1/parents/children/${sid}/inventory`)
      .then((d) => setChildInventory(normalizeInventoryKeys(d)))
      .catch((e) => { console.error("[parent-home] inventory failed", e); setChildInventory(null); });

    apiGet(`/v1/parents/children/${sid}/farm/history`)
      .then((d) => {
        const list = Array.isArray(d) ? d : (d?.items || []);
        setChildActivity(list.slice(0, 8));
      })
      .catch((e) => { console.error("[parent-home] farm/history failed", e); setChildActivity([]); });
  }, [selectedChild]);

  // 자녀 구독 상태
  useEffect(() => {
    if (!selectedChild?.studentUserId) {
      setChildSubscription(null);
      return;
    }
    apiGet(`/v1/parents/children/${selectedChild.studentUserId}/subscription`)
      .then((data) => setChildSubscription(data || null))
      .catch((e) => {
        console.error("[parent-home] child subscription failed", e);
        setChildSubscription(null);
      });
  }, [selectedChild]);

  // 채팅 미리보기 — 단일 community 방 최근 3개
  useEffect(() => {
    apiGet("/v1/chat/rooms/community/messages?limit=3")
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.items || data?.messages || []);
        setChatPreview(items.slice(0, 3));
      })
      .catch((e) => {
        console.error("[parent-home] community messages failed", e);
        setChatPreview([]);
      });
  }, []);

  // 자녀 월 구독 결제
  async function handleSubscribeChild(months = 1) {
    if (!selectedChild?.studentUserId || subscribing) return;
    setSubscribing(true);
    try {
      const data = await apiPost(
        `/v1/parents/children/${selectedChild.studentUserId}/subscribe`,
        { months },
      );
      const p = data || {};
      await requestTossPayment({
        clientKey: p.clientKey,
        customerKey: p.customerKey,
        amount: p.amount,
        orderId: p.orderId || p.paymentId,
        orderName: p.orderName || `${selectedChildName} 학생 ${months}개월 구독`,
        customerName: p.customerName,
        customerEmail: p.customerEmail,
        customerMobilePhone: p.customerPhone,
      });
      // requestTossPayment 가 결제창 열고 successUrl/failUrl 로 리디렉션
    } catch (e) {
      console.error("[parent-home] subscribe failed", e);
      showToast("결제 요청에 실패했습니다");
      setSubscribing(false);
    }
  }

  // 3) 시즌 점수·랭킹
  useEffect(() => {
    apiGet("/v1/seasons/current")
      .then((season) => {
        const sid = season?.id || season?.seasonId;
        if (!sid) return;
        apiGet(`/v1/seasons/${sid}/harvest-rankings`)
          .then((r) => {
            const items = r?.items || (Array.isArray(r) ? r : []);
            setSeasonRanking(items.slice(0, 3));
            // 본인 자녀 점수
            if (selectedChild?.studentUserId) {
              const me = items.find((x) => x.userId === selectedChild.studentUserId);
              if (me) setSeasonScore(me.value ?? me.totalCrops ?? me.score ?? null);
            }
          })
          .catch((e) => console.error("[parent-home] rankings failed", e));
      })
      .catch((e) => console.error("[parent-home] seasons/current failed", e));
  }, [selectedChild]);

  // 4) 미수행 학습 — 자녀 study-plan
  useEffect(() => {
    if (!selectedChild?.studentUserId) return;
    apiGet(`/v1/study-plans?studentId=${selectedChild.studentUserId}`)
      .then(async (plans) => {
        const list = Array.isArray(plans) ? plans : [];
        const pending = [];
        for (const p of list) {
          try {
            const matrix = await apiGet(`/v1/study-plans/${p.planId}/matrix`);
            const cells = Array.isArray(matrix?.cells) ? matrix.cells : [];
            for (const c of cells) {
              if (c.status === "pending" || c.status === "partial" || c.status === "in_progress") {
                pending.push(c);
                if (pending.length >= 3) break;
              }
            }
            if (pending.length >= 3) break;
          } catch {}
        }
        setPendingPlan(pending);
      })
      .catch(() => setPendingPlan([]));
  }, [selectedChild]);

  // 자녀별 색상
  const childColor = useMemo(() => {
    if (!selectedChild || !linkedChildren.length) return "orange";
    const idx = linkedChildren.findIndex((c) => c.studentUserId === selectedChild.studentUserId);
    return CHILD_COLORS[idx % CHILD_COLORS.length] || "orange";
  }, [selectedChild, linkedChildren]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  // 라우트 클릭 — 매칭 안 되는 항목은 toast / fake URL 안 보냄
  const handleSidebarClick = (item) => {
    if (item.id === "logout") {
      logout();
      return;
    }
    setActiveSidebar(item.id);
    if (window.matchMedia && window.matchMedia("(max-width: 767px)").matches) {
      setDrawerOpen(false);
    }
    if (item.routeKey === "notice") {
      noticeBellRef.current?.openModal();
      return;
    }
    const route = buildRoute(item.routeKey, selectedChild?.studentUserId);
    if (route) {
      navigate(route);
    } else {
      showToast(`「${item.label}」 — 준비 중입니다`);
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "more") {
      setDrawerOpen(true);
      return;
    }
    if (tabId === "notice") {
      noticeBellRef.current?.openModal();
      return;
    }
    const tabRoute = {
      home: "/parent-home",
      child: selectedChild ? `/report?studentId=${selectedChild.studentUserId}` : "/report",
      chat: "/community",
    };
    const route = tabRoute[tabId];
    if (route) navigate(route);
  };

  const childLevelId = childProfile?.level_id || childProfile?.levelId;
  const childLevelLabel = LEVEL_LABEL_MAP[childLevelId] || childLevelId || "—";

  // 진척률 — childProfile 응답 형식 모르므로 안전 fallback
  const weeklyProgress = childProfile?.weekly_progress ?? childProfile?.weeklyProgress ?? null;
  const streakDays = childProfile?.attendance_streak ?? childProfile?.attendanceStreak ?? null;

  // 학부모 자몽 X — 학부모는 자몽을 사용하지 않음 (자녀 월 구독료만 결제)

  const selectedChildName = selectedChild?.studentName || selectedChild?.studentLoginId || "—";

  return (
    <div className="student-home">
      <div className={`app${drawerOpen ? " " : ""}`} data-od-id="dashboard-parent" data-drawer={drawerOpen ? "open" : undefined}>
        {/* ─── HEADER ─── */}
        <header className="top-bar" data-od-id="top-bar">
          <button className="hamburger" onClick={() => setDrawerOpen(true)} aria-label="메뉴 열기">
            <span></span>
          </button>
          <Link to="/start" className="brand" aria-label="국어농장 홈">
            <img
              src={import.meta.env.BASE_URL + "korfarm-logo.png"}
              alt="국어농장"
              style={{ height: 36, width: "auto", display: "block" }}
            />
          </Link>
          <div className="hdr-spacer"></div>

          <div className="child-pill-wrap">
            <button
              className="child-pill"
              aria-haspopup="listbox"
              aria-expanded={childMenuOpen}
              aria-label={`자녀 선택 — 현재 ${selectedChildName}`}
              onClick={(e) => { e.stopPropagation(); setChildMenuOpen((v) => !v); }}
            >
              <ClaySpan color={childColor} label={selectedChildName.slice(0, 2) || "자녀"} />
              <span className="info">
                <span className="kicker">자녀 선택</span>
                <span className="name">{selectedChildName}</span>
              </span>
              <span className="caret" aria-hidden="true">▾</span>
            </button>
            <div className="child-menu" role="listbox" data-open={childMenuOpen ? "true" : "false"}>
              {linkedChildren.length === 0 && (
                <div style={{ padding: "12px 10px", fontSize: 12, color: "var(--muted)" }}>
                  연결된 자녀가 없습니다.
                </div>
              )}
              {linkedChildren.map((child, idx) => {
                const c = CHILD_COLORS[idx % CHILD_COLORS.length];
                const isSel = selectedChild?.studentUserId === child.studentUserId;
                const cName = child.studentName || child.studentLoginId || "자녀";
                return (
                  <button
                    key={child.studentUserId}
                    className={`child-menu-item${isSel ? " selected" : ""}`}
                    role="option"
                    aria-selected={isSel}
                    onClick={() => {
                      setSelectedChild(child);
                      setChildMenuOpen(false);
                      showToast(`${cName} 학생으로 전환했어요`);
                    }}
                  >
                    <ClaySpan color={c} label={cName.slice(0, 2)} />
                    <span className="info">
                      <span className="name">{cName}</span>
                      <span className="meta">{child.studentLoginId}</span>
                    </span>
                    <span className="check" aria-hidden="true">✓</span>
                  </button>
                );
              })}
              <div className="child-menu-divider" aria-hidden="true"></div>
              <button
                className="child-menu-add"
                onClick={() => {
                  setChildMenuOpen(false);
                  navigate("/parents/links");
                }}
              >
                <span className="plus" aria-hidden="true">+</span>
                <span>다른 자녀 추가</span>
              </button>
            </div>
          </div>

          <button className="hdr-user" aria-label={`${parentName} 학부모님 프로필`} onClick={() => navigate("/profile")}>
            <ClaySpan color="purple" label="학부모" />
            <span className="info">
              <span className="name">{parentName} 님</span>
              <span className="meta">
                <span className="role-tag">학부모</span>
                {selectedChild ? ` · ${selectedChildName} 보호자` : ""}
              </span>
            </span>
          </button>

          <div className="hdr-actions">
            <NoticeBell ref={noticeBellRef} />
            <button className="icon-btn" aria-label="설정" onClick={() => navigate("/profile")}>
              <ClaySpan color="green" label="설정" />
            </button>
          </div>
        </header>

        {/* ─── BODY ─── */}
        <div className="body" data-od-id="body">
          <button
            className="scrim"
            aria-label="메뉴 닫기"
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
          ></button>

          {/* ─── SIDEBAR ─── */}
          <aside className="sidebar" data-od-id="sidebar" aria-label="주요 메뉴">
            {selectedChild && (
              <div className="sb-context">
                <ClaySpan color={childColor} label={selectedChildName.slice(0, 2) || "자녀"} />
                <span className="text">
                  <span className="kicker">현재 자녀</span>
                  <span className="name">
                    {selectedChildName}
                    {childLevelLabel !== "—" && <span className="level">{childLevelLabel}</span>}
                  </span>
                  {streakDays && <span className="meta">출석 {streakDays}일 연속{seasonScore != null ? ` · 시즌 ${Number(seasonScore).toLocaleString()}점` : ""}</span>}
                </span>
              </div>
            )}

            {SIDEBAR_GROUPS.map((group) => (
              <div className="sb-group" key={group.id}>
                <div className="sb-title">
                  <ClaySpan color={group.titleClay.color} label={group.titleClay.label} />
                  <span>{group.title}</span>
                </div>
                {group.items.map((item) => {
                  const isActive = activeSidebar === item.id;
                  return (
                    <a
                      key={item.id}
                      className={`sb-item${isActive ? " active" : ""}`}
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleSidebarClick(item); }}
                    >
                      <span className="icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            ))}
          </aside>

          {/* ─── CENTER (메인) ─── */}
          <main className="center" data-od-id="center">
            {/* 1) WELCOME + CHILD SUMMARY */}
            <section className="welcome" data-od-id="welcome">
              <img
                className="welcome-hero"
                src={import.meta.env.BASE_URL + "images/parent-home/parent-welcome-hero.png"}
                alt="자녀의 학습을 함께 살피는 학부모 일러스트"
              />
              <div className="welcome-text">
                <span className="welcome-eyebrow">
                  <span className="dot" aria-hidden="true"></span>
                  오늘의 학부모실
                </span>
                <h1 className="welcome-title">
                  <strong>{parentName} 학부모님</strong>, 어서 오세요!
                </h1>
                <p className="welcome-meta">
                  {selectedChild
                    ? <><span className="date">{new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}</span> · {selectedChildName} 학생의 학습을 살펴봐 주세요.</>
                    : "연결된 자녀가 없습니다. 아래에서 자녀를 연결해 주세요."}
                </p>
                {!selectedChild && linkedChildren.length === 0 && (
                  <Link
                    to="/parents/links"
                    style={{
                      display: "inline-block", marginTop: 10,
                      padding: "10px 16px", background: "var(--accent)",
                      color: "white", borderRadius: 999, fontSize: 13, fontWeight: 700,
                    }}
                  >
                    자녀 연결하기 →
                  </Link>
                )}
              </div>

              {selectedChild && (
                <div className="child-card">
                  <div className="row">
                    <ClaySpan color={childColor} label={`${selectedChildName.slice(0, 2)}<br/>아바타`} />
                    <span className="head">
                      <span className="name">
                        {selectedChildName}
                        {childLevelLabel !== "—" && <span className="level">{childLevelLabel}</span>}
                      </span>
                      <span className="stats">
                        {streakDays && <span className="stat-streak">🔥 출석 {streakDays}일 연속</span>}
                        {seasonScore != null && (
                          <span>· 시즌 <strong>{Number(seasonScore).toLocaleString()}</strong>점</span>
                        )}
                      </span>
                    </span>
                  </div>

                  {weeklyProgress != null && (
                    <div className="progress">
                      <div className="progress-head">
                        <span>이번 주 학습 진척</span>
                        <strong>{weeklyProgress}%</strong>
                      </div>
                      <div className="progress-bar" role="progressbar" aria-valuenow={weeklyProgress} aria-valuemin={0} aria-valuemax={100}>
                        <div className="progress-fill" style={{ width: `${weeklyProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="cta-row">
                    <span className="cta-meta">
                      {pendingPlan.length > 0 ? <>미수행 <strong>{pendingPlan.length}건</strong></> : <>오늘 할 학습 모두 완료</>}
                    </span>
                    <Link
                      className="cta-link"
                      to={`/report?studentId=${selectedChild.studentUserId}`}
                      aria-label={`${selectedChildName}의 통합 분석표 보기`}
                    >
                      {selectedChildName}의 통합 분석표 보기
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* 2) COMMUNITY CHAT PREVIEW — 단일 community 방 최근 3개 */}
            <div className="section-head">
              <div className="head-text">
                <h2>💬 커뮤니티 채팅</h2>
                <span className="sub">국어농장 가족이 모이는 단일 채팅방. 최근 대화를 미리 보고 바로 참여하세요.</span>
              </div>
              <Link className="more" to="/community" aria-label="커뮤니티 채팅 전체 열기">전체 채팅 열기</Link>
            </div>
            <div className="chat-list" role="list">
              {chatPreview.length === 0 ? (
                <div className="parent-empty">
                  <img
                    src={import.meta.env.BASE_URL + "images/parent-home/parent-empty-chat.png"}
                    alt=""
                    className="parent-empty-illu"
                  />
                  <p>최근 대화가 없습니다. 첫 메시지를 남겨보세요.</p>
                </div>
              ) : chatPreview.map((row, idx) => {
                const author = row.userName || row.senderName || row.author || row.userId || "익명";
                const text = row.content || row.message || row.text || "";
                const ts = formatRelTime(row.createdAt || row.created_at || row.timestamp);
                return (
                  <button
                    key={row.id || idx}
                    className="chat-row"
                    role="listitem"
                    onClick={() => navigate("/community")}
                  >
                    <ClaySpan color={CHILD_COLORS[idx % CHILD_COLORS.length]} className="avatar" label={author.slice(0, 2)} />
                    <span className="body-text">
                      <span className="top-row">
                        <span className="name">{author}</span>
                      </span>
                      <span className="snippet">{text}</span>
                    </span>
                    <span className="right-stack">
                      <span className="ts">{ts}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3) CHILD ACTIVITY TIMELINE */}
            <div className="section-head">
              <div className="head-text">
                <h2>📊 자녀 학습 활동</h2>
                <span className="sub">{selectedChildName}이/가 최근 푼 학습과 시험 결과를 모아 보여드려요.</span>
              </div>
              <Link
                className="more"
                to={selectedChild ? `/report?studentId=${selectedChild.studentUserId}` : "/report"}
                aria-label="전체 활동 보기"
              >
                전체 보기
              </Link>
            </div>
            <div className="timeline">
              {childActivity.length === 0 ? (
                <div className="parent-empty">
                  <img
                    src={import.meta.env.BASE_URL + "images/parent-home/parent-empty-activity.png"}
                    alt=""
                    className="parent-empty-illu"
                  />
                  <p>최근 학습 활동이 없습니다.</p>
                </div>
              ) : (
                <div className="timeline-items">
                  {childActivity.map((act, idx) => (
                    <button key={act.id || idx} className="timeline-row">
                      <ClaySpan color="yellow" label={act.kind || "활동"} />
                      <span className="body-text">
                        <span className="title">{act.title || act.label || act.summary || "학습 활동"}</span>
                        {act.meta && <span className="meta">{act.meta}</span>}
                      </span>
                      {act.ts && <span className="ts">{act.ts}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: 24 }}></div>
          </main>

          {/* ─── RIGHT ASIDE (데스크톱) ─── */}
          <aside className="right-aside" aria-label="요약 위젯">
            {/* 시즌 점수·랭킹 */}
            <section className="widget">
              <div className="widget-head">
                <h3 className="widget-title">🏆 {selectedChildName}의 시즌 점수</h3>
                <Link className="widget-cta" to="/ranking">전체 ›</Link>
              </div>
              {seasonScore != null && (
                <div className="score-block">
                  <ClaySpan color={childColor} label={selectedChildName.slice(0, 2)} />
                  <span className="text">
                    <span className="label">시즌 점수</span>
                    <span className="val">{Number(seasonScore).toLocaleString()}</span>
                  </span>
                </div>
              )}
              <div className="rank-list">
                {seasonRanking.map((r, i) => (
                  <div key={r.userId || i} className={`rank-row${r.userId === selectedChild?.studentUserId ? " me" : ""}`}>
                    <span className={`rank-pos${i < 3 ? " gold" : ""}`} aria-label={`${i + 1}위`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </span>
                    <ClaySpan color={["purple", "blue", "orange"][i] || "yellow"} className="rank-avatar" label={(r.userName || r.name || "?").slice(0, 2)} />
                    <span className="rank-name">{r.userName || r.name || "?"}</span>
                    <span className="rank-score">{Number(r.value ?? r.totalCrops ?? r.score ?? 0).toLocaleString()}점</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 자녀 인벤토리 — 자몽 + 5작물 */}
            {childInventory && (
              <section className="widget">
                <div className="widget-head">
                  <h3 className="widget-title">🌾 {selectedChildName}의 작물 지갑</h3>
                  <Link
                    className="widget-cta"
                    to={selectedChild ? `/farm/inventory?studentId=${selectedChild.studentUserId}` : "/farm/inventory"}
                  >
                    전체 ›
                  </Link>
                </div>
                <div className="parent-wallet-grid">
                  {WALLET_META.map((w) => {
                    const count = w.key === "grapefruit"
                      ? Number(childInventory.grapefruit ?? childInventory.grapefruits ?? 0)
                      : Number((childInventory.crops || {})[w.key] ?? 0);
                    return (
                      <div key={w.key} className="parent-wallet-cell">
                        <ClaySpan color={w.color} label={w.name} />
                        <span className="parent-wallet-count">{count.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 미수행 학습 */}
            <section className="widget">
              <div className="widget-head">
                <h3 className="widget-title">⏰ 미수행 학습</h3>
                <Link
                  className="widget-cta"
                  to={selectedChild ? `/study-plan?studentId=${selectedChild.studentUserId}` : "/study-plan"}
                >
                  계획표 ›
                </Link>
              </div>
              {pendingPlan.length === 0 ? (
                <div className="parent-empty parent-empty--small">
                  <img
                    src={import.meta.env.BASE_URL + "images/parent-home/parent-pending-empty.png"}
                    alt=""
                    className="parent-empty-illu parent-empty-illu--small"
                  />
                  <p>오늘 할 학습이 모두 완료됐어요.</p>
                </div>
              ) : (
                <>
                  <div className="pending-list">
                    {pendingPlan.map((c, idx) => (
                      <button key={c.id || idx} className="pending-row">
                        <ClaySpan color="yellow" label={c.assetType || "학습"} />
                        <span className="text">
                          <span className="title">{c.assignedLabel || c.title || "학습 항목"}</span>
                          {c.dueAt && <span className="meta">{new Date(c.dueAt).toLocaleDateString("ko-KR")} 마감</span>}
                        </span>
                        <span className="due">오늘</span>
                      </button>
                    ))}
                  </div>
                  <p className="pending-foot">
                    {selectedChildName}이/가 오늘 안에 끝내면 보너스 점수를 받아요.
                  </p>
                </>
              )}
            </section>

            {/* 자녀 월 구독 결제 */}
            <section className="widget">
              <div className="widget-head">
                <h3 className="widget-title">💳 {selectedChildName}의 구독</h3>
              </div>
              {(() => {
                const status = childSubscription?.status || "free";
                const expiresAt = childSubscription?.expiresAt;
                const lastPaymentAt = childSubscription?.lastPaymentAt;
                const isActive = status === "active";
                return (
                  <>
                    <div className="score-block">
                      <ClaySpan color={isActive ? "green" : "rose"} label={isActive ? "활성" : "만료"} />
                      <span className="text">
                        <span className="label">상태</span>
                        <span className="val">
                          {isActive ? "✅ 활성" : status === "expired" ? "⚠️ 만료" : "🆓 무료"}
                        </span>
                      </span>
                    </div>
                    {expiresAt && (
                      <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 0" }}>
                        만료 예정: {new Date(expiresAt).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                    {lastPaymentAt && (
                      <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
                        최근 결제: {new Date(lastPaymentAt).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSubscribeChild(1)}
                      disabled={subscribing || !selectedChild}
                      style={{
                        marginTop: 12,
                        width: "100%",
                        padding: "10px 14px",
                        background: subscribing ? "var(--border-warm)" : "var(--accent)",
                        color: "white",
                        border: "none",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: subscribing || !selectedChild ? "not-allowed" : "pointer",
                        opacity: subscribing || !selectedChild ? 0.6 : 1,
                      }}
                    >
                      {subscribing ? "처리 중..." : isActive ? "월 구독 연장하기" : "월 구독 결제하기"}
                    </button>
                  </>
                );
              })()}
            </section>

            {/* 학원·본사 공지 미리보기 — 종 모달과 별개 위젯 */}
            <section className="widget">
              <div className="widget-head">
                <h3 className="widget-title">📢 공지사항</h3>
                <button
                  type="button"
                  className="widget-cta"
                  onClick={() => noticeBellRef.current?.openModal()}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "var(--accent-deep)" }}
                >
                  전체 ›
                </button>
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                상단 종 아이콘 또는 "전체"를 눌러 본사·학원 공지사항을 확인하세요.
              </p>
            </section>
          </aside>
        </div>

        {/* ─── 모바일 하단 탭바 ─── */}
        <nav className="tab-bar" data-od-id="tab-bar" role="tablist" aria-label="주요 탭">
          {[
            { id: "home",   color: "orange", label: "홈" },
            { id: "child",  color: "yellow", label: "자녀" },
            { id: "chat",   color: "blue",   label: "채팅" },
            { id: "notice", color: "rose",   label: "공지" },
            { id: "more",   color: "purple", label: "더보기" },
          ].map((t) => {
            const active = activeTab === t.id;
            return (
              <a
                key={t.id}
                className="tab"
                href="#"
                role="tab"
                aria-current={active ? "page" : undefined}
                onClick={(e) => { e.preventDefault(); handleTabClick(t.id); }}
              >
                <span className="tab-icon">
                  <ClaySpan color={t.color} label={t.label} />
                </span>
                <span className="tab-label">{t.label}</span>
              </a>
            );
          })}
        </nav>

        {/* ─── 토스트 ─── */}
        {toast && (
          <div className="toast show" role="status" aria-live="polite">
            <span className="ico" aria-hidden="true">✓</span>
            <span className="msg">{toast}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParentHomePage;
