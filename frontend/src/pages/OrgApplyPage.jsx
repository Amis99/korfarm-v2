/**
 * 공개 학원 도입 신청 페이지 — 비로그인 가능.
 * POST /v1/public/org-applications (인증 불필요).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api";

export default function OrgApplyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    orgName: "", orgType: "학원",
    addressRegion: "", addressDetail: "",
    businessNumber: "", representativeName: "",
    contactPhone: "", contactEmail: "", taxEmail: "",
    estimatedStudents: "",
    applicantLoginId: "", applicantName: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.orgName.trim() || !form.contactPhone.trim() || !form.contactEmail.trim()) {
      setError("기관명·연락처·이메일은 필수입니다.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/v1/public/org-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: form.orgName.trim(),
          org_type: form.orgType || null,
          address_region: form.addressRegion || null,
          address_detail: form.addressDetail.trim() || null,
          business_number: form.businessNumber.trim() || null,
          representative_name: form.representativeName.trim() || null,
          contact_phone: form.contactPhone.trim(),
          contact_email: form.contactEmail.trim(),
          tax_email: form.taxEmail.trim() || null,
          estimated_students: form.estimatedStudents ? parseInt(form.estimatedStudents, 10) : null,
          applicant_login_id: form.applicantLoginId.trim() || null,
          applicant_name: form.applicantName.trim() || null,
          message: form.message.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message || `HTTP ${res.status}`);
      }
      setDone(true);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>✓ 신청이 접수됐습니다</h1>
          <p>입력하신 연락처/이메일로 본사가 검토 후 결과를 안내드립니다.</p>
          <p style={{ color: "#666", fontSize: 14 }}>승인 시 기관 관리자 계정과 임시 비밀번호를 본사가 직접 전달합니다.</p>
          <button onClick={() => navigate("/")} style={btnPrimary}>홈으로</button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <form onSubmit={submit} style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>학원·학교 도입 신청</h1>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
          본사가 검토 후 입력하신 연락처로 결과를 안내드립니다. 사업자등록증은 검토 시 별도 요청드릴 수 있습니다.
        </p>

        <Section title="기관 정보">
          <Field label="기관명 *">
            <input value={form.orgName} onChange={change("orgName")} required style={inputStyle} />
          </Field>
          <Row>
            <Field label="기관 종류">
              <select value={form.orgType} onChange={change("orgType")} style={inputStyle}>
                <option value="학원">학원</option>
                <option value="학교">학교</option>
                <option value="공공기관">공공기관</option>
                <option value="기타">기타</option>
              </select>
            </Field>
            <Field label="예상 학생 수">
              <input type="number" value={form.estimatedStudents} onChange={change("estimatedStudents")}
                     style={inputStyle} placeholder="예: 30" />
            </Field>
          </Row>
          <Row>
            <Field label="시/도">
              <input value={form.addressRegion} onChange={change("addressRegion")} style={inputStyle} placeholder="예: 부산" />
            </Field>
            <Field label="상세 주소">
              <input value={form.addressDetail} onChange={change("addressDetail")} style={inputStyle} />
            </Field>
          </Row>
        </Section>

        <Section title="사업자 정보">
          <Row>
            <Field label="사업자등록번호">
              <input value={form.businessNumber} onChange={change("businessNumber")} style={inputStyle}
                     placeholder="000-00-00000" />
            </Field>
            <Field label="대표자명">
              <input value={form.representativeName} onChange={change("representativeName")} style={inputStyle} />
            </Field>
          </Row>
          <Row>
            <Field label="연락처 *">
              <input value={form.contactPhone} onChange={change("contactPhone")} required style={inputStyle}
                     placeholder="010-0000-0000" />
            </Field>
            <Field label="대표 이메일 *">
              <input type="email" value={form.contactEmail} onChange={change("contactEmail")} required style={inputStyle}
                     placeholder="contact@example.com" />
            </Field>
          </Row>
          <Field label="세금계산서 수신 이메일 (선택)">
            <input type="email" value={form.taxEmail} onChange={change("taxEmail")} style={inputStyle}
                   placeholder="비우면 대표 이메일 사용" />
          </Field>
        </Section>

        <Section title="관리자 계정 (희망 아이디·이름)">
          <p style={{ color: "#888", fontSize: 12, marginTop: -8 }}>
            승인 시 본사가 이 아이디로 기관 관리자 계정을 만들고 임시 비밀번호를 전달합니다.
          </p>
          <Row>
            <Field label="아이디 (3자 이상, 영문/숫자)">
              <input value={form.applicantLoginId} onChange={change("applicantLoginId")} style={inputStyle}
                     placeholder="예: gugeo_busan" />
            </Field>
            <Field label="이름">
              <input value={form.applicantName} onChange={change("applicantName")} style={inputStyle}
                     placeholder="예: 홍길동" />
            </Field>
          </Row>
        </Section>

        <Section title="추가 메시지 (선택)">
          <textarea value={form.message} onChange={change("message")} rows={4}
                    style={{ ...inputStyle, fontFamily: "inherit" }}
                    placeholder="문의·요청 사항이 있으면 자유롭게 작성해 주세요." />
        </Section>

        {error && <p style={{ color: "#c0392b", margin: "8px 0" }}>오류: {error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" onClick={() => navigate("/")} style={btnSecondary}>취소</button>
          <button type="submit" disabled={submitting} style={btnPrimary}>
            {submitting ? "제출 중..." : "신청 제출"}
          </button>
        </div>
      </form>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh", background: "#f5f5f3",
  padding: "40px 20px", display: "flex", justifyContent: "center",
};
const cardStyle = {
  width: "100%", maxWidth: 720, background: "#fff",
  padding: 32, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
};
const inputStyle = {
  width: "100%", padding: "8px 10px", border: "1px solid #d4d4d4",
  borderRadius: 4, fontSize: 14, boxSizing: "border-box",
};
const btnPrimary = {
  padding: "10px 24px", background: "#2d6a4f", color: "#fff",
  border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 14,
};
const btnSecondary = {
  padding: "10px 24px", background: "#fff", color: "#666",
  border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 14,
};

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #eee" }}>
      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14, color: "#2d6a4f" }}>{title}</h3>
      {children}
    </div>
  );
}
function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}
