import { useState, useCallback, useEffect, useRef } from "react";
import { apiGet, apiPut } from "../utils/adminApi";
import {
  immutableSet,
  immutableInsert,
  immutableRemove,
  immutableReorder,
} from "../utils/immutableSet";

const MAX_UNDO = 20;

function isDiagnosticPayload(testId, meta, payload) {
  return String(testId || "").startsWith("diag_paper_")
    || meta?.series === "diagnostic"
    || payload?.kind === "diagnostic"
    || Boolean(payload?.tier);
}

function stripPoints(question) {
  const { points, ...rest } = question || {};
  return rest;
}

function normalizeDiagnosticPayload(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const questions = Array.isArray(source.questions) ? source.questions : [];
  const passages = Array.isArray(source.passages) ? source.passages : [];

  const byPassage = new Map();
  questions.forEach((q, idx) => {
    const key = q?.passageId || "_none";
    if (!byPassage.has(key)) byPassage.set(key, []);
    byPassage.get(key).push({ q: q || {}, idx });
  });

  for (const items of byPassage.values()) {
    items.sort((a, b) => (a.q.number ?? a.idx + 1) - (b.q.number ?? b.idx + 1));
  }

  const order = [
    ...passages.map((p) => p.id),
    ...Array.from(byPassage.keys()).filter((k) => k !== "_none" && !passages.some((p) => p.id === k)),
    "_none",
  ];

  const normalizedByIndex = new Map();
  let number = 1;
  order.forEach((key) => {
    (byPassage.get(key) || []).forEach(({ q, idx }) => {
      normalizedByIndex.set(idx, { ...stripPoints(q), number: number++ });
    });
  });

  return {
    ...source,
    kind: source.kind || "diagnostic",
    questions: questions.map((q, idx) => normalizedByIndex.get(idx) || { ...stripPoints(q), number: number++ }),
    passages,
    metadata: source.metadata || {},
  };
}

/**
 * 시험지 비주얼 에디터 상태 관리 훅.
 * useContentEditor 와 동일한 인터페이스를 노출하여 DailyQuizDocEditor 등을 그대로 재사용 가능.
 *
 * - 로드: GET /v1/admin/test-papers/{testId}        (시험지 메타)
 *         GET /v1/admin/test-papers/{testId}/payload (비주얼 에디터 payload, 기존 questions 자동 변환 fallback)
 * - 저장: PUT /v1/admin/test-papers/{testId}/payload { payload: content }
 */
export function useTestEditor(testId) {
  const [meta, setMeta] = useState(null);
  const [originalMeta, setOriginalMeta] = useState(null);
  const [content, setContent] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const undoStack = useRef([]);
  const [undoLen, setUndoLen] = useState(0);

  /* 데이터 로드 */
  useEffect(() => {
    if (!testId) {
      setLoading(false);
      setError("시험지 ID가 없습니다.");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [t, p] = await Promise.all([
          apiGet(`/v1/admin/test-papers/${testId}`),
          apiGet(`/v1/admin/test-papers/${testId}/payload`),
        ]);
        if (cancelled) return;
        const metaObj = {
          contentType: ["TEST_PAPER"],
          title: t?.title ?? "",
          contentId: t?.testId ?? t?.test_id ?? testId,
          schemaVersion: "1.0",
          levelId: t?.levelId ?? t?.level_id ?? "",
          examDate: t?.examDate ?? t?.exam_date ?? "",
          timeLimitMinutes: t?.timeLimitMinutes ?? t?.time_limit_minutes ?? null,
          series: t?.series ?? "",
          description: t?.description ?? "",
          totalQuestions: t?.totalQuestions ?? t?.total_questions ?? 0,
          totalPoints: t?.totalPoints ?? t?.total_points ?? 0,
          orgId: t?.orgId ?? t?.org_id ?? null,
        };
        setMeta(metaObj);
        setOriginalMeta(JSON.parse(JSON.stringify(metaObj)));

        const loaded = p?.payload || {};
        // payload가 객체이고 questions 배열이 있으면 그대로, 아니면 빈 시험지로
        const payload = (loaded && typeof loaded === "object")
          ? {
              ...loaded,
              questions: Array.isArray(loaded.questions) ? loaded.questions : [],
              passages: Array.isArray(loaded.passages) ? loaded.passages : [],
              metadata: loaded.metadata || {},
            }
          : { questions: [], passages: [], metadata: {} };
        setContent(payload);
        setOriginal(JSON.parse(JSON.stringify(payload)));
        undoStack.current = [];
        setUndoLen(0);
      } catch (e) {
        if (!cancelled) setError(e.message || "로드 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [testId]);

  const contentDirty = content !== null && original !== null && JSON.stringify(content) !== JSON.stringify(original);
  const metaDirty = meta !== null && originalMeta !== null && JSON.stringify(meta) !== JSON.stringify(originalMeta);
  const dirty = contentDirty || metaDirty;

  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const pushUndo = useCallback(() => {
    undoStack.current = [
      JSON.parse(JSON.stringify(content)),
      ...undoStack.current,
    ].slice(0, MAX_UNDO);
    setUndoLen(undoStack.current.length);
  }, [content]);

  const updateField = useCallback((path, value) => {
    pushUndo();
    setContent((prev) => immutableSet(prev, path, value));
  }, [pushUndo]);

  const addItem = useCallback((path, index, newItem) => {
    pushUndo();
    setContent((prev) => immutableInsert(prev, path, index, newItem));
  }, [pushUndo]);

  const removeItem = useCallback((path, index) => {
    pushUndo();
    setContent((prev) => immutableRemove(prev, path, index));
  }, [pushUndo]);

  const reorderItems = useCallback((path, fromIndex, toIndex) => {
    pushUndo();
    setContent((prev) => immutableReorder(prev, path, fromIndex, toIndex));
  }, [pushUndo]);

  const setContentDirect = useCallback((newContent) => {
    pushUndo();
    setContent(newContent);
  }, [pushUndo]);

  const updateMeta = useCallback((field, value) => {
    setMeta((prev) => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const [prev, ...rest] = undoStack.current;
    undoStack.current = rest;
    setUndoLen(rest.length);
    setContent(prev);
  }, []);

  const save = useCallback(async () => {
    if (!testId || !content) return;
    setSaving(true);
    setSaveMsg("");
    setError("");
    try {
      const payloadToSave = isDiagnosticPayload(testId, meta, content)
        ? normalizeDiagnosticPayload(content)
        : content;
      await apiPut(`/v1/admin/test-papers/${testId}/payload`, { payload: payloadToSave });
      setContent(payloadToSave);
      setOriginal(JSON.parse(JSON.stringify(payloadToSave)));
      setOriginalMeta(meta ? JSON.parse(JSON.stringify(meta)) : null);
      undoStack.current = [];
      setUndoLen(0);
      setSaveMsg("저장 완료");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (e) {
      setError(e.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  }, [testId, content, meta]);

  const revert = useCallback(() => {
    if (!original) return;
    pushUndo();
    setContent(JSON.parse(JSON.stringify(original)));
    if (originalMeta) setMeta(JSON.parse(JSON.stringify(originalMeta)));
  }, [original, originalMeta, pushUndo]);

  return {
    meta,
    content,
    loading,
    saving,
    dirty,
    metaDirty,
    error,
    saveMsg,
    canUndo: undoLen > 0,
    isStatic: false,
    updateField,
    updateMeta,
    addItem,
    removeItem,
    reorderItems,
    save,
    undo,
    revert,
    setContentDirect,
  };
}
