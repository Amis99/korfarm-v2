import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost, apiPatch } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import { useRequireRole } from "../hooks/useRequireRole";
import AdminLayout from "../components/AdminLayout";
import AdminPaymentsPage from "./AdminPaymentsPage";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import "../styles/admin-detail.css";

const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const ORG_TYPES = [
  { value: "", label: "선택 안 함" },
  { value: "학원", label: "학원" },
  { value: "학교", label: "학교" },
  { value: "공공기관", label: "공공기관" },
  { value: "기타", label: "기타" },
];

const ORGS = [
  { id: "sample1", name: "Korfarm Academy", status: "active", admins: [] },
];

const mapOrgList = (items) =>
  items.map((org) => ({
    id: org.orgId || org.id || org.org_id || org.name,
    name: org.name,
    orgType: org.orgType || org.org_type || "",
    addressRegion: org.addressRegion || org.address_region || "",
    addressDetail: org.addressDetail || org.address_detail || "",
    admins: (org.admins || []).map((a) => ({
      userId: a.userId || a.user_id,
      loginId: a.loginId || a.login_id || a.email || "",
      name: a.name || "",
      phone: a.phone || "",
      role: a.role || "ORG_ADMIN",
    })),
    status: org.status || "active",
  }));

function OrgsListContent() {
  const { data: orgs, loading, error } = useAdminList("/v1/admin/orgs", ORGS, mapOrgList);
  const [rows, setRows] = useState(ORGS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOrg, setEditOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    orgType: "", addressRegion: "", addressDetail: "",
    // 사업자 정보
    businessNumber: "", representativeName: "",
    contactPhone: "", contactEmail: "", taxEmail: "",
    // 같이 등록할 ORG_ADMIN (선택)
    withAdmin: false,
    adminLoginId: "", adminName: "", adminPhone: "",
  });
  const [adminLoginId, setAdminLoginId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  /** 기관 + ORG_ADMIN 동시 등록 후 한 번만 표시할 임시 비밀번호 모달 */
  const [createdAdmin, setCreatedAdmin] = useState(null);

  useEffect(() => {
    setRows(orgs);
  }, [orgs]);

  const filteredOrgs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((org) => {
      if (statusFilter !== "all" && org.status !== statusFilter) return false;
      if (!term) return true;
      return [org.name, org.orgType, org.addressRegion, org.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const { page, setPage, totalPages, paged: pagedOrgs } = usePagination(filteredOrgs, 15);
  useEffect(() => { setPage(1); }, [search, statusFilter, setPage]);

  const handleCreate = async () => {
    setActionError("");
    if (!formData.name.trim()) {
      setActionError("기관명을 입력해 주세요.");
      return;
    }
    // 관리자 같이 등록 모드면 loginId·name 둘 다 필수
    if (formData.withAdmin) {
      if (!formData.adminLoginId.trim() || !formData.adminName.trim()) {
        setActionError("관리자 아이디와 이름을 모두 입력해 주세요.");
        return;
      }
      if (formData.adminLoginId.trim().length < 3) {
        setActionError("관리자 아이디는 3자 이상 입력해 주세요.");
        return;
      }
    }
    setActionLoading(true);
    try {
      const body = {
        name: formData.name.trim(),
        org_type: formData.orgType || undefined,
        address_region: formData.addressRegion || undefined,
        address_detail: formData.addressDetail.trim() || undefined,
        business_number: formData.businessNumber.trim() || undefined,
        representative_name: formData.representativeName.trim() || undefined,
        contact_phone: formData.contactPhone.trim() || undefined,
        contact_email: formData.contactEmail.trim() || undefined,
        tax_email: formData.taxEmail.trim() || undefined,
      };
      if (formData.withAdmin) {
        body.admin_login_id = formData.adminLoginId.trim();
        body.admin_name = formData.adminName.trim();
        body.admin_phone = formData.adminPhone.trim() || undefined;
      }
      const result = await apiPost("/v1/admin/orgs", body);
      // 응답 형식: { org: AdminOrgView, admin: AdminCreatedView? }
      const orgData = result?.org || result;
      const adminData = result?.admin;
      const mapped = mapOrgList([orgData])[0];
      setRows((prev) => [mapped, ...prev]);
      setShowCreateModal(false);
      setFormData({
        name: "", orgType: "", addressRegion: "", addressDetail: "",
        businessNumber: "", representativeName: "",
        contactPhone: "", contactEmail: "", taxEmail: "",
        withAdmin: false, adminLoginId: "", adminName: "", adminPhone: "",
      });
      if (adminData) {
        // snake_case 응답 대응 — temporary_password 또는 temporaryPassword
        setCreatedAdmin({
          orgName: mapped.name,
          userId: adminData.user_id || adminData.userId,
          loginId: adminData.login_id || adminData.loginId,
          name: adminData.name,
          temporaryPassword: adminData.temporary_password || adminData.temporaryPassword,
        });
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editOrg) return;
    setActionError("");
    setActionLoading(true);
    try {
      await apiPatch(`/v1/admin/orgs/${editOrg.id}`, {
        name: formData.name.trim() || undefined,
        org_type: formData.orgType || undefined,
        address_region: formData.addressRegion || undefined,
        address_detail: formData.addressDetail.trim() || undefined,
      });
      const freshOrgs = await apiGet("/v1/admin/orgs");
      setRows(mapOrgList(Array.isArray(freshOrgs) ? freshOrgs : []));
      setShowEditModal(false);
      setEditOrg(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (orgId) => {
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/orgs/${orgId}/deactivate`);
      setRows((prev) =>
        prev.map((r) => (r.id === orgId ? { ...r, status: "inactive" } : r))
      );
      setShowEditModal(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!editOrg) return;
    if (!adminLoginId.trim()) {
      setActionError("국어농장 아이디를 입력해 주세요.");
      return;
    }
    setActionError("");
    setActionLoading(true);
    try {
      const result = await apiPost(`/v1/admin/orgs/${editOrg.id}/admins`, {
        login_id: adminLoginId.trim(),
      });
      const mapped = mapOrgList([result])[0];
      setRows((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
      setEditOrg(mapped);
      setAdminLoginId("");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!editOrg) return;
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/orgs/${editOrg.id}/admins/${userId}/remove`);
      const freshOrgs = await apiGet("/v1/admin/orgs");
      const mapped = mapOrgList(Array.isArray(freshOrgs) ? freshOrgs : []);
      setRows(mapped);
      const updated = mapped.find((o) => o.id === editOrg.id);
      if (updated) setEditOrg(updated);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (org) => {
    setEditOrg(org);
    setFormData({
      name: org.name,
      orgType: org.orgType || "",
      addressRegion: org.addressRegion || "",
      addressDetail: org.addressDetail || "",
    });
    setAdminLoginId("");
    setActionError("");
    setShowEditModal(true);
  };

  const formatAddress = (org) => {
    return org.addressRegion || "-";
  };

  return (
    <>
      <div className="admin-detail-actions" style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
        <button
          className="admin-detail-btn"
          type="button"
          onClick={() => {
            setFormData({ name: "", orgType: "", addressRegion: "", addressDetail: "" });
            setActionError("");
            setShowCreateModal(true);
          }}
        >
          신규 기관 등록
        </button>
      </div>
      <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>기관 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="기관 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "active", "pending"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "active" ? "활성" : "보류"}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <p className="admin-detail-note">기관 목록을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>기관명</th>
                  <th>종류</th>
                  <th>주소</th>
                  <th>관리자</th>
                  <th>상태</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {pagedOrgs.map((org) => (
                  <tr key={org.id}>
                    <td>{org.name}</td>
                    <td>{org.orgType || "-"}</td>
                    <td>{formatAddress(org)}</td>
                    <td>{org.admins.length > 0 ? `${org.admins.length}명` : "-"}</td>
                    <td>
                      <span className="status-pill" data-status={org.status}>
                        {org.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-detail-btn secondary sm"
                        type="button"
                        onClick={() => openEdit(org)}
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
          <div className="admin-detail-card">
            <h3>기관 요약</h3>
            <p>전체 {rows.length}개</p>
            <p>활성 {rows.filter((r) => r.status === "active").length}개</p>
          </div>
        </div>

      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>신규 기관 등록</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>기관명</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="기관명"
              />
            </div>
            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>기관 종류</label>
                <select
                  value={formData.orgType}
                  onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="admin-modal-field">
                <label>시/도</label>
                <select
                  value={formData.addressRegion}
                  onChange={(e) => setFormData({ ...formData, addressRegion: e.target.value })}
                >
                  <option value="">선택 안 함</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-modal-field">
              <label>상세주소</label>
              <input
                value={formData.addressDetail}
                onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                placeholder="상세주소 입력"
              />
            </div>

            <h3 style={{ marginTop: 16, fontSize: 14, color: "#555" }}>사업자 정보 (선택)</h3>
            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>사업자등록번호</label>
                <input
                  value={formData.businessNumber}
                  onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                  placeholder="000-00-00000"
                />
              </div>
              <div className="admin-modal-field">
                <label>대표자명</label>
                <input
                  value={formData.representativeName}
                  onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                  placeholder="대표자"
                />
              </div>
            </div>
            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>기관 연락처</label>
                <input
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="010-0000-0000"
                />
              </div>
              <div className="admin-modal-field">
                <label>대표 이메일</label>
                <input
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
            </div>
            <div className="admin-modal-field">
              <label>세금계산서 수신 이메일</label>
              <input
                value={formData.taxEmail}
                onChange={(e) => setFormData({ ...formData, taxEmail: e.target.value })}
                placeholder="tax@example.com (비우면 대표 이메일 사용)"
              />
            </div>

            <h3 style={{ marginTop: 16, fontSize: 14, color: "#555" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.withAdmin}
                  onChange={(e) => setFormData({ ...formData, withAdmin: e.target.checked })}
                />
                기관 관리자 같이 등록 (추천)
              </label>
            </h3>
            {formData.withAdmin && (
              <>
                <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>
                  임시 비밀번호가 자동 생성되어 등록 직후 한 번만 표시됩니다.
                  관리자는 즉시 활성화되어 추가 승인 없이 사용 가능합니다.
                </p>
                <div className="admin-modal-row">
                  <div className="admin-modal-field">
                    <label>관리자 아이디 *</label>
                    <input
                      value={formData.adminLoginId}
                      onChange={(e) => setFormData({ ...formData, adminLoginId: e.target.value })}
                      placeholder="예: pjchany (영문/숫자, 3자 이상)"
                    />
                  </div>
                  <div className="admin-modal-field">
                    <label>관리자 이름 *</label>
                    <input
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      placeholder="예: 박종찬"
                    />
                  </div>
                </div>
                <div className="admin-modal-field">
                  <label>관리자 연락처 (선택)</label>
                  <input
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    placeholder="010-0000-0000"
                  />
                </div>
              </>
            )}

            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleCreate} disabled={actionLoading}>
                등록
              </button>
              <button
                className="admin-detail-btn secondary"
                onClick={() => setShowCreateModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {createdAdmin ? (
        <div className="admin-modal-overlay" onClick={() => setCreatedAdmin(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>기관 관리자 등록 완료</h2>
            <p style={{ color: "#c0392b", fontWeight: 600 }}>
              ⚠ 임시 비밀번호는 이 창을 닫으면 다시 볼 수 없습니다. 지금 복사해 학원장에게 전달하세요.
            </p>
            <div style={{ background: "#f7f7f5", border: "1px solid #ddd", borderRadius: 6, padding: 12, margin: "12px 0" }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>기관</div>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>{createdAdmin.orgName}</div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>관리자</div>
              <div style={{ marginBottom: 10 }}>{createdAdmin.name} ({createdAdmin.loginId})</div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>임시 비밀번호</div>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700,
                            background: "#fff", padding: "8px 10px", border: "1px solid #ccc", borderRadius: 4,
                            userSelect: "all" }}>
                {createdAdmin.temporaryPassword}
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `[국어농장 로그인 정보]\n` +
                    `학원: ${createdAdmin.orgName}\n` +
                    `아이디: ${createdAdmin.loginId}\n` +
                    `임시 비밀번호: ${createdAdmin.temporaryPassword}\n` +
                    `(로그인 후 비밀번호를 변경해 주세요.)`
                  );
                  alert("클립보드에 복사됨");
                }}>
                전체 복사
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setCreatedAdmin(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showEditModal && editOrg ? (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>기관 수정</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}

            <div className="admin-modal-section">
              <h3>기관 정보</h3>
              <div className="admin-modal-field">
                <label>기관명</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>기관 종류</label>
                  <select
                    value={formData.orgType}
                    onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-modal-field">
                  <label>시/도</label>
                  <select
                    value={formData.addressRegion}
                    onChange={(e) => setFormData({ ...formData, addressRegion: e.target.value })}
                  >
                    <option value="">선택 안 함</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-modal-field">
                <label>상세주소</label>
                <input
                  value={formData.addressDetail}
                  onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                  placeholder="상세주소 입력"
                />
              </div>
            </div>

            <div className="admin-modal-section">
              <h3>기관 관리자</h3>
              {editOrg.admins && editOrg.admins.length > 0 ? (
                <table className="admin-detail-table" style={{ marginBottom: 12 }}>
                  <thead>
                    <tr>
                      <th>아이디</th>
                      <th>이름</th>
                      <th>연락처</th>
                      <th>역할</th>
                      <th>조치</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editOrg.admins.map((a) => (
                      <tr key={a.userId}>
                        <td>{a.loginId}</td>
                        <td>{a.name || "-"}</td>
                        <td>{a.phone || "-"}</td>
                        <td>
                          <span className="status-pill" data-status="active">
                            {a.role === "HQ_ADMIN" ? "본사" : "기관"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="admin-detail-btn secondary sm"
                            type="button"
                            onClick={() => handleRemoveAdmin(a.userId)}
                            disabled={actionLoading}
                          >
                            해제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="admin-detail-note">등록된 관리자가 없습니다.</p>
              )}
              <div className="admin-modal-row">
                <div className="admin-modal-field" style={{ flex: 1 }}>
                  <label>국어농장 아이디</label>
                  <input
                    value={adminLoginId}
                    onChange={(e) => setAdminLoginId(e.target.value)}
                    placeholder="국어농장 아이디 입력"
                  />
                </div>
              </div>
              <button
                className="admin-detail-btn secondary"
                type="button"
                onClick={handleAddAdmin}
                disabled={actionLoading}
                style={{ marginTop: 4 }}
              >
                관리자 추가
              </button>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleEdit} disabled={actionLoading}>
                저장
              </button>
              <button
                className="admin-detail-btn secondary"
                onClick={() => handleDeactivate(editOrg.id)}
                disabled={actionLoading}
              >
                비활성화
              </button>
              <button
                className="admin-detail-btn secondary"
                onClick={() => setShowEditModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AdminOrgsPage() {
  useRequireRole("HQ_ADMIN");
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "orgs";

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>기관 관리</h1>
        </div>
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === "orgs" ? "active" : ""}`} onClick={() => setParams({ tab: "orgs" })}>
            기관 목록
          </button>
          <button className={`admin-tab ${tab === "payments" ? "active" : ""}`} onClick={() => setParams({ tab: "payments" })}>
            결제 내역
          </button>
        </div>
        {tab === "payments" ? <AdminPaymentsPage wrap={false} /> : <OrgsListContent />}
      </div>
    </AdminLayout>
  );
}

export default AdminOrgsPage;
