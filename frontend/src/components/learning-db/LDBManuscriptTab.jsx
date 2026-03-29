import { useState, useEffect, useCallback, useRef } from "react";
import { apiGet, apiPut, apiPost } from "../../utils/adminApi";
import {
  LEVEL_ORDER, LEVEL_NAMES, LEVEL_GROUPS,
} from "../../constants/manuscriptSchemas";
import VSCodeTree from "./VSCodeTree";
import JsonVisualEditor from "./JsonVisualEditor";
import SchemaDropdown, { downloadJson, downloadZip } from "./SchemaDropdown";
import EditHistoryModal from "./EditHistoryModal";

function normalizeItem(raw) {
  return {
    contentId: raw.content_id ?? raw.contentId,
    levelId: raw.level_id ?? raw.levelId,
    dayIndex: raw.day_index ?? raw.dayIndex,
    title: raw.title,
  };
}

function LDBManuscriptTab({ setToast }) {
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editorData, setEditorData] = useState(null);
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState("");
  const [rawError, setRawError] = useState("");
  const [saving, setSaving] = useState(false);
  const [bulkDlOpen, setBulkDlOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bulkRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadManuscripts = useCallback(() => {
    setLoading(true);
    apiGet("/v1/admin/manuscripts")
      .then(data => setManuscripts((data || []).map(normalizeItem)))
      .catch(() => setToast({ msg: "원고 목록 로드 실패", type: "error" }))
      .finally(() => setLoading(false));
  }, [setToast]);

  useEffect(() => { loadManuscripts(); }, [loadManuscripts]);

  // 폴더 트리 노드 구성
  const treeNodes = LEVEL_GROUPS.map(g => ({
    id: `group-${g.group}`,
    label: g.group,
    type: "group",
    selectable: false,
    children: g.levels.map(lv => {
      const items = manuscripts.filter(m => m.levelId === lv).sort((a, b) => (a.dayIndex || 0) - (b.dayIndex || 0));
      return {
        id: `level-${lv}`,
        label: `${LEVEL_NAMES[lv]} (${items.length})`,
        type: "folder",
        icon: "folder",
        selectable: false,
        children: items.map(m => ({
          id: m.contentId,
          label: `챕터${m.dayIndex}`,
          type: "file",
          icon: "description",
          _data: m,
        }))
      };
    })
  }));

  const handleTreeSelect = useCallback(async (node) => {
    if (node.type !== "file" || !node._data) return;
    const item = node._data;
    setSelectedItem(item);
    setRawMode(false);
    setRawError("");
    try {
      setLoading(true);
      const preview = await apiGet(`/v1/admin/content/${item.contentId}/preview`);
      const json = preview.content || preview.content_json || {};
      const raw = json.manuscript || json;
      const manuscript = raw;
      setEditorData(manuscript);
      setRawText(JSON.stringify(manuscript, null, 2));
    } catch {
      setToast({ msg: "원고 로드 실패", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [setToast]);

  const handleUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";
    const items = [];
    for (const file of files) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const nameMatch = file.name.match(/(.+?)\s*[\(（].*?(\d+)[\)）]/);
        let levelId = null;
        let dayIndex = null;
        if (nameMatch) {
          const korName = nameMatch[1].trim();
          dayIndex = parseInt(nameMatch[2]);
          const entry = Object.entries(LEVEL_NAMES).find(([, v]) => v === korName);
          if (entry) levelId = entry[0];
        }
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
          levelId, area: "MANUSCRIPT", subArea: "RAW",
          dayIndex, moduleKey: "manuscript", schemaVersion: "1.0",
          content: {
            title: `${levelName} ${dayIndex}장`,
            contentType: "PRO_MANUSCRIPT",
            targetLevel: levelId,
            chapterNumber: dayIndex,
            manuscript: json
          }
        });
      } catch {
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
  }, [loadManuscripts, setToast]);

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
        contentType: "PRO_MANUSCRIPT",
        schemaVersion: "1.0",
        levelId: selectedItem.levelId,
        dayIndex: selectedItem.dayIndex,
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
  }, [selectedItem, editorData, rawMode, rawText, setToast]);

  const handleDownload = useCallback(() => {
    if (!selectedItem || !editorData) return;
    const levelName = LEVEL_NAMES[selectedItem.levelId] || selectedItem.levelId;
    downloadJson(editorData, `${levelName} (챕터${selectedItem.dayIndex}).json`);
  }, [selectedItem, editorData]);

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
  }, [manuscripts, setToast]);

  useEffect(() => {
    const handler = e => { if (bulkRef.current && !bulkRef.current.contains(e.target)) setBulkDlOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleRaw = () => {
    if (rawMode) {
      try { const parsed = JSON.parse(rawText); setEditorData(parsed); setRawError(""); }
      catch (e) { setRawError("JSON 파싱 오류: " + e.message); return; }
    } else {
      setRawText(JSON.stringify(editorData, null, 2));
    }
    setRawMode(v => !v);
  };

  const levelName = selectedItem?.levelId ? LEVEL_NAMES[selectedItem.levelId] : "";
  const editorTitle = levelName ? `${levelName} (챕터${selectedItem.dayIndex})` : selectedItem?.title || "";

  return (
    <>
      {/* 툴바 */}
      <div className="ldb-toolbar">
        <span className="ldb-toolbar-title">교재 원고</span>
        <SchemaDropdown />
        <input ref={fileInputRef} type="file" accept=".json" multiple style={{ display: "none" }} onChange={handleUpload} />
        <button className="ldb-btn ldb-btn-primary" onClick={() => fileInputRef.current?.click()}>
          <span className="material-symbols-outlined">upload_file</span>JSON 업로드
        </button>
        <div className="ldb-dropdown" ref={bulkRef}>
          <button className="ldb-btn ldb-btn-secondary" onClick={() => setBulkDlOpen(v => !v)}>
            <span className="material-symbols-outlined">folder_zip</span>레벨 일괄 다운로드
          </button>
          {bulkDlOpen && (
            <div className="ldb-dropdown-menu">
              {LEVEL_ORDER.map(lv => (
                <button key={lv} className="ldb-dropdown-item" onClick={() => handleBulkDownload(lv)}>
                  {LEVEL_NAMES[lv]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="ldb-body">
        <VSCodeTree
          title="교재 원고"
          nodes={treeNodes}
          selected={selectedItem?.contentId}
          onSelect={handleTreeSelect}
        />
        <div className="ldb-editor">
          {loading ? (
            <div className="ldb-loading"><span className="material-symbols-outlined">hourglass_empty</span>불러오는 중...</div>
          ) : (
            <JsonVisualEditor
              data={editorData}
              onChange={setEditorData}
              rawMode={rawMode}
              rawText={rawText}
              onRawTextChange={setRawText}
              rawError={rawError}
              title={editorTitle}
              manuscriptMode={true}
              actions={editorData && (
                <>
                  {selectedItem?.contentId && (
                    <button className="ldb-btn ldb-btn-ghost" onClick={() => setHistoryOpen(true)}>
                      <span className="material-symbols-outlined">history</span>이력
                    </button>
                  )}
                  <button className="ldb-btn ldb-btn-ghost" onClick={toggleRaw}>
                    <span className="material-symbols-outlined">{rawMode ? "view_agenda" : "code"}</span>
                    {rawMode ? "구조화" : "Raw JSON"}
                  </button>
                  <button className="ldb-btn ldb-btn-secondary" onClick={handleDownload}>
                    <span className="material-symbols-outlined">download</span>다운로드
                  </button>
                  <button className="ldb-btn ldb-btn-primary" onClick={handleSave} disabled={saving}>
                    <span className="material-symbols-outlined">save</span>{saving ? "저장중..." : "저장"}
                  </button>
                </>
              )}
            />
          )}
        </div>
      </div>

      {historyOpen && selectedItem?.contentId && (
        <EditHistoryModal contentId={selectedItem.contentId} onClose={() => setHistoryOpen(false)} />
      )}
    </>
  );
}

export default LDBManuscriptTab;
