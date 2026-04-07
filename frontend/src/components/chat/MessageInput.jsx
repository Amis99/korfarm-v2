import { useRef, useState } from "react";
import { apiPost, API_BASE, TOKEN_KEY } from "../../utils/api";
import VoiceRecorder from "./VoiceRecorder";
import { useEmoticons } from "../../hooks/useEmoticons";
import EmoticonImage from "./EmoticonImage";

/**
 * 채팅 입력 컴포넌트.
 *
 * Props:
 *   onSend(messageType, content, fileId)
 *   onSendNotice(content) — 관리자만, 공지 메시지
 *   isAdmin: boolean
 *   disabled: boolean
 */
function MessageInput({ onSend, onSendNotice, isAdmin, disabled }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const { emoticons } = useEmoticons();

  const handleTextSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend("text", trimmed, null);
    setText("");
  };

  const handleNoticeSend = () => {
    if (!isAdmin) return;
    const content = window.prompt("공지 메시지 내용을 입력하세요:");
    if (!content || !content.trim()) return;
    onSendNotice(content.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  };

  const uploadFile = async (file, mime) => {
    setError("");
    setUploading(true);
    try {
      // 1) presign
      const presign = await apiPost("/v1/files/presign", {
        purpose: "chat",
        mime,
        size: file.size,
      });
      // 2) upload
      const fd = new FormData();
      fd.append("file", file);
      const token = sessionStorage.getItem(TOKEN_KEY);
      const r = await fetch(`${API_BASE}/v1/files/${presign.fileId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(`업로드 실패: ${msg}`);
      }
      return presign.fileId;
    } catch (e) {
      setError(e.message || "업로드 실패");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 가능합니다.");
      return;
    }
    const fileId = await uploadFile(file, file.type);
    if (fileId) onSend("image", null, fileId);
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    const fileId = await uploadFile(file, file.type || "application/octet-stream");
    if (fileId) onSend("file", null, fileId);
  };

  const handleVoiceRecorded = async (blob, mime) => {
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: mime });
    const fileId = await uploadFile(file, mime);
    if (fileId) onSend("voice", null, fileId);
  };

  const handleEmoticonSelect = (emoticonId) => {
    onSend("emoticon", emoticonId, null);
    setPickerOpen(false);
  };

  return (
    <div className="chat-input-bar">
      {error && <div className="chat-input-error">{error}</div>}
      <div className="chat-input-row">
        {/* 이미지 첨부 */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageSelected}
        />
        <button
          type="button"
          className="chat-icon-btn"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || uploading}
          aria-label="이미지 첨부"
          title="이미지"
        >
          <span className="material-symbols-outlined">image</span>
        </button>

        {/* 파일 첨부 */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />
        <button
          type="button"
          className="chat-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          aria-label="파일 첨부"
          title="파일"
        >
          <span className="material-symbols-outlined">attach_file</span>
        </button>

        {/* 음성 녹음 */}
        <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={disabled || uploading} />

        {/* 관리자: 공지 발송 */}
        {isAdmin && (
          <button
            type="button"
            className="chat-icon-btn chat-notice-btn"
            onClick={handleNoticeSend}
            disabled={disabled}
            aria-label="공지 발송"
            title="공지 보내기 (관리자)"
          >
            <span className="material-symbols-outlined">campaign</span>
          </button>
        )}

        {/* 텍스트 입력 */}
        <textarea
          className="chat-text-input"
          rows={1}
          placeholder={uploading ? "업로드 중..." : "메시지 입력"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || uploading}
        />

        <button
          type="button"
          className="chat-send-btn"
          onClick={handleTextSend}
          disabled={disabled || uploading || !text.trim()}
        >
          전송
        </button>

        {/* 이모티콘 버튼 — 가장 우측 원형 */}
        <button
          type="button"
          className="chat-emoticon-btn"
          onClick={() => setPickerOpen((v) => !v)}
          disabled={disabled}
          aria-label="이모티콘"
          title="이모티콘"
        >
          <span className="material-symbols-outlined">mood</span>
        </button>
      </div>

      {pickerOpen && (
        <div className="chat-emoticon-picker">
          <div className="chat-emoticon-picker-header">
            <span>이모티콘</span>
            <button
              type="button"
              className="chat-emoticon-picker-close"
              onClick={() => setPickerOpen(false)}
            >
              ✕
            </button>
          </div>
          {emoticons.length === 0 ? (
            <div className="chat-emoticon-picker-empty">
              등록된 이모티콘이 없습니다.
              <br />
              관리자가 등록 후 사용 가능합니다.
            </div>
          ) : (
            <div className="chat-emoticon-picker-grid">
              {emoticons.map((emo) => (
                <button
                  key={emo.id}
                  type="button"
                  className="chat-emoticon-picker-item"
                  title={emo.name}
                  onClick={() => handleEmoticonSelect(emo.id)}
                >
                  <EmoticonImage fileId={emo.fileId} alt={emo.name} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageInput;
