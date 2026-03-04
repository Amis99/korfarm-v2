import { useEffect } from "react";

/**
 * 유튜브 영상 모달
 * - url: 유튜브 URL (watch, embed, youtu.be 지원)
 * - onClose: 닫기 콜백
 */
function VideoModal({ url, onClose }) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const embedUrl = toEmbedUrl(url);

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="video-modal-close" onClick={onClose} title="닫기">
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="video-modal-iframe-wrap">
          <iframe
            src={embedUrl}
            title="영상"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

/** 유튜브 URL → embed URL 변환 */
function toEmbedUrl(url) {
  if (!url) return "";
  // 이미 embed URL인 경우
  if (url.includes("/embed/")) return url;
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // youtube.com/watch?v=VIDEO_ID
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
  // fallback
  return url;
}

export default VideoModal;
