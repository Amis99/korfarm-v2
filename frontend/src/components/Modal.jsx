import { useEffect } from "react";

/**
 * 공용 모달 — overlay + 닫기 + ESC/외부 클릭 닫기.
 * - 학생 모드 / 관리자 모드 모두 재사용 (다크 테마, var(--bg)·var(--panel)·var(--text)·var(--stroke))
 *
 * props:
 *  - open: boolean
 *  - onClose: () => void
 *  - title?: string
 *  - size?: "sm" | "md" | "lg" | "xl"  (기본 md)
 *  - children: 본문
 */
export default function Modal({ open, onClose, title, size = "md", children }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handler);
    // 배경 스크롤 잠금
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthMap = { sm: 420, md: 640, lg: 920, xl: 1200 };
  const maxWidth = widthMap[size] ?? widthMap.md;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth, maxHeight: "90vh", overflow: "auto",
          background: "var(--panel)", color: "var(--text)",
          border: "1px solid var(--stroke)", borderRadius: 10,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {(title || onClose) && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: "1px solid var(--stroke)",
            position: "sticky", top: 0, background: "var(--panel)", zIndex: 1,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{title || ""}</div>
            <button
              onClick={onClose}
              aria-label="닫기"
              style={{
                background: "transparent", border: 0, cursor: "pointer",
                color: "var(--muted)", fontSize: 20, padding: "0 4px",
              }}
            >×</button>
          </div>
        )}
        <div style={{ padding: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
