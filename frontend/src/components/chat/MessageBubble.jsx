import { useEffect, useState } from "react";
import { API_BASE, TOKEN_KEY } from "../../utils/api";

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

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

function MessageBubble({ message, isMine, isAdmin, onDelete }) {
  if (message.status === "deleted") {
    return (
      <div className={`chat-msg ${isMine ? "mine" : "other"} deleted`}>
        <div className="chat-bubble deleted-bubble">삭제된 메시지입니다</div>
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

  return (
    <div className={`chat-msg ${isMine ? "mine" : "other"}`}>
      {!isMine && (
        <div className="chat-msg-name">
          {message.userName}
          {message.isAdmin ? " (관리자)" : ""}
        </div>
      )}
      <div className="chat-bubble-row">
        {isMine && <div className="chat-msg-time">{formatTime(message.createdAt)}</div>}
        <div className={`chat-bubble ${message.isAdmin ? "admin" : ""}`}>
          {message.content && <div className="chat-text">{message.content}</div>}
          {renderAttachment(message)}
        </div>
        {!isMine && <div className="chat-msg-time">{formatTime(message.createdAt)}</div>}
      </div>
      {(isAdmin || isMine) && onDelete && (
        <button
          type="button"
          className="chat-msg-delete"
          onClick={() => {
            if (window.confirm("이 메시지를 삭제하시겠습니까?")) onDelete(message.id);
          }}
        >
          삭제
        </button>
      )}
    </div>
  );
}

export default MessageBubble;
