import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost, apiPut } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/test-storage.css";
import "../styles/admin-pro.css";

const COURSE_LEVELS = [
  { id: "saussure1", name: "소쉬르1" },
  { id: "saussure2", name: "소쉬르2" },
  { id: "saussure3", name: "소쉬르3" },
  { id: "frege1", name: "프레게1" },
  { id: "frege2", name: "프레게2" },
  { id: "frege3", name: "프레게3" },
  { id: "russell1", name: "러셀1" },
  { id: "russell2", name: "러셀2" },
  { id: "russell3", name: "러셀3" },
  { id: "wittgenstein1", name: "비트겐슈타인1" },
  { id: "wittgenstein2", name: "비트겐슈타인2" },
  { id: "wittgenstein3", name: "비트겐슈타인3" },
];

const LEVEL_NAME_MAP = Object.fromEntries(COURSE_LEVELS.map(l => [l.id, l.name]));

const TYPE_LABELS = {
  reading: "독해",
  vocab: "어휘",
  background: "배경",
  logic: "논리",
  answer: "해설",
};

const ANSWER_TEMPLATE = JSON.stringify({
  sections: [
    {
      title: "섹션 제목",
      groups: [
        {
          groupTitle: "그룹 제목",
          items: [
            { number: "1", type: "객관식", points: 3, answer: "3", explanation: "해설 내용" }
          ]
        }
      ]
    }
  ]
}, null, 2);

function AdminProPage() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [levelFilter, setLevelFilter] = useState("");

  // 챕터별 콘텐츠 현황 캐시
  const [statusCache, setStatusCache] = useState({});

  // 챕터 상세
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [contentStatus, setContentStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // 챕터 메타 편집
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editVideoUrl, setEditVideoUrl] = useState("");

  // 정답해설
  const [answerTab, setAnswerTab] = useState("edit"); // edit | upload | preview
  const [answerJson, setAnswerJson] = useState("");
  const [answerTitle, setAnswerTitle] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerSaving, setAnswerSaving] = useState(false);
  const [answerContentId, setAnswerContentId] = useState(null);

  // 테스트 버전 등록
  const [testVersion, setTestVersion] = useState(1);
  const [testPaperId, setTestPaperId] = useState("");
  const [testPapers, setTestPapers] = useState([]);

  // 테스트 관리 탭
  const [testMgmtTab, setTestMgmtTab] = useState("items"); // items | versions | preview
  const [testQuestions, setTestQuestions] = useState([]);
  const [testQuestionsLoading, setTestQuestionsLoading] = useState(false);
  const [testQuestionsSaving, setTestQuestionsSaving] = useState(false);
  const [testQuestionsModified, setTestQuestionsModified] = useState(false);
  const [selectedTestPaperId, setSelectedTestPaperId] = useState("");
  const [editingQIdx, setEditingQIdx] = useState(null);
  const [editQ, setEditQ] = useState(null);
  const [testJsonMode, setTestJsonMode] = useState(false);
  const [testJsonText, setTestJsonText] = useState("");
  const [previewIdx, setPreviewIdx] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    const qs = levelFilter ? `?levelId=${levelFilter}` : "";
    apiGet(`/v1/admin/pro/chapters${qs}`)
      .then(data => {
        setChapters(data);
        // 각 챕터의 콘텐츠 현황은 목록 렌더 후 비동기로 보강
        data.forEach(ch => {
          apiGet(`/v1/admin/pro/chapters/${ch.id}/content-status`)
            .then(st => setStatusCache(prev => ({ ...prev, [ch.id]: st })))
            .catch(err => console.error(`content-status 로드 실패 (${ch.id}):`, err));
        });
      })
      .catch(err => {
        console.error("챕터 목록 로드 실패:", err);
        setChapters([]);
        setLoadError(err.message || "챕터 목록을 불러오는데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, [levelFilter]);

  useEffect(load, [load]);

  const getChapterCompleteness = (ch) => {
    const st = statusCache[ch.id];
    if (!st) return { content: null, answer: null, test: null, overall: null };
    const contentTypes = ["reading", "vocab", "background", "logic"];
    const contentOk = contentTypes.every(t => {
      const item = st.items?.find(i => i.type === t);
      return item && item.count > 0;
    });
    const answerItem = st.items?.find(i => i.type === "answer");
    const answerOk = answerItem && answerItem.count > 0;
    const testOk = st.test_versions?.length > 0 || st.testVersions?.length > 0;
    const overall = contentOk && answerOk && testOk ? "complete" : (contentOk || answerOk || testOk ? "partial" : "empty");
    return { content: contentOk, answer: answerOk, test: testOk, overall, status: st };
  };

  const openDetail = async (ch) => {
    setSelectedChapter(ch);
    setEditTitle(ch.title);
    setEditDesc(ch.description || "");
    setEditStatus(ch.status);
    setEditVideoUrl(ch.videoUrl || ch.video_url || "");
    setAnswerTab("edit");
    setAnswerJson("");
    setAnswerTitle("");
    setAnswerContentId(null);

    // 콘텐츠 현황 로드
    setStatusLoading(true);
    try {
      const st = await apiGet(`/v1/admin/pro/chapters/${ch.id}/content-status`);
      setContentStatus(st);
      setStatusCache(prev => ({ ...prev, [ch.id]: st }));
    } catch { setContentStatus(null); }
    setStatusLoading(false);

    // 정답해설 로드
    setAnswerLoading(true);
    try {
      const ans = await apiGet(`/v1/admin/pro/chapters/${ch.id}/answer-content`);
      if (ans.contentId || ans.content_id) {
        setAnswerContentId(ans.contentId || ans.content_id);
        setAnswerTitle(ans.title || "");
        let payload = ans.payload;
        if (typeof payload === "string") {
          try { payload = JSON.parse(payload); } catch { /* keep string */ }
        }
        setAnswerJson(payload ? JSON.stringify(payload, null, 2) : ANSWER_TEMPLATE);
      } else {
        setAnswerJson(ANSWER_TEMPLATE);
        setAnswerTitle(`모범답안 — ${ch.title}`);
      }
    } catch {
      setAnswerJson(ANSWER_TEMPLATE);
      setAnswerTitle(`모범답안 — ${ch.title}`);
    }
    setAnswerLoading(false);

    // 시험지 목록
    apiGet("/v1/admin/test-papers").then(setTestPapers).catch(() => setTestPapers([]));

    // 테스트 버전 자동 계산
    const tests = statusCache[ch.id]?.testVersions || statusCache[ch.id]?.test_versions || [];
    setTestVersion(tests.length + 1);
    setTestPaperId("");

    // 테스트 문항 초기화
    setTestMgmtTab("items");
    setTestQuestions([]);
    setTestQuestionsModified(false);
    setSelectedTestPaperId("");
    setEditingQIdx(null);
    setEditQ(null);
    setTestJsonMode(false);
    setPreviewIdx(0);
  };

  const handleUpdateChapter = async () => {
    try {
      await apiPut(`/v1/admin/pro/chapters/${selectedChapter.id}`, {
        title: editTitle,
        description: editDesc || null,
        status: editStatus,
        videoUrl: editVideoUrl || null,
      });
      alert("수정 완료");
      load();
    } catch (err) {
      alert(err.message || "수정에 실패했습니다.");
    }
  };

  const handleSaveAnswer = async () => {
    try {
      JSON.parse(answerJson);
    } catch {
      alert("JSON 형식이 올바르지 않습니다.");
      return;
    }
    setAnswerSaving(true);
    try {
      const result = await apiPut(`/v1/admin/pro/chapters/${selectedChapter.id}/answer-content`, {
        title: answerTitle,
        payload: JSON.parse(answerJson),
      });
      setAnswerContentId(result.contentId || result.content_id);
      alert("정답해설 저장 완료");
      // 콘텐츠 현황 갱신
      const st = await apiGet(`/v1/admin/pro/chapters/${selectedChapter.id}/content-status`);
      setContentStatus(st);
      setStatusCache(prev => ({ ...prev, [selectedChapter.id]: st }));
    } catch (err) {
      alert(err.message || "저장에 실패했습니다.");
    }
    setAnswerSaving(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setAnswerJson(JSON.stringify(parsed, null, 2));
        setAnswerTab("edit");
      } catch {
        alert("유효한 JSON 파일이 아닙니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRegisterTest = async () => {
    if (!testPaperId) { alert("시험지를 선택하세요."); return; }
    try {
      await apiPost(`/v1/admin/pro/chapters/${selectedChapter.id}/tests`, {
        version: Number(testVersion),
        testPaperId,
      });
      alert(`버전 ${testVersion} 테스트 등록 완료`);
      // 콘텐츠 현황 갱신
      const st = await apiGet(`/v1/admin/pro/chapters/${selectedChapter.id}/content-status`);
      setContentStatus(st);
      setStatusCache(prev => ({ ...prev, [selectedChapter.id]: st }));
      setTestVersion(v => Number(v) + 1);
      setTestPaperId("");
    } catch (err) {
      alert(err.message || "테스트 등록에 실패했습니다.");
    }
  };

  // ─── 테스트 문항 관리 ───
  const loadTestQuestions = async (paperId) => {
    if (!paperId) { setTestQuestions([]); return; }
    setTestQuestionsLoading(true);
    setSelectedTestPaperId(paperId);
    setEditingQIdx(null);
    setEditQ(null);
    setTestJsonMode(false);
    try {
      const res = await apiGet(`/v1/admin/test-papers/${paperId}/questions`);
      const qs = Array.isArray(res) ? res : [];
      setTestQuestions(qs);
      setTestQuestionsModified(false);
    } catch {
      setTestQuestions([]);
    }
    setTestQuestionsLoading(false);
  };

  const handleSaveTestQuestions = async () => {
    if (!selectedTestPaperId) return;
    setTestQuestionsSaving(true);
    try {
      const payload = testQuestions.map(q => ({
        number: q.number,
        type: q.type,
        domain: q.domain || null,
        subDomain: q.subDomain || q.sub_domain || null,
        passage: q.passage || null,
        stem: q.stem || null,
        points: q.points,
        correctAnswer: q.correctAnswer || q.correct_answer || null,
        choices: q.choices || null,
        choiceExplanations: q.choiceExplanations || q.choice_explanations || null,
        intent: q.intent || null,
        essayKeywords: q.essayKeywords || q.essay_keywords || null,
        essayRubric: q.essayRubric || q.essay_rubric || null,
        modelAnswer: q.modelAnswer || q.model_answer || null,
      }));
      await apiPost(`/v1/admin/test-papers/${selectedTestPaperId}/questions`, { questions: payload });
      setTestQuestionsModified(false);
      alert("문항 저장 완료");
    } catch (err) {
      alert(err.message || "문항 저장에 실패했습니다.");
    }
    setTestQuestionsSaving(false);
  };

  const startEditQuestion = (idx) => {
    setEditingQIdx(idx);
    setEditQ({ ...testQuestions[idx] });
  };

  const cancelEditQuestion = () => {
    setEditingQIdx(null);
    setEditQ(null);
  };

  const applyEditQuestion = () => {
    if (editingQIdx === null || !editQ) return;
    const next = [...testQuestions];
    next[editingQIdx] = editQ;
    setTestQuestions(next);
    setTestQuestionsModified(true);
    setEditingQIdx(null);
    setEditQ(null);
  };

  const deleteQuestion = (idx) => {
    if (!confirm(`${testQuestions[idx].number}번 문항을 삭제하시겠습니까?`)) return;
    const next = testQuestions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, number: i + 1 }));
    setTestQuestions(next);
    setTestQuestionsModified(true);
    if (editingQIdx === idx) { setEditingQIdx(null); setEditQ(null); }
  };

  const addQuestion = () => {
    const nextNum = testQuestions.length + 1;
    const newQ = {
      number: nextNum,
      type: "객관식",
      domain: "",
      points: 3,
      stem: "",
      passage: null,
      correctAnswer: "",
      choices: [
        { id: "1", text: "" }, { id: "2", text: "" },
        { id: "3", text: "" }, { id: "4", text: "" },
      ],
      choiceExplanations: {},
    };
    setTestQuestions([...testQuestions, newQ]);
    setTestQuestionsModified(true);
    startEditQuestion(testQuestions.length);
  };

  const applyTestJson = () => {
    try {
      const parsed = JSON.parse(testJsonText);
      const qs = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(qs)) { alert("questions 배열을 찾을 수 없습니다."); return; }
      setTestQuestions(qs);
      setTestQuestionsModified(true);
      setTestJsonMode(false);
    } catch {
      alert("JSON 파싱 실패");
    }
  };

  const openTestJsonMode = () => {
    setTestJsonText(JSON.stringify(testQuestions, null, 2));
    setTestJsonMode(true);
    setEditingQIdx(null);
    setEditQ(null);
  };

  const handleTestFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const qs = Array.isArray(parsed) ? parsed : parsed.questions;
        if (!Array.isArray(qs)) { alert("questions 배열을 찾을 수 없습니다."); return; }
        setTestQuestions(qs);
        setTestQuestionsModified(true);
        setTestJsonMode(false);
      } catch {
        alert("유효한 JSON 파일이 아닙니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 정답해설 미리보기 렌더
  const renderAnswerPreview = () => {
    let data;
    try { data = JSON.parse(answerJson); } catch { return <p className="ap-error">JSON 파싱 실패</p>; }
    const sections = data?.sections || [];
    if (sections.length === 0) return <p className="ap-muted">섹션이 없습니다.</p>;

    return sections.map((section, si) => (
      <div key={si} className="ap-preview-section">
        <h4 className="ap-preview-section-title">{section.title}</h4>
        {section.groups?.map((group, gi) => (
          <div key={gi} className="ap-preview-group">
            <h5 className="ap-preview-group-title">{group.groupTitle}</h5>
            {group.items?.map((item, ii) => (
              <div key={ii} className="ap-preview-item">
                <div className="ap-preview-item-header">
                  <span className="ap-preview-num">{item.number}</span>
                  {item.type && <span className="ap-preview-type">{item.type}</span>}
                  {item.points && <span className="ap-preview-pts">{item.points}점</span>}
                </div>
                {item.problem && <p className="ap-preview-problem">{item.problem}</p>}
                {item.answer && <div className="ap-preview-answer"><strong>정답:</strong> {item.answer}</div>}
                {item.modelAnswer && <div className="ap-preview-model"><strong>모범답안:</strong> {item.modelAnswer}</div>}
                {item.explanation && <div className="ap-preview-explanation"><strong>해설:</strong> {item.explanation}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    ));
  };

  // ─── 상세 뷰 ───
  if (selectedChapter) {
    const tests = contentStatus?.testVersions || contentStatus?.test_versions || [];

    return (
      <AdminLayout>
        <div className="ts-page ts-admin ap-page">
          <header className="ts-header">
            <h1>{selectedChapter.title}</h1>
            <button className="ts-btn ts-btn-outline" onClick={() => { setSelectedChapter(null); load(); }}>
              <span className="material-symbols-outlined">arrow_back</span> 목록으로
            </button>
          </header>

          {/* 챕터 메타 수정 */}
          <section className="ts-section-card">
            <h3 className="ts-section-title">챕터 정보</h3>
            <div className="ts-form-grid">
              <label>
                제목
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </label>
              <label>
                상태
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </label>
              <label className="ts-form-full">
                설명
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} />
              </label>
              <label className="ts-form-full">
                영상 URL
                <input value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              </label>
            </div>
            <div className="ts-save-row">
              <button className="ts-btn ts-btn-primary" onClick={handleUpdateChapter}>저장</button>
            </div>
          </section>

          {/* 콘텐츠 현황 */}
          <section className="ts-section-card">
            <h3 className="ts-section-title">콘텐츠 현황</h3>
            {statusLoading ? (
              <p className="ap-muted">불러오는 중...</p>
            ) : !contentStatus ? (
              <p className="ap-muted">콘텐츠 현황을 불러올 수 없습니다.</p>
            ) : (
              <div className="ap-content-status">
                {(contentStatus.items || []).map(item => (
                  <div key={item.type} className={`ap-status-row ${item.count > 0 ? "ok" : "missing"}`}>
                    <span className="ap-status-icon">{item.count > 0 ? "✅" : "❌"}</span>
                    <span className="ap-status-type">{TYPE_LABELS[item.type] || item.type}</span>
                    <span className="ap-status-count">({item.count}개)</span>
                    <div className="ap-status-contents">
                      {item.count > 0 ? (
                        item.contents?.map(c => (
                          <div key={c.contentId || c.content_id} className="ap-status-content-item">
                            {c.title} <span className="ap-content-id">({(c.contentId || c.content_id || "").slice(0, 16)}...)</span>
                          </div>
                        ))
                      ) : (
                        <span className="ap-no-content">미연결 — 배치 업로드로 추가하세요</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 정답해설 관리 */}
          <section className="ts-section-card">
            <h3 className="ts-section-title">정답해설 관리</h3>
            {answerLoading ? (
              <p className="ap-muted">불러오는 중...</p>
            ) : (
              <>
                <div className="ap-answer-tabs">
                  <button className={`ap-tab ${answerTab === "edit" ? "active" : ""}`} onClick={() => setAnswerTab("edit")}>JSON 편집</button>
                  <button className={`ap-tab ${answerTab === "upload" ? "active" : ""}`} onClick={() => setAnswerTab("upload")}>파일 업로드</button>
                  <button className={`ap-tab ${answerTab === "preview" ? "active" : ""}`} onClick={() => setAnswerTab("preview")}>미리보기</button>
                  {answerContentId && <span className="ap-answer-id">ID: {answerContentId.slice(0, 16)}...</span>}
                </div>

                {answerTab === "edit" && (
                  <div className="ap-answer-edit">
                    <label className="ap-answer-title-label">
                      제목
                      <input value={answerTitle} onChange={e => setAnswerTitle(e.target.value)} />
                    </label>
                    <textarea
                      className="ap-json-editor"
                      value={answerJson}
                      onChange={e => setAnswerJson(e.target.value)}
                      rows={18}
                      spellCheck={false}
                    />
                    <div className="ap-answer-actions">
                      <button className="ts-btn ts-btn-primary" onClick={handleSaveAnswer} disabled={answerSaving}>
                        {answerSaving ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                )}

                {answerTab === "upload" && (
                  <div className="ap-answer-upload">
                    <div className="ap-drop-zone">
                      <span className="material-symbols-outlined ap-drop-icon">upload_file</span>
                      <p>JSON 파일을 선택하세요</p>
                      <input type="file" accept=".json,application/json" onChange={handleFileUpload} />
                    </div>
                    <p className="ap-muted">업로드 후 JSON 편집 탭에서 내용을 확인하고 저장하세요.</p>
                  </div>
                )}

                {answerTab === "preview" && (
                  <div className="ap-answer-preview">
                    {answerTitle && <h3 className="ap-preview-title">{answerTitle}</h3>}
                    {renderAnswerPreview()}
                  </div>
                )}
              </>
            )}
          </section>

          {/* 테스트 관리 — 3탭 */}
          <section className="ts-section-card">
            <h3 className="ts-section-title">테스트 관리</h3>

            <div className="ap-answer-tabs">
              <button className={`ap-tab ${testMgmtTab === "items" ? "active" : ""}`} onClick={() => setTestMgmtTab("items")}>
                테스트 문항
              </button>
              <button className={`ap-tab ${testMgmtTab === "versions" ? "active" : ""}`} onClick={() => setTestMgmtTab("versions")}>
                테스트 버전
              </button>
              <button className={`ap-tab ${testMgmtTab === "preview" ? "active" : ""}`} onClick={() => setTestMgmtTab("preview")}>
                미리보기
              </button>
              {testQuestionsModified && <span className="ap-unsaved-badge">미저장</span>}
            </div>

            {/* ── 탭 1: 테스트 문항 ── */}
            {testMgmtTab === "items" && (
              <div className="ap-test-items">
                {/* 버전 선택 */}
                {tests.length > 0 ? (
                  <div className="ap-test-version-select">
                    <label>
                      버전 선택
                      <select
                        value={selectedTestPaperId}
                        onChange={e => loadTestQuestions(e.target.value)}
                      >
                        <option value="">-- 시험지 선택 --</option>
                        {tests.map(t => (
                          <option key={t.version} value={t.testPaperId || t.test_paper_id}>
                            v{t.version} ({(t.testPaperId || t.test_paper_id || "").slice(0, 20)}...)
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : (
                  <p className="ap-muted">등록된 테스트 버전이 없습니다. 테스트 버전 탭에서 먼저 등록하세요.</p>
                )}

                {/* 문항 로딩 */}
                {testQuestionsLoading && <p className="ap-muted">문항을 불러오는 중...</p>}

                {/* 문항 목록 */}
                {selectedTestPaperId && !testQuestionsLoading && !testJsonMode && (
                  <>
                    {testQuestions.length > 0 ? (
                      <table className="ts-table ap-q-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>유형</th>
                            <th>역량</th>
                            <th>배점</th>
                            <th>정답</th>
                            <th>문제 미리보기</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {testQuestions.map((q, idx) => (
                            <tr key={idx} className={editingQIdx === idx ? "ap-q-editing" : ""}>
                              <td>{q.number}</td>
                              <td>
                                <span className={`ap-q-type-badge ${q.type === "서술형" ? "essay" : "mc"}`}>
                                  {q.type}
                                </span>
                              </td>
                              <td className="ap-q-domain">{q.domain || "-"}</td>
                              <td>{q.points}</td>
                              <td className="ap-mono">
                                {q.correctAnswer || q.correct_answer || (q.modelAnswer || q.model_answer ? "서술" : "-")}
                              </td>
                              <td className="ap-q-stem-preview">
                                {(q.stem || q.passage || "").slice(0, 40)}
                                {(q.stem || q.passage || "").length > 40 ? "..." : ""}
                              </td>
                              <td className="ap-q-actions">
                                <button className="ap-q-btn edit" title="편집" onClick={() => startEditQuestion(idx)}>
                                  <span className="material-symbols-outlined">edit</span>
                                </button>
                                <button className="ap-q-btn delete" title="삭제" onClick={() => deleteQuestion(idx)}>
                                  <span className="material-symbols-outlined">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="ap-muted">문항이 없습니다.</p>
                    )}

                    {/* 문항 편집 패널 */}
                    {editingQIdx !== null && editQ && (
                      <div className="ap-q-edit-panel">
                        <h4>문항 {editQ.number} 편집</h4>
                        <div className="ap-q-edit-grid">
                          <label>
                            유형
                            <select value={editQ.type} onChange={e => setEditQ({ ...editQ, type: e.target.value })}>
                              <option value="객관식">객관식</option>
                              <option value="서술형">서술형</option>
                            </select>
                          </label>
                          <label>
                            역량 (domain)
                            <input value={editQ.domain || ""} onChange={e => setEditQ({ ...editQ, domain: e.target.value })} />
                          </label>
                          <label>
                            배점
                            <input type="number" min={1} value={editQ.points} onChange={e => setEditQ({ ...editQ, points: Number(e.target.value) })} />
                          </label>
                          {editQ.type === "객관식" && (
                            <label>
                              정답
                              <input value={editQ.correctAnswer || editQ.correct_answer || ""} onChange={e => setEditQ({ ...editQ, correctAnswer: e.target.value })} placeholder="예: 2" />
                            </label>
                          )}
                        </div>

                        <label className="ap-q-edit-full">
                          문제 본문 (stem)
                          <textarea
                            value={editQ.stem || ""}
                            onChange={e => setEditQ({ ...editQ, stem: e.target.value })}
                            rows={3}
                          />
                        </label>

                        <label className="ap-q-edit-full">
                          지문 (passage)
                          <textarea
                            value={editQ.passage || ""}
                            onChange={e => setEditQ({ ...editQ, passage: e.target.value || null })}
                            rows={4}
                            placeholder="독해 지문이 있는 경우 입력"
                          />
                        </label>

                        {/* 객관식: 선택지 + 해설 */}
                        {editQ.type === "객관식" && (
                          <div className="ap-q-choices-edit">
                            <h5>선택지 / 해설</h5>
                            {(editQ.choices || []).map((ch, ci) => (
                              <div key={ci} className="ap-q-choice-row">
                                <span className="ap-q-choice-num">{ch.id || ci + 1}</span>
                                <input
                                  className="ap-q-choice-text"
                                  value={ch.text}
                                  onChange={e => {
                                    const next = [...(editQ.choices || [])];
                                    next[ci] = { ...next[ci], text: e.target.value };
                                    setEditQ({ ...editQ, choices: next });
                                  }}
                                  placeholder="선택지 텍스트"
                                />
                                <input
                                  className="ap-q-choice-expl"
                                  value={(editQ.choiceExplanations || editQ.choice_explanations || {})[ch.id || String(ci + 1)] || ""}
                                  onChange={e => {
                                    const key = ch.id || String(ci + 1);
                                    const expl = { ...(editQ.choiceExplanations || editQ.choice_explanations || {}), [key]: e.target.value };
                                    setEditQ({ ...editQ, choiceExplanations: expl });
                                  }}
                                  placeholder="해설"
                                />
                              </div>
                            ))}
                            <button
                              className="ts-btn ts-btn-outline ap-q-add-choice"
                              onClick={() => {
                                const nextId = String((editQ.choices || []).length + 1);
                                setEditQ({ ...editQ, choices: [...(editQ.choices || []), { id: nextId, text: "" }] });
                              }}
                            >
                              + 선택지 추가
                            </button>
                          </div>
                        )}

                        {/* 서술형: 모범답안, 키워드, 루브릭 */}
                        {editQ.type === "서술형" && (
                          <div className="ap-q-essay-edit">
                            <label className="ap-q-edit-full">
                              모범답안
                              <textarea
                                value={editQ.modelAnswer || editQ.model_answer || ""}
                                onChange={e => setEditQ({ ...editQ, modelAnswer: e.target.value })}
                                rows={3}
                              />
                            </label>
                            <label className="ap-q-edit-full">
                              채점 기준 (rubric)
                              <textarea
                                value={editQ.essayRubric || editQ.essay_rubric || ""}
                                onChange={e => setEditQ({ ...editQ, essayRubric: e.target.value })}
                                rows={2}
                              />
                            </label>
                          </div>
                        )}

                        <div className="ap-q-edit-actions">
                          <button className="ts-btn ts-btn-primary" onClick={applyEditQuestion}>적용</button>
                          <button className="ts-btn ts-btn-outline" onClick={cancelEditQuestion}>취소</button>
                        </div>
                      </div>
                    )}

                    {/* 하단 액션 */}
                    <div className="ap-test-bottom-actions">
                      <div className="ap-test-bottom-left">
                        <button className="ts-btn ts-btn-outline" onClick={addQuestion}>
                          <span className="material-symbols-outlined">add</span> 문항 추가
                        </button>
                        <button className="ts-btn ts-btn-outline" onClick={openTestJsonMode}>
                          <span className="material-symbols-outlined">code</span> JSON 편집
                        </button>
                        <label className="ts-btn ts-btn-outline ap-file-upload-btn">
                          <span className="material-symbols-outlined">upload_file</span> JSON 가져오기
                          <input type="file" accept=".json" onChange={handleTestFileUpload} hidden />
                        </label>
                      </div>
                      <div className="ap-test-bottom-right">
                        <span className="ap-q-count">{testQuestions.length}문항 / {testQuestions.reduce((s, q) => s + (q.points || 0), 0)}점</span>
                        <button
                          className="ts-btn ts-btn-primary"
                          onClick={handleSaveTestQuestions}
                          disabled={testQuestionsSaving || !testQuestionsModified}
                        >
                          {testQuestionsSaving ? "저장 중..." : "문항 저장"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* JSON 직접 편집 모드 */}
                {testJsonMode && (
                  <div className="ap-test-json-edit">
                    <textarea
                      className="ap-json-editor"
                      value={testJsonText}
                      onChange={e => setTestJsonText(e.target.value)}
                      rows={24}
                      spellCheck={false}
                    />
                    <div className="ap-test-json-actions">
                      <button className="ts-btn ts-btn-primary" onClick={applyTestJson}>JSON 적용</button>
                      <button className="ts-btn ts-btn-outline" onClick={() => setTestJsonMode(false)}>취소</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 탭 2: 테스트 버전 ── */}
            {testMgmtTab === "versions" && (
              <div className="ap-test-versions">
                {tests.length > 0 ? (
                  <table className="ts-table ap-test-table">
                    <thead>
                      <tr><th>버전</th><th>시험지 ID</th><th>상태</th></tr>
                    </thead>
                    <tbody>
                      {tests.map(t => (
                        <tr key={t.version}>
                          <td>v{t.version}</td>
                          <td className="ap-mono">{t.testPaperId || t.test_paper_id}</td>
                          <td><span className={`ts-status-badge ${t.status === "active" ? "active" : "archived"}`}>{t.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="ap-muted">등록된 테스트가 없습니다.</p>
                )}

                <div className="ap-test-register">
                  <h4>새 버전 등록</h4>
                  <div className="ts-test-register-row">
                    <label className="ts-test-register-label version">
                      버전
                      <input type="number" min={1} value={testVersion} onChange={e => setTestVersion(e.target.value)} />
                    </label>
                    <label className="ts-test-register-label paper">
                      시험지 선택
                      <select value={testPaperId} onChange={e => setTestPaperId(e.target.value)}>
                        <option value="">-- 시험지 선택 --</option>
                        {testPapers.map(tp => (
                          <option key={tp.testId || tp.test_id} value={tp.testId || tp.test_id}>
                            {tp.title} ({tp.testId || tp.test_id})
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="ts-btn ts-btn-primary" onClick={handleRegisterTest}>등록</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 탭 3: 미리보기 ── */}
            {testMgmtTab === "preview" && (
              <div className="ap-test-preview">
                {/* 버전 선택 (미리보기용) */}
                {tests.length > 0 && (
                  <div className="ap-test-version-select">
                    <label>
                      버전 선택
                      <select
                        value={selectedTestPaperId}
                        onChange={e => { loadTestQuestions(e.target.value); setPreviewIdx(0); }}
                      >
                        <option value="">-- 시험지 선택 --</option>
                        {tests.map(t => (
                          <option key={t.version} value={t.testPaperId || t.test_paper_id}>
                            v{t.version}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {testQuestionsLoading && <p className="ap-muted">불러오는 중...</p>}

                {selectedTestPaperId && !testQuestionsLoading && testQuestions.length > 0 && (() => {
                  const pq = testQuestions[previewIdx];
                  if (!pq) return null;
                  return (
                    <div className="ap-preview-test">
                      {/* 문항 네비게이션 */}
                      <div className="ap-preview-nav">
                        {testQuestions.map((item, i) => (
                          <button
                            key={i}
                            className={`ap-preview-nav-btn ${i === previewIdx ? "active" : ""}`}
                            onClick={() => setPreviewIdx(i)}
                          >
                            {item.number}
                          </button>
                        ))}
                      </div>

                      {/* 문항 표시 */}
                      <div className="ap-preview-question">
                        <div className="ap-preview-item-header">
                          <span className="ap-preview-num">{pq.number}번</span>
                          <span className={`ap-q-type-badge ${pq.type === "서술형" ? "essay" : "mc"}`}>{pq.type}</span>
                          <span className="ap-preview-pts">{pq.points}점</span>
                          {pq.domain && <span className="ap-preview-domain">{pq.domain}</span>}
                        </div>

                        {pq.passage && (
                          <div className="ap-preview-passage">{pq.passage}</div>
                        )}

                        {pq.stem && (
                          <div className="ap-preview-stem">{pq.stem}</div>
                        )}

                        {/* 객관식 선택지 */}
                        {pq.type === "객관식" && pq.choices && (
                          <div className="ap-preview-choices">
                            {pq.choices.map((ch, ci) => {
                              const isCorrect = String(ch.id || ci + 1) === String(pq.correctAnswer || pq.correct_answer);
                              return (
                                <div key={ci} className={`ap-preview-choice ${isCorrect ? "correct" : ""}`}>
                                  <span className="ap-preview-choice-num">{ch.id || ci + 1}</span>
                                  <span className="ap-preview-choice-text">{ch.text}</span>
                                  {isCorrect && <span className="ap-preview-correct-mark">정답</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* 서술형 모범답안 */}
                        {pq.type === "서술형" && (pq.modelAnswer || pq.model_answer) && (
                          <div className="ap-preview-model-answer">
                            <strong>모범답안:</strong> {pq.modelAnswer || pq.model_answer}
                          </div>
                        )}

                        {/* 선택지 해설 */}
                        {(pq.choiceExplanations || pq.choice_explanations) && Object.keys(pq.choiceExplanations || pq.choice_explanations || {}).length > 0 && (
                          <div className="ap-preview-explanations">
                            <h5>선택지 해설</h5>
                            {Object.entries(pq.choiceExplanations || pq.choice_explanations).map(([k, v]) => (
                              <div key={k} className="ap-preview-expl-item">
                                <span className="ap-preview-expl-num">{k}.</span> {v}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 이전/다음 */}
                      <div className="ap-preview-footer">
                        <button className="ts-btn ts-btn-outline" onClick={() => setPreviewIdx(Math.max(0, previewIdx - 1))} disabled={previewIdx === 0}>이전</button>
                        <span>{previewIdx + 1} / {testQuestions.length}</span>
                        <button className="ts-btn ts-btn-outline" onClick={() => setPreviewIdx(Math.min(testQuestions.length - 1, previewIdx + 1))} disabled={previewIdx >= testQuestions.length - 1}>다음</button>
                      </div>
                    </div>
                  );
                })()}

                {selectedTestPaperId && !testQuestionsLoading && testQuestions.length === 0 && (
                  <p className="ap-muted">문항이 없습니다.</p>
                )}

                {!selectedTestPaperId && !testQuestionsLoading && (
                  <p className="ap-muted">미리보기할 테스트 버전을 선택하세요.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </AdminLayout>
    );
  }

  // ─── 목록 뷰 ───
  return (
    <AdminLayout>
      <div className="ts-page ts-admin ap-page">
        <header className="ts-header">
          <h1>프로 모드 관리</h1>
        </header>

        <div className="ts-level-filter">
          <select className="ts-level-select" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">전체 레벨</option>
            {COURSE_LEVELS.map(lv => (
              <option key={lv.id} value={lv.id}>{lv.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="ts-center"><p>불러오는 중...</p></div>
        ) : loadError ? (
          <div className="ts-center">
            <p className="ap-error">오류: {loadError}</p>
            <button className="ts-btn ts-btn-outline" onClick={load} style={{ marginTop: 12 }}>다시 시도</button>
          </div>
        ) : chapters.length === 0 ? (
          <div className="ts-center"><p>등록된 챕터가 없습니다.</p></div>
        ) : (
          <table className="ts-table ap-chapter-table">
            <thead>
              <tr>
                <th>#</th>
                <th>챕터</th>
                <th>콘텐츠</th>
                <th>해설</th>
                <th>시험</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {chapters.map(ch => {
                const comp = getChapterCompleteness(ch);
                const st = comp.status;
                const contentItems = st?.items?.filter(i => ["reading","vocab","background","logic"].includes(i.type)) || [];
                const answerItem = st?.items?.find(i => i.type === "answer");
                const testCount = st?.testVersions?.length || st?.test_versions?.length || 0;

                return (
                  <tr key={ch.id} className="ts-clickable-row" onClick={() => openDetail(ch)}>
                    <td className="ap-col-num">{ch.globalChapterNumber || ch.global_chapter_number}</td>
                    <td className="ap-col-chapter">
                      <div className="ap-chapter-name">{LEVEL_NAME_MAP[ch.levelId || ch.level_id] || ch.levelId || ch.level_id}</div>
                      <div className="ap-chapter-num">{ch.chapterNumber || ch.chapter_number}장</div>
                    </td>
                    <td className="ap-col-content">
                      {st ? (
                        <div className="ap-content-icons">
                          {contentItems.map(item => (
                            <span key={item.type} className={`ap-icon ${item.count > 0 ? "ok" : "miss"}`} title={TYPE_LABELS[item.type]}>
                              {TYPE_LABELS[item.type]?.[0] || item.type[0]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="ap-muted">...</span>
                      )}
                    </td>
                    <td className="ap-col-answer">
                      {st ? (
                        answerItem && answerItem.count > 0
                          ? <span className="ap-check ok">✓</span>
                          : <span className="ap-check miss">✗</span>
                      ) : "..."}
                    </td>
                    <td className="ap-col-test">
                      {st ? (
                        testCount > 0
                          ? <span className="ap-test-count">{testCount}v</span>
                          : <span className="ap-check miss">0v</span>
                      ) : "..."}
                    </td>
                    <td className="ap-col-overall">
                      {comp.overall === "complete" && <span className="ap-overall complete" title="완비">○</span>}
                      {comp.overall === "partial" && <span className="ap-overall partial" title="일부 누락">△</span>}
                      {comp.overall === "empty" && <span className="ap-overall empty" title="미설정">✗</span>}
                      {comp.overall === null && <span className="ap-muted">...</span>}
                    </td>
                    <td className="ap-col-action">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="ap-legend">
          <span><span className="ap-overall complete">○</span> 완비 (콘텐츠+해설+테스트)</span>
          <span><span className="ap-overall partial">△</span> 일부 누락</span>
          <span><span className="ap-overall empty">✗</span> 미설정</span>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminProPage;
