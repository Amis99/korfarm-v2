import { useState, useCallback, useRef } from "react";
import { EXAM_SCHEMA } from "../../constants/manuscriptSchemas";
import { apiPost } from "../../utils/adminApi";
import VSCodeTree from "./VSCodeTree";
import JsonVisualEditor from "./JsonVisualEditor";
import SchemaDropdown, { downloadJson } from "./SchemaDropdown";

function LDBExamTab({ setToast }) {
  const [items, setItems] = useState([]); // 세션 내 시험지 목록
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [editorData, setEditorData] = useState(null);
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState("");
  const [rawError, setRawError] = useState("");
  const fileInputRef = useRef(null);
  const nextId = useRef(1);

  // 폴더 트리 노드
  const treeNodes = items.length > 0 ? [{
    id: "exams-root",
    label: `시험지 (${items.length})`,
    type: "folder",
    icon: "folder",
    children: items.map((item, idx) => ({
      id: `exam-${idx}`,
      label: item.name,
      type: "file",
      icon: "assignment",
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
    const data = structuredClone(EXAM_SCHEMA);
    const name = `새 시험지 ${nextId.current++}`;
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
    a.href = url; a.download = "시험지_일괄.zip"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── 시험지 → 문제은행 등록 ──
  const handleRegisterToQB = async () => {
    if (selectedIdx === null || !editorData) return;
    const exam = editorData;
    const meta = exam.메타 || {};
    const sets = exam.지문_세트 || [];
    const indep = exam.독립_문제 || [];

    // 지문 세트별로 문제은행 레코드 생성 (작품명 기준 분리)
    const records = [];
    for (const pSet of sets) {
      const workNames = pSet.작품명 || [];
      const passageTitle = workNames.length > 0 ? workNames.join(", ") : (pSet.지문_제목 || pSet.지문_출처 || "미지정");
      records.push({
        record_code: `EXAM-${meta.시험명 || "미지정"}-P${pSet.지문_번호}-${Date.now()}`,
        source_type: meta.시험명?.includes("수능") ? "PAST_EXAM" : meta.시험명?.includes("내신") ? "SCHOOL_EXAM" : "ETC",
        area: pSet.영역 || null,
        sub_area: pSet.세부영역 || null,
        title: passageTitle,
        author: pSet.작가 || null,
        passages: [{
          passage_code: `PAS-${pSet.지문_번호}`,
          ref_type: "FULL",
          title: passageTitle,
          body_text: pSet.지문_내용 || "",
        }],
        questions: (pSet.문제 || []).map((q) => ({
          question_number: q.문제_번호,
          question_format: q.문제_유형 === "서술형" ? "ESSAY" : q.문제_유형 === "단답형" ? "SA" : "MCQ",
          answer_type: q.문제_유형 === "객관식" ? "CHOICE" : "TEXT",
          question_type: q.문제_유형코드 || null,
          stem: q.문제_내용 || "",
          choices: q.선택지?.map((t, i) => ({ number: i + 1, text: t })),
          correct_answer: String(q.정답 || ""),
          explanation: q.해설 || "",
          passage_refs: [`PAS-${pSet.지문_번호}`],
        })),
        // 복수 작품명이면 각 작품에도 검색되도록 tags에 저장
        tags: workNames.length > 1 ? workNames : undefined,
      });
    }

    // 독립 문제도 하나의 레코드로
    if (indep.length > 0) {
      records.push({
        record_code: `EXAM-${meta.시험명 || "미지정"}-INDEP-${Date.now()}`,
        source_type: "PAST_EXAM",
        title: meta.시험명 || "독립 문제",
        questions: indep.map((q) => ({
          question_number: q.문제_번호,
          question_format: q.문제_유형 === "서술형" ? "ESSAY" : q.문제_유형 === "단답형" ? "SA" : "MCQ",
          answer_type: q.문제_유형 === "객관식" ? "CHOICE" : "TEXT",
          stem: q.문제_내용 || "",
          choices: q.선택지?.map((t, i) => ({ number: i + 1, text: t })),
          correct_answer: String(q.정답 || ""),
          explanation: q.해설 || "",
        })),
      });
    }

    if (records.length === 0) {
      setToast({ msg: "등록할 지문/문제가 없습니다.", type: "error" });
      return;
    }

    try {
      const res = await apiPost("/v1/admin/question-bank/import", {
        schema_version: "1.0",
        records,
      });
      setToast({ msg: `문제은행 등록 완료: ${res.imported}건 성공`, type: "success" });
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
        <span className="ldb-toolbar-title">시험지</span>
        <SchemaDropdown />
        <input ref={fileInputRef} type="file" accept=".json" multiple style={{ display: "none" }} onChange={handleUpload} />
        <button className="ldb-btn ldb-btn-secondary" onClick={() => fileInputRef.current?.click()}>
          <span className="material-symbols-outlined">upload_file</span>JSON 업로드
        </button>
        <button className="ldb-btn ldb-btn-primary" onClick={handleNew}>
          <span className="material-symbols-outlined">add</span>새 시험지
        </button>
        {items.length > 0 && (
          <button className="ldb-btn ldb-btn-secondary" onClick={handleBulkDownload}>
            <span className="material-symbols-outlined">folder_zip</span>일괄 다운로드
          </button>
        )}
      </div>

      <div className="ldb-body">
        <VSCodeTree
          title="시험지"
          nodes={treeNodes}
          selected={selectedIdx !== null ? `exam-${selectedIdx}` : null}
          onSelect={handleTreeSelect}
        />
        <div className="ldb-editor">
          {!editorData ? (
            <div className="ldb-editor-empty">
              상단의 '새 시험지' 또는 'JSON 업로드'로 시작하세요
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

export default LDBExamTab;
