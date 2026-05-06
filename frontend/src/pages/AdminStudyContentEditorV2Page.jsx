import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../hooks/useAuth";
import MarkdownEditField from "../components/editor/MarkdownEditField";
import StudyQuestionCard from "../components/study-editor/StudyQuestionCard";
import AiPdfImageUploadModal from "../components/study-editor/AiPdfImageUploadModal";
import AiStudyQuestionGenModal from "../components/study-editor/AiStudyQuestionGenModal";
import ClassificationPicker from "../components/editor/ClassificationPicker";
import { apiGet, apiGetCamel, apiPost, apiPostDeep, apiPatch, apiPatchDeep, apiPut, apiDelete } from "../utils/adminApi";
import "../styles/admin-detail.css";
import "../styles/study-editor.css";

const AREA_OPTIONS = [
  { value: "", label: "(미설정)" },
  { value: "LIT", label: "문학" },
  { value: "READ", label: "독서(비문학)" },
  { value: "GRAM", label: "문법" },
  { value: "SPEAK", label: "화법" },
  { value: "WRITE", label: "작문" },
  { value: "MEDIA", label: "매체" },
];

const SUB_AREA_BY_AREA = {
  LIT: ["현대시", "고전시가", "현대소설", "고전소설", "수필", "극·시나리오", "기타 문학"],
  READ: ["인문", "사회", "과학·기술", "예술", "주제 통합", "기타"],
  GRAM: ["음운", "단어", "문장", "의미", "담화", "국어사"],
  SPEAK: ["대화", "발표", "토론", "협상", "면접"],
  WRITE: ["설명문", "논설문", "보고서", "감상문", "건의문", "수필"],
  MEDIA: ["뉴스", "광고", "SNS", "영상", "복합 매체"],
};

/** 페이지당 최대 줄 수 — 초과 시 자동 분할 / 경고 / [새 페이지로 분할] 버튼 */
const MAX_LINES_PER_PAGE = 80;

/**
 * 마크다운을 줄 수 한도로 분할.
 * 한 페이지의 maxLines 를 초과하면 적절한 break point (빈 줄·헤딩 시작) 에서 자른다.
 * break point 가 없으면 maxLines 위치에서 강제 컷.
 *
 * @returns string[]  분할된 마크다운 청크 배열 (분할 안 되면 원본 1개 배열)
 */
function splitMarkdownByLines(markdown, maxLines = MAX_LINES_PER_PAGE) {
  const lines = (markdown || "").split("\n");
  if (lines.length <= maxLines) return [markdown || ""];
  const chunks = [];
  let cursor = 0;
  while (cursor < lines.length) {
    const remaining = lines.length - cursor;
    if (remaining <= maxLines) {
      chunks.push(lines.slice(cursor).join("\n").trim());
      break;
    }
    // 우선순위: 빈 줄 → 헤딩 시작 → 강제 컷
    let end = cursor + maxLines;
    let found = -1;
    // (1) 빈 줄 — 한도 내에서 마지막 빈 줄 (가능한 한 나중)
    for (let i = end; i > cursor + Math.floor(maxLines / 2); i--) {
      if ((lines[i] || "").trim() === "") {
        found = i;
        break;
      }
    }
    // (2) 빈 줄 없으면 헤딩 시작 (#) 찾기
    if (found < 0) {
      for (let i = end; i > cursor + Math.floor(maxLines / 2); i--) {
        if ((lines[i] || "").startsWith("#")) {
          found = i;
          break;
        }
      }
    }
    if (found < 0) found = end; // 강제 컷
    chunks.push(lines.slice(cursor, found).join("\n").trim());
    cursor = found;
    // 분할 지점의 빈 줄 건너뛰기
    while (cursor < lines.length && (lines[cursor] || "").trim() === "") cursor++;
  }
  return chunks.filter(c => c.length > 0);
}

const LEVEL_OPTIONS = [
  { value: "", label: "(미설정)" },
  { value: "saussure1", label: "소쉬르1 (초1)" }, { value: "saussure2", label: "소쉬르2 (초2)" },
  { value: "saussure3", label: "소쉬르3 (초3)" },
  { value: "frege1", label: "프레게1 (초4)" }, { value: "frege2", label: "프레게2 (초5)" },
  { value: "frege3", label: "프레게3 (초6)" },
  { value: "russell1", label: "러셀1 (중1)" }, { value: "russell2", label: "러셀2 (중2)" },
  { value: "russell3", label: "러셀3 (중3)" },
  { value: "wittgenstein1", label: "비트겐슈타인1 (고1)" }, { value: "wittgenstein2", label: "비트겐슈타인2 (고2)" },
  { value: "wittgenstein3", label: "비트겐슈타인3 (고3)" },
];

export default function AdminStudyContentEditorV2Page() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isHq = (user?.roles || []).includes("HQ_ADMIN");
  const isNew = contentId === "new" || !contentId;

  // ── 콘텐츠 메타 ──
  const [meta, setMeta] = useState({
    id: null,
    title: "",
    description: "",
    levelId: "",
    area: "",
    subArea: "",
    visibility: "ORG",
    ownerOrgId: null,
    creatorId: null,
    questionCount: 0,
  });
  const [orgs, setOrgs] = useState([]);

  // ── 페이지들 ──
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);

  // ── 모달 ──
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // ── UI 상태 ──
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // 콘텐츠 + 페이지 로드
  const loadAll = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      // 백엔드가 SNAKE_CASE 응답이라 nested 필드 (questionType, fillBlanks, isCorrect 등) 까지
      // camelCase 로 변환된 GET 사용. 일반 apiGet 으로 받으면 question.questionType 가 undefined
      // 가 되어 드롭다운이 "객관식"(첫 옵션)으로 잘못 폴백됨.
      const c = await apiGetCamel(`/v1/admin/study/contents/${contentId}`);
      setMeta({
        id: c.id, title: c.title, description: c.description || "",
        levelId: c.levelId || "", area: c.area || "", subArea: c.subArea || "",
        visibility: c.visibility, ownerOrgId: c.ownerOrgId, creatorId: c.creatorId,
        questionCount: c.questionCount || 0,
      });
      const list = await apiGetCamel(`/v1/admin/study/contents/${contentId}/pages`);
      setPages(Array.isArray(list) ? list : []);
      if (list?.length > 0) setActivePageId(list[0].id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contentId, isNew]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    apiGet("/v1/admin/orgs").then(d => setOrgs(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const activePage = pages.find(p => p.id === activePageId) || null;

  // 콘텐츠 신규 생성
  const createContent = async () => {
    if (!meta.title.trim()) { setError("제목을 입력하세요"); return; }
    setSaving(true); setError("");
    try {
      const created = await apiPost("/v1/admin/study/contents", {
        title: meta.title, description: meta.description || null,
        levelId: meta.levelId || null, area: meta.area || null, subArea: meta.subArea || null,
        markdown: "(첫 페이지)",
        visibility: meta.visibility, ownerOrgId: meta.ownerOrgId,
        evalPoints: [], errorPatterns: [],
      });
      navigate(`/admin/study-content-v2/editor/${created.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 콘텐츠 메타 저장
  const saveMeta = async () => {
    if (isNew) { await createContent(); return; }
    setSaving(true); setError("");
    try {
      await apiPut(`/v1/admin/study/contents/${contentId}`, {
        title: meta.title, description: meta.description,
        levelId: meta.levelId || null, area: meta.area || null, subArea: meta.subArea || null,
        visibility: meta.visibility,
      });
      setInfo("메타 정보 저장됨");
      setTimeout(() => setInfo(""), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * 통합 저장 — 메타 + 모든 페이지(본문/체크포인트/문제) 를 한 번에 일괄 저장.
   * 페이지 단위 dirty 추적 없이 모두 저장 (안전성 우선).
   */
  const saveAll = async () => {
    if (isNew) { await createContent(); return; }
    setSaving(true); setError("");
    let successCount = 0;
    let failedCount = 0;
    try {
      // 1) 메타
      await apiPut(`/v1/admin/study/contents/${contentId}`, {
        title: meta.title, description: meta.description,
        levelId: meta.levelId || null, area: meta.area || null, subArea: meta.subArea || null,
        visibility: meta.visibility,
      });
      successCount++;
      // 2) 페이지마다 본문/체크포인트 + 문제 일괄 (nested 객체는 deep snake 변환)
      for (const p of pages) {
        try {
          // 본문/제목/체크포인트 (checkpoints 안의 객체도 nested → deep snake)
          const updated = await apiPatchDeep(
            `/v1/admin/study/contents/${contentId}/pages/${p.id}`,
            { title: p.title, markdown: p.markdown, checkpoints: p.checkpoints || [] }
          );
          // 문제 (questions 배열 안의 객체·중첩 choices·fillBlanks 등 모두 deep snake 필수)
          const questionsResult = await apiPostDeep(
            `/v1/admin/study/contents/${contentId}/pages/${p.id}/questions:bulk`,
            { questions: p.questions || [] }
          );
          // 메모리 갱신: 서버 응답으로 동기화 (questions 재정렬·id 부여 반영)
          setPages((prev) =>
            prev.map((x) =>
              x.id === p.id
                ? { ...updated, questions: questionsResult.questions || [] }
                : x
            )
          );
          successCount++;
        } catch (perr) {
          failedCount++;
          console.error(`page ${p.pageNo} 저장 실패:`, perr);
        }
      }
      if (failedCount > 0) {
        setError(`일부 저장 실패 — 성공 ${successCount} / 실패 ${failedCount}`);
      } else {
        setInfo(`💾 저장 완료 — 메타 + ${pages.length}페이지 (본문·문제 모두 반영)`);
        setTimeout(() => setInfo(""), 2500);
      }
    } catch (err) {
      setError("저장 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 페이지 추가
  const addPage = async () => {
    if (isNew) { setError("먼저 콘텐츠를 저장하세요"); return; }
    try {
      const newPage = await apiPost(`/v1/admin/study/contents/${contentId}/pages`, {
        markdown: "",
      });
      setPages([...pages, newPage]);
      setActivePageId(newPage.id);
    } catch (err) {
      setError(err.message);
    }
  };

  // 페이지 삭제
  const deletePage = async (pageId) => {
    if (!confirm("이 페이지와 페이지 내 모든 문제를 삭제합니다. 계속하시겠습니까?")) return;
    try {
      await apiDelete(`/v1/admin/study/contents/${contentId}/pages/${pageId}`);
      const remaining = pages.filter(p => p.id !== pageId);
      setPages(remaining);
      if (activePageId === pageId) {
        setActivePageId(remaining[0]?.id || null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // 페이지 마크다운 / 제목 / 출제 포인트 갱신
  const updateActivePage = (patch) => {
    if (!activePage) return;
    setPages(pages.map(p => p.id === activePage.id ? { ...p, ...patch } : p));
  };

  // 페이지 본문 저장 (debounce 없이 명시 저장)
  const savePageBody = async () => {
    if (!activePage) return;
    setSaving(true); setError("");
    try {
      const updated = await apiPatch(`/v1/admin/study/contents/${contentId}/pages/${activePage.id}`, {
        title: activePage.title, markdown: activePage.markdown,
        checkpoints: activePage.checkpoints || [],
      });
      setPages(pages.map(p => p.id === updated.id ? updated : p));
      setInfo("페이지 본문 저장됨");
      setTimeout(() => setInfo(""), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 페이지 문제 일괄 저장
  const savePageQuestions = async () => {
    if (!activePage) return;
    setSaving(true); setError("");
    try {
      const updated = await apiPost(
        `/v1/admin/study/contents/${contentId}/pages/${activePage.id}/questions:bulk`,
        { questions: activePage.questions || [] }
      );
      setPages(pages.map(p => p.id === updated.id ? updated : p));
      setInfo(`${(updated.questions || []).length}문제 저장됨`);
      setTimeout(() => setInfo(""), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 문제 추가/수정/삭제
  const addQuestion = (type = "MULTI_CHOICE") => {
    if (!activePage) return;
    const questions = activePage.questions || [];
    if (questions.length >= 30) {
      alert("페이지당 최대 30문제입니다");
      return;
    }
    const empty = {
      questionNo: questions.length + 1,
      questionType: type,
      stem: "",
      choices: type === "MULTI_CHOICE" ? Array.from({ length: 5 }, (_, i) => ({
        id: `c${i + 1}`, text: "", isCorrect: false, wrongVector: {},
      })) : type === "OX" ? [
        { id: "o", text: "O", isCorrect: false, wrongVector: {} },
        { id: "x", text: "X", isCorrect: false, wrongVector: {} },
      ] : null,
      modelAnswer: type === "SHORT_ANSWER" || type === "ESSAY" ? "" : null,
      fillBlanks: type === "ESSAY" ? [] : null,
      evalPointIdx: [],
      difficulty: 3,
      competencyVector: {},
      wrongVector: {},
    };
    updateActivePage({ questions: [...questions, empty] });
  };

  const updateQuestion = (i, q) => {
    const questions = [...(activePage.questions || [])];
    questions[i] = q;
    updateActivePage({ questions });
  };

  const deleteQuestion = (i) => {
    const questions = [...(activePage.questions || [])];
    questions.splice(i, 1);
    questions.forEach((q, idx) => { q.questionNo = idx + 1; });
    updateActivePage({ questions });
  };

  // PDF/이미지 변환 결과 → 페이지별로 비주얼 에디터에 추가
  // PDF: pages 배열에 N개 → 각 페이지가 또 80줄 넘으면 추가 분할
  // 이미지: 1페이지 → 80줄 넘으면 분할
  const onConvertedFromFile = async (data) => {
    const rawPages = data.pages || (data.markdown ? [{ pageNo: 1, markdown: data.markdown }] : []);
    if (rawPages.length === 0) {
      setError("변환 결과가 비어 있습니다");
      return;
    }
    // 각 PDF 페이지를 80줄 한도로 추가 분할
    const allChunks = [];
    for (const p of rawPages) {
      const chunks = splitMarkdownByLines(p.markdown || "", MAX_LINES_PER_PAGE);
      for (const c of chunks) allChunks.push(c);
    }
    if (allChunks.length === 0) {
      setError("변환 결과가 비어 있습니다");
      return;
    }
    try {
      // 1번째 청크: 활성 페이지에 채워서 저장
      let target = activePage;
      if (!target) {
        target = await apiPost(`/v1/admin/study/contents/${contentId}/pages`, {
          markdown: allChunks[0],
        });
        setPages((prev) => [...prev, target]);
        setActivePageId(target.id);
      } else {
        const updated = await apiPatch(
          `/v1/admin/study/contents/${contentId}/pages/${target.id}`,
          { markdown: allChunks[0] }
        );
        setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }

      // 2번째부터는 새 페이지로 추가
      for (let i = 1; i < allChunks.length; i++) {
        const newPage = await apiPost(`/v1/admin/study/contents/${contentId}/pages`, {
          markdown: allChunks[i],
        });
        setPages((prev) => [...prev, newPage]);
      }
      const splitInfo = allChunks.length > rawPages.length
        ? ` (원본 ${rawPages.length}페이지 → ${allChunks.length}페이지로 자동 분할, 페이지당 ${MAX_LINES_PER_PAGE}줄 한도)`
        : "";
      setInfo(`변환 완료 — ${allChunks.length}페이지${splitInfo} · ${(data.sourceSizeBytes / 1024).toFixed(1)} KB`);
      setTimeout(() => setInfo(""), 5000);
    } catch (err) {
      setError("페이지 저장 실패: " + err.message);
    }
  };

  // 활성 페이지를 줄 수 기준으로 자동 분할 (적절한 break point 에서)
  const splitPageByLines = async () => {
    if (!activePage) return;
    const chunks = splitMarkdownByLines(activePage.markdown || "", MAX_LINES_PER_PAGE);
    if (chunks.length <= 1) return;
    setSaving(true); setError("");
    try {
      // 현재 페이지: 첫 청크
      const updated = await apiPatch(
        `/v1/admin/study/contents/${contentId}/pages/${activePage.id}`,
        { markdown: chunks[0] }
      );
      setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      // 나머지 청크: 새 페이지들
      const newPages = [];
      for (let i = 1; i < chunks.length; i++) {
        const np = await apiPost(
          `/v1/admin/study/contents/${contentId}/pages`,
          { markdown: chunks[i] }
        );
        newPages.push(np);
      }
      setPages((prev) => [...prev, ...newPages]);
      if (newPages.length > 0) setActivePageId(newPages[0].id);
      setInfo(`${chunks.length}페이지로 자동 분할 (적절한 단락 경계에서 잘림)`);
      setTimeout(() => setInfo(""), 3000);
    } catch (err) {
      setError("분할 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // AI 문제 생성 결과 → 활성 페이지의 questions / checkpoints 에 추가
  const onAiGenerated = (data) => {
    const questions = (data.questions || []).map((q, i) => ({
      ...q,
      questionNo: i + 1,
    }));
    updateActivePage({
      questions,
      checkpoints: data.checkpoints || [],
    });
    setInfo(`${questions.length}문제 생성됨. 검수 후 [문제 저장] 클릭`);
    setTimeout(() => setInfo(""), 5000);
  };

  // 가시 옵션 (HQ_ADMIN: PUBLIC/ORG, ORG_ADMIN: ORG only)
  // (백엔드가 강제하므로 UI 단계에서는 둘 다 표시)
  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <div>
            <h1>{isNew ? "내용 숙지 콘텐츠 신규" : meta.title || "내용 숙지 편집"}</h1>
            <p className="admin-detail-subtitle">
              페이지별 본문 + 출제 포인트 + 4유형 문제 (페이지당 최대 30)
            </p>
          </div>
          <div className="admin-detail-header-actions">
            <button className="admin-detail-btn secondary" onClick={() => navigate("/admin/study-content")}>
              ← 목록
            </button>
            <button className="admin-detail-btn" onClick={saveAll} disabled={saving}>
              {saving ? "저장 중..." : "💾 저장"}
            </button>
          </div>
        </div>

        {error && <div className="admin-error">{error}</div>}
        {info && (
          <div style={{
            background: "var(--admin-accent-soft)",
            color: "var(--admin-accent-strong)",
            padding: "8px 14px", borderRadius: 8, fontSize: 13,
          }}>{info}</div>
        )}

        {/* 메타 카드 */}
        <div className="admin-detail-card">
          <h3>콘텐츠 메타</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            <FormField label="제목 *">
              <input
                value={meta.title}
                onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                className="study-input"
              />
            </FormField>
            <FormField label="레벨">
              <select
                value={meta.levelId}
                onChange={(e) => setMeta({ ...meta, levelId: e.target.value })}
                className="study-input"
              >
                {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="영역">
              <select
                value={meta.area}
                onChange={(e) => setMeta({ ...meta, area: e.target.value, subArea: "" })}
                className="study-input"
              >
                {AREA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="세부영역">
              <select
                value={meta.subArea}
                onChange={(e) => setMeta({ ...meta, subArea: e.target.value })}
                className="study-input"
                disabled={!meta.area}
              >
                <option value="">(선택)</option>
                {(SUB_AREA_BY_AREA[meta.area] || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="공개 범위">
              <select
                value={meta.visibility}
                onChange={(e) => setMeta({ ...meta, visibility: e.target.value })}
                className="study-input"
              >
                <option value="PUBLIC">전체 공개 (모든 유료 회원)</option>
                <option value="ORG">기관 한정 (소속 기관 학생만)</option>
              </select>
            </FormField>
            {meta.visibility === "ORG" && (
              <FormField label="소속 기관">
                {isHq ? (
                  <select
                    value={meta.ownerOrgId || ""}
                    onChange={(e) => setMeta({ ...meta, ownerOrgId: e.target.value || null })}
                    className="study-input"
                  >
                    <option value="">(자동 — 본인 소속)</option>
                    {orgs.map(o => <option key={o.orgId || o.id} value={o.orgId || o.id}>{o.name}</option>)}
                  </select>
                ) : (
                  // ORG_ADMIN — 자기 기관 자동 고정 (드롭다운 X)
                  <input
                    type="text"
                    value={(orgs[0]?.name) || "(본인 소속 기관)"}
                    disabled
                    className="study-input"
                  />
                )}
              </FormField>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <FormField label="설명 (선택)" style={{ flex: 1 }}>
              <textarea
                value={meta.description}
                onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                rows={2}
                className="study-input"
                style={{ width: "100%", resize: "vertical" }}
              />
            </FormField>
          </div>
        </div>

        {/* 분류 (영역·세부영역·주제) — 저장된 콘텐츠만 */}
        {!isNew && (
          <div className="admin-detail-card" style={{ marginTop: 12 }}>
            <ClassificationPicker targetType="content" targetId={contentId} compact />
          </div>
        )}

        {/* 페이지 에디터: 좌 사이드바 + 우 본문 */}
        {!isNew && (
          <div className="study-editor-grid">
            {/* 좌측 페이지 트리 */}
            <aside className="study-page-sidebar">
              <div className="study-page-sidebar-header">
                <strong>페이지 ({pages.length})</strong>
                <button className="admin-detail-btn xs" onClick={addPage}>+ 페이지</button>
              </div>
              <div className="study-page-list">
                {pages.length === 0 && (
                  <p style={{ color: "var(--admin-muted)", fontSize: 12, padding: 12 }}>
                    페이지가 없습니다. + 페이지 클릭
                  </p>
                )}
                {pages.map((p) => (
                  <button
                    key={p.id}
                    className={`study-page-item ${activePageId === p.id ? "active" : ""}`}
                    onClick={() => setActivePageId(p.id)}
                  >
                    <div className="study-page-item-no">P{p.pageNo}</div>
                    <div className="study-page-item-body">
                      <div className="study-page-item-title">
                        {p.title || `페이지 ${p.pageNo}`}
                      </div>
                      <div className="study-page-item-meta">
                        {(p.questions || []).length}문제 / {(p.checkpoints || []).length} 포인트
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {/* 우측 본문 */}
            <main className="study-page-main">
              {!activePage ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--admin-muted)" }}>
                  좌측에서 페이지를 선택하거나 + 페이지를 추가하세요
                </div>
              ) : (
                <>
                  {/* 페이지 헤더 */}
                  <div className="study-page-header">
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 16, color: "var(--admin-accent-strong)" }}>
                        페이지 {activePage.pageNo}
                      </strong>
                      <input
                        value={activePage.title || ""}
                        onChange={(e) => updateActivePage({ title: e.target.value })}
                        placeholder="페이지 제목 (선택)"
                        className="study-input"
                        style={{ flex: 1, minWidth: 180 }}
                      />
                      <button className="admin-detail-btn danger xs" onClick={() => deletePage(activePage.id)}>
                        페이지 삭제
                      </button>
                    </div>
                  </div>

                  {/* 본문 마크다운 */}
                  {(() => {
                    const lineCount = (activePage.markdown || "").split("\n").length;
                    const overLimit = lineCount > MAX_LINES_PER_PAGE;
                    return (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                          <strong style={{ fontSize: 13, color: "var(--admin-accent-strong)" }}>📖 본문 (마크다운)</strong>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: overLimit ? "#c0392b" : "var(--admin-muted)",
                            }}>
                              줄 수 {lineCount} / {MAX_LINES_PER_PAGE}
                              {overLimit ? " ⚠️ 한도 초과" : ""}
                            </span>
                            {overLimit && (
                              <button
                                className="admin-detail-btn xs"
                                onClick={splitPageByLines}
                                disabled={saving}
                                title={`${MAX_LINES_PER_PAGE}줄까지 현재 페이지에 두고 나머지를 새 페이지로 분리`}
                              >
                                ✂ 새 페이지로 분할
                              </button>
                            )}
                            <button className="admin-detail-btn secondary xs" onClick={() => setShowPdfModal(true)}>
                              📄 PDF/이미지 → 마크다운 (AI)
                            </button>
                          </div>
                        </div>
                        <MarkdownEditField
                          value={activePage.markdown || ""}
                          onChange={(v) => updateActivePage({ markdown: v })}
                          placeholder={`본문을 직접 입력하거나 PDF/이미지를 업로드해서 변환 (최대 ${MAX_LINES_PER_PAGE}줄, 초과 시 새 페이지로 분할)`}
                          minHeight={240}
                        />
                      </div>
                    );
                  })()}

                  {/* 출제 포인트 */}
                  {activePage.checkpoints && activePage.checkpoints.length > 0 && (
                    <div className="study-checkpoints-box">
                      <strong style={{ fontSize: 13, color: "var(--admin-accent-strong)" }}>
                        📌 출제 포인트 ({activePage.checkpoints.length})
                      </strong>
                      <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12 }}>
                        {activePage.checkpoints.map((cp) => (
                          <li key={cp.id}>
                            <strong style={{ color: "var(--admin-accent-strong)" }}>[{cp.kind}]</strong> {cp.text}
                            {cp.evidence && (
                              <span style={{ color: "var(--admin-muted)", marginLeft: 6 }}>— {cp.evidence}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 문제 영역 */}
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <strong style={{ fontSize: 14, color: "var(--admin-accent-strong)" }}>
                        ❓ 문제 ({(activePage.questions || []).length}/30)
                      </strong>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className="admin-detail-btn secondary xs" onClick={() => addQuestion("MULTI_CHOICE")}>+ 객관식</button>
                        <button className="admin-detail-btn secondary xs" onClick={() => addQuestion("OX")}>+ OX</button>
                        <button className="admin-detail-btn secondary xs" onClick={() => addQuestion("SHORT_ANSWER")}>+ 단답</button>
                        <button className="admin-detail-btn secondary xs" onClick={() => addQuestion("ESSAY")}>+ 서술</button>
                        <button className="admin-detail-btn xs" onClick={() => setShowAiModal(true)}>
                          🤖 AI 생성
                        </button>
                      </div>
                    </div>
                    {(activePage.questions || []).map((q, i) => (
                      <StudyQuestionCard
                        key={i}
                        question={q}
                        index={i}
                        onChange={(updated) => updateQuestion(i, updated)}
                        onDelete={() => deleteQuestion(i)}
                      />
                    ))}
                    {(activePage.questions || []).length === 0 && (
                      <p style={{ color: "var(--admin-muted)", fontSize: 13, padding: 20, textAlign: "center" }}>
                        문제가 없습니다. AI 생성 또는 직접 추가
                      </p>
                    )}
                  </div>
                </>
              )}
            </main>
          </div>
        )}
      </div>

      {showPdfModal && (
        <AiPdfImageUploadModal
          onClose={() => setShowPdfModal(false)}
          onConverted={onConvertedFromFile}
        />
      )}
      {showAiModal && activePage && (
        <AiStudyQuestionGenModal
          pageMarkdown={activePage.markdown}
          area={meta.area}
          subArea={meta.subArea}
          levelId={meta.levelId}
          existingCheckpoints={activePage.checkpoints || []}
          onClose={() => setShowAiModal(false)}
          onGenerated={onAiGenerated}
        />
      )}
    </AdminLayout>
  );
}

function FormField({ label, style, children }) {
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--admin-accent-strong)", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
