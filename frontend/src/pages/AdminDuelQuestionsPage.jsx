import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import MarkdownEditField from "../components/editor/MarkdownEditField";
import SAMPLE_QUESTIONS from "../constants/duelSamples";
import "../styles/admin-detail.css";

// 서버 목록 (RANK)
const RANK_SERVERS = [
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
    "category": "VOCAB",
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

function AdminDuelQuestionsPage({ wrap = true, themeOnly = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  // 본인 기관 테마 서버 (themeOnly 모드 시)
  const [themeServerId, setThemeServerId] = useState(null);
  useEffect(() => {
    if (!themeOnly) return;
    apiGet("/v1/duel/me").then(me => setThemeServerId(me?.themeServerId || null)).catch(() => {});
  }, [themeOnly]);
  // 노출할 서버 목록 — themeOnly 시 theme_common + themeServerId
  const SERVERS = useMemo(() => {
    if (!themeOnly) return RANK_SERVERS;
    const list = [{ id: "theme_common", label: "전사 공용" }];
    if (themeServerId) list.push({ id: themeServerId, label: "우리 기관" });
    return list;
  }, [themeOnly, themeServerId]);
  // 서버 탭 상태 — themeOnly 시 default 가 theme_common 또는 본인 기관
  const [activeServer, setActiveServer] = useState(themeOnly ? "theme_common" : "saussure");
  useEffect(() => {
    if (themeOnly && themeServerId && activeServer === "theme_common") {
      // 기관 학생/관리자는 본인 기관 탭 우선
      setActiveServer(themeServerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeServerId]);
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
    choiceIds: null, // 수정 모드일 때 실제 choice id 들 (예: ["A","B","C","D"])
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

  // 수정 모드
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // 문제 상세 모달
  const [detailQuestion, setDetailQuestion] = useState(null);

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

  // ?editId=... 쿼리 파라미터로 진입 시 해당 문제 수정 모달 자동 열기
  // (매치 기록의 문제 클릭 → 수정 페이지 점프 흐름)
  useEffect(() => {
    const editId = searchParams.get("editId");
    if (!editId) return;
    (async () => {
      try {
        const detail = await apiGet(`/v1/admin/duel/questions/${editId}`);
        if (!detail) return;
        // 해당 서버 탭으로 자동 전환
        const targetServer = detail.serverId || detail.server_id;
        if (targetServer && targetServer !== activeServer) {
          setActiveServer(targetServer);
        }
        // 수정 폼 채우기
        const choices = detail.choices || [];
        setAddForm({
          serverId: targetServer || activeServer,
          questionType: detail.questionType || detail.question_type || "QUIZ",
          category: detail.category || "",
          stem: detail.stem || "",
          passage: detail.passage || "",
          choice1: choices[0]?.text || "",
          choice2: choices[1]?.text || "",
          choice3: choices[2]?.text || "",
          choice4: choices[3]?.text || "",
          choiceIds: choices.map(c => c.id),
          answerId: String(detail.answerId ?? detail.answer_id ?? choices[0]?.id ?? "1"),
          timeLimitSec: detail.timeLimitSec ?? detail.time_limit_sec ?? 15,
        });
        setEditingQuestionId(detail.id);
        setAddError("");
        setShowAddForm(true);
        // 쿼리 파라미터 정리 (탭은 유지)
        const next = new URLSearchParams(searchParams);
        next.delete("editId");
        setSearchParams(next, { replace: true });
      } catch (err) {
        console.warn("editId 자동 진입 실패:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("editId")]);

  // DB + 샘플 병합
  const allQuestions = useMemo(() => {
    const dbIds = new Set(questions.map((q) => q.id));
    const samples = SAMPLE_QUESTIONS
      .filter((s) => s.serverId === activeServer && !dbIds.has(s.id))
      .map((s) => ({
        id: s.id,
        serverId: s.serverId,
        questionType: s.questionType,
        category: s.category,
        status: "SAMPLE",
        createdAt: null,
        _source: "sample",
      }));
    return [...questions, ...samples];
  }, [questions, activeServer]);

  // 필터링된 문제 목록 — 검색 대상: id / 카테고리 / 유형 / 상태 / 발문 / 지문 / 선택지
  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allQuestions.filter((q) => {
      if (typeFilter !== "all" && q.questionType !== typeFilter) return false;
      if (!term) return true;
      const choicesText = q.choicesText
        || (Array.isArray(q.choices) ? q.choices.map(c => c?.text || "").join(" | ") : "");
      return [q.id, q.category, q.questionType, q.status, q.stem, q.passage, choicesText]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [allQuestions, search, typeFilter]);

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

  // 샘플 문제를 DB에 등록
  const handleRegisterSample = async (sampleId) => {
    const sample = SAMPLE_QUESTIONS.find((s) => s.id === sampleId);
    if (!sample) return;
    try {
      await apiPost("/v1/admin/duel/questions", sample);
      await loadQuestions(activeServer);
      await loadCounts();
    } catch (err) {
      alert("등록 실패: " + err.message);
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

      if (editingQuestionId) {
        await apiPut(`/v1/admin/duel/questions/${editingQuestionId}`, body);
      } else {
        await apiPost("/v1/admin/duel/questions", body);
      }

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
      setEditingQuestionId(null);
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

  // 수정 모드 진입
  const handleEditQuestion = async (q) => {
    try {
      let detail = q;
      // 목록 응답에는 choices/answerId 가 없으므로 항상 detail fetch
      if (!q.choices || q.choices.length === 0) {
        detail = await apiGet(`/v1/admin/duel/questions/${q.id}`);
      }
      const choices = detail.choices || [];
      setAddForm({
        serverId: detail.serverId ?? detail.server_id ?? activeServer,
        questionType: detail.questionType ?? detail.question_type ?? "QUIZ",
        category: detail.category || "",
        stem: detail.stem || "",
        passage: detail.passage || "",
        choice1: choices[0]?.text || "",
        choice2: choices[1]?.text || "",
        choice3: choices[2]?.text || "",
        choice4: choices[3]?.text || "",
        choiceIds: choices.map(c => c.id),
        answerId: String(detail.answerId ?? detail.answer_id ?? choices[0]?.id ?? "1"),
        timeLimitSec: detail.timeLimitSec ?? detail.time_limit_sec ?? 15,
      });
      setEditingQuestionId(detail.id);
      setAddError("");
      setShowAddForm(true);
      setDetailQuestion(null);
    } catch (err) {
      alert("문제 정보를 불러올 수 없습니다: " + err.message);
    }
  };

  // 문제 상세 보기
  const handleShowDetail = (q) => {
    const sample = SAMPLE_QUESTIONS.find((s) => s.id === q.id);
    if (sample) {
      setDetailQuestion(sample);
    } else if (q.stem || q.choices) {
      setDetailQuestion(q);
    } else {
      apiGet(`/v1/admin/duel/questions/${q.id}`)
        .then((data) => setDetailQuestion(data))
        .catch(() => alert("문제 상세 정보를 불러올 수 없습니다."));
    }
  };

  const content = (
    <>
        {/* 헤더 */}
        <div className="admin-detail-header">
          {wrap && <h1>대결 문제 관리</h1>}
          <div className="admin-detail-actions">
            <button
              className="admin-detail-btn"
              type="button"
              onClick={() => {
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
                setEditingQuestionId(null);
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
          <p className={`admin-detail-note ${recalcResult.includes("실패") ? "error" : "admin-duel-import-success"}`}>
            {recalcResult}
          </p>
        )}

        {/* 서버 탭 */}
        <div className="admin-detail-filters admin-duel-server-tabs">
          {SERVERS.map((server) => {
            const dbTotal = counts[server.id]?.total ?? 0;
            const sampleCount = SAMPLE_QUESTIONS.filter((s) => s.serverId === server.id).length;
            const display = dbTotal || sampleCount ? `${dbTotal}+${sampleCount}` : "-";
            return (
              <button
                key={server.id}
                className={`admin-filter ${activeServer === server.id ? "active" : ""}`}
                type="button"
                onClick={() => setActiveServer(server.id)}
              >
                {server.label} ({display})
              </button>
            );
          })}
        </div>

        {/* 서버별 문제 유형 통계 */}
        {(counts[activeServer] || SAMPLE_QUESTIONS.some((s) => s.serverId === activeServer)) && (
          <div className="admin-duel-stats-row">
            <span className="admin-detail-tag">
              퀴즈: {counts[activeServer]?.quiz ?? 0}
            </span>
            <span className="admin-detail-tag tag-reading">
              독해: {counts[activeServer]?.reading ?? 0}
            </span>
            <span className="admin-detail-tag tag-db">
              DB: {counts[activeServer]?.total ?? 0}
            </span>
            <span className="admin-detail-tag tag-sample">
              샘플: {SAMPLE_QUESTIONS.filter((s) => s.serverId === activeServer).length}
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
                      <td colSpan={6} className="admin-duel-empty-cell">
                        {filteredQuestions.length === 0 ? "등록된 문제가 없습니다." : "검색 결과가 없습니다."}
                      </td>
                    </tr>
                  ) : (
                    pagedQuestions.map((q) => (
                      <tr key={q.id}>
                        <td className="admin-duel-id-cell">
                          <span
                            className="admin-duel-id-link"
                            onClick={() => handleShowDetail(q)}
                            title={q.id}
                          >
                            {q.stem
                              ? (q.stem.length > 80 ? q.stem.slice(0, 80) + "…" : q.stem)
                              : q.id}
                          </span>
                          {q.edited && (
                            <span
                              title={q.updatedAt ? `수정됨 — ${String(q.updatedAt).substring(0, 19)}` : "수정됨"}
                              style={{
                                marginLeft: 6, padding: "1px 6px",
                                fontSize: 10, fontWeight: 600,
                                background: "#fff3cd", color: "#856404",
                                border: "1px solid #ffeaa7", borderRadius: 8,
                                verticalAlign: "middle",
                              }}
                            >✏️ 수정됨</span>
                          )}
                          {q.stem && (
                            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{q.id}</div>
                          )}
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
                          <span className="status-pill" data-status={q.status === "ACTIVE" ? "active" : q.status === "SAMPLE" ? "pending" : "inactive"}>
                            {q.status === "ACTIVE" ? "활성" : q.status === "SAMPLE" ? "샘플" : "비활성"}
                          </span>
                        </td>
                        <td className="admin-duel-date-cell">
                          {q.createdAt ? q.createdAt.substring(0, 10) : "-"}
                        </td>
                        <td>
                          {q.status === "ACTIVE" && (
                            <>
                              <button
                                className="admin-detail-btn sm"
                                type="button"
                                onClick={() => handleEditQuestion(q)}
                              >
                                수정
                              </button>
                              <button
                                className="admin-detail-btn secondary sm"
                                type="button"
                                onClick={() => handleDeactivate(q.id)}
                              >
                                비활성화
                              </button>
                            </>
                          )}
                          {q._source === "sample" && (
                            <button
                              className="admin-detail-btn sm"
                              type="button"
                              onClick={() => handleRegisterSample(q.id)}
                            >
                              DB 등록
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
                <div className="admin-pagination">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    이전
                  </button>
                  <span>
                    {page + 1} / {totalPages} (총 {filteredQuestions.length}개)
                  </span>
                  <button
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

      {/* 문제 추가 모달 */}
      {showAddForm && (
        <div className="admin-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>{editingQuestionId ? "문제 수정" : "문제 추가"}</h2>
            {addError && <p className="admin-detail-note error">{addError}</p>}

            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>서버</label>
                <select
                  value={addForm.serverId}
                  onChange={(e) => setAddForm({ ...addForm, serverId: e.target.value })}
                  disabled={!!editingQuestionId}
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
                  disabled={!!editingQuestionId}
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
              <MarkdownEditField
                value={addForm.stem}
                onChange={(val) => setAddForm({ ...addForm, stem: val })}
                placeholder="다음 중 올바른 것은? (굵게·밑줄·이미지 가능)"
                minHeight={90}
              />
            </div>

            <div className="admin-modal-field">
              <label>지문 (passage, 선택)</label>
              <MarkdownEditField
                value={addForm.passage}
                onChange={(val) => setAddForm({ ...addForm, passage: val })}
                placeholder="독해형 문제의 경우 지문을 입력하세요 (마크다운·이미지·표 지원, 없으면 비워두세요)"
                minHeight={160}
              />
            </div>

            <div className="admin-modal-section">
              <h3>선택지 <span style={{ fontSize: 11, color: "#888", fontWeight: 400 }}>(마크다운·이미지 지원)</span></h3>
              {[1, 2, 3, 4].map((n) => (
                <div className="admin-modal-field" key={n}>
                  <label>{n}번 선택지</label>
                  <MarkdownEditField
                    value={addForm[`choice${n}`]}
                    onChange={(val) => setAddForm({ ...addForm, [`choice${n}`]: val })}
                    placeholder={`${n}번 선택지 텍스트`}
                    minHeight={70}
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
                {(addForm.choiceIds && addForm.choiceIds.length === 4
                  ? addForm.choiceIds
                  : ["1", "2", "3", "4"]
                ).map((cid, i) => (
                  <option key={cid} value={cid}>
                    {i + 1}번{cid !== String(i + 1) ? ` (id=${cid})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-modal-actions">
              <button
                className="admin-detail-btn"
                type="button"
                onClick={handleAddQuestion}
                disabled={addLoading}
              >
                {addLoading ? (editingQuestionId ? "저장 중..." : "등록 중...") : (editingQuestionId ? "저장" : "등록")}
              </button>
              <button
                className="admin-detail-btn secondary"
                type="button"
                onClick={() => { setShowAddForm(false); setEditingQuestionId(null); }}
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
              <p className="admin-detail-note admin-duel-import-success">
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
      {/* 문제 상세 모달 */}
      {detailQuestion && (
        <div className="admin-modal-overlay" onClick={() => setDetailQuestion(null)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>문제 상세</h2>

            <div className="admin-duel-detail-tags">
              <span className="status-pill" data-status={detailQuestion.questionType === "QUIZ" ? "active" : "pending"}>
                {detailQuestion.questionType === "QUIZ" || detailQuestion.question_type === "QUIZ" ? "퀴즈" : "독해"}
              </span>
              <span className="admin-detail-tag">{detailQuestion.category}</span>
              <span className="admin-duel-detail-id">{detailQuestion.id}</span>
            </div>

            {(detailQuestion.passage) && detailQuestion.passage !== "null" && (
              <div className="admin-duel-detail-section">
                <label className="admin-duel-detail-label">지문</label>
                <div className="admin-duel-passage-block">
                  {detailQuestion.passage}
                </div>
              </div>
            )}

            <div className="admin-duel-detail-section">
              <label className="admin-duel-detail-label">문제</label>
              <div className="admin-duel-stem-text">
                {detailQuestion.stem}
              </div>
            </div>

            <div className="admin-duel-detail-section">
              <label className="admin-duel-detail-label">선택지</label>
              <div className="admin-duel-choices-list">
                {(detailQuestion.choices || []).map((c) => {
                  const answerId = detailQuestion.answerId ?? detailQuestion.answer_id;
                  const isCorrect = String(c.id) === String(answerId);
                  return (
                    <div
                      key={c.id}
                      className={`admin-duel-choice-item${isCorrect ? " correct-choice" : ""}`}
                    >
                      <span className={`admin-duel-choice-number${isCorrect ? " correct-num" : ""}`}>
                        {c.id}
                      </span>
                      <span className={`admin-duel-choice-text${isCorrect ? " correct-text" : ""}`}>
                        {c.text}
                      </span>
                      {isCorrect && <span className="admin-duel-correct-label">정답</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="admin-modal-actions">
              {detailQuestion.status !== "INACTIVE" && (
                <button className="admin-detail-btn" type="button" onClick={() => handleEditQuestion(detailQuestion)}>
                  수정
                </button>
              )}
              <button className="admin-detail-btn secondary" type="button" onClick={() => setDetailQuestion(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (wrap) {
    return (
      <AdminLayout>
        <div className="admin-detail-wrap">{content}</div>
      </AdminLayout>
    );
  }
  return content;
}

export default AdminDuelQuestionsPage;
