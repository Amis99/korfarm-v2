import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/landing.css";

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
    desc: "AI가 서술형 답안까지 자동 채점하고, 영역별 성취도를 레이더 차트로 시각화합니다. 학습 추이와 취약점을 한눈에 파악할 수 있습니다.",
    highlights: ["서술형 자동 채점", "레이더 차트", "학습 추이 분석"],
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
    cta: "7일 무료 체험",
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

const TESTIMONIALS = [
  {
    role: "학부모",
    name: "김OO 학부모",
    text: "아이가 스스로 국어 공부를 하겠다고 하는 걸 처음 봤어요. 게임처럼 즐기면서도 실력이 확실히 늘었습니다.",
  },
  {
    role: "학원 원장",
    name: "박OO 원장",
    text: "반별 과제 배포와 성적표 기능 덕분에 관리 시간이 절반으로 줄었습니다. 학부모 상담 자료로도 활용하고 있어요.",
  },
  {
    role: "학생",
    name: "이OO 학생 (초5)",
    text: "씨앗 모으는 게 너무 재밌어요! 친구랑 대결하려고 매일 공부하게 돼요. 국어 성적도 많이 올랐어요.",
  },
];

const FAQ_ITEMS = [
  {
    q: "어떤 학년에 적합한가요?",
    a: "초등 1학년부터 중등 3학년까지 총 12레벨로 구성되어 있습니다. 진단 테스트를 통해 학년과 무관하게 실력에 맞는 레벨에 배정됩니다.",
  },
  {
    q: "무료로 어디까지 이용할 수 있나요?",
    a: "Basic 플랜에서는 매일 제공되는 '오늘의 퀴즈'와 '오늘의 독해', 기본 랭킹 참여, 커뮤니티 이용, 그리고 진단 테스트 1회를 무료로 이용할 수 있습니다.",
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
];

/* ── 컴포넌트 ── */

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn } = useAuth();

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
          <Link className="landing-nav-cta" to={isLoggedIn ? "/start" : "/login"}>
            {isLoggedIn ? "학습하기" : "로그인"}
          </Link>
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
            <Link className="landing-mobile-login" to={isLoggedIn ? "/start" : "/login"} onClick={() => setMobileMenuOpen(false)}>
              {isLoggedIn ? "학습하기" : "로그인"}
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-wrap">
          <div className="landing-hero-content">
            <span className="landing-pill landing-display">
              초등~중등 국어 전문 학습 플랫폼
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
                7일 무료 체험
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
          <div className="landing-stat">
            <strong>9</strong>
            <span>학습 영역</span>
          </div>
          <div className="landing-stat">
            <strong>12</strong>
            <span>레벨 체계</span>
          </div>
          <div className="landing-stat">
            <strong>180+</strong>
            <span>챕터</span>
          </div>
          <div className="landing-stat">
            <strong>AI</strong>
            <span>자동 채점</span>
          </div>
        </div>
      </div>

      {/* ── Social Proof ── */}
      <section className="landing-social-proof">
        <div className="landing-wrap landing-social-proof-inner">
          <div className="landing-proof-item">
            <span className="material-symbols-outlined">apartment</span>
            <span>00+개 기관 도입</span>
          </div>
          <div className="landing-proof-item">
            <span className="material-symbols-outlined">group</span>
            <span>누적 학습자 0,000명</span>
          </div>
          <div className="landing-proof-item">
            <span className="material-symbols-outlined">thumb_up</span>
            <span>학부모 만족도 4.8/5.0</span>
          </div>
        </div>
      </section>

      {/* ── 학습 흐름 (프로그램 대체) ── */}
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
                    {item.tags.map((tag) => (
                      <span key={tag} className="landing-tag">{tag}</span>
                    ))}
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
            {DEEP_FEATURES.map((feat, idx) => (
              <div
                className={`landing-deep-item ${idx % 2 === 1 ? "reverse" : ""}`}
                key={feat.title}
              >
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
                    {feat.highlights.map((h) => (
                      <span key={h} className="landing-tag">{h}</span>
                    ))}
                  </div>
                </div>
                <div className="landing-deep-visual">
                  <span className="material-symbols-outlined">{feat.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 게임화 시스템 ── */}
      <section className="landing-section landing-gamification">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">게임처럼 즐기는 국어 학습</h2>
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

      {/* ── 후기 ── */}
      <section className="landing-section landing-testimonials">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">사용자 후기</h2>
            <p>국어농장과 함께 성장한 분들의 이야기입니다.</p>
          </div>
          <div className="landing-testimonial-grid">
            {TESTIMONIALS.map((t) => (
              <div className="landing-testimonial-card" key={t.name}>
                <div className="landing-testimonial-role">{t.role}</div>
                <p>&ldquo;{t.text}&rdquo;</p>
                <strong>{t.name}</strong>
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

      {/* ── CTA + 문의 폼 ── */}
      <section className="landing-cta" id="contact">
        <div className="landing-cta-inner landing-wrap">
          <div className="landing-cta-text">
            <h2 className="landing-display">지금, 국어농장을 시작해 보세요.</h2>
            <p>학교와 학원을 위한 맞춤 안내를 도와드립니다.</p>
            <Link className="landing-btn-primary" to="/login">
              7일 무료 체험
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <form
            className="landing-contact-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const body = [...fd.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
              window.location.href = `mailto:contact@korfarm.com?subject=국어농장 문의&body=${encodeURIComponent(body)}`;
            }}
          >
            <h3>문의하기</h3>
            <input name="이름" placeholder="이름" required />
            <input name="연락처" placeholder="연락처 (전화번호 또는 이메일)" required />
            <select name="유형" required>
              <option value="">문의 유형 선택</option>
              <option value="학원/기관 도입">학원/기관 도입</option>
              <option value="개인 학습 문의">개인 학습 문의</option>
              <option value="제휴/협력">제휴/협력</option>
              <option value="기타">기타</option>
            </select>
            <textarea name="메시지" placeholder="문의 내용을 입력하세요" rows="4" />
            <button type="submit">문의 보내기</button>
          </form>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-wrap landing-footer-grid">
          <div>
            <div className="landing-brand" aria-label="국어농장">
              <img
                className="landing-logo"
                src={import.meta.env.BASE_URL + "korfarm-logo.png"}
                alt="국어농장"
              />
            </div>
            <p>국어 학습의 출발부터 성취까지, 국어농장이 함께 성장합니다.</p>
          </div>
          <div className="landing-footer-nav">
            <div>
              <h4>서비스</h4>
              <a href="#program">학습 흐름</a>
              <a href="#features">핵심 기능</a>
              <a href="#pricing">요금 안내</a>
            </div>
            <div>
              <h4>지원</h4>
              <a href="#faq">자주 묻는 질문</a>
              <a href="#contact">상담 문의</a>
              <Link to="/shop">쇼핑몰</Link>
            </div>
            <div>
              <h4>운영</h4>
              <Link to="/admin">본사 관리자</Link>
              <Link to="/ops">기관 관리자</Link>
            </div>
          </div>
        </div>
        <div className="landing-wrap landing-footer-bottom">
          <p>© 2026 국어농장. All rights reserved.</p>
          <p className="landing-footer-biz">
            사업자 정보 | 상호: (주)국어농장 | 대표: OOO | 사업자등록번호: 000-00-00000 | 통신판매업신고: 제0000-서울OO-0000호
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
