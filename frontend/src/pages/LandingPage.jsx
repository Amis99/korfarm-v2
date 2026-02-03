import { Link } from "react-router-dom";
import "../styles/landing.css";

const FEATURES = [
  {
    title: "맞춤형 학습 설계",
    desc: "학년과 수준에 맞춘 진단으로 최적의 학습을 시작합니다.",
    icon: "auto_stories",
  },
  {
    title: "국어 전영역 훈련",
    desc: "어휘, 문해, 논리, 문제 해결까지 전 영역을 한 흐름으로 연결합니다.",
    icon: "psychology",
  },
  {
    title: "관리 효율 향상",
    desc: "학급과 기관 운영을 위한 대시보드와 리포트를 제공합니다.",
    icon: "analytics",
  },
];

const PLANS = [
  {
    tag: "무료",
    title: "Basic",
    price: "0",
    subtitle: "월",
    perks: ["오늘의 무료 학습", "기본 랭킹 참여", "커뮤니티 이용"],
    cta: "시작하기",
  },
  {
    tag: "유료",
    title: "Pro",
    price: "9,900",
    subtitle: "월",
    perks: [
      "맞춤형 학습 로드맵",
      "AI 학습 피드백",
      "무제한 과제",
      "수확물 보상 확대",
    ],
    cta: "무료 체험",
    featured: true,
  },
];

function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-wrap landing-nav-inner">
          <div className="landing-brand" aria-label="국어농장">
            <img className="landing-logo" src={import.meta.env.BASE_URL + "korfarm-logo.png"} alt="국어농장" />
          </div>
          <div className="landing-nav-links">
            <a href="#program">프로그램</a>
            <a href="#pricing">요금 안내</a>
            <a href="#contact">상담 문의</a>
            <Link to="/shop">쇼핑몰</Link>
          </div>
          <Link className="landing-nav-cta" to="/login">
            로그인
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-wrap">
          <div className="landing-hero-content">
            <span className="landing-pill landing-display">KORFARM EDUCATION</span>
            <h1 className="landing-display landing-hero-title">
              <span className="landing-hero-title-line">스스로 완성하는 국어 근육,</span>
              <span className="landing-hero-title-line">국어농장과 함께하세요.</span>
            </h1>
            <p>
              학년별 12레벨 맞춤형 학습과 실시간 관리까지, 국어농장이 함께합니다.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-btn-primary" to="/login">
                시작하기
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <a className="landing-btn-ghost" href="#pricing">
                요금 안내
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="program">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display landing-title-nowrap">
              어휘력도 문해력도 논리사고력도 문제해결력도
            </h2>
            <p>국어 전영역을 관통하는 독보적인 훈련 프로그램을 만나보세요.</p>
          </div>
          <div className="landing-feature-grid">
            {FEATURES.map((feature) => (
              <div className="landing-feature" key={feature.title}>
                <div className="landing-feature-icon">
                  <span className="material-symbols-outlined">{feature.icon}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                {plan.featured ? <span className="landing-plan-badge">추천</span> : null}
                <div>
                  <span className="landing-pill landing-display">{plan.tag}</span>
                  <h3 className="landing-display">{plan.title}</h3>
                </div>
                <div>
                  <span className="landing-plan-price landing-display">{plan.price}</span>
                  <span>원 / {plan.subtitle}</span>
                </div>
                <ul>
                  {plan.perks.map((perk) => (
                    <li key={perk}>
                      <span className="material-symbols-outlined">check_circle</span>
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link to="/login">{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta" id="contact">
        <div className="landing-cta-inner landing-wrap">
          <h2 className="landing-display">지금, 국어농장을 시작해 보세요.</h2>
          <p>학교와 학원을 위한 맞춤 안내를 도와드립니다.</p>
          <Link className="landing-btn-primary" to="/login">
            7일 무료 체험
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap landing-footer-grid">
          <div>
            <div className="landing-brand" aria-label="국어농장">
              <img className="landing-logo" src={import.meta.env.BASE_URL + "korfarm-logo.png"} alt="국어농장" />
            </div>
            <p>
              국어 학습의 출발부터 성취까지, 국어농장이 함께 성장합니다.
            </p>
          </div>
          <div className="landing-footer-nav">
            <div>
              <h4>서비스</h4>
              <a href="#">학습 프로그램</a>
              <a href="#">학습 진단</a>
              <a href="#">랭킹 시스템</a>
            </div>
            <div>
              <h4>지원</h4>
              <a href="#">자주 묻는 질문</a>
              <a href="#">1:1 문의</a>
              <a href="#">자료 다운로드</a>
            </div>
            <div>
              <h4>운영</h4>
              <Link to="/admin">본사 관리자</Link>
              <Link to="/ops">기관 관리자</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
