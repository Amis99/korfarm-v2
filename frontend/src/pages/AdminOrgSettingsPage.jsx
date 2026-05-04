import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { apiGetCamel, apiPatchDeep } from "../utils/adminApi";
import { uploadFile, fileDownloadUrl } from "../utils/fileUpload";
import "../styles/admin.css";

// 기관 관리자 — 본인 기관 정보 수정 + 로고 등록
// HQ_ADMIN 도 자기 자신이 hq 기관에 속하면 이 메뉴로 본사 정보 수정 가능 (사이드바에서는 ORG_ADMIN 에게만 노출)
export default function AdminOrgSettingsPage() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  // 폼 상태
  const [name, setName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [addressRegion, setAddressRegion] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [logoFileId, setLogoFileId] = useState(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetCamel("/v1/admin/orgs/me");
      setOrg(data);
      setName(data?.name || "");
      setOrgType(data?.orgType || "");
      setAddressRegion(data?.addressRegion || "");
      setAddressDetail(data?.addressDetail || "");
      setLogoFileId(data?.logoFileId || null);
    } catch (e) {
      setError(e.message || "기관 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleLogoUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await uploadFile(file, { purpose: "content" });
      setLogoFileId(result.fileId);
      setMessage("로고 업로드 완료. 저장 버튼을 눌러주세요.");
    } catch (e) {
      setError(e.message || "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("기관 이름은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage("");
    try {
      await apiPatchDeep("/v1/admin/orgs/me", {
        name: name.trim(),
        orgType: orgType || null,
        addressRegion: addressRegion || null,
        addressDetail: addressDetail || null,
        logoFileId: logoFileId || "",  // 빈 문자열 → 백엔드에서 null 처리
      });
      setMessage("저장되었습니다.");
      await reload();
    } catch (e) {
      setError(e.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFileId(null);
    setMessage("로고가 제거되었습니다. 저장 버튼을 눌러주세요.");
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap" style={{ maxWidth: 720 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined">settings</span>
          기관 설정
        </h1>

        {loading ? (
          <p>불러오는 중...</p>
        ) : !org ? (
          <p style={{ color: "#c00" }}>{error || "기관 정보를 찾을 수 없습니다."}</p>
        ) : (
          <>
            <div style={{
              padding: 16,
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              background: "#fafafa",
              marginBottom: 16,
              fontSize: 13,
              color: "#666"
            }}>
              <strong>기관 ID:</strong> {org.orgId}
              {org.plan && <> · <strong>플랜:</strong> {org.plan}</>}
              {" · "}<strong>좌석:</strong> {org.seatLimit}
            </div>

            {/* 로고 업로드 */}
            <div className="admin-form-group" style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                기관 로고
              </label>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                인쇄물 헤더에 국어농장 로고와 함께 출력됩니다. 정사각형 또는 가로로 긴 PNG 권장 (배경 투명).
              </p>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
                {logoFileId ? (
                  <div style={{
                    width: 120, height: 80,
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    <img
                      src={fileDownloadUrl(logoFileId)}
                      alt="기관 로고"
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: 120, height: 80,
                    border: "1px dashed #ccc",
                    borderRadius: 4,
                    background: "#f5f5f5",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#999", fontSize: 12,
                  }}>
                    로고 없음
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{
                    padding: "6px 14px",
                    background: "#2f7a3e",
                    color: "#fff",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 13,
                    display: "inline-block",
                  }}>
                    {uploading ? "업로드 중..." : "이미지 선택"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={uploading}
                      onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                    />
                  </label>
                  {logoFileId && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      style={{
                        padding: "6px 14px",
                        background: "none",
                        border: "1px solid #c00",
                        color: "#c00",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      로고 제거
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 기관 정보 */}
            <div className="admin-form-group" style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                기관 이름 <span style={{ color: "#c00" }}>*</span>
              </label>
              <input
                type="text"
                className="admin-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4 }}
              />
            </div>

            <div className="admin-form-group" style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                기관 종류
              </label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4 }}
              >
                <option value="">선택</option>
                <option value="academy">학원</option>
                <option value="school">학교</option>
                <option value="study_room">공부방</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div className="admin-form-group" style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                지역 (시·도)
              </label>
              <input
                type="text"
                value={addressRegion}
                onChange={(e) => setAddressRegion(e.target.value)}
                placeholder="예: 서울특별시 강남구"
                style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4 }}
              />
            </div>

            <div className="admin-form-group" style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                상세 주소
              </label>
              <input
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="예: 테헤란로 100, 5층"
                style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4 }}
              />
            </div>

            {error && (
              <div style={{ padding: 10, background: "#fee", color: "#c00", borderRadius: 4, marginBottom: 12 }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ padding: 10, background: "#efe", color: "#2f7a3e", borderRadius: 4, marginBottom: 12 }}>
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              style={{
                padding: "10px 24px",
                background: "#2f7a3e",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
