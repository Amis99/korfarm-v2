import { useEffect, useState } from "react";
import Modal from "../../Modal";
import { apiGet, apiPost } from "../../../utils/adminApi";
import { pollJob } from "../../../utils/aiGenJob";
import { AREA_LABELS, SUB_AREA_LABELS } from "../../../constants/questionBankCodes";
import { LEVEL_LABELS } from "../../../constants/levels";

/**
 * AI 지문 생성 모달.
 * props:
 *   open
 *   onClose
 *   defaultArea / defaultSubArea / defaultLevelId — 시험지 메타에서 가져온 기본값
 *   testId
 *   onGenerated({ text, area, subArea, title, author, summary }) — 응답 받으면 호출
 */
export default function AiPassageGenModal({ open, onClose, defaultArea, defaultSubArea, defaultLevelId, testId, onGenerated }) {
  const [area, setArea] = useState(defaultArea || "READ");
  const [subArea, setSubArea] = useState(defaultSubArea || "");
  const [levelId, setLevelId] = useState(defaultLevelId || "");
  const [targetLength, setTargetLength] = useState(600);
  const [paragraphs, setParagraphs] = useState(3);
  const [moodPrompt, setMoodPrompt] = useState("");
  const [grammarTopic, setGrammarTopic] = useState("");
  const [concepts, setConcepts] = useState([]); // 체크박스 다중 선택
  const [conceptOptions, setConceptOptions] = useState([]);
  const [grammarTopics, setGrammarTopics] = useState([]);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultArea && !area) setArea(defaultArea);
    if (defaultSubArea && !subArea) setSubArea(defaultSubArea);
    if (defaultLevelId && !levelId) setLevelId(defaultLevelId);
  }, [defaultArea, defaultSubArea, defaultLevelId]);

  // 영역에 맞는 학습 개념 fetch
  useEffect(() => {
    if (!open || !area) return;
    setLoadingConcepts(true);
    apiGet(`/v1/admin/ai-gen/learning-concepts?area=${area}${subArea ? `&subArea=${encodeURIComponent(subArea)}` : ""}`)
      .then((data) => setConceptOptions(Array.isArray(data) ? data : []))
      .catch(() => setConceptOptions([]))
      .finally(() => setLoadingConcepts(false));
    // 영역이 바뀌면 선택된 개념도 reset
    setConcepts([]);
  }, [open, area, subArea]);

  // 문법 토픽 fetch
  useEffect(() => {
    if (!open || area !== "GRAM") return;
    apiGet("/v1/admin/ai-gen/grammar-topics")
      .then((data) => setGrammarTopics(Array.isArray(data) ? data : []))
      .catch(() => setGrammarTopics([]));
  }, [open, area]);

  // 영역별 세부영역 옵션
  const subAreaOptions = Object.entries(SUB_AREA_LABELS).filter(([code]) => code.startsWith(area + "_"));

  const toggleConcept = (name) => {
    setConcepts((prev) => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };

  const handleGenerate = async () => {
    setBusy(true);
    setError("");
    try {
      const body = {
        testId,
        area,
        subArea: subArea || null,
        levelId: levelId || null,
        targetLength: Number(targetLength) || 600,
        paragraphs: Number(paragraphs) || 3,
        concepts: concepts.length > 0 ? concepts : [],
        moodPrompt: moodPrompt || null,
        grammarTopic: area === "GRAM" ? (grammarTopic || null) : null,
      };
      const submit = await apiPost("/v1/admin/ai-gen/passage", body);
      const jobId = submit?.jobId ?? submit?.job_id;
      if (!jobId) throw new Error("jobId 누락");
      // 폴링 (최대 5분, 2초 간격)
      const result = await pollJob(jobId, 150);
      onGenerated?.({
        text: result.text || "",
        area,
        subArea: subArea || null,
        title: result.title || null,
        author: result.author || null,
        summary: result.summary || null,
      });
      onClose?.();
    } catch (e) {
      setError(e.message || "생성 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="🤖 AI 지문 생성" size="lg">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <Field label="영역 *">
            <select value={area} onChange={(e) => { setArea(e.target.value); setSubArea(""); }} style={inpStyle}>
              {Object.entries(AREA_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="세부영역">
            <select value={subArea} onChange={(e) => setSubArea(e.target.value)} style={inpStyle}>
              <option value="">선택</option>
              {subAreaOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </Field>
          <Field label="학년·레벨">
            <select value={levelId} onChange={(e) => setLevelId(e.target.value)} style={inpStyle}>
              <option value="">선택</option>
              {Object.entries(LEVEL_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </Field>
          <Field label="글자 수">
            <input type="number" value={targetLength} onChange={(e) => setTargetLength(e.target.value)} style={inpStyle} />
          </Field>
          <Field label="문단 수">
            <input type="number" value={paragraphs} onChange={(e) => setParagraphs(e.target.value)} style={inpStyle} />
          </Field>
          {area === "GRAM" && (
            <Field label="문법 토픽 (RAG)">
              <select value={grammarTopic} onChange={(e) => setGrammarTopic(e.target.value)} style={inpStyle}>
                <option value="">자동/없음</option>
                {grammarTopics.map((t) => <option key={t.topic} value={t.topic}>{t.topic} ({t.count}건)</option>)}
              </select>
            </Field>
          )}
        </div>

        <Field label="강조 학습 개념 (체크박스 다중 선택)">
          {loadingConcepts ? (
            <span style={{ color: "var(--muted)", fontSize: 12 }}>불러오는 중...</span>
          ) : conceptOptions.length === 0 ? (
            <span style={{ color: "var(--muted)", fontSize: 12 }}>등록된 학습 개념 없음 (영역을 먼저 선택)</span>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {conceptOptions.map((c) => (
                <label key={c.id} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 4, cursor: "pointer",
                  fontSize: 12,
                  background: concepts.includes(c.name) ? "rgba(255,127,42,0.18)" : "var(--bg)",
                  color: concepts.includes(c.name) ? "#ff7f2a" : "var(--text)",
                  border: `1px solid ${concepts.includes(c.name) ? "rgba(255,127,42,0.4)" : "var(--stroke)"}`,
                }}>
                  <input
                    type="checkbox"
                    checked={concepts.includes(c.name)}
                    onChange={() => toggleConcept(c.name)}
                    style={{ margin: 0 }}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </Field>

        <Field label="분위기·주제 (선택)">
          <textarea
            value={moodPrompt}
            onChange={(e) => setMoodPrompt(e.target.value)}
            placeholder="예: '시험에서 흔히 나오는 사회·과학 융합 주제로, 데이터 시각화의 역사와 의의를 다루는 분석적 글'"
            style={{ ...inpStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
          />
        </Field>

        {error && <div style={{ color: "#ef4444", fontSize: 12 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} disabled={busy} className="ce-btn ce-btn-secondary">취소</button>
          <button onClick={handleGenerate} disabled={busy} className="ce-btn ce-btn-primary">
            {busy ? "생성 중... (10~30초 소요)" : "🤖 생성"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>
          모델: Claude Sonnet 4.6. AI 문체 억제·학습 개념 강조·학년 수준 자동 적용.
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
      {children}
    </label>
  );
}

const inpStyle = {
  padding: "6px 10px", fontSize: 13,
  background: "var(--bg)", color: "var(--text)",
  border: "1px solid var(--stroke)", borderRadius: 4,
};
