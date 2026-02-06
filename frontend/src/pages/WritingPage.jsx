import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/wisdom.css";

const LEVELS = [
  { id: "saussure1", name: "소쉬르 1", emoji: "📗", color: "#6da475", desc: "언어의 기초를 탐구합니다" },
  { id: "saussure2", name: "소쉬르 2", emoji: "📗", color: "#6da475", desc: "언어 구조를 분석합니다" },
  { id: "saussure3", name: "소쉬르 3", emoji: "📗", color: "#6da475", desc: "기호학의 세계로 들어갑니다" },
  { id: "frege1", name: "프레게 1", emoji: "📘", color: "#5a8abf", desc: "논리와 의미의 시작" },
  { id: "frege2", name: "프레게 2", emoji: "📘", color: "#5a8abf", desc: "뜻과 지시의 탐구" },
  { id: "frege3", name: "프레게 3", emoji: "📘", color: "#5a8abf", desc: "형식 논리의 심화" },
  { id: "russell1", name: "러셀 1", emoji: "📙", color: "#d4853e", desc: "분석철학의 출발" },
  { id: "russell2", name: "러셀 2", emoji: "📙", color: "#d4853e", desc: "기술 이론과 논리" },
  { id: "russell3", name: "러셀 3", emoji: "📙", color: "#d4853e", desc: "지식과 세계의 관계" },
  { id: "wittgenstein1", name: "비트겐슈타인 1", emoji: "📕", color: "#c0564e", desc: "언어의 한계를 탐구합니다" },
  { id: "wittgenstein2", name: "비트겐슈타인 2", emoji: "📕", color: "#c0564e", desc: "언어 게임의 세계" },
  { id: "wittgenstein3", name: "비트겐슈타인 3", emoji: "📕", color: "#c0564e", desc: "철학적 탐구의 정점" },
];

function WritingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const isParent = user?.roles?.includes("PARENT");
  const isViewingChild = isParent && studentId;

  // 부모가 자녀 글을 볼 때 studentId를 레벨 링크에 전달
  const getLevelLink = (levelId) => {
    if (isViewingChild) {
      return `/writing/${levelId}?studentId=${studentId}`;
    }
    return `/writing/${levelId}`;
  };

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
