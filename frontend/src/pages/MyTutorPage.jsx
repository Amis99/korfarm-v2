import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiDelete, apiGet, apiPatch, apiPost } from "../utils/api";
import "../styles/admin.css";

/**
 * /my/tutor — 학생 AI 튜터 채팅 화면.
 * 좌측: 세션 목록
 * 중앙: 채팅 + 입력
 * 우측: 자몽/작물 잔액 + 통화 선택 + 안내
 */
function MyTutorPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [currency, setCurrency] = useState("grapefruit");
  const scrollRef = useRef(null);

  const loadSessions = async () => {
    try {
      const data = await apiGet("/v1/tutor/sessions");
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const loadMessages = async (sid) => {
    if (!sid) {
      setMessages([]);
      return;
    }
    try {
      const data = await apiGet(`/v1/tutor/sessions/${sid}/messages`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const loadStatus = async () => {
    try {
      const data = await apiGet("/v1/tutor/status");
      setStatus(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSessions();
    loadStatus();
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
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    // 잔액 사전 점검
    if (status) {
      const has = currency === "grapefruit"
        ? (status.grapefruits || 0) >= (status.price_per_turn || 1)
        : (status.crops?.[currency.replace("crop_", "")] || 0) >= (status.price_per_turn || 1);
      if (!has) {
        setError("선택한 통화 잔액이 부족합니다. 자몽 지갑에서 충전 또는 다른 통화 선택.");
        return;
      }
    }

    setSending(true);
    setError("");
    const optimistic = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      const result = await apiPost("/v1/tutor/turns", {
        sessionId: activeSessionId,
        message: text,
        currency,
      });
      if (!activeSessionId && result?.session_id) {
        setActiveSessionId(result.session_id);
        await loadSessions();
      }
      await loadMessages(result?.session_id || activeSessionId);
      loadStatus();
    } catch (e) {
      setError(e.message);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
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
      await apiPatch(`/v1/tutor/sessions/${sid}`, { title: next });
      await loadSessions();
    } catch (e) {
      setError(e.message);
    }
  };

  const archiveSession = async (sid) => {
    if (!window.confirm("이 대화를 보관(숨김)하시겠습니까?")) return;
    try {
      await apiDelete(`/v1/tutor/sessions/${sid}`);
      if (activeSessionId === sid) startNewSession();
      await loadSessions();
    } catch (e) {
      setError(e.message);
    }
  };

  const cropOptions = Object.entries(status?.crops || {}).filter(([, v]) => v > 0);

  return (
    <div className="agent-shell" style={{ padding: 16, minHeight: "calc(100vh - 32px)" }}>
      <aside className="agent-sidebar">
        <button type="button" className="agent-new-btn" onClick={startNewSession}>+ 새 대화</button>
        <div className="agent-sessions">
          {sessions.length === 0 && <p className="agent-empty">아직 대화가 없어요.</p>}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`agent-session-row ${s.id === activeSessionId ? "active" : ""}`}
              onClick={() => setActiveSessionId(s.id)}
            >
              <span className="agent-session-title">{s.title || "(제목 없음)"}</span>
              <div className="agent-session-actions">
                <button type="button" onClick={(e) => { e.stopPropagation(); renameSession(s.id); }}>이름</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); archiveSession(s.id); }}>보관</button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="agent-main">
        <header className="agent-main-header">
          <h1>AI 튜터</h1>
          <p>모르는 개념이나 풀이가 막힌 문제를 자유롭게 물어봐. 1번 대화에 자몽 또는 작물 1개가 차감돼.</p>
        </header>

        {error && <div className="agent-error">{error}</div>}

        <div className="agent-thread" ref={scrollRef}>
          {messages.length === 0 && !sending && (
            <div className="agent-greeting">
              <h2>안녕! 무엇이 궁금해?</h2>
              <p>이렇게 물어볼 수 있어:</p>
              <ul>
                <li>"추론적 독해가 뭐야?"</li>
                <li>"내 약점 역량이 뭐야? 그거 보강하는 학습 추천해 줘."</li>
                <li>"콘텐츠 ID dq-russell1-d12 의 3번 문제 풀이 알려줘."</li>
              </ul>
            </div>
          )}
          {messages.map((m, idx) => {
            if (m.role === "tool") {
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
            if (m.role === "assistant_tool_use") return null;
            return (
              <div key={m.id} className={`agent-msg ${m.role}`}>
                <div className="agent-msg-meta">{m.role === "user" ? "나" : "튜터"}</div>
                <div className="agent-msg-body">
                  {m.role === "assistant" ? (
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children, ...props }) => {
                          const isInternal = href && href.startsWith("/");
                          if (isInternal) {
                            return (
                              <a
                                href={href}
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(href);
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
                    (m.content || "").split("\n").map((line, i) => <div key={i}>{line || " "}</div>)
                  )}
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="agent-msg assistant">
              <div className="agent-msg-meta">튜터</div>
              <div className="agent-msg-body agent-typing">생각하고 있어…</div>
            </div>
          )}
        </div>

        <div className="agent-input">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="질문을 입력해 (Enter 전송, Shift+Enter 줄바꿈)"
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
          <h3>지불 통화 선택</h3>
          <div className="agent-quick" style={{ gap: 4 }}>
            <label>
              <input
                type="radio"
                name="currency"
                value="grapefruit"
                checked={currency === "grapefruit"}
                onChange={(e) => setCurrency(e.target.value)}
              />
              {" "}🍊 자몽 (잔액 {status?.grapefruits ?? "-"})
            </label>
            {cropOptions.map(([k, v]) => (
              <label key={k}>
                <input
                  type="radio"
                  name="currency"
                  value={`crop_${k}`}
                  checked={currency === `crop_${k}`}
                  onChange={(e) => setCurrency(e.target.value)}
                />
                {" "}🌾 {k} (잔액 {v})
              </label>
            ))}
          </div>
          <p className="agent-help">
            1회 대화 = {status?.price_per_turn ?? 1}개. <Link to="/my/grapefruit">자몽 충전</Link>
          </p>
        </section>

        <section className="agent-card">
          <h3>나의 사용</h3>
          <ul className="agent-briefing">
            <li>
              <span>총 대화 횟수</span>
              <strong>{status?.total_turns ?? 0}회</strong>
            </li>
            <li>
              <span>1회 단가</span>
              <strong>{status?.price_per_turn ?? 1}개</strong>
            </li>
          </ul>
        </section>

        <section className="agent-card">
          <h3>이런 것도 할 수 있어</h3>
          <div className="agent-quick">
            <button type="button" onClick={() => setDraft("내 약점 역량을 알려주고 보강 학습을 추천해 줘.")}>
              약점 보강 추천 받기
            </button>
            <button type="button" onClick={() => setDraft("최근 내가 푼 학습 보여줘.")}>
              최근 학습 이력
            </button>
            <button type="button" onClick={() => navigate("/start")}>홈으로</button>
          </div>
        </section>
      </aside>
    </div>
  );
}

export default MyTutorPage;
