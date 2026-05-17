/**
 * 캔버스 교재 에디터 상태 훅.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiGetCamel, apiPost, apiPut } from "../../utils/adminApi";
import {
  blankCanvasTextbook, blankCanvasPage, newElementId,
  type CanvasElement, type CanvasPage, type CanvasTextbook,
} from "./types";
import { flowToCanvas, isFlowTextbook } from "./flowToCanvas";

function pickTextbookId(detail: any): string | null {
  return detail?.textbookId ?? detail?.textbook_id ?? null;
}

export function useCanvasEditor(textbookId: string | "new", orgId: string | null = null) {
  const [textbook, setTextbook] = useState<CanvasTextbook | null>(null);
  const [origRef, setOrig] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const isNewRef = useRef<boolean>(textbookId === "new");

  // 초기 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        if (textbookId === "new") {
          const tb = blankCanvasTextbook({ textbookId: "new", title: "(제목 없음)", orgId });
          if (!cancelled) {
            setTextbook(tb);
            setOrig(JSON.stringify(tb));
            setSelectedPageId(tb.pages[0]?.pageId ?? null);
          }
        } else {
          const res: any = await apiGetCamel(`/v1/admin/textbooks/${encodeURIComponent(textbookId)}`);
          const detail = res?.data ?? res;
          const payload = detail?.payload;
          const isCanvas = payload && typeof payload === "object"
            && (payload as any).schemaVersion === 2
            && Array.isArray((payload as any).pages);
          let tb: CanvasTextbook;
          if (isCanvas) {
            tb = payload as CanvasTextbook;
          } else if (isFlowTextbook(payload)) {
            // flow → 캔버스 자동 변환 (2026-05-17). 사용자는 캔버스에서 자유 재배치.
            tb = flowToCanvas(payload as any);
          } else {
            tb = blankCanvasTextbook({
              textbookId, title: detail?.title ?? "(제목 없음)", orgId: detail?.orgId ?? null,
            });
          }
          tb.textbookId = pickTextbookId(detail) ?? textbookId;
          tb.orgId = detail?.orgId ?? null;
          tb.title = detail?.title ?? tb.title;
          if (tb.pages.length === 0) tb.pages = [blankCanvasPage()];
          if (!cancelled) {
            setTextbook(tb);
            setOrig(JSON.stringify(tb));
            setSelectedPageId(tb.pages[0]?.pageId ?? null);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [textbookId, orgId]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (textbook && JSON.stringify(textbook) !== origRef) {
        e.preventDefault(); e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [textbook, origRef]);

  const dirty = useMemo(
    () => textbook != null && JSON.stringify(textbook) !== origRef,
    [textbook, origRef]
  );

  const currentPageIndex = useMemo(() => {
    if (!textbook || !selectedPageId) return -1;
    return textbook.pages.findIndex((p) => p.pageId === selectedPageId);
  }, [textbook, selectedPageId]);

  const currentPage: CanvasPage | null = currentPageIndex >= 0 && textbook
    ? (textbook.pages[currentPageIndex] ?? null)
    : null;

  // ─── 페이지 ─────────────────────────────────────────────
  const addPage = useCallback(() => {
    setTextbook((tb) => tb ? { ...tb, pages: [...tb.pages, blankCanvasPage()] } : tb);
  }, []);
  const removePage = useCallback((pageId: string) => {
    setTextbook((tb) => {
      if (!tb || tb.pages.length <= 1) return tb;
      return { ...tb, pages: tb.pages.filter((p) => p.pageId !== pageId) };
    });
  }, []);
  const selectPage = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedElementIds([]);
  }, []);
  const reorderPage = useCallback((from: number, to: number) => {
    setTextbook((tb) => {
      if (!tb) return tb;
      const pages = [...tb.pages];
      const item = pages[from]; if (!item) return tb;
      pages.splice(from, 1); pages.splice(to, 0, item);
      return { ...tb, pages };
    });
  }, []);

  const mutatePage = useCallback((fn: (p: CanvasPage) => CanvasPage) => {
    setTextbook((tb) => {
      if (!tb || currentPageIndex < 0) return tb;
      const page = tb.pages[currentPageIndex]; if (!page) return tb;
      const next = fn(page);
      const pages = [...tb.pages]; pages[currentPageIndex] = next;
      return { ...tb, pages };
    });
  }, [currentPageIndex]);

  const updatePageBackground = useCallback((bg: CanvasPage["background"]) => {
    mutatePage((p) => ({ ...p, background: bg }));
  }, [mutatePage]);

  // ─── 요소 ──────────────────────────────────────────────
  const maxZIndex = useMemo(() => {
    if (!currentPage) return 0;
    return currentPage.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
  }, [currentPage]);

  const addElement = useCallback((el: CanvasElement, atZIndex?: number) => {
    const z = atZIndex ?? maxZIndex + 1;
    const withZ: CanvasElement = { ...el, zIndex: z };
    mutatePage((p) => ({ ...p, elements: [...p.elements, withZ] }));
    setSelectedElementIds([withZ.id]);
  }, [mutatePage, maxZIndex]);

  const updateElement = useCallback((id: string, patch: Partial<CanvasElement>) => {
    mutatePage((p) => ({
      ...p,
      elements: p.elements.map((e) => e.id === id ? { ...e, ...patch } as CanvasElement : e),
    }));
  }, [mutatePage]);

  const removeElement = useCallback((id: string) => {
    mutatePage((p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) }));
    setSelectedElementIds((prev) => prev.filter((x) => x !== id));
  }, [mutatePage]);

  const duplicateElement = useCallback((id: string) => {
    if (!currentPage) return;
    const src = currentPage.elements.find((e) => e.id === id);
    if (!src) return;
    const copy: CanvasElement = { ...src, id: newElementId(src.type), x: src.x + 5, y: src.y + 5,
                                  zIndex: maxZIndex + 1 } as CanvasElement;
    mutatePage((p) => ({ ...p, elements: [...p.elements, copy] }));
    setSelectedElementIds([copy.id]);
  }, [currentPage, mutatePage, maxZIndex]);

  const bringForward = useCallback((id: string) => {
    if (!currentPage) return;
    updateElement(id, { zIndex: maxZIndex + 1 } as any);
  }, [currentPage, updateElement, maxZIndex]);

  const sendBackward = useCallback((id: string) => {
    if (!currentPage) return;
    const minZ = currentPage.elements.reduce((m, e) => Math.min(m, e.zIndex), 0);
    updateElement(id, { zIndex: minZ - 1 } as any);
  }, [currentPage, updateElement]);

  const selectElements = useCallback((ids: string[], extend: boolean = false) => {
    if (extend) {
      setSelectedElementIds((prev) => {
        const set = new Set(prev);
        for (const id of ids) set.has(id) ? set.delete(id) : set.add(id);
        return Array.from(set);
      });
    } else {
      setSelectedElementIds(ids);
    }
  }, []);

  // ─── 메타 ──────────────────────────────────────────────
  const updateMeta = useCallback((patch: Partial<Pick<CanvasTextbook, "title" | "series" | "level" | "volume" | "chapterRange" | "header" | "footer">>) => {
    setTextbook((tb) => tb ? { ...tb, ...patch } : tb);
  }, []);

  // ─── 저장 ──────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!textbook) return;
    setSaving(true); setError(null); setSaveMsg(null);
    try {
      if (isNewRef.current || textbook.textbookId === "new") {
        const res: any = await apiPost("/v1/admin/textbooks", {
          title: textbook.title, orgId: textbook.orgId,
          series: textbook.series, level: textbook.level, volume: textbook.volume,
          payload: textbook, sourceJson: textbook.sourceSnapshot,
        });
        const detail = res?.data ?? res;
        const newId = pickTextbookId(detail);
        if (newId && newId !== "new") {
          const next = { ...textbook, textbookId: newId };
          setTextbook(next);
          setOrig(JSON.stringify(next));
          isNewRef.current = false;
          window.history.replaceState(null, "", `/admin/textbooks/${newId}/edit`);
        }
      } else {
        await apiPut(`/v1/admin/textbooks/${encodeURIComponent(textbook.textbookId)}`, {
          title: textbook.title, series: textbook.series,
          level: textbook.level, volume: textbook.volume,
        });
        await apiPut(`/v1/admin/textbooks/${encodeURIComponent(textbook.textbookId)}/payload`, {
          payload: textbook,
        });
        setOrig(JSON.stringify(textbook));
      }
      setSaveMsg("저장 완료");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }, [textbook]);

  return {
    // 상태
    textbook, loading, saving, dirty, error, saveMsg,
    selectedPageId, selectedElementIds, zoom, currentPage, currentPageIndex,
    // 페이지
    addPage, removePage, selectPage, reorderPage,
    updatePageBackground,
    // 요소
    addElement, updateElement, removeElement, duplicateElement,
    bringForward, sendBackward, selectElements,
    // 메타·기타
    updateMeta, save, setZoom,
    setTextbook,
  };
}
