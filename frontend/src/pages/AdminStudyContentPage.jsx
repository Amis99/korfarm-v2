import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { apiGet, apiPost, apiDelete } from "../utils/adminApi";
import { camelize } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import {
  STUDY_CONTENT_TEMPLATE,
  STUDY_QUESTIONS_TEMPLATE,
  AI_CHECKLIST_PROMPT,
  AI_QUESTION_PROMPT,
  downloadJsonFile,
  downloadTextFile,
} from "../constants/studyContentSchemas";
import "../styles/admin-detail.css";

function AdminStudyContentPage() {
  const { user } = useAuth();
  const isHq = user?.roles?.includes("HQ_ADMIN");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // 신규 작성 폼 (마크다운 + 메타)
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLevelId, setNewLevelId] = useState("RUSSELL_1");
  const [newVisibility, setNewVisibility] = useState(isHq ? "PUBLIC" : "ORG");
  const [newOwnerOrgId, setNewOwnerOrgId] = useState("");
  const [newMarkdown, setNewMarkdown] = useState("");
  const [creating, setCreating] = useState(false);

  // JSON 업로드(신규 콘텐츠 빠른 생성)
  const uploadInputRef = useRef(null);
  const [uploadError, setUploadError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await apiGet("/v1/admin/study/contents");
      // adminApi는 응답을 변환하지 않으므로 명시적 camelize
      setItems(camelize(list || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newMarkdown.trim()) {
      alert("제목과 본문은 필수입니다.");
      return;
    }
    if (newVisibility === "ORG" && isHq && !newOwnerOrgId.trim()) {
      alert("ORG 가시성으로 만들 때는 owner_org_id가 필요합니다.");
      return;
    }
    setCreating(true);
    try {
      const body = {
        title: newTitle,
        description: newDescription,
        levelId: newLevelId,
        visibility: newVisibility,
        ownerOrgId: newVisibility === "ORG" ? newOwnerOrgId || null : null,
        markdown: newMarkdown,
        evalPoints: [],
        errorPatterns: [],
      };
      const res = await apiPost("/v1/admin/study/contents", body);
      // 생성 후 에디터로 이동
      window.location.href = `/admin/study-content/editor/${res.id}`;
    } catch (e) {
      alert("생성 실패: " + e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}" 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await apiDelete(`/v1/admin/study/contents/${item.id}`);
      await load();
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  // JSON 파일을 업로드해 신규 콘텐츠 빠른 생성 → 에디터로 이동
  const handleJsonUpload = async (e) => {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // STUDY_CONTENT_TEMPLATE 스키마 검증 (필수: title, markdown)
      if (!data.title || !data.markdown) {
        throw new Error("title과 markdown 필드는 필수입니다.");
      }
      const body = {
        title: String(data.title),
        description: data.description || "",
        levelId: data.levelId || "RUSSELL_1",
        visibility: isHq ? (data.visibility || "PUBLIC") : "ORG",
        ownerOrgId: null,
        markdown: String(data.markdown),
        evalPoints: Array.isArray(data.evalPoints) ? data.evalPoints : [],
        errorPatterns: Array.isArray(data.errorPatterns) ? data.errorPatterns : [],
      };
      const res = await apiPost("/v1/admin/study/contents", body);
      window.location.href = `/admin/study-content/editor/${res.id}`;
    } catch (err) {
      setUploadError(`업로드 실패: ${err.message}`);
    } finally {
      // 같은 파일 다시 선택할 수 있게 input 초기화
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>내용 숙지 콘텐츠 관리</h1>
          <button
            type="button"
            className="ldb-btn ldb-btn-primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "닫기" : "＋ 신규 콘텐츠"}
          </button>
        </div>

        {/* 표준 양식 + AI 프롬프트 헬프 박스 */}
        <div
          className="admin-card"
          style={{
            padding: 16,
            marginBottom: 20,
            background: "#fdf6e8",
            borderLeft: "4px solid #b08850",
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <strong style={{ fontSize: 15 }}>📚 표준 양식 & AI 프롬프트</strong>
            <p style={{ fontSize: 13, color: "#5a4030", margin: "6px 0 0" }}>
              아래 프롬프트와 표준 양식을 다운받아 외부 ChatGPT/Claude에 사용하세요.
              생성된 JSON을 업로드하면 신규 콘텐츠로 바로 등록됩니다.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="ldb-btn ldb-btn-ghost"
              onClick={() => downloadTextFile(AI_CHECKLIST_PROMPT, "checklist_prompt.txt")}
            >
              📋 체크리스트 생성 프롬프트
            </button>
            <button
              type="button"
              className="ldb-btn ldb-btn-ghost"
              onClick={() => downloadTextFile(AI_QUESTION_PROMPT, "question_prompt.txt")}
            >
              📋 문제 생성 프롬프트
            </button>
            <button
              type="button"
              className="ldb-btn ldb-btn-ghost"
              onClick={() => downloadJsonFile(STUDY_CONTENT_TEMPLATE, "study_content_template.json")}
            >
              📄 콘텐츠 템플릿 JSON
            </button>
            <button
              type="button"
              className="ldb-btn ldb-btn-ghost"
              onClick={() => downloadJsonFile(STUDY_QUESTIONS_TEMPLATE, "study_questions_schema.json")}
            >
              📄 문제 스키마 JSON
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleJsonUpload}
            />
            <button
              type="button"
              className="ldb-btn ldb-btn-primary"
              onClick={() => uploadInputRef.current?.click()}
            >
              📤 콘텐츠 JSON 업로드 (신규 생성)
            </button>
          </div>
          {uploadError && (
            <p style={{ color: "#a00", marginTop: 8, fontSize: 13 }}>{uploadError}</p>
          )}
        </div>

        {showCreate && (
          <div className="admin-card" style={{ padding: 20, marginBottom: 24 }}>
            <h3>신규 학습 콘텐츠 작성</h3>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
              제목과 마크다운 본문만 먼저 등록하면, 다음 화면에서 체크리스트와 문제를 추가할 수 있습니다.
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>제목 *</div>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>설명</div>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>대상 레벨</div>
                <select value={newLevelId} onChange={(e) => setNewLevelId(e.target.value)} style={{ padding: 8 }}>
                  <option value="SAUSSURE_1">소쉬르1</option>
                  <option value="SAUSSURE_2">소쉬르2</option>
                  <option value="SAUSSURE_3">소쉬르3</option>
                  <option value="FREGE_1">프레게1</option>
                  <option value="FREGE_2">프레게2</option>
                  <option value="FREGE_3">프레게3</option>
                  <option value="RUSSELL_1">러셀1</option>
                  <option value="RUSSELL_2">러셀2</option>
                  <option value="RUSSELL_3">러셀3</option>
                  <option value="WITTGENSTEIN_1">비트겐슈타인1</option>
                  <option value="WITTGENSTEIN_2">비트겐슈타인2</option>
                  <option value="WITTGENSTEIN_3">비트겐슈타인3</option>
                </select>
              </label>
              {isHq && (
                <label>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>가시 범위</div>
                  <select value={newVisibility} onChange={(e) => setNewVisibility(e.target.value)} style={{ padding: 8 }}>
                    <option value="PUBLIC">PUBLIC (모든 유료 회원)</option>
                    <option value="ORG">ORG (특정 기관)</option>
                  </select>
                </label>
              )}
              {newVisibility === "ORG" && isHq && (
                <label>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>대상 기관 ID</div>
                  <input
                    type="text"
                    value={newOwnerOrgId}
                    onChange={(e) => setNewOwnerOrgId(e.target.value)}
                    placeholder="org_xxxx"
                    style={{ width: "100%", padding: 8 }}
                  />
                </label>
              )}
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>마크다운 본문 *</div>
                <textarea
                  rows={12}
                  value={newMarkdown}
                  onChange={(e) => setNewMarkdown(e.target.value)}
                  placeholder="# 제목&#10;&#10;본문을 마크다운으로 작성합니다."
                  style={{ width: "100%", padding: 10, fontFamily: "monospace", fontSize: 13 }}
                />
              </label>
              <button
                type="button"
                className="ldb-btn ldb-btn-primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "생성 중..." : "생성하고 편집하기"}
              </button>
            </div>
          </div>
        )}

        {error && <div className="admin-error" style={{ color: "#a00", marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <p>불러오는 중...</p>
        ) : items.length === 0 ? (
          <p style={{ color: "#888" }}>등록된 콘텐츠가 없습니다.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>레벨</th>
                <th>가시 범위</th>
                <th>기관</th>
                <th>문제 수</th>
                <th>상태</th>
                <th>생성일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/admin/study-content/editor/${item.id}`}>{item.title}</Link>
                  </td>
                  <td>{item.levelId || "-"}</td>
                  <td>{item.visibility}</td>
                  <td>{item.ownerOrgName || item.ownerOrgId || "-"}</td>
                  <td>{item.questionCount}</td>
                  <td>{item.status}</td>
                  <td>{item.createdAt?.slice(0, 10)}</td>
                  <td>
                    <button
                      type="button"
                      className="ldb-btn ldb-btn-ghost"
                      onClick={() => handleDelete(item)}
                    >
                      삭제
                    </button>
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

export default AdminStudyContentPage;
