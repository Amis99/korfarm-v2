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
    title: "멀티 대결",
    desc: "친구를 최대 10명까지 초대해 함께하는 실시간 퀴즈 대결입니다. 4단계 서버(소쉬르·프레게·러셀·비트겐슈타인)와 테마 서버를 골라 입장할 수 있고, AI 학생들과 대결하는 방도 상시 열려 있습니다.",
    highlights: [
      "방 정원 2~10명 (방장이 설정)",
      "1방 10문제 · 4단계 서버 + 테마 서버",
      "일반 서버 1~50씨앗 베팅, 테마 서버 베팅 없음",
      "친구 부족할 때는 AI 학생 대결방 입장 가능",
    ],
  },
  {
    icon: "park",
    title: "농장별 모드",
    desc: "어휘·독해·배경지식·이야기·고전·내용 숙지·문법·국어 개념 및 이론·논리사고력·서술형·선택지 판별까지, 총 11개 전문 농장에서 영역별 약점을 집중 보강합니다.",
    highlights: [
      "11개 전문 영역 농장",
      "영역별 특화 훈련 방식",
      "일부 농장은 단계(서버)에 따라 점진적으로 열림",
    ],
  },
  {
    icon: "edit_note",
    title: "지식과 지혜",
    desc: "글쓰기 게시판에서 자신의 생각을 글로 표현합니다. 작성한 글은 AI가 즉시 첨삭해 주고, 다른 학습자의 글도 함께 읽으며 표현력과 사고력을 키웁니다.",
    highlights: ["레벨별 글쓰기 게시판", "AI 자동 첨삭", "동료 학습자 글 읽기·반응"],
  },
  {
    icon: "document_scanner",
    title: "내용 숙지 학습 (AI 변환)",
    desc: "학생이나 강사가 가지고 있는 학습 프린트(PDF·사진)를 올리면 AI가 OCR로 본문을 읽고, 내용을 빠짐없이 짚어 주는 체크리스트를 자동 생성합니다. 변환된 체크리스트는 OX·빈칸·확인 문제로 바로 풀 수 있어, 평소 다니는 학원·학교 교재까지 국어농장 안에서 복습할 수 있습니다.",
    highlights: [
      "학습 프린트(PDF·사진) 업로드 → AI 본문 추출",
      "본문 핵심을 짚는 체크리스트 자동 생성",
      "OX·빈칸·확인 문제로 변환해 즉시 풀이",
      "학원·학교 교재 복습에 활용",
    ],
  },
  {
    icon: "menu_book",
    title: "프로 모드",
    desc: "12레벨 × 레벨당 20챕터(최대 240챕터)로 구성된 체계적 학습 시스템입니다. 각 챕터는 배경지식·어휘·지문·논리독해·문법(단어형성/문장짜임/음운변동/형태소)·선택지 판별·테스트·정답해설 등의 학습 모듈을 챕터의 성격에 맞게 조합해 진행합니다.",
    highlights: [
      "12레벨 × 20챕터 = 최대 240챕터",
      "챕터마다 학습 모듈 조합이 다름",
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
