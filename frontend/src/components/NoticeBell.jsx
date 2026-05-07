import { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { apiGet, apiPost } from "../utils/api";
import "../styles/notice-bell.css";

/**
 * 헤더 종 아이콘 + 공지 모달.
 * - 마운트 시 unread-count fetch + 60초 polling
 * - 클릭 시 모달 열림 → 공지 목록 fetch
 * - 공지 클릭 시 본문 펼치기 + read 처리
 *
 * ref.current.openModal() 으로 외부에서도 모달 열 수 있음 (사이드바 "공지사항" 메뉴 클릭 등).
 */
const NoticeBell = forwardRef(function NoticeBell(_, ref) {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [readIds, setReadIds] = useState(new Set());
  const pollRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await apiGet("/v1/notices/unread-count");
      const n = Number(data?.count ?? data?.unreadCount ?? data ?? 0);
      setUnread(Number.isFinite(n) ? n : 0);
    } catch (e) {
      // 비로그인·기타 에러 — 0 으로 처리, console 만 남기지 X (반복되므로)
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await apiGet("/v1/notices?limit=20");
      const items = Array.isArray(data) ? data : (data?.items ?? data?.notices ?? []);
      setList(items);
    } catch (e) {
      setList([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 60_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchUnreadCount]);

  const handleOpen = () => {
    setOpen(true);
    fetchList();
  };

  useImperativeHandle(ref, () => ({
    openModal: () => handleOpen(),
  }), []);

  const handleClose = () => {
    setOpen(false);
    setExpandedId(null);
  };

  const handleNoticeClick = async (notice) => {
    const id = notice.id;
    const wasExpanded = expandedId === id;
    setExpandedId(wasExpanded ? null : id);
    if (!wasExpanded && !readIds.has(id) && !notice.alreadyRead) {
      try {
        await apiPost(`/v1/notices/${id}/read`, {});
        setReadIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        setUnread((prev) => Math.max(0, prev - 1));
      } catch (e) {
        // 무시 (이미 읽음 등)
      }
    }
  };

  const fmt = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      const now = new Date();
      const diff = Math.floor((now - d) / 1000);
      if (diff < 60) return "방금";
      if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
      const days = Math.floor(diff / 86400);
      if (days < 7) return `${days}일 전`;
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  return (
    <>
      <button
        type="button"
        className="notice-bell"
        aria-label={`공지사항 ${unread > 0 ? `안 읽은 ${unread}건` : ""}`}
        onClick={handleOpen}
      >
        <span className="notice-bell-icon" aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span className="notice-bell-badge">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="notice-modal-backdrop"
            aria-label="공지 닫기"
            onClick={handleClose}
          />
          <div className="notice-modal" role="dialog" aria-label="공지사항">
            <div className="notice-modal-head">
              <h2>📢 공지사항</h2>
              <button
                type="button"
                className="notice-modal-close"
                aria-label="닫기"
                onClick={handleClose}
              >
                ✕
              </button>
            </div>
            <div className="notice-modal-body">
              {loadingList ? (
                <div className="notice-loading">불러오는 중...</div>
              ) : list.length === 0 ? (
                <div className="notice-empty">공지사항이 없습니다.</div>
              ) : (
                <ul className="notice-list">
                  {list.map((n) => {
                    const isExpanded = expandedId === n.id;
                    const isRead = readIds.has(n.id) || n.alreadyRead;
                    return (
                      <li
                        key={n.id}
                        className={`notice-item ${isRead ? "read" : "unread"} ${isExpanded ? "expanded" : ""}`}
                      >
                        <button
                          type="button"
                          className="notice-item-head"
                          onClick={() => handleNoticeClick(n)}
                        >
                          <div className="notice-item-meta">
                            {n.pinned && <span className="pin">📌</span>}
                            {n.scope === "GLOBAL" && <span className="scope global">본사</span>}
                            {n.scope === "ORG" && <span className="scope org">기관</span>}
                            {!isRead && <span className="dot" aria-hidden="true" />}
                          </div>
                          <h3 className="notice-item-title">{n.title}</h3>
                          <span className="notice-item-time">{fmt(n.createdAt || n.created_at)}</span>
                        </button>
                        {isExpanded && (
                          <div className="notice-item-body">
                            {(n.body || "").split(/\n+/).map((p, i) => (
                              <p key={i}>{p}</p>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
});

export default NoticeBell;
