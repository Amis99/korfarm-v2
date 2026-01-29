import { Link } from "react-router-dom";
import "../styles/start.css";

function StartPage() {
  return (
    <div className="start-page">
      <div className="start-shell">
        <header className="start-header">
          <div className="start-header-top">
            <div className="start-avatar">
              <span className="start-level">LV.12</span>
            </div>
            <div className="start-greeting">
              <h1>
                알렉스 농부님, <span>안녕하세요!</span>
              </h1>
              <div className="start-xp">
                <span>450 XP</span>
                <span>목표: 1,000</span>
              </div>
              <div className="start-progress">
                <span />
              </div>
            </div>
          </div>
          <div className="start-stats">
            <div className="start-stat">
              <span className="material-symbols-outlined">grass</span>
              <span>12 씨앗</span>
            </div>
            <div className="start-stat">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span>5 수확물</span>
            </div>
            <div className="start-stat">
              <span className="material-symbols-outlined">nutrition</span>
              <span>24 연속일</span>
            </div>
          </div>
          <div className="start-cta">
            <div>
              <strong>무제한 씨앗 받기!</strong>
              <p>프리미엄으로 더 큰 성장과 보상을 만나보세요.</p>
            </div>
            <button type="button">업그레이드</button>
          </div>
        </header>

        <div className="start-grid">
          <div className="start-section" id="free">
            <h2>
              <span className="material-symbols-outlined">school</span>
              오늘의 무료 학습
            </h2>
            <div className="start-card">
              <span className="badge">일일 퀴즈</span>
              <h3>맞춤법 퀴즈</h3>
              <p>총 10문제 도전!</p>
              <div className="start-progress-mini">
                <span />
              </div>
            </div>
            <div className="start-card">
              <span className="badge" style={{ background: "#81d4fa" }}>
                일일 독해
              </span>
              <h3>농사 일지</h3>
              <p>지문 읽는 힘을 키워요</p>
              <div className="start-progress-mini">
                <span style={{ width: "0%", background: "#81d4fa" }} />
              </div>
            </div>
            <h2 id="paid">
              <span className="material-symbols-outlined">shopping_basket</span>
              과제 바구니 (유료)
            </h2>
            <div className="start-basket">
              <div>
                <span className="badge" style={{ background: "rgba(0,0,0,0.2)" }}>
                  특별 과제
                </span>
                <h3>특별 과제 도착!</h3>
                <p>완료하고 과제 씨앗을 받아보세요.</p>
              </div>
              <button type="button">과제 보러가기</button>
            </div>
          </div>

          <aside className="start-side">
            <div className="start-rank">
              <h2>
                <span className="material-symbols-outlined">emoji_events</span>
                시즌 랭킹
              </h2>
              <ul>
                <li>1위 수민 · 5,240 수확물</li>
                <li>2위 준호 · 4,980 수확물</li>
                <li>14위 알렉스 · 450 수확물</li>
              </ul>
              <Link className="start-rank-link" to="/ranking">
                랭킹 확인
              </Link>
            </div>
            <div className="start-duel" id="duel">
              <div>
                <strong>대결하기</strong>
                <p>씨앗을 걸고 실력을 겨뤄요</p>
              </div>
              <button type="button">대결 신청</button>
            </div>
            <div className="start-card">
              <h3>씨앗 교환</h3>
              <p>씨앗 3개를 모아 수확물 1개로 교환해요</p>
              <button type="button">교환하기</button>
            </div>
            <div className="start-card" id="community">
              <h3>커뮤니티</h3>
              <p>학습 신청 · 질문 · 자료 게시판을 이용하세요.</p>
              <Link className="start-card-button" to="/community">
                게시판 이동
              </Link>
            </div>
            <div className="start-card start-shop" id="shop">
              <div className="start-shop-title">
                <span className="material-symbols-outlined">local_mall</span>
                <h3>쇼핑몰</h3>
              </div>
              <p>교재 · 교구를 한 곳에서 구매하세요.</p>
              <Link className="start-card-button" to="/shop">
                쇼핑몰 이동
              </Link>
            </div>
            <div className="start-card" id="learning-preview">
              <h3>학습 페이지 확인</h3>
              <p>구현된 학습 페이지를 미리 둘러보세요.</p>
              <Link className="start-card-button" to="/learning">
                학습 허브로 이동
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <nav className="start-nav">
        <Link className="active" to="/start">
          <span className="material-symbols-outlined">cottage</span>
          홈
        </Link>
        <a href="#free">
          <span className="material-symbols-outlined">school</span>
          무료 학습
        </a>
        <a href="#paid">
          <span className="material-symbols-outlined">stars</span>
          유료 학습
        </a>
        <a href="#duel">
          <span className="material-symbols-outlined">swords</span>
          대결
        </a>
        <a href="#community">
          <span className="material-symbols-outlined">forum</span>
          커뮤니티
        </a>
        <Link to="/shop">
          <span className="material-symbols-outlined">local_mall</span>
          쇼핑몰
        </Link>
        <Link to="/learning">
          <span className="material-symbols-outlined">task</span>
          학습 허브
        </Link>
      </nav>
    </div>
  );
}

export default StartPage;
