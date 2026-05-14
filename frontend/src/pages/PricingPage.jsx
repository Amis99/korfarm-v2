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
      "최대 10명 멀티 대결",
      "기본 랭킹 참여",
      "커뮤니티 이용",
      "진단 테스트 1회 (10대 역량, 평생 1회)",
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
      "프로 모드 전체 (최대 240챕터)",
      "11개 농장 모드 전체",
      "AI 학생 튜터",
      "AI 자동 채점·글쓰기 첨삭",
      "통합 분석표 + AI 총평·추천",
      "과제 시스템 · 테스트 창고",
      "문법 트레이닝",
      "작물 보상 확대",
    ],
    cta: "Pro 구독하기",
    linkTo: "/subscription",
    featured: true,
    discount: "1·3·6·12개월 선택 · 3개월 10% · 6개월 20% · 12개월 30% 할인",
  },
  {
    tag: "기관",
    title: "Academy",
    price: "별도 문의",
    subtitle: "",
    perks: [
      "Pro 전체 포함",
      "기관 관리 대시보드",
      "반 관리 · 과제 일괄 배포",
      "AI 운영자 비서 · AI 시험 출제",
      "학부모 연동 리포트",
    ],
    cta: "상담 문의",
    linkTo: "/#contact",
    isAcademy: true,
  },
];

const COMPARE_ROWS = [
  { feature: "오늘의 퀴즈/독해", basic: true, pro: true, academy: true },
  { feature: "멀티 대결 (최대 10명)", basic: true, pro: true, academy: true },
  { feature: "진단 테스트 (평생 1회)", basic: true, pro: true, academy: true },
  { feature: "기본 랭킹 참여", basic: true, pro: true, academy: true },
  { feature: "커뮤니티", basic: true, pro: true, academy: true },
  { feature: "프로 모드 (최대 240챕터)", basic: false, pro: true, academy: true },
  { feature: "농장별 모드 (11개 농장)", basic: false, pro: true, academy: true },
  { feature: "AI 학생 튜터", basic: false, pro: true, academy: true },
  { feature: "AI 자동 채점 · 글쓰기 첨삭", basic: false, pro: true, academy: true },
  { feature: "통합 분석표 + AI 총평·추천", basic: false, pro: true, academy: true },
  { feature: "과제 시스템 · 테스트 창고", basic: false, pro: true, academy: true },
  { feature: "문법 트레이닝", basic: false, pro: true, academy: true },
  { feature: "기관 관리 대시보드", basic: false, pro: false, academy: true },
  { feature: "반 관리 · 과제 일괄 배포", basic: false, pro: false, academy: true },
  { feature: "AI 운영자 비서 · AI 시험 출제", basic: false, pro: false, academy: true },
  { feature: "학부모 연동 리포트", basic: false, pro: false, academy: true },
];

const PRO_DETAILS = [
  { icon: "menu_book", title: "프로 모드", desc: "최대 240챕터, 챕터별 학습 모듈 조합", hash: "pro-mode" },
  { icon: "park", title: "농장별 모드", desc: "11개 전문 농장에서 영역별 약점 집중 보강", hash: "farm-mode" },
  { icon: "psychology_alt", title: "AI 학생 튜터", desc: "페르소나 3종 중 선택 — 학습을 함께 챙겨 줍니다", hash: "ai-tutor" },
  { icon: "analytics", title: "통합 분석표 + AI 총평", desc: "10대 역량·영역 통계와 AI 추천 학습까지 한 화면에", hash: "ai-report" },
  { icon: "edit_note", title: "AI 글쓰기 첨삭", desc: "지식과 지혜 게시판의 글을 AI가 즉시 첨삭", hash: "ai-writing" },
  { icon: "quiz", title: "10대 역량 진단", desc: "진단 테스트(1인당 1회)로 역량별 상세 분석", hash: "diagnostic" },
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

      {/* 결제 기간별 안내 */}
      <div className="pricing-discount-section">
        <div className="pricing-wrap">
          <h2>구독 결제 안내</h2>
          <p style={{ color: "#666", marginBottom: 20 }}>1·3·6·12개월 중 원하는 기간을 선택할 수 있습니다.</p>
          <div className="pricing-discount-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <div className="pricing-discount-card">
              <strong>1개월</strong>
              <span>65,000원</span>
            </div>
            <div className="pricing-discount-card">
              <strong>3개월 -10%</strong>
              <span>175,500원</span>
            </div>
            <div className="pricing-discount-card">
              <strong>6개월 -20%</strong>
              <span>312,000원</span>
            </div>
            <div className="pricing-discount-card">
              <strong>12개월 -30%</strong>
              <span>546,000원</span>
            </div>
          </div>
        </div>
      </div>

      {/* 자몽 결제 안내 */}
      <div className="pricing-discount-section" style={{ background: "#fff7ea" }}>
        <div className="pricing-wrap">
          <h2>AI 기능은 '자몽'으로 결제합니다</h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            구독료는 학습 콘텐츠 잠금 해제 비용이고, AI 기능 사용량은 별도로 '자몽'을 충전해 결제합니다.
            학습으로 얻은 작물(수확물)을 1:1로 자몽 환산해 사용할 수도 있습니다.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div className="pricing-discount-card" style={{ textAlign: "left", padding: "18px 22px" }}>
              <strong style={{ fontSize: 18, color: "#e0700f" }}>개인 자몽</strong>
              <p style={{ margin: "6px 0 0", color: "#555", fontSize: 14, lineHeight: 1.6 }}>
                1자몽 250원 · 10,000원 충전 시 40자몽
              </p>
            </div>
            <div className="pricing-discount-card" style={{ textAlign: "left", padding: "18px 22px" }}>
              <strong style={{ fontSize: 18, color: "#e0700f" }}>기관 자몽</strong>
              <p style={{ margin: "6px 0 0", color: "#555", fontSize: 14, lineHeight: 1.6 }}>
                1자몽 200원 · 10,000원 충전 시 50자몽
              </p>
            </div>
            <div className="pricing-discount-card" style={{ textAlign: "left", padding: "18px 22px" }}>
              <strong style={{ fontSize: 18, color: "#3b8c3a" }}>무과금 채팅</strong>
              <p style={{ margin: "6px 0 0", color: "#555", fontSize: 14, lineHeight: 1.6 }}>
                AI 비서·튜터·커뮤니티 채팅은 차감 없음 (채팅 OCR만 월·일 한도 적용)
              </p>
            </div>
          </div>
          <p style={{ marginTop: 16, color: "#999", fontSize: 13 }}>
            ※ 활동별 단가(예: 글쓰기 첨삭 1자몽, OCR 1자몽, 지문 생성 1자몽, 문항 생성 일반 2자몽/고급 8자몽, 학습 통합 4자몽 등)는
            기능 화면에 표시됩니다.
          </p>
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
