import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_BASE, TOKEN_KEY } from "../../utils/api";
import { useEmoticons, findEmoticonById } from "../../hooks/useEmoticons";
import EmoticonImage from "./EmoticonImage";

const formatTime = (iso) => {
  if (!iso) return "";
  // 서버가 KST(+09:00) 타임존 없이 보내므로 명시적으로 붙여줌
  const raw = iso.includes("+") || iso.includes("Z") ? iso : iso + "+09:00";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

/** userId를 안정적인 hue(0~360)로 해시 */
function hashHue(userId) {
  if (!userId) return 200;
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 360;
}

/** userId 기반 사용자 고유 색상 (HSL) */
function userColors(userId) {
  const hue = hashHue(userId);
  return {
    border: `hsl(${hue}, 65%, 45%)`,
    avatarBg: `hsl(${hue}, 60%, 75%)`,
    avatarText: `hsl(${hue}, 70%, 25%)`,
  };
}

const PODO_USER_ID = "u_ai_podo";

function Avatar({ userId, userName, userAvatarUrl }) {
  // 포도 AI 전용 아바타
  if (userId === PODO_USER_ID) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}podo-avatar.png`}
        alt="포도"
        className="chat-avatar"
        style={{ borderColor: "#7b4d9e" }}
      />
    );
  }
  const colors = userColors(userId);
  const initial = (userName || "?").trim().charAt(0).toUpperCase();
  if (userAvatarUrl) {
    return (
      <img
        src={userAvatarUrl}
        alt={userName}
        className="chat-avatar"
        style={{ borderColor: colors.border }}
      />
    );
  }
  return (
    <div
      className="chat-avatar chat-avatar-fallback"
      style={{
        background: colors.avatarBg,
        color: colors.avatarText,
        borderColor: colors.border,
      }}
    >
      {initial}
    </div>
  );
}

/** 인증 토큰을 헤더에 실어 첨부 파일을 blob URL로 변환하는 훅 */
function useAuthorizedFile(fileId) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!fileId) return;
    let revoked = false;
    let createdUrl = null;
    const token = sessionStorage.getItem(TOKEN_KEY);
    fetch(`${API_BASE}/v1/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("download failed");
        return r.blob();
      })
      .then((b) => {
        if (revoked) return;
        createdUrl = URL.createObjectURL(b);
        setUrl(createdUrl);
      })
      .catch(() => {});
    return () => {
      revoked = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [fileId]);
  return url;
}

function ChatImage({ fileId }) {
  const url = useAuthorizedFile(fileId);
  if (!url) return <div className="chat-image-placeholder">이미지 로드 중...</div>;
  return <img src={url} alt="첨부 이미지" className="chat-image" />;
}

function ChatVoicePlayer({ fileId }) {
  const url = useAuthorizedFile(fileId);
  if (!url) return <div className="chat-attach chat-attach-voice">음성 로드 중...</div>;
  return (
    <div className="chat-attach chat-attach-voice">
      <audio controls src={url} />
    </div>
  );
}

function ChatFileLink({ fileId }) {
  const handleDownload = async () => {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const r = await fetch(`${API_BASE}/v1/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("download failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-file-${fileId}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("파일을 다운로드할 수 없습니다.");
    }
  };
  return (
    <div className="chat-attach chat-attach-file">
      <span className="material-symbols-outlined">description</span>
      <button type="button" className="chat-file-link" onClick={handleDownload}>
        파일 다운로드
      </button>
    </div>
  );
}

function ArchivedAttachmentBadge({ messageType, state }) {
  const icon =
    messageType === "image" ? "image" : messageType === "voice" ? "mic" : "description";
  const label =
    messageType === "image" ? "이미지" : messageType === "voice" ? "음성 메시지" : "파일";
  return (
    <div className="chat-attach chat-attach-archived">
      <div className="chat-attach-icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="chat-attach-meta">
        <div className="chat-attach-label">{label}</div>
        <div className="chat-attach-note">
          {state === "purged" ? "보관 기한 만료" : "다운로드 기한 만료"}
        </div>
      </div>
    </div>
  );
}

function renderAttachment(msg) {
  const state = msg.attachmentState || "live";
  const fileId = msg.fileId;

  // 텍스트/공지: 첨부 없음
  if (msg.messageType === "text" || msg.messageType === "notice") return null;

  // 보관함 / 만료된 첨부: 썸네일만
  if (state !== "live" || !fileId) {
    return <ArchivedAttachmentBadge messageType={msg.messageType} state={state} />;
  }

  if (msg.messageType === "image") return <ChatImage fileId={fileId} />;
  if (msg.messageType === "voice") return <ChatVoicePlayer fileId={fileId} />;
  return <ChatFileLink fileId={fileId} />;
}

function MessageBubble({ message, isMine, isAdmin, onDelete, onLikeToggle, onShowLikes }) {
  const colors = userColors(message.userId);
  const bubbleStyle = isMine
    ? { borderColor: colors.border, background: "#cdf5b9" }
    : { borderColor: colors.border, background: "#ffffff" };
  const { emoticons } = useEmoticons();
  const emoticon =
    message.messageType === "emoticon"
      ? findEmoticonById(emoticons, message.content)
      : null;

  // 길게 누름 / 우클릭 → 좋아요 토글
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);

  const triggerLike = () => {
    if (!onLikeToggle) return;
    if (message.status === "deleted") return;
    onLikeToggle(message.id);
  };

  const handleTouchStart = () => {
    longPressFired.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      triggerLike();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    triggerLike();
  };

  if (message.status === "deleted") {
    return (
      <div className={`chat-msg ${isMine ? "mine" : "other"} deleted`}>
        {!isMine && <Avatar userId={message.userId} userName={message.userName} userAvatarUrl={message.userAvatarUrl} />}
        <div className="chat-msg-body">
          <div className="chat-bubble deleted-bubble">삭제된 메시지입니다</div>
        </div>
      </div>
    );
  }

  if (message.messageType === "notice") {
    return (
      <div className="chat-notice">
        <div className="chat-notice-icon">📢</div>
        <div className="chat-notice-body">
          <div className="chat-notice-author">{message.userName} (공지)</div>
          <div className="chat-notice-content">{message.content}</div>
          <div className="chat-notice-time">{formatTime(message.createdAt)}</div>
        </div>
        {isAdmin && onDelete && (
          <button
            type="button"
            className="chat-msg-delete"
            onClick={() => {
              if (window.confirm("이 공지를 삭제하시겠습니까?")) onDelete(message.id);
            }}
          >
            삭제
          </button>
        )}
      </div>
    );
  }

  const canDelete = (isAdmin || isMine) && !!onDelete;

  return (
    <div className={`chat-msg ${isMine ? "mine" : "other"}`}>
      {!isMine && (
        <Avatar
          userId={message.userId}
          userName={message.userName}
          userAvatarUrl={message.userAvatarUrl}
        />
      )}
      <div className="chat-msg-body">
        {!isMine && (
          <div className="chat-msg-name" style={{ color: colors.border }}>
            {message.userName}
            {message.userId === PODO_USER_ID ? " 🍇AI" : message.isAdmin ? " (관리자)" : ""}
          </div>
        )}
        <div className="chat-bubble-row">
          {isMine && <div className="chat-msg-time">{formatTime(message.createdAt)}</div>}
          {message.messageType === "emoticon" ? (
            // 이모티콘은 말풍선 없이 큰 이미지로 표시
            <div
              className="chat-emoticon-msg"
              onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {canDelete && (
                <button
                  type="button"
                  className="chat-bubble-delete chat-emoticon-delete"
                  title="메시지 삭제"
                  aria-label="메시지 삭제"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("이 이모티콘을 삭제하시겠습니까?")) onDelete(message.id);
                  }}
                >
                  ✕
                </button>
              )}
              {emoticon ? (
                <EmoticonImage fileId={emoticon.fileId} alt={emoticon.name} className="chat-emoticon-large" />
              ) : (
                <div className="chat-emoticon-missing">[이모티콘]</div>
              )}
              <div className="chat-like-row">
                <button
                  type="button"
                  className={`chat-like-btn ${message.likedByMe ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerLike();
                  }}
                  title="좋아요"
                >
                  {message.likedByMe ? "❤" : "♡"}
                </button>
                {message.likeCount > 0 && (
                  <button
                    type="button"
                    className={`chat-like-badge ${message.likedByMe ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowLikes?.(message.id);
                    }}
                    title="좋아요 누른 사람 보기"
                  >
                    ❤ {message.likeCount}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`chat-bubble ${message.isAdmin ? "admin" : ""}`}
              style={bubbleStyle}
              onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {canDelete && (
                <button
                  type="button"
                  className="chat-bubble-delete"
                  title="메시지 삭제"
                  aria-label="메시지 삭제"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("이 메시지를 삭제하시겠습니까?")) onDelete(message.id);
                  }}
                >
                  ✕
                </button>
              )}
              {message.content && (
                <div className="chat-text">
                  <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                </div>
              )}
              {renderAttachment(message)}
              <div className="chat-like-row">
                <button
                  type="button"
                  className={`chat-like-btn ${message.likedByMe ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerLike();
                  }}
                  title="좋아요"
                >
                  {message.likedByMe ? "❤" : "♡"}
                </button>
                {message.likeCount > 0 && (
                  <button
                    type="button"
                    className={`chat-like-badge ${message.likedByMe ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowLikes?.(message.id);
                    }}
                    title="좋아요 누른 사람 보기"
                  >
                    ❤ {message.likeCount}
                  </button>
                )}
              </div>
            </div>
          )}
          {!isMine && <div className="chat-msg-time">{formatTime(message.createdAt)}</div>}
        </div>
      </div>
      {isMine && (
        <Avatar
          userId={message.userId}
          userName={message.userName}
          userAvatarUrl={message.userAvatarUrl}
        />
      )}
    </div>
  );
}

export default MessageBubble;
