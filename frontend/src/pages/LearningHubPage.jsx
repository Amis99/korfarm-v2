import { Link } from "react-router-dom";
import { LEARNING_CATEGORIES } from "../data/learning/learningCatalog";
import "../styles/learning-hub.css";

function LearningHubPage() {
  return (
    <div className="learning-hub">
      <header className="learning-hub-header">
        <h1>학습 프로그램 샘플</h1>
        <p>학습 유형별 샘플을 확인하고 실행하세요.</p>
      </header>

      <div className="learning-hub-grid">
        {Object.entries(LEARNING_CATEGORIES).map(([category, items]) => (
          <section key={category} className="learning-category">
            <h2>{category}</h2>
            <div className="learning-card-grid">
              {items.map((item) => (
                <Link key={item.id} to={`/learning/${item.id}`} className="learning-card">
                  <span className="learning-card-tag">{item.contentType}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="learning-card-cta">실행하기</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default LearningHubPage;
