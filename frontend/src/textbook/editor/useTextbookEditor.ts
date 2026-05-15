/**
 * 교재 에디터 상태 훅. useContentEditor / useTestEditor 와 같은 인터페이스를 제공해
 * 기존 패턴에 익숙한 화면들과 일관되도록.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiGetCamel, apiPost, apiPut, apiDelete } from "../../utils/adminApi";

/** 백엔드 SNAKE_CASE 응답에서 textbook id 만 안전 추출. */
function pickTextbookId(detail: any): string | null {
  return detail?.textbookId ?? detail?.textbook_id ?? null;
}
import type { Block, Page, Textbook } from "../types";
import { blankPage, blankTextbook } from "../parser/blank";

export interface TextbookEditorState {
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  error: string | null;
  saveMsg: string | null;
  textbook: Textbook | null;
  selectedPageId: string | null;
  selectedBlockIndex: number | null;     // 현재 페이지 안의 블록 인덱스
}

export interface TextbookEditorActions {
  // 페이지
  addPage(): void;
  removePage(pageId: string): void;
  selectPage(pageId: string): void;
  reorderPage(from: number, to: number): void;
  // 블록
  addBlock(block: Block, atIndex?: number): void;
  removeBlock(index: number): void;
  moveBlock(from: number, to: number): void;
  updateBlock(index: number, patch: Partial<Block>): void;
  selectBlock(index: number | null): void;
  // 메타
  updateMeta(patch: Partial<Pick<Textbook, "title" | "series" | "level" | "volume">>): void;
  // 저장
  save(): Promise<void>;
  reload(): Promise<void>;
  // 직접 주입 (JSON 업로드 등)
  setTextbook(tb: Textbook): void;
}

export function useTextbookEditor(textbookId: string | "new", orgId: string | null = null)
  : TextbookEditorState & TextbookEditorActions
{
  const [textbook, setTextbookState] = useState<Textbook | null>(null);
  const [originalRef, setOriginal] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const isNewRef = useRef<boolean>(textbookId === "new");

  // 초기 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (textbookId === "new") {
          const tb = blankTextbook({
            textbookId: "new",
            title: "(제목 없음)",
            orgId,
          });
          if (!cancelled) {
            setTextbookState(tb);
            setOriginal(JSON.stringify(tb));
            setSelectedPageId(tb.pages[0]?.pageId ?? null);
          }
        } else {
          const res: any = await apiGetCamel(`/v1/admin/textbooks/${encodeURIComponent(textbookId)}`);
          const detail = res?.data ?? res;
          // payload 가 빈 객체({}) 또는 우리 schema 아니면 blankTextbook 으로 fallback.
          const payload = detail?.payload;
          const isValidPayload = payload && typeof payload === "object"
            && Array.isArray((payload as any).pages)
            && (payload as any).pages.length > 0;
          const tb: Textbook = isValidPayload
            ? (payload as Textbook)
            : blankTextbook({
                textbookId,
                title: detail?.title ?? "(제목 없음)",
                orgId: detail?.orgId ?? null,
              });
          tb.textbookId = pickTextbookId(detail) ?? textbookId;
          tb.orgId = detail?.orgId ?? null;
          tb.title = detail?.title ?? tb.title;
          if (!cancelled) {
            setTextbookState(tb);
            setOriginal(JSON.stringify(tb));
            setSelectedPageId(tb.pages?.[0]?.pageId ?? null);
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

  // beforeunload 가드
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (textbook && JSON.stringify(textbook) !== originalRef) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [textbook, originalRef]);

  const dirty = useMemo(
    () => textbook != null && JSON.stringify(textbook) !== originalRef,
    [textbook, originalRef]
  );

  const setTextbook = useCallback((tb: Textbook) => {
    setTextbookState(tb);
    setSelectedPageId(tb.pages[0]?.pageId ?? null);
    setSelectedBlockIndex(null);
  }, []);

  const currentPageIndex = useMemo(() => {
    if (!textbook || !selectedPageId) return -1;
    return textbook.pages.findIndex((p) => p.pageId === selectedPageId);
  }, [textbook, selectedPageId]);

  // 페이지 ─────────────────────────────────────────────────────
  const addPage = useCallback(() => {
    setTextbookState((prev) => {
      if (!prev) return prev;
      const np = blankPage();
      return { ...prev, pages: [...prev.pages, np] };
    });
  }, []);

  const removePage = useCallback((pageId: string) => {
    setTextbookState((prev) => {
      if (!prev || prev.pages.length <= 1) return prev;
      const pages = prev.pages.filter((p) => p.pageId !== pageId);
      return { ...prev, pages };
    });
  }, []);

  const selectPage = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedBlockIndex(null);
  }, []);

  const reorderPage = useCallback((from: number, to: number) => {
    setTextbookState((prev) => {
      if (!prev) return prev;
      const pages = [...prev.pages];
      const item = pages[from];
      if (!item) return prev;
      pages.splice(from, 1);
      pages.splice(to, 0, item);
      return { ...prev, pages };
    });
  }, []);

  // 블록 ──────────────────────────────────────────────────────
  const mutateCurrentPage = useCallback(
    (fn: (p: Page) => Page) => {
      setTextbookState((prev) => {
        if (!prev || currentPageIndex < 0) return prev;
        const page = prev.pages[currentPageIndex];
        if (!page) return prev;
        const next = fn(page);
        const pages = [...prev.pages];
        pages[currentPageIndex] = next;
        return { ...prev, pages };
      });
    },
    [currentPageIndex]
  );

  const addBlock = useCallback((block: Block, atIndex?: number) => {
    mutateCurrentPage((p) => {
      const blocks = [...p.blocks];
      const idx = atIndex ?? blocks.length;
      blocks.splice(idx, 0, block);
      return { ...p, blocks };
    });
  }, [mutateCurrentPage]);

  const removeBlock = useCallback((index: number) => {
    mutateCurrentPage((p) => {
      const blocks = [...p.blocks];
      blocks.splice(index, 1);
      return { ...p, blocks };
    });
    setSelectedBlockIndex(null);
  }, [mutateCurrentPage]);

  const moveBlock = useCallback((from: number, to: number) => {
    mutateCurrentPage((p) => {
      const blocks = [...p.blocks];
      const item = blocks[from];
      if (!item) return p;
      blocks.splice(from, 1);
      blocks.splice(to, 0, item);
      return { ...p, blocks };
    });
  }, [mutateCurrentPage]);

  const updateBlock = useCallback((index: number, patch: Partial<Block>) => {
    mutateCurrentPage((p) => {
      const blocks = [...p.blocks];
      const current = blocks[index];
      if (!current) return p;
      blocks[index] = { ...current, ...patch } as Block;
      return { ...p, blocks };
    });
  }, [mutateCurrentPage]);

  const selectBlock = useCallback((index: number | null) => setSelectedBlockIndex(index), []);

  // 메타 ──────────────────────────────────────────────────────
  const updateMeta = useCallback((patch: Partial<Pick<Textbook, "title" | "series" | "level" | "volume">>) => {
    setTextbookState((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  // 저장 ──────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!textbook) return;
    setSaving(true);
    setError(null);
    setSaveMsg(null);
    try {
      if (isNewRef.current || textbook.textbookId === "new") {
        const res: any = await apiPost("/v1/admin/textbooks", {
          title: textbook.title,
          orgId: textbook.orgId,
          series: textbook.series,
          level: textbook.level,
          volume: textbook.volume,
          payload: textbook,
          sourceJson: textbook.sourceSnapshot,
        });
        const detail = res?.data ?? res;
        const newId = pickTextbookId(detail);
        if (newId && newId !== "new") {
          const next: Textbook = { ...textbook, textbookId: newId };
          setTextbookState(next);
          setOriginal(JSON.stringify(next));
          isNewRef.current = false;
          window.history.replaceState(null, "", `/admin/textbooks/${newId}/edit`);
        }
      } else {
        // 메타 + payload 한 번에
        await apiPut(`/v1/admin/textbooks/${encodeURIComponent(textbook.textbookId)}`, {
          title: textbook.title, series: textbook.series, level: textbook.level, volume: textbook.volume,
        });
        await apiPut(`/v1/admin/textbooks/${encodeURIComponent(textbook.textbookId)}/payload`, {
          payload: textbook,
        });
        setOriginal(JSON.stringify(textbook));
      }
      setSaveMsg("저장 완료");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }, [textbook]);

  const reload = useCallback(async () => {
    if (!textbook || textbook.textbookId === "new") return;
    setLoading(true);
    try {
      const res: any = await apiGetCamel(`/v1/admin/textbooks/${encodeURIComponent(textbook.textbookId)}`);
      const detail = res?.data ?? res;
      const payload = detail?.payload;
      const isValidPayload = payload && typeof payload === "object"
        && Array.isArray((payload as any).pages)
        && (payload as any).pages.length > 0;
      const tb: Textbook = isValidPayload ? (payload as Textbook) : textbook;
      tb.textbookId = pickTextbookId(detail) ?? textbook.textbookId;
      tb.orgId = detail?.orgId ?? null;
      tb.title = detail?.title ?? tb.title;
      setTextbookState(tb);
      setOriginal(JSON.stringify(tb));
    } finally {
      setLoading(false);
    }
  }, [textbook]);

  // delete 는 list 페이지에서. 여기선 사용 X
  void apiDelete;

  return {
    loading, saving, dirty, error, saveMsg,
    textbook, selectedPageId, selectedBlockIndex,
    addPage, removePage, selectPage, reorderPage,
    addBlock, removeBlock, moveBlock, updateBlock, selectBlock,
    updateMeta, save, reload, setTextbook,
  };
}
