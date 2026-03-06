import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/pro-mode.css";
import "../styles/answer-key.css";

function ProAnswerKeyPage() {
  const { chapterId } = useParams();
  const { isLoggedIn } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn || !chapterId) return;
    setLoading(true);
    apiGet(`/v1/pro/chapters/${chapterId}/answer-key`)
      .then((res) => {
        let payload = res.payload;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch {
            // 파싱 실패 시 그대로
          }
        }
        setData({ ...res, payload });
      })
      .catch((err) => setError(err.message || "모범답안을 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [isLoggedIn, chapterId]);

  if (loading) {
    return (
      <div className="pro">
        <div className="pro-loading">불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pro">
        <div className="pro-topbar">
          <div className="pro-topbar-inner">
            <Link to={`/pro-mode/chapter/${chapterId}`} className="pro-back">
              <span className="material-symbols-outlined">arrow_back</span>
              학습 목록
            </Link>
            <h1 className="pro-topbar-title">모범답안</h1>
          </div>
        </div>
        <div className="pro-body">
          <p className="pro-test-error">{error}</p>
        </div>
      </div>
    );
  }

  const sections = data?.payload?.sections || [];

  return (
    <div className="pro">
      <div className="pro-topbar no-print">
        <div className="pro-topbar-inner">
          <Link to={`/pro-mode/chapter/${chapterId}`} className="pro-back">
            <span className="material-symbols-outlined">arrow_back</span>
            학습 목록
          </Link>
          <h1 className="pro-topbar-title">모범답안 / 정답해설</h1>
          <button className="ak-print-btn" onClick={() => window.print()}>
            <span className="material-symbols-outlined">print</span>
            인쇄
          </button>
        </div>
      </div>

      <div className="pro-body ak-body">
        {data?.title && <h2 className="ak-main-title">{data.title}</h2>}

        {sections.length === 0 && (
          <div className="pro-center">
            <p>모범답안 데이터가 아직 등록되지 않았습니다.</p>
          </div>
        )}

        {sections.map((section, si) => (
          <div key={si} className="ak-section">
            <h3 className="ak-section-title">
              <span className="ak-section-badge">{section.title}</span>
            </h3>
            {section.groups?.map((group, gi) => (
              <div key={gi} className="ak-group">
                <h4 className="ak-group-title">{group.groupTitle}</h4>
                <div className="ak-items">
                  {group.items?.map((item, ii) => (
                    <div key={ii} className="ak-item">
                      <div className="ak-item-header">
                        <span className="ak-item-num">{item.number}</span>
                        {item.type && (
                          <span className="ak-item-type">{item.type}</span>
                        )}
                        {item.points && (
                          <span className="ak-item-pts">{item.points}점</span>
                        )}
                      </div>

                      {item.problem && (
                        <div className="ak-item-question">
                          <p>{item.problem}</p>
                        </div>
                      )}

                      {item.answer && (
                        <div className="ak-item-answer">
                          <div className="ak-label">정답</div>
                          <p className="ak-answer-text">{item.answer}</p>
                        </div>
                      )}

                      {item.modelAnswer && (
                        <div className="ak-item-model">
                          <div className="ak-label">모범답안</div>
                          <p className="ak-model-text">{item.modelAnswer}</p>
                        </div>
                      )}

                      {item.explanation && (
                        <div className="ak-item-explanation">
                          <div className="ak-label">해설</div>
                          <p>{item.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProAnswerKeyPage;
