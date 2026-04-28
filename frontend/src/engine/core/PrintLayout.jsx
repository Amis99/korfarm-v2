import { useMemo } from "react";
import { CompletedWordCard, buildCorrectDestCells } from "../modules/PhonemeChangeModule";
import { CompletedSentenceCard } from "../modules/MorphemeAnalysisModule";
import RichText from "../../utils/RichText";

const ROLE_SHORT = { "주어":"주","서술어":"서","목적어":"목","보어":"보","부사어":"부","관형어":"관","독립어":"독" };

/**
 * PrintLayout — 학습 모듈별 인쇄 시험지 통합 컴포넌트.
 *
 * 인쇄 시 화면 콘텐츠는 숨기고 (CSS @media print) 이 컴포넌트만 표시.
 * 각 학습 모듈의 데이터 구조에 맞춰 시험지 + 정답해설 페이지를 분할 출력.
 *
 * 공통 헤더: 학교/학년반/이름/시작시각 빈칸 + 제목/레벨/Day
 * 시험지 페이지: 모듈 type별 분기
 * 정답해설 페이지: page-break-before로 새 페이지 (마지막에)
 *
 * Props:
 *   moduleKey: 모듈 키 (daily_quiz / worksheet_quiz / reading_training / ...)
 *   content: { title, targetLevel, payload, ... }
 */
export default function PrintLayout({ moduleKey, content }) {
  if (!content) return null;
  const payload = content.payload || {};
  const title = content.title || "학습";
  const level = content.targetLevel || "";

  return (
    <div className="print-only print-layout">
      <PrintHeader title={title} level={level} />
      <PrintBody moduleKey={moduleKey} payload={payload} />
      <PrintAnswerKey moduleKey={moduleKey} payload={payload} />
    </div>
  );
}

/* ─────────────── 공통 헤더 ─────────────── */
function PrintHeader({ title, level }) {
  return (
    <header className="print-header">
      <div className="print-header-row">
        <span className="print-brand">국어농장</span>
        {level && <span className="print-level">· {level}</span>}
      </div>
      <h1 className="print-title">{title}</h1>
      <div className="print-meta-row">
        <span>학교 [             ]</span>
        <span>학년/반 [          ]</span>
        <span>이름 [             ]</span>
        <span>시작 [    :    ]</span>
      </div>
    </header>
  );
}

/* ─────────────── 시험지 본문 (모듈 type별 분기) ─────────────── */
function PrintBody({ moduleKey, payload }) {
  switch (moduleKey) {
    case "daily_quiz":
    case "worksheet_quiz":
      return <PrintWorksheet payload={payload} />;
    case "reading_training":
      return <PrintReading payload={payload} />;
    case "background_knowledge":
    case "logic_reasoning":
      return <PrintPassageGroup payload={payload} />;
    case "choice_analysis":
      return <PrintChoiceAnalysis payload={payload} />;
    case "phoneme_change":
      return <PrintPhonemeChange payload={payload} />;
    case "word_formation":
      return <PrintWordFormation payload={payload} />;
    case "sentence_structure":
      return <PrintSentenceStructure payload={payload} />;
    case "morpheme_analysis":
      return <PrintMorphemeAnalysis payload={payload} />;
    default:
      // 기타 — 단순 questions 리스트
      if (payload.questions) return <PrintWorksheet payload={payload} />;
      return null;
  }
}

/* ─────────────── 셔플 헬퍼 (deterministic, question.id 기반) ─────────────── */
function deterministicShuffle(arr, seed) {
  // mulberry32 PRNG
  let h = 0;
  for (let i = 0; i < (seed || "").length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const rng = mulberry32(h || 1);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ─────────────── DailyQuiz / Worksheet (시험지 형식) ─────────────── */
function PrintWorksheet({ payload }) {
  const questions = (payload.questions || []).filter(Boolean);
  if (!questions.length) return null;
  return (
    <ol className="print-worksheet-list">
      {questions.map((q, idx) => (
        <PrintWorksheetItem key={q.id || idx} question={q} num={idx + 1} />
      ))}
    </ol>
  );
}

function PrintWorksheetItem({ question, num }) {
  const stem = question.stem || "";
  const passage = typeof question.passage === "string" ? question.passage : "";
  const prompt = question.prompt && question.prompt !== stem ? question.prompt : "";
  const boki = question["보기"] || question.examples || question.example || question.additionalInfo;
  const choices = question.choices || [];
  const shuffled = useMemo(
    () => deterministicShuffle(choices, question.id || ""),
    [question.id]
  );

  // CHOICE_ANALYSIS / CHOICE_OX / CHOICE_COMPLEX_OX 는 별도 형식
  if (
    question.type === "CHOICE_ANALYSIS" ||
    question.type === "CHOICE_OX" ||
    question.type === "CHOICE_COMPLEX_OX"
  ) {
    return <PrintChoiceAnalysisItem question={question} num={num} />;
  }

  // FILL_BLANKS
  if (question.type === "FILL_BLANKS") {
    const template = (question.template || "").replace(/____/g, "(            )");
    return (
      <li className="print-question">
        <div className="print-q-header">
          <span className="print-q-num">{num}.</span>
          <span className="print-q-stem">{stem}</span>
        </div>
        {passage && <div className="print-q-passage">{passage}</div>}
        <div className="print-q-template">{template}</div>
        {(question.blanks || []).map((blank, bi) => {
          const blankShuffled = deterministicShuffle(blank.choices || [], `${question.id}-${blank.id || bi}`);
          return (
            <div key={blank.id || bi} className="print-q-blank-block">
              <div className="print-q-blank-label">빈칸 {bi + 1}</div>
              <ol className="print-q-choices">
                {blankShuffled.map((c) => (
                  <li key={c.id} className="print-q-choice">
                    <span className="print-q-choice-mark">⃝</span>
                    <span>{c.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </li>
    );
  }

  // MULTI_CHOICE (default)
  return (
    <li className="print-question">
      <div className="print-q-header">
        <span className="print-q-num">{num}.</span>
        <span className="print-q-stem">{stem}</span>
      </div>
      {passage && <div className="print-q-passage">{passage}</div>}
      {prompt && <div className="print-q-prompt">{prompt}</div>}
      {boki && <div className="print-q-boki">&lt;보기&gt; {typeof boki === "string" ? boki : ""}</div>}
      {shuffled.length > 0 && (
        <ol className="print-q-choices">
          {shuffled.map((c, ci) => (
            <li key={c.id || ci} className="print-q-choice">
              <span className="print-q-choice-mark">⃝</span>
              <span className="print-q-choice-num">{ci + 1}</span>
              <span>{c.text}</span>
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

/* ─────────────── ChoiceAnalysis (선택지 분석) ─────────────── */
function PrintChoiceAnalysis({ payload }) {
  const questions = (payload.questions || []).filter(Boolean);
  if (!questions.length) return null;
  return (
    <ol className="print-worksheet-list">
      {questions.map((q, idx) => (
        <PrintChoiceAnalysisItem key={q.id || idx} question={q} num={idx + 1} />
      ))}
    </ol>
  );
}

function PrintChoiceAnalysisItem({ question, num }) {
  const stem = question.stem || "";
  const passage = question.passage || {};
  const paragraphs = passage.paragraphs || [];
  const choices = question.choices || [];
  const isComplexOx = question.type === "CHOICE_COMPLEX_OX";

  // 옛 sentences 기반 — 문장 번호 매김 (CHOICE_ANALYSIS 호환)
  const allSentences = [];
  paragraphs.forEach((p) => {
    (p.sentences || []).forEach((s) => allSentences.push({ ...s, paragraphId: p.id }));
  });
  const idToNum = {};
  allSentences.forEach((s, i) => { idToNum[s.id] = i + 1; });
  const hasSentences = allSentences.length > 0;

  return (
    <li className="print-question print-choice-analysis-item">
      <div className="print-q-header">
        <span className="print-q-num">{num}.</span>
        <span className="print-q-stem">
          <RichText>{stem}</RichText>
        </span>
      </div>
      {paragraphs.length > 0 && (
        <div className="print-q-passage">
          {paragraphs.map((p) => (
            <p key={p.id} className="print-ca-paragraph">
              {hasSentences && (p.sentences || []).length > 0 ? (
                (p.sentences || []).map((s) => (
                  <span key={s.id}>
                    <sup className="print-ca-sentnum">{idToNum[s.id]}</sup>
                    {s.text + " "}
                  </span>
                ))
              ) : (
                // CHOICE_COMPLEX_OX 등 — paragraphs[].text 그대로 출력
                <RichText>{p.text || ""}</RichText>
              )}
            </p>
          ))}
        </div>
      )}
      <ol className="print-ca-choices">
        {choices.map((c, ci) => (
          <li key={c.choiceId || c.id || ci} className="print-ca-choice">
            <span className="print-q-choice-num">{ci + 1}</span>
            <span className="print-ca-choice-text">
              <RichText>{c.text || ""}</RichText>
            </span>
            <span className="print-ca-ox">⃝O ⃝X</span>
            <span className="print-ca-evidence">
              {isComplexOx ? "근거: [                  ]" : "근거 문장: [          ]"}
            </span>
          </li>
        ))}
      </ol>
    </li>
  );
}

/* ─────────────── ReadingTraining (독해) ─────────────── */
function PrintReading({ payload }) {
  const passage = payload.passage || {};
  const intensive = payload.intensive || {};
  const recall = payload.recall || {};
  const confirm = payload.confirm || {};

  const passageText = (passage.paragraphs || [])
    .map((p) => p.text || "")
    .join("\n\n");

  // 복기 카드는 셔플 (deterministic)
  const recallCards = recall.cards || [];
  const shuffledRecall = deterministicShuffle(recallCards, "recall-" + (recallCards[0]?.id || ""));

  return (
    <>
      {/* §1 정독 */}
      <section className="print-section">
        <h2 className="print-section-title">§ 1. 정독 (Intensive Reading)</h2>
        {passageText && <div className="print-q-passage print-passage-large">{passageText}</div>}
        <ol className="print-worksheet-list">
          {(intensive.timeline || []).map((step, idx) => {
            const q = step.question;
            if (!q) return null;
            const shuffled = deterministicShuffle(q.choices || [], step.stepId || `i${idx}`);
            return (
              <li key={step.stepId || idx} className="print-question">
                <div className="print-q-header">
                  <span className="print-q-num">{idx + 1}.</span>
                  <span className="print-q-stem">{q.prompt}</span>
                </div>
                <ol className="print-q-choices">
                  {shuffled.map((c, ci) => (
                    <li key={c.id || ci} className="print-q-choice">
                      <span className="print-q-choice-mark">⃝</span>
                      <span className="print-q-choice-num">{ci + 1}</span>
                      <span>{c.text}</span>
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ol>
      </section>

      {/* §2 복기 */}
      <section className="print-section print-page-break">
        <h2 className="print-section-title">§ 2. 복기 (Recall)</h2>
        <p className="print-section-desc">
          아래 카드를 원래 글의 순서대로 빈칸에 1, 2, 3 ... 으로 번호를 매기세요.
        </p>
        <ol className="print-recall-list">
          {shuffledRecall.map((card, idx) => (
            <li key={card.id || idx} className="print-recall-card">
              <span className="print-recall-num-blank">[      ]</span>
              <span className="print-recall-text">{card.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* §3 확인 */}
      <section className="print-section print-page-break">
        <h2 className="print-section-title">§ 3. 확인 (Confirm)</h2>
        {passageText && (
          <div className="print-q-passage print-passage-large">{passageText}</div>
        )}
        <ol className="print-worksheet-list">
          {(confirm.questions || []).map((q, idx) => (
            <li key={q.id || idx} className="print-question">
              <div className="print-q-header">
                <span className="print-q-num">{idx + 1}.</span>
                <span className="print-q-stem">{q.prompt}</span>
              </div>
              <div className="print-q-confirm-blank">답: [                              ]</div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

/* ─────────────── Background / Logic (지문별 그룹) ─────────────── */
function PrintPassageGroup({ payload }) {
  const passages = payload.passages || [];
  const legacyQuestions = payload.questions || [];

  // legacy 모드: 단순 worksheet
  if (passages.length === 0 && legacyQuestions.length > 0) {
    return <PrintWorksheet payload={payload} />;
  }

  return (
    <>
      {passages.map((p, pi) => (
        <section
          key={p.id || pi}
          className={`print-section ${pi > 0 ? "print-page-break" : ""}`}
        >
          {p.title && <h2 className="print-section-title">지문 {pi + 1}. {p.title}</h2>}
          {!p.title && <h2 className="print-section-title">지문 {pi + 1}</h2>}
          {p.text && <div className="print-q-passage print-passage-large">{p.text}</div>}
          <ol className="print-worksheet-list">
            {(p.questions || []).map((q, qi) => (
              <PrintWorksheetItem key={q.id || qi} question={q} num={qi + 1} />
            ))}
          </ol>
        </section>
      ))}
    </>
  );
}

/* ─────────────── 문법: PhonemeChange (음운 변동) ─────────────── */
function PrintPhonemeChange({ payload }) {
  const words = payload.words || [];
  return (
    <section className="print-section">
      <h2 className="print-section-title">음운 변동 분석</h2>
      <p className="print-section-desc">
        다음 단어들의 발음 변화 단계와 변동의 종류를 적어보세요.
      </p>
      <ol className="print-worksheet-list">
        {words.map((w, idx) => (
          <li key={w.id || idx} className="print-question print-grammar-item">
            <div className="print-q-header">
              <span className="print-q-num">{idx + 1}.</span>
              <span className="print-q-stem print-grammar-target">{w.surface || w.word}</span>
            </div>
            <div className="print-grammar-blank">
              <span className="print-grammar-blank-label">분석:</span>
              <span className="print-grammar-blank-line">[                                                       ]</span>
            </div>
            <div className="print-grammar-blank">
              <span className="print-grammar-blank-label">변동 종류:</span>
              <span className="print-grammar-blank-line">[                                                       ]</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────── 문법: WordFormation (단어 형성) ─────────────── */
function PrintWordFormation({ payload }) {
  const items = payload.items || payload.words || [];
  return (
    <section className="print-section">
      <h2 className="print-section-title">단어 형성 분석</h2>
      <p className="print-section-desc">
        다음 단어들을 형태소로 분리하고, 각 형태소의 종류(어근/접두사/접미사)와 단어 형성 방식(파생/합성)을 적어보세요.
      </p>
      <ol className="print-worksheet-list">
        {items.map((item, idx) => (
          <li key={item.id || idx} className="print-question print-grammar-item">
            <div className="print-q-header">
              <span className="print-q-num">{idx + 1}.</span>
              <span className="print-q-stem print-grammar-target">{item.word || item.surface}</span>
            </div>
            <div className="print-grammar-blank">
              <span className="print-grammar-blank-label">형태소 분리:</span>
              <span className="print-grammar-blank-line">[                                                       ]</span>
            </div>
            <div className="print-grammar-blank">
              <span className="print-grammar-blank-label">형성 방식:</span>
              <span className="print-grammar-blank-line">[                                                       ]</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────── 문법: SentenceStructure (문장 짜임) ─────────────── */
function PrintSentenceStructure({ payload }) {
  const sentences = payload.sentences || payload.items || [];
  return (
    <section className="print-section">
      <h2 className="print-section-title">문장 짜임 분석</h2>
      <p className="print-section-desc">
        다음 문장들의 문장 성분(주어/서술어/목적어/보어/관형어/부사어/독립어)과 짜임(홑/이어진/안긴)을 분석하세요.
      </p>
      <ol className="print-worksheet-list">
        {sentences.map((s, idx) => (
          <li key={s.id || idx} className="print-question print-grammar-item">
            <div className="print-q-header">
              <span className="print-q-num">{idx + 1}.</span>
              <span className="print-q-stem print-grammar-target">{s.text || s.sentence}</span>
            </div>
            <div className="print-grammar-blank">
              <span className="print-grammar-blank-label">성분 분석:</span>
              <span className="print-grammar-blank-line">[                                                       ]</span>
            </div>
            <div className="print-grammar-blank">
              <span className="print-grammar-blank-label">문장 짜임:</span>
              <span className="print-grammar-blank-line">[                                                       ]</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────── 문법: MorphemeAnalysis (형태소 분석) ─────────────── */
function PrintMorphemeAnalysis({ payload }) {
  const sentences = payload.sentences || payload.items || [];
  return (
    <section className="print-section">
      <h2 className="print-section-title">형태소 분석</h2>
      <p className="print-section-desc">
        다음 문장들을 형태소 단위로 분리하고 각 형태소의 품사를 적어보세요.
      </p>
      <ol className="print-worksheet-list">
        {sentences.map((s, idx) => (
          <li key={s.id || idx} className="print-question print-grammar-item">
            <div className="print-q-header">
              <span className="print-q-num">{idx + 1}.</span>
              <span className="print-q-stem print-grammar-target">{s.text || s.sentence}</span>
            </div>
            <div className="print-grammar-blank">
              <span className="print-grammar-blank-label">형태소/품사:</span>
              <span className="print-grammar-blank-line">[                                                       ]</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────── 정답 및 해설 페이지 (모듈 type별) ─────────────── */
function PrintAnswerKey({ moduleKey, payload }) {
  return (
    <section className="print-section print-answer-page">
      <h2 className="print-section-title">정답 및 해설</h2>
      <PrintAnswerKeyBody moduleKey={moduleKey} payload={payload} />
    </section>
  );
}

function PrintAnswerKeyBody({ moduleKey, payload }) {
  switch (moduleKey) {
    case "daily_quiz":
    case "worksheet_quiz":
    case "choice_analysis":
      return <PrintAnswerKeyQuestions questions={payload.questions || []} />;
    case "reading_training":
      return <PrintAnswerKeyReading payload={payload} />;
    case "background_knowledge":
    case "logic_reasoning": {
      const passages = payload.passages || [];
      if (passages.length === 0 && payload.questions) {
        return <PrintAnswerKeyQuestions questions={payload.questions} />;
      }
      return (
        <div>
          {passages.map((p, pi) => (
            <div key={p.id || pi} className="print-answer-passage-group">
              <h3 className="print-answer-passage-title">지문 {pi + 1}{p.title ? `. ${p.title}` : ""}</h3>
              <PrintAnswerKeyQuestions questions={p.questions || []} />
            </div>
          ))}
        </div>
      );
    }
    case "phoneme_change":
      return <PrintAnswerKeyPhonemeChange payload={payload} />;
    case "word_formation":
      return <PrintAnswerKeyWordFormation payload={payload} />;
    case "sentence_structure":
      return <PrintAnswerKeySentenceStructure payload={payload} />;
    case "morpheme_analysis":
      return <PrintAnswerKeyMorphemeAnalysis payload={payload} />;
    default:
      return null;
  }
}

function PrintAnswerKeyQuestions({ questions }) {
  return (
    <ol className="print-answer-list">
      {questions.map((q, idx) => {
        let answerText = "";
        if (q.type === "CHOICE_OX" || q.type === "CHOICE_ANALYSIS") {
          // CHOICE_OX/CHOICE_ANALYSIS는 인쇄지에서 선지 셔플 안 함 — 원본 ID 그대로 표시
          answerText = (q.choices || [])
            .map((c) => `${c.choiceId || c.id}=${c.expectedOX || (c.finalIsCorrectChoice ? "X" : "O")}`)
            .join(", ");
        } else if (q.type === "CHOICE_COMPLEX_OX") {
          // 인쇄지의 선지는 셔플 안 함(원본 순서) — 부적절 선지(=정답) 번호와 모든 선지의 OX
          const lines = (q.choices || []).map((c, ci) => {
            const ox = (c.propositions || []).some((p) => p.oxAnswer === "X") ? "X" : "O";
            return `${ci + 1}번=${ox}`;
          });
          const wrongIdx = (q.choices || []).findIndex((c) => (c.propositions || []).some((p) => p.oxAnswer === "X"));
          const head = wrongIdx >= 0 ? `정답(부적절): ${wrongIdx + 1}번  ·  ` : "";
          answerText = head + lines.join(", ");
        } else if (q.type === "FILL_BLANKS" && q.blanks) {
          // 인쇄지의 빈칸 셔플 시드와 동일하게 ${q.id}-${blank.id || bi} 사용
          answerText = q.blanks
            .map((b, bi) => {
              const blankShuffled = deterministicShuffle(b.choices || [], `${q.id || ""}-${b.id || bi}`);
              const ansIdx = blankShuffled.findIndex((c) => c.id === b.answerId);
              const c = ansIdx >= 0 ? blankShuffled[ansIdx] : null;
              if (ansIdx >= 0 && c) return `빈칸${bi + 1}: ${ansIdx + 1}번 (${c.text})`;
              return `빈칸${bi + 1}: ${b.answerId || "-"}`;
            })
            .join(" / ");
        } else if (q.choices && q.answerId) {
          // 인쇄지의 선지 셔플 시드(question.id)와 동일하게 셔플 후, 정답이 몇 번째인지 표시
          const shuffled = deterministicShuffle(q.choices, q.id || "");
          const ansIdx = shuffled.findIndex((c) => (c.id || c.choiceId) === q.answerId);
          const correct = ansIdx >= 0 ? shuffled[ansIdx] : null;
          answerText = correct ? `${ansIdx + 1}번 (${correct.text})` : q.answerId;
        }
        return (
          <li key={q.id || idx} className="print-answer-item">
            <div className="print-answer-num">문제 {idx + 1}</div>
            {answerText && <div className="print-answer-correct">정답: {answerText}</div>}
            {q.explanation && (
              <div className="print-answer-explanation">
                <strong>해설:</strong> {q.explanation}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PrintAnswerKeyReading({ payload }) {
  const intensive = payload.intensive || {};
  const recall = payload.recall || {};
  const confirm = payload.confirm || {};
  return (
    <div>
      <h3 className="print-answer-section-title">§ 1. 정독 정답</h3>
      <ol className="print-answer-list">
        {(intensive.timeline || []).map((step, idx) => {
          const q = step.question;
          if (!q) return null;
          // 인쇄지의 정독 선지 셔플 시드(step.stepId || `i${idx}`)와 동일하게 셔플
          const shuffled = deterministicShuffle(q.choices || [], step.stepId || `i${idx}`);
          const ansIdx = shuffled.findIndex((c) => c.id === q.answerId);
          const correct = ansIdx >= 0 ? shuffled[ansIdx] : null;
          return (
            <li key={step.stepId || idx} className="print-answer-item">
              <div className="print-answer-num">{idx + 1}</div>
              <div className="print-answer-correct">
                정답: {correct ? `${ansIdx + 1}번 (${correct.text})` : q.answerId || "-"}
              </div>
              {q.explanation && (
                <div className="print-answer-explanation"><strong>해설:</strong> {q.explanation}</div>
              )}
            </li>
          );
        })}
      </ol>

      <h3 className="print-answer-section-title">§ 2. 복기 정답 (원래 순서)</h3>
      <ol className="print-answer-list">
        {(recall.correctOrder || []).map((cardId, idx) => {
          const card = (recall.cards || []).find((c) => c.id === cardId);
          return (
            <li key={cardId} className="print-answer-item">
              <div className="print-answer-num">{idx + 1}</div>
              <div className="print-answer-correct">{card?.text || cardId}</div>
            </li>
          );
        })}
      </ol>

      <h3 className="print-answer-section-title">§ 3. 확인 정답</h3>
      <ol className="print-answer-list">
        {(confirm.questions || []).map((q, idx) => (
          <li key={q.id || idx} className="print-answer-item">
            <div className="print-answer-num">{idx + 1}</div>
            <div className="print-answer-correct">정답: {q.answerText || "-"}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PrintAnswerKeyPhonemeChange({ payload }) {
  const words = payload.words || [];
  return (
    <div className="print-grammar-answer-stack">
      {words.map((w, idx) => {
        const destCells = buildCorrectDestCells(w);
        const steps = w.steps || [];
        return (
          <div key={w.id || idx} className="print-grammar-answer-block">
            <CompletedWordCard
              word={w}
              destCells={destCells}
              idx={idx}
              total={words.length}
              hadWrong={false}
            />
            {steps.length > 0 && (
              <ol className="print-grammar-step-list">
                {steps
                  .filter((s) => s.questionType === "PHONEME_RESULT" || s.questionType === "RULE_EXPLANATION")
                  .map((s, si) => {
                    const correct = (s.choices || []).find((c) => c.id === s.correctChoiceId);
                    return (
                      <li key={si}>
                        <strong>{si + 1}단계</strong>
                        {s.questionType === "PHONEME_RESULT" ? " (음운)" : " (규칙)"}:
                        {" "}{correct?.text || "-"}
                        {s.targetCellNo != null && ` · 셀 ${s.targetCellNo}`}
                      </li>
                    );
                  })}
              </ol>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PrintAnswerKeyWordFormation({ payload }) {
  const items = payload.items || payload.words || [];
  return (
    <div className="wf-completed-list print-grammar-answer-stack">
      {items.map((item, idx) => {
        const morphemes = item.morphemes || [];
        const word = item.word || item.surface || "";
        const formation = item.formation || item.formationType || "";
        return (
          <div key={item.id || idx} className="wf-completed-item print-wf-row">
            <span className="wf-completed-num">{idx + 1}.</span>
            <span className="wf-completed-word">{word}</span>
            <span className="wf-completed-morphemes">
              {morphemes.map((m, j) => {
                const mark = m.mark === "circle" ? "wf-circle" : m.mark === "square" ? "wf-square" : "";
                return (
                  <span key={j} className={`morpheme-chip-sm ${mark}`}>
                    {m.form || m.text}
                  </span>
                );
              })}
            </span>
            {formation && <span className="wf-completed-formation">{formation}</span>}
            {item.explanation && (
              <div className="print-grammar-explain"><strong>해설:</strong> {item.explanation}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PrintAnswerKeySentenceStructure({ payload }) {
  const sentences = payload.sentences || payload.items || [];
  return (
    <div className="print-grammar-answer-stack">
      {sentences.map((s, idx) => (
        <PrintSentenceStructureAnswer key={s.id || idx} sentence={s} idx={idx} />
      ))}
    </div>
  );
}

/**
 * 학습 페이지의 정답 표 형태로 한 문장 표시.
 * 어절 행 + 성분 라벨 행 + 절 분석 행(있으면).
 */
function PrintSentenceStructureAnswer({ sentence, idx }) {
  const boxes = sentence.boxes || [];
  // 정답 라벨: box.role + box.layer 조합 ("주어"+1 → "주1")
  const roleLabels = {};
  for (const b of boxes) {
    if (b.role) roleLabels[b.id] = `${ROLE_SHORT[b.role] || b.role}${b.layer ?? ""}`;
  }
  // 절 분석: clauses에서 mergedRows 만들기 (학습 페이지의 mergedRow 형식)
  const clauses = sentence.clauses || [];
  const mergedRows = clauses.map((c) => {
    const range = c.range || [];
    let label = c.parentRole
      ? `${ROLE_SHORT[c.parentRole] || c.parentRole}${c.parentLayer ?? ""}`
      : "";
    // 이어진 문장은 별도 라벨
    if (c.clauseType === "대등" || c.clauseType === "종속") label = "이어진 문장";
    return { range, label, clauseType: c.clauseType || "" };
  });
  const slashSet = new Set(sentence.slashes || []);
  // 컬럼 인덱스 계산 (슬래시 칸 포함)
  const colMap = {};
  let col = 0;
  for (const b of boxes) {
    colMap[b.id] = col;
    col++;
    if (slashSet.has(b.id)) col++;
  }
  const totalCols = col;
  return (
    <div className="ss-sentence-block completed print-ss-block">
      <div className="print-ss-num">문장 {idx + 1}. {sentence.text || ""}</div>
      <table className="ss-table">
        <tbody>
          <tr>
            {boxes.map((box) => [
              <td key={box.id} className="ss-td">
                <div className="ss-box done">{box.text}</div>
              </td>,
              slashSet.has(box.id) ? <td key={`sl-${box.id}`} className="ss-td-slash">/</td> : null,
            ])}
          </tr>
          <tr>
            {boxes.map((box) => [
              <td key={`l-${box.id}`} className="ss-td">
                <div className="ss-label-cell">{roleLabels[box.id] || "\u00A0"}</div>
              </td>,
              slashSet.has(box.id) ? <td key={`lsl-${box.id}`} className="ss-td-slash"></td> : null,
            ])}
          </tr>
          {mergedRows.map((row, ri) => {
            const startCol = colMap[row.range[0]] ?? 0;
            const endCol = colMap[row.range[row.range.length - 1]] ?? 0;
            const span = endCol - startCol + 1;
            const cells = [];
            if (startCol > 0) cells.push(<td key={`pre-${ri}`} colSpan={startCol} className="ss-td"></td>);
            cells.push(
              <td key={`mr-${ri}`} colSpan={span} className="ss-td">
                <div className="ss-merged-cell">
                  <span className="ss-bracket">(</span>
                  <span className="ss-merged-label">{row.label}</span>
                  {row.clauseType && <span className="ss-clause-badge">{row.clauseType}</span>}
                  <span className="ss-bracket">)</span>
                </div>
              </td>
            );
            const afterCol = endCol + 1;
            if (afterCol < totalCols) cells.push(<td key={`post-${ri}`} colSpan={totalCols - afterCol} className="ss-td"></td>);
            return <tr key={`mrow-${ri}`}>{cells}</tr>;
          })}
        </tbody>
      </table>
      {sentence.explanation && (
        <div className="print-grammar-explain"><strong>해설:</strong> {sentence.explanation}</div>
      )}
    </div>
  );
}

function PrintAnswerKeyMorphemeAnalysis({ payload, isAdvanced }) {
  const sentences = payload.sentences || payload.items || [];
  return (
    <div className="print-grammar-answer-stack">
      {sentences.map((s, idx) => (
        <div key={s.id || idx} className="print-grammar-answer-block">
          <CompletedSentenceCard
            sentence={s}
            idx={idx}
            total={sentences.length}
            hadWrong={false}
            isAdvanced={isAdvanced}
          />
          {s.explanation && (
            <div className="print-grammar-explain"><strong>해설:</strong> {s.explanation}</div>
          )}
        </div>
      ))}
    </div>
  );
}
