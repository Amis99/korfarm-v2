import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

/** 플래그 키별 기능 설명 매핑 */
const FLAG_DESCRIPTIONS = {
  "feature.shop.mall": "쇼핑몰 전체 기능 (상품 관리, 주문 관리)",
  "feature.admin.console": "관리자 콘솔 고급 기능 (대결 시즌, 콘텐츠, 테스트 뱅크)",
  "feature.paid.writing": "유료 글쓰기 기능 (제출물 조회, 피드백)",
  "feature.paid.test_bank": "유료 테스트 뱅크 (시험 생성, 채점)",
  "feature.economy.harvest": "경제 시스템 (씨앗 교환, 수확)",
  "feature.duel": "대결 시스템",
  "feature.community": "커뮤니티 게시판",
};

function AdminFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    apiGet("/v1/admin/flags")
      .then((data) => {
        const mapped = Array.isArray(data)
          ? data.map((f) => ({
              flagKey: f.flag_key ?? f.flagKey,
              enabled: f.enabled,
              rolloutPercent: f.rollout_percent ?? f.rolloutPercent ?? 100,
              description: f.description ?? "",
              updatedAt: f.updated_at ?? f.updatedAt ?? "",
            }))
          : [];
        setFlags(mapped);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (flagKey, currentEnabled) => {
    setActionLoading(true);
    try {
      const result = await apiPatch(`/v1/admin/flags/${flagKey}`, {
        enabled: !currentEnabled,
      });
      setFlags((prev) =>
        prev.map((f) =>
          f.flagKey === flagKey
            ? {
                ...f,
                enabled: result.enabled ?? !currentEnabled,
                updatedAt: result.updated_at ?? result.updatedAt ?? f.updatedAt,
              }
            : f
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>운영 플래그</h1>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>플래그 목록</h2>
            {loading ? <p className="admin-detail-note">플래그를 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            {flags.map((flag) => (
              <div className="admin-toggle" key={flag.flagKey}>
                <div>
                  <strong>{flag.flagKey}</strong>
                  {/* 플래그 기능 설명: 백엔드 description 우선, 없으면 프론트 매핑 사용 */}
                  <p style={{ fontSize: "12px", color: "#888", margin: "2px 0 4px" }}>
                    {flag.description || FLAG_DESCRIPTIONS[flag.flagKey] || ""}
                  </p>
                  <p style={{ fontSize: "12px", color: "#888" }}>
                    롤아웃 {flag.rolloutPercent}%
                    {flag.updatedAt ? ` · ${new Date(flag.updatedAt).toLocaleString("ko-KR")}` : ""}
                  </p>
                </div>
                <button
                  className={`admin-detail-btn ${flag.enabled ? "" : "secondary"}`}
                  type="button"
                  onClick={() => handleToggle(flag.flagKey, flag.enabled)}
                  disabled={actionLoading}
                >
                  {flag.enabled ? "끄기" : "켜기"}
                </button>
              </div>
            ))}
            {!loading && flags.length === 0 && !error ? (
              <p className="admin-detail-note">플래그가 없습니다.</p>
            ) : null}
          </div>
          <div className="admin-detail-card">
            <h3>운영 메모</h3>
            <p>플래그 변경은 즉시 서비스에 반영됩니다.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminFlagsPage;
