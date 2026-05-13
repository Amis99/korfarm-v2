import { useFileBlob } from "../hooks/useFileBlob";

/**
 * 헤더 — 기관 소속 사용자(학생·학부모)의 학원 로고/이름 표시.
 * 국어농장 로고 옆에 붙는 형태. 로고 fileId 가 있으면 로고만, 없으면 기관명 텍스트.
 * orgName 이 null/빈문자열이면 아무것도 렌더 안 함.
 *
 * Props:
 *   orgName     기관명
 *   logoFileId  학원 로고 파일 id (없으면 null)
 *   compact     true 면 좁은 모바일 헤더용 (이미지 24px, 텍스트 12px)
 */
export default function OrgBadge({ orgName, logoFileId, compact = false }) {
  const blobUrl = useFileBlob(logoFileId);
  if (!orgName) return null;
  const imgSize = compact ? 22 : 28;
  return (
    <span
      className="org-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginLeft: 8,
        padding: "3px 9px",
        background: "rgba(255, 244, 220, 0.7)",
        border: "1px solid rgba(212, 156, 60, 0.25)",
        borderRadius: 999,
        fontSize: compact ? 11.5 : 12.5,
        fontWeight: 700,
        color: "#5C3D08",
        whiteSpace: "nowrap",
      }}
      aria-label={`기관 ${orgName}`}
      title={orgName}
    >
      {logoFileId && blobUrl ? (
        <img
          src={blobUrl}
          alt={orgName}
          style={{ height: imgSize, width: "auto", maxWidth: imgSize * 3, display: "block" }}
        />
      ) : (
        <span>{orgName}</span>
      )}
    </span>
  );
}
