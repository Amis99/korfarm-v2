import { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/guide.css";

const MODES = [
  {
    icon: "quiz",
    title: "일일 퀴즈",
    desc: "매일 새로운 국어 퀴즈가 제공됩니다. 반복 학습으로 국어 감각을 유지하고, 학습 완료 시 씨앗 보상을 획득합니다.",
    highlights: ["매일 새로운 퀴즈 제공", "학습 완료 시 씨앗 보상", "Basic 플랜에서도 무료 이용"],
  },
  {
    icon: "auto_stories",
    title: "일일 독해",
    desc: "매일 새로운 지문을 읽고 독해력을 강화합니다. 비문학·문학 영역의 다양한 지문으로 읽기 능력을 키워갑니다.",
    highlights: ["매일 새로운 지문 무료 제공", "비문학·문학 영역별 지문", "정독 → 복기 → 확인 3단계"],
  },
  {
    icon: "swords",
    title: "대결 모드",
    desc: "씨앗을 걸고 1:1 실시간 퀴즈 대결에 도전하세요. 소쉬르·프레게·러셀·비트겐슈타인 4개 서버에서 같은 Tier의 상대와 대결합니다.",
    highlights: ["4개 서버(Tier)별 매칭", "실시간 1:1 퀴즈 대결", "승리 시 상대 씨앗 획득"],
  },
  {
    icon: "park",
    title: "농장별 모드",
    desc: "어휘농장, 사전농장, 비문학농장, 문학농장, 배경지식농장, 개념농장, 문법농장, 논리농장, 선지분석농장 등 9개 영역별 전문 농장에서 약점을 집중 보강합니다.",
    highlights: ["9개 전문 영역 농장", "영역별 특화 훈련 방식", "서버별 난이도 적용"],
  },
  {
    icon: "edit_note",
    title: "지식과 지혜",
    desc: "글쓰기 게시판에서 자신의 생각을 글로 표현하고, 다른 학습자의 글을 읽으며 표현력과 사고력을 키웁니다.",
    highlights: ["레벨별 글쓰기 게시판", "동료 학습자 글 읽기", "표현력·사고력 강화"],
  },
  {
    icon: "menu_book",
    title: "프로 모드",
    desc: "180+ 챕터, 6단계 모듈(배경지식 → 어휘 → 지문 → 논리독해 → 테스트 → 정답해설)로 구성된 체계적 학습 시스템입니다. 레벨당 20챕터, 총 12레벨로 국어 실력을 단계별로 완성합니다.",
    highlights: [
      "6단계 모듈: 배경지식 → 어휘 → 지문 → 논리독해 → 테스트 → 정답해설",
      "레벨당 20챕터, 12레벨 총 240챕터 구성",
      "챕터 테스트 70점 이상 통과 시 다음 챕터 잠금 해제",
      "인쇄 모드와 온라인 모드 선택 가능",
    ],
    featured: true,
  },
];

function GuidePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="guide-page">
      {/* 히어로 */}
      <div className="guide-hero">
        <div className="guide-wrap">
          <Link to="/" className="guide-home-link">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            홈으로
          </Link>
          <h1>학습 모드 소개</h1>
          <p>국어농장의 6가지 학습 모드를 자세히 살펴보세요.</p>
        </div>
      </div>

      {/* 학습 모드 섹션들 */}
      {MODES.map((mode, idx) => (
        <section key={mode.title} className={`guide-section ${idx % 2 === 1 ? "guide-alt" : ""}`}>
          <div className="guide-wrap">
            <div className="guide-section-head">
              <div className="guide-section-icon">
                <span className="material-symbols-outlined">{mode.icon}</span>
              </div>
              <div>
                <h2>{mode.title}</h2>
                {mode.featured && <span className="guide-featured-badge">핵심 콘텐츠</span>}
              </div>
            </div>
            <p className="guide-section-desc">{mode.desc}</p>
            <div className="guide-highlight-list">
              {mode.highlights.map((h) => (
                <div key={h} className="guide-highlight-item">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* 하단 CTA */}
      <div className="guide-cta">
        <div className="guide-wrap">
          <h2>지금 바로 시작하세요</h2>
          <p>국어농장의 모든 학습 모드를 체험해 보세요.</p>
          <div className="guide-cta-actions">
            <Link to="/login" className="guide-cta-primary">무료로 시작하기</Link>
            <Link to="/pricing" className="guide-cta-secondary">요금 안내 보기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuidePage;
