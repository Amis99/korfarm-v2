import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { FARM_LIST } from "../data/learning/learningCatalog";
import "../styles/landing.css";
import "../styles/pro-mode.css";
import "../styles/farm-mode.css";
import "../styles/unified-report.css";
import "../styles/admin.css";

/* ── 데이터 상수 ── */

const LEARNING_FLOW = [
  {
    step: 1,
    icon: "quiz",
    title: "진단",
    desc: "진단 테스트를 통해 현재 실력을 측정하고, 12레벨 중 최적 레벨에 배정합니다.",
    tags: ["레벨 배정", "실력 측정", "맞춤 시작"],
  },
  {
    step: 2,
    icon: "fitness_center",
    title: "훈련",
    desc: "일일 퀴즈·독해로 기초를 다지고, 프로 모드 180+ 챕터와 9영역 농장 모드로 심화 학습합니다.",
    tags: ["일일 퀴즈", "독해 훈련", "프로 모드 180챕터", "9영역 농장 모드"],
  },
  {
    step: 3,
    icon: "analytics",
    title: "평가",
    desc: "AI가 자동 채점하고, 오답 노트와 영역별 성적 분석으로 약점을 정확히 짚어줍니다.",
    tags: ["AI 자동 채점", "오답 노트", "영역별 분석"],
  },
  {
    step: 4,
    icon: "emoji_events",
    title: "보상",
    desc: "학습 완료 시 씨앗과 수확물을 획득하고, 시즌 랭킹과 1:1 대결로 동기를 유지합니다.",
    tags: ["씨앗 경제", "시즌 랭킹", "1:1 대결"],
  },
];

const DEEP_FEATURES = [
  {
    icon: "menu_book",
    title: "프로 모드",
    subtitle: "180+ 챕터, 6단계 모듈 구성",
    desc: "어휘·문법·독해·논리·서술·문제해결까지 6단계 모듈로 체계적으로 진행합니다. 각 챕터는 난이도별로 세분화되어 학습자의 성장에 맞춰 자동 조절됩니다.",
    highlights: ["6단계 모듈", "180+ 챕터", "난이도 자동 조절"],
  },
  {
    icon: "park",
    title: "농장별 모드",
    subtitle: "9개 영역 약점 집중 훈련",
    desc: "어휘농장, 문법농장, 독해농장 등 9개 영역별 전용 농장에서 약점을 집중적으로 보강합니다. 각 농장마다 고유한 훈련 방식으로 효과를 극대화합니다.",
    highlights: ["9개 전문 영역", "약점 집중", "영역별 특화 훈련"],
  },
  {
    icon: "smart_toy",
    title: "AI 채점 + 통합 성적표",
    subtitle: "자동 채점, 레이더 차트 분석",
    desc: "AI가 자동 채점하고, 영역별 성취도를 레이더 차트로 시각화합니다. 학습 추이와 취약점을 한눈에 파악할 수 있습니다.",
    highlights: ["AI 자동 채점", "레이더 차트", "학습 추이 분석"],
  },
  {
    icon: "dashboard",
    title: "기관 관리 대시보드",
    subtitle: "반 관리, 과제 배포, 학부모 연동",
    desc: "학원·학교 관리자가 반을 구성하고, 과제를 일괄 배포하며, 학부모에게 학습 현황을 공유할 수 있습니다. 기관 운영 효율을 극대화합니다.",
    highlights: ["반 관리", "과제 일괄 배포", "학부모 리포트"],
  },
];

const GAMIFICATION = [
  {
    icon: "potted_plant",
    title: "씨앗 경제",
    desc: "학습을 완료할 때마다 씨앗을 획득하고, 모은 씨앗을 다양한 수확물로 교환할 수 있습니다.",
  },
  {
    icon: "trophy",
    title: "시즌 랭킹",
    desc: "수확물 점수를 기반으로 시즌별 순위를 경쟁하며, 최고의 학습자에게 보상이 주어집니다.",
  },
  {
    icon: "swords",
    title: "1:1 대결",
    desc: "씨앗을 걸고 실시간 퀴즈 대결에 도전하세요. 승리하면 상대의 씨앗까지 획득할 수 있습니다.",
  },
];

const PLANS = [
  {
    tag: "무료",
    title: "Basic",
    price: "0",
    subtitle: "월",
    perks: [
      "오늘의 퀴즈",
      "오늘의 독해",
      "기본 랭킹 참여",
      "커뮤니티 이용",
      "진단 테스트 1회",
    ],
    cta: "시작하기",
  },
  {
    tag: "인기",
    title: "Pro",
    price: "65,000",
    subtitle: "월",
    perks: [
      "Basic 전체 포함",
      "프로 모드 전체",
      "농장 모드 전체",
      "AI 자동 채점",
      "과제 시스템",
      "테스트 창고",
      "통합 성적표",
      "수확물 보상 확대",
    ],
    cta: "학습 시작하기",
    featured: true,
    discount: "3개월 10% | 12개월 30% 할인",
  },
  {
    tag: "기관",
    title: "Academy",
    price: "별도 문의",
    subtitle: "",
    perks: [
      "Pro 전체 포함",
      "기관 관리 대시보드",
      "반 관리 시스템",
      "과제 일괄 배포",
      "학부모 연동 리포트",
    ],
    cta: "상담 문의",
    isAcademy: true,
  },
];

const FAQ_ITEMS = [
  {
    q: "어떤 학년에 적합한가요?",
    a: "초등 1학년부터 고등 3학년까지 총 12레벨로 구성되어 있습니다. 진단 테스트를 통해 학년과 무관하게 실력에 맞는 레벨에 배정됩니다.",
  },
  {
    q: "12레벨은 어떻게 구성되나요?",
    a: "4개 서버(프레게·소쉬르·러셀·비트겐슈타인) × 3단계로 총 12레벨입니다. 프레게 1~3, 소쉬르 1~3, 러셀 1~3, 비트겐슈타인 1~3 순서로 난이도가 올라가며, 진단 테스트 결과에 따라 학년과 무관하게 적합한 레벨에 배정됩니다.",
  },
  {
    q: "무료로 어디까지 이용할 수 있나요?",
    a: "Basic 플랜에서는 매일 제공되는 '오늘의 퀴즈'와 '오늘의 독해', 기본 랭킹 참여, 커뮤니티 이용, 그리고 진단 테스트 1회를 무료로 이용할 수 있습니다.",
  },
  {
    q: "어떤 기능이 있나요?",
    a: "오늘의 퀴즈·독해, 프로 모드(180+ 챕터), 농장별 모드(9개 영역), AI 자동 채점, 통합 성적표, 씨앗 보상 시스템, 시즌 랭킹, 1:1 대결, 기관 관리 대시보드 등을 제공합니다.",
  },
  {
    q: "학원이나 학교에서 단체로 사용할 수 있나요?",
    a: "네, Academy 플랜은 기관 전용으로 설계되었습니다. 반 관리, 과제 일괄 배포, 학부모 리포트 연동 등 기관 운영에 최적화된 기능을 제공합니다. 별도 상담을 통해 맞춤 견적을 안내드립니다.",
  },
  {
    q: "결제와 환불은 어떻게 되나요?",
    a: "Pro 플랜은 월 단위 자동 결제이며, 3개월(10% 할인)과 12개월(30% 할인) 장기 결제도 가능합니다. 결제일로부터 7일 이내 환불이 가능하며, 이후에는 잔여 기간에 대한 부분 환불이 적용됩니다.",
  },
  {
    q: "씨앗과 수확물은 무엇인가요?",
    a: "씨앗은 학습 활동을 완료할 때마다 획득하는 보상 포인트입니다. 모은 씨앗으로 다양한 수확물(아이템)을 교환할 수 있고, 수확물 점수가 시즌 랭킹에 반영됩니다. 1:1 대결에서 씨앗을 걸고 승부할 수도 있습니다.",
  },
  {
    q: "학부모도 사용할 수 있나요?",
    a: "네, 학부모 계정을 통해 자녀의 학습 현황과 성적 리포트를 확인할 수 있습니다. 기관에서 제공하는 학부모 연동 기능을 통해 실시간으로 학습 진행 상황을 공유받을 수 있습니다.",
  },
];

/* ── 실제 페이지 미리보기 ── */

const SAMPLE_CHAPTERS = [
  { id: 1, num: 1, title: "어휘의 기초", desc: "낱말의 뜻과 쓰임", progress: 100, status: "passed" },
  { id: 2, num: 2, title: "맞춤법과 띄어쓰기", desc: "올바른 표기법 익히기", progress: 65, status: "current" },
  { id: 3, num: 3, title: "문장의 구조", desc: "주어와 서술어의 관계", progress: 0, status: "locked" },
  { id: 4, num: 4, title: "독해의 기본", desc: "글의 중심 내용 파악", progress: 0, status: "locked" },
  { id: 5, num: 5, title: "논리적 사고", desc: "근거와 주장의 관계", progress: 0, status: "locked" },
];

function ProModePreview() {
  const getBadge = (status) => {
    if (status === "passed") return <span className="pro-badge passed">통과</span>;
    if (status === "current") return <span className="pro-badge current">진행중</span>;
    return (
      <span className="pro-badge locked">
        <span className="material-symbols-outlined pro-badge-lock-icon">lock</span>
        잠김
      </span>
    );
  };

  return (
    <div className="landing-preview-frame">
      <div className="landing-preview-scale">
        <div className="pro" style={{ minHeight: "auto", background: "#f8fafc" }}>
          <div className="pro-topbar">
            <div className="pro-topbar-inner">
              <span className="pro-back"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span> 홈</span>
              <h1 className="pro-topbar-title">프로 모드</h1>
            </div>
          </div>
          <div className="pro-body" style={{ padding: "16px 20px" }}>
            <div className="pro-hero"><h2>프로 모드 학습</h2><p>챕터를 순서대로 학습하고 테스트를 통과하세요.</p></div>
            <table className="pro-table">
              <thead>
                <tr>
                  <th className="pro-th-num">번호</th>
                  <th>챕터</th>
                  <th className="pro-th-progress">진행률</th>
                  <th className="pro-th-status">상태</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_CHAPTERS.map((ch) => (
                  <tr key={ch.id} className={`pro-row ${ch.status}`}>
                    <td>{ch.num}</td>
                    <td><strong>{ch.title}</strong><span className="pro-chapter-desc">{ch.desc}</span></td>
                    <td>
                      <div className="pro-progress-bar"><div className="pro-progress-fill" style={{ width: `${ch.progress}%` }} /></div>
                      <span className="pro-progress-label">{ch.progress}%</span>
                    </td>
                    <td>{getBadge(ch.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FarmModePreview() {
  return (
    <div className="landing-preview-frame">
      <div className="landing-preview-scale">
        <div className="farm" style={{ minHeight: "auto", background: "linear-gradient(135deg, rgba(250,248,246,0.95), rgba(255,238,222,0.95))" }}>
          <div className="farm-topbar">
            <div className="farm-topbar-inner">
              <span className="farm-back"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span> 돌아가기</span>
              <h1 className="farm-topbar-title">농장별 모드</h1>
            </div>
          </div>
          <div className="farm-hero"><h2>나의 농장을 선택하세요</h2><p>영역별로 분류된 학습 콘텐츠를 탐색합니다</p></div>
          <div className="farm-grid" style={{ paddingBottom: 24 }}>
            {FARM_LIST.map((farm) => (
              <div key={farm.id} className="farm-card" style={{ cursor: "default" }}>
                <div className="farm-card-icon">{farm.emoji}</div>
                <div className="farm-card-body">
                  <p className="farm-card-name">{farm.name}</p>
                  <p className="farm-card-desc">{farm.description}</p>
                  <span className="farm-card-count" style={{ background: farm.color }}>학습 12개</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportPreview() {
  const summaryCards = [
    { label: "총 활동", value: "42", sub: "회" },
    { label: "평균 점수", value: "87.5", sub: "점" },
    { label: "학습 일수", value: "18", sub: "일" },
    { label: "최강 영역", value: "어휘", sub: "" },
    { label: "최약 영역", value: "논리", sub: "" },
  ];
  const labels = ["어휘", "문법", "독해", "논리", "서술"];
  const scores = [85, 70, 90, 55, 75];
  const cx = 120, cy = 110, r = 80;
  const angles = labels.map((_, i) => (Math.PI * 2 * i) / labels.length - Math.PI / 2);
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className="landing-preview-frame">
      <div className="landing-preview-scale">
        <div style={{ background: "radial-gradient(circle at top, #18231a, #0f1410)", minHeight: 600, padding: "20px 16px", color: "#f3f6f1" }}>
          <div className="ur-header"><h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>통합 성적표</h1></div>
          <div className="ur-summary-row">
            {summaryCards.map((c) => (
              <div key={c.label} className="ur-summary-card">
                <div className="ur-card-label">{c.label}</div>
                <div className="ur-card-value">{c.value}</div>
                {c.sub && <div className="ur-card-sub">{c.sub}</div>}
              </div>
            ))}
          </div>
          <div className="ur-radar-wrap">
            <h3>영역별 성취도</h3>
            <svg viewBox="0 0 240 230" style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }}>
              {gridLevels.map((lv) => (
                <polygon key={lv} points={angles.map((a) => `${cx + r * lv * Math.cos(a)},${cy + r * lv * Math.sin(a)}`).join(" ")} fill="none" stroke="rgba(163,182,169,0.15)" strokeWidth="1" />
              ))}
              {angles.map((a, i) => (
                <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="rgba(163,182,169,0.15)" strokeWidth="1" />
              ))}
              <polygon
                points={angles.map((a, i) => `${cx + r * (scores[i] / 100) * Math.cos(a)},${cy + r * (scores[i] / 100) * Math.sin(a)}`).join(" ")}
                fill="rgba(240,108,36,0.2)" stroke="rgba(240,108,36,0.8)" strokeWidth="2"
              />
              {angles.map((a, i) => {
                const px = cx + r * (scores[i] / 100) * Math.cos(a);
                const py = cy + r * (scores[i] / 100) * Math.sin(a);
                return <circle key={`p${i}`} cx={px} cy={py} r="4" fill="rgba(240,108,36,1)" />;
              })}
              {angles.map((a, i) => (
                <text key={`l${i}`} x={cx + (r + 18) * Math.cos(a)} y={cy + (r + 18) * Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#f3f6f1" fontWeight="bold">{labels[i]}</text>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPreview() {
  const cards = [
    { label: "오늘 가입자", value: "3" },
    { label: "활성 사용자", value: "127" },
    { label: "전체 사용자", value: "584" },
    { label: "활성 기관", value: "12" },
  ];
  const extraCards = [
    { label: "오늘 학습 참여", value: "89" },
    { label: "승인 대기", value: "5" },
    { label: "학부모 연결 대기", value: "2" },
    { label: "최근 7일 시험 응시", value: "156" },
  ];
  return (
    <div className="landing-preview-frame">
      <div className="landing-preview-scale">
        <div className="admin-page" style={{ minHeight: "auto" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 20px" }}>
            <div className="admin-topbar" style={{ marginBottom: 16 }}>
              <div><h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>운영 대시보드</h1><p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--admin-muted)" }}>오늘의 운영 지표와 처리 현황을 확인하세요.</p></div>
            </div>
            <section className="admin-summary">
              {cards.map((item) => (
                <div className="admin-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </section>
            <section className="admin-summary" style={{ marginTop: 0 }}>
              {extraCards.map((item) => (
                <div className="admin-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </section>
            <section className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <div className="admin-card">
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>빠른 이동</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="admin-action">기관 관리</span>
                  <span className="admin-action">학생 관리</span>
                  <span className="admin-action">콘텐츠 관리</span>
                </div>
              </div>
              <div className="admin-card">
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>관리 메뉴</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="admin-action">과제/피드백</span>
                  <span className="admin-action">시즌 관리</span>
                  <span className="admin-action">상점 관리</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURE_PREVIEWS = [ProModePreview, FarmModePreview, ReportPreview, AdminPreview];

/* ── 메인 컴포넌트 ── */

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === "HQ_ADMIN" || r === "ORG_ADMIN");

  return (
    <div className="landing-page">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <div className="landing-wrap landing-nav-inner">
          <div className="landing-brand" aria-label="국어농장">
            <img
              className="landing-logo"
              src={import.meta.env.BASE_URL + "korfarm-logo.png"}
              alt="국어농장"
            />
          </div>
          <div className="landing-nav-links">
            <a href="#program">학습 흐름</a>
            <a href="#features">핵심 기능</a>
            <a href="#pricing">요금 안내</a>
            <a href="#faq">자주 묻는 질문</a>
            <a href="#contact">상담 문의</a>
            <Link to="/shop">쇼핑몰</Link>
          </div>
          {isLoggedIn ? (
            <div className="landing-nav-auth">
              <Link className="landing-nav-cta" to={isAdmin ? "/admin" : "/start"}>{isAdmin ? "관리하기" : "학습하기"}</Link>
              <button className="landing-nav-logout" onClick={logout}>로그아웃</button>
            </div>
          ) : (
            <Link className="landing-nav-cta" to="/login">로그인</Link>
          )}
          <button
            className="landing-hamburger"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="메뉴 열기"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            <a href="#program" onClick={() => setMobileMenuOpen(false)}>학습 흐름</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>핵심 기능</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>요금 안내</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>자주 묻는 질문</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>상담 문의</a>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>쇼핑몰</Link>
            {isLoggedIn ? (
              <>
                <Link className="landing-mobile-login" to={isAdmin ? "/admin" : "/start"} onClick={() => setMobileMenuOpen(false)}>{isAdmin ? "관리하기" : "학습하기"}</Link>
                <button className="landing-mobile-logout" onClick={() => { setMobileMenuOpen(false); logout(); }}>로그아웃</button>
              </>
            ) : (
              <Link className="landing-mobile-login" to="/login" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
            )}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-wrap">
          <div className="landing-hero-content">
            <span className="landing-pill landing-display">
              초등~고등 국어 전문 학습 플랫폼
            </span>
            <h1 className="landing-display landing-hero-title">
              <span className="landing-hero-title-line">스스로 완성하는 국어 근육,</span>
              <span className="landing-hero-title-line">국어농장과 함께하세요.</span>
            </h1>
            <p>
              어휘력·문해력·논리사고력·문제해결력까지, 12레벨 맞춤형
              커리큘럼과 AI 피드백으로 국어 실력을 키워갑니다.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-btn-primary" to="/login">
                학습 시작하기
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <a className="landing-btn-ghost" href="#pricing">
                요금 안내
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 통계 바 ── */}
      <div className="landing-stats-bar">
        <div className="landing-wrap landing-stats-inner">
          <div className="landing-stat"><strong>9</strong><span>학습 영역</span></div>
          <div className="landing-stat"><strong>12</strong><span>레벨 체계</span></div>
          <div className="landing-stat"><strong>180+</strong><span>챕터</span></div>
          <div className="landing-stat"><strong>AI</strong><span>자동 채점</span></div>
        </div>
      </div>

      {/* ── 학습 흐름 ── */}
      <section className="landing-section" id="program">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">학습은 이렇게 진행됩니다</h2>
            <p>진단부터 보상까지, 체계적인 4단계 학습 흐름을 경험하세요.</p>
          </div>
          <div className="landing-flow">
            {LEARNING_FLOW.map((item) => (
              <div className="landing-flow-step" key={item.step}>
                <div className="landing-flow-number">{item.step}</div>
                <div className="landing-flow-body">
                  <div className="landing-flow-head">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <p>{item.desc}</p>
                  <div className="landing-flow-tags">
                    {item.tags.map((tag) => (<span key={tag} className="landing-tag">{tag}</span>))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 핵심 기능 상세 ── */}
      <section className="landing-section landing-features-deep" id="features">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">핵심 기능을 소개합니다</h2>
            <p>국어농장만의 차별화된 학습 시스템을 자세히 살펴보세요.</p>
          </div>
          <div className="landing-deep-list">
            {DEEP_FEATURES.map((feat, idx) => {
              const Preview = FEATURE_PREVIEWS[idx];
              return (
                <div className={`landing-deep-item ${idx % 2 === 1 ? "reverse" : ""}`} key={feat.title}>
                  <div className="landing-deep-text">
                    <div className="landing-deep-icon-title">
                      <span className="material-symbols-outlined">{feat.icon}</span>
                      <div>
                        <h3>{feat.title}</h3>
                        <span className="landing-deep-subtitle">{feat.subtitle}</span>
                      </div>
                    </div>
                    <p>{feat.desc}</p>
                    <div className="landing-deep-highlights">
                      {feat.highlights.map((h) => (<span key={h} className="landing-tag">{h}</span>))}
                    </div>
                  </div>
                  <div className="landing-deep-visual">
                    <Preview />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 보상 시스템 ── */}
      <section className="landing-section landing-gamification">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">꾸준함을 만드는 보상 시스템</h2>
            <p>보상과 경쟁으로 학습 동기를 끌어올립니다.</p>
          </div>
          <div className="landing-game-grid">
            {GAMIFICATION.map((item) => (
              <div className="landing-game-card" key={item.title}>
                <div className="landing-game-icon">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 요금 안내 ── */}
      <section className="landing-section landing-pricing" id="pricing">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">요금 안내</h2>
            <p>학습 규모와 목적에 맞춰 선택할 수 있습니다.</p>
          </div>
          <div className="landing-pricing-grid">
            {PLANS.map((plan) => (
              <div
                className={`landing-plan ${plan.featured ? "featured" : ""}`}
                key={plan.title}
              >
                {plan.featured && <span className="landing-plan-badge">추천</span>}
                <div>
                  <span className="landing-pill landing-display">{plan.tag}</span>
                  <h3 className="landing-display">{plan.title}</h3>
                </div>
                <div className="landing-plan-price-row">
                  {plan.isAcademy ? (
                    <span className="landing-plan-price landing-display">{plan.price}</span>
                  ) : (
                    <>
                      <span className="landing-plan-price landing-display">{plan.price}</span>
                      <span>원 / {plan.subtitle}</span>
                    </>
                  )}
                </div>
                {plan.discount && (
                  <div className="landing-plan-discount">{plan.discount}</div>
                )}
                <ul>
                  {plan.perks.map((perk) => (
                    <li key={perk}>
                      <span className="material-symbols-outlined">check_circle</span>
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link to={plan.isAcademy ? "#contact" : "/login"}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="landing-section landing-faq" id="faq">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">자주 묻는 질문</h2>
            <p>궁금한 점을 빠르게 확인하세요.</p>
          </div>
          <div className="landing-faq-list">
            {FAQ_ITEMS.map((item) => (
              <details className="landing-faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA + 문의 ── */}
      <section className="landing-cta" id="contact">
        <div className="landing-cta-inner landing-wrap">
          <div className="landing-cta-text">
            <h2 className="landing-display">지금, 국어농장을 시작해 보세요.</h2>
            <p>학교와 학원을 위한 맞춤 안내를 도와드립니다.</p>
            <Link className="landing-btn-primary" to="/login">
              학습 시작하기
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <div className="landing-contact-info">
            <h3>문의 안내</h3>
            <p>도입 상담이나 궁금한 점은 아래로 연락주세요.</p>
            <div className="landing-contact-methods">
              <a href="tel:010-8950-0655" className="landing-contact-method">
                <span className="material-symbols-outlined">call</span>
                <div><strong>전화 문의</strong><span>010-8950-0655</span></div>
              </a>
              <a href="mailto:contact@korfarm.com" className="landing-contact-method">
                <span className="material-symbols-outlined">mail</span>
                <div><strong>이메일 문의</strong><span>contact@korfarm.com</span></div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-wrap landing-footer-grid">
          <div>
            <div className="landing-brand" aria-label="국어농장">
              <img className="landing-logo" src={import.meta.env.BASE_URL + "korfarm-logo.png"} alt="국어농장" />
            </div>
            <p>국어 학습의 출발부터 성취까지, 국어농장이 함께 성장합니다.</p>
          </div>
          <div className="landing-footer-nav">
            <div><h4>서비스</h4><a href="#program">학습 흐름</a><a href="#features">핵심 기능</a><a href="#faq">자주 묻는 질문</a></div>
            <div><h4>지원</h4><a href="#contact">상담 문의</a><Link to="/shop">쇼핑몰</Link></div>
            <div><h4>법적 고지</h4><Link to="/terms">이용약관</Link><Link to="/privacy">개인정보처리방침</Link></div>
          </div>
        </div>
        <div className="landing-wrap landing-footer-bottom">
          <p>&copy; 2026 국어농장. All rights reserved.</p>
          <p className="landing-footer-biz">상호: (주)디셈버글로리 | 대표: 박종찬 | 사업자등록번호: 226-86-00815 | 통신판매업신고: 제2021-부산해운대-0501호</p>
          <p className="landing-footer-biz">주소: 부산광역시 해운대구 세실로27번길 21 원재프라자 8층 | 연락처: 010-8950-0655</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
