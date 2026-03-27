import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPut } from "../utils/adminApi";
import { API_BASE } from "../utils/api";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-pro.css";

/* ─── 상수 ─── */
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

const TYPE_LABELS = {
  reading: "독해", vocab: "어휘", background: "배경", logic: "논리", answer: "정답",
};

const ANSWER_TEMPLATE = JSON.stringify({
  sections: [{
    title: "섹션 제목",
    groups: [{
      groupTitle: "그룹 제목",
      items: [{ number: "1", type: "객관식", points: 3, answer: "3", explanation: "해설 내용" }],
    }],
  }],
}, null, 2);

const CONTENT_TYPE_TO_MODULE = {
  PRO_READING: "reading_training",
  PRO_BACKGROUND: "worksheet_quiz",
  PRO_VOCAB: "worksheet_quiz",
  PRO_LOGIC: "logic_reasoning",
  PRO_ANSWER: "answer_key",
  PRO_TEST: "worksheet_quiz",
};
const resolveModuleKey = (ct, fallback) =>
  fallback || CONTENT_TYPE_TO_MODULE[ct] || "worksheet_quiz";

/* ─────────────────────── 컴포넌트 ─────────────────────── */
function AdminProPage() {
  const navigate = useNavigate();

  /* 레벨 & 챕터 목록 */
  const [levelFilter, setLevelFilter] = useState("saussure1");
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [statusCache, setStatusCache] = useState({});

  /* 상세 뷰 */
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [activeTab, setActiveTab] = useState("content");

  /* 영상 URL */
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [videoSaving, setVideoSaving] = useState(false);

  /* 콘텐츠 탭 */
  const [contentStatus, setContentStatus] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [infoPopoverId, setInfoPopoverId] = useState(null);

  /* 정답해설 탭 */
  const [answerMode, setAnswerMode] = useState("preview");
  const [answerJson, setAnswerJson] = useState("");
  const [answerTitle, setAnswerTitle] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerSaving, setAnswerSaving] = useState(false);
  const [answerContentId, setAnswerContentId] = useState(null);

  /* 테스트 탭 */
  const [testSubTab, setTestSubTab] = useState("editor");
  const [selectedTestPaperId, setSelectedTestPaperId] = useState("");
  const [testQuestions, setTestQuestions] = useState([]);
  const [testQuestionsLoading, setTestQuestionsLoading] = useState(false);
  const [testQuestionsSaving, setTestQuestionsSaving] = useState(false);
  const [testQuestionsModified, setTestQuestionsModified] = useState(false);
  const [editingQIdx, setEditingQIdx] = useState(null);
  const [editQ, setEditQ] = useState(null);
  const [testJsonMode, setTestJsonMode] = useState(false);
  const [testJsonText, setTestJsonText] = useState("");

  /* 테스트 버전 등록 */
  const [testVersion, setTestVersion] = useState(1);
  const [testPaperId, setTestPaperId] = useState("");
  const [testPapers, setTestPapers] = useState([]);

  /* ═══ 챕터 목록 로드 ═══ */
  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    const qs = levelFilter ? `?levelId=${levelFilter}` : "";
    apiGet(`/v1/admin/pro/chapters${qs}`)
      .then((data) => {
        setChapters(data);
        data.forEach((ch) => {
          apiGet(`/v1/admin/pro/chapters/${ch.id}/content-status`)
            .then((st) => setStatusCache((prev) => ({ ...prev, [ch.id]: st })))
            .catch(() => {});
        });
      })
      .catch((err) => {
        setChapters([]);
        setLoadError(err.message || "챕터 목록을 불러오는데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, [levelFilter]);

  useEffect(load, [load]);

  /* 완비도 계산 */
  const getCompleteness = (ch) => {
    const st = statusCache[ch.id];
    if (!st) return { contentCount: null, answer: null, test: null };
    const cTypes = ["reading", "vocab", "background", "logic"];
    const total = cTypes.reduce(
      (s, t) => s + (st.items?.find((i) => i.type === t)?.count || 0), 0,
    );
    const answerOk = (st.items?.find((i) => i.type === "answer")?.count || 0) > 0;
    const tv = st.testVersions || st.test_versions || [];
    const latestVer = tv.length > 0 ? `v${Math.max(...tv.map((t) => t.version))}` : null;
    return { contentCount: total, answer: answerOk, test: latestVer };
  };

  /* ═══ 챕터 상세 진입 ═══ */
  const openDetail = async (ch) => {
    setSelectedChapter(ch);
    setActiveTab("content");
    setEditVideoUrl(ch.videoUrl || ch.video_url || "");
    setAnswerMode("preview");
    setInfoPopoverId(null);

    /* 콘텐츠 현황 */
    setContentLoading(true);
    try {
      const st = await apiGet(`/v1/admin/pro/chapters/${ch.id}/content-status`);
      setContentStatus(st);
      setStatusCache((prev) => ({ ...prev, [ch.id]: st }));
    } catch {
      setContentStatus(null);
    }
    setContentLoading(false);

    /* 정답해설 */
    loadAnswerData(ch);

    /* 시험지 목록 */
    apiGet("/v1/admin/test-papers").then(setTestPapers).catch(() => setTestPapers([]));

    /* 테스트 초기화 */
    setSelectedTestPaperId("");
    setTestQuestions([]);
    setTestQuestionsModified(false);
    setEditingQIdx(null);
    setEditQ(null);
    setTestJsonMode(false);
    setTestSubTab("editor");
    const tv = statusCache[ch.id]?.testVersions || statusCache[ch.id]?.test_versions || [];
    setTestVersion(tv.length + 1);
    setTestPaperId("");
  };

  const backToList = () => {
    setSelectedChapter(null);
    load();
  };

  /* ═══ 정답해설 로드 ═══ */
  const loadAnswerData = async (ch) => {
    setAnswerLoading(true);
    setAnswerContentId(null);
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
  };

  /* ═══ 영상 URL 저장 ═══ */
  const handleSaveVideo = async () => {
    if (!selectedChapter) return;
    setVideoSaving(true);
    try {
      await apiPut(`/v1/admin/pro/chapters/${selectedChapter.id}`, {
        title: selectedChapter.title,
        status: selectedChapter.status,
        videoUrl: editVideoUrl || null,
      });
      alert("영상 URL 저장 완료");
    } catch (err) {
      alert(err.message || "저장 실패");
    }
    setVideoSaving(false);
  };

  /* ═══ 콘텐츠 미리보기 ═══ */
  const handleContentPreview = async (contentId) => {
    setPreviewLoadingId(contentId);
    try {
      const preview = await apiGet(`/v1/admin/content/${contentId}/preview`);
      const ct = preview.contentType || preview.content_type || "";
      const rawContent = preview.content || {};
      const previewData = { ...rawContent, contentType: ct };
      const moduleKey = resolveModuleKey(ct, preview.moduleKey || preview.module_key);
      localStorage.setItem("korfarm_preview_content", JSON.stringify(previewData));
      localStorage.setItem("korfarm_preview_module", moduleKey);
      navigate("/admin/content/preview?from=/admin/pro");
    } catch (err) {
      alert(err.message || "미리보기 실패");
    }
    setPreviewLoadingId(null);
  };

  /* ═══ 정답해설 저장 ═══ */
  const handleSaveAnswer = async () => {
    try { JSON.parse(answerJson); } catch { alert("JSON 형식이 올바르지 않습니다."); return; }
    setAnswerSaving(true);
    try {
      const result = await apiPut(`/v1/admin/pro/chapters/${selectedChapter.id}/answer-content`, {
        title: answerTitle,
        payload: JSON.parse(answerJson),
      });
      setAnswerContentId(result.contentId || result.content_id);
      alert("정답해설 저장 완료");
      const st = await apiGet(`/v1/admin/pro/chapters/${selectedChapter.id}/content-status`);
      setContentStatus(st);
      setStatusCache((prev) => ({ ...prev, [selectedChapter.id]: st }));
    } catch (err) {
      alert(err.message || "저장 실패");
    }
    setAnswerSaving(false);
  };

  const handleAnswerFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setAnswerJson(JSON.stringify(parsed, null, 2));
        setAnswerMode("edit");
      } catch {
        alert("유효한 JSON 파일이 아닙니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ═══ 정답해설 미리보기 렌더 ═══ */
  const renderAnswerPreview = () => {
    if (!answerJson || answerJson === ANSWER_TEMPLATE) {
      return <p className="ap-muted">저장된 정답해설이 없습니다. JSON 편집 탭에서 작성하세요.</p>;
    }
    let data;
    try { data = JSON.parse(answerJson); } catch { return <p className="ap-error">JSON 파싱 실패</p>; }
    if (!data) return <p className="ap-muted">데이터가 비어있습니다.</p>;

    const sections = data?.sections || [];
    if (sections.length === 0) {
      return (
        <div>
          <p className="ap-muted">sections 구조가 아닙니다. 원본 JSON:</p>
          <pre className="ap-raw-json">{answerJson}</pre>
        </div>
      );
    }

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

  /* ═══ 테스트 문항 관리 ═══ */
  const loadTestQuestions = async (paperId) => {
    if (!paperId) { setTestQuestions([]); setSelectedTestPaperId(""); return; }
    setTestQuestionsLoading(true);
    setSelectedTestPaperId(paperId);
    setEditingQIdx(null);
    setEditQ(null);
    setTestJsonMode(false);
    try {
      const res = await apiGet(`/v1/admin/test-papers/${paperId}/questions`);
      setTestQuestions(Array.isArray(res) ? res : []);
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
      const payload = testQuestions.map((q) => ({
        number: q.number, type: q.type, domain: q.domain || null,
        subDomain: q.subDomain || q.sub_domain || null,
        passage: q.passage || null, stem: q.stem || null, points: q.points,
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
      alert(err.message || "문항 저장 실패");
    }
    setTestQuestionsSaving(false);
  };

  const startEditQuestion = (idx) => { setEditingQIdx(idx); setEditQ(JSON.parse(JSON.stringify(testQuestions[idx]))); };
  const cancelEditQuestion = () => { setEditingQIdx(null); setEditQ(null); };

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
    setTestQuestions(
      testQuestions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, number: i + 1 })),
    );
    setTestQuestionsModified(true);
    if (editingQIdx === idx) { setEditingQIdx(null); setEditQ(null); }
  };

  const addQuestion = () => {
    const nextNum = testQuestions.length + 1;
    const newQ = {
      number: nextNum, type: "객관식", domain: "", points: 3, stem: "", passage: null,
      correctAnswer: "",
      choices: [{ id: "1", text: "" }, { id: "2", text: "" }, { id: "3", text: "" }, { id: "4", text: "" }],
      choiceExplanations: {},
    };
    setTestQuestions([...testQuestions, newQ]);
    setTestQuestionsModified(true);
    setEditingQIdx(testQuestions.length);
    setEditQ(JSON.parse(JSON.stringify(newQ)));
  };

  const handleTestJsonDownload = () => {
    const blob = new Blob([JSON.stringify(testQuestions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-questions-${selectedTestPaperId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTestJsonUpload = (e) => {
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
        version: Number(testVersion), testPaperId,
      });
      alert(`버전 ${testVersion} 테스트 등록 완료`);
      const st = await apiGet(`/v1/admin/pro/chapters/${selectedChapter.id}/content-status`);
      setContentStatus(st);
      setStatusCache((prev) => ({ ...prev, [selectedChapter.id]: st }));
      setTestVersion((v) => Number(v) + 1);
      setTestPaperId("");
    } catch (err) {
      alert(err.message || "테스트 등록 실패");
    }
  };

  /* 콘텐츠 테이블 데이터 */
  const getContentItems = () => {
    if (!contentStatus?.items) return [];
    return contentStatus.items.flatMap((item) =>
      (item.contents || []).map((c) => ({
        id: c.contentId || c.content_id,
        title: c.title,
        type: TYPE_LABELS[item.type] || item.type,
        typeKey: item.type,
        contentType: c.contentType || c.content_type || "",
        updatedAt: c.updatedAt || c.updated_at || "",
      })),
    );
  };

  const tests = contentStatus?.testVersions || contentStatus?.test_versions || [];

  /* ═══════════════════════════════════════════════════════
     ══════════════ 상세 뷰 ══════════════
     ═══════════════════════════════════════════════════════ */
  if (selectedChapter) {
    return (
      <AdminLayout>
        <div className="ts-page ts-admin ap-page">
          {/* 상세 헤더 */}
          <header className="ap-detail-header">
            <button className="ap-back-btn" onClick={backToList}>
              <span className="material-symbols-outlined">arrow_back</span>
              목록으로
            </button>
            <div className="ap-detail-title-area">
              <h1>{selectedChapter.title}</h1>
              <span className="ap-detail-level">{selectedChapter.levelId || selectedChapter.level_id}</span>
            </div>
          </header>

          {/* 영상 URL */}
          <div className="ap-card ap-video-card">
            <label>영상 URL</label>
            <div className="ap-video-input-row">
              <input
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <button className="ts-btn ts-btn-primary ts-btn-sm" onClick={handleSaveVideo} disabled={videoSaving}>
                {videoSaving ? "..." : "저장"}
              </button>
            </div>
          </div>

          {/* 3탭 */}
          <div className="ap-tabs">
            <button className={`ap-tab ${activeTab === "content" ? "active" : ""}`} onClick={() => setActiveTab("content")}>콘텐츠</button>
            <button className={`ap-tab ${activeTab === "answer" ? "active" : ""}`} onClick={() => setActiveTab("answer")}>정답과 해설</button>
            <button className={`ap-tab ${activeTab === "test" ? "active" : ""}`} onClick={() => setActiveTab("test")}>테스트 관리</button>
          </div>

          <div className="ap-card ap-tab-body">
            {activeTab === "content" && renderContentTab()}
            {activeTab === "answer" && renderAnswerTab()}
            {activeTab === "test" && renderTestTab()}
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* ═══════════════════════════════════════════════════════
     ══════════════ 목록 뷰 ══════════════
     ═══════════════════════════════════════════════════════ */
  return (
    <AdminLayout>
      <div className="ts-page ts-admin ap-page">
        <header className="ap-list-header">
          <h1>프로 모드 관리</h1>
          <select
            className="ap-level-dropdown"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            {COURSE_LEVELS.map((lv) => (
              <option key={lv.id} value={lv.id}>{lv.name}</option>
            ))}
          </select>
        </header>

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
          <div className="ap-card">
            <table className="ts-table ap-chapter-table">
              <thead>
                <tr>
                  <th className="ap-col-num">#</th>
                  <th className="ap-col-chapter">챕터명</th>
                  <th className="ap-col-content">콘텐츠</th>
                  <th className="ap-col-answer">해설</th>
                  <th className="ap-col-test">시험</th>
                  <th className="ap-col-action"></th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((ch) => {
                  const comp = getCompleteness(ch);
                  return (
                    <tr key={ch.id} className="ts-clickable-row" onClick={() => openDetail(ch)}>
                      <td className="ap-col-num">{ch.chapterNumber ?? ch.chapter_number}</td>
                      <td className="ap-col-chapter">
                        <span className="ap-chapter-name">{ch.title}</span>
                      </td>
                      <td className="ap-col-content">
                        {comp.contentCount !== null
                          ? <span className={`ap-badge ${comp.contentCount >= 4 ? "ap-badge-ok" : "ap-badge-warn"}`}>{comp.contentCount}</span>
                          : <span className="ap-muted">...</span>}
                      </td>
                      <td className="ap-col-answer">
                        {comp.answer !== null
                          ? (comp.answer
                            ? <span className="ap-badge ap-badge-ok">✓</span>
                            : <span className="ap-badge ap-badge-miss">✗</span>)
                          : <span className="ap-muted">...</span>}
                      </td>
                      <td className="ap-col-test">
                        {comp.test
                          ? <span className="ap-badge ap-badge-info">{comp.test}</span>
                          : comp.answer !== null
                            ? <span className="ap-badge ap-badge-miss">-</span>
                            : <span className="ap-muted">...</span>}
                      </td>
                      <td className="ap-col-action">
                        <span className="material-symbols-outlined ap-row-arrow">chevron_right</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );

  /* ══════════════ 탭 1: 콘텐츠 ══════════════ */
  function renderContentTab() {
    if (contentLoading) return <p className="ap-muted">불러오는 중...</p>;
    if (!contentStatus) return <p className="ap-muted">콘텐츠 현황을 불러올 수 없습니다.</p>;
    const items = getContentItems();
    if (items.length === 0) return <p className="ap-muted">연결된 콘텐츠가 없습니다.</p>;

    return (
      <table className="ts-table ap-content-table">
        <thead>
          <tr>
            <th>제목</th>
            <th>유형</th>
            <th>최종수정일</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td className="ap-ct-title">{c.title || "(제목 없음)"}</td>
              <td><span className={`ap-ct-type ap-ct-type-${c.typeKey}`}>{c.type}</span></td>
              <td className="ap-ct-date">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("ko") : "-"}</td>
              <td className="ap-ct-actions">
                <button className="ap-icon-btn" title="미리보기" disabled={previewLoadingId === c.id}
                  onClick={() => handleContentPreview(c.id)}>
                  {previewLoadingId === c.id ? "..." : <span className="material-symbols-outlined">visibility</span>}
                </button>
                <button className="ap-icon-btn" title="수정"
                  onClick={() => navigate(`/admin/content/edit?id=${c.id}&from=/admin/pro`)}>
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button className="ap-icon-btn ap-icon-btn-muted" title="정보"
                  onClick={() => setInfoPopoverId(infoPopoverId === c.id ? null : c.id)}>
                  <span className="material-symbols-outlined">info</span>
                </button>
                {infoPopoverId === c.id && (
                  <div className="ap-info-popover">
                    <div><strong>ID:</strong> <code>{c.id}</code></div>
                    <div><strong>타입:</strong> {c.contentType}</div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  /* ══════════════ 탭 2: 정답과 해설 ══════════════ */
  function renderAnswerTab() {
    if (answerLoading) return <p className="ap-muted">불러오는 중...</p>;
    return (
      <div className="ap-answer-section">
        <div className="ap-answer-mode-bar">
          <button className={`ap-mode-btn ${answerMode === "preview" ? "active" : ""}`} onClick={() => setAnswerMode("preview")}>미리보기</button>
          <button className={`ap-mode-btn ${answerMode === "edit" ? "active" : ""}`} onClick={() => setAnswerMode("edit")}>JSON 편집</button>
          <button className={`ap-mode-btn ${answerMode === "upload" ? "active" : ""}`} onClick={() => setAnswerMode("upload")}>파일 업로드</button>
          {answerContentId && <span className="ap-answer-id">ID: {answerContentId.slice(0, 16)}...</span>}
        </div>

        {answerMode === "preview" && (
          <div className="ap-answer-preview">
            {answerTitle && <h3 className="ap-preview-title">{answerTitle}</h3>}
            {renderAnswerPreview()}
          </div>
        )}

        {answerMode === "edit" && (
          <div className="ap-answer-edit">
            <label className="ap-field-label">
              제목
              <input value={answerTitle} onChange={(e) => setAnswerTitle(e.target.value)} />
            </label>
            <textarea className="ap-json-editor" value={answerJson} onChange={(e) => setAnswerJson(e.target.value)} rows={20} spellCheck={false} />
            <div className="ap-actions-right">
              <button className="ts-btn ts-btn-primary" onClick={handleSaveAnswer} disabled={answerSaving}>
                {answerSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        )}

        {answerMode === "upload" && (
          <div className="ap-answer-upload">
            <div className="ap-drop-zone">
              <span className="material-symbols-outlined ap-drop-icon">upload_file</span>
              <p>JSON 파일을 선택하세요</p>
              <input type="file" accept=".json,application/json" onChange={handleAnswerFileUpload} />
            </div>
            <p className="ap-muted">업로드 후 JSON 편집 탭에서 내용을 확인하고 저장하세요.</p>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════ 탭 3: 테스트 관리 ══════════════ */
  function renderTestTab() {
    return (
      <div className="ap-test-section">
        <div className="ap-test-header">
          <div className="ap-test-version-select">
            <label>
              시험지
              <select value={selectedTestPaperId} onChange={(e) => loadTestQuestions(e.target.value)}>
                <option value="">-- 선택 --</option>
                {tests.map((t) => (
                  <option key={t.version} value={t.testPaperId || t.test_paper_id}>
                    v{t.version} ({(t.testPaperId || t.test_paper_id || "").slice(0, 20)}...)
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="ap-test-sub-tabs">
            <button className={`ap-mode-btn ${testSubTab === "editor" ? "active" : ""}`} onClick={() => setTestSubTab("editor")}>비주얼 에디터</button>
            <button className={`ap-mode-btn ${testSubTab === "pdf" ? "active" : ""}`} onClick={() => setTestSubTab("pdf")}>PDF 미리보기</button>
          </div>
          <div className="ap-test-io-btns">
            <button className="ts-btn ts-btn-outline ts-btn-sm" onClick={handleTestJsonDownload} disabled={testQuestions.length === 0}>
              <span className="material-symbols-outlined">download</span> JSON
            </button>
            <label className="ts-btn ts-btn-outline ts-btn-sm ap-file-upload-btn">
              <span className="material-symbols-outlined">upload</span> JSON
              <input type="file" accept=".json" onChange={handleTestJsonUpload} hidden />
            </label>
            {testQuestionsModified && <span className="ap-unsaved-badge">미저장</span>}
          </div>
        </div>

        {testSubTab === "editor" && renderTestEditor()}
        {testSubTab === "pdf" && renderTestPdf()}

        {/* 버전 등록 */}
        <div className="ap-test-register">
          <h4>새 버전 등록</h4>
          <div className="ap-test-register-row">
            <label>버전 <input type="number" min={1} value={testVersion} onChange={(e) => setTestVersion(e.target.value)} /></label>
            <label>시험지
              <select value={testPaperId} onChange={(e) => setTestPaperId(e.target.value)}>
                <option value="">-- 시험지 선택 --</option>
                {testPapers.map((tp) => (
                  <option key={tp.testId || tp.test_id} value={tp.testId || tp.test_id}>
                    {tp.title} ({(tp.testId || tp.test_id || "").slice(0, 20)})
                  </option>
                ))}
              </select>
            </label>
            <button className="ts-btn ts-btn-primary ts-btn-sm" onClick={handleRegisterTest}>등록</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── 비주얼 에디터 ── */
  function renderTestEditor() {
    if (!selectedTestPaperId) return <p className="ap-muted">시험지를 선택하세요.</p>;
    if (testQuestionsLoading) return <p className="ap-muted">문항을 불러오는 중...</p>;

    if (testJsonMode) {
      return (
        <div className="ap-test-json-edit">
          <textarea className="ap-json-editor" value={testJsonText} onChange={(e) => setTestJsonText(e.target.value)} rows={24} spellCheck={false} />
          <div className="ap-actions-right">
            <button className="ts-btn ts-btn-primary" onClick={() => {
              try {
                const parsed = JSON.parse(testJsonText);
                const qs = Array.isArray(parsed) ? parsed : parsed.questions;
                if (!Array.isArray(qs)) { alert("questions 배열을 찾을 수 없습니다."); return; }
                setTestQuestions(qs); setTestQuestionsModified(true); setTestJsonMode(false);
              } catch { alert("JSON 파싱 실패"); }
            }}>JSON 적용</button>
            <button className="ts-btn ts-btn-outline" onClick={() => setTestJsonMode(false)}>취소</button>
          </div>
        </div>
      );
    }

    return (
      <>
        {testQuestions.length > 0 ? (
          <table className="ts-table ap-q-table">
            <thead>
              <tr><th>#</th><th>유형</th><th>역량</th><th>배점</th><th>정답</th><th>문제 미리보기</th><th></th></tr>
            </thead>
            <tbody>
              {testQuestions.map((q, idx) => (
                <tr key={idx} className={editingQIdx === idx ? "ap-q-editing" : ""}>
                  <td>{q.number}</td>
                  <td><span className={`ap-q-type-badge ${q.type === "서술형" ? "essay" : "mc"}`}>{q.type}</span></td>
                  <td className="ap-q-domain">{q.domain || "-"}</td>
                  <td>{q.points}</td>
                  <td className="ap-mono">{q.correctAnswer || q.correct_answer || (q.modelAnswer || q.model_answer ? "서술" : "-")}</td>
                  <td className="ap-q-stem-preview">{(q.stem || q.passage || "").slice(0, 40)}{(q.stem || q.passage || "").length > 40 ? "..." : ""}</td>
                  <td className="ap-q-actions">
                    <button className="ap-icon-btn" title="편집" onClick={() => startEditQuestion(idx)}><span className="material-symbols-outlined">edit</span></button>
                    <button className="ap-icon-btn ap-icon-btn-danger" title="삭제" onClick={() => deleteQuestion(idx)}><span className="material-symbols-outlined">delete</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="ap-muted">문항이 없습니다.</p>}

        {/* 문항 편집 패널 */}
        {editingQIdx !== null && editQ && renderQuestionEditPanel()}

        <div className="ap-test-bottom-actions">
          <div className="ap-test-bottom-left">
            <button className="ts-btn ts-btn-outline ts-btn-sm" onClick={addQuestion}><span className="material-symbols-outlined">add</span> 문항 추가</button>
            <button className="ts-btn ts-btn-outline ts-btn-sm" onClick={() => { setTestJsonText(JSON.stringify(testQuestions, null, 2)); setTestJsonMode(true); setEditingQIdx(null); setEditQ(null); }}>
              <span className="material-symbols-outlined">code</span> JSON 편집
            </button>
          </div>
          <div className="ap-test-bottom-right">
            <span className="ap-q-count">{testQuestions.length}문항 / {testQuestions.reduce((s, q) => s + (q.points || 0), 0)}점</span>
            <button className="ts-btn ts-btn-primary ts-btn-sm" onClick={handleSaveTestQuestions} disabled={testQuestionsSaving || !testQuestionsModified}>
              {testQuestionsSaving ? "저장 중..." : "문항 저장"}
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── 문항 편집 패널 (지문/문제/선택지/정답/해설 분리) ── */
  function renderQuestionEditPanel() {
    return (
      <div className="ap-q-edit-panel">
        <h4>문항 {editQ.number} 편집</h4>

        {/* 기본 정보 */}
        <div className="ap-q-section-label">기본 정보</div>
        <div className="ap-q-edit-grid">
          <label>유형
            <select value={editQ.type} onChange={(e) => setEditQ({ ...editQ, type: e.target.value })}>
              <option value="객관식">객관식</option>
              <option value="서술형">서술형</option>
            </select>
          </label>
          <label>역량
            <input value={editQ.domain || ""} onChange={(e) => setEditQ({ ...editQ, domain: e.target.value })} />
          </label>
          <label>배점
            <input type="number" min={1} value={editQ.points} onChange={(e) => setEditQ({ ...editQ, points: Number(e.target.value) })} />
          </label>
        </div>

        {/* 지문 */}
        <div className="ap-q-section-label">지문</div>
        <textarea className="ap-q-textarea" value={editQ.passage || ""} onChange={(e) => setEditQ({ ...editQ, passage: e.target.value || null })} rows={4} placeholder="독해 지문이 있는 경우 입력" />

        {/* 문제 */}
        <div className="ap-q-section-label">문제</div>
        <textarea className="ap-q-textarea" value={editQ.stem || ""} onChange={(e) => setEditQ({ ...editQ, stem: e.target.value })} rows={3} placeholder="문제 본문" />

        {editQ.type === "객관식" && (
          <>
            {/* 선택지 */}
            <div className="ap-q-section-label">선택지</div>
            <div className="ap-q-choices-grid">
              {(editQ.choices || []).map((ch, ci) => (
                <div key={ci} className="ap-q-choice-row">
                  <span className="ap-q-choice-num">{ch.id || ci + 1}</span>
                  <input value={ch.text} onChange={(e) => {
                    const next = [...(editQ.choices || [])]; next[ci] = { ...next[ci], text: e.target.value };
                    setEditQ({ ...editQ, choices: next });
                  }} placeholder="선택지 텍스트" />
                </div>
              ))}
              <button className="ap-add-link" onClick={() => {
                const nextId = String((editQ.choices || []).length + 1);
                setEditQ({ ...editQ, choices: [...(editQ.choices || []), { id: nextId, text: "" }] });
              }}>+ 선택지 추가</button>
            </div>

            {/* 정답 */}
            <div className="ap-q-section-label">정답</div>
            <input className="ap-q-answer-input" value={editQ.correctAnswer || editQ.correct_answer || ""} onChange={(e) => setEditQ({ ...editQ, correctAnswer: e.target.value })} placeholder="예: 2" />

            {/* 해설 */}
            <div className="ap-q-section-label">선택지별 해설</div>
            <div className="ap-q-choices-grid">
              {(editQ.choices || []).map((ch, ci) => (
                <div key={ci} className="ap-q-choice-row">
                  <span className="ap-q-choice-num">{ch.id || ci + 1}</span>
                  <input value={(editQ.choiceExplanations || editQ.choice_explanations || {})[ch.id || String(ci + 1)] || ""} onChange={(e) => {
                    const key = ch.id || String(ci + 1);
                    const expl = { ...(editQ.choiceExplanations || editQ.choice_explanations || {}), [key]: e.target.value };
                    setEditQ({ ...editQ, choiceExplanations: expl });
                  }} placeholder="해설" />
                </div>
              ))}
            </div>
          </>
        )}

        {editQ.type === "서술형" && (
          <>
            <div className="ap-q-section-label">모범답안</div>
            <textarea className="ap-q-textarea" value={editQ.modelAnswer || editQ.model_answer || ""} onChange={(e) => setEditQ({ ...editQ, modelAnswer: e.target.value })} rows={3} />
            <div className="ap-q-section-label">채점 기준</div>
            <textarea className="ap-q-textarea" value={editQ.essayRubric || editQ.essay_rubric || ""} onChange={(e) => setEditQ({ ...editQ, essayRubric: e.target.value })} rows={2} />
          </>
        )}

        <div className="ap-q-edit-actions">
          <button className="ts-btn ts-btn-primary" onClick={applyEditQuestion}>적용</button>
          <button className="ts-btn ts-btn-outline" onClick={cancelEditQuestion}>취소</button>
        </div>
      </div>
    );
  }

  /* ── PDF 미리보기 ── */
  function renderTestPdf() {
    if (!selectedTestPaperId) return <p className="ap-muted">시험지를 선택하세요.</p>;
    const selectedTest = tests.find((t) => (t.testPaperId || t.test_paper_id) === selectedTestPaperId);
    const pdfFileId = selectedTest?.pdfFileId || selectedTest?.pdf_file_id;
    if (!pdfFileId) return <p className="ap-muted">이 시험지에 연결된 PDF가 없습니다.</p>;
    const pdfSrc = pdfFileId.startsWith("http") ? pdfFileId : `${API_BASE.replace(/\/$/, "")}/v1/files/${pdfFileId}/download`;
    return (
      <div className="ap-pdf-preview">
        <iframe src={pdfSrc} title="PDF 미리보기" />
      </div>
    );
  }
}

export default AdminProPage;
