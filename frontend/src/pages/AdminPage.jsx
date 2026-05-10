import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiDelete, apiGet, apiPatch, apiPost } from "../utils/adminApi";
import { API_BASE, TOKEN_KEY } from "../utils/api";
import AdminLayout from "../components/AdminLayout";
import AttachedImageStrip from "../components/chat/AttachedImageStrip";
import { useAuth } from "../hooks/useAuth";

/**
 * /admin — 운영자 AI 비서 채팅 대시보드.
 * 좌측: 세션 목록(+ 새 대화)
 * 중앙: 채팅 메시지 + 입력창 (마크다운 렌더 + tool 진행 표시)
 * 우측: 자몽/한도 카드 + 오늘의 브리핑 + 빠른 작업
 */

/** 세션 시간 표시 — 오늘이면 시간만, 어제면 "어제 HH:MM", 이전이면 "M/D HH:MM". */
function formatSessionTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (sameDay) return `오늘 ${hh}:${mm}`;
  if (isYesterday) return `어제 ${hh}:${mm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

function AdminPage() {
  const { user } = useAuth();
  const isHq = (user?.roles || []).includes("HQ_ADMIN");
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [briefing, setBriefing] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [suspended, setSuspended] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [attachedImages, setAttachedImages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);

  const scrollRef = useRef(null);
  const imageInputRef = useRef(null);

  const loadSessions = async (autoSelectLatest = false) => {
    try {
      const data = await apiGet("/v1/admin/agent/sessions");
      const list = Array.isArray(data) ? data : [];
      setSessions(list);
      if (autoSelectLatest && list.length > 0) {
        // 가장 최근 active 세션 자동 선택 — 새 대화 버튼 안 누르면 이어지게
        setActiveSessionId(list[0].id);
      }
      setSuspended(false);
    } catch (e) {
      // 정지 응답 (PAYMENT_REQUIRED + ORG_SUSPENDED) — 사이드바에서만 감지
      if (/정지|미결제|ORG_SUSPENDED/.test(e.message || "")) {
        setSuspended(true);
      } else {
        setError(e.message);
      }
    }
  };

  const loadMessages = async (sid) => {
    if (!sid) {
      setMessages([]);
      return;
    }
    try {
      const data = await apiGet(`/v1/admin/agent/sessions/${sid}/messages`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const loadBriefing = async () => {
    try {
      const data = await apiGet("/v1/admin/dashboard/summary");
      setBriefing(data);
    } catch {
      // ignore
    }
  };

  const loadAgentStatus = async () => {
    try {
      const data = await apiGet("/v1/admin/agent/status");
      setAgentStatus(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSessions(true); // 첫 진입 — 가장 최근 대화 자동 선택
    loadBriefing();
    loadAgentStatus();
  }, []);

  useEffect(() => {
    loadMessages(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const startNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setDraft("");
    clearAttachedImages();
  };

  const clearAttachedImages = () => {
    setAttachedImages((prev) => {
      prev.forEach((img) => {
        if (img.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
      });
      return [];
    });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeAttachedImage = (fileId) => {
    setAttachedImages((prev) => {
      const removed = prev.find((img) => img.fileId === fileId);
      if (removed?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((img) => img.fileId !== fileId);
    });
  };

  const uploadVisionImage = async (file) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      throw new Error("jpeg, png, webp, gif 이미지만 첨부할 수 있습니다.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("이미지는 10MB 이하만 첨부할 수 있습니다.");
    }
    const presign = await apiPost("/v1/files/presign", {
      purpose: "chat-vision",
      filename: file.name || "chat-image",
      mime: file.type,
      size: file.size,
    });
    const fileId = presign.fileId || presign.file_id;
    const fd = new FormData();
    fd.append("file", file);
    const token = sessionStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/v1/files/${fileId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) throw new Error(`이미지 업로드 실패 (${res.status})`);
    return {
      fileId,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    };
  };

  const handleVisionImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageInputRef.current) imageInputRef.current.value = "";
    setImageUploading(true);
    setError("");
    try {
      clearAttachedImages();
      const uploaded = await uploadVisionImage(file);
      setAttachedImages([uploaded]);
    } catch (err) {
      setError(err.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setImageUploading(false);
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if ((!text && attachedImages.length === 0) || sending || imageUploading) return;
    setSending(true);
    setError("");

    const optimisticUser = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text || "첨부 이미지를 분석해 주세요.",
      images: attachedImages,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setDraft("");
    const imageFileIds = attachedImages.map((img) => img.fileId);

    try {
      const result = await apiPost("/v1/admin/agent/turns", {
        sessionId: activeSessionId,
        message: text,
        imageFileIds,
      });
      clearAttachedImages();
      const nextSessionId = result?.session_id || result?.sessionId || activeSessionId;
      if (!activeSessionId && nextSessionId) {
        setActiveSessionId(nextSessionId);
        await loadSessions();
      }
      await loadMessages(nextSessionId);
      // 자몽/한도 카드 업데이트
      loadAgentStatus();
    } catch (e) {
      setError(e.message);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renameSession = async (sid) => {
    const next = window.prompt("대화 제목을 입력하세요");
    if (!next) return;
    try {
      await apiPatch(`/v1/admin/agent/sessions/${sid}`, { title: next });
      await loadSessions();
    } catch (e) {
      setError(e.message);
    }
  };

  const archiveSession = async (sid) => {
    if (!window.confirm("이 대화를 보관(숨김)하시겠습니까?")) return;
    try {
      await apiDelete(`/v1/admin/agent/sessions/${sid}`);
      if (activeSessionId === sid) startNewSession();
      await loadSessions();
    } catch (e) {
      setError(e.message);
    }
  };

  const briefingItems = useMemo(() => {
    if (!briefing) return [];
    return [
      { label: "오늘 가입자", value: briefing.todaySignups ?? 0 },
      { label: "활성 사용자", value: briefing.activeUsers ?? 0 },
      { label: "오늘 학습 참여", value: briefing.todayLearners ?? 0 },
      { label: "승인 대기", value: briefing.pendingApprovals ?? 0, link: "/admin/approvals" },
      { label: "학부모 연결 대기", value: briefing.pendingParentLinks ?? 0, link: "/admin/parents" },
      { label: "최근 7일 시험 응시", value: briefing.recentTestSubmissions ?? 0, link: "/admin/tests" },
    ];
  }, [briefing]);

  const quickActions = [
    { label: "학습 계획표", path: "/admin/study-plans" },
    { label: "학생 관리", path: "/admin/students" },
    { label: "수강반 관리", path: "/admin/classes" },
    { label: "콘텐츠 관리", path: "/admin/content" },
    { label: "공지 관리", path: "/admin/notices" },
    ...(isHq
      ? [
          { label: "기관 관리", path: "/admin/orgs" },
          { label: "결제 관리", path: "/admin/orgs?tab=payments" },
        ]
      : [{ label: "AI 자몽 지갑", path: "/admin/grapefruit-wallet" }]),
  ];

  return (
    <AdminLayout>
      <div className="agent-shell">
        <main className="agent-main">
          <header className="agent-main-header">
            <div className="agent-main-header-row">
              <h1>AI 비서</h1>
              <div className="agent-main-actions">
                <button
                  type="button"
                  className="agent-header-btn"
                  onClick={() => setShowSessions(true)}
                  aria-label="대화 목록 열기"
                >
                  📋 대화 목록 ({sessions.length})
                </button>
                <button
                  type="button"
                  className="agent-header-btn primary"
                  onClick={startNewSession}
                >
                  ＋ 새 대화
                </button>
              </div>
            </div>
            <p>
              자연어로 작업을 지시하시면 비서가 학습 계획표·학생·수강반을 처리합니다.
              데이터를 변경하는 작업은 실행 직전 확인을 받습니다.
            </p>
          </header>

          {suspended && (
            <div className="agent-suspended">
              <strong>월 사용료 미결제로 본 기관의 운영 기능이 일시 정지되었습니다.</strong>
              <p>
                <button type="button" onClick={() => navigate("/admin/billing")}>결제 화면으로 이동</button>
                <button type="button" onClick={() => navigate("/admin/grapefruit-wallet")}>자몽 충전</button>
                결제 후 즉시 정지가 해제됩니다.
              </p>
            </div>
          )}
          {error && <div className="agent-error">{error}</div>}

          <div className="agent-thread" ref={scrollRef}>
            {messages.length === 0 && !sending && (
              <div className="agent-greeting">
                <h2>{isHq ? "본사 운영자" : "기관 운영자"} 비서입니다.</h2>
                <p>아래와 같이 지시하실 수 있습니다.</p>
                <ul>
                  <li>"러셀1 활성 학생들에게 비문학 5편 추천해서 다음 주 마감으로 일괄 배정해 주세요."</li>
                  <li>"홍길동 학생의 약점 역량 보강용 학습을 추천해 주세요."</li>
                  <li>"이번 주 마감 임박 셀을 정리해 주세요."</li>
                </ul>
              </div>
            )}
            {messages.map((m, idx) => {
              if (m.role === "tool") {
                // 인접한 tool 들 묶어서 첫 번째에서만 그려주기
                const prev = messages[idx - 1];
                if (prev && prev.role === "tool") return null;
                const group = [];
                for (let j = idx; j < messages.length && messages[j].role === "tool"; j++) {
                  group.push(messages[j]);
                }
                return (
                  <div key={`tools-${m.id}`} className="agent-tool-trace">
                    {group.map((g) => (
                      <span
                        key={g.id}
                        className={`agent-tool-pill ${g.status === "success" ? "ok" : "err"}`}
                      >
                        {g.status === "success" ? "✓" : "✗"} {g.functionName}
                      </span>
                    ))}
                  </div>
                );
              }
              if (m.role === "assistant_tool_use") return null; // 내부 history 용
              return (
                <div key={m.id} className={`agent-msg ${m.role}`}>
                  <div className="agent-msg-meta">
                    {m.role === "user" ? "운영자" : "AI 비서"}
                  </div>
                  <div className="agent-msg-body">
                    {m.images?.length > 0 && <AttachedImageStrip images={m.images} disabled />}
                    {m.role === "assistant" ? (
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children, ...props }) => {
                            // 내부 경로(상대 / 절대 URL 둘 다 같은 호스트) → react-router navigate.
                            // 새 탭으로 열면 sessionStorage 가 비어 401 → 자동 로그아웃되는 사고 방지.
                            let internalPath = null;
                            if (href) {
                              if (href.startsWith("/")) internalPath = href;
                              else {
                                try {
                                  const u = new URL(href, window.location.origin);
                                  if (u.origin === window.location.origin) {
                                    internalPath = u.pathname + u.search + u.hash;
                                  }
                                } catch { /* invalid URL → 외부로 처리 */ }
                              }
                            }
                            if (internalPath) {
                              return (
                                <a
                                  href={internalPath}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigate(internalPath);
                                  }}
                                  {...props}
                                >
                                  {children}
                                </a>
                              );
                            }
                            return (
                              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {m.content || ""}
                      </Markdown>
                    ) : (
                      (m.content || "").split("\n").map((line, i) => (
                        <div key={i}>{line || " "}</div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="agent-msg assistant">
                <div className="agent-msg-meta">AI 비서</div>
                <div className="agent-msg-body agent-typing">생각하고 있습니다…</div>
              </div>
            )}
          </div>

          <div className="agent-input">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={handleVisionImageSelected}
            />
            <button
              type="button"
              className="agent-attach-btn"
              onClick={() => imageInputRef.current?.click()}
              disabled={sending || imageUploading}
              aria-label="이미지 첨부"
              title="이미지 첨부"
            >
              <span className="material-symbols-outlined">image</span>
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder="비서에게 지시하세요. (Enter 전송, Shift+Enter 줄바꿈)"
              rows={3}
              disabled={sending || imageUploading}
            />
            <button type="button" onClick={sendMessage} disabled={sending || imageUploading || (!draft.trim() && attachedImages.length === 0)}>
              전송
            </button>
          </div>
          <AttachedImageStrip images={attachedImages} onRemove={removeAttachedImage} disabled={sending || imageUploading} />
        </main>

        <aside className="agent-context">
          <section className="agent-card">
            <h3>AI 비서 사용량</h3>
            {!agentStatus ? (
              <p className="muted">불러오는 중…</p>
            ) : agentStatus.unlimited ? (
              <p className="muted">본사 권한 — 무제한 무료 이용</p>
            ) : (
              <ul className="agent-briefing">
                <li>
                  <span>오늘 사용</span>
                  <strong>{agentStatus.daily_used} / {agentStatus.daily_limit}회</strong>
                </li>
                <li>
                  <span>이번 달 사용</span>
                  <strong>{agentStatus.monthly_used} / {agentStatus.monthly_limit}회</strong>
                </li>
                <li className="clickable" onClick={() => navigate("/admin/grapefruit-wallet")}>
                  <span>자몽 잔액</span>
                  <strong>🍊 {agentStatus.org_grapefruit_balance ?? 0}개</strong>
                </li>
              </ul>
            )}
            {!agentStatus?.unlimited && (
              <p className="agent-help">
                무료 한도 초과 시 자몽 1개당 10회 추가 호출
              </p>
            )}
          </section>

          <section className="agent-card">
            <h3>오늘의 브리핑</h3>
            <ul className="agent-briefing">
              {briefingItems.length === 0 && <li className="muted">불러오는 중…</li>}
              {briefingItems.map((it) => (
                <li
                  key={it.label}
                  className={it.link ? "clickable" : ""}
                  onClick={it.link ? () => navigate(it.link) : undefined}
                >
                  <span>{it.label}</span>
                  <strong>{it.value}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="agent-card">
            <h3>빠른 작업</h3>
            <div className="agent-quick">
              {quickActions.map((a) => (
                <button
                  type="button"
                  key={a.path}
                  onClick={() => navigate(a.path)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {showSessions && (
        <div
          className="agent-sessions-modal-overlay"
          role="dialog"
          aria-label="대화 목록"
          onClick={() => setShowSessions(false)}
        >
          <div
            className="agent-sessions-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="agent-sessions-modal-head">
              <h2>대화 목록</h2>
              <button
                type="button"
                className="agent-sessions-close"
                onClick={() => setShowSessions(false)}
                aria-label="닫기"
              >
                ✕
              </button>
            </header>
            <div className="agent-sessions-modal-body">
              <button
                type="button"
                className="agent-new-btn"
                onClick={() => {
                  startNewSession();
                  setShowSessions(false);
                }}
              >
                ＋ 새 대화 시작
              </button>
              <div className="agent-sessions">
                {sessions.length === 0 && (
                  <p className="agent-empty">아직 대화가 없습니다.</p>
                )}
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`agent-session-row ${s.id === activeSessionId ? "active" : ""}`}
                    onClick={() => {
                      setActiveSessionId(s.id);
                      setShowSessions(false);
                    }}
                  >
                    <span className="agent-session-title">{s.title || "(제목 없음)"}</span>
                    <span style={{ display: "block", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                      {formatSessionTime(s.updatedAt || s.updated_at || s.createdAt || s.created_at)}
                    </span>
                    <div className="agent-session-actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          renameSession(s.id);
                        }}
                      >
                        이름
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveSession(s.id);
                        }}
                      >
                        보관
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminPage;
