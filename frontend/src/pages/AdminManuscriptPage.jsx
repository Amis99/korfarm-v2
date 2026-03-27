import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { apiGet, apiPut, apiPost } from "../utils/adminApi";
import {
  LEVEL_ORDER, LEVEL_NAMES, LEVEL_GROUPS,
  DOWNLOADABLE_SCHEMAS, EXAM_SCHEMA, COMMENTARY_SCHEMA,
  getSchemaForLevel
} from "../constants/manuscriptSchemas";
import "../styles/admin-manuscript.css";

const MODES = [
  { key: "textbook", label: "교재 원고" },
  { key: "exam", label: "시험지" },
  { key: "commentary", label: "해설서" },
];

// ─── snake_case → camelCase 정규화 ───
function normalizeItem(raw) {
  return {
    contentId: raw.content_id ?? raw.contentId,
    levelId: raw.level_id ?? raw.levelId,
    dayIndex: raw.day_index ?? raw.dayIndex,
    title: raw.title,
  };
}

// ─── 섹션 순서 정렬: 스키마 키 순서 기준, 메타 항상 최상단 ───
function sortBySchema(data, levelId) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const schema = getSchemaForLevel(levelId);
  const schemaKeys = Object.keys(schema);
  const dataKeys = Object.keys(data);
  // 스키마 순서대로 먼저, 그 다음 스키마에 없는 키, 메타는 무조건 최상단
  const sorted = {};
  const orderedKeys = [
    ...schemaKeys.filter(k => dataKeys.includes(k)),
    ...dataKeys.filter(k => !schemaKeys.includes(k))
  ];
  // 메타를 맨 앞으로
  const metaIdx = orderedKeys.indexOf("메타");
  if (metaIdx > 0) { orderedKeys.splice(metaIdx, 1); orderedKeys.unshift("메타"); }
  for (const k of orderedKeys) sorted[k] = data[k];
  return sorted;
}

// ─── 유틸 ───
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function downloadZip(files, zipName) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  files.forEach(({ name, data }) => zip.file(name, JSON.stringify(data, null, 2)));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = zipName; a.click();
  URL.revokeObjectURL(url);
}

// ─── 토스트 ───
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return <div className={`ms-toast ${type}`}>{msg}</div>;
}

// ─── 스키마 다운로드 드롭다운 ───
function SchemaDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAll = async () => {
    setOpen(false);
    const files = DOWNLOADABLE_SCHEMAS.map(s => ({ name: `${s.label}.json`, data: s.schema }));
    await downloadZip(files, "전체_표준_스키마.zip");
  };

  return (
    <div className="ms-dropdown" ref={ref}>
      <button className="ms-btn ms-btn-secondary" onClick={() => setOpen(v => !v)}>
        <span className="material-symbols-outlined">download</span>표준 스키마
      </button>
      {open && (
        <div className="ms-dropdown-menu">
          {DOWNLOADABLE_SCHEMAS.map(s => (
            <button key={s.key} className="ms-dropdown-item" onClick={() => { downloadJson(s.schema, `${s.label}.json`); setOpen(false); }}>
              {s.label}
            </button>
          ))}
          <div className="ms-dropdown-divider" />
          <button className="ms-dropdown-item" onClick={handleAll}>전체 스키마 (ZIP)</button>
        </div>
      )}
    </div>
  );
}

// ─── 필드 추가 인라인 폼 ───
function AddFieldForm({ onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("string");
  const submit = () => {
    const key = name.trim();
    if (!key) return;
    const defaults = { string: "", number: 0, boolean: false, array: [], object: {} };
    onAdd(key, defaults[type] ?? "");
    setName(""); setType("string");
  };
  return (
    <div className="ms-add-field">
      <input type="text" placeholder="키 이름" value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }} autoFocus />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="string">텍스트</option>
        <option value="number">숫자</option>
        <option value="boolean">참/거짓</option>
        <option value="array">배열</option>
        <option value="object">객체</option>
      </select>
      <button className="ms-btn ms-btn-primary" style={{ padding: "4px 10px" }} onClick={submit}>추가</button>
      <button className="ms-btn ms-btn-ghost" style={{ padding: "4px 8px" }} onClick={onCancel}>취소</button>
    </div>
  );
}

// ─── 재귀적 JSON 편집기 ───
function JsonEditor({ data, onChange, depth = 0 }) {
  const [adding, setAdding] = useState(false);

  if (data === null || data === undefined) return null;

  if (typeof data === "string") {
    const isLong = data.length > 80 || data.includes("\n");
    return isLong
      ? <textarea value={data} onChange={e => onChange(e.target.value)} />
      : <input type="text" value={data} onChange={e => onChange(e.target.value)} />;
  }
  if (typeof data === "number") {
    return <input type="number" value={data} onChange={e => onChange(Number(e.target.value) || 0)} />;
  }
  if (typeof data === "boolean") {
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
        <input type="checkbox" checked={data} onChange={e => onChange(e.target.checked)} /> {data ? "true" : "false"}
      </label>
    );
  }
  if (Array.isArray(data)) {
    return (
      <div>
        {data.map((item, i) => (
          <div key={i} className="ms-arr-item">
            <div className="ms-arr-item-header">
              <span className="ms-arr-item-num">#{i + 1}</span>
              <div className="ms-arr-item-actions">
                <button title="삭제" onClick={() => { const next = [...data]; next.splice(i, 1); onChange(next); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              </div>
            </div>
            <JsonEditor data={item} depth={depth + 1} onChange={v => { const next = [...data]; next[i] = v; onChange(next); }} />
          </div>
        ))}
        <button className="ms-arr-add" onClick={() => {
          const template = data.length > 0 ? structuredClone(data[0]) : "";
          if (typeof template === "object" && template !== null) {
            for (const k of Object.keys(template)) {
              if (typeof template[k] === "string") template[k] = "";
              else if (typeof template[k] === "number") template[k] = 0;
              else if (Array.isArray(template[k])) template[k] = [];
            }
          }
          onChange([...data, template]);
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>항목 추가
        </button>
      </div>
    );
  }
  if (typeof data === "object") {
    const removeKey = (key) => {
      const next = { ...data };
      delete next[key];
      onChange(next);
    };
    return (
      <div className={depth > 0 ? "ms-obj-fields" : ""}>
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className={`ms-field ${typeof val === "string" && (val.length > 80 || val.includes("\n")) ? "ms-field-long" : ""}`}>
            <div className="ms-field-label-row">
              <label className="ms-field-label">{key}</label>
              <button className="ms-field-remove" title="필드 삭제" onClick={() => removeKey(key)}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
              </button>
            </div>
            <JsonEditor data={val} depth={depth + 1} onChange={v => onChange({ ...data, [key]: v })} />
          </div>
        ))}
        {adding ? (
          <AddFieldForm
            onAdd={(key, val) => { onChange({ ...data, [key]: val }); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button className="ms-arr-add" onClick={() => setAdding(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>필드 추가
          </button>
        )}
      </div>
    );
  }
  return <input type="text" value={String(data)} onChange={e => onChange(e.target.value)} />;
}

// ─── 섹션별 아코디언 편집기 ───
function SectionEditor({ sectionKey, data, onChange, onRemove }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ms-section">
      <div className="ms-section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer" }} onClick={() => setOpen(v => !v)}>
          <span className={`material-symbols-outlined ${open ? "rotated" : ""}`}>chevron_right</span>
          <span>{sectionKey}</span>
        </div>
        {onRemove && (
          <button className="ms-field-remove" title="섹션 삭제" onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{ marginRight: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
          </button>
        )}
      </div>
      <div className={`ms-section-body ${open ? "" : "collapsed"}`}>
        <JsonEditor data={data} onChange={onChange} />
      </div>
    </div>
  );
}

// ─── 수정 이력 모달 ───
function EditHistoryModal({ contentId, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!contentId) return;
    setLoading(true);
    apiGet(`/v1/admin/content/${contentId}/edit-history`)
      .then(data => setLogs(data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [contentId]);

  const fmtDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="ms-modal-backdrop" onClick={onClose}>
      <div className="ms-modal" onClick={e => e.stopPropagation()}>
        <div className="ms-modal-header">
          <span className="ms-modal-title">수정 이력</span>
          <button className="ms-field-remove" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="ms-modal-body">
          {loading ? (
            <div className="ms-loading">불러오는 중...</div>
          ) : logs.length === 0 ? (
            <div style={{ color: "#6a7a6e", textAlign: "center", padding: 20 }}>이력이 없습니다</div>
          ) : (
            <table className="ms-log-table">
              <thead>
                <tr><th>일시</th><th>작업</th><th>작업자</th><th>요약</th></tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id || i}>
                    <td>{fmtDate(log.created_at ?? log.createdAt)}</td>
                    <td><span className={`ms-log-action ${(log.action || "").toLowerCase()}`}>{log.action}</span></td>
                    <td>{log.editor_name ?? log.editorName ?? log.editor_id ?? log.editorId ?? "-"}</td>
                    <td>{log.summary || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 최상위 섹션 추가 ───
function AddSectionForm({ onAdd }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("object");
  const submit = () => {
    const key = name.trim();
    if (!key) return;
    const defaults = { string: "", number: 0, boolean: false, array: [], object: {} };
    onAdd(key, defaults[type] ?? "");
    setName(""); setType("object"); setShow(false);
  };
  if (!show) {
    return (
      <button className="ms-arr-add" style={{ marginTop: 8 }} onClick={() => setShow(true)}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>섹션 추가
      </button>
    );
  }
  return (
    <div className="ms-add-field" style={{ marginTop: 8 }}>
      <input type="text" placeholder="섹션 이름 (예: 본문, 날개, 메타...)" value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") setShow(false); }} autoFocus />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="object">객체</option>
        <option value="string">텍스트</option>
        <option value="number">숫자</option>
        <option value="array">배열</option>
        <option value="boolean">참/거짓</option>
      </select>
      <button className="ms-btn ms-btn-primary" style={{ padding: "4px 10px" }} onClick={submit}>추가</button>
      <button className="ms-btn ms-btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setShow(false)}>취소</button>
    </div>
  );
}

// ─── 폴더 트리 (교재 모드) ───
function FolderTree({ manuscripts, selected, onSelect }) {
  const [openFolders, setOpenFolders] = useState({});
  const grouped = {};
  LEVEL_ORDER.forEach(lv => { grouped[lv] = []; });
  manuscripts.forEach(m => { if (m.levelId && grouped[m.levelId]) grouped[m.levelId].push(m); });

  const toggle = lv => setOpenFolders(prev => ({ ...prev, [lv]: !prev[lv] }));

  return (
    <div className="ms-tree">
      {LEVEL_GROUPS.map(g => (
        <div key={g.group}>
          <div style={{ padding: "6px 12px", fontSize: 11, color: "#6a7a6e", fontWeight: 700, textTransform: "uppercase" }}>{g.group}</div>
          {g.levels.map(lv => {
            const items = grouped[lv] || [];
            const isOpen = openFolders[lv];
            return (
              <div key={lv} className="ms-tree-group">
                <div className="ms-tree-folder" onClick={() => toggle(lv)}>
                  <span className="material-symbols-outlined">{isOpen ? "folder_open" : "folder"}</span>
                  {LEVEL_NAMES[lv]} ({items.length})
                </div>
                <div className={`ms-tree-items ${isOpen ? "open" : ""}`}>
                  {items.sort((a, b) => (a.dayIndex || 0) - (b.dayIndex || 0)).map(m => (
                    <div key={m.contentId} className={`ms-tree-item ${selected === m.contentId ? "active" : ""}`} onClick={() => onSelect(m)}>
                      <span className="material-symbols-outlined">description</span>
                      챕터{m.dayIndex}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── 메인 페이지 ───
function AdminManuscriptPage() {
  const [mode, setMode] = useState("textbook");
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editorData, setEditorData] = useState(null);
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState("");
  const [rawError, setRawError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [bulkDlOpen, setBulkDlOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bulkRef = useRef(null);

  const fileInputRef = useRef(null);

  // 원고 목록 로드
  const loadManuscripts = useCallback(() => {
    setLoading(true);
    apiGet("/v1/admin/manuscripts")
      .then(data => setManuscripts((data || []).map(normalizeItem)))
      .catch(() => setToast({ msg: "원고 목록 로드 실패", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mode !== "textbook") return;
    loadManuscripts();
  }, [mode, loadManuscripts]);

  // 항목 선택 → 상세 로드
  const handleSelect = useCallback(async (item) => {
    setSelectedItem(item);
    setRawMode(false);
    setRawError("");
    try {
      setLoading(true);
      const preview = await apiGet(`/v1/admin/content/${item.contentId}/preview`);
      const json = preview.content || preview.content_json || {};
      const raw = json.manuscript || json;
      const manuscript = sortBySchema(raw, item.levelId);
      setEditorData(manuscript);
      setRawText(JSON.stringify(manuscript, null, 2));
    } catch {
      setToast({ msg: "원고 로드 실패", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  // JSON 파일 업로드
  const handleUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";

    const items = [];
    for (const file of files) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        // 파일명에서 레벨/챕터 추출: "소쉬르1 (챕터3).json" → saussure1, 3
        const nameMatch = file.name.match(/(.+?)\s*[\(（].*?(\d+)[\)）]/);
        let levelId = null;
        let dayIndex = null;
        if (nameMatch) {
          const korName = nameMatch[1].trim();
          dayIndex = parseInt(nameMatch[2]);
          const entry = Object.entries(LEVEL_NAMES).find(([, v]) => v === korName);
          if (entry) levelId = entry[0];
        }
        // 또는 JSON 내 메타에서 추출
        const meta = json.메타 || {};
        if (!levelId && meta.과정) {
          const entry = Object.entries(LEVEL_NAMES).find(([, v]) => v === meta.과정);
          if (entry) levelId = entry[0];
        }
        if (!dayIndex && meta.챕터) dayIndex = Number(meta.챕터);

        if (!levelId || !dayIndex) {
          setToast({ msg: `${file.name}: 레벨/챕터 정보를 추출할 수 없습니다`, type: "error" });
          continue;
        }
        const levelName = LEVEL_NAMES[levelId] || levelId;
        items.push({
          contentType: "PRO_MANUSCRIPT",
          levelId,
          area: "MANUSCRIPT",
          subArea: "RAW",
          dayIndex,
          moduleKey: "manuscript",
          schemaVersion: "1.0",
          content: {
            title: `${levelName} ${dayIndex}장`,
            contentType: "PRO_MANUSCRIPT",
            targetLevel: levelId,
            chapterNumber: dayIndex,
            manuscript: json
          }
        });
      } catch (err) {
        setToast({ msg: `${file.name}: JSON 파싱 실패`, type: "error" });
      }
    }

    if (items.length === 0) return;
    setToast({ msg: `${items.length}건 업로드 중...`, type: "success" });
    try {
      const result = await apiPost("/v1/admin/content/batch-import", { items });
      const imported = result.imported ?? result.imported_count ?? items.length;
      setToast({ msg: `${imported}건 업로드 완료`, type: "success" });
      loadManuscripts();
    } catch {
      setToast({ msg: "업로드 실패", type: "error" });
    }
  }, [loadManuscripts]);

  // 저장
  const handleSave = useCallback(async () => {
    if (!selectedItem || !editorData) return;
    let dataToSave = editorData;
    if (rawMode) {
      try { dataToSave = JSON.parse(rawText); setRawError(""); }
      catch (e) { setRawError("JSON 파싱 오류: " + e.message); return; }
    }
    setSaving(true);
    try {
      await apiPut(`/v1/admin/content/${selectedItem.contentId}`, {
        content_type: "PRO_MANUSCRIPT",
        schema_version: "1.0",
        level_id: selectedItem.levelId,
        day_index: selectedItem.dayIndex,
        content: {
          title: selectedItem.title,
          contentType: "PRO_MANUSCRIPT",
          manuscript: dataToSave
        }
      });
      setEditorData(dataToSave);
      setRawText(JSON.stringify(dataToSave, null, 2));
      setToast({ msg: "저장 완료", type: "success" });
    } catch {
      setToast({ msg: "저장 실패", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [selectedItem, editorData, rawMode, rawText]);

  // 개별 다운로드
  const handleDownload = useCallback(() => {
    if (!selectedItem || !editorData) return;
    const levelName = LEVEL_NAMES[selectedItem.levelId] || selectedItem.levelId;
    downloadJson(editorData, `${levelName} (챕터${selectedItem.dayIndex}).json`);
  }, [selectedItem, editorData]);

  // 레벨 일괄 다운로드
  const handleBulkDownload = useCallback(async (levelId) => {
    setBulkDlOpen(false);
    const items = manuscripts.filter(m => m.levelId === levelId).sort((a, b) => (a.dayIndex || 0) - (b.dayIndex || 0));
    if (items.length === 0) { setToast({ msg: "해당 레벨에 원고가 없습니다", type: "error" }); return; }
    setToast({ msg: `${LEVEL_NAMES[levelId]} 다운로드 준비중...`, type: "success" });
    try {
      const files = [];
      for (const item of items) {
        const preview = await apiGet(`/v1/admin/content/${item.contentId}/preview`);
        const json = preview.content || {};
        const manuscript = json.manuscript || json;
        files.push({ name: `${LEVEL_NAMES[levelId]} (챕터${item.dayIndex}).json`, data: manuscript });
      }
      await downloadZip(files, `${LEVEL_NAMES[levelId]}_원고.zip`);
      setToast({ msg: "다운로드 완료", type: "success" });
    } catch {
      setToast({ msg: "일괄 다운로드 실패", type: "error" });
    }
  }, [manuscripts]);

  // bulk dropdown 외부 클릭 닫기
  useEffect(() => {
    const handler = e => { if (bulkRef.current && !bulkRef.current.contains(e.target)) setBulkDlOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Raw ↔ 구조화 전환
  const toggleRaw = () => {
    if (rawMode) {
      try { const parsed = JSON.parse(rawText); setEditorData(parsed); setRawError(""); }
      catch (e) { setRawError("JSON 파싱 오류: " + e.message); return; }
    } else {
      setRawText(JSON.stringify(editorData, null, 2));
    }
    setRawMode(v => !v);
  };

  // 시험지/해설서 신규 생성
  const handleNewDoc = (schema, name) => {
    const data = structuredClone(schema);
    setSelectedItem({ contentId: null, levelId: null, dayIndex: null, title: name });
    setEditorData(data);
    setRawText(JSON.stringify(data, null, 2));
    setRawMode(false);
  };

  const renderEditor = () => {
    if (loading) return <div className="ms-loading"><span className="material-symbols-outlined">hourglass_empty</span>불러오는 중...</div>;
    if (!editorData) return <div className="ms-editor-empty">좌측에서 항목을 선택하세요</div>;

    const levelName = selectedItem?.levelId ? LEVEL_NAMES[selectedItem.levelId] : "";
    const title = levelName ? `${levelName} (챕터${selectedItem.dayIndex})` : selectedItem?.title || "";

    return (
      <>
        <div className="ms-editor-header">
          <span className="ms-editor-title">{title}</span>
          <div className="ms-editor-actions">
            {selectedItem?.contentId && (
              <button className="ms-btn ms-btn-ghost" onClick={() => setHistoryOpen(true)}>
                <span className="material-symbols-outlined">history</span>이력
              </button>
            )}
            <button className="ms-btn ms-btn-ghost" onClick={toggleRaw}>
              <span className="material-symbols-outlined">{rawMode ? "view_agenda" : "code"}</span>
              {rawMode ? "구조화" : "Raw JSON"}
            </button>
            <button className="ms-btn ms-btn-secondary" onClick={handleDownload}>
              <span className="material-symbols-outlined">download</span>다운로드
            </button>
            <button className="ms-btn ms-btn-primary" onClick={handleSave} disabled={saving}>
              <span className="material-symbols-outlined">save</span>{saving ? "저장중..." : "저장"}
            </button>
          </div>
        </div>
        {rawMode ? (
          <div className="ms-raw">
            <textarea className="ms-field" value={rawText} onChange={e => setRawText(e.target.value)} />
            {rawError && <div className="ms-raw-error">{rawError}</div>}
          </div>
        ) : (
          <>
            {Object.entries(editorData).map(([key, val]) => (
              <SectionEditor key={key} sectionKey={key} data={val}
                onChange={v => setEditorData(prev => ({ ...prev, [key]: v }))}
                onRemove={() => setEditorData(prev => { const next = { ...prev }; delete next[key]; return next; })} />
            ))}
            <AddSectionForm onAdd={(key, val) => setEditorData(prev => ({ ...prev, [key]: val }))} />
          </>
        )}
      </>
    );
  };

  return (
    <AdminLayout>
      <div className="ms-page">
        {/* 탭 */}
        <div className="ms-tabs">
          {MODES.map(m => (
            <button key={m.key} className={`ms-tab ${mode === m.key ? "active" : ""}`}
              onClick={() => { setMode(m.key); setSelectedItem(null); setEditorData(null); }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* 툴바 */}
        <div className="ms-toolbar">
          <span className="ms-toolbar-title">
            {mode === "textbook" ? "교재 원고" : mode === "exam" ? "시험지" : "해설서"}
          </span>
          <SchemaDropdown />

          {mode === "textbook" && (
            <>
            <input ref={fileInputRef} type="file" accept=".json" multiple style={{ display: "none" }} onChange={handleUpload} />
            <button className="ms-btn ms-btn-primary" onClick={() => fileInputRef.current?.click()}>
              <span className="material-symbols-outlined">upload_file</span>JSON 업로드
            </button>
            <div className="ms-dropdown" ref={bulkRef}>
              <button className="ms-btn ms-btn-secondary" onClick={() => setBulkDlOpen(v => !v)}>
                <span className="material-symbols-outlined">folder_zip</span>레벨 일괄 다운로드
              </button>
              {bulkDlOpen && (
                <div className="ms-dropdown-menu">
                  {LEVEL_ORDER.map(lv => (
                    <button key={lv} className="ms-dropdown-item" onClick={() => handleBulkDownload(lv)}>
                      {LEVEL_NAMES[lv]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </>
          )}

          {mode === "exam" && (
            <button className="ms-btn ms-btn-primary" onClick={() => handleNewDoc(EXAM_SCHEMA, "새 시험지")}>
              <span className="material-symbols-outlined">add</span>새 시험지
            </button>
          )}
          {mode === "commentary" && (
            <button className="ms-btn ms-btn-primary" onClick={() => handleNewDoc(COMMENTARY_SCHEMA, "새 해설서")}>
              <span className="material-symbols-outlined">add</span>새 해설서
            </button>
          )}
        </div>

        {/* 본문 */}
        <div className="ms-body">
          {mode === "textbook" && (
            <FolderTree manuscripts={manuscripts} selected={selectedItem?.contentId} onSelect={handleSelect} />
          )}

          {(mode === "exam" || mode === "commentary") && (
            <div className="ms-tree" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#6a7a6e", fontSize: 13, textAlign: "center", padding: 20 }}>
              {mode === "exam" ? "상단의 '새 시험지' 버튼으로 시작하세요" : "상단의 '새 해설서' 버튼으로 시작하세요"}
            </div>
          )}

          <div className="ms-editor">
            {renderEditor()}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {historyOpen && selectedItem?.contentId && (
        <EditHistoryModal contentId={selectedItem.contentId} onClose={() => setHistoryOpen(false)} />
      )}
    </AdminLayout>
  );
}

export default AdminManuscriptPage;
