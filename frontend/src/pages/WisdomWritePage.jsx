import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiPost, apiUploadFile, API_BASE, TOKEN_KEY } from "../utils/api";
import ManuscriptGrid from "../components/ManuscriptGrid";
import { FREE_TOPIC_KEY, FREE_TOPIC_DEFAULT_LABEL, withFreeTopic, isFreeTopic } from "../constants/wisdomFreeTopic";
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

function WisdomWritePage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 학습 계획표 셀에서 진입한 경우 planCellId 가 채워진다.
  const planCellId = searchParams.get("planCellId");
  const fileInputRef = useRef(null);

  const [topics, setTopics] = useState([]);
  const [topicKey, setTopicKey] = useState(searchParams.get("topicKey") || "");
  // 자유 주제 — 학생이 직접 입력하는 제목
  const [freeTopicTitle, setFreeTopicTitle] = useState("");
  const [tab, setTab] = useState("manuscript");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}wisdom-topics/${levelId}.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTopics(withFreeTopic(data)))
      .catch(() => setTopics(withFreeTopic([])));
  }, [levelId]);

  const selectedTopic = topics.find((t) => t.key === topicKey);
  const isFree = isFreeTopic(topicKey);

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
    const presign = await apiPost("/v1/files/presign", {
      purpose: "wisdom",
      filename: file.name,
      mime: file.type,
      size: file.size,
    });
    const fileId = presign?.fileId || presign?.data?.fileId;
    if (fileId) {
      await apiUploadFile(fileId, file);
    }
    return fileId;
  };

  const handleSubmit = async () => {
    if (!topicKey) { setError("주제를 선택해주세요."); return; }
    if (isFree && !freeTopicTitle.trim()) {
      setError("자유 주제 제목을 입력해주세요."); return;
    }
    if (tab === "manuscript" && !content.trim()) { setError("내용을 입력해주세요."); return; }
    if (tab === "upload" && files.length === 0) { setError("파일을 선택해주세요."); return; }
    setError("");
    setUploading(true);

    try {
      let attachmentIds = [];
      if (tab === "upload") {
        attachmentIds = await Promise.all(files.map(presignAndUpload));
      }

      // 자유 주제는 topic_label 에 학생이 입력한 제목을 저장. 게시판은 같은 free_topic 키로 묶임.
      const finalTopicLabel = isFree
        ? (freeTopicTitle.trim() || FREE_TOPIC_DEFAULT_LABEL)
        : (selectedTopic?.label || topicKey);

      await apiPost("/v1/wisdom/posts", {
        level_id: levelId,
        topic_key: topicKey,
        topic_label: finalTopicLabel,
        submission_type: tab === "manuscript" ? "manuscript" : "upload",
        content: tab === "manuscript" ? content : null,
        attachment_ids: attachmentIds,
        // 학습 계획표 셀에서 진입한 경우 백엔드가 셀과 연결한다.
        plan_cell_id: planCellId || undefined,
      });

      // 학습 계획표에서 시작한 글쓰기는 학습 계획표로 복귀
      if (planCellId) {
        navigate("/study-plan");
        return;
      }

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

        {isFree && (
          <div className="wis-form-group">
            <label>자유 주제 제목 <span style={{ color: "#e74c3c" }}>*</span></label>
            <input
              type="text"
              className="wis-filter-select"
              value={freeTopicTitle}
              onChange={(e) => setFreeTopicTitle(e.target.value)}
              placeholder="내가 쓸 글의 주제(제목)를 입력하세요"
              style={{ width: "100%" }}
              maxLength={80}
            />
            <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              자유 주제 게시판은 모든 자유 주제 글이 모입니다. 익명으로 표시되며 댓글로 소통할 수 있어요.
            </p>
          </div>
        )}

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
