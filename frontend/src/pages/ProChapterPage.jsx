import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/pro-mode.css";

const TYPE_LABELS = {
  reading: "독해 모드",
  vocab: "어휘 학습",
  background: "배경지식",
  logic: "논리 사고력",
  answer: "모범답안 / 정답해설",
  test: "챕터별 테스트",
};

const TYPE_ICONS = {
  reading: "menu_book",
  vocab: "spellcheck",
  background: "lightbulb",
  logic: "psychology",
  answer: "fact_check",
  test: "quiz",
};

function ProChapterPage() {
  const { chapterId } = useParams();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !chapterId) return;
    setLoading(true);
    apiGet(`/v1/pro/chapters/${chapterId}/items`)
      .then(data => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, chapterId]);

  const handleItemClick = (item) => {
    if (item.isLocked) return;
    if (item.type === "test") {
      navigate(`/pro-mode/chapter/${chapterId}/test`);
      return;
    }
    if (item.type === "answer") {
      if (item.contentId) {
        navigate(`/learning/${item.contentId}?proChapter=${chapterId}&proItemId=${item.itemId}`);
      }
      return;
    }
    // 기본 학습: reading, vocab, background, logic
    if (item.contentId) {
      navigate(`/learning/${item.contentId}?proChapter=${chapterId}&proItemId=${item.itemId}`);
    }
  };

  return (
    <div className="pro">
      <div className="pro-topbar">
        <div className="pro-topbar-inner">
          <Link to="/pro-mode" className="pro-back">
            <span className="material-symbols-outlined">arrow_back</span>
            챕터 목록
          </Link>
          <h1 className="pro-topbar-title">학습 아이템</h1>
        </div>
      </div>

      <div className="pro-body">
        {loading ? (
          <div className="pro-loading">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="pro-center">
            <p>학습 아이템이 없습니다.</p>
          </div>
        ) : (
          <div className="pro-items">
            {items.map((item) => {
              const statusClass = item.isLocked ? "locked" : item.isCompleted ? "completed" : "";
              return (
                <div
                  key={item.itemId}
                  className={`pro-item ${statusClass}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className={`pro-item-icon ${item.type}`}>
                    <span className="material-symbols-outlined">
                      {TYPE_ICONS[item.type] || "school"}
                    </span>
                  </div>
                  <div className="pro-item-info">
                    <p className="pro-item-title">{TYPE_LABELS[item.type] || item.type}</p>
                    <p className="pro-item-desc">
                      {item.isLocked
                        ? "기본 학습 4개를 모두 완료하면 해제됩니다"
                        : item.isCompleted
                          ? "완료"
                          : "학습하기"}
                    </p>
                  </div>
                  <div className={`pro-item-status ${item.isLocked ? "lock" : item.isCompleted ? "done" : ""}`}>
                    <span className="material-symbols-outlined">
                      {item.isLocked ? "lock" : item.isCompleted ? "check_circle" : "chevron_right"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProChapterPage;
