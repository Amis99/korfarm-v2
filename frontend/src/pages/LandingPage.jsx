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
  const [showPaymentNotice, setShowPaymentNotice] = useState(() => {
    try { return !sessionStorage.getItem("paymentNoticeDismissed_v1"); } catch { return true; }
  });
  const dismissPaymentNotice = useCallback(() => {
    setShowPaymentNotice(false);
    try { sessionStorage.setItem("paymentNoticeDismissed_v1", "1"); } catch {}
  }, []);

  return (
    <div className="landing-page">
      {showPaymentNotice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-notice-title"
          onClick={dismissPaymentNotice}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(20, 22, 30, 0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px", backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "480px", width: "100%",
              background: "#fff", borderRadius: "18px",
              padding: "32px 28px 24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              fontFamily: "inherit", lineHeight: 1.65,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 28, color: "#3b8c3a" }}
                aria-hidden="true"
              >
                campaign
              </span>
              <h3
                id="payment-notice-title"
                style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#1a2b1a" }}
              >
                결제 안내 말씀드립니다
              </h3>
            </div>
            <p style={{ margin: "0 0 10px", color: "#3a3a3a", fontSize: "0.97rem" }}>
              안녕하세요. 국어농장을 찾아 주셔서 진심으로 감사드립니다.
            </p>
            <p style={{ margin: "0 0 10px", color: "#3a3a3a", fontSize: "0.97rem" }}>
              현재 <strong>결제 모듈 승인 절차가 마무리되지 않아</strong>,
              공지 시까지 <strong>구독 결제가 불가</strong>한 점 안내드립니다.
            </p>
            <p style={{ margin: "0 0 10px", color: "#3a3a3a", fontSize: "0.97rem" }}>
              승인이 완료되는 대로 별도 공지를 드리겠습니다.
              그 외 학습 콘텐츠는 평소처럼 자유롭게 이용하실 수 있으니
              번거롭더라도 조금만 기다려 주시면 감사하겠습니다.
            </p>
            <p style={{ margin: "0 0 22px", color: "#777", fontSize: "0.88rem" }}>
              불편을 끼쳐 드려 죄송합니다. 따뜻한 양해 부탁드립니다.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={dismissPaymentNotice}
                style={{
                  background: "#3b8c3a", color: "#fff",
                  border: "none", borderRadius: 10,
                  padding: "10px 22px", fontSize: "0.95rem", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}
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
            <a href="#ai">AI 도우미</a>
            <a href="#diagnostic">진단 안내</a>
            <a href="#parent">학부모</a>
            <a href="#pricing">요금 안내</a>
            <a href="#faq">FAQ</a>
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
            <a href="#ai" onClick={() => setMobileMenuOpen(false)}>AI 도우미</a>
            <a href="#diagnostic" onClick={() => setMobileMenuOpen(false)}>진단 안내</a>
            <a href="#parent" onClick={() => setMobileMenuOpen(false)}>학부모</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>요금 안내</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
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
          <div className="landing-stat"><strong>11</strong><span>전문 농장</span></div>
          <div className="landing-stat"><strong>12</strong><span>레벨 체계</span></div>
          <div className="landing-stat"><strong>240</strong><span>최대 챕터</span></div>
          <div className="landing-stat"><strong>AI</strong><span>학습 도우미</span></div>
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
              { icon: "smart_toy", title: "AI 학습 도우미", desc: "AI 튜터·자동 채점·글쓰기 첨삭·통합 분석 총평까지 함께합니다.", img: "card-ai-grading.jpg" },
              { icon: "emoji_events", title: "보상 시스템", desc: "씨앗·작물·시즌 랭킹·멀티 대결(최대 10명)으로 학습 동기를 유지합니다.", img: "card-rewards.jpg" },
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

      {/* ── 섹션 2.5: AI 학습 도우미 ── */}
      <section className="landing-section" id="ai">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">8가지 AI 학습 도우미</h2>
            <p>학습부터 운영까지, AI가 함께 합니다.</p>
          </div>
          <div className="landing-card-grid">
            {[
              { icon: "psychology_alt", title: "AI 학생 튜터", desc: "부엉이샘·아미스샘·누룽지샘 세 페르소나 중 선택. 학습 진도·약점을 함께 챙겨 줍니다." },
              { icon: "edit_note", title: "AI 글쓰기 첨삭", desc: "'지식과 지혜' 게시판의 글을 AI가 직접 첨삭해 표현력을 키워 줍니다." },
              { icon: "smart_toy", title: "AI 자동 채점", desc: "객관식·서술형·OMR까지 자동 채점하고 풀이 흐름을 분석합니다." },
              { icon: "analytics", title: "AI 통합 분석표", desc: "10대 역량·영역·주제별 통계와 AI 총평·맞춤 추천 학습을 제공합니다." },
              { icon: "recommend", title: "AI 추천 학습", desc: "10대 역량·영역·주제를 기준으로 다음에 풀 콘텐츠를 자동 추천합니다." },
              { icon: "support_agent", title: "AI 운영자 비서", desc: "학생·반·콘텐츠·테스트 관리까지 관리자 업무 30여 종을 AI로 처리합니다." },
              { icon: "auto_fix_high", title: "AI 시험 출제", desc: "지문·문항·정답·해설까지 자동 생성. 출제 부담을 크게 줄여 줍니다." },
              { icon: "document_scanner", title: "채팅 OCR", desc: "이미지를 채팅에 올리면 AI가 텍스트로 변환해 곧바로 활용합니다." },
            ].map((card) => (
              <div className="landing-card" key={card.title}>
                <div className="landing-card-icon">
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 24, color: "#666", fontSize: 14 }}>
            AI 기능 사용은 '자몽'으로 결제합니다. 채팅(튜터·비서·포도)은 무과금이며, 채팅 OCR은 월·일 한도가 있습니다.
          </p>
        </div>
      </section>

      {/* ── 섹션 3: 진단 안내 ── */}
      <section className="landing-section landing-alt-bg" id="diagnostic">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">4단계 12레벨 진단 시스템</h2>
            <p>10대 역량을 측정하는 진단 테스트(1인당 1회). 학년에 맞는 단계로 자동 배정합니다.</p>
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

      {/* ── 섹션 3.5: 학부모 ── */}
      <section className="landing-section" id="parent">
        <div className="landing-wrap">
          <div className="landing-section-title">
            <h2 className="landing-display">학부모도 함께</h2>
            <p>자녀의 학습을 옆에서 살피고, 결제·충전까지 한 화면에서 관리합니다.</p>
          </div>
          <div className="landing-card-grid">
            {[
              { icon: "monitoring", title: "자녀 학습 모니터링", desc: "오늘의 학습 진도, 통합 분석표, 시즌 랭킹 추이를 실시간으로 확인합니다." },
              { icon: "credit_card", title: "구독 결제 대행", desc: "자녀를 대신해 Pro 구독(1·3·6·12개월)을 결제합니다. 자녀가 기관 소속이면 자동 면제됩니다." },
              { icon: "savings", title: "자몽 충전", desc: "AI 기능 사용량 결제(자몽)도 학부모가 대신 충전할 수 있습니다." },
              { icon: "family_restroom", title: "여러 자녀 한 계정", desc: "한 학부모 계정으로 여러 자녀를 연결해 한꺼번에 관리합니다." },
            ].map((card) => (
              <div className="landing-card" key={card.title}>
                <div className="landing-card-icon">
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
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
              <Link to="/inquiry" className="landing-contact-method">
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
