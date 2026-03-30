import { useNavigate } from "react-router-dom";

export default function ReportRecommendations({ recommendations }) {
  const navigate = useNavigate();

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="ur-recommendations">
      <h3>추천 학습</h3>
      <div className="ur-rec-grid">
        {recommendations.map((rec, i) => (
          <div key={i} className="ur-rec-card">
            <div className="ur-rec-reason">{rec.reason}</div>
            <div className="ur-rec-items">
              {rec.items.map((item, j) => (
                <button
                  key={j}
                  className="ur-rec-item"
                  onClick={() => navigate(item.path)}
                >
                  <span className="ur-rec-item-label">{item.label}</span>
                  <span className="ur-rec-item-desc">{item.description}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
