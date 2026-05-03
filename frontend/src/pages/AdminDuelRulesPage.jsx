import { useEffect, useState } from "react";
import { apiGet } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

function AdminDuelRulesPage({ wrap = true }) {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    apiGet("/v1/admin/duel/rules")
      .then(setRules)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const Section = ({ title, data }) => (
    <div className="admin-detail-card" style={{ marginBottom: 12 }}>
      <h3>{title}</h3>
      <table className="admin-detail-table" style={{ fontSize: 13 }}>
        <tbody>
          {Object.entries(data || {}).map(([k, v]) => (
            <tr key={k}>
              <td style={{ width: "30%", fontWeight: 600, color: "#555" }}>{k}</td>
              <td>
                {typeof v === "object" ? <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(v, null, 2)}</pre> : String(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const content = (
    <>
      <div className="admin-detail-header">
        {wrap && <h1>AI·룰</h1>}
      </div>
      {loading && <p className="admin-detail-note">불러오는 중...</p>}
      {error && <p className="admin-detail-note error">{error}</p>}
      {rules && (
        <>
          {rules._note && (
            <div className="admin-detail-note" style={{ background: "#fff3cd", color: "#856404", padding: 8, borderRadius: 4, marginBottom: 12 }}>
              ⓘ {rules._note}
            </div>
          )}
          <Section title="📐 매치 규칙" data={rules.matchRule} />
          <Section title="🤖 AI 플레이어" data={rules.aiPlayer} />
          <Section title="🔁 큐·매칭" data={rules.queue} />
          <Section title="🏆 보상" data={rules.reward} />
        </>
      )}
    </>
  );

  if (wrap) {
    return (
      <AdminLayout>
        <div className="admin-detail-wrap">{content}</div>
      </AdminLayout>
    );
  }
  return content;
}

export default AdminDuelRulesPage;
