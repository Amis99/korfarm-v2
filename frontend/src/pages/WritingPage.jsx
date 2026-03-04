import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/wisdom.css";

const LEVELS = [
  { id: "saussure1", name: "소쉬르 1", emoji: "📗", color: "#6da475", desc: "초1 수준의 계절, 가족, 감정 표현 등 생활 밀착형 글쓰기" },
  { id: "saussure2", name: "소쉬르 2", emoji: "📗", color: "#6da475", desc: "초2 수준의 과학 탐구, 경제 기초, 독서 감상 글쓰기" },
  { id: "saussure3", name: "소쉬르 3", emoji: "📗", color: "#6da475", desc: "초3 수준의 사회·과학 개념과 민주주의 기초 글쓰기" },
  { id: "frege1", name: "프레게 1", emoji: "📘", color: "#5a8abf", desc: "초4 수준의 철학 입문, 국제 무역, 법과 권리 글쓰기" },
  { id: "frege2", name: "프레게 2", emoji: "📘", color: "#5a8abf", desc: "초5 수준의 세포·유전, 경제 정책, 역사 탐구 글쓰기" },
  { id: "frege3", name: "프레게 3", emoji: "📘", color: "#5a8abf", desc: "초6 수준의 진화론, 도덕 판단, 경제 지표 심화 글쓰기" },
  { id: "russell1", name: "러셀 1", emoji: "📙", color: "#d4853e", desc: "중1 수준의 고전 철학, 헌법 원리, 과학 법칙 글쓰기" },
  { id: "russell2", name: "러셀 2", emoji: "📙", color: "#d4853e", desc: "중2 수준의 사회계약론, 통화 정책, 근현대사 글쓰기" },
  { id: "russell3", name: "러셀 3", emoji: "📙", color: "#d4853e", desc: "중3 수준의 실존주의, 거시경제, 상대성 이론 글쓰기" },
  { id: "wittgenstein1", name: "비트겐슈타인 1", emoji: "📕", color: "#c0564e", desc: "고1 수준의 인식론, 시장 실패, 열역학 심화 글쓰기" },
  { id: "wittgenstein2", name: "비트겐슈타인 2", emoji: "📕", color: "#c0564e", desc: "고2 수준의 언어철학, 금융 시장, 양자역학 글쓰기" },
  { id: "wittgenstein3", name: "비트겐슈타인 3", emoji: "📕", color: "#c0564e", desc: "고3 수준의 해체주의, 행동경제학, 생명윤리 글쓰기" },
];

function WritingPage() {
  const { user, isPremium } = useAuth();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const isParent = user?.roles?.includes("PARENT");
  const isViewingChild = isParent && studentId;
  const [hasSub, setHasSub] = useState(isPremium || false);
  const [subChecked, setSubChecked] = useState(isPremium || isParent || false);

  useEffect(() => {
    if (isPremium || isParent) { setHasSub(true); setSubChecked(true); return; }
    apiGet("/v1/subscription")
      .then((sub) => {
        const st = sub?.status;
        if (st === "active" || st === "canceled") setHasSub(true);
      })
      .catch((err) => {
        // API가 명시적으로 거부(402 등)한 게 아닌 네트워크 에러면 접근 허용
        if (!err?.status) setHasSub(true);
      })
      .finally(() => setSubChecked(true));
  }, [isPremium, isParent]);

  // 부모가 자녀 글을 볼 때 studentId를 레벨 링크에 전달
  const getLevelLink = (levelId) => {
    if (isViewingChild) {
      return `/writing/${levelId}?studentId=${studentId}`;
    }
    return `/writing/${levelId}`;
  };

  if (subChecked && !hasSub) {
    return (
      <div className="wisdom">
        <div className="wis-topbar">
          <div className="wis-topbar-inner">
            <Link to="/start" className="wis-back">
              <span className="material-symbols-outlined">arrow_back</span>
              돌아가기
            </Link>
            <h1 className="wis-topbar-title">지식과 지혜</h1>
          </div>
        </div>
        <div className="wis-hero">
          <h2>구독이 필요합니다</h2>
          <p>지식과 지혜 글쓰기는 구독 회원 전용 기능입니다.</p>
          <Link to="/subscription" style={{ color: "#f06c24", fontWeight: 700, marginTop: 12, display: "inline-block", fontSize: 15 }}>
            구독하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wisdom">
      <div className="wis-topbar">
        <div className="wis-topbar-inner">
          <Link to="/start" className="wis-back">
            <span className="material-symbols-outlined">arrow_back</span>
            돌아가기
          </Link>
          <h1 className="wis-topbar-title">지식과 지혜</h1>
        </div>
      </div>

      <div className="wis-hero">
        <h2>레벨을 선택하세요</h2>
        <p>
          {isViewingChild
            ? "자녀의 글을 레벨별로 확인하세요"
            : "레벨별 주제에 맞춰 글을 쓰고, 선생님의 첨삭을 받아보세요"}
        </p>
      </div>

      <div className="wis-level-grid">
        {LEVELS.map((level) => (
          <Link key={level.id} to={getLevelLink(level.id)} className="wis-level-card">
            <div className="wis-level-icon">{level.emoji}</div>
            <div>
              <p className="wis-level-name">{level.name}</p>
              <p className="wis-level-desc">{level.desc}</p>
              <span className="wis-level-badge" style={{ background: level.color }}>
                {isViewingChild ? "글 보기" : "글쓰기"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default WritingPage;
