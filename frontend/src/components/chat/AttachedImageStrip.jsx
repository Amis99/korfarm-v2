import { API_BASE } from "../../utils/api";
import "./attached-image-strip.css";

function imageFileId(img) {
  return img?.fileId || img?.file_id || "";
}

function imageUrl(img) {
  const fileId = imageFileId(img);
  const direct = img?.previewUrl || img?.preview_url || img?.thumbnailUrl || img?.thumbnail_url;
  if (direct) {
    if (direct.startsWith("http") || direct.startsWith("blob:")) return direct;
    if (direct.startsWith("/")) return `${API_BASE.replace(/\/$/, "")}${direct}`;
    return direct;
  }
  return fileId ? `${API_BASE.replace(/\/$/, "")}/v1/files/${fileId}/download` : "";
}

export default function AttachedImageStrip({ images, onRemove, disabled = false }) {
  if (!images?.length) return null;
  return (
    <div className="attached-image-strip">
      {images.map((img) => {
        const fileId = imageFileId(img);
        const src = imageUrl(img);
        return (
          <div key={fileId || src} className="attached-image-item">
            {src ? <img src={src} alt={img?.name || "첨부 이미지"} /> : null}
            {onRemove && !disabled ? (
              <button
                type="button"
                className="attached-image-remove"
                onClick={() => onRemove(fileId)}
                aria-label="첨부 이미지 제거"
                title="제거"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
