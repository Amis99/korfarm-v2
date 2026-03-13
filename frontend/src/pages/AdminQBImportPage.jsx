import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/question-bank.css";

function AdminQBImportPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [tab, setTab] = useState("paste"); // paste | file
  const [jsonText, setJsonText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [validation, setValidation] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonText(ev.target.result);
      setTab("paste");
      setValidation(null);
      setResult(null);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleValidate = () => {
    setResult(null);
    if (!jsonText.trim()) {
      setValidation({ ok: false, errors: ["JSON을 입력하세요."] });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      setValidation({ ok: false, errors: [`JSON 파싱 오류: ${e.message}`] });
      return;
    }

    const errors = [];
    const info = [];

    // records 배열 확인
    let records = [];
    if (Array.isArray(parsed)) {
      records = parsed;
      info.push(`배열 형식: ${records.length}개 레코드`);
    } else if (parsed.records && Array.isArray(parsed.records)) {
      records = parsed.records;
      info.push(`객체 형식 (schema: ${parsed.schema_version || "미지정"}): ${records.length}개 레코드`);
    } else if (parsed.record_code || parsed.passages || parsed.questions) {
      records = [parsed];
      info.push("단일 레코드 형식");
    } else {
      errors.push("인식할 수 없는 JSON 형식입니다. records 배열 또는 단일 레코드 객체가 필요합니다.");
    }

    records.forEach((rec, idx) => {
      if (!rec.record_code) {
        info.push(`레코드 ${idx + 1}: record_code 미지정 → 자동 생성됩니다`);
      }
      const qCount = rec.questions?.length || 0;
      const pCount = rec.passages?.length || 0;
      info.push(`레코드 ${idx + 1}: 지문 ${pCount}개, 문제 ${qCount}개`);

      rec.questions?.forEach((q, qi) => {
        if (!q.stem) errors.push(`레코드 ${idx + 1} 문제 ${qi + 1}: stem(발문) 필수`);
        if (!q.question_number && q.question_number !== 0) {
          errors.push(`레코드 ${idx + 1} 문제 ${qi + 1}: question_number 필수`);
        }
      });

      rec.passages?.forEach((p, pi) => {
        if (!p.body_text) errors.push(`레코드 ${idx + 1} 지문 ${pi + 1}: body_text 필수`);
      });
    });

    setValidation({
      ok: errors.length === 0,
      errors,
      info,
      recordCount: records.length,
      parsed,
    });
  };

  const handleImport = async () => {
    if (!validation?.ok) return;
    setImporting(true);
    try {
      let body;
      const p = validation.parsed;
      if (Array.isArray(p)) {
        body = { records: p };
      } else if (p.records) {
        body = p;
      } else {
        body = { records: [p] };
      }

      const data = await apiPost("/v1/admin/question-bank/import", body);
      setResult(data);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="qb-import-wrap">
        <div className="qb-header">
          <h1>문제은행 임포트</h1>
          <button className="qb-btn" onClick={() => navigate("/admin/question-bank")}>
            <span className="material-symbols-outlined">arrow_back</span>
            목록으로
          </button>
        </div>

        <div className="qb-import-tabs">
          <button className={`qb-import-tab ${tab === "paste" ? "active" : ""}`} onClick={() => setTab("paste")}>
            붙여넣기
          </button>
          <button className={`qb-import-tab ${tab === "file" ? "active" : ""}`} onClick={() => setTab("file")}>
            파일 업로드
          </button>
        </div>

        {tab === "paste" ? (
          <textarea
            className="qb-json-area"
            placeholder={`JSON을 붙여넣으세요.\n\n지원 형식:\n1. { "records": [...] }\n2. [ {...}, {...} ]\n3. { "record_code": "...", ... } (단일)`}
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setValidation(null); setResult(null); }}
          />
        ) : (
          <div
            className={`qb-file-drop ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
          >
            <span className="material-symbols-outlined">upload_file</span>
            <p>JSON 파일을 드래그하거나 클릭하여 선택</p>
            <input ref={fileRef} type="file" accept=".json" hidden onChange={handleFileDrop} />
          </div>
        )}

        <div className="qb-import-actions">
          <button className="qb-btn" onClick={handleValidate} disabled={!jsonText.trim()}>
            <span className="material-symbols-outlined">check_circle</span>
            검증
          </button>
          <button
            className="qb-btn primary"
            onClick={handleImport}
            disabled={!validation?.ok || importing}
          >
            <span className="material-symbols-outlined">cloud_upload</span>
            {importing ? "임포트 중..." : "임포트 실행"}
          </button>
        </div>

        {validation && (
          <div className="qb-validation">
            <h3>{validation.ok ? "검증 통과" : "검증 실패"}</h3>
            {validation.info?.map((msg, i) => (
              <div key={i} className="qb-validation-item ok">
                <span className="material-symbols-outlined">info</span>
                {msg}
              </div>
            ))}
            {validation.errors?.map((msg, i) => (
              <div key={i} className="qb-validation-item error">
                <span className="material-symbols-outlined">error</span>
                {msg}
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className="qb-validation" style={{ marginTop: 12 }}>
            {result.error ? (
              <div className="qb-validation-item error">
                <span className="material-symbols-outlined">error</span>
                임포트 실패: {result.error}
              </div>
            ) : (
              <>
                <h3>임포트 완료</h3>
                <div className="qb-validation-item ok">
                  <span className="material-symbols-outlined">check_circle</span>
                  성공: {result.imported}개 / 실패: {result.failed}개
                </div>
                {result.results?.map((r, i) => (
                  <div key={i} className={`qb-validation-item ${r.success ? "ok" : "error"}`}>
                    <span className="material-symbols-outlined">
                      {r.success ? "check" : "close"}
                    </span>
                    {r.success
                      ? `${r.record_code} → ${r.record_id}`
                      : `레코드 ${r.index + 1}: ${r.error}`
                    }
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <button className="qb-btn primary" onClick={() => navigate("/admin/question-bank")}>
                    목록으로 이동
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminQBImportPage;
