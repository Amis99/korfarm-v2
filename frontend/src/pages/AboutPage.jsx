import { useEffect } from "react";
import { Link } from "react-router-dom";
import { COMPETENCIES } from "../data/landingData";
import "../styles/about.css";

function AboutPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="about-page">
      {/* 히어로 */}
      <div className="about-hero">
        <div className="about-wrap">
          <Link to="/" className="about-home-link">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            홈으로
          </Link>
          <h1>국어농장 프로그램 소개</h1>
          <p>국어 실력을 완성하는 체계적 학습 시스템을 소개합니다.</p>
        </div>
      </div>

      {/* 10대 핵심 역량 */}
      <section className="about-section">
        <div className="about-wrap">
          <h2>10대 핵심 역량</h2>
          <p className="about-section-desc">국어농장은 10가지 핵심 역량을 체계적으로 진단하고 훈련합니다.</p>
          <div className="about-competency-grid">
            {COMPETENCIES.map((c) => (
              <div className="about-competency-card" key={c.name}>
                <div className="about-competency-icon">
                  <span className="material-symbols-outlined">{c.icon}</span>
                </div>
                <div>
                  <h4>{c.name}</h4>
                  <p>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 독해력 강화 학습 */}
      <section className="about-section about-alt">
        <div className="about-wrap">
          <div className="about-feature-head">
            <div className="about-feature-icon">
              <span className="material-symbols-outlined">auto_stories</span>
            </div>
            <div>
              <h2>독해력 강화 학습</h2>
              <p className="about-feature-sub">일일 독해 + 비문학/문학 훈련</p>
            </div>
          </div>
          <p className="about-feature-desc">매일 제공되는 무료 일일 독해와 함께, 비문학·문학 지문을 활용한 심화 훈련을 제공합니다.</p>
          <div className="about-highlight-list">
            {[
              "일일 독해: 매일 새로운 지문 무료 제공",
              "비문학·문학 영역별 전문 훈련",
              "정독 → 복기 → 확인 3단계 학습법",
              "12레벨 난이도별 맞춤 지문 제공",
            ].map((h) => (
              <div key={h} className="about-highlight-item">
                <span className="material-symbols-outlined">check_circle</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 문법 트레이닝 */}
      <section className="about-section">
        <div className="about-wrap">
          <div className="about-feature-head">
            <div className="about-feature-icon">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
            <div>
              <h2>국내 유일의 문법 트레이닝</h2>
              <p className="about-feature-sub">인터랙티브 문법 학습 모듈</p>
            </div>
          </div>
          <p className="about-feature-desc">단순 암기가 아닌, 직접 조작하며 체득하는 문법 학습을 경험하세요.</p>
          <div className="about-highlight-list">
            {[
              "단어형성 분석: 어근·접사 분리 연습",
              "문장짜임 분석: 문장 구조 파악 훈련",
              "음운변동 분석: 38가지 음운 변동 규칙 학습",
              "품사 연습: 문맥 속 품사 판별 훈련",
            ].map((h) => (
              <div key={h} className="about-highlight-item">
                <span className="material-symbols-outlined">check_circle</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 스터디 스케줄 */}
      <section className="about-section about-alt">
        <div className="about-wrap">
          <div className="about-feature-head">
            <div className="about-feature-icon">
              <span className="material-symbols-outlined">event_note</span>
            </div>
            <div>
              <h2>스터디 스케줄</h2>
              <p className="about-feature-sub">할일 관리 + 캘린더 뷰</p>
            </div>
          </div>
          <p className="about-feature-desc">할일 목록과 캘린더 뷰를 통해 학습 일정을 체계적으로 관리합니다.</p>
          <div className="about-highlight-list">
            {[
              "할일 목록 + 월간/주간 캘린더 뷰",
              "과제·테스트·콘텐츠 통합 추적",
              "매트릭스 기반 학습 관리",
              "완료율과 진행 상황 시각화",
            ].map((h) => (
              <div key={h} className="about-highlight-item">
                <span className="material-symbols-outlined">check_circle</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 하단 CTA */}
      <div className="about-cta">
        <div className="about-wrap">
          <h2>지금 바로 시작하세요</h2>
          <p>국어농장의 모든 기능을 체험해 보세요.</p>
          <div className="about-cta-actions">
            <Link to="/login" className="about-cta-primary">무료로 시작하기</Link>
            <Link to="/pricing" className="about-cta-secondary">요금 안내 보기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
