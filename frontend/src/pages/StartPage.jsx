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
  const cropOat = cropsObj.crop_oat ?? 0;
  const cropRice = cropsObj.crop_rice ?? 0;
  const cropGrape = cropsObj.crop_grape ?? 0;
  const seasonScore = (cropWheat * cropOat * cropRice * cropGrape * 10) + totalSeeds;

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
                  <div className="start-season-score" style={{ marginTop: 8 }}>
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
                    <div className="start-paid-card" onClick={() => navWithChild("/seed-log")}>
                      <span className="material-symbols-outlined">history</span>
                      <h3>씨앗 내역</h3>
                      <p>씨앗 획득 기록</p>
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
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                          <div>
                            <strong>씨앗</strong>
                            <p>{totalSeeds}개</p>
                          </div>
                          <div>
                            <strong>작물</strong>
                            <p>{totalCrops}개</p>
                          </div>
                          <div>
                            <strong>비료</strong>
                            <p>{fertilizerCount}개</p>
                          </div>
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
              <div className="start-season-score">
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
                <h3>특별 과제 도착!</h3>
                <p>완료하고 과제 씨앗을 받아보세요.</p>
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
              <div className="start-paid-card" onClick={() => navigate("/seed-log")}>
                <span className="material-symbols-outlined">history</span>
                <h3>씨앗 내역</h3>
                <p>씨앗 획득 기록</p>
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

      <HarvestCraftModal open={showCraftModal} onClose={() => setShowCraftModal(false)} />

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
