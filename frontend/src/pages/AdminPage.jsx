import { Link } from "react-router-dom";
import "../styles/admin.css";

const SUMMARY = [
  { label: "오늘 가입자", value: "128" },
  { label: "활성 사용자", value: "4,820" },
  { label: "유료 전환율", value: "7.2%" },
  { label: "월 구독 매출", value: "₩8.4M" },
];

const RECENT_USERS = [
  { name: "김서연", grade: "초4", status: "active" },
  { name: "이준호", grade: "중1", status: "trial" },
  { name: "박예은", grade: "초6", status: "inactive" },
];

const REPORTS = [
  { type: "게시글", title: "학습 자료 승인", status: "대기" },
  { type: "공지", title: "설문 공지 등록", status: "검토" },
  { type: "과제", title: "중간 평가 채점", status: "처리" },
];

const FLAGS = [
  "feature.duel.mode",
  "feature.paid.pro_mode",
  "feature.paid.writing",
  "feature.season.ranking",
];

function AdminPage() {
  return (
    <div className="admin-page">
      <div className="admin-shell">
        <aside className="admin-side">
          <div className="admin-brand" aria-label="국어농장 Admin">
            <img className="admin-logo" src={import.meta.env.BASE_URL + "korfarm-logo.png"} alt="국어농장" />
            <span>Admin</span>
          </div>
          <nav className="admin-nav">
            <a className="active" href="#dashboard">
              <span className="material-symbols-outlined">dashboard</span>
              대시보드
            </a>
            <a href="#users">
              <span className="material-symbols-outlined">group</span>
              학생 관리
            </a>
            <a href="#content">
              <span className="material-symbols-outlined">menu_book</span>
              콘텐츠
            </a>
            <a href="#billing">
              <span className="material-symbols-outlined">receipt_long</span>
              결제/구독
            </a>
            <a href="#ops">
              <span className="material-symbols-outlined">tune</span>
              운영 설정
            </a>
            <Link to="/admin/wisdom">
              <span className="material-symbols-outlined">menu_book</span>
              지식과 지혜
            </Link>
            <Link to="/">랜딩</Link>
            <Link to="/start">스타트</Link>
          </nav>
        </aside>

        <main className="admin-main">
          <div className="admin-topbar">
            <div>
              <h1>운영 대시보드</h1>
              <p>오늘의 운영 지표와 처리 현황을 확인하세요.</p>
            </div>
            <div className="admin-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="학생/기관/콘텐츠 검색" />
            </div>
          </div>

          <section className="admin-summary" id="dashboard">
            {SUMMARY.map((item) => (
              <div className="admin-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <span className="admin-pill">이번 주 +12%</span>
              </div>
            ))}
          </section>

          <section className="admin-grid" id="users">
            <div className="admin-card">
              <h2>최근 가입 학생</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>학년</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_USERS.map((user) => (
                    <tr key={user.name}>
                      <td>{user.name}</td>
                      <td>{user.grade}</td>
                      <td>{user.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-card">
              <h2>처리할 보고서</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>유형</th>
                    <th>내용</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {REPORTS.map((report) => (
                    <tr key={report.title}>
                      <td>{report.type}</td>
                      <td>{report.title}</td>
                      <td>{report.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-grid" id="ops">
            <div className="admin-card">
              <h2>운영 플래그</h2>
              {FLAGS.map((flag) => (
                <div className="admin-toggle" key={flag}>
                  <div>
                    <strong>{flag}</strong>
                    <p>롤아웃 100% 활성</p>
                  </div>
                  <button className="admin-action" type="button">
                    설정
                  </button>
                </div>
              ))}
            </div>
            <div className="admin-card" id="content">
              <h2>콘텐츠 파이프라인</h2>
              <div className="admin-inline">
                <div>
                  <strong>검토 대기</strong>
                  <p>42건</p>
                </div>
                <div>
                  <strong>배포 예정</strong>
                  <p>7건</p>
                </div>
              </div>
              <p>오늘 오후 6시에 프로 모드 3챕터가 자동 배포됩니다.</p>
              <button className="admin-action" type="button">
                배포 일정 확인
              </button>
            </div>
          </section>

          <section className="admin-card" id="billing">
            <h2>구독 상태 요약</h2>
            <p>오늘 결제 32건, 환불 요청 4건, 결제 실패 2건</p>
            <button className="admin-action" type="button">
              결제 센터 열기
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
