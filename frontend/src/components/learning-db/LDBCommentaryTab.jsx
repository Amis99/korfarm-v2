import { useState, useCallback, useRef } from "react";
import { COMMENTARY_SCHEMA } from "../../constants/manuscriptSchemas";
import { apiPost } from "../../utils/adminApi";
import VSCodeTree from "./VSCodeTree";
import JsonVisualEditor from "./JsonVisualEditor";
import SchemaDropdown, { downloadJson } from "./SchemaDropdown";

function LDBCommentaryTab({ setToast }) {
  const [items, setItems] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [editorData, setEditorData] = useState(null);
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState("");
  const [rawError, setRawError] = useState("");
  const fileInputRef = useRef(null);
  const nextId = useRef(1);

  const treeNodes = items.length > 0 ? [{
    id: "commentary-root",
    label: `해설서 (${items.length})`,
    type: "folder",
    icon: "folder",
    children: items.map((item, idx) => ({
      id: `commentary-${idx}`,
      label: item.name,
      type: "file",
      icon: "menu_book",
      _idx: idx,
    }))
  }] : [];

  const handleTreeSelect = (node) => {
    if (node.type !== "file") return;
    const idx = node._idx;
    setSelectedIdx(idx);
    setEditorData(items[idx].data);
    setRawText(JSON.stringify(items[idx].data, null, 2));
    setRawMode(false);
    setRawError("");
  };

  const handleNew = () => {
    const data = structuredClone(COMMENTARY_SCHEMA);
    const name = `새 해설서 ${nextId.current++}`;
    const newItems = [...items, { name, data }];
    setItems(newItems);
    const idx = newItems.length - 1;
    setSelectedIdx(idx);
    setEditorData(data);
    setRawText(JSON.stringify(data, null, 2));
    setRawMode(false);
  };

  const handleUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";
    const newItems = [...items];
    for (const file of files) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const name = file.name.replace(/\.json$/i, "");
        newItems.push({ name, data: json });
      } catch {
        setToast({ msg: `${file.name}: JSON 파싱 실패`, type: "error" });
      }
    }
    setItems(newItems);
    if (newItems.length > items.length) {
      const idx = newItems.length - 1;
      setSelectedIdx(idx);
      setEditorData(newItems[idx].data);
      setRawText(JSON.stringify(newItems[idx].data, null, 2));
      setRawMode(false);
      setToast({ msg: `${newItems.length - items.length}건 로드 완료`, type: "success" });
    }
  }, [items, setToast]);

  const handleEditorChange = (newData) => {
    setEditorData(newData);
    if (selectedIdx !== null) {
      setItems(prev => {
        const next = [...prev];
        next[selectedIdx] = { ...next[selectedIdx], data: newData };
        return next;
      });
    }
  };

  const handleDownload = () => {
    if (selectedIdx === null || !editorData) return;
    let dataToSave = editorData;
    if (rawMode) {
      try { dataToSave = JSON.parse(rawText); }
      catch (err) { setRawError("JSON 파싱 오류: " + err.message); return; }
    }
    downloadJson(dataToSave, `${items[selectedIdx].name}.json`);
  };

  const handleBulkDownload = async () => {
    if (items.length === 0) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    items.forEach(item => zip.file(`${item.name}.json`, JSON.stringify(item.data, null, 2)));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "해설서_일괄.zip"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── 해설서 → 문제은행 등록 ──
  const handleRegisterToQB = async () => {
    if (selectedIdx === null || !editorData) return;
    const doc = editorData;
    const meta = doc.메타 || {};
    const allQuestions = [
      ...(doc.OX문제 || []).map((q) => ({ ...q, format: "MCQ", aType: "CHOICE" })),
      ...(doc.단답형 || []).map((q) => ({ ...q, format: "SA", aType: "TEXT" })),
      ...(doc.객관식 || []).map((q) => ({ ...q, format: "MCQ", aType: "CHOICE" })),
      ...(doc.서술형 || []).map((q) => ({ ...q, format: "ESSAY", aType: "MODEL_ANSWER" })),
    ];
    if (allQuestions.length === 0) {
      setToast({ msg: "등록할 문제가 없습니다.", type: "error" });
      return;
    }
    const record = {
      record_code: `COMM-${meta.해설서명 || "미지정"}-${Date.now()}`,
      source_type: "SELF_STUDY",
      title: meta.해설서명 || meta.대상_교재 || "해설서",
      author: meta.작성자 || null,
      passages: doc.본문 ? [{
        passage_code: "PAS-MAIN",
        ref_type: "FULL",
        title: meta.해설서명 || "본문",
        body_text: doc.본문,
      }] : undefined,
      questions: allQuestions.map((q, i) => ({
        question_number: q.번호 || i + 1,
        question_format: q.format,
        answer_type: q.aType,
        stem: q.문제 || "",
        choices: q.선택지?.map((t, j) => ({ number: j + 1, text: t })),
        correct_answer: String(q.답 || ""),
        explanation: q.해설 || "",
      })),
    };
    try {
      const res = await apiPost("/v1/admin/question-bank/import", {
        schema_version: "1.0",
        records: [record],
      });
      setToast({ msg: `문제은행 등록 완료: ${res.imported}건`, type: "success" });
    } catch (e) {
      setToast({ msg: "문제은행 등록 실패: " + e.message, type: "error" });
    }
  };

  const toggleRaw = () => {
    if (rawMode) {
      try { const parsed = JSON.parse(rawText); setEditorData(parsed); setRawError(""); }
      catch (e) { setRawError("JSON 파싱 오류: " + e.message); return; }
    } else {
      setRawText(JSON.stringify(editorData, null, 2));
    }
    setRawMode(v => !v);
  };

  return (
    <>
      <div className="ldb-toolbar">
        <span className="ldb-toolbar-title">해설서</span>
        <SchemaDropdown />
        <input ref={fileInputRef} type="file" accept=".json" multiple style={{ display: "none" }} onChange={handleUpload} />
        <button className="ldb-btn ldb-btn-secondary" onClick={() => fileInputRef.current?.click()}>
          <span className="material-symbols-outlined">upload_file</span>JSON 업로드
        </button>
        <button className="ldb-btn ldb-btn-primary" onClick={handleNew}>
          <span className="material-symbols-outlined">add</span>새 해설서
        </button>
        {items.length > 0 && (
          <button className="ldb-btn ldb-btn-secondary" onClick={handleBulkDownload}>
            <span className="material-symbols-outlined">folder_zip</span>일괄 다운로드
          </button>
        )}
      </div>

      <div className="ldb-body">
        <VSCodeTree
          title="해설서"
          nodes={treeNodes}
          selected={selectedIdx !== null ? `commentary-${selectedIdx}` : null}
          onSelect={handleTreeSelect}
        />
        <div className="ldb-editor">
          {!editorData ? (
            <div className="ldb-editor-empty">
              상단의 '새 해설서' 또는 'JSON 업로드'로 시작하세요
            </div>
          ) : (
            <JsonVisualEditor
              data={editorData}
              onChange={handleEditorChange}
              rawMode={rawMode}
              rawText={rawText}
              onRawTextChange={setRawText}
              rawError={rawError}
              title={selectedIdx !== null ? items[selectedIdx]?.name : ""}
              actions={
                <>
                  <button className="ldb-btn ldb-btn-ghost" onClick={toggleRaw}>
                    <span className="material-symbols-outlined">{rawMode ? "view_agenda" : "code"}</span>
                    {rawMode ? "구조화" : "Raw JSON"}
                  </button>
                  <button className="ldb-btn ldb-btn-secondary" onClick={handleDownload}>
                    <span className="material-symbols-outlined">download</span>다운로드
                  </button>
                  <button className="ldb-btn ldb-btn-primary" onClick={handleRegisterToQB}>
                    <span className="material-symbols-outlined">database</span>문제은행 등록
                  </button>
                </>
              }
            />
          )}
        </div>
      </div>
    </>
  );
}

export default LDBCommentaryTab;
