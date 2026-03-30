import { useNavigate } from "react-router-dom";

export default function ReportRecommendations({ recommendations }) {
  const navigate = useNavigate();

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="ur-recommendations">
      <h3>추천 학습</h3>
      <p className="ur-rec-reason">{recommendations[0]?.reason}</p>
      <div className="ur-rec-grid">
        {recommendations.flatMap((rec) => rec.items).map((item, i) => (
          <button
            key={i}
            className="ur-rec-item"
            onClick={() => navigate(item.path)}
          >
            <span className="ur-rec-item-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
