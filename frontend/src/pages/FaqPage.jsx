import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FAQ_ITEMS } from "../data/landingData";
import "../styles/features.css";

const EXTRA_FAQ = [
  {
    q: "프로 모드는 어떤 구성인가요?",
    a: "프로 모드는 레벨당 20챕터, 총 12레벨(240챕터)로 구성됩니다. 각 챕터는 배경지식 → 어휘 → 지문 → 논리독해 → 테스트 → 정답해설의 6단계 모듈로 진행되며, 챕터 테스트 70점 이상 통과 시 다음 챕터가 잠금 해제됩니다.",
  },
  {
    q: "농장별 모드는 어떤 영역이 있나요?",
    a: "어휘농장, 사전농장, 비문학농장, 문학농장, 배경지식농장, 개념농장, 문법농장, 논리농장, 선지분석농장 등 총 9개 영역별 전문 농장이 있습니다. 각 농장마다 고유한 훈련 방식으로 약점을 집중 보강합니다.",
  },
  {
    q: "진단 테스트는 몇 번 볼 수 있나요?",
    a: "Basic 플랜에서는 1회 무료 진단이 제공됩니다. Pro/Academy 플랜에서는 추가 진단이 가능하며, CAT(적응형, 15~25문항)과 Full(전체 문항) 두 가지 모드를 선택할 수 있습니다.",
  },
  {
    q: "모바일에서도 학습할 수 있나요?",
    a: "네, 국어농장은 반응형 웹으로 제작되어 스마트폰, 태블릿, PC 등 모든 기기에서 이용할 수 있습니다. 별도 앱 설치 없이 웹 브라우저에서 바로 학습하실 수 있습니다.",
  },
];

const ALL_FAQ = [...FAQ_ITEMS, ...EXTRA_FAQ];

function FaqPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="features-page">
      {/* 히어로 */}
      <div className="features-hero">
        <div className="features-wrap">
          <Link to="/" className="features-home-link">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            홈으로
          </Link>
          <h1>자주 묻는 질문</h1>
          <p>국어농장에 대해 궁금한 점을 확인하세요.</p>
        </div>
      </div>

      {/* FAQ 리스트 */}
      <section style={{ padding: "60px 0" }}>
        <div className="features-wrap">
          <div style={{ maxWidth: 740, margin: "0 auto", display: "grid", gap: 12 }}>
            {ALL_FAQ.map((item) => (
              <details key={item.q} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2eadf", overflow: "hidden" }}>
                <summary style={{ padding: "20px 24px", fontWeight: 700, fontSize: 16, cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {item.q}
                </summary>
                <p style={{ margin: 0, padding: "0 24px 20px", lineHeight: 1.7, color: "#555" }}>{item.a}</p>
              </details>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: "#666", marginBottom: 16 }}>더 궁금한 점이 있으시면 문의해주세요.</p>
            <Link to="/community?board=inquiry" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 999, background: "#ff8f2b", color: "#131811", fontWeight: 800, textDecoration: "none", fontSize: 16 }}>
              문의 게시판으로 이동
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FaqPage;
