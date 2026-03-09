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
  const [meta, setMeta] = useState(null); // { contentType, title, ... }
  const [content, setContent] = useState(null); // payload 데이터
  const [original, setOriginal] = useState(null); // 원본 (dirty 비교용)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const undoStack = useRef([]);
  const [undoLen, setUndoLen] = useState(0);
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
        let ct, payload, title, schemaVersion;
        if (staticInfo?.jsonPath) {
          /* static 콘텐츠: 정적 파일에서 직접 로드 */
          const base = import.meta.env.BASE_URL || "/";
          const url = `${base}${staticInfo.jsonPath.replace(/^\//, "")}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`정적 파일 로드 실패: ${res.status}`);
          const fileData = await res.json();
          payload = fileData.payload || fileData;
          ct = fileData.contentType || staticInfo.contentType || "";
          title = fileData.title || staticInfo.title || "";
          schemaVersion = "1.0";
        } else {
          /* DB 콘텐츠: API 호출 */
          const res = await apiGet(`/v1/admin/content/${contentId}/preview`);
          ct = res.contentType || res.content_type || "";
          payload = res.content || res.payload || {};
          title = res.title || "";
          schemaVersion = res.schemaVersion || res.schema_version || "1.0";
        }
        if (cancelled) return;
        setMeta({ contentType: ct, title, contentId, schemaVersion });
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
  const dirty = content !== null && original !== null && JSON.stringify(content) !== JSON.stringify(original);

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
      await apiPut(`/v1/admin/content/${contentId}`, {
        contentType: meta.contentType,
        schemaVersion: meta.schemaVersion || "1.0",
        content,
      });
      setOriginal(JSON.parse(JSON.stringify(content)));
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
  }, [original, pushUndo]);

  return {
    meta,
    content,
    loading,
    saving,
    dirty,
    error,
    saveMsg,
    canUndo: undoLen > 0,
    updateField,
    addItem,
    removeItem,
    reorderItems,
    save,
    undo,
    revert,
    setContentDirect,
  };
}
