import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/test-storage.css";

function AdminTestPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", levelId: "", totalQuestions: 0, totalPoints: 0, timeLimitMinutes: "", examDate: "", series: "" });
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    apiGet("/v1/admin/test-papers")
      .then(setTests)
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
      if (res.testId) navigate(`/admin/tests/${res.testId}`);
      else load();
    } catch {
      alert("생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

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
              <input value={form.series} onChange={e => setForm(f => ({ ...f, series: e.target.value }))} placeholder="예: 1학기 중간" />
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

      {loading ? (
        <div className="ts-center"><p>불러오는 중...</p></div>
      ) : tests.length === 0 ? (
        <div className="ts-center"><p>등록된 시험이 없습니다.</p></div>
      ) : (
        <table className="ts-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>레벨</th>
              <th>시행일</th>
              <th>문항 수</th>
              <th>배점</th>
              <th>응시자</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(t => (
              <tr
                key={t.testId}
                className="ts-clickable-row"
                onClick={() => navigate(`/admin/tests/${t.testId}`)}
              >
                <td>{t.title}</td>
                <td>{t.levelId || "-"}</td>
                <td>{t.examDate || "-"}</td>
                <td>{t.totalQuestions}</td>
                <td>{t.totalPoints}</td>
                <td>{t.score ?? 0}명</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </AdminLayout>
  );
}

export default AdminTestPage;
