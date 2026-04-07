import { useEffect, useState } from "react";
import { apiGet } from "../../utils/api";

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${h}:${min}`;
};

function LikeListModal({ messageId, onClose }) {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!messageId) return;
    setLoading(true);
    setError("");
    apiGet(`/v1/chat/messages/${messageId}/likes`)
      .then((data) => {
        setLikes(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message || "불러오기 실패"))
      .finally(() => setLoading(false));
  }, [messageId]);

  return (
    <div className="chat-like-modal-overlay" onClick={onClose}>
      <div className="chat-like-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-like-modal-header">
          <h3>❤ 좋아요 {likes.length}</h3>
          <button
            type="button"
            className="chat-like-modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className="chat-like-modal-body">
          {loading ? (
            <div className="chat-like-modal-empty">불러오는 중...</div>
          ) : error ? (
            <div className="chat-like-modal-empty" style={{ color: "#a83020" }}>{error}</div>
          ) : likes.length === 0 ? (
            <div className="chat-like-modal-empty">아직 좋아요가 없습니다.</div>
          ) : (
            <ul className="chat-like-list">
              {likes.map((like) => (
                <li key={like.userId} className="chat-like-item">
                  <span className="chat-like-icon">❤</span>
                  <span className="chat-like-name">{like.userName}</span>
                  <span className="chat-like-time">{formatTime(like.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default LikeListModal;
