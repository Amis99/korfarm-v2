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

  const downloadTemplate = () => {
    const template = {
      "_코드표_참고": {
        "_설명": "아래는 각 필드에 사용 가능한 코드값입니다. 이 섹션은 임포트 시 무시됩니다.",
        "source_type (소스 분류)": ["TEXTBOOK(교과서)", "SELF_STUDY(자습서)", "EVAL_WORKBOOK(평가문제집)", "PAST_EXAM(기출)", "SCHOOL_EXAM(학교 내신)", "ETC(기타)"],
        "exam_org (기출 기관)": ["CSAT(수능)", "MOE(교육청)", "SCHOOL(학교)", "PRIVATE(사설)", "ETC(기타)"],
        "area (영역)": ["LIT(문학)", "READ(독서)", "GRAM(문법)", "SPEAK(화법)", "WRITE(작문)", "MEDIA(매체)", "INTEGRATED(복합)"],
        "sub_area (세부영역)": [
          "LIT_MODERN_POETRY(현대시)", "LIT_CLASSIC_POETRY(고전시가)", "LIT_MODERN_NOVEL(현대소설)",
          "LIT_CLASSIC_PROSE(고전산문)", "LIT_ESSAY(수필)", "LIT_DRAMA(극)",
          "READ_HUMANITIES(인문)", "READ_SOCIETY(사회)", "READ_SCI_TECH(과학기술)",
          "READ_ART(예술)", "READ_CROSS(통합)",
          "GRAM_PHONOLOGY(음운)", "GRAM_WORD(단어)", "GRAM_SENTENCE(문장)",
          "GRAM_DISCOURSE(담화)", "GRAM_HISTORY(국어사)",
          "SPEAK_GENERAL(화법 일반)", "WRITE_GENERAL(작문 일반)",
          "MEDIA_LANGUAGE(매체 언어)", "INTEGRATED_MULTI(복합 지문)"
        ],
        "target_grades (대상 학년)": ["MS1(중1)", "MS2(중2)", "MS3(중3)", "HS1(고1)", "HS2(고2)", "HS3(고3)", "NQ(수능/N수)"],
        "question_format (문항 형식)": ["MCQ(객관식)", "SA(단답형)", "ESSAY(서술형)"],
        "answer_type (정답 유형)": ["CHOICE(선택지 기호)", "TEXT(텍스트 정답)", "KEYWORD_SET(키워드 집합)", "MODEL_ANSWER(모범 답안)", "NUMERIC(숫자 정답)"],
        "question_type (문제 유형)": [
          "CONTENT(내용 이해)", "INFERENCE(추론)", "THEME(주제/제목)", "STRUCTURE(구조/전개)",
          "EXPRESSION(표현상 특징)", "TONE_ATTITUDE(태도/정서)", "VOCAB(어휘)", "GRAMMAR(문법/어법)",
          "CORRECTNESS(적절/부적절 판단)", "ORDER(순서 배열)", "INSERT(문장 삽입)", "SUMMARY(요약)",
          "APPLICATION(적용)", "COMPARISON(비교/대조)", "CRITIQUE(비판/평가)",
          "WRITING(쓰기)", "SPEAKING(화법)", "MEDIA(매체)"
        ],
        "choice_pattern (선택지 패턴)": [
          "MCQ_5_SINGLE(5지선다/단일정답)", "MCQ_5_MULTI(5지선다/복수정답)", "MCQ_TF(진위형)", "MCQ_MATCH(짝짓기형)",
          "SA_TEXT(단답형/텍스트)", "SA_NUM(단답형/숫자)", "ESSAY_TEXT(서술형/텍스트)", "ESSAY_RUBRIC(서술형/채점기준형)"
        ],
        "ref_type (지문 참조 유형)": ["FULL(전체 지문 기준)", "PART(부분 지문 기준)", "NONE(지문 없음)"]
      },
      "schema_version": "1.0",
      "records": [
        {
          "record_code": "REC-2024-CSAT-001",
          "source_type": "PAST_EXAM",
          "exam_org": "CSAT",
          "exam_year": 2024,
          "exam_month": 11,
          "area": "LIT",
          "sub_area": "LIT_MODERN_POETRY",
          "title": "작품 제목 또는 지문 제목",
          "author": "작가명",
          "target_grades": ["HS3", "NQ"],
          "difficulty": 3,
          "tags": ["수능", "현대시"],
          "passages": [
            {
              "passage_code": "PAS-001",
              "ref_type": "FULL",
              "title": "지문 제목 (선택)",
              "body_text": "지문 본문 내용을 여기에 입력합니다.\n줄바꿈은 \\n으로 표시합니다.",
              "sub_passages": [
                {
                  "code": "PAS-001-A",
                  "label": "(가)",
                  "text": "부분 지문이 있는 경우 여기에 입력합니다. 없으면 이 배열을 비워두세요."
                }
              ],
              "box_items": [
                {
                  "label": "<보기>",
                  "text": "보기 박스 내용이 있는 경우 입력합니다. 없으면 이 배열을 비워두세요."
                }
              ]
            }
          ],
          "questions": [
            {
              "question_number": 1,
              "passage_refs": ["PAS-001"],
              "question_format": "MCQ",
              "answer_type": "CHOICE",
              "question_type": "CONTENT",
              "stem": "윗글에 대한 설명으로 가장 적절한 것은?",
              "box_items": [],
              "choices": [
                { "number": 1, "text": "첫 번째 선택지 내용" },
                { "number": 2, "text": "두 번째 선택지 내용" },
                { "number": 3, "text": "세 번째 선택지 내용" },
                { "number": 4, "text": "네 번째 선택지 내용" },
                { "number": 5, "text": "다섯 번째 선택지 내용" }
              ],
              "correct_answer": "3",
              "difficulty": 3,
              "explanation": "정답 해설을 입력합니다.",
              "applied_concepts": ["DETAIL_INFO"],
              "choice_pattern": "MCQ_5_SINGLE",
              "scoring_criteria": [],
              "points": 2
            },
            {
              "question_number": 2,
              "passage_refs": ["PAS-001"],
              "question_format": "SA",
              "answer_type": "TEXT",
              "question_type": "TONE_ATTITUDE",
              "stem": "이 시의 중심 정서를 한 단어로 쓰시오.",
              "box_items": [],
              "choices": [],
              "correct_answer": "그리움",
              "difficulty": 2,
              "explanation": "단답형 문제 해설",
              "applied_concepts": ["SPEAKER_ATTITUDE"],
              "choice_pattern": "SA_TEXT",
              "scoring_criteria": [],
              "points": 2
            },
            {
              "question_number": 3,
              "passage_refs": ["PAS-001"],
              "question_format": "ESSAY",
              "answer_type": "MODEL_ANSWER",
              "question_type": "INFERENCE",
              "stem": "윗글에 나타난 화자의 태도 변화를 서술하시오.",
              "box_items": [],
              "choices": [],
              "correct_answer": "초반에는 거리감이 드러나지만, 후반에는 공감과 수용의 태도로 변화한다.",
              "difficulty": 4,
              "explanation": "서술형 문제 해설",
              "applied_concepts": ["SPEAKER_ATTITUDE", "TONE"],
              "choice_pattern": "ESSAY_RUBRIC",
              "scoring_criteria": [
                { "항목": "태도 변화 파악", "배점": 2, "기준": "초반과 후반의 태도 차이를 정확히 서술함" },
                { "항목": "표현의 적절성", "배점": 1, "기준": "문장을 자연스럽고 분명하게 작성함" }
              ],
              "points": 3
            }
          ]
        }
      ]
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "문제은행_임포트_템플릿.json";
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <div className="qb-header-actions">
            <button className="qb-btn" onClick={downloadTemplate}>
              <span className="material-symbols-outlined">description</span>
              템플릿 다운로드
            </button>
            <button className="qb-btn" onClick={() => navigate("/admin/question-bank")}>
              <span className="material-symbols-outlined">arrow_back</span>
              목록으로
            </button>
          </div>
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
