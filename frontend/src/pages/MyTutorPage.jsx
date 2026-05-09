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
  const [dailyAnalysis, setDailyAnalysis] = useState(null);
  const scrollRef = useRef(null);

  const loadSessions = async (autoSelectLatest = false) => {
    try {
      const data = await apiGet("/v1/tutor/sessions");
      const list = Array.isArray(data) ? data : [];
      setSessions(list);
      if (autoSelectLatest && list.length > 0) {
        setActiveSessionId(list[0].id);
      }
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

  const triggerDailyAnalysis = async () => {
    try {
      const data = await apiPost("/v1/tutor/daily-analysis", {});
      if (data && !data.alreadyUsedToday) {
        setDailyAnalysis(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSessions(true); // 첫 진입 — 가장 최근 대화 자동 선택
    loadStatus();
    triggerDailyAnalysis();
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
          {sessions.length === 0 && (
            <div className="agent-empty">
              <img
                className="agent-empty-illu"
                src={import.meta.env.BASE_URL + "images/tutor/mytutor-empty-sessions.png"}
                alt=""
              />
              <p>아직 대화가 없어요.</p>
            </div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`agent-session-row ${s.id === activeSessionId ? "active" : ""}`}
              onClick={() => setActiveSessionId(s.id)}
            >
              <span className="agent-session-title">{s.title || "(제목 없음)"}</span>
              <span style={{ display: "block", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                {formatSessionTime(s.updatedAt || s.updated_at || s.createdAt || s.created_at)}
              </span>
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
          <p>
            오늘 무료 대화 {status?.dailyFreeRemaining ?? "-"} / {status?.dailyFreeLimit ?? 5} 남음.
            {" "}한도 초과 후에는 1번 대화당 자몽 또는 작물 1개 차감.
          </p>
        </header>

        {dailyAnalysis && !dailyAnalysis.alreadyUsedToday && (
          <div className="agent-error" style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>오늘의 학습 분석</div>
            {dailyAnalysis.summary && <div style={{ marginBottom: 6 }}>{dailyAnalysis.summary}</div>}
            {dailyAnalysis.weakAreas?.length > 0 && (
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
                약점: {dailyAnalysis.weakAreas.join(" / ")}
              </div>
            )}
            {dailyAnalysis.recommendations?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {dailyAnalysis.recommendations.map(rec => (
                  <button
                    key={rec.contentId}
                    onClick={() => navigate(rec.url)}
                    style={{
                      padding: "4px 10px", fontSize: 12,
                      background: "#fff", color: "#1e40af",
                      border: "1px solid #93c5fd", borderRadius: 4, cursor: "pointer",
                    }}
                  >📚 {rec.title}</button>
                ))}
              </div>
            )}
            <button
              onClick={() => setDailyAnalysis(null)}
              style={{ marginTop: 6, fontSize: 11, background: "transparent", border: 0, color: "#64748b", cursor: "pointer" }}
            >닫기</button>
          </div>
        )}

        {error && <div className="agent-error">{error}</div>}

        <div className="agent-thread" ref={scrollRef}>
          {messages.length === 0 && !sending && (
            <div className="agent-greeting">
              <img
                className="agent-greeting-illu"
                src={import.meta.env.BASE_URL + "images/tutor/mytutor-greeting-hero.png"}
                alt=""
              />
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
                          // 내부 경로(상대 / 절대 URL 둘 다 같은 호스트) → react-router navigate.
                          // 새 탭으로 열면 sessionStorage 가 비어 401 → 자동 로그아웃 사고 방지.
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
