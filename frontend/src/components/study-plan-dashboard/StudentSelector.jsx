import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import SearchableSelect from "../SearchableSelect";

/**
 * 어드민 학습 계획표 대시보드 상단의 3단 dropdown.
 * 기관(HQ_ADMIN 만 활성) → 수강반 → 학생.
 *
 * 정책:
 *  - HQ_ADMIN: 기관 선택해야만 수강반·학생 의미가 생김. 기관 미선택 시 수강반 비활성.
 *  - ORG_ADMIN: 기관 dropdown 비활성(자기 기관 고정), 수강반·학생 항상 활성.
 *  - 모든 dropdown 검색 가능 + 한글 초성 매칭 지원.
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

  // 수강반 목록
  useEffect(() => {
    apiGet("/v1/admin/classes")
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => setClasses([]));
  }, []);

  // 학생 목록 — 권한 자체 필터링은 백엔드가 처리
  useEffect(() => {
    if (!showStudent) return;
    apiGet("/v1/admin/students")
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]));
  }, [showStudent]);

  // 백엔드 SNAKE_CASE 응답 (org_id 등) 도 호환되도록 fallback
  const orgIdOf = (o) => o?.id || o?.orgId || o?.org_id;
  const classIdOf = (c) => c?.id || c?.classId || c?.class_id;
  const userIdOf = (s) => s?.id || s?.userId || s?.user_id;

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
        const matchOrg = orgs.find((o) => orgIdOf(o) === orgId);
        return matchOrg && s.org === matchOrg.name;
      });
    }
    if (classId) {
      list = list.filter((s) => {
        const ids = s.classIds || s.class_ids || [];
        if (Array.isArray(ids) && ids.includes(classId)) return true;
        const cls = classes.find((c) => classIdOf(c) === classId);
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

  // 보안 정책: HQ 모드에서 기관 선택 안 하면 수강반/학생 비활성
  const classDisabled = isHq && !orgId;
  const studentDisabled = isHq && !orgId;

  // 옵션 배열로 변환 — SearchableSelect 의 통일 포맷 (백엔드 SNAKE_CASE 호환)
  const orgOptions = useMemo(() => {
    const HQ_ORG_ID = "org_hq";
    const normalized = orgs
      .map((o) => ({ id: orgIdOf(o), name: o.name }))
      .filter((o) => o.id);
    const hq = normalized.find((o) => o.id === HQ_ORG_ID);
    const others = normalized
      .filter((o) => o.id !== HQ_ORG_ID)
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));
    const list = hq ? [hq, ...others] : others;
    return list.map((o) => ({ value: o.id, label: o.name || o.id }));
  }, [orgs]);

  const classOptions = useMemo(
    () => filteredClasses
      .map((c) => ({ value: classIdOf(c), label: c.name || classIdOf(c) }))
      .filter((c) => c.value),
    [filteredClasses]
  );

  const studentOptions = useMemo(
    () => filteredStudents.map((s) => {
      const id = userIdOf(s);
      const name = s.name || s.userName || s.user_name || id;
      const school = s.school ? ` · ${s.school}` : "";
      return { value: id, label: `${name}${school}` };
    }).filter((o) => o.value),
    [filteredStudents]
  );

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {/* 기관 — HQ_ADMIN 만 활성 */}
      <SearchableSelect
        options={orgOptions}
        value={orgId}
        onChange={(next) => update({ orgId: next, classId: "", userId: "" })}
        placeholder={isHq ? "기관 선택" : (orgs.find((o) => orgIdOf(o) === orgId)?.name || "내 기관")}
        emptyOptionLabel="기관 전체"
        disabled={!isHq}
        minWidth={180}
      />

      {/* 수강반 — HQ 모드에서 기관 미선택 시 비활성 */}
      <SearchableSelect
        options={classOptions}
        value={classId}
        onChange={(next) => update({ classId: next, userId: "" })}
        placeholder={classDisabled ? "기관을 먼저 선택" : "수강반 전체"}
        emptyOptionLabel={classDisabled ? null : "수강반 전체"}
        disabled={classDisabled}
        minWidth={160}
      />

      {/* 학생 */}
      {showStudent ? (
        <SearchableSelect
          options={studentOptions}
          value={userId}
          onChange={(next) => update({ userId: next })}
          placeholder={studentDisabled ? "기관을 먼저 선택" : "학생을 선택하세요"}
          emptyOptionLabel={studentDisabled ? null : "학생을 선택하세요"}
          disabled={studentDisabled}
          minWidth={200}
        />
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
