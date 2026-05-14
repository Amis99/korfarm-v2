import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPut } from "../utils/api";

function AdminSettingsPage() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    apiGet("/v1/auth/me")
      .then((data) => {
        setMe(data);
        setName(data?.name || "");
      })
      .catch(() => setError("정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newPassword) {
      setError("새 비밀번호를 입력해 주세요.");
      return;
    }
    if (newPassword.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인이 일치하지 않습니다.");
      return;
    }
    setSaving(true);
    try {
      await apiPut("/v1/auth/me", { password: newPassword });
      setSuccess("비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err?.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) {
      setError("이름은 비울 수 없습니다.");
      return;
    }
    setSaving(true);
    try {
      await apiPut("/v1/auth/me", { name: name.trim() });
      setSuccess("이름이 변경되었습니다.");
    } catch (err) {
      setError(err?.message || "변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>불러오는 중...</div>;
  }

  const roleLabels = (user?.roles || [])
    .map((r) => ({ HQ_ADMIN: "본사 관리자", ORG_ADMIN: "기관 관리자", PAID: "유료", STUDENT: "학생", PARENT: "학부모" }[r] || r))
    .join(" · ");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px", fontFamily: "var(--font-body)" }}>
      <h1 style={{ marginBottom: 6 }}>내 설정</h1>
      <p style={{ color: "#777", marginTop: 0, marginBottom: 24, fontSize: "0.95rem" }}>
        관리자 계정의 기본 정보와 비밀번호를 관리합니다.
      </p>

      {error && (
        <div style={{ padding: 12, background: "#fdecea", color: "#a73a2d", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: 12, background: "#e9f7ec", color: "#2e7d32", borderRadius: 8, marginBottom: 16 }}>
          {success}
        </div>
      )}

      {/* 계정 정보 */}
      <section style={cardStyle}>
        <h2 style={h2Style}>계정 정보</h2>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>이메일</span>
          <span style={infoValueStyle}>{me?.email || me?.loginId || "-"}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>권한</span>
          <span style={infoValueStyle}>{roleLabels || "-"}</span>
        </div>
        <form onSubmit={handleSaveName} style={{ marginTop: 12 }}>
          <label style={labelStyle}>이름</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              maxLength={32}
            />
            <button type="submit" disabled={saving} style={btnStyle}>
              이름 저장
            </button>
          </div>
        </form>
      </section>

      {/* 비밀번호 변경 */}
      <section style={cardStyle}>
        <h2 style={h2Style}>비밀번호 변경</h2>
        <p style={{ color: "#777", fontSize: "0.9rem", marginTop: 0, marginBottom: 14 }}>
          관리자 계정 보안을 위해 정기적으로 비밀번호를 변경하시기 바랍니다.
          새 비밀번호는 영문/숫자/특수문자 조합 8자 이상 권장.
        </p>
        <form onSubmit={handleSavePassword}>
          <label style={labelStyle}>새 비밀번호 (8자 이상)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호"
            style={inputStyle}
            autoComplete="new-password"
          />
          <label style={{ ...labelStyle, marginTop: 12 }}>새 비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호 다시 입력"
            style={inputStyle}
            autoComplete="new-password"
          />
          <button type="submit" disabled={saving || !newPassword} style={{ ...btnStyle, marginTop: 14 }}>
            {saving ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </section>
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  border: "1px solid #e0d6cc",
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
};
const h2Style = { fontSize: "1.1rem", marginTop: 0, marginBottom: 14, color: "#3a4a3e" };
const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px dashed #f0e9e0",
  fontSize: "0.95rem",
};
const infoLabelStyle = { color: "#777" };
const infoValueStyle = { fontWeight: 600, color: "#3a4a3e" };
const labelStyle = { display: "block", fontSize: "0.9rem", color: "#555", marginBottom: 6, fontWeight: 600 };
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d0c5b8",
  borderRadius: 8,
  fontSize: "0.95rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
};
const btnStyle = {
  padding: "10px 20px",
  background: "#3a4a3e",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.95rem",
  whiteSpace: "nowrap",
};

export default AdminSettingsPage;
