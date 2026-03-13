import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPut, apiDelete } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import PassagePreview from "../components/question-bank/PassagePreview";
import QuestionPreview from "../components/question-bank/QuestionPreview";
import MetaForm from "../components/question-bank/MetaForm";
import PassageForm from "../components/question-bank/PassageForm";
import QuestionForm from "../components/question-bank/QuestionForm";
import "../styles/question-bank.css";

function AdminQBRecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rec, codeData] = await Promise.all([
        apiGet(`/v1/admin/question-bank/records/${id}`),
        apiGet("/v1/admin/question-bank/codes"),
      ]);
      setRecord(rec);
      setCodes(Array.isArray(codeData) ? codeData : []);
      setEditData({
        source_type: rec.source_type || "",
        exam_org: rec.exam_org || "",
        exam_year: rec.exam_year || "",
        exam_month: rec.exam_month || "",
        area: rec.area || "",
        sub_area: rec.sub_area || "",
        title: rec.title || "",
        target_grades: Array.isArray(rec.target_grades) ? rec.target_grades : [],
        difficulty: rec.difficulty || "",
        tags: Array.isArray(rec.tags) ? rec.tags : [],
        author: rec.author || "",
        status: rec.status || "draft",
        passages: (rec.passages || []).map((p) => ({
          passage_code: p.passage_code,
          ref_type: p.ref_type || "",
          title: p.title || "",
          body_text: p.body_text || "",
          sub_passages: p.sub_passages || [],
          box_items: p.box_items || [],
        })),
        questions: (rec.questions || []).map((q) => ({
          question_number: q.question_number,
          passage_refs: q.passage_refs || [],
          question_format: q.question_format || "",
          answer_type: q.answer_type || "",
          question_type: q.question_type || "",
          stem: q.stem || "",
          box_items: q.box_items || [],
          choices: q.choices || [],
          correct_answer: q.correct_answer || "",
          difficulty: q.difficulty || "",
          explanation: q.explanation || "",
          applied_concepts: q.applied_concepts || [],
          choice_pattern: q.choice_pattern || "",
          scoring_criteria: q.scoring_criteria || [],
          points: q.points || "",
        })),
      });
    } catch (e) {
      console.error("로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editData) return;
    setSaving(true);
    try {
      const body = {
        ...editData,
        exam_year: editData.exam_year ? Number(editData.exam_year) : null,
        exam_month: editData.exam_month ? Number(editData.exam_month) : null,
        difficulty: editData.difficulty ? Number(editData.difficulty) : null,
      };
      const updated = await apiPut(`/v1/admin/question-bank/records/${id}`, body);
      setRecord(updated);
      alert("저장되었습니다.");
    } catch (e) {
      alert("저장 실패: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("이 레코드를 보관(archived) 처리하시겠습니까?")) return;
    try {
      await apiDelete(`/v1/admin/question-bank/records/${id}`);
      navigate("/admin/question-bank");
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  const updateMeta = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePassage = (idx, field, value) => {
    setEditData((prev) => {
      const passages = [...prev.passages];
      passages[idx] = { ...passages[idx], [field]: value };
      return { ...prev, passages };
    });
  };

  const updateQuestion = (idx, field, value) => {
    setEditData((prev) => {
      const questions = [...prev.questions];
      questions[idx] = { ...questions[idx], [field]: value };
      return { ...prev, questions };
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="qb-loading">불러오는 중...</div>
      </AdminLayout>
    );
  }

  if (!record) {
    return (
      <AdminLayout>
        <div className="qb-empty">
          <span className="material-symbols-outlined">error</span>
          <p>레코드를 찾을 수 없습니다</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="qb-wrap" style={{ maxWidth: "100%", padding: "10px 10px 0" }}>
        <div className="qb-header">
          <h1>{record.record_code}</h1>
          <div className="qb-header-actions">
            <button className="qb-btn" onClick={() => navigate("/admin/question-bank")}>
              <span className="material-symbols-outlined">arrow_back</span>
              목록
            </button>
            <button className="qb-btn primary" onClick={handleSave} disabled={saving}>
              <span className="material-symbols-outlined">save</span>
              {saving ? "저장 중..." : "저장"}
            </button>
            <button className="qb-btn danger" onClick={handleDelete}>
              <span className="material-symbols-outlined">archive</span>
              보관
            </button>
          </div>
        </div>

        <div className="qb-detail-split">
          {/* 좌측: 미리보기 */}
          <div className="qb-preview-pane">
            <h3 style={{ color: "#8a9a8e", fontSize: "0.8rem", marginBottom: 12 }}>미리보기</h3>

            {record.passages?.map((p, i) => (
              <PassagePreview key={p.id || i} passage={p} index={i} />
            ))}

            {record.questions?.map((q, i) => (
              <QuestionPreview key={q.id || i} question={q} index={i} />
            ))}

            {(!record.passages?.length && !record.questions?.length) && (
              <div className="qb-empty" style={{ padding: 40 }}>
                <p>지문과 문제가 없습니다</p>
              </div>
            )}
          </div>

          {/* 우측: 편집 폼 */}
          <div className="qb-form-pane">
            {editData && (
              <>
                <MetaForm data={editData} codes={codes} onChange={updateMeta} />

                <h3 style={{ color: "#8a9a8e", fontSize: "0.8rem", margin: "20px 0 12px" }}>
                  지문 ({editData.passages.length}개)
                </h3>
                {editData.passages.map((p, i) => (
                  <PassageForm key={i} passage={p} index={i} onChange={updatePassage} />
                ))}

                <h3 style={{ color: "#8a9a8e", fontSize: "0.8rem", margin: "20px 0 12px" }}>
                  문제 ({editData.questions.length}개)
                </h3>
                {editData.questions.map((q, i) => (
                  <QuestionForm key={i} question={q} index={i} codes={codes} onChange={updateQuestion} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminQBRecordDetailPage;
