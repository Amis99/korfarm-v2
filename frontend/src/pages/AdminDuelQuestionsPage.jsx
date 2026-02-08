import { useEffect, useState, useMemo, useCallback } from "react";
import { apiGet, apiPost, apiDelete } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

// 서버 목록
const SERVERS = [
  { id: "saussure", label: "소쉬르" },
  { id: "frege", label: "프레게" },
  { id: "russell", label: "러셀" },
  { id: "wittgenstein", label: "비트겐슈타인" },
];

// 문제 유형
const QUESTION_TYPES = [
  { id: "QUIZ", label: "퀴즈" },
  { id: "READING", label: "독해" },
];

// 페이지 당 문제 수
const PAGE_SIZE = 20;

// JSON 일괄 등록 예시 템플릿
const IMPORT_EXAMPLE = `[
  {
    "serverId": "saussure",
    "questionType": "QUIZ",
    "category": "어휘",
    "stem": "다음 중 밑줄 친 단어의 뜻으로 알맞은 것은?",
    "passage": null,
    "choices": [
      { "id": "1", "text": "선택지 1" },
      { "id": "2", "text": "선택지 2" },
      { "id": "3", "text": "선택지 3" },
      { "id": "4", "text": "선택지 4" }
    ],
    "answerId": "1",
    "timeLimitSec": 15
  }
]`;

function AdminDuelQuestionsPage() {
  // 서버 탭 상태
  const [activeServer, setActiveServer] = useState("saussure");
  // 문제 수 카운트 (서버별)
  const [counts, setCounts] = useState({});
  // 문제 목록
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 검색/필터
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // 페이지네이션
  const [page, setPage] = useState(0);

  // 문제 추가 폼
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    serverId: "saussure",
    questionType: "QUIZ",
    category: "",
    stem: "",
    passage: "",
    choice1: "",
    choice2: "",
    choice3: "",
    choice4: "",
    answerId: "1",
    timeLimitSec: 15,
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // JSON 일괄 등록
  const [showImportForm, setShowImportForm] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState("");

  // 재계산 상태
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcResult, setRecalcResult] = useState("");

  // 문제 수 카운트 로드
  const loadCounts = useCallback(async () => {
    try {
      const data = await apiGet("/v1/admin/duel/questions/count");
      setCounts(data);
    } catch (err) {
      console.error("문제 수 로드 실패:", err.message);
    }
  }, []);

  // 서버별 문제 목록 로드
  const loadQuestions = useCallback(async (serverId) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet(`/v1/admin/duel/questions?serverId=${serverId}`);
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // 서버 탭 변경 시 문제 목록 로드
  useEffect(() => {
    loadQuestions(activeServer);
    setPage(0);
    setSearch("");
    setTypeFilter("all");
  }, [activeServer, loadQuestions]);

  // 필터링된 문제 목록
  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (typeFilter !== "all" && q.questionType !== typeFilter) return false;
      if (!term) return true;
      return [q.id, q.category, q.questionType, q.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [questions, search, typeFilter]);

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const pagedQuestions = filteredQuestions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // 문제 비활성화
  const handleDeactivate = async (questionId) => {
    if (!confirm("이 문제를 비활성화하시겠습니까?")) return;
    try {
      await apiDelete(`/v1/admin/duel/questions/${questionId}`);
      await loadQuestions(activeServer);
      await loadCounts();
    } catch (err) {
      alert("비활성화 실패: " + err.message);
    }
  };

  // 문제 추가
  const handleAddQuestion = async () => {
    setAddError("");
    if (!addForm.category.trim()) {
      setAddError("카테고리를 입력하세요.");
      return;
    }
    if (!addForm.stem.trim()) {
      setAddError("문제 텍스트를 입력하세요.");
      return;
    }
    if (!addForm.choice1.trim() || !addForm.choice2.trim() || !addForm.choice3.trim() || !addForm.choice4.trim()) {
      setAddError("선택지 4개를 모두 입력하세요.");
      return;
    }

    setAddLoading(true);
    try {
      const body = {
        serverId: addForm.serverId,
        questionType: addForm.questionType,
        category: addForm.category.trim(),
        stem: addForm.stem.trim(),
        passage: addForm.passage.trim() || null,
        choices: [
          { id: "1", text: addForm.choice1.trim() },
          { id: "2", text: addForm.choice2.trim() },
          { id: "3", text: addForm.choice3.trim() },
          { id: "4", text: addForm.choice4.trim() },
        ],
        answerId: addForm.answerId,
        timeLimitSec: Number(addForm.timeLimitSec) || 15,
      };

      await apiPost("/v1/admin/duel/questions", body);

      // 폼 초기화
      setAddForm({
        serverId: activeServer,
        questionType: "QUIZ",
        category: "",
        stem: "",
        passage: "",
        choice1: "",
        choice2: "",
        choice3: "",
        choice4: "",
        answerId: "1",
        timeLimitSec: 15,
      });
      setShowAddForm(false);

      await loadQuestions(activeServer);
      await loadCounts();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  // JSON 일괄 등록
  const handleImport = async () => {
    setImportError("");
    setImportResult("");
    if (!importJson.trim()) {
      setImportError("JSON을 입력하세요.");
      return;
    }

    // JSON 유효성 검사
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) {
        setImportError("JSON 배열 형식이어야 합니다.");
        return;
      }
    } catch {
      setImportError("유효한 JSON 형식이 아닙니다.");
      return;
    }

    setImportLoading(true);
    try {
      const data = await apiPost("/v1/admin/duel/questions/import", JSON.parse(importJson));
      const importedCount = data?.imported ?? 0;
      setImportResult(`${importedCount}개 문제가 등록되었습니다.`);
      setImportJson("");

      await loadQuestions(activeServer);
      await loadCounts();
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // 랭킹 재계산
  const handleRecalculate = async () => {
    if (!confirm("랭킹을 재계산하시겠습니까? 시간이 걸릴 수 있습니다.")) return;
    setRecalcLoading(true);
    setRecalcResult("");
    try {
      await apiPost("/v1/admin/duel/recalculate");
      setRecalcResult("랭킹 재계산이 완료되었습니다.");
    } catch (err) {
      setRecalcResult("재계산 실패: " + err.message);
    } finally {
      setRecalcLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        {/* 헤더 */}
        <div className="admin-detail-header">
          <h1>대결 문제 관리</h1>
          <div className="admin-detail-actions">
            <button
              className="admin-detail-btn"
              type="button"
              onClick={() => {
                setAddForm((prev) => ({ ...prev, serverId: activeServer }));
                setAddError("");
                setShowAddForm(true);
              }}
            >
              문제 추가
            </button>
            <button
              className="admin-detail-btn secondary"
              type="button"
              onClick={() => {
                setImportError("");
                setImportResult("");
                setShowImportForm(true);
              }}
            >
              JSON 일괄 등록
            </button>
            <button
              className="admin-detail-btn secondary"
              type="button"
              onClick={handleRecalculate}
              disabled={recalcLoading}
            >
              {recalcLoading ? "재계산 중..." : "랭킹 재계산"}
            </button>
          </div>
        </div>

        {recalcResult && (
          <p
            className="admin-detail-note"
            style={{ marginTop: 8, color: recalcResult.includes("실패") ? "#f0a59c" : "#9dd6b0" }}
          >
            {recalcResult}
          </p>
        )}

        {/* 서버 탭 */}
        <div className="admin-detail-filters" style={{ marginTop: 20, marginBottom: 16 }}>
          {SERVERS.map((server) => {
            const serverCount = counts[server.id];
            const total = serverCount?.total ?? "-";
            return (
              <button
                key={server.id}
                className={`admin-filter ${activeServer === server.id ? "active" : ""}`}
                type="button"
                onClick={() => setActiveServer(server.id)}
              >
                {server.label} ({total})
              </button>
            );
          })}
        </div>

        {/* 서버별 문제 유형 통계 */}
        {counts[activeServer] && (
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <span className="admin-detail-tag">
              퀴즈: {counts[activeServer].quiz ?? 0}
            </span>
            <span className="admin-detail-tag" style={{ background: "rgba(240,108,36,0.2)", color: "#f6d18d" }}>
              독해: {counts[activeServer].reading ?? 0}
            </span>
            <span className="admin-detail-tag" style={{ background: "rgba(166,182,169,0.18)", color: "#a6b6a9" }}>
              전체: {counts[activeServer].total ?? 0}
            </span>
          </div>
        )}

        {/* 문제 목록 카드 */}
        <div className="admin-detail-card">
          <h2>문제 목록 - {SERVERS.find((s) => s.id === activeServer)?.label}</h2>

          {/* 검색 및 필터 */}
          <div className="admin-detail-toolbar">
            <div className="admin-detail-search">
              <span className="material-symbols-outlined">search</span>
              <input
                placeholder="ID, 카테고리 검색"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="admin-detail-filters">
              <button
                className={`admin-filter ${typeFilter === "all" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setTypeFilter("all");
                  setPage(0);
                }}
              >
                전체
              </button>
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  className={`admin-filter ${typeFilter === t.id ? "active" : ""}`}
                  type="button"
                  onClick={() => {
                    setTypeFilter(t.id);
                    setPage(0);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 로딩/에러 */}
          {loading && <p className="admin-detail-note">문제를 불러오는 중...</p>}
          {error && <p className="admin-detail-note error">{error}</p>}

          {/* 테이블 */}
          {!loading && (
            <>
              <table className="admin-detail-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>유형</th>
                    <th>카테고리</th>
                    <th>상태</th>
                    <th>등록일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "#a6b6a9", padding: 24 }}>
                        {filteredQuestions.length === 0 ? "등록된 문제가 없습니다." : "검색 결과가 없습니다."}
                      </td>
                    </tr>
                  ) : (
                    pagedQuestions.map((q) => (
                      <tr key={q.id}>
                        <td style={{ fontSize: 12, fontFamily: "monospace", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {q.id}
                        </td>
                        <td>
                          <span
                            className="status-pill"
                            data-status={q.questionType === "QUIZ" ? "active" : "pending"}
                          >
                            {q.questionType === "QUIZ" ? "퀴즈" : "독해"}
                          </span>
                        </td>
                        <td>{q.category}</td>
                        <td>
                          <span className="status-pill" data-status={q.status === "ACTIVE" ? "active" : "inactive"}>
                            {q.status === "ACTIVE" ? "활성" : "비활성"}
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {q.createdAt ? q.createdAt.substring(0, 10) : "-"}
                        </td>
                        <td>
                          {q.status === "ACTIVE" && (
                            <button
                              className="admin-detail-btn secondary"
                              style={{ padding: "4px 10px", fontSize: 12 }}
                              type="button"
                              onClick={() => handleDeactivate(q.id)}
                            >
                              비활성화
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 16,
                  }}
                >
                  <button
                    className="admin-detail-btn secondary"
                    style={{ padding: "4px 12px", fontSize: 13 }}
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    이전
                  </button>
                  <span style={{ fontSize: 13, color: "#a6b6a9" }}>
                    {page + 1} / {totalPages} (총 {filteredQuestions.length}개)
                  </span>
                  <button
                    className="admin-detail-btn secondary"
                    style={{ padding: "4px 12px", fontSize: 13 }}
                    type="button"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 문제 추가 모달 */}
      {showAddForm && (
        <div className="admin-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>문제 추가</h2>
            {addError && <p className="admin-detail-note error">{addError}</p>}

            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>서버</label>
                <select
                  value={addForm.serverId}
                  onChange={(e) => setAddForm({ ...addForm, serverId: e.target.value })}
                >
                  {SERVERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-modal-field">
                <label>문제 유형</label>
                <select
                  value={addForm.questionType}
                  onChange={(e) => setAddForm({ ...addForm, questionType: e.target.value })}
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>카테고리</label>
                <input
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                  placeholder="예: 어휘, 문법, 독해"
                />
              </div>
              <div className="admin-modal-field">
                <label>제한 시간(초)</label>
                <input
                  type="number"
                  value={addForm.timeLimitSec}
                  onChange={(e) => setAddForm({ ...addForm, timeLimitSec: e.target.value })}
                  placeholder="15"
                />
              </div>
            </div>

            <div className="admin-modal-field">
              <label>문제 텍스트 (stem)</label>
              <input
                value={addForm.stem}
                onChange={(e) => setAddForm({ ...addForm, stem: e.target.value })}
                placeholder="다음 중 올바른 것은?"
              />
            </div>

            <div className="admin-modal-field">
              <label>지문 (passage, 선택)</label>
              <textarea
                className="admin-json-input"
                style={{ minHeight: 60 }}
                value={addForm.passage}
                onChange={(e) => setAddForm({ ...addForm, passage: e.target.value })}
                placeholder="독해형 문제의 경우 지문을 입력하세요 (없으면 비워두세요)"
              />
            </div>

            <div className="admin-modal-section">
              <h3>선택지</h3>
              {[1, 2, 3, 4].map((n) => (
                <div className="admin-modal-field" key={n}>
                  <label>{n}번 선택지</label>
                  <input
                    value={addForm[`choice${n}`]}
                    onChange={(e) => setAddForm({ ...addForm, [`choice${n}`]: e.target.value })}
                    placeholder={`${n}번 선택지 텍스트`}
                  />
                </div>
              ))}
            </div>

            <div className="admin-modal-field">
              <label>정답 (1~4)</label>
              <select
                value={addForm.answerId}
                onChange={(e) => setAddForm({ ...addForm, answerId: e.target.value })}
              >
                <option value="1">1번</option>
                <option value="2">2번</option>
                <option value="3">3번</option>
                <option value="4">4번</option>
              </select>
            </div>

            <div className="admin-modal-actions">
              <button
                className="admin-detail-btn"
                type="button"
                onClick={handleAddQuestion}
                disabled={addLoading}
              >
                {addLoading ? "등록 중..." : "등록"}
              </button>
              <button
                className="admin-detail-btn secondary"
                type="button"
                onClick={() => setShowAddForm(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON 일괄 등록 모달 */}
      {showImportForm && (
        <div className="admin-modal-overlay" onClick={() => setShowImportForm(false)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>JSON 일괄 등록</h2>
            {importError && <p className="admin-detail-note error">{importError}</p>}
            {importResult && (
              <p className="admin-detail-note" style={{ color: "#9dd6b0" }}>
                {importResult}
              </p>
            )}

            <div className="admin-modal-field">
              <label>JSON 배열 (문제 목록)</label>
              <textarea
                className="admin-json-input"
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder={IMPORT_EXAMPLE}
              />
            </div>

            <p className="admin-detail-note">
              각 문제에 serverId, questionType, category, stem, choices, answerId 필드가 필요합니다.
            </p>

            <div className="admin-modal-actions">
              <button
                className="admin-detail-btn"
                type="button"
                onClick={handleImport}
                disabled={importLoading}
              >
                {importLoading ? "등록 중..." : "일괄 등록"}
              </button>
              <button
                className="admin-detail-btn secondary"
                type="button"
                onClick={() => setShowImportForm(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDuelQuestionsPage;
