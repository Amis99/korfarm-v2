import { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/pricing.css";

const PLANS = [
  {
    tag: "무료",
    title: "Basic",
    price: "0",
    subtitle: "월",
    perks: [
      "오늘의 퀴즈",
      "오늘의 독해",
      "대결 모드",
      "기본 랭킹 참여",
      "커뮤니티 이용",
      "진단 테스트 1회 (10대 역량 진단)",
    ],
    cta: "무료로 시작하기",
    linkTo: "/login",
  },
  {
    tag: "인기",
    title: "Pro",
    price: "65,000",
    subtitle: "월",
    perks: [
      "Basic 전체 포함",
      "프로 모드 전체 (240챕터)",
      "농장 모드 전체 (9영역)",
      "AI 자동 채점",
      "과제 시스템",
      "테스트 창고",
      "통합 성적표",
      "스터디 스케줄",
      "문법 트레이닝",
      "수확물 보상 확대",
    ],
    cta: "Pro 구독하기",
    linkTo: "/subscription",
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
    linkTo: "/#contact",
    isAcademy: true,
  },
];

const COMPARE_ROWS = [
  { feature: "오늘의 퀴즈/독해", basic: true, pro: true, academy: true },
  { feature: "대결 모드", basic: true, pro: true, academy: true },
  { feature: "진단 테스트 (1회)", basic: true, pro: true, academy: true },
  { feature: "기본 랭킹 참여", basic: true, pro: true, academy: true },
  { feature: "커뮤니티", basic: true, pro: true, academy: true },
  { feature: "프로 모드 (240챕터)", basic: false, pro: true, academy: true },
  { feature: "농장별 모드 (9영역)", basic: false, pro: true, academy: true },
  { feature: "AI 자동 채점", basic: false, pro: true, academy: true },
  { feature: "과제 시스템", basic: false, pro: true, academy: true },
  { feature: "테스트 창고", basic: false, pro: true, academy: true },
  { feature: "통합 성적표", basic: false, pro: true, academy: true },
  { feature: "스터디 스케줄", basic: false, pro: true, academy: true },
  { feature: "문법 트레이닝", basic: false, pro: true, academy: true },
  { feature: "기관 관리 대시보드", basic: false, pro: false, academy: true },
  { feature: "반 관리 / 과제 배포", basic: false, pro: false, academy: true },
  { feature: "학부모 연동 리포트", basic: false, pro: false, academy: true },
];

const PRO_DETAILS = [
  { icon: "menu_book", title: "프로 모드", desc: "240챕터, 6단계 모듈로 체계적 학습", hash: "pro-mode" },
  { icon: "park", title: "농장별 모드", desc: "9개 영역별 전문 농장에서 약점 집중 보강", hash: "farm-mode" },
  { icon: "smart_toy", title: "AI 채점 + 성적표", desc: "자동 채점, 레이더 차트, 학습 추이 분석", hash: "ai-scoring" },
  { icon: "edit_note", title: "문법 트레이닝", desc: "단어형성·문장짜임·음운변동·품사 연습", hash: "grammar" },
  { icon: "event_note", title: "스터디 스케줄", desc: "할일 관리 + 캘린더로 학습 일정 관리", hash: "study-schedule" },
  { icon: "quiz", title: "10대 역량 진단", desc: "진단 테스트로 역량별 상세 분석", hash: "diagnostic" },
];

function PricingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pricing-page">
      {/* 히어로 */}
      <div className="pricing-hero">
        <div className="pricing-wrap">
          <Link to="/" className="pricing-home-link">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            홈으로
          </Link>
          <h1>요금 안내</h1>
          <p>학습 규모와 목적에 맞춰 최적의 플랜을 선택하세요.</p>
        </div>
      </div>

      {/* 플랜 카드 */}
      <div className="pricing-plans">
        <div className="pricing-wrap">
          <div className="pricing-plans-grid">
            {PLANS.map((plan) => (
              <div className={`pricing-plan-card ${plan.featured ? "featured" : ""}`} key={plan.title}>
                {plan.featured && <span className="pricing-plan-badge">추천</span>}
                <div>
                  <span className="pricing-plan-tag">{plan.tag}</span>
                  <h3>{plan.title}</h3>
                </div>
                <div className="pricing-plan-price-row">
                  {plan.isAcademy ? (
                    <span className="pricing-plan-price">{plan.price}</span>
                  ) : (
                    <>
                      <span className="pricing-plan-price">{plan.price}</span>
                      <span>원 / {plan.subtitle}</span>
                    </>
                  )}
                </div>
                {plan.discount && (
                  <div className="pricing-plan-discount">{plan.discount}</div>
                )}
                <ul>
                  {plan.perks.map((perk) => (
                    <li key={perk}>
                      <span className="material-symbols-outlined">check_circle</span>
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link to={plan.linkTo}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 기능 비교 테이블 */}
      <div className="pricing-compare">
        <div className="pricing-wrap">
          <h2>플랜별 기능 비교</h2>
          <p>각 플랜에서 제공하는 기능을 비교해 보세요.</p>
          <div className="pricing-table-scroll">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>기능</th>
                  <th>Basic</th>
                  <th>Pro</th>
                  <th>Academy</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td>{row.basic ? <span className="pricing-check">O</span> : <span className="pricing-cross">X</span>}</td>
                    <td>{row.pro ? <span className="pricing-check">O</span> : <span className="pricing-cross">X</span>}</td>
                    <td>{row.academy ? <span className="pricing-check">O</span> : <span className="pricing-cross">X</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pro 혜택 상세 */}
      <div className="pricing-pro-detail">
        <div className="pricing-wrap">
          <h2>Pro 플랜 주요 기능</h2>
          <div className="pricing-pro-grid">
            {PRO_DETAILS.map((item) => (
              <div className="pricing-pro-item" key={item.hash}>
                <h4>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.title}
                </h4>
                <p>{item.desc}</p>
                <Link to={`/about`}>자세히 보기 →</Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 할인 안내 */}
      <div className="pricing-discount-section">
        <div className="pricing-wrap">
          <h2>장기 결제 할인</h2>
          <div className="pricing-discount-cards">
            <div className="pricing-discount-card">
              <strong>10%</strong>
              <span>3개월 결제 시</span>
            </div>
            <div className="pricing-discount-card">
              <strong>30%</strong>
              <span>12개월 결제 시</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 CTA */}
      <div className="pricing-cta">
        <div className="pricing-wrap">
          <h2>지금 시작하세요</h2>
          <p>무료 Basic 플랜으로 국어농장을 경험해 보세요.</p>
          <div className="pricing-cta-actions">
            <Link to="/login" className="pricing-btn-primary">무료로 시작하기</Link>
            <Link to="/subscription" className="pricing-btn-ghost">Pro 구독하기</Link>
            <Link to="/#contact" className="pricing-btn-ghost">기관 상담</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
