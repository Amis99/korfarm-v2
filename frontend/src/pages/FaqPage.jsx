import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FAQ_ITEMS } from "../data/landingData";
import "../styles/features.css";

const EXTRA_FAQ = [
  {
    q: "프로 모드는 어떤 구성인가요?",
    a: "프로 모드는 레벨당 20챕터, 총 12레벨(최대 240챕터)로 구성됩니다. 각 챕터는 배경지식·어휘·지문·논리독해·문법(단어형성/문장짜임/음운변동/형태소)·선택지 판별·테스트·정답해설 등 여러 학습 모듈을 챕터의 성격에 맞게 조합해 진행하며, 챕터 테스트 70점 이상 통과 시 다음 챕터가 잠금 해제됩니다.",
  },
  {
    q: "농장별 모드는 어떤 영역이 있나요?",
    a: "어휘 농장, 독해 농장, 배경지식 농장, 이야기 농장, 고전 농장, 내용 숙지 농장, 문법 농장, 국어 개념 및 이론 농장, 논리사고력 농장, 서술형 농장, 선택지 판별 농장 — 총 11개의 전문 농장이 있습니다. 일부 농장은 단계(서버)에 따라 점진적으로 열립니다.",
  },
  {
    q: "진단 테스트는 몇 번 볼 수 있나요?",
    a: "진단 테스트는 1인당 평생 1회만 응시할 수 있습니다. 무료·유료·기관 모든 회원이 동일하며, 학년에 맞는 4단계(소쉬르·프레게·러셀·비트겐슈타인) 중 하나에 자동 매칭되어 응시합니다.",
  },
  {
    q: "대결 모드는 몇 명이 함께 하나요?",
    a: "대결 방은 방장이 2명부터 최대 10명까지 정원을 설정할 수 있습니다. 4단계 서버(소쉬르·프레게·러셀·비트겐슈타인)와 테마 서버 중에서 선택해 입장하며, 일반 서버는 씨앗을 1~50개 걸 수 있고 테마 서버는 베팅 없이 즐길 수 있습니다. AI 학생들과 대결할 수 있는 방도 상시 열려 있습니다.",
  },
  {
    q: "AI 기능은 어떻게 결제하나요?",
    a: "AI 기능 사용량은 '자몽'으로 결제합니다. 개인은 1자몽 250원(10,000원 충전 시 40자몽), 기관은 1자몽 200원(10,000원 충전 시 50자몽)입니다. 학습으로 얻은 작물을 1:1로 자몽 환산해 사용할 수도 있습니다. 단, AI 비서·튜터·커뮤니티 채팅은 무과금입니다(채팅 OCR만 월·일 한도 적용).",
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
