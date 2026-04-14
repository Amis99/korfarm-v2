import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { useChatSocket } from "../hooks/useChatSocket";
import MessageBubble from "../components/chat/MessageBubble";
import MessageInput from "../components/chat/MessageInput";
import LikeListModal from "../components/chat/LikeListModal";
import "../styles/community-chat.css";

const ROOM_ID = "community";

function CommunityChatPage() {
  const { user } = useAuth();
  const isAdmin =
    user?.roles?.includes("HQ_ADMIN") || user?.roles?.includes("ORG_ADMIN");
  const myUserId = user?.userId || user?.id;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [likeModalMessageId, setLikeModalMessageId] = useState(null);
  const scrollRef = useRef(null);
  const initialScrollDoneRef = useRef(false);

  // 히스토리 로드 (최신 50개)
  useEffect(() => {
    setLoading(true);
    apiGet(`/v1/chat/rooms/${ROOM_ID}/messages?limit=50`)
      .then((data) => {
        setMessages(Array.isArray(data?.messages) ? data.messages : []);
        setHasMore(!!data?.hasMore);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // 새 메시지 후 스크롤 하단으로
  useEffect(() => {
    if (!scrollRef.current) return;
    if (!initialScrollDoneRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      initialScrollDoneRef.current = true;
    } else if (initialScrollDoneRef.current) {
      // 사용자가 스크롤 하단 근처면 자동 스크롤
      const el = scrollRef.current;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (nearBottom) el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const { sendMessage, deleteMessage, status } = useChatSocket(ROOM_ID, {
    onMessage: (msg) => {
      setMessages((prev) => [...prev, msg]);
    },
    onDeleted: ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: "deleted", content: null, fileId: null } : m
        )
      );
    },
    onLike: ({ messageId, likeCount, liked, byUserId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          // 본인이 토글한 경우만 likedByMe 갱신, 다른 사람 토글은 카운트만 갱신
          const newLikedByMe = byUserId === myUserId ? liked : m.likedByMe;
          return { ...m, likeCount, likedByMe: newLikedByMe };
        })
      );
    },
    onError: (err) => {
      setError(err?.message || "채팅 오류");
    },
  });

  const loadOlder = async () => {
    if (!messages.length) return;
    const oldest = messages[0];
    try {
      const data = await apiGet(
        `/v1/chat/rooms/${ROOM_ID}/messages?before=${oldest.id}&limit=50`
      );
      const older = Array.isArray(data?.messages) ? data.messages : [];
      setMessages((prev) => [...older, ...prev]);
      setHasMore(!!data?.hasMore);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSend = (messageType, content, fileId) => {
    const ok = sendMessage(messageType, content, fileId);
    if (!ok) {
      setError("WebSocket 연결이 끊어졌습니다. 다시 시도하세요.");
    }
  };

  const handleSendNotice = (content) => {
    handleSend("notice", content, null);
  };

  const handleLikeToggle = async (messageId) => {
    try {
      await apiPost(`/v1/chat/messages/${messageId}/like`, {});
      // WS 브로드캐스트가 onLike 핸들러를 통해 UI 갱신
    } catch (e) {
      setError(e.message || "좋아요 실패");
    }
  };

  const handleShowLikes = (messageId) => {
    setLikeModalMessageId(messageId);
  };

  const handleDelete = async (messageId) => {
    const okWs = deleteMessage(messageId);
    if (!okWs) {
      try {
        await apiDelete(`/v1/chat/messages/${messageId}`);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, status: "deleted", content: null, fileId: null } : m
          )
        );
      } catch (e) {
        setError(e.message);
      }
    }
  };

  const handleHideMessage = async (messageId) => {
    if (!window.confirm("이 메시지를 가리시겠습니까?")) return;
    handleDelete(messageId);
  };

  const handleBanUser = async (userId, userName) => {
    const reason = window.prompt(`"${userName}" 사용자를 접근 금지합니다. 사유를 입력하세요:`, "커뮤니티 규칙 위반");
    if (reason === null) return;
    try {
      await apiPost(`/v1/admin/chat/rooms/${ROOM_ID}/mutes`, {
        user_id: userId,
        duration_minutes: null,
        reason: reason || "커뮤니티 규칙 위반",
      });
      alert(`${userName} 사용자가 접근 금지되었습니다.`);
    } catch (e) {
      setError(e.message || "접근 금지 실패");
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-page-header">
        <Link to="/start" className="chat-back">
          <span className="material-symbols-outlined">arrow_back</span>
          홈
        </Link>
        <h1 className="chat-page-title">커뮤니티 채팅</h1>
        <div className="chat-status-badge">
          <span className={`chat-status-dot ${status}`} />
          {status === "open" ? "연결됨" : status === "connecting" ? "연결 중..." : "연결 끊김"}
        </div>
      </header>

      {error && <div className="chat-page-error">{error}</div>}

      <div className="chat-messages-area" ref={scrollRef}>
        {loading ? (
          <div className="chat-loading">메시지 불러오는 중...</div>
        ) : (
          <>
            {hasMore && (
              <div className="chat-load-more">
                <button type="button" onClick={loadOlder}>
                  이전 메시지 불러오기
                </button>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="chat-empty">
                아직 메시지가 없습니다. 첫 메시지를 남겨보세요!
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.userId === myUserId}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  onLikeToggle={handleLikeToggle}
                  onShowLikes={handleShowLikes}
                  onHideMessage={isAdmin ? handleHideMessage : undefined}
                  onBanUser={isAdmin ? handleBanUser : undefined}
                />
              ))
            )}
          </>
        )}
      </div>

      <MessageInput
        onSend={handleSend}
        onSendNotice={handleSendNotice}
        isAdmin={isAdmin}
        disabled={status !== "open"}
      />

      <div className="chat-page-footer-note">
        ⓘ 첨부 파일은 7일 후 자동 보관 처리되며, 그 후엔 썸네일만 노출됩니다.
        본사 관리자는 한 달간 보관함에서 다운로드 가능합니다.
        길게 누르거나 우클릭하면 좋아요를 누를 수 있습니다.
      </div>

      {likeModalMessageId && (
        <LikeListModal
          messageId={likeModalMessageId}
          onClose={() => setLikeModalMessageId(null)}
        />
      )}
    </div>
  );
}

export default CommunityChatPage;
