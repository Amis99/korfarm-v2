import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPut } from "../utils/adminApi";
import { API_BASE } from "../utils/api";
import AdminLayout from "../components/AdminLayout";
import { resolveModuleKeyForContentType } from "../constants/contentTypes";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import "../styles/admin-detail.css";
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

  /* 콘텐츠 추가 모달 */
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState("search"); // "search" | "create"
  const [searchKeyword, setSearchKeyword] = useState("");
  const [allContents, setAllContents] = useState([]);
  const [createCategory, setCreateCategory] = useState("");

  /* 정답해설 탭 — 단순 PDF 업로드로 단순화 (비주얼/JSON 에디터 폐기) */
  const [answerMode, setAnswerMode] = useState("upload");
  const [answerJson, setAnswerJson] = useState("");
  const [answerTitle, setAnswerTitle] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerSaving, setAnswerSaving] = useState(false);
  const [answerContentId, setAnswerContentId] = useState(null);
  const [answerPdfFileId, setAnswerPdfFileId] = useState(null);

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

  /* 검색·정렬·필터 */
  const [chapterSearch, setChapterSearch] = useState("");
  const [chapterSort, setChapterSort] = useState("number"); // number | titleAsc

  const filteredChapters = useMemo(() => {
    let arr = chapters.slice();
    if (chapterSearch.trim()) {
      const q = chapterSearch.trim().toLowerCase();
      arr = arr.filter((c) =>
        (c.title || "").toLowerCase().includes(q) ||
        String(c.chapterNumber ?? c.chapter_number ?? "").includes(q)
      );
    }
    if (chapterSort === "titleAsc") {
      arr.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ko"));
    } else {
      arr.sort((a, b) => (a.globalChapterNumber ?? a.global_chapter_number ?? 0) - (b.globalChapterNumber ?? b.global_chapter_number ?? 0));
    }
    return arr;
  }, [chapters, chapterSearch, chapterSort]);

  /* 챕터 목록 페이지네이션 — 필터·정렬 결과 기준 */
  const { page: chapterPage, setPage: setChapterPage, totalPages: chapterTotalPages, paged: pagedChapters } = usePagination(filteredChapters, 15);
  useEffect(() => { setChapterPage(1); }, [levelFilter, chapterSearch, chapterSort, setChapterPage]);

  /* 챕터 안 콘텐츠 목록 — 페이지네이션 */
  const contentItemsForPaging = useMemo(() => {
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
  }, [contentStatus]);
  const { page: contentPage, setPage: setContentPage, totalPages: contentTotalPages, paged: pagedContents } = usePagination(contentItemsForPaging, 15);
  useEffect(() => { setContentPage(1); }, [selectedChapter?.id, setContentPage]);

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
            .catch((e) => console.error(`content-status 조회 실패 (chapter=${ch.id}):`, e));
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
    setAnswerMode("visual");
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
    apiGet("/v1/admin/test-papers").then(setTestPapers).catch((e) => {
      console.error("시험 목록 조회 실패:", e);
      setTestPapers([]);
    });

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

  /* ═══ 정답해설 로드 — pdfFileId 우선 (단순화), 없으면 옛 JSON fallback ═══ */
  const loadAnswerData = async (ch) => {
    setAnswerLoading(true);
    setAnswerContentId(null);
    setAnswerPdfFileId(null);
    try {
      const ans = await apiGet(`/v1/admin/pro/chapters/${ch.id}/answer-content`);
      const pdf = ans?.pdfFileId || ans?.pdf_file_id || null;
      setAnswerPdfFileId(pdf);
      if (ans?.contentId || ans?.content_id) {
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
    } catch (e) {
      console.error("정답해설 로드 실패", e);
      setAnswerJson(ANSWER_TEMPLATE);
      setAnswerTitle(`모범답안 — ${ch.title}`);
    }
    setAnswerLoading(false);
  };

  /* ═══ 정답·해설 PDF 업로드 (단순화) ═══ */
  const handleAnswerPdfUpload = async (file) => {
    if (!selectedChapter || !file) return;
    setAnswerSaving(true);
    try {
      // presign → upload → fileId 백엔드 등록
      const presign = await apiPost("/v1/files/presign", {
        purpose: "pro_answer_pdf",
        filename: file.name,
        mime: file.type || "application/pdf",
        size: file.size,
      });
      const fileId = presign?.fileId;
      if (!fileId) throw new Error("presign 응답에 fileId 가 없습니다");
      const { apiUploadFile } = await import("../utils/api");
      await apiUploadFile(fileId, file);
      await apiPut(`/v1/admin/pro/chapters/${selectedChapter.id}/answer-pdf`, { fileId });
      setAnswerPdfFileId(fileId);
    } catch (e) {
      console.error("정답·해설 PDF 업로드 실패", e);
      alert("PDF 업로드 실패: " + (e?.message || ""));
    } finally {
      setAnswerSaving(false);
    }
  };

  const handleAnswerPdfRemove = async () => {
    if (!selectedChapter) return;
    if (!window.confirm("정답·해설 PDF 를 제거할까요?")) return;
    setAnswerSaving(true);
    try {
      await apiPut(`/v1/admin/pro/chapters/${selectedChapter.id}/answer-pdf`, { fileId: null });
      setAnswerPdfFileId(null);
    } catch (e) {
      console.error("정답·해설 PDF 제거 실패", e);
      alert("제거 실패: " + (e?.message || ""));
    } finally {
      setAnswerSaving(false);
    }
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
      const ctForModule = [
        ...(Array.isArray(ct) ? ct : [ct]),
        rawContent.contentType || rawContent.content_type,
      ].filter(Boolean);
      const moduleKey = resolveModuleKeyForContentType(ctForModule, preview.moduleKey || preview.module_key);
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

  const addQuestion = (atIdx) => {
    const insertAt = atIdx ?? testQuestions.length;
    const nextNum = insertAt + 1;
    const newQ = {
      number: nextNum, type: "객관식", domain: "", points: 3, stem: "", passage: null,
      correctAnswer: "",
      choices: [{ id: "1", text: "" }, { id: "2", text: "" }, { id: "3", text: "" }, { id: "4", text: "" }],
      choiceExplanations: {},
    };
    const next = [...testQuestions];
    next.splice(insertAt, 0, newQ);
    // 번호 재정렬
    setTestQuestions(next.map((q, i) => ({ ...q, number: i + 1 })));
    setTestQuestionsModified(true);
  };
  const moveQuestion = (from, to) => {
    if (to < 0 || to >= testQuestions.length) return;
    const next = [...testQuestions];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setTestQuestions(next.map((q, i) => ({ ...q, number: i + 1 })));
    setTestQuestionsModified(true);
  };
  const updateQuestion = (idx, patch) => {
    const next = [...testQuestions];
    next[idx] = { ...next[idx], ...patch };
    setTestQuestions(next);
    setTestQuestionsModified(true);
  };
  const updateQuestionChoice = (qIdx, cIdx, patch) => {
    const next = [...testQuestions];
    const choices = [...(next[qIdx].choices || [])];
    choices[cIdx] = { ...choices[cIdx], ...patch };
    next[qIdx] = { ...next[qIdx], choices };
    setTestQuestions(next);
    setTestQuestionsModified(true);
  };
  const addQuestionChoice = (qIdx) => {
    const next = [...testQuestions];
    const choices = [...(next[qIdx].choices || [])];
    const newId = String(choices.length + 1);
    choices.push({ id: newId, text: "" });
    next[qIdx] = { ...next[qIdx], choices };
    setTestQuestions(next);
    setTestQuestionsModified(true);
  };
  const removeQuestionChoice = (qIdx, cIdx) => {
    const next = [...testQuestions];
    const choices = [...(next[qIdx].choices || [])];
    if (choices.length <= 2) return alert("최소 2개의 선택지가 필요합니다.");
    choices.splice(cIdx, 1);
    next[qIdx] = { ...next[qIdx], choices };
    setTestQuestions(next);
    setTestQuestionsModified(true);
  };
  const updateChoiceExplanation = (qIdx, choiceId, value) => {
    const next = [...testQuestions];
    const ce = { ...(next[qIdx].choiceExplanations || next[qIdx].choice_explanations || {}) };
    ce[choiceId] = value;
    next[qIdx] = { ...next[qIdx], choiceExplanations: ce };
    setTestQuestions(next);
    setTestQuestionsModified(true);
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

  /* 챕터 items 재설정 — 추가/삭제/이동 모두 이 함수로 */
  const applyChapterItems = async (newItems) => {
    if (!selectedChapter) return;
    try {
      await apiPost(`/v1/admin/pro/chapters/${selectedChapter.id}/items`, {
        items: newItems.map((it, i) => ({
          type: it.typeKey,
          contentId: it.id,
          order: i,
          label: it.title || null,
        })),
      });
      const st = await apiGet(`/v1/admin/pro/chapters/${selectedChapter.id}/content-status`);
      setContentStatus(st);
      setStatusCache((prev) => ({ ...prev, [selectedChapter.id]: st }));
    } catch (err) {
      alert(err.message || "변경 실패");
    }
  };
  const moveContentItem = async (from, to) => {
    const items = getContentItems();
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    await applyChapterItems(next);
  };
  const removeContentItem = async (idx) => {
    const items = getContentItems();
    const c = items[idx];
    if (!window.confirm(`이 학습("${c.title}")을 챕터에서 제거? (콘텐츠 자체는 보존됩니다)`)) return;
    const next = items.filter((_, i) => i !== idx);
    await applyChapterItems(next);
  };
  const addContentToChapter = async (contentId, contentType, title) => {
    const items = getContentItems();
    if (items.find((it) => it.id === contentId)) {
      alert("이미 챕터에 추가되어 있는 콘텐츠입니다.");
      return;
    }
    // contentType → typeKey 추론 (reading/vocab/background/logic/answer)
    const ct = String(contentType || "").toUpperCase();
    let typeKey = "reading";
    if (ct.includes("VOCAB")) typeKey = "vocab";
    else if (ct.includes("BACKGROUND")) typeKey = "background";
    else if (ct.includes("LOGIC")) typeKey = "logic";
    else if (ct.includes("ANSWER")) typeKey = "answer";
    const next = [...items, { id: contentId, title, typeKey, contentType }];
    await applyChapterItems(next);
    setAddModalOpen(false);
  };

  /* 학습 검색 (모달용) — 클라이언트 필터 */
  const openAddModal = async () => {
    setAddModalOpen(true);
    setAddModalTab("search");
    setSearchKeyword("");
    setCreateCategory("");
    if (allContents.length === 0) {
      try {
        const list = await apiGet("/v1/admin/content");
        setAllContents(Array.isArray(list) ? list : []);
      } catch {
        setAllContents([]);
      }
    }
  };

  const tests = contentStatus?.testVersions || contentStatus?.test_versions || [];

  /* ═══════════════════════════════════════════════════════
     ══════════════ 상세 뷰 ══════════════
     ═══════════════════════════════════════════════════════ */
  if (selectedChapter) {
    return (
      <AdminLayout>
        <div className="admin-detail-wrap">
          {/* 상세 헤더 */}
          <div className="admin-detail-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="admin-detail-btn secondary" onClick={backToList} style={{ fontSize: 13, padding: "6px 12px" }}>
                ← 목록으로
              </button>
              <h1>{selectedChapter.title}</h1>
              <span style={{ color: "var(--admin-muted)", fontSize: 13 }}>{selectedChapter.levelId || selectedChapter.level_id}</span>
            </div>
          </div>

          {/* 영상 URL 안내 */}
          <div style={{
            padding: "10px 14px", marginBottom: 12,
            background: "var(--admin-panel-light, #f5f9f3)",
            border: "1px solid rgba(31,58,44,0.12)", borderRadius: 8,
            fontSize: 13, color: "var(--admin-ink)",
          }}>
            ⓘ 영상 URL은 학습 단위로 관리합니다 — 콘텐츠 관리 → 해당 학습 → 메타데이터 패널의 비디오 URL
          </div>

          {/* 3탭 — admin-detail-card 위에 탭 버튼들 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[
              { key: "content", label: "콘텐츠" },
              { key: "answer", label: "정답과 해설" },
              { key: "test", label: "테스트 관리" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={`admin-filter ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >{t.label}</button>
            ))}
          </div>

          <div className="admin-detail-card admin-single-card edit-mode">
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
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>프로 모드 관리</h1>
        </div>

        <div className="admin-detail-toolbar admin-content-toolbar">
          <div className="admin-detail-search">
            <span className="material-symbols-outlined">search</span>
            <input
              placeholder="챕터 제목·번호 검색"
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
            />
          </div>
          <div className="admin-detail-filters">
            <select
              className="admin-type-filter-select"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              {COURSE_LEVELS.map((lv) => (
                <option key={lv.id} value={lv.id}>{lv.name}</option>
              ))}
            </select>
            <select
              className="admin-type-filter-select"
              value={chapterSort}
              onChange={(e) => setChapterSort(e.target.value)}
            >
              <option value="number">정렬: 챕터 번호</option>
              <option value="titleAsc">정렬: 제목 가나다</option>
            </select>
            {(chapterSearch || chapterSort !== "number") && (
              <button
                type="button"
                className="admin-filter"
                onClick={() => { setChapterSearch(""); setChapterSort("number"); }}
                style={{ borderStyle: "dashed" }}
              >초기화</button>
            )}
          </div>
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
          <div className="admin-detail-card admin-single-card edit-mode">
            <table className="admin-detail-table ap-chapter-table">
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
                {pagedChapters.map((ch) => {
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
            <Pagination page={chapterPage} totalPages={chapterTotalPages} onChange={setChapterPage} />
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

    return (
      <div className="ap-content-tab">
        <div className="ap-content-toolbar">
          <button className="ts-btn ts-btn-primary ts-btn-sm" onClick={openAddModal}>
            + 학습 추가
          </button>
          <span className="ap-muted" style={{ marginLeft: 12, fontSize: 12 }}>
            카드 클릭 → 비주얼 에디터로 이동 · 액션 버튼은 정지(클릭 통과 안 함)
          </span>
        </div>

        {items.length === 0 ? (
          <p className="ap-muted" style={{ padding: 20 }}>아직 학습이 없습니다. [+ 학습 추가] 로 시작하세요.</p>
        ) : (
          <>
            <table className="admin-detail-table ap-content-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>유형</th>
                  <th>최종수정일</th>
                  <th style={{ width: 200 }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {pagedContents.map((c) => {
                  const i = items.findIndex((it) => it.id === c.id);
                  return (
                    <tr key={c.id} className="ts-clickable-row"
                      onClick={() => navigate(`/admin/content/edit?id=${c.id}&from=/admin/pro`)}>
                      <td className="ap-ct-title">{c.title || "(제목 없음)"}</td>
                      <td><span className={`ap-ct-type ap-ct-type-${c.typeKey}`}>{c.type}</span></td>
                      <td className="ap-ct-date">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("ko") : "-"}</td>
                      <td className="ap-ct-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="ap-icon-btn" title="미리보기" disabled={previewLoadingId === c.id}
                          onClick={() => handleContentPreview(c.id)}>
                          {previewLoadingId === c.id ? "..." : <span className="material-symbols-outlined">visibility</span>}
                        </button>
                        <button className="ap-icon-btn" title="위로" disabled={i <= 0}
                          onClick={() => moveContentItem(i, i - 1)}>▲</button>
                        <button className="ap-icon-btn" title="아래로" disabled={i < 0 || i >= items.length - 1}
                          onClick={() => moveContentItem(i, i + 1)}>▼</button>
                        <button className="ap-icon-btn" title="챕터에서 제거"
                          onClick={() => removeContentItem(i)}>
                          <span className="material-symbols-outlined">link_off</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={contentPage} totalPages={contentTotalPages} onChange={setContentPage} />
          </>
        )}

        {addModalOpen && renderAddModal()}
      </div>
    );
  }

  function renderAddModal() {
    const items = getContentItems();
    const usedIds = new Set(items.map((it) => it.id));
    const filtered = (allContents || []).filter((c) => {
      if (usedIds.has(c.contentId || c.id)) return false;
      const kw = searchKeyword.trim().toLowerCase();
      if (!kw) return true;
      const title = (c.title || "").toLowerCase();
      const ct = String(Array.isArray(c.contentType) ? c.contentType.join(" ") : c.contentType || "").toLowerCase();
      return title.includes(kw) || ct.includes(kw);
    }).slice(0, 50);

    const CATEGORIES = [
      { value: "PRO_READING", label: "프로 독해" },
      { value: "PRO_VOCAB", label: "프로 어휘" },
      { value: "PRO_BACKGROUND", label: "프로 배경지식" },
      { value: "PRO_LOGIC", label: "프로 논리사고력" },
      { value: "READING", label: "농장 - 독해" },
      { value: "VOCAB", label: "농장 - 어휘" },
      { value: "BACKGROUND", label: "농장 - 배경지식" },
      { value: "LOGIC", label: "농장 - 논리사고력" },
    ];

    return (
      <div className="ap-modal-overlay" onClick={() => setAddModalOpen(false)}>
        <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
          <div className="ap-modal-header">
            <h3>학습 추가 — {selectedChapter.title}</h3>
            <button className="ap-icon-btn" onClick={() => setAddModalOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="ap-modal-tabs">
            <button className={`ap-modal-tab ${addModalTab === "search" ? "active" : ""}`}
              onClick={() => setAddModalTab("search")}>기존 학습 검색</button>
            <button className={`ap-modal-tab ${addModalTab === "create" ? "active" : ""}`}
              onClick={() => setAddModalTab("create")}>새 학습 작성</button>
          </div>
          <div className="ap-modal-body">
            {addModalTab === "search" && (
              <>
                <input type="text" placeholder="제목 또는 카테고리로 검색"
                  value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)}
                  className="ap-modal-search" autoFocus />
                <div className="ap-modal-results">
                  {filtered.length === 0 && (
                    <p className="ap-muted" style={{ padding: 12 }}>검색 결과 없음</p>
                  )}
                  {filtered.map((c) => {
                    const ct = Array.isArray(c.contentType) ? c.contentType.join(" / ") : (c.contentType || "");
                    return (
                      <div key={c.contentId || c.id} className="ap-modal-result-row"
                        onClick={() => addContentToChapter(c.contentId || c.id, ct, c.title || "")}>
                        <span className="ap-modal-result-title">{c.title || "(제목 없음)"}</span>
                        <span className="ap-modal-result-type">{ct}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {addModalTab === "create" && (
              <div className="ap-modal-create">
                <div className="dq-section-label">카테고리 선택</div>
                <select value={createCategory} onChange={(e) => setCreateCategory(e.target.value)}
                  className="ap-modal-create-select">
                  <option value="">(카테고리 선택)</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <p className="ap-muted" style={{ marginTop: 10, fontSize: 12 }}>
                  카테고리 선택 후 [콘텐츠 관리에서 작성하기] 버튼을 누르면 콘텐츠 관리 페이지로 이동합니다.
                  거기서 신규 콘텐츠를 작성한 뒤, 다시 이 챕터로 돌아와 [기존 학습 검색]으로 추가하세요.
                </p>
                <button className="ts-btn ts-btn-primary" disabled={!createCategory}
                  onClick={() => {
                    navigate(`/admin/content?from=/admin/pro&newType=${createCategory}`);
                    setAddModalOpen(false);
                  }}>
                  콘텐츠 관리에서 작성하기 →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════ 탭 2: 정답과 해설 ══════════════ */

  /* 비주얼 에디터 헬퍼 — answerJson ↔ 구조화 데이터 동기화 */
  const getAnswerData = () => {
    try { return JSON.parse(answerJson); } catch { return { sections: [] }; }
  };
  const setAnswerData = (data) => setAnswerJson(JSON.stringify(data, null, 2));

  const updateSection = (si, patch) => {
    const d = getAnswerData(); d.sections[si] = { ...d.sections[si], ...patch }; setAnswerData(d);
  };
  const addSection = () => {
    const d = getAnswerData();
    d.sections = [...(d.sections || []), { title: "새 섹션", groups: [{ groupTitle: "그룹", items: [] }] }];
    setAnswerData(d);
  };
  const removeSection = (si) => {
    if (!confirm("이 섹션을 삭제하시겠습니까?")) return;
    const d = getAnswerData(); d.sections.splice(si, 1); setAnswerData(d);
  };
  const updateGroup = (si, gi, patch) => {
    const d = getAnswerData(); d.sections[si].groups[gi] = { ...d.sections[si].groups[gi], ...patch }; setAnswerData(d);
  };
  const addGroup = (si) => {
    const d = getAnswerData();
    d.sections[si].groups = [...(d.sections[si].groups || []), { groupTitle: "새 그룹", items: [] }];
    setAnswerData(d);
  };
  const removeGroup = (si, gi) => {
    const d = getAnswerData(); d.sections[si].groups.splice(gi, 1); setAnswerData(d);
  };
  const updateItem = (si, gi, ii, patch) => {
    const d = getAnswerData(); d.sections[si].groups[gi].items[ii] = { ...d.sections[si].groups[gi].items[ii], ...patch }; setAnswerData(d);
  };
  const addItem = (si, gi) => {
    const d = getAnswerData();
    const items = d.sections[si].groups[gi].items || [];
    const nextNum = items.length > 0 ? String(Number(items[items.length - 1].number || 0) + 1) : "1";
    items.push({ number: nextNum, type: "객관식", points: 3, answer: "", explanation: "" });
    d.sections[si].groups[gi].items = items;
    setAnswerData(d);
  };
  const removeItem = (si, gi, ii) => {
    const d = getAnswerData(); d.sections[si].groups[gi].items.splice(ii, 1); setAnswerData(d);
  };

  function renderAnswerTab() {
    if (contentLoading) return <p className="ap-muted">불러오는 중...</p>;
    if (!contentStatus) return <p className="ap-muted">정답·해설 현황을 불러올 수 없습니다.</p>;
    // type='answer' 만 추출
    const answerItems = (contentStatus.items || [])
      .filter((it) => it.type === "answer")
      .flatMap((it) => (it.contents || []).map((c) => ({
        id: c.contentId || c.content_id,
        title: c.title,
        updatedAt: c.updatedAt || c.updated_at || "",
      })));

    return (
      <div className="ap-answer-section">
        <div className="ap-content-toolbar" style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <button className="admin-detail-btn primary" onClick={() => { setCreateCategory("answer"); openAddModal(); }}>
            + 정답·해설 추가
          </button>
          <span className="ap-muted" style={{ marginLeft: 12, fontSize: 12 }}>
            행 클릭 → 콘텐츠 에디터로 이동 (작업 후 자동 복귀)
          </span>
        </div>

        {answerItems.length === 0 ? (
          <p className="ap-muted" style={{ padding: 20 }}>이 챕터에 등록된 정답·해설이 없습니다.</p>
        ) : (
          <table className="admin-detail-table">
            <thead>
              <tr>
                <th>제목</th>
                <th style={{ width: 140 }}>최종수정일</th>
                <th style={{ width: 110 }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {answerItems.map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/admin/content/edit?id=${c.id}&from=/admin/pro`)}>
                  <td>{c.title}</td>
                  <td>{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "-"}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="admin-detail-btn secondary"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() => {
                        if (window.confirm(`"${c.title}" 정답·해설을 챕터에서 제거할까요?`)) {
                          const newItems = getContentItems().filter((it) => it.id !== c.id);
                          applyChapterItems(newItems);
                        }
                      }}>
                      🗑 제거
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  /* ══════════════ 탭 3: 테스트 관리 ══════════════ */
  function renderTestTab() {
    return (
      <div className="ap-test-section">
        <div className="ap-content-toolbar" style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <span className="ap-muted" style={{ fontSize: 12 }}>
            행 클릭 → 시험 관리 에디터로 이동 (작업 후 자동 복귀)
          </span>
        </div>

        {tests.length === 0 ? (
          <p className="ap-muted" style={{ padding: 20 }}>이 챕터에 등록된 테스트가 없습니다. 아래에서 새 버전을 등록하세요.</p>
        ) : (
          <table className="admin-detail-table" style={{ marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={{ width: 80 }}>버전</th>
                <th>시험명</th>
                <th style={{ width: 100 }}>상태</th>
                <th style={{ width: 100 }}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => {
                const tpId = t.testPaperId || t.test_paper_id;
                const meta = testPapers.find((tp) => (tp.testId || tp.test_id) === tpId);
                const pdfFileId = t.pdfFileId || t.pdf_file_id;
                return (
                  <tr key={t.version} style={{ cursor: "pointer" }}
                    onClick={() => tpId && navigate(`/admin/tests/${tpId}/edit?from=/admin/pro`)}>
                    <td>v{t.version}</td>
                    <td>{meta?.title || tpId || "(연결된 시험지 없음)"}</td>
                    <td>{t.status || "-"}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {pdfFileId ? (
                        <a
                          href={pdfFileId.startsWith("http") ? pdfFileId : `${API_BASE.replace(/\/$/, "")}/v1/files/${pdfFileId}/download`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ color: "var(--admin-accent-strong, #2d6a4f)", fontSize: 12 }}
                        >📄 보기</a>
                      ) : (
                        <span className="ap-muted" style={{ fontSize: 12 }}>없음</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 새 버전 등록 */}
        <div className="ap-test-register" style={{ padding: 12, background: "var(--admin-panel-light, #f5f9f3)", borderRadius: 8 }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 13 }}>새 버전 등록</h4>
          <div className="ap-test-register-row" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 13 }}>버전 <input type="number" min={1} value={testVersion} onChange={(e) => setTestVersion(e.target.value)} style={{ width: 70 }} /></label>
            <label style={{ fontSize: 13, flex: 1 }}>시험지
              <select className="admin-type-filter-select" value={testPaperId} onChange={(e) => setTestPaperId(e.target.value)} style={{ marginLeft: 8 }}>
                <option value="">-- 시험지 선택 --</option>
                {testPapers.map((tp) => (
                  <option key={tp.testId || tp.test_id} value={tp.testId || tp.test_id}>
                    {tp.title}
                  </option>
                ))}
              </select>
            </label>
            <button className="admin-detail-btn primary" onClick={handleRegisterTest}>등록</button>
          </div>
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
