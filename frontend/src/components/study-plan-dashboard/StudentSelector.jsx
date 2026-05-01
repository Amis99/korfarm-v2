import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import OrgSelect from "../OrgSelect";

/**
 * 어드민 학습 계획표 대시보드 상단의 3단 dropdown.
 * 기관(HQ_ADMIN 만 활성) → 수강반 → 학생.
 *
 * Props:
 *   value         { orgId, classId, userId }
 *   onChange      ({ orgId, classId, userId }) => void
 *   showStudent   true 일 때만 학생 dropdown 노출/활성. (기본: true)
 *   labelStudent  학생 dropdown 비활성 안내 라벨
 */
export default function StudentSelector({ value, onChange, showStudent = true, labelStudent }) {
  const { user } = useAuth();
  const isHq = (user?.roles || []).includes("HQ_ADMIN");

  const [orgs, setOrgs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const orgId = value?.orgId || "";
  const classId = value?.classId || "";
  const userId = value?.userId || "";

  // 기관 목록 (HQ만 의미가 있음)
  useEffect(() => {
    apiGet("/v1/admin/orgs")
      .then((data) => setOrgs(Array.isArray(data) ? data : []))
      .catch(() => setOrgs([]));
  }, []);

  // 수강반 목록 — 기관 dropdown 변경 시 필터
  useEffect(() => {
    apiGet("/v1/admin/classes")
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => setClasses([]));
  }, []);

  // 학생 목록 — 전역 students API 가 권한 자체 필터링
  useEffect(() => {
    if (!showStudent) return;
    apiGet("/v1/admin/students")
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]));
  }, [showStudent]);

  const filteredClasses = useMemo(() => {
    if (!orgId) return classes;
    return classes.filter((c) => (c.orgId || c.org_id) === orgId);
  }, [classes, orgId]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (orgId) {
      list = list.filter((s) => {
        const sOrgId = s.orgId || s.org_id;
        if (sOrgId) return sOrgId === orgId;
        // orgId 없으면 org 명으로 매칭 시도
        const matchOrg = orgs.find((o) => o.id === orgId);
        return matchOrg && s.org === matchOrg.name;
      });
    }
    if (classId) {
      list = list.filter((s) => {
        const ids = s.classIds || s.class_ids || [];
        if (Array.isArray(ids) && ids.includes(classId)) return true;
        const cls = classes.find((c) => c.id === classId);
        if (!cls) return false;
        const names = s.classNames || s.class_names || [];
        return Array.isArray(names) && names.includes(cls.name);
      });
    }
    return list;
  }, [students, orgs, classes, orgId, classId]);

  const update = (patch) => {
    onChange?.({ orgId, classId, userId, ...patch });
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {/* 기관 — HQ_ADMIN 만 활성 */}
      <div style={{ minWidth: 180 }}>
        <OrgSelect
          orgs={orgs}
          value={orgId}
          onChange={(next) => update({ orgId: next, classId: "", userId: "" })}
          placeholder={isHq ? "기관 전체" : (orgs.find((o) => o.id === orgId)?.name || "내 기관")}
          disabled={!isHq}
        />
      </div>

      {/* 수강반 */}
      <select
        className="admin-detail-select"
        value={classId}
        onChange={(e) => update({ classId: e.target.value, userId: "" })}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid rgba(31,58,44,0.18)",
          background: "var(--admin-panel, #fff)",
          color: "var(--admin-ink, #1a2920)",
          fontSize: 13,
          minWidth: 160,
        }}
      >
        <option value="">수강반 전체</option>
        {filteredClasses.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* 학생 */}
      {showStudent ? (
        <select
          className="admin-detail-select"
          value={userId}
          onChange={(e) => update({ userId: e.target.value })}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(31,58,44,0.18)",
            background: "var(--admin-panel, #fff)",
            color: "var(--admin-ink, #1a2920)",
            fontSize: 13,
            minWidth: 200,
          }}
        >
          <option value="">학생을 선택하세요</option>
          {filteredStudents.map((s) => (
            <option key={s.id || s.userId} value={s.id || s.userId}>
              {s.name || s.userName || s.id || s.userId}
              {s.school ? ` · ${s.school}` : ""}
            </option>
          ))}
        </select>
      ) : (
        labelStudent && (
          <span style={{ fontSize: 12, color: "var(--admin-muted, #3a4a3e)" }}>
            {labelStudent}
          </span>
        )
      )}
    </div>
  );
}
