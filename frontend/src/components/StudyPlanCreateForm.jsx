import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../utils/api";
import "../styles/admin-study-plan.css";

const STEPS = ["기본 정보", "대상 선택"];

export default function StudyPlanCreateForm({ onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 1단계
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examScope, setExamScope] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 2단계
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    apiGet("/v1/admin/classes").then((data) => {
      const list = Array.isArray(data) ? data : data?.items || [];
      setClasses(list);
    }).catch(() => {});
    apiGet("/v1/admin/students").then((data) => {
      const list = Array.isArray(data) ? data : data?.items || [];
      setStudents(list);
    }).catch(() => {});
  }, []);

  const toggleClass = (cls) => {
    setSelectedClasses((prev) =>
      prev.find((c) => c.id === cls.id)
        ? prev.filter((c) => c.id !== cls.id)
        : [...prev, cls]
    );
  };

  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x.userId === u.userId)
        ? prev.filter((x) => x.userId !== u.userId)
        : [...prev, u]
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const targets = [
        ...selectedClasses.map((c) => ({ targetType: "class", targetId: c.id })),
        ...selectedUsers.map((u) => ({ targetType: "user", targetId: u.userId })),
      ];
      await apiPost("/v1/admin/study-plans", {
        title, description, examScope, startDate, endDate,
        targets,
        scopes: [],
        assets: [],
        schedules: [],
      });
      onCreated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return title.trim() && startDate && endDate;
    if (step === 1) return selectedClasses.length > 0 || selectedUsers.length > 0;
    return true;
  };

  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return false;
    const q = studentSearch.toLowerCase();
    return (s.name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q);
  });

  return (
    <div className="asp-modal-overlay" onClick={onClose}>
      <div className="asp-modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          <span className="material-symbols-outlined">event_note</span>
          새 학습 계획표
        </h2>

        {/* 진행 바 */}
        <div className="asp-modal-steps">
          {STEPS.map((_, i) => (
            <div key={i} className={`asp-step ${i < step ? "done" : i === step ? "current" : ""}`} />
          ))}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#8a7468", marginBottom: 16 }}>
          {step + 1}/{STEPS.length} — {STEPS[step]}
        </div>

        {error && <div className="asp-error">{error}</div>}

        {/* 1단계: 기본 정보 */}
        {step === 0 && (
          <>
            <div className="asp-form-group">
              <label>제목 *</label>
              <input className="asp-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 1학기 중간고사 대비" />
            </div>
            <div className="asp-form-group">
              <label>설명</label>
              <textarea className="asp-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="계획표 설명 (선택)" />
            </div>
            <div className="asp-form-group">
              <label>시험 범위</label>
              <textarea className="asp-textarea" value={examScope} onChange={(e) => setExamScope(e.target.value)} placeholder="시험 범위 텍스트 (선택)" />
            </div>
            <div className="asp-date-row">
              <div className="asp-form-group">
                <label>시작일 *</label>
                <input className="asp-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="asp-form-group">
                <label>종료일 *</label>
                <input className="asp-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* 2단계: 대상 선택 */}
        {step === 1 && (
          <>
            <div className="asp-form-group">
              <label>수강반 선택</label>
              <div style={{ maxHeight: 160, overflowY: "auto" }}>
                {classes.map((cls) => (
                  <label key={cls.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: "0.82rem", color: "#ccc", cursor: "pointer" }}>
                    <input type="checkbox" checked={!!selectedClasses.find((c) => c.id === cls.id)} onChange={() => toggleClass(cls)} />
                    {cls.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="asp-form-group">
              <label>개별 학생 추가</label>
              <input className="asp-input" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="이름 또는 이메일 검색" />
              {filteredStudents.length > 0 && (
                <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 6 }}>
                  {filteredStudents.slice(0, 10).map((s) => (
                    <label key={s.userId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: "0.82rem", color: "#ccc", cursor: "pointer" }}>
                      <input type="checkbox" checked={!!selectedUsers.find((x) => x.userId === s.userId)} onChange={() => toggleUser(s)} />
                      {s.name || s.email}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="asp-chip-list">
              {selectedClasses.map((c) => (
                <span key={c.id} className="asp-chip">
                  {c.name} <button onClick={() => toggleClass(c)}>&times;</button>
                </span>
              ))}
              {selectedUsers.map((u) => (
                <span key={u.userId} className="asp-chip">
                  {u.name || u.email} <button onClick={() => toggleUser(u)}>&times;</button>
                </span>
              ))}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#8a7468", marginTop: 12, padding: "10px 12px", background: "rgba(255,127,42,0.08)", borderRadius: 8 }}>
              범위(행)와 에셋(열)은 생성 후 상세 페이지에서 추가할 수 있습니다.
            </div>
          </>
        )}

        {/* 네비게이션 */}
        <div className="asp-form-actions">
          <div>
            {step > 0 && (
              <button className="asp-btn-prev" onClick={() => setStep(step - 1)}>이전</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="asp-btn-prev" onClick={onClose}>취소</button>
            {step < STEPS.length - 1 ? (
              <button className="asp-btn-next" onClick={() => setStep(step + 1)} disabled={!canNext()}>다음</button>
            ) : (
              <button className="asp-btn-submit" onClick={handleSubmit} disabled={saving || !canNext()}>
                {saving ? "생성 중..." : "계획표 생성"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
