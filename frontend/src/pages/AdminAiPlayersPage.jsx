import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import EmoticonImage from "../components/chat/EmoticonImage";
import { apiGet, apiPut } from "../utils/api";
import "../styles/admin-detail.css";

/**
 * 대결 모드 AI 플레이어 — 능력치 슬라이더(0.7~1.0).
 * 정답 확률 = 그 문제의 학생 정답률(없으면 100%) × 능력치
 * 이름·이모티콘 시리즈는 코드 고정. 능력치만 어드민에서 조절.
 */
function AdminAiPlayersPage({ wrap = true }) {
  const [players, setPlayers] = useState([]);
  const [draft, setDraft] = useState({}); // { id: accuracy }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiGet("/v1/admin/duel/ai-players");
      const list = Array.isArray(r) ? r : (r?.data || []);
      setPlayers(list);
      const initial = {};
      list.forEach((p) => { initial[p.id] = p.accuracy; });
      setDraft(initial);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const dirty = players.some((p) => Math.abs((draft[p.id] ?? p.accuracy) - p.accuracy) > 0.0001);

  const save = async () => {
    setSaving(true);
    try {
      const body = players.map((p) => ({ id: p.id, accuracy: draft[p.id] ?? p.accuracy }));
      await apiPut("/v1/admin/duel/ai-players", body);
      setSavedAt(new Date());
      await load();
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    const initial = {};
    players.forEach((p) => { initial[p.id] = p.accuracy; });
    setDraft(initial);
  };

  const content = (
    <div className="admin-detail-wrap">
      {wrap && (
        <div className="admin-detail-header">
          <h1>AI 플레이어 능력치</h1>
        </div>
      )}

      <div style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 16,
        fontSize: 13,
        lineHeight: 1.6,
        color: "#334155",
      }}>
        <strong>정답 확률 계산식</strong> &nbsp; <code>= base × 능력치</code><br/>
        <span style={{ color: "#64748b" }}>
          • <b>base</b> : 그 문제의 학생(AI 제외) 누적 정답률. 풀린 적 없으면 1.0(100%)<br/>
          • <b>능력치</b> : 아래 슬라이더로 0.7~1.0 사이 설정. 학생 정답률이 90%면 능력치 0.9 인 AI 의 실제 정답 확률은 0.81
        </span>
      </div>

      {loading && <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>불러오는 중…</div>}

      {!loading && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {players.map((p) => {
              const v = draft[p.id] ?? p.accuracy;
              return (
                <div key={p.id} style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: "50%",
                    overflow: "hidden", border: "3px solid #6366f1",
                    background: "#f1f5f9", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    marginBottom: 12,
                  }}>
                    {p.avatarFileId ? (
                      <EmoticonImage fileId={p.avatarFileId} alt={p.name} className="ai-avatar" />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#94a3b8" }}>smart_toy</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>{p.emoticonSeries}</div>

                  <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>능력치</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1e6fdc" }}>{Math.round(v * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.7}
                      max={1.0}
                      step={0.01}
                      value={v}
                      onChange={(e) => setDraft({ ...draft, [p.id]: parseFloat(e.target.value) })}
                      style={{ width: "100%" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                      <span>70%</span><span>85%</span><span>100%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="admin-detail-btn primary"
              style={{ opacity: !dirty || saving ? 0.5 : 1 }}
            >
              {saving ? "저장 중…" : "저장"}
            </button>
            <button
              onClick={reset}
              disabled={!dirty || saving}
              className="admin-detail-btn"
              style={{ opacity: !dirty || saving ? 0.5 : 1 }}
            >
              되돌리기
            </button>
            {savedAt && (
              <span style={{ fontSize: 12, color: "#16a34a", marginLeft: 8 }}>
                저장됨 ({savedAt.toLocaleTimeString()})
              </span>
            )}
          </div>

          <div style={{ marginTop: 24, padding: 12, background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, fontSize: 12, color: "#854d0e" }}>
            <b>참고</b> &nbsp; 이름과 프로필 이미지는 채팅 이모티콘 시리즈에 연결돼 있어 어드민에서 변경 불가.
            바꾸려면 채팅 이모티콘 시리즈를 추가/수정한 뒤 코드 default 매핑을 갱신해야 합니다.
          </div>
        </>
      )}
    </div>
  );

  return wrap ? <AdminLayout>{content}</AdminLayout> : content;
}

export default AdminAiPlayersPage;
