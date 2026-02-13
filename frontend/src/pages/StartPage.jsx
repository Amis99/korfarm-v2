import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import HarvestCraftModal from "../components/HarvestCraftModal";
import "../styles/start.css";

const TOKEN_KEY = "korfarm_token";

const LEVEL_LABEL_MAP = {
  saussure1: "소쉬르 1",
  saussure2: "소쉬르 2",
  saussure3: "소쉬르 3",
  frege1: "프레게 1",
  frege2: "프레게 2",
  frege3: "프레게 3",
  russell1: "러셀 1",
  russell2: "러셀 2",
  russell3: "러셀 3",
  wittgenstein1: "비트겐슈타인 1",
  wittgenstein2: "비트겐슈타인 2",
  wittgenstein3: "비트겐슈타인 3",
};

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function calcDayIndex(learningStartDate) {
  if (learningStartDate) {
    const start = new Date(learningStartDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return (diff % 365) + 1;
  }
  const doy = getDayOfYear();
  return ((doy - 1) % 365) + 1;
}

function StartPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user, isPremium } = useAuth();
  const [showCraftModal, setShowCraftModal] = useState(false);
  const [showInventoryPopup, setShowInventoryPopup] = useState(false);
  const [readingTitle, setReadingTitle] = useState(null);

  /* Phase 9: API data states */
  const [profile, setProfile] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [harvestRanking, setHarvestRanking] = useState([]);
  const [duelRanking, setDuelRanking] = useState([]);
  const [seedLog, setSeedLog] = useState([]);
  const [subActive, setSubActive] = useState(false);
  const [adminLevelOverride, setAdminLevelOverride] = useState("");

  // 부모용 상태
  const [linkedChildren, setLinkedChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProfile, setChildProfile] = useState(null);
  const [childInventory, setChildInventory] = useState(null);

  const isAdmin = user?.roles?.some((r) => r === "HQ_ADMIN" || r === "ORG_ADMIN");
  const isParent = user?.roles?.includes("PARENT");

  // 과제 수
  const [assignmentCount, setAssignmentCount] = useState(null);

  // 과제 목록 가져오기
  useEffect(() => {
    if (!isLoggedIn || isParent) return;
    apiGet("/v1/assignments")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const pending = list.filter((a) => a.status !== "closed");
        setAssignmentCount(pending.length);
      })
      .catch(() => setAssignmentCount(0));
  }, [isLoggedIn, isParent]);

  // 부모인 경우 연결된 자녀 목록 가져오기
  useEffect(() => {
    if (!isLoggedIn || !isParent) return;
    apiGet("/v1/parents/links")
      .then((links) => {
        const activeLinks = (links || []).filter((l) => l.status === "active");
        setLinkedChildren(activeLinks);
        if (activeLinks.length > 0 && !selectedChild) {
          setSelectedChild(activeLinks[0]);
        }
      })
      .catch(() => {});
  }, [isLoggedIn, isParent]);

  // 선택된 자녀 정보 가져오기
  useEffect(() => {
    if (!isParent || !selectedChild?.studentUserId) return;
    const studentId = selectedChild.studentUserId;
    apiGet(`/v1/parents/children/${studentId}/profile`)
      .then(setChildProfile)
      .catch(() => setChildProfile(null));
    apiGet(`/v1/parents/children/${studentId}/inventory`)
      .then(setChildInventory)
      .catch(() => setChildInventory(null));
  }, [isParent, selectedChild]);

  useEffect(() => {
    if (!isLoggedIn) return;
    // 부모가 아닌 경우에만 자신의 인벤토리/구독 조회
    if (!isParent) {
      apiGet("/v1/inventory").then(setInventory).catch(() => {});
      apiGet("/v1/subscription")
        .then((sub) => {
          const st = sub?.status;
          if (st === "active" || st === "canceled") setSubActive(true);
        })
        .catch(() => {});
    }
    apiGet("/v1/seasons/current")
      .then((season) => {
        if (season?.id) {
          apiGet(`/v1/seasons/${season.id}/harvest-rankings`).then((r) => setHarvestRanking(r?.items || r || [])).catch(() => {});
          if (!isParent) {
            apiGet(`/v1/seasons/${season.id}/duel-rankings`).then((r) => setDuelRanking(r?.items || r || [])).catch(() => {});
          }
        }
      })
      .catch(() => {});
    apiGet("/v1/auth/me").then((data) => {
      // pending 상태 확인: 승인 대기 중이면 pending 페이지로 리다이렉트
      const isPending = data?.pending_approval || data?.pendingApproval;
      if (isPending) {
        navigate("/pending");
        return;
      }
      setProfile(data);
      const lid = data?.level_id || data?.levelId;
      const lsd = data?.learning_start_date || data?.learningStartDate || null;
      if (lid && !isParent) {
        const di = calcDayIndex(lsd);
        const dayStr = String(di).padStart(3, "0");
        const base = import.meta.env.BASE_URL || "/";
        fetch(`${base}daily-reading/${lid}/${dayStr}.json`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.title) { setReadingTitle(d.title); return; }
            // fallback to 001.json when today's file doesn't exist
            fetch(`${base}daily-reading/${lid}/001.json`)
              .then((r2) => (r2.ok ? r2.json() : null))
              .then((d2) => { if (d2?.title) setReadingTitle(d2.title); })
              .catch(() => {});
          })
          .catch(() => {});
      }
    }).catch(() => {});
    // 관리자인 경우 기본 레벨을 override 초기값으로 설정
    if (!isParent) {
      apiGet("/v1/ledger")
        .then((entries) => {
          const seeds = (entries || []).filter((e) => e.currencyType === "seed").slice(0, 5);
          setSeedLog(seeds);
        })
        .catch(() => {});
    }
  }, [isLoggedIn, isParent]);

  // 관리자 레벨 변경 시 daily reading 재로드
  useEffect(() => {
    if (!isAdmin || !adminLevelOverride) return;
    const lsd = profile?.learning_start_date || profile?.learningStartDate || null;
    const di = calcDayIndex(lsd);
    const dayStr = String(di).padStart(3, "0");
    const base = import.meta.env.BASE_URL || "/";
    fetch(`${base}daily-reading/${adminLevelOverride}/${dayStr}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.title) { setReadingTitle(d.title); return; }
        fetch(`${base}daily-reading/${adminLevelOverride}/001.json`)
          .then((r2) => (r2.ok ? r2.json() : null))
          .then((d2) => { if (d2?.title) setReadingTitle(d2.title); })
          .catch(() => {});
      })
      .catch(() => {});
  }, [adminLevelOverride, isAdmin, profile]);

  const hasSub = isPremium || subActive;
  const displayName = profile?.name || user?.name || "농부";
  const baseLevelId = profile?.level_id || profile?.levelId;
  const levelId = (isAdmin && adminLevelOverride) ? adminLevelOverride : baseLevelId;
  const displayLevel = levelId || "LV.1";
  const levelLabel = LEVEL_LABEL_MAP[levelId] || levelId || "";
  const learningStartDate = profile?.learning_start_date || profile?.learningStartDate || null;
  const dayOfYear = calcDayIndex(learningStartDate);

  // 부모용 자녀 정보
  const childLevelId = childProfile?.level_id || childProfile?.levelId;
  const childLevelLabel = LEVEL_LABEL_MAP[childLevelId] || childLevelId || "";

  const displayInventory = isParent ? childInventory : inventory;
  const totalSeeds = Array.isArray(displayInventory?.seeds)
    ? displayInventory.seeds.reduce((s, e) => s + (e.count || 0), 0)
    : Object.values(displayInventory?.seeds || {}).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  const totalCrops = Array.isArray(displayInventory?.crops)
    ? displayInventory.crops.reduce((s, e) => s + (e.count || 0), 0)
    : Object.values(displayInventory?.crops || {}).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  const fertilizerCount = displayInventory?.fertilizer ?? 0;

  const cropsObj = displayInventory?.crops || {};
  const cropWheat = cropsObj.crop_wheat ?? 0;
  const cropRice = cropsObj.crop_rice ?? 0;
  const cropCorn = cropsObj.crop_corn ?? 0;
  const cropGrape = cropsObj.crop_grape ?? 0;
  const cropApple = cropsObj.crop_apple ?? 0;
  const seasonScore = (cropWheat * cropRice * cropCorn * cropGrape * cropApple) * 50 + totalSeeds;

  const seedsObj = displayInventory?.seeds || {};
  const SEED_LABELS = { seed_wheat: "밀", seed_rice: "쌀", seed_corn: "옥수수", seed_grape: "포도", seed_apple: "사과" };
  const CROP_LABELS = { crop_wheat: "밀", crop_rice: "쌀", crop_corn: "옥수수", crop_grape: "포도", crop_apple: "사과" };
  const INVENTORY_ITEMS = [
    { seedKey: "seed_wheat", cropKey: "crop_wheat", emoji: "🌾", label: "밀" },
    { seedKey: "seed_rice", cropKey: "crop_rice", emoji: "🍚", label: "쌀" },
    { seedKey: "seed_corn", cropKey: "crop_corn", emoji: "🌽", label: "옥수수" },
    { seedKey: "seed_grape", cropKey: "crop_grape", emoji: "🍇", label: "포도" },
    { seedKey: "seed_apple", cropKey: "crop_apple", emoji: "🍎", label: "사과" },
  ];

  // 부모용 네비게이션 함수 (자녀 ID 포함)
  const navWithChild = (path) => {
    if (isParent && selectedChild?.studentUserId) {
      navigate(`${path}?studentId=${selectedChild.studentUserId}`);
    } else {
      navigate(path);
    }
  };

  // 부모 전용 화면
  if (isParent) {
    return (
      <div className="start-page">
        <div className="start-shell">
          <header className="start-header">
            <div className="start-header-top">
              <div className="start-avatar">
                <span className="material-symbols-outlined start-avatar-fallback">family_restroom</span>
              </div>
              <div className="start-greeting">
                <h1>
                  {displayName} 학부모님, <span>안녕하세요!</span>
                </h1>
                {linkedChildren.length > 0 ? (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 13, color: "#666", marginRight: 8 }}>자녀 선택:</label>
                    <select
                      value={selectedChild?.studentUserId || ""}
                      onChange={(e) => {
                        const child = linkedChildren.find((c) => c.studentUserId === e.target.value);
                        setSelectedChild(child);
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(0,0,0,0.15)",
                        background: "#fff",
                        fontSize: 13,
                        color: "#222",
                        cursor: "pointer",
                      }}
                    >
                      {linkedChildren.map((child) => (
                        <option key={child.studentUserId} value={child.studentUserId}>
                          {child.studentName || child.studentLoginId}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p style={{ marginTop: 8, fontSize: 13, color: "#888" }}>
                    연결된 자녀가 없습니다.
                    <Link to="/parents/links" style={{ marginLeft: 8, color: "#f06c24" }}>자녀 연결하기</Link>
                  </p>
                )}
                {selectedChild && childProfile && (
                  <div className="start-season-score" onClick={() => setShowInventoryPopup(true)} style={{ cursor: "pointer", marginTop: 8 }}>
                    <span className="material-symbols-outlined">emoji_events</span>
                    <span className="start-level-label">{childLevelLabel}</span>
                    <span className="start-season-label">자녀 시즌 점수</span>
                    <strong>{seasonScore.toLocaleString()}</strong>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  style={{
                    marginTop: 10,
                    padding: "6px 14px",
                    border: "1px solid rgba(0,0,0,0.15)",
                    borderRadius: 10,
                    background: "#fff",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
                  내 정보 수정
                </button>
              </div>
            </div>
          </header>

          <div className="start-grid">
            <div className="start-section">
              <h2>
                <span className="material-symbols-outlined">visibility</span>
                자녀 학습 현황
              </h2>

              {!selectedChild ? (
                <div className="start-card">
                  <p>자녀를 연결해 주세요.</p>
                  <Link className="start-card-button" to="/parents/links">자녀 연결</Link>
                </div>
              ) : (
                <>
                  {/* 자녀 학습 메뉴 */}
                  <div className="start-paid-grid">
                    <div className="start-paid-card" onClick={() => navWithChild("/writing")}>
                      <span className="material-symbols-outlined">edit_note</span>
                      <h3>지식과 지혜</h3>
                      <p>자녀 글쓰기 확인</p>
                    </div>
                    <div className="start-paid-card" onClick={() => navWithChild("/tests")}>
                      <span className="material-symbols-outlined">quiz</span>
                      <h3>테스트 창고</h3>
                      <p>시험 결과 확인</p>
                    </div>
                    <div className="start-paid-card" onClick={() => navWithChild("/harvest-ledger")}>
                      <span className="material-symbols-outlined">menu_book</span>
                      <h3>수확 장부</h3>
                      <p>작물 거래 내역</p>
                    </div>
                    <div className="start-paid-card" onClick={() => navWithChild("/tests/history")}>
                      <span className="material-symbols-outlined">assessment</span>
                      <h3>테스트 기록실</h3>
                      <p>성적표 및 오답 노트</p>
                    </div>
                  </div>

                  {/* 자녀 인벤토리 요약 */}
                  {childInventory && (
                    <>
                      <h2>
                        <span className="material-symbols-outlined">inventory_2</span>
                        자녀 보유 현황
                      </h2>
                      <div className="start-card">
                        <div style={{ marginBottom: 8 }}>
                          <strong style={{ fontSize: 13, color: "#6b5b50" }}>씨앗 (총 {totalSeeds}개)</strong>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4, fontSize: 13 }}>
                            {Object.entries(SEED_LABELS).map(([key, label]) => (
                              <span key={key}>{label} {seedsObj[key] ?? 0}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <strong style={{ fontSize: 13, color: "#6b5b50" }}>수확물 (총 {totalCrops}개)</strong>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4, fontSize: 13 }}>
                            {Object.entries(CROP_LABELS).map(([key, label]) => (
                              <span key={key}>{label} {cropsObj[key] ?? 0}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <strong style={{ fontSize: 13, color: "#6b5b50" }}>비료</strong>
                          <span style={{ marginLeft: 8, fontSize: 13 }}>{fertilizerCount}개</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <aside className="start-side">
              {/* 시즌 랭킹 */}
              <div className="start-rank">
                <h2>
                  <span className="material-symbols-outlined">emoji_events</span>
                  시즌 랭킹
                </h2>
                <ul>
                  {harvestRanking.length > 0
                    ? harvestRanking.slice(0, 3).map((r, i) => (
                        <li key={r.userId || i}>
                          {i + 1}위 {r.userName || r.name || "?"} · {(r.value ?? r.totalCrops ?? r.score ?? 0).toLocaleString()}점
                        </li>
                      ))
                    : [
                        <li key="1">1위 — · 0점</li>,
                        <li key="2">2위 — · 0점</li>,
                        <li key="3">3위 — · 0점</li>,
                      ]}
                </ul>
                <Link className="start-rank-link" to={selectedChild ? `/ranking?studentId=${selectedChild.studentUserId}` : "/ranking"}>
                  랭킹 확인
                </Link>
              </div>

              {/* 커뮤니티 */}
              <div className="start-card" id="community">
                <h3>커뮤니티</h3>
                <p>학습 신청 · 질문 · 자료 게시판을 이용하세요.</p>
                <Link className="start-card-button" to="/community">
                  게시판 이동
                </Link>
              </div>

              {/* 쇼핑몰 */}
              <div className="start-card start-shop" id="shop">
                <div className="start-shop-title">
                  <span className="material-symbols-outlined">local_mall</span>
                  <h3>쇼핑몰</h3>
                </div>
                <p>교재 · 교구를 한 곳에서 구매하세요.</p>
                <Link className="start-card-button" to="/shop">
                  쇼핑몰 이동
                </Link>
              </div>
            </aside>
          </div>
        </div>

        {showInventoryPopup && (
          <div className="result-overlay" onClick={() => setShowInventoryPopup(false)}>
            <div className="result-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, width: "92vw", background: "#fff", borderRadius: 24, padding: 24, aspectRatio: "auto", gridTemplateRows: "none", display: "grid", gap: 0, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>보유 현황</h2>
              <div style={{ display: "grid", gap: 8 }}>
                {INVENTORY_ITEMS.map((item) => (
                  <div key={item.seedKey} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                    <span style={{ fontSize: 20 }}>{item.emoji}</span>
                    <strong style={{ minWidth: 50 }}>{item.label}</strong>
                    <span>씨앗 {seedsObj[item.seedKey] ?? 0}</span>
                    <span style={{ color: "#888" }}>·</span>
                    <span>수확물 {cropsObj[item.cropKey] ?? 0}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 20 }}>🧪</span>
                <strong>비료</strong>
                <span>{fertilizerCount}개</span>
              </div>
              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(240,108,36,0.08)", borderRadius: 12, fontSize: 12, color: "#6b5b50" }}>
                <strong>시즌 점수 공식</strong><br />
                (밀×쌀×옥수수×포도×사과)×50 + 총씨앗
              </div>
              <button
                type="button"
                onClick={() => setShowInventoryPopup(false)}
                style={{ marginTop: 12, padding: "8px 20px", border: "none", borderRadius: 12, background: "var(--meadow-green, #ffb26b)", color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                닫기
              </button>
            </div>
          </div>
        )}

        <nav className="start-nav">
          <Link className="active" to="/start">
            <span className="material-symbols-outlined">cottage</span>
            홈
          </Link>
          <Link to={selectedChild ? `/ranking?studentId=${selectedChild.studentUserId}` : "/ranking"}>
            <span className="material-symbols-outlined">emoji_events</span>
            랭킹
          </Link>
          <Link to="/community">
            <span className="material-symbols-outlined">forum</span>
            커뮤니티
          </Link>
          <Link to="/shop">
            <span className="material-symbols-outlined">local_mall</span>
            쇼핑몰
          </Link>
        </nav>
      </div>
    );
  }

  // 기존 학생/관리자 화면
  return (
    <div className="start-page">
      <div className="start-shell">
        <header className="start-header">
          <div className="start-header-top">
            <div
              className="start-avatar"
              style={
                (profile?.profile_image_url || profile?.profileImageUrl)
                  ? { backgroundImage: `url(${profile.profile_image_url || profile.profileImageUrl})` }
                  : undefined
              }
            >
              {!(profile?.profile_image_url || profile?.profileImageUrl) && (
                <span className="material-symbols-outlined start-avatar-fallback">person</span>
              )}
            </div>
            <div className="start-greeting">
              <h1>
                {displayName} 농부님, <span>안녕하세요!</span>
              </h1>
              <div className="start-season-score" onClick={() => setShowInventoryPopup(true)} style={{ cursor: "pointer" }}>
                <span className="material-symbols-outlined">emoji_events</span>
                <span className="start-level-label">{levelLabel || displayLevel}</span>
                <span className="start-season-label">시즌 점수</span>
                <strong>{seasonScore.toLocaleString()}</strong>
              </div>
              {isAdmin ? (
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <select
                    value={adminLevelOverride || baseLevelId || ""}
                    onChange={(e) => setAdminLevelOverride(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: "#fff",
                      fontSize: 13,
                      color: "#222",
                      cursor: "pointer",
                    }}
                  >
                    <option value="" disabled>레벨 선택</option>
                    {Object.entries(LEVEL_LABEL_MAP).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => navigate("/admin")}
                    style={{
                      padding: "6px 14px",
                      border: "1px solid rgba(240,108,36,0.4)",
                      borderRadius: 10,
                      background: "rgba(240,108,36,0.15)",
                      fontSize: 13,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#f06c24",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>admin_panel_settings</span>
                    관리자 페이지
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  style={{
                    marginTop: 6,
                    padding: "6px 14px",
                    border: "1px solid rgba(0,0,0,0.15)",
                    borderRadius: 10,
                    background: "#fff",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
                  내 정보 수정
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            className="start-sub-btn"
            onClick={() => navigate("/subscription")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {hasSub ? "manage_accounts" : "upgrade"}
            </span>
            {hasSub ? "구독 관리" : "업그레이드"}
          </button>
        </header>

        <div className="start-grid">
          <div className="start-section" id="free">
            <h2>
              <span className="material-symbols-outlined">school</span>
              오늘의 무료 학습
            </h2>
            <div className="start-card" onClick={() => navigate("/daily-quiz")} style={{ cursor: "pointer" }}>
              <span className="badge">일일 퀴즈</span>
              <h3>{levelLabel} - {dayOfYear}일 차</h3>
              <p>총 10문제 도전!</p>
              <p className="start-card-notice">하루 첫 제출 시에만 씨앗이 지급됩니다.</p>
            </div>
            <div className="start-card" onClick={() => navigate("/daily-reading")} style={{ cursor: "pointer" }}>
              <span className="badge" style={{ background: "#81d4fa" }}>
                일일 독해
              </span>
              <h3>{readingTitle || `${levelLabel} ${dayOfYear}일 차`}</h3>
              <p>지문 읽는 힘을 키워요</p>
              <p className="start-card-notice">제출할 때마다 씨앗이 지급됩니다.</p>
            </div>

            {/* 과제 바구니 */}
            <h2>
              <span className="material-symbols-outlined">shopping_basket</span>
              과제 바구니
            </h2>
            <div className="start-basket">
              <div>
                <span className="badge" style={{ background: "rgba(0,0,0,0.2)" }}>
                  특별 과제
                </span>
                {assignmentCount === null ? (
                  <h3>과제 확인 중...</h3>
                ) : assignmentCount > 0 ? (
                  <>
                    <h3>특별 과제 {assignmentCount}건 도착!</h3>
                    <p>완료하고 과제 씨앗을 받아보세요.</p>
                  </>
                ) : (
                  <h3>배정된 과제가 없습니다</h3>
                )}
              </div>
              <button type="button" onClick={() => navigate("/assignments")}>
                과제 보러가기
              </button>
            </div>

            {/* 유료 학습 메뉴 그리드 */}
            <h2 id="paid">
              <span className="material-symbols-outlined">stars</span>
              유료 학습
            </h2>
            <div className="start-paid-grid">
              <div className="start-paid-card" onClick={() => navigate("/pro-mode")}>
                <span className="material-symbols-outlined">military_tech</span>
                <h3>프로 모드</h3>
                <p>12레벨 심화 학습</p>
                {!hasSub && <span className="start-lock-badge">구독 필요</span>}
              </div>
              <div className="start-paid-card" onClick={() => navigate("/farm-mode")}>
                <span className="material-symbols-outlined">agriculture</span>
                <h3>농장별 모드</h3>
                <p>영역별 집중 학습</p>
                {!hasSub && <span className="start-lock-badge">구독 필요</span>}
              </div>
              <div className="start-paid-card" onClick={() => navigate("/writing")}>
                <span className="material-symbols-outlined">edit_note</span>
                <h3>지식과 지혜</h3>
                <p>글쓰기 훈련</p>
                {!hasSub && <span className="start-lock-badge">구독 필요</span>}
              </div>
              <div className="start-paid-card" onClick={() => navigate("/tests")}>
                <span className="material-symbols-outlined">quiz</span>
                <h3>테스트 창고</h3>
                <p>진단/챕터 시험</p>
                {!hasSub && <span className="start-lock-badge">구독 필요</span>}
              </div>
              <div className="start-paid-card" onClick={() => navigate("/harvest-ledger")}>
                <span className="material-symbols-outlined">menu_book</span>
                <h3>수확 장부</h3>
                <p>작물 거래 내역</p>
                {!hasSub && <span className="start-lock-badge">구독 필요</span>}
              </div>
              <div className="start-paid-card" onClick={() => navigate("/tests/history")}>
                <span className="material-symbols-outlined">assessment</span>
                <h3>테스트 기록실</h3>
                <p>성적표 및 오답 노트</p>
              </div>
            </div>

            {/* 씨앗 획득 내역 요약 */}
            <h2>
              <span className="material-symbols-outlined">history</span>
              최근 씨앗 획득
            </h2>
            <div className="start-card">
              {seedLog.length > 0 ? (
                <ul className="start-seed-log">
                  {seedLog.map((entry, i) => (
                    <li key={entry.id || i}>
                      {entry.itemType || entry.seedType || "씨앗"} +{entry.delta || 0}개 ·{" "}
                      {entry.reason || ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>아직 씨앗 획득 내역이 없습니다.</p>
              )}
              <Link className="start-card-button" to="/seed-log">
                전체 보기
              </Link>
            </div>
          </div>

          <aside className="start-side">
            {/* 시즌 점수 랭킹 */}
            <div className="start-rank">
              <h2>
                <span className="material-symbols-outlined">emoji_events</span>
                시즌 랭킹
              </h2>
              <ul>
                {harvestRanking.length > 0
                  ? harvestRanking.slice(0, 3).map((r, i) => (
                      <li key={r.userId || i}>
                        {i + 1}위 {r.userName || r.name || "?"} · {(r.value ?? r.totalCrops ?? r.score ?? 0).toLocaleString()}점
                      </li>
                    ))
                  : [
                      <li key="1">1위 — · 0점</li>,
                      <li key="2">2위 — · 0점</li>,
                      <li key="3">3위 — · 0점</li>,
                    ]}
              </ul>
              <Link className="start-rank-link" to="/ranking">
                랭킹 확인
              </Link>
            </div>

            {/* 대결 랭킹 요약 */}
            <div className="start-rank">
              <h2>
                <span className="material-symbols-outlined">swords</span>
                대결 랭킹
              </h2>
              <ul>
                {duelRanking.length > 0
                  ? duelRanking.slice(0, 3).map((r, i) => (
                      <li key={r.userId || i}>
                        {i + 1}위 {r.userName || r.name || "?"} · {r.wins ?? 0}승 {r.winRate ?? 0}%
                      </li>
                    ))
                  : [
                      <li key="1">1위 — · 0승</li>,
                      <li key="2">2위 — · 0승</li>,
                      <li key="3">3위 — · 0승</li>,
                    ]}
              </ul>
            </div>

            {/* 대결 */}
            <div className="start-duel" id="duel">
              <div>
                <strong>대결하기</strong>
                <p>씨앗을 걸고 실력을 겨뤄요</p>
              </div>
              <button type="button" onClick={() => navigate("/duel")}>
                대결 신청
              </button>
            </div>

            {/* 씨앗 교환 */}
            <div className="start-card">
              <h3>씨앗 교환</h3>
              <p>씨앗 10개를 모아 수확물로 교환해요</p>
              <button type="button" onClick={() => setShowCraftModal(true)}>
                교환하기
              </button>
            </div>

            {/* 커뮤니티 */}
            <div className="start-card" id="community">
              <h3>커뮤니티</h3>
              <p>학습 신청 · 질문 · 자료 게시판을 이용하세요.</p>
              <Link className="start-card-button" to="/community">
                게시판 이동
              </Link>
            </div>

            {/* 쇼핑몰 */}
            <div className="start-card start-shop" id="shop">
              <div className="start-shop-title">
                <span className="material-symbols-outlined">local_mall</span>
                <h3>쇼핑몰</h3>
              </div>
              <p>교재 · 교구를 한 곳에서 구매하세요.</p>
              <Link className="start-card-button" to="/shop">
                쇼핑몰 이동
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {showInventoryPopup && (
        <div className="result-overlay" onClick={() => setShowInventoryPopup(false)}>
          <div className="result-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, width: "92vw", background: "#fff", borderRadius: 24, padding: 24, aspectRatio: "auto", gridTemplateRows: "none", display: "grid", gap: 0, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>보유 현황</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {INVENTORY_ITEMS.map((item) => (
                <div key={item.seedKey} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <span style={{ fontSize: 20 }}>{item.emoji}</span>
                  <strong style={{ minWidth: 50 }}>{item.label}</strong>
                  <span>씨앗 {seedsObj[item.seedKey] ?? 0}</span>
                  <span style={{ color: "#888" }}>·</span>
                  <span>수확물 {cropsObj[item.cropKey] ?? 0}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 20 }}>🧪</span>
              <strong>비료</strong>
              <span>{fertilizerCount}개</span>
            </div>
            <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(240,108,36,0.08)", borderRadius: 12, fontSize: 12, color: "#6b5b50" }}>
              <strong>시즌 점수 공식</strong><br />
              (밀×쌀×옥수수×포도×사과)×50 + 총씨앗
            </div>
            <button
              type="button"
              onClick={() => setShowInventoryPopup(false)}
              style={{ marginTop: 12, padding: "8px 20px", border: "none", borderRadius: 12, background: "var(--meadow-green, #ffb26b)", color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <HarvestCraftModal
        open={showCraftModal}
        onClose={() => setShowCraftModal(false)}
        onCrafted={(data) => {
          if (data?.inventory) setInventory(data.inventory);
        }}
      />

      <nav className="start-nav">
        <Link className="active" to="/start">
          <span className="material-symbols-outlined">cottage</span>
          홈
        </Link>
        <a href="#free">
          <span className="material-symbols-outlined">school</span>
          무료학습
        </a>
        <a href="#paid">
          <span className="material-symbols-outlined">stars</span>
          유료학습
        </a>
        <Link to="/duel">
          <span className="material-symbols-outlined">swords</span>
          대결
        </Link>
        <Link to="/community">
          <span className="material-symbols-outlined">forum</span>
          커뮤니티
        </Link>
        <Link to="/shop">
          <span className="material-symbols-outlined">local_mall</span>
          쇼핑몰
        </Link>
      </nav>
    </div>
  );
}

export default StartPage;
