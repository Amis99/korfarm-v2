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

function StartPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user, isPremium } = useAuth();
  const [showCraftModal, setShowCraftModal] = useState(false);

  /* Phase 9: API data states */
  const [profile, setProfile] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [harvestRanking, setHarvestRanking] = useState([]);
  const [duelRanking, setDuelRanking] = useState([]);
  const [seedLog, setSeedLog] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet("/v1/auth/me").then(setProfile).catch(() => {});
    apiGet("/v1/inventory").then(setInventory).catch(() => {});
    apiGet("/v1/seasons/current")
      .then((season) => {
        if (season?.id) {
          apiGet(`/v1/seasons/${season.id}/harvest-rankings`).then((r) => setHarvestRanking(r?.items || r || [])).catch(() => {});
          apiGet(`/v1/seasons/${season.id}/duel-rankings`).then((r) => setDuelRanking(r?.items || r || [])).catch(() => {});
        }
      })
      .catch(() => {});
    apiGet("/v1/ledger")
      .then((entries) => {
        const seeds = (entries || []).filter((e) => e.currencyType === "seed").slice(0, 5);
        setSeedLog(seeds);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const displayName = profile?.name || user?.name || "농부";
  const displayLevel = profile?.levelId || "LV.1";
  const levelId = profile?.levelId;
  const levelLabel = LEVEL_LABEL_MAP[levelId] || levelId || "";
  const dayOfYear = ((getDayOfYear() - 1) % 365) + 1;
  const totalSeeds = inventory?.seeds?.reduce((s, e) => s + (e.count || 0), 0) ?? 0;
  const totalCrops = inventory?.crops?.reduce((s, e) => s + (e.count || 0), 0) ?? 0;
  const fertilizerCount = inventory?.fertilizer ?? 0;

  return (
    <div className="start-page">
      <div className="start-shell">
        <header className="start-header">
          <div className="start-header-top">
            <div className="start-avatar">
              <span className="start-level">{levelLabel || displayLevel}</span>
            </div>
            <div className="start-greeting">
              <h1>
                {displayName} 농부님, <span>안녕하세요!</span>
              </h1>
              <div className="start-xp">
                <span>{totalSeeds} 씨앗</span>
                <span>{totalCrops} 수확물</span>
              </div>
              <div className="start-progress">
                <span />
              </div>
            </div>
          </div>
          <div className="start-stats">
            <div className="start-stat">
              <span className="material-symbols-outlined">grass</span>
              <span>{totalSeeds} 씨앗</span>
            </div>
            <div className="start-stat">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span>{totalCrops} 수확물</span>
            </div>
            <div className="start-stat">
              <span className="material-symbols-outlined">spa</span>
              <span>{fertilizerCount} 비료</span>
            </div>
          </div>
          {!isPremium && (
            <div className="start-cta">
              <div>
                <strong>무제한 씨앗 받기!</strong>
                <p>프리미엄으로 더 큰 성장과 보상을 만나보세요.</p>
              </div>
              <button type="button" onClick={() => navigate("/subscription")}>
                업그레이드
              </button>
            </div>
          )}
        </header>

        <div className="start-grid">
          <div className="start-section" id="free">
            <h2>
              <span className="material-symbols-outlined">school</span>
              오늘의 무료 학습
            </h2>
            <div className="start-card" onClick={() => navigate("/daily-quiz")} style={{ cursor: "pointer" }}>
              <span className="badge">일일 퀴즈</span>
              <h3>{levelLabel} {dayOfYear}일 차</h3>
              <p>총 10문제 도전!</p>
              <p className="start-card-notice">하루 첫 제출 시에만 씨앗이 지급됩니다.</p>
              <div className="start-progress-mini">
                <span />
              </div>
            </div>
            <div className="start-card" onClick={() => navigate("/daily-reading")} style={{ cursor: "pointer" }}>
              <span className="badge" style={{ background: "#81d4fa" }}>
                일일 독해
              </span>
              <h3>{levelLabel} {dayOfYear}일 차</h3>
              <p>지문 읽는 힘을 키워요</p>
              <p className="start-card-notice">제출할 때마다 씨앗이 지급됩니다.</p>
              <div className="start-progress-mini">
                <span style={{ width: "0%", background: "#81d4fa" }} />
              </div>
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
                {!isPremium && <span className="start-lock-badge">구독 필요</span>}
              </div>
              <div className="start-paid-card" onClick={() => navigate("/farm-mode")}>
                <span className="material-symbols-outlined">agriculture</span>
                <h3>농장별 모드</h3>
                <p>영역별 집중 학습</p>
                {!isPremium && <span className="start-lock-badge">구독 필요</span>}
              </div>
              <div className="start-paid-card" onClick={() => navigate("/writing")}>
                <span className="material-symbols-outlined">edit_note</span>
                <h3>지식과 지혜</h3>
                <p>글쓰기 훈련</p>
                {!isPremium && <span className="start-lock-badge">구독 필요</span>}
              </div>
              <div className="start-paid-card" onClick={() => navigate("/tests")}>
                <span className="material-symbols-outlined">quiz</span>
                <h3>테스트 창고</h3>
                <p>진단/챕터 시험</p>
                {!isPremium && <span className="start-lock-badge">구독 필요</span>}
              </div>
              <div className="start-paid-card" onClick={() => navigate("/harvest-ledger")}>
                <span className="material-symbols-outlined">menu_book</span>
                <h3>수확 장부</h3>
                <p>작물 거래 내역</p>
                {!isPremium && <span className="start-lock-badge">구독 필요</span>}
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
            {/* 시즌 수확 랭킹 */}
            <div className="start-rank">
              <h2>
                <span className="material-symbols-outlined">emoji_events</span>
                시즌 랭킹
              </h2>
              <ul>
                {harvestRanking.length > 0
                  ? harvestRanking.slice(0, 3).map((r, i) => (
                      <li key={r.userId || i}>
                        {i + 1}위 {r.userName || r.name || "?"} · {r.totalCrops ?? r.score ?? 0} 수확물
                      </li>
                    ))
                  : [
                      <li key="1">1위 — · 0 수확물</li>,
                      <li key="2">2위 — · 0 수확물</li>,
                      <li key="3">3위 — · 0 수확물</li>,
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
