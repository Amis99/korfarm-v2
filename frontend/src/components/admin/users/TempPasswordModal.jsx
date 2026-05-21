import { useEffect, useState } from "react";

/**
 * N-32 (2026-05-22) — 임시 비밀번호 1회 표시 모달.
 * 어드민이 학생·학부모·기관 관리자 비번 재설정 시 응답으로 받은 평문 임시 비번 표시.
 * - 모노스페이스 + 큰 글자
 * - 클립보드 복사 버튼 (성공/실패 피드백)
 * - "닫으면 다시 볼 수 없음" 안내
 * - ESC / 배경 클릭 닫기는 안전상 비활성 — 명시적 닫기 버튼만 허용
 */
function TempPasswordModal({ open, name, loginId, tempPassword, onClose }) {
  const [copyState, setCopyState] = useState("idle"); // idle / copied / failed

  useEffect(() => {
    if (open) setCopyState("idle");
  }, [open, tempPassword]);

  if (!open || !tempPassword) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      // 권한 또는 비보안 컨텍스트 fallback — 텍스트 선택만 안내
      setCopyState("failed");
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="admin-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, color: "#3a4a3e" }}>임시 비밀번호 발급 완료</h2>
        <p style={{ color: "#5a4030", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 8px" }}>
          <strong>{name || loginId || "사용자"}</strong> 의 임시 비밀번호입니다.
        </p>
        <p style={{ color: "#c0392b", fontSize: "0.85rem", margin: "0 0 14px" }}>
          ⚠ 이 창을 닫으면 다시 볼 수 없습니다. 지금 복사 후 본인에게 직접 전달해 주세요.
        </p>

        <div
          style={{
            background: "#fff",
            border: "2px dashed #b45309",
            borderRadius: 8,
            padding: "16px 20px",
            margin: "12px 0",
            fontFamily: "Consolas, Menlo, monospace",
            fontSize: "1.3rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textAlign: "center",
            color: "#3a3020",
            userSelect: "all",
          }}
        >
          {tempPassword}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            className="admin-detail-btn"
            onClick={handleCopy}
            style={{ flex: 1, padding: "10px 16px", fontSize: "0.95rem" }}
          >
            {copyState === "copied" ? "✅ 복사 완료" : copyState === "failed" ? "복사 실패 — 직접 선택해 주세요" : "📋 클립보드 복사"}
          </button>
          <button
            type="button"
            className="admin-detail-btn secondary"
            onClick={onClose}
            style={{ padding: "10px 20px", fontSize: "0.95rem" }}
          >
            닫기
          </button>
        </div>

        <p style={{ color: "#8a7468", fontSize: "0.8rem", margin: "12px 0 0", textAlign: "center" }}>
          학생/학부모/관리자에게 임시 비밀번호를 전달하고, 첫 로그인 후 본인이 직접 새 비밀번호로 변경하도록 안내해 주세요.
        </p>
      </div>
    </div>
  );
}

export default TempPasswordModal;
