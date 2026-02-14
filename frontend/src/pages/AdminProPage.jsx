import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/test-storage.css";

const COURSE_LEVELS = [
  { id: "saussure1", name: "소쉬르1" },
  { id: "saussure2", name: "소쉬르2" },
  { id: "saussure3", name: "소쉬르3" },
  { id: "frege1", name: "프레게1" },
  { id: "frege2", name: "프레게2" },
  { id: "frege3", name: "프레게3" },
  { id: "russell1", name: "러셀1" },
  { id: "russell2", name: "러셀2" },
  { id: "russell3", name: "러셀3" },
  { id: "wittgenstein1", name: "비트겐슈타인1" },
  { id: "wittgenstein2", name: "비트겐슈타인2" },
  { id: "wittgenstein3", name: "비트겐슈타인3" },
];

const LEVEL_NAME_MAP = Object.fromEntries(COURSE_LEVELS.map(l => [l.id, l.name]));

const ITEM_TYPES = [
  { value: "reading", label: "독해 모드" },
  { value: "vocab", label: "어휘 학습" },
  { value: "background", label: "배경지식" },
  { value: "logic", label: "논리 사고력" },
  { value: "answer", label: "모범답안/정답해설" },
  { value: "test", label: "챕터별 테스트" },
];

function AdminProPage() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState("");

  // 챕터 생성 폼
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    levelId: "", bookNumber: 1, chapterNumber: 1, globalChapterNumber: 1, title: "", description: "",
  });
  const [creating, setCreating] = useState(false);

  // 챕터 상세 (아이템/테스트 관리)
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  // 아이템 설정
  const [items, setItems] = useState([]);

  // 테스트 등록
  const [testVersion, setTestVersion] = useState(1);
  const [testPaperId, setTestPaperId] = useState("");
  const [testPapers, setTestPapers] = useState([]);

  const load = () => {
    setLoading(true);
    const qs = levelFilter ? `?levelId=${levelFilter}` : "";
    apiGet(`/v1/admin/pro/chapters${qs}`)
      .then(setChapters)
      .catch(() => setChapters([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [levelFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiPost("/v1/admin/pro/chapters", {
        levelId: form.levelId,
        bookNumber: Number(form.bookNumber),
        chapterNumber: Number(form.chapterNumber),
        globalChapterNumber: Number(form.globalChapterNumber),
        title: form.title,
        description: form.description || null,
      });
      setShowCreate(false);
      setForm({ levelId: "", bookNumber: 1, chapterNumber: 1, globalChapterNumber: 1, title: "", description: "" });
      load();
    } catch (err) {
      alert(err.message || "생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const openDetail = (ch) => {
    setSelectedChapter(ch);
    setEditTitle(ch.title);
    setEditDesc(ch.description || "");
    setEditStatus(ch.status);
    // 기본 6종 아이템 초기화
    setItems(ITEM_TYPES.map((t, i) => ({ type: t.value, contentId: "", order: i + 1 })));
    setTestVersion(1);
    setTestPaperId("");
    // 시험지 목록 불러오기
    apiGet("/v1/admin/test-papers")
      .then(setTestPapers)
      .catch(() => setTestPapers([]));
  };

  const handleUpdateChapter = async () => {
    try {
      await apiPut(`/v1/admin/pro/chapters/${selectedChapter.id}`, {
        title: editTitle,
        description: editDesc || null,
        status: editStatus,
      });
      alert("수정 완료");
      setSelectedChapter(null);
      load();
    } catch (err) {
      alert(err.message || "수정에 실패했습니다.");
    }
  };

  const handleSetItems = async () => {
    try {
      await apiPost(`/v1/admin/pro/chapters/${selectedChapter.id}/items`, {
        items: items.map(it => ({
          type: it.type,
          contentId: it.contentId || null,
          order: it.order,
        })),
      });
      alert("학습 아이템 설정 완료");
    } catch (err) {
      alert(err.message || "아이템 설정에 실패했습니다.");
    }
  };

  const handleRegisterTest = async () => {
    if (!testPaperId) { alert("시험지를 선택하세요."); return; }
    try {
      await apiPost(`/v1/admin/pro/chapters/${selectedChapter.id}/tests`, {
        version: Number(testVersion),
        testPaperId,
      });
      alert(`버전 ${testVersion} 테스트 등록 완료`);
      setTestVersion(v => v + 1);
      setTestPaperId("");
    } catch (err) {
      alert(err.message || "테스트 등록에 실패했습니다.");
    }
  };

  // 챕터 상세 모달
  if (selectedChapter) {
    return (
      <AdminLayout>
        <div className="ts-page ts-admin">
          <header className="ts-header">
            <h1>챕터 상세 — {selectedChapter.title}</h1>
            <button className="ts-btn ts-btn-outline" onClick={() => setSelectedChapter(null)}>
              <span className="material-symbols-outlined">arrow_back</span> 목록으로
            </button>
          </header>

          {/* 챕터 정보 수정 */}
          <section style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>챕터 정보 수정</h3>
            <div className="ts-form-grid">
              <label>
                제목
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </label>
              <label>
                상태
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </label>
              <label className="ts-form-full">
                설명
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} />
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="ts-btn ts-btn-primary" onClick={handleUpdateChapter}>저장</button>
            </div>
          </section>

          {/* 학습 아이템 설정 */}
          <section style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>학습 아이템 설정</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
              각 유형의 contentId(learningCatalog ID)를 입력하세요. 저장 시 기존 아이템을 덮어씁니다.
            </p>
            <table className="ts-table" style={{ marginBottom: 12 }}>
              <thead>
                <tr>
                  <th>순서</th>
                  <th>유형</th>
                  <th>콘텐츠 ID</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.type}>
                    <td>{item.order}</td>
                    <td>{ITEM_TYPES.find(t => t.value === item.type)?.label || item.type}</td>
                    <td>
                      <input
                        style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                        placeholder={item.type === "test" ? "(테스트 — 별도 등록)" : "콘텐츠 ID"}
                        value={item.contentId}
                        disabled={item.type === "test"}
                        onChange={e => {
                          const next = [...items];
                          next[idx] = { ...next[idx], contentId: e.target.value };
                          setItems(next);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="ts-btn ts-btn-primary" onClick={handleSetItems}>아이템 저장</button>
          </section>

          {/* 테스트 버전 등록 */}
          <section style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>챕터 테스트 버전 등록</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
              테스트 관리에서 시험지를 먼저 생성한 뒤, 아래에서 선택하세요.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                버전
                <input
                  type="number" min={1} value={testVersion}
                  onChange={e => setTestVersion(e.target.value)}
                  style={{ width: 80, padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
                시험지 선택
                <select
                  value={testPaperId}
                  onChange={e => setTestPaperId(e.target.value)}
                  style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                >
                  <option value="">-- 시험지 선택 --</option>
                  {testPapers.map(tp => (
                    <option key={tp.testId} value={tp.testId}>
                      {tp.title} ({tp.testId})
                    </option>
                  ))}
                </select>
              </label>
              <button className="ts-btn ts-btn-primary" onClick={handleRegisterTest}>등록</button>
            </div>
          </section>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="ts-page ts-admin">
        <header className="ts-header">
          <h1>프로 모드 챕터 관리</h1>
          <button className="ts-btn ts-btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <span className="material-symbols-outlined">add</span> 챕터 추가
          </button>
        </header>

        {/* 레벨 필터 */}
        <div style={{ marginBottom: 16 }}>
          <select
            className="ts-level-select"
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
          >
            <option value="">전체 레벨</option>
            {COURSE_LEVELS.map(lv => (
              <option key={lv.id} value={lv.id}>{lv.name}</option>
            ))}
          </select>
        </div>

        {/* 챕터 생성 폼 */}
        {showCreate && (
          <form className="ts-create-form" onSubmit={handleCreate}>
            <div className="ts-form-grid">
              <label>
                레벨 *
                <select required value={form.levelId} onChange={e => setForm(f => ({ ...f, levelId: e.target.value }))}>
                  <option value="">선택</option>
                  {COURSE_LEVELS.map(lv => (
                    <option key={lv.id} value={lv.id}>{lv.name}</option>
                  ))}
                </select>
              </label>
              <label>
                권(Book) 번호
                <input type="number" min={1} value={form.bookNumber} onChange={e => setForm(f => ({ ...f, bookNumber: e.target.value }))} />
              </label>
              <label>
                챕터 번호
                <input type="number" min={1} value={form.chapterNumber} onChange={e => setForm(f => ({ ...f, chapterNumber: e.target.value }))} />
              </label>
              <label>
                전체 챕터 번호
                <input type="number" min={1} value={form.globalChapterNumber} onChange={e => setForm(f => ({ ...f, globalChapterNumber: e.target.value }))} />
              </label>
              <label className="ts-form-full">
                제목 *
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </label>
              <label className="ts-form-full">
                설명
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </label>
            </div>
            <div className="ts-form-actions">
              <button type="submit" className="ts-btn ts-btn-primary" disabled={creating}>
                {creating ? "생성 중..." : "생성"}
              </button>
              <button type="button" className="ts-btn ts-btn-outline" onClick={() => setShowCreate(false)}>취소</button>
            </div>
          </form>
        )}

        {/* 챕터 목록 테이블 */}
        {loading ? (
          <div className="ts-center"><p>불러오는 중...</p></div>
        ) : chapters.length === 0 ? (
          <div className="ts-center"><p>등록된 챕터가 없습니다.</p></div>
        ) : (
          <table className="ts-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>레벨</th>
                <th>권</th>
                <th>챕터</th>
                <th>제목</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map(ch => (
                <tr
                  key={ch.id}
                  className="ts-clickable-row"
                  onClick={() => openDetail(ch)}
                >
                  <td>{ch.globalChapterNumber}</td>
                  <td>{LEVEL_NAME_MAP[ch.levelId] || ch.levelId}</td>
                  <td>{ch.bookNumber}권</td>
                  <td>{ch.chapterNumber}장</td>
                  <td>{ch.title}</td>
                  <td>
                    <span style={{
                      padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: ch.status === "active" ? "#dcfce7" : "#f1f5f9",
                      color: ch.status === "active" ? "#166534" : "#94a3b8",
                    }}>
                      {ch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminProPage;
