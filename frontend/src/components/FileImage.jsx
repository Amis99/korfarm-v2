import { useFileBlob } from "../hooks/useFileBlob";

/**
 * /v1/files/{fileId}/download URL 은 Authorization 헤더가 필요해 <img src> 직접 박으면 401.
 * useFileBlob 로 fetch + blob URL 로 표시.
 */
export default function FileImage({ fileId, alt, style }) {
  const blobUrl = useFileBlob(fileId);
  if (!blobUrl) {
    return (
      <span style={{ color: "#999", fontSize: 12, padding: "2px 6px" }}>
        {alt || "이미지 불러오는 중..."}
      </span>
    );
  }
  return (
    <img
      src={blobUrl}
      alt={alt || ""}
      style={style || { maxWidth: "100%", display: "block", margin: "4px 0" }}
    />
  );
}

/**
 * react-markdown 의 components.img override 용.
 * `![alt](/v1/files/file_xxx/download)` 패턴 자동 처리.
 *
 * 사용:
 *   import { mdImgRenderer } from "./FileImage";
 *   <ReactMarkdown components={{ img: mdImgRenderer }}>...</ReactMarkdown>
 */
export function mdImgRenderer({ src, alt, ...rest }) {
  if (typeof src === "string") {
    const m = src.match(/\/v1\/files\/([A-Za-z0-9_-]+)\/download/);
    if (m) {
      return <FileImage fileId={m[1]} alt={alt} />;
    }
  }
  return <img src={src} alt={alt || ""} {...rest} style={{ maxWidth: "100%", display: "block", margin: "4px 0" }} />;
}
