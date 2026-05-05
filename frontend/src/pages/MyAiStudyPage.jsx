import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import SiteFooter from "../components/SiteFooter";
import "../styles/admin.css";

const LEVELS = [
  { id: "saussure1", label: "소쉬르 1 (초1)" }, { id: "saussure2", label: "소쉬르 2 (초2)" }, { id: "saussure3", label: "소쉬르 3 (초3)" },
  { id: "frege1", label: "프레게 1 (초4)" }, { id: "frege2", label: "프레게 2 (초5)" }, { id: "frege3", label: "프레게 3 (초6)" },
  { id: "russell1", label: "러셀 1 (중1)" }, { id: "russell2", label: "러셀 2 (중2)" }, { id: "russell3", label: "러셀 3 (중3)" },
  { id: "wittgenstein1", label: "비트겐슈타인 1 (고1)" }, { id: "wittgenstein2", label: "비트겐슈타인 2 (고2)" }, { id: "wittgenstein3", label: "비트겐슈타인 3 (고3)" },
];

const CROP_LABELS = { crop_wheat: "🌾 밀", crop_rice: "🍙 쌀", crop_corn: "🌽 옥수수", crop_grape: "🍇 포도", crop_apple: "🍎 사과" };

export default function MyAiStudyPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [balance, setBalance] = useState({ grapefruits: 0, crops: {} });
  const [loading, setLoading] = useState(true);

  // 신규 작성 폼
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [levelId, setLevelId] = useState("russell1");
  const [markdown, setMarkdown] = useState("");
  const [tier, setTier] = useState("BASIC");
  const [counts, setCounts] = useState({ mcq: 5, ox: 0, short: 0, essay: 0 });
  const [currency, setCurrency] = useState("grapefruit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const reload = async () => {
    setLoading(true);
    try {
      const [items, bal] = await Promise.all([
        apiGet("/v1/me/study/contents").catch(() => []),
        apiGet("/v1/me/grapefruit/balance").catch(() => ({ grapefruits: 0, crops: {} })),
      ]);
      setList(Array.isArray(items) ? items : []);
      setBalance(bal);
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const totalQ = counts.mcq + counts.ox + counts.short + counts.essay;
  const packages = Math.ceil(totalQ / 5);
  const pricePerPkg = tier === "ADVANCED" ? 8 : 2;
  const ckPrice = tier === "ADVANCED" ? 4 : 1;
  const totalCost = packages * pricePerPkg + ckPrice;

  const submit = async () => {
    if (!title.trim() || !markdown.trim()) { setError("제목·본문 모두 필수"); return; }
    if (totalQ <= 0 || totalQ > 30) { setError("문항 1~30 사이"); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      // 1) 콘텐츠 생성
      const content = await apiPost("/v1/me/study/contents", {
        title, markdown, levelId,
        sourceType: "manual",
        evalPoints: [],
        errorPatterns: [],
        visibility: "OWN",
      });
      // 2) AI 문제 생성
      await apiPost(`/v1/me/study/contents/${content.id}/generate-questions`, {
        pageMarkdown: markdown,
        levelId,
        mcqCount: counts.mcq,
        oxCount: counts.ox,
        shortCount: counts.short,
        essayCount: counts.essay,
        tier,
        currency,
      });
      setMessage("학습 생성 시작! 잠시 후 목록에서 결과를 확인할 수 있어요.");
      setShowForm(false);
      setTitle(""); setMarkdown(""); setCounts({ mcq: 5, ox: 0, short: 0, essay: 0 });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 24 }}>📚</span> 내 AI 학습 만들기
      </h1>
      <p style={{ color: "#666", fontSize: 13 }}>
        본문을 입력하고 AI 가 자동으로 체크포인트와 문제를 생성합니다. 자몽 또는 학습으로 모은 작물로 결제할 수 있어요.
      </p>

      <div style={{ padding: 12, background: "#fff5e6", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
        🍊 자몽 <strong>{balance.grapefruits}</strong>
        {Object.entries(balance.crops || {}).filter(([, v]) => v > 0).map(([k, v]) => (
          <span key={k} style={{ marginLeft: 12 }}>{CROP_LABELS[k] || k} <strong>{v}</strong></span>
        ))}
        <Link to="/my/grapefruit" style={{ marginLeft: 12, color: "#2f7a3e", fontSize: 12 }}>충전</Link>
      </div>

      {error && <div style={{ padding: 10, background: "#fee", color: "#c00", borderRadius: 4, marginBottom: 12 }}>{error}</div>}
      {message && <div style={{ padding: 10, background: "#efe", color: "#2f7a3e", borderRadius: 4, marginBottom: 12 }}>{message}</div>}

      {!showForm && (
        <button onClick={() => setShowForm(true)} style={{ padding: "10px 20px", background: "#2f7a3e", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
          + 새 AI 학습 만들기
        </button>
      )}

      {showForm && (
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8, marginBottom: 24, background: "#fafafa" }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>신규 AI 학습</h2>

          <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>제목 *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4, marginBottom: 10 }} />

          <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>레벨</label>
          <select value={levelId} onChange={(e) => setLevelId(e.target.value)}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4, marginBottom: 10 }}>
            {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>

          <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>본문 (마크다운) *</label>
          <textarea rows={10} value={markdown} onChange={(e) => setMarkdown(e.target.value)}
            placeholder="학습할 글 본문을 입력하세요..."
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4, marginBottom: 10, fontFamily: "monospace" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600 }}>객관식</label>
              <input type="number" min="0" max="30" value={counts.mcq} onChange={(e) => setCounts({ ...counts, mcq: parseInt(e.target.value || "0") })} style={{ width: "100%", padding: 6, border: "1px solid #ccc", borderRadius: 4 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600 }}>OX</label>
              <input type="number" min="0" max="30" value={counts.ox} onChange={(e) => setCounts({ ...counts, ox: parseInt(e.target.value || "0") })} style={{ width: "100%", padding: 6, border: "1px solid #ccc", borderRadius: 4 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600 }}>단답</label>
              <input type="number" min="0" max="30" value={counts.short} onChange={(e) => setCounts({ ...counts, short: parseInt(e.target.value || "0") })} style={{ width: "100%", padding: 6, border: "1px solid #ccc", borderRadius: 4 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600 }}>서술</label>
              <input type="number" min="0" max="30" value={counts.essay} onChange={(e) => setCounts({ ...counts, essay: parseInt(e.target.value || "0") })} style={{ width: "100%", padding: 6, border: "1px solid #ccc", borderRadius: 4 }} />
            </div>
          </div>

          <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>난이도(모델)</label>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <label style={{ fontSize: 13 }}><input type="radio" checked={tier === "BASIC"} onChange={() => setTier("BASIC")} /> 일반 (Sonnet — 5문항당 2자몽)</label>
            <label style={{ fontSize: 13 }}><input type="radio" checked={tier === "ADVANCED"} onChange={() => setTier("ADVANCED")} /> 고급 (Opus — 5문항당 8자몽)</label>
          </div>

          <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>결제 수단</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4, marginBottom: 12 }}>
            <option value="grapefruit">🍊 자몽 ({balance.grapefruits}개)</option>
            {Object.entries(balance.crops || {}).filter(([, v]) => v > 0).map(([k, v]) => (
              <option key={k} value={k}>{CROP_LABELS[k] || k} ({v}개)</option>
            ))}
          </select>

          <div style={{ padding: 10, background: "#fff", border: "1px solid #ddd", borderRadius: 4, marginBottom: 12, fontSize: 13 }}>
            💰 예상 비용: 체크포인트 {ckPrice} + 문항 {packages}패키지 × {pricePerPkg} = <strong>{totalCost}</strong> {currency === "grapefruit" ? "자몽" : (CROP_LABELS[currency] || currency).split(" ")[0]}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} disabled={busy} style={{ padding: "8px 16px", background: "none", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}>취소</button>
            <button onClick={submit} disabled={busy} style={{ padding: "8px 16px", background: "#2f7a3e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>
              {busy ? "생성 중..." : "AI 학습 생성"}
            </button>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 16 }}>내가 만든 학습 ({list.length}건)</h2>
      {loading ? <p>불러오는 중...</p> : list.length === 0 ? (
        <p style={{ color: "#888", fontSize: 13 }}>아직 만든 학습이 없습니다.</p>
      ) : (
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: 8, textAlign: "left" }}>제목</th>
              <th style={{ padding: 8 }}>레벨</th>
              <th style={{ padding: 8 }}>문항 수</th>
              <th style={{ padding: 8 }}>생성일</th>
              <th style={{ padding: 8 }}>학습</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8, fontWeight: 600 }}>{c.title}</td>
                <td style={{ padding: 8, textAlign: "center" }}>{LEVELS.find(l => l.id === c.levelId)?.label || c.levelId}</td>
                <td style={{ padding: 8, textAlign: "center" }}>{c.questionCount}</td>
                <td style={{ padding: 8, fontSize: 11 }}>{c.createdAt?.slice(0, 16).replace("T", " ")}</td>
                <td style={{ padding: 8, textAlign: "center" }}>
                  {c.questionCount > 0 ? (
                    <button onClick={() => navigate(`/study-learning/${c.id}`)}
                      style={{ padding: "4px 10px", background: "#2f7a3e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                      학습 시작
                    </button>
                  ) : <span style={{ color: "#999", fontSize: 11 }}>생성 중</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <SiteFooter />
    </div>
  );
}
