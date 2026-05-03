import { useState, useCallback, useEffect, useRef } from "react";
import { apiGet, apiPut } from "../utils/adminApi";
import {
  immutableSet,
  immutableInsert,
  immutableRemove,
  immutableReorder,
} from "../utils/immutableSet";

const MAX_UNDO = 20;

/**
 * 콘텐츠 비주얼 에디터 상태 관리 훅
 * @param {string} contentId - 편집할 콘텐츠 ID
 * @param {object|null} staticInfo - static 콘텐츠 정보 { jsonPath, contentType, title }
 */
export function useContentEditor(contentId, staticInfo) {
  const [meta, setMeta] = useState(null); // { contentType, title, levelId, ... }
  const [originalMeta, setOriginalMeta] = useState(null); // 메타 원본 (dirty 비교용)
  const [content, setContent] = useState(null); // payload 데이터
  const [original, setOriginal] = useState(null); // 원본 (dirty 비교용)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const undoStack = useRef([]);
  const [undoLen, setUndoLen] = useState(0);
  // 표준 양식 wrapper (rawContent 전체) 보관 — save 시 wrapper 보존하여 schema 손실 방지.
  // 학생 화면은 wrapper.payload 를 기대하므로, save 시 wrapper.payload 만 갱신해서 보내야 함.
  const wrapperRef = useRef(null);
  const isStatic = !!staticInfo;

  /* 데이터 로드 */
  useEffect(() => {
    if (!contentId) {
      setLoading(false);
      setError("콘텐츠 ID가 없습니다.");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        let ct, payload, title, schemaVersion, apiRes = null, fileData = null;
        if (staticInfo?.jsonPath) {
          /* static 콘텐츠: 정적 파일에서 직접 로드 */
          const base = import.meta.env.BASE_URL || "/";
          const url = `${base}${staticInfo.jsonPath.replace(/^\//, "")}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`정적 파일 로드 실패: ${res.status}`);
          fileData = await res.json();
          payload = fileData.payload || fileData;
          ct = fileData.contentType || staticInfo.contentType || "";
          title = fileData.title || staticInfo.title || "";
          schemaVersion = "1.0";
        } else {
          /* DB 콘텐츠: API 호출 */
          apiRes = await apiGet(`/v1/admin/content/${contentId}/preview`);
          ct = apiRes.contentType || apiRes.content_type || "";
          const rawContent = apiRes.content || apiRes.payload || {};
          // wrapper 보존: 학생 화면이 기대하는 표준 양식 (contentId/contentType/.../payload) 유지
          // payload 키 존재 여부로 wrapper / non-wrapper 판별
          const isWrapped = rawContent && typeof rawContent === "object" && "payload" in rawContent;
          wrapperRef.current = isWrapped ? rawContent : null;
          payload = isWrapped ? rawContent.payload : rawContent;
          title = apiRes.title || "";
          schemaVersion = apiRes.schemaVersion || apiRes.schema_version || "1.0";

          /* PRO_ANSWER 옛 구조(sections[].groups[].items[]) → 어드민 비주얼이 기대하는
             평탄 구조(sections[].items[]) 로 자동 변환. 학생 화면은 양쪽 호환이라 영향 X. */
          if (ct === "PRO_ANSWER" && Array.isArray(payload?.sections) &&
              payload.sections.some((s) => Array.isArray(s?.groups))) {
            payload = {
              ...payload,
              sections: payload.sections.flatMap((s) => {
                if (!Array.isArray(s.groups) || s.groups.length === 0) {
                  return [{ label: s.title || "", items: s.items || [] }];
                }
                return s.groups.map((g) => ({
                  label: s.title && g.title && s.title !== g.title
                    ? `${s.title} · ${g.title}`
                    : (g.title || s.title || ""),
                  type: g.type,
                  items: (g.items || []).map((it) => ({
                    number: it.number ?? it.num ?? "",
                    answer: it.answer ?? "",
                    explanation: it.explanation ?? "",
                    question: it.question,
                    choices: it.choices,
                  })),
                }));
              }),
            };
          }
        }
        // contentType은 array (다중 분류). string으로 와도 wrap.
        const ctArray = Array.isArray(ct) ? ct.filter(Boolean) : (ct ? [ct] : []);
        if (cancelled) return;
        /* 메타데이터 추출 (DB 응답 / static 파일 / staticInfo 순으로 폴백) */
        const metaSrc = apiRes || fileData || {};
        const levelId = metaSrc.levelId || metaSrc.level_id || metaSrc.targetLevel || staticInfo?.levelId || "";
        const chapterId = metaSrc.chapterId || metaSrc.chapter_id || "";
        const area = metaSrc.area || staticInfo?.area || "";
        const subArea = metaSrc.subArea || metaSrc.sub_area || "";
        const dayIndex = metaSrc.dayIndex ?? metaSrc.day_index ?? "";
        const moduleKey = metaSrc.moduleKey || metaSrc.module_key || staticInfo?.moduleKey || "";
        const videoUrl = metaSrc.videoUrl || metaSrc.video_url || "";
        const metaObj = { contentType: ctArray, title, contentId, schemaVersion, levelId, chapterId, area, subArea, dayIndex, moduleKey, videoUrl };
        setMeta(metaObj);
        setOriginalMeta(JSON.parse(JSON.stringify(metaObj)));
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
  }, [contentId, staticInfo?.jsonPath]);

  /* dirty 판별 */
  const contentDirty = content !== null && original !== null && JSON.stringify(content) !== JSON.stringify(original);
  const metaDirty = meta !== null && originalMeta !== null && JSON.stringify(meta) !== JSON.stringify(originalMeta);
  const dirty = contentDirty || metaDirty;

  /* beforeunload 이탈 방지 */
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /* undo 스택에 현재 상태 푸시 */
  const pushUndo = useCallback(() => {
    undoStack.current = [
      JSON.parse(JSON.stringify(content)),
      ...undoStack.current,
    ].slice(0, MAX_UNDO);
    setUndoLen(undoStack.current.length);
  }, [content]);

  /* 필드 업데이트 */
  const updateField = useCallback((path, value) => {
    pushUndo();
    setContent((prev) => immutableSet(prev, path, value));
  }, [pushUndo]);

  /* 배열 아이템 추가 */
  const addItem = useCallback((path, index, newItem) => {
    pushUndo();
    setContent((prev) => immutableInsert(prev, path, index, newItem));
  }, [pushUndo]);

  /* 배열 아이템 제거 */
  const removeItem = useCallback((path, index) => {
    pushUndo();
    setContent((prev) => immutableRemove(prev, path, index));
  }, [pushUndo]);

  /* 배열 순서 변경 */
  const reorderItems = useCallback((path, fromIndex, toIndex) => {
    pushUndo();
    setContent((prev) => immutableReorder(prev, path, fromIndex, toIndex));
  }, [pushUndo]);

  /* content 통째로 교체 (JSON 모드용) */
  const setContentDirect = useCallback((newContent) => {
    pushUndo();
    setContent(newContent);
  }, [pushUndo]);

  /* 메타 필드 업데이트 */
  const updateMeta = useCallback((field, value) => {
    setMeta((prev) => prev ? { ...prev, [field]: value } : prev);
  }, []);

  /* undo */
  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const [prev, ...rest] = undoStack.current;
    undoStack.current = rest;
    setUndoLen(rest.length);
    setContent(prev);
  }, []);

  /* 저장 */
  const save = useCallback(async () => {
    if (!meta || !content) return;
    if (isStatic) {
      setError("정적 콘텐츠는 서버 저장이 불가합니다. JSON을 다운로드해 주세요.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    setError("");
    try {
      // contentType은 항상 array로 전송 (다중 분류)
      const ctArray = Array.isArray(meta.contentType)
        ? meta.contentType.filter(Boolean)
        : (meta.contentType ? [meta.contentType] : []);
      if (ctArray.length === 0) {
        throw new Error("contentType이 비어있습니다 (최소 1개 카테고리 필요)");
      }
      // ── content_json 본문 빌드 ──
      // 학생 화면은 표준 wrapper { contentId, contentType, ..., payload: {...} } 형태를 기대.
      // wrapper 가 있던 콘텐츠는 wrapper 보존 + payload 갱신 (schema 손실 방지).
      // wrapper 가 없던 옛 콘텐츠는 동일 wrapper 로 래핑하여 정규화.
      const fullContent = wrapperRef.current
        ? { ...wrapperRef.current, payload: content, title: meta.title || wrapperRef.current.title }
        : {
            contentId,
            contentType: ctArray[0],
            title: meta.title || "",
            targetLevel: meta.levelId || null,
            area: meta.area || null,
            subArea: meta.subArea || null,
            payload: content,
          };
      await apiPut(`/v1/admin/content/${contentId}`, {
        contentType: ctArray,
        schemaVersion: meta.schemaVersion || "1.0",
        levelId: meta.levelId || null,
        chapterId: meta.chapterId || null,
        area: meta.area || null,
        subArea: meta.subArea || null,
        dayIndex: meta.dayIndex !== "" && meta.dayIndex != null ? Number(meta.dayIndex) : null,
        moduleKey: meta.moduleKey || null,
        videoUrl: meta.videoUrl || null,
        content: fullContent,
      });
      // 다음 저장 시에도 wrapper 유지되도록 wrapperRef 갱신
      wrapperRef.current = fullContent;
      setOriginal(JSON.parse(JSON.stringify(content)));
      setOriginalMeta(JSON.parse(JSON.stringify(meta)));
      undoStack.current = [];
      setUndoLen(0);
      setSaveMsg("저장 완료");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      setError(e.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  }, [meta, content, contentId, isStatic]);

  /* 되돌리기 (원본으로 리셋) */
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
    isStatic,
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
