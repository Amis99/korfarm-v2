import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/test-storage.css";

// 백엔드 응답이 SNAKE_CASE이거나 camelCase일 수 있어 양쪽 모두 지원
function normalizeTest(t) {
  if (!t) return null;
  return {
    testId: t.testId ?? t.test_id ?? null,
    title: t.title ?? "",
    description: t.description ?? "",
    levelId: t.levelId ?? t.level_id ?? "",
    totalQuestions: t.totalQuestions ?? t.total_questions ?? 0,
    totalPoints: t.totalPoints ?? t.total_points ?? 0,
    timeLimitMinutes: t.timeLimitMinutes ?? t.time_limit_minutes ?? null,
    examDate: t.examDate ?? t.exam_date ?? "",
    series: t.series ?? "",
    orgId: t.orgId ?? t.org_id ?? null,
    orgName: t.orgName ?? t.org_name ?? "",
    submissionCount: t.submissionCount ?? t.submission_count ?? 0,
    createdAt: t.createdAt ?? t.created_at ?? null,
  };
}

function AdminTestPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", levelId: "", totalQuestions: 0, totalPoints: 0, timeLimitMinutes: "", examDate: "", series: "" });
  const [creating, setCreating] = useState(false);

  // 필터·검색
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState("all"); // all / hq / org
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterSeries, setFilterSeries] = useState("all");

  const load = () => {
    setLoading(true);
    apiGet("/v1/admin/test-papers")
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setTests(arr.map(normalizeTest));
      })
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const body = {
        title: form.title,
        description: form.description || null,
        levelId: form.levelId || null,
        totalQuestions: Number(form.totalQuestions) || 0,
        totalPoints: Number(form.totalPoints) || 0,
        timeLimitMinutes: form.timeLimitMinutes ? Number(form.timeLimitMinutes) : null,
        examDate: form.examDate || null,
        series: form.series || null,
      };
      const res = await apiPost("/v1/admin/test-papers", body);
      setShowCreate(false);
      setForm({ title: "", description: "", levelId: "", totalQuestions: 0, totalPoints: 0, timeLimitMinutes: "", examDate: "", series: "" });
      const newId = res?.testId ?? res?.test_id;
      if (newId) navigate(`/admin/tests/${newId}/edit`);
      else load();
    } catch {
      alert("생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  // 레벨·시리즈 옵션 추출
  const levelOptions = useMemo(() => {
    const set = new Set();
    tests.forEach((t) => t.levelId && set.add(t.levelId));
    return Array.from(set).sort();
  }, [tests]);
  const seriesOptions = useMemo(() => {
    const set = new Set();
    tests.forEach((t) => t.series && set.add(t.series));
    return Array.from(set).sort();
  }, [tests]);

  // 필터 적용
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (filterScope === "hq" && t.orgId) return false;
      if (filterScope === "org" && !t.orgId) return false;
      if (filterLevel !== "all" && t.levelId !== filterLevel) return false;
      if (filterSeries !== "all" && t.series !== filterSeries) return false;
      return true;
    });
  }, [tests, search, filterScope, filterLevel, filterSeries]);

  return (
    <AdminLayout>
    <div className="ts-page ts-admin">
      <header className="ts-header">
        <h1>테스트 관리</h1>
        <button className="ts-btn ts-btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <span className="material-symbols-outlined">add</span> 시험 추가
        </button>
      </header>

      {showCreate && (
        <form className="ts-create-form" onSubmit={handleCreate}>
          <div className="ts-form-grid">
            <label>
              제목 *
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </label>
            <label>
              레벨
              <input value={form.levelId} onChange={e => setForm(f => ({ ...f, levelId: e.target.value }))} placeholder="예: 중1" />
            </label>
            <label>
              시행일
              <input type="date" value={form.examDate} onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))} />
            </label>
            <label>
              시리즈
              <select value={form.series} onChange={e => setForm(f => ({ ...f, series: e.target.value }))}>
                <option value="">일반</option>
                <option value="diagnostic">진단(diagnostic)</option>
                <option value="chapter">챕터(chapter)</option>
              </select>
            </label>
            <label>
              총 문항
              <input type="number" value={form.totalQuestions} onChange={e => setForm(f => ({ ...f, totalQuestions: e.target.value }))} />
            </label>
            <label>
              총 배점
              <input type="number" value={form.totalPoints} onChange={e => setForm(f => ({ ...f, totalPoints: e.target.value }))} />
            </label>
            <label>
              시험 시간(분)
              <input type="number" value={form.timeLimitMinutes} onChange={e => setForm(f => ({ ...f, timeLimitMinutes: e.target.value }))} />
            </label>
            <label className="ts-form-full">
              설명
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </label>
          </div>
          <div className="ts-form-actions">
            <button type="submit" className="ts-btn ts-btn-primary" disabled={creating}>
              {creating ? "생성 중..." : "생성"}
            </button>
            <button type="button" className="ts-btn ts-btn-outline" onClick={() => setShowCreate(false)}>취소</button>
          </div>
        </form>
      )}

      {/* 필터/검색 바 */}
      <div className="ts-filter-bar" style={{
        display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12,
        padding: "10px 12px", background: "var(--panel)",
        border: "1px solid var(--stroke)", borderRadius: 8,
      }}>
        <input
          type="text"
          placeholder="제목 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 200px", minWidth: 160, padding: "6px 10px",
            background: "var(--bg)", color: "var(--text)",
            border: "1px solid var(--stroke)", borderRadius: 6,
          }}
        />
        <select
          value={filterScope}
          onChange={(e) => setFilterScope(e.target.value)}
          style={{ padding: "6px 10px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--stroke)", borderRadius: 6 }}
        >
          <option value="all">전체 구분</option>
          <option value="hq">본사 시험</option>
          <option value="org">기관 시험</option>
        </select>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          style={{ padding: "6px 10px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--stroke)", borderRadius: 6 }}
        >
          <option value="all">전체 레벨</option>
          {levelOptions.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
        </select>
        <select
          value={filterSeries}
          onChange={(e) => setFilterSeries(e.target.value)}
          style={{ padding: "6px 10px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--stroke)", borderRadius: 6 }}
        >
          <option value="all">전체 시리즈</option>
          {seriesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ alignSelf: "center", color: "var(--muted)", fontSize: 13 }}>
          {filtered.length} / {tests.length}
        </span>
      </div>

      {loading ? (
        <div className="ts-center"><p>불러오는 중...</p></div>
      ) : filtered.length === 0 ? (
        <div className="ts-center"><p>{tests.length === 0 ? "등록된 시험이 없습니다." : "조건에 맞는 시험이 없습니다."}</p></div>
      ) : (
        <div className="ts-table-scroll">
        <table className="ts-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>구분</th>
              <th>레벨</th>
              <th>시행일</th>
              <th>문항 수</th>
              <th>배점</th>
              <th>응시자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.testId}>
                <td>
                  <span
                    onClick={() => t.testId && navigate(`/admin/tests/${t.testId}/edit`)}
                    title="클릭: 시험지 비주얼 편집기 열기"
                    style={{
                      cursor: t.testId ? "pointer" : "default",
                      color: "var(--accent)", fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    {t.title || "(제목 없음)"}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    background: t.orgId ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                    color: t.orgId ? "#fbbf24" : "#60a5fa",
                    border: `1px solid ${t.orgId ? "rgba(245, 158, 11, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
                  }}>
                    {t.orgId ? (t.orgName || "기관") : "본사"}
                  </span>
                </td>
                <td>{t.levelId || "-"}</td>
                <td>{t.examDate || "-"}</td>
                <td>{t.totalQuestions}</td>
                <td>{t.totalPoints}</td>
                <td>
                  <span
                    onClick={() => t.testId && navigate(`/admin/tests/${t.testId}/statistics`)}
                    title="클릭: 응시자 통계 보기"
                    style={{
                      cursor: t.testId ? "pointer" : "default",
                      color: "var(--accent)", fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    {t.submissionCount}명
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

export default AdminTestPage;
