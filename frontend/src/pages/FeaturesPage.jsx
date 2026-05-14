import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/features.css";

const SECTIONS = [
  {
    id: "pro-mode",
    icon: "menu_book",
    title: "프로 모드",
    subtitle: "체계적 교재 기반 학습",
    desc: "교재 학습 → 정답/해설 확인 → 챕터 테스트(70점 통과) → 다음 챕터로 이어지는 체계적 학습 시스템입니다. 레벨당 20챕터, 총 12레벨(최대 240챕터)로 구성되며, 챕터마다 배경지식·어휘·지문·논리독해·문법(단어형성/문장짜임/음운변동/형태소)·선택지 판별·테스트·정답해설 등의 학습 모듈을 챕터 성격에 맞게 조합해 진행합니다.",
    highlights: [
      "레벨당 20챕터, 12레벨 총 최대 240챕터",
      "챕터마다 학습 모듈 조합이 다름",
      "챕터 테스트 70점 이상 통과 시 다음 챕터 잠금 해제",
      "인쇄 모드와 온라인 모드 선택 가능",
    ],
  },
  {
    id: "study-schedule",
    icon: "event_note",
    title: "스터디 스케줄",
    subtitle: "할일 관리 + 캘린더",
    desc: "할일 목록과 캘린더 뷰를 통해 학습 일정을 체계적으로 관리합니다. 과제, 테스트, 학습 콘텐츠 등 모든 학습 활동을 한눈에 추적하고, 매트릭스 기반 학습 관리로 효율을 극대화합니다.",
    highlights: [
      "할일 목록 + 월간/주간 캘린더 뷰",
      "과제·테스트·콘텐츠 통합 추적",
      "매트릭스 기반 학습 관리",
      "완료율과 진행 상황 시각화",
    ],
  },
  {
    id: "reading",
    icon: "auto_stories",
    title: "독해력 강화 맞춤 학습",
    subtitle: "일일 독해 + 비문학/문학 훈련",
    desc: "매일 제공되는 무료 일일 독해와 함께, 비문학·문학 지문을 활용한 심화 훈련을 제공합니다. 정독 → 복기 → 확인의 3단계 학습법으로 진정한 독해력을 키우며, 레벨별 맞춤 지문으로 효과를 극대화합니다.",
    highlights: [
      "일일 독해: 매일 새로운 지문 무료 제공",
      "비문학·문학 영역별 전문 훈련",
      "정독 → 복기 → 확인 3단계 학습법",
      "12레벨 난이도별 맞춤 지문 제공",
    ],
  },
  {
    id: "grammar",
    icon: "edit_note",
    title: "국내 유일의 문법 트레이닝",
    subtitle: "인터랙티브 문법 학습 모듈",
    desc: "단어형성 분석, 문장짜임 분석, 음운변동 분석(38가지), 품사 연습 등 국내에서 유일하게 제공하는 인터랙티브 문법 트레이닝 시스템입니다. 단순 암기가 아닌, 직접 조작하며 체득하는 문법 학습을 경험하세요.",
    highlights: [
      "단어형성 분석: 어근·접사 분리 연습",
      "문장짜임 분석: 문장 구조 파악 훈련",
      "음운변동 분석: 38가지 음운 변동 규칙 학습",
      "품사 연습: 문맥 속 품사 판별 훈련",
    ],
  },
  {
    id: "learning-request",
    icon: "task",
    title: "요청 학습 생성",
    subtitle: "기관 관리자 과제 배정 시스템",
    desc: "기관 관리자가 학생에게 학습 과제를 배정하면, 학생의 과제함에 자동으로 표시됩니다. 학습 완료 후 제출하면 관리자가 결과를 확인하고 피드백을 제공할 수 있습니다.",
    highlights: [
      "관리자 → 학생 과제 배정",
      "학생 과제함에 자동 표시",
      "학습 완료 후 제출 시스템",
      "관리자 결과 확인 및 피드백",
    ],
  },
  {
    id: "diagnostic",
    icon: "quiz",
    title: "10대 역량 진단",
    subtitle: "진단 테스트 → 레이더 차트 분석",
    desc: "진단 테스트를 통해 10대 핵심 역량(어휘력, 문장 독해력, 구조 독해력, 논리 사고력, 어법·문법 능력, 개념 적용, 국어 배경지식, 비문학 배경지식, 문제 분석, 선택지 분석)을 측정합니다. 레이더 차트로 역량별 상세 분석을 제공하고, 결과에 따라 최적 레벨에 배정됩니다.",
    highlights: [
      "10대 핵심 역량 종합 측정",
      "레이더 차트 기반 역량별 시각화",
      "역량별 상세 분석 리포트",
      "진단 결과 기반 최적 레벨 배정",
    ],
  },
  {
    id: "farm-mode",
    icon: "park",
    title: "농장별 모드",
    subtitle: "11개 전문 농장",
    desc: "어휘·독해·배경지식·이야기·고전·내용 숙지·문법·국어 개념 및 이론·논리사고력·서술형·선택지 판별까지 총 11개 전문 농장에서 영역별 약점을 집중 보강합니다. 일부 농장은 단계(서버)에 따라 점진적으로 열립니다.",
    highlights: [
      "11개 전문 농장: 어휘·독해·배경지식·이야기·고전·내용 숙지·문법·국어 개념 및 이론·논리사고력·서술형·선택지 판별",
      "각 농장별 고유한 훈련 방식",
      "단계(서버)별 난이도 적용 (소쉬르~비트겐슈타인)",
      "약점 영역 집중 보강 시스템",
    ],
  },
  {
    id: "ai-scoring",
    icon: "smart_toy",
    title: "AI 채점 + 통합 성적표",
    subtitle: "자동 채점, 레이더 차트, 학습 추이",
    desc: "AI가 자동으로 채점하고, 영역별 성취도를 레이더 차트로 시각화합니다. 학습 추이, 오답 노트, 영역별 분석을 통해 약점을 정확히 파악하고 보완할 수 있습니다.",
    highlights: [
      "AI 자동 채점 시스템",
      "레이더 차트 기반 영역별 성취도 시각화",
      "학습 추이 그래프 및 성장 분석",
      "오답 노트 자동 생성 및 복습 지원",
    ],
  },
  {
    id: "rewards",
    icon: "emoji_events",
    title: "보상 시스템",
    subtitle: "씨앗·작물·랭킹·멀티 대결",
    desc: "학습 완료 시 씨앗을 획득하고, 모은 씨앗으로 다양한 작물(수확물)을 키웁니다. 작물 점수는 시즌 랭킹에 반영되고, 1:1로 자몽 환산해 AI 기능 사용에도 쓸 수 있습니다. 멀티 대결 모드에서는 친구 최대 10명과 씨앗을 걸고 실시간 퀴즈 대결에 도전할 수 있습니다.",
    highlights: [
      "씨앗 경제: 학습 완료 시 씨앗 획득",
      "작물 수확: 씨앗으로 작물을 키우고 자몽으로 환산 가능",
      "시즌 랭킹: 작물 점수 기반 순위 경쟁(학생만 집계)",
      "멀티 대결: 최대 10명까지 함께하는 실시간 퀴즈 대결",
    ],
  },
  {
    id: "org-management",
    icon: "dashboard",
    title: "기관 관리 대시보드",
    subtitle: "반 관리, 과제 배포, 학부모 연동",
    desc: "학원·학교 관리자가 반을 구성하고, 과제를 일괄 배포하며, 학부모에게 학습 현황 리포트를 공유할 수 있습니다. 기관 운영에 필요한 모든 기능을 하나의 대시보드에서 관리합니다.",
    highlights: [
      "반 관리: 반 구성 및 학생 배정",
      "과제 일괄 배포: 반 단위 과제 배정",
      "학부모 연동 리포트: 실시간 학습 현황 공유",
      "기관 운영 지표 대시보드",
    ],
  },
];

function FeaturesPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="features-page">
      {/* 히어로 */}
      <div className="features-hero">
        <div className="features-wrap">
          <Link to="/" className="features-home-link">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            홈으로
          </Link>
          <h1>국어농장의 모든 기능</h1>
          <p>진단부터 훈련, 평가, 보상까지 — 국어 실력을 완성하는 학습 시스템을 자세히 살펴보세요.</p>
        </div>
      </div>

      {/* 빠른 이동 네비 */}
      <nav className="features-nav">
        <div className="features-nav-inner">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>{s.title}</a>
          ))}
        </div>
      </nav>

      {/* 기능 섹션들 */}
      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="features-section">
          <div className="features-wrap">
            <div className="features-section-head">
              <div className="features-section-icon">
                <span className="material-symbols-outlined">{section.icon}</span>
              </div>
              <div>
                <h2>{section.title}</h2>
                <p>{section.subtitle}</p>
              </div>
            </div>
            <p>{section.desc}</p>
            <div className="features-highlight-list">
              {section.highlights.map((h) => (
                <div key={h} className="features-highlight-item">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* 하단 CTA */}
      <div className="features-cta">
        <div className="features-wrap">
          <h2>지금 바로 시작하세요</h2>
          <p>국어농장의 모든 기능을 체험해 보세요.</p>
          <div className="features-cta-actions">
            <Link to="/login" className="features-cta-primary">무료로 시작하기</Link>
            <Link to="/pricing" className="features-cta-secondary">요금 안내 보기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturesPage;
