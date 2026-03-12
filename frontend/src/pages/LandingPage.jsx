import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { COMPETENCIES, FAQ_ITEMS, PLANS, LEARNING_MODES, TIER_INFO } from "../data/landingData";
import "../styles/landing.css";

const BASE = import.meta.env.BASE_URL + "images/landing/";
const CardImg = ({ src, alt }) => {
  const handleError = useCallback((e) => { e.target.style.display = "none"; }, []);
  return (
    <div className="landing-card-img">
      <img src={BASE + src} alt={alt} loading="lazy" onError={handleError} />
    </div>
  );
};

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
            <a href="#about">프로그램 소개</a>
            <a href="#guide">학습 안내</a>
            <a href="#diagnostic">진단 안내</a>
            <a href="#pricing">요금 안내</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">문의</a>
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
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>프로그램 소개</a>
            <a href="#guide" onClick={() => setMobileMenuOpen(false)}>학습 안내</a>
            <a href="#diagnostic" onClick={() => setMobileMenuOpen(false)}>진단 안내</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>요금 안내</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>문의</a>
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

      {/* ── 섹션 1: 프로그램 소개 ── */}
      <section className="landing-section" id="about">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">국어 실력을 완성하는 시스템</h2>
            <p>국어농장만의 차별화된 학습 체계를 소개합니다.</p>
          </div>
          <div className="landing-card-grid">
            {[
              { icon: "target", title: "10대 핵심 역량", desc: "어휘력부터 선지분석력까지 10가지 역량을 체계적으로 진단하고 훈련합니다.", img: "card-competency.jpg" },
              { icon: "trending_up", title: "12레벨 맞춤 커리큘럼", desc: "초1부터 고3까지 12단계로 세분화하여 실력에 맞는 학습을 제공합니다.", img: "card-levels.jpg" },
              { icon: "smart_toy", title: "AI 자동 채점", desc: "AI가 자동으로 채점하고, 영역별 성취도를 레이더 차트로 분석합니다.", img: "card-ai-grading.jpg" },
              { icon: "emoji_events", title: "보상 시스템", desc: "씨앗·수확물·시즌 랭킹·1:1 대결로 학습 동기를 유지합니다.", img: "card-rewards.jpg" },
            ].map((card) => (
              <div className="landing-card" key={card.title}>
                <CardImg src={card.img} alt={card.title} />
                <div className="landing-card-icon">
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
          <div className="landing-more-wrap">
            <Link to="/about" className="landing-more-link">더 알아보기 <span className="material-symbols-outlined">arrow_forward</span></Link>
          </div>
        </div>
      </section>

      {/* ── 섹션 2: 학습 안내 ── */}
      <section className="landing-section landing-alt-bg" id="guide">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">6가지 학습 모드</h2>
            <p>다양한 학습 방식으로 국어 실력을 키워갑니다.</p>
          </div>
          <div className="landing-mode-grid">
            {LEARNING_MODES.map((mode) => (
              <div className="landing-mode-card" key={mode.title}>
                <CardImg src={mode.img} alt={mode.title} />
                <span className="material-symbols-outlined">{mode.icon}</span>
                <h3>{mode.title}</h3>
                <p>{mode.desc}</p>
              </div>
            ))}
          </div>
          <div className="landing-more-wrap">
            <Link to="/guide" className="landing-more-link">학습 모드 자세히 보기 <span className="material-symbols-outlined">arrow_forward</span></Link>
          </div>
        </div>
      </section>

      {/* ── 섹션 3: 진단 안내 ── */}
      <section className="landing-section" id="diagnostic">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">4서버 12레벨 진단 시스템</h2>
            <p>진단 테스트로 10대 역량을 측정하고 최적 레벨에 배정합니다.</p>
          </div>
          <div className="landing-tier-grid">
            {TIER_INFO.map((tier) => (
              <div className="landing-tier-card" key={tier.name}>
                <CardImg src={tier.img} alt={tier.name} />
                <div className="landing-tier-icon" style={{ background: `${tier.color}20` }}>
                  <span className="material-symbols-outlined" style={{ color: tier.color }}>{tier.icon}</span>
                </div>
                <h3>{tier.name}</h3>
                <span className="landing-tier-levels">레벨 {tier.levels}</span>
                <p>{tier.target}</p>
              </div>
            ))}
          </div>
          <div className="landing-more-wrap">
            <Link to="/diagnostic-info" className="landing-more-link">진단 시스템 자세히 보기 <span className="material-symbols-outlined">arrow_forward</span></Link>
          </div>
        </div>
      </section>

      {/* ── 섹션 4: FAQ ── */}
      <section className="landing-section landing-alt-bg" id="faq">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">자주 묻는 질문</h2>
            <p>궁금한 점을 빠르게 확인하세요.</p>
          </div>
          <div className="landing-faq-list">
            {FAQ_ITEMS.slice(0, 4).map((item) => (
              <details className="landing-faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="landing-more-wrap">
            <Link to="/faq" className="landing-more-link">전체 FAQ 보기 <span className="material-symbols-outlined">arrow_forward</span></Link>
          </div>
        </div>
      </section>

      {/* ── 섹션 5: 구독 안내 ── */}
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
                <Link to={plan.linkTo || "/login"}>{plan.cta}</Link>
              </div>
            ))}
          </div>
          <div className="landing-more-wrap">
            <Link to="/pricing" className="landing-more-link">모든 요금제 상세 보기 <span className="material-symbols-outlined">arrow_forward</span></Link>
          </div>
        </div>
      </section>

      {/* ── 섹션 6: 상담 문의 ── */}
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
              <Link to="/community?board=inquiry" className="landing-contact-method">
                <span className="material-symbols-outlined">forum</span>
                <div><strong>문의 게시판</strong><span>온라인 문의하기</span></div>
              </Link>
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
            <div><h4>서비스</h4><Link to="/about">프로그램 소개</Link><Link to="/guide">학습 안내</Link><Link to="/diagnostic-info">진단 안내</Link><Link to="/pricing">요금 안내</Link></div>
            <div><h4>지원</h4><Link to="/faq">FAQ</Link><a href="#contact">상담 문의</a><Link to="/shop">쇼핑몰</Link></div>
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
