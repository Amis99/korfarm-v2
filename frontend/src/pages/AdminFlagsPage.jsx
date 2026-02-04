import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../utils/adminApi";
import "../styles/admin-detail.css";

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
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>운영 플래그</h1>
          <div className="admin-detail-actions">
            <Link className="admin-detail-btn secondary" to="/admin">
              대시보드
            </Link>
          </div>
        </div>
        <div className="admin-detail-nav">
          <Link to="/admin/orgs">기관</Link>
          <Link to="/admin/classes">반</Link>
          <Link to="/admin/students">학생</Link>
          <Link to="/admin/parents">학부모 관리</Link>
          <Link to="/admin/content">콘텐츠</Link>
          <Link to="/admin/assignments">과제</Link>
          <Link to="/admin/seasons">시즌</Link>
          <Link to="/admin/shop/products">상품</Link>
          <Link to="/admin/shop/orders">주문</Link>
          <Link to="/admin/payments">결제</Link>
          <Link to="/admin/reports">보고</Link>
          <Link to="/admin/flags">플래그</Link>
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
                  <p>{flag.description || "-"}</p>
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
    </div>
  );
}

export default AdminFlagsPage;
