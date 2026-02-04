import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiPost } from "../utils/api";
import ManuscriptGrid from "../components/ManuscriptGrid";
import "../styles/wisdom.css";

const LEVEL_NAMES = {
  saussure1: "소쉬르 1", saussure2: "소쉬르 2", saussure3: "소쉬르 3",
  frege1: "프레게 1", frege2: "프레게 2", frege3: "프레게 3",
  russell1: "러셀 1", russell2: "러셀 2", russell3: "러셀 3",
  wittgenstein1: "비트겐슈타인 1", wittgenstein2: "비트겐슈타인 2", wittgenstein3: "비트겐슈타인 3",
};

const GRID_CONFIG = {
  saussure1: { cols: 16, rows: 20 },
  saussure2: { cols: 16, rows: 20 },
  saussure3: { cols: 16, rows: 20 },
  frege1: { cols: 20, rows: 25 },
  frege2: { cols: 20, rows: 25 },
  frege3: { cols: 20, rows: 25 },
  russell1: { cols: 20, rows: 25 },
  russell2: { cols: 20, rows: 25 },
  russell3: { cols: 20, rows: 25 },
  wittgenstein1: { cols: 20, rows: 25 },
  wittgenstein2: { cols: 20, rows: 25 },
  wittgenstein3: { cols: 20, rows: 25 },
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const TOKEN_KEY = "korfarm_token";

function WisdomWritePage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [topics, setTopics] = useState([]);
  const [topicKey, setTopicKey] = useState("");
  const [tab, setTab] = useState("manuscript");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}wisdom-topics/${levelId}.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setTopics)
      .catch(() => setTopics([]));
  }, [levelId]);

  const selectedTopic = topics.find((t) => t.key === topicKey);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    if (valid.length < selected.length) {
      setError("이미지 또는 PDF 파일만 업로드할 수 있습니다.");
    }
    setFiles((prev) => [...prev, ...valid]);
    e.target.value = "";
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const presignAndUpload = async (file) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const presignRes = await fetch(`${API_BASE}/v1/files/presign`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "wisdom", filename: file.name, mime: file.type, size: file.size }),
    });
    const presignData = await presignRes.json();
    const { fileId, uploadUrl } = presignData?.data ?? presignData;

    if (uploadUrl && !uploadUrl.startsWith("local://")) {
      await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    }
    return fileId;
  };

  const handleSubmit = async () => {
    if (!topicKey) { setError("주제를 선택해주세요."); return; }
    if (tab === "manuscript" && !content.trim()) { setError("내용을 입력해주세요."); return; }
    if (tab === "upload" && files.length === 0) { setError("파일을 선택해주세요."); return; }
    setError("");
    setUploading(true);

    try {
      let attachmentIds = [];
      if (tab === "upload") {
        attachmentIds = await Promise.all(files.map(presignAndUpload));
      }

      await apiPost("/v1/wisdom/posts", {
        level_id: levelId,
        topic_key: topicKey,
        topic_label: selectedTopic?.label || topicKey,
        submission_type: tab === "manuscript" ? "manuscript" : "upload",
        content: tab === "manuscript" ? content : null,
        attachment_ids: attachmentIds,
      });

      navigate(`/writing/${levelId}`);
    } catch (err) {
      setError(err.message || "제출에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="wisdom">
      <div className="wis-topbar">
        <div className="wis-topbar-inner">
          <Link to={`/writing/${levelId}`} className="wis-back">
            <span className="material-symbols-outlined">arrow_back</span>
            목록으로
          </Link>
          <h1 className="wis-topbar-title">{LEVEL_NAMES[levelId] || levelId} 글쓰기</h1>
        </div>
      </div>

      <div className="wis-form">
        <div className="wis-form-group">
          <label>주제 선택</label>
          <select
            className="wis-filter-select"
            value={topicKey}
            onChange={(e) => setTopicKey(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">-- 주제를 선택하세요 --</option>
            {topics.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="wis-tabs">
          <button className={`wis-tab ${tab === "manuscript" ? "active" : ""}`} onClick={() => setTab("manuscript")}>
            원고지 작성
          </button>
          <button className={`wis-tab ${tab === "upload" ? "active" : ""}`} onClick={() => setTab("upload")}>
            파일 업로드
          </button>
        </div>

        {tab === "manuscript" && (
          <ManuscriptGrid
            value={content}
            onChange={setContent}
            cols={GRID_CONFIG[levelId]?.cols || 20}
            rows={GRID_CONFIG[levelId]?.rows || 25}
          />
        )}

        {tab === "upload" && (
          <>
            <div className="wis-upload-zone" onClick={() => fileInputRef.current?.click()}>
              <span className="material-symbols-outlined">cloud_upload</span>
              <p>이미지 또는 PDF 파일을 선택하세요</p>
              <p style={{ fontSize: 12 }}>클릭하여 파일 선택</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            {files.length > 0 && (
              <div className="wis-file-list">
                {files.map((f, i) => (
                  <div key={i} className="wis-file-item">
                    <span className="material-symbols-outlined">
                      {f.type === "application/pdf" ? "picture_as_pdf" : "image"}
                    </span>
                    <span>{f.name}</span>
                    <button className="wis-file-remove" onClick={() => removeFile(i)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {error && <p style={{ color: "#e74c3c", marginTop: 12, fontSize: 14 }}>{error}</p>}

        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <button className="wis-btn" onClick={handleSubmit} disabled={uploading}>
            {uploading ? "제출 중..." : "제출하기"}
          </button>
          <Link to={`/writing/${levelId}`} className="wis-btn wis-btn-outline">취소</Link>
        </div>
      </div>
    </div>
  );
}

export default WisdomWritePage;
