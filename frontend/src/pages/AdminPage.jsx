import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../hooks/useAuth";

/**
 * /admin — 운영자 AI 비서 채팅 대시보드.
 * 좌측: 세션 목록(+ 새 대화)
 * 중앙: 채팅 메시지 + 입력창
 * 우측: 오늘의 브리핑 + 빠른 작업
 *
 * 기존 대시보드 통계 4개 카드는 우측 "오늘의 브리핑" 박스에 흡수.
 */
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

  const scrollRef = useRef(null);

  // 세션 목록
  const loadSessions = async () => {
    try {
      const data = await apiGet("/v1/admin/agent/sessions");
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    }
  };

  // 메시지
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

  // 오늘의 브리핑 (기존 dashboard summary 흡수)
  const loadBriefing = async () => {
    try {
      const data = await apiGet("/v1/admin/dashboard/summary");
      setBriefing(data);
    } catch {
      // 권한 없거나 실패해도 무시
    }
  };

  useEffect(() => {
    loadSessions();
    loadBriefing();
  }, []);

  useEffect(() => {
    loadMessages(activeSessionId);
  }, [activeSessionId]);

  // 새 메시지 도착 시 하단 스크롤
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const startNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setDraft("");
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");

    // 낙관적 업데이트 — user 메시지 즉시 표시
    const optimisticUser = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setDraft("");

    try {
      const result = await apiPost("/v1/admin/agent/turns", {
        sessionId: activeSessionId,
        message: text,
      });
      // 새 세션이면 ID 받기
      if (!activeSessionId && result?.session_id) {
        setActiveSessionId(result.session_id);
        await loadSessions();
      }
      // 서버 메시지로 다시 로드 (tool 메시지 포함)
      await loadMessages(result?.session_id || activeSessionId);
    } catch (e) {
      setError(e.message);
      // 실패 시 낙관적 메시지 제거
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
    ...(isHq
      ? [
          { label: "기관 관리", path: "/admin/orgs" },
          { label: "결제 관리", path: "/admin/orgs?tab=payments" },
        ]
      : []),
  ];

  return (
    <AdminLayout>
      <div className="agent-shell">
        <aside className="agent-sidebar">
          <button type="button" className="agent-new-btn" onClick={startNewSession}>
            + 새 대화
          </button>
          <div className="agent-sessions">
            {sessions.length === 0 && (
              <p className="agent-empty">아직 대화가 없습니다.</p>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`agent-session-row ${s.id === activeSessionId ? "active" : ""}`}
                onClick={() => setActiveSessionId(s.id)}
              >
                <span className="agent-session-title">{s.title || "(제목 없음)"}</span>
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
        </aside>

        <main className="agent-main">
          <header className="agent-main-header">
            <h1>AI 비서</h1>
            <p>
              자연어로 작업을 지시하시면 비서가 학습 계획표·학생·수강반을 처리합니다.
              데이터를 변경하는 작업은 실행 직전 확인을 받습니다.
            </p>
          </header>

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
            {messages
              .filter((m) => m.role !== "tool")
              .map((m) => (
                <div key={m.id} className={`agent-msg ${m.role}`}>
                  <div className="agent-msg-meta">
                    {m.role === "user" ? "운영자" : "AI 비서"}
                  </div>
                  <div className="agent-msg-body">
                    {(m.content || "").split("\n").map((line, i) => (
                      <div key={i}>{line || " "}</div>
                    ))}
                  </div>
                </div>
              ))}
            {sending && (
              <div className="agent-msg assistant">
                <div className="agent-msg-meta">AI 비서</div>
                <div className="agent-msg-body agent-typing">생각하고 있습니다…</div>
              </div>
            )}
          </div>

          <div className="agent-input">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder="비서에게 지시하세요. (Enter 전송, Shift+Enter 줄바꿈)"
              rows={3}
              disabled={sending}
            />
            <button type="button" onClick={sendMessage} disabled={sending || !draft.trim()}>
              전송
            </button>
          </div>
        </main>

        <aside className="agent-context">
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
    </AdminLayout>
  );
}

export default AdminPage;
