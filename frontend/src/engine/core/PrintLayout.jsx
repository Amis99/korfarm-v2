import { useMemo } from "react";

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

  // CHOICE_ANALYSIS / CHOICE_OX는 별도 형식
  if (question.type === "CHOICE_ANALYSIS" || question.type === "CHOICE_OX") {
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

  // 모든 문장을 수집해서 ①②③… 번호 매김
  const allSentences = [];
  paragraphs.forEach((p) => {
    (p.sentences || []).forEach((s) => allSentences.push({ ...s, paragraphId: p.id }));
  });
  const idToNum = {};
  allSentences.forEach((s, i) => { idToNum[s.id] = i + 1; });

  return (
    <li className="print-question print-choice-analysis-item">
      <div className="print-q-header">
        <span className="print-q-num">{num}.</span>
        <span className="print-q-stem">{stem}</span>
      </div>
      {paragraphs.length > 0 && (
        <div className="print-q-passage">
          {paragraphs.map((p) => (
            <p key={p.id} className="print-ca-paragraph">
              {(p.sentences || []).map((s) => (
                <span key={s.id}>
                  <sup className="print-ca-sentnum">{idToNum[s.id]}</sup>
                  {s.text + " "}
                </span>
              ))}
            </p>
          ))}
        </div>
      )}
      <ol className="print-ca-choices">
        {choices.map((c, ci) => (
          <li key={c.choiceId || c.id || ci} className="print-ca-choice">
            <span className="print-q-choice-num">{ci + 1}</span>
            <span className="print-ca-choice-text">{c.text}</span>
            <span className="print-ca-ox">⃝O ⃝X</span>
            <span className="print-ca-evidence">근거 문장: [          ]</span>
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
          answerText = (q.choices || [])
            .map((c) => `${c.choiceId || c.id}=${c.expectedOX || (c.finalIsCorrectChoice ? "X" : "O")}`)
            .join(", ");
        } else if (q.type === "FILL_BLANKS" && q.blanks) {
          answerText = q.blanks
            .map((b, bi) => {
              const c = b.choices?.find((c) => c.id === b.answerId);
              return `빈칸${bi + 1}: ${c?.text || b.answerId || "-"}`;
            })
            .join(" / ");
        } else if (q.choices && q.answerId) {
          const correct = q.choices.find((c) => (c.id || c.choiceId) === q.answerId);
          answerText = correct ? `${q.answerId}. ${correct.text}` : q.answerId;
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
          const correct = (q.choices || []).find((c) => c.id === q.answerId);
          return (
            <li key={step.stepId || idx} className="print-answer-item">
              <div className="print-answer-num">{idx + 1}</div>
              <div className="print-answer-correct">
                정답: {correct ? `${q.answerId}. ${correct.text}` : q.answerId || "-"}
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
    <ol className="print-answer-list">
      {words.map((w, idx) => {
        const steps = w.steps || [];
        const ruleNames = steps
          .map((s) => s.rule || s.ruleName || s.questionType)
          .filter(Boolean)
          .join(" → ");
        return (
          <li key={w.id || idx} className="print-answer-item">
            <div className="print-answer-num">{idx + 1}. {w.surface || w.word}</div>
            <div className="print-answer-correct">변동: {ruleNames || "-"}</div>
            {steps.length > 0 && (
              <div className="print-answer-explanation">
                {steps.map((s, si) => (
                  <div key={si}>
                    {si + 1}단계: {s.description || s.rule || ""}
                    {s.targetCellNo != null && ` (셀 ${s.targetCellNo})`}
                  </div>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PrintAnswerKeyWordFormation({ payload }) {
  const items = payload.items || payload.words || [];
  return (
    <ol className="print-answer-list">
      {items.map((item, idx) => (
        <li key={item.id || idx} className="print-answer-item">
          <div className="print-answer-num">{idx + 1}. {item.word || item.surface}</div>
          {item.morphemes && (
            <div className="print-answer-correct">
              형태소: {(item.morphemes || []).map((m) => `${m.text}(${m.type || ""})`).join(" + ")}
            </div>
          )}
          {item.formationType && (
            <div className="print-answer-correct">형성 방식: {item.formationType}</div>
          )}
          {item.explanation && (
            <div className="print-answer-explanation"><strong>해설:</strong> {item.explanation}</div>
          )}
        </li>
      ))}
    </ol>
  );
}

function PrintAnswerKeySentenceStructure({ payload }) {
  const sentences = payload.sentences || payload.items || [];
  return (
    <ol className="print-answer-list">
      {sentences.map((s, idx) => (
        <li key={s.id || idx} className="print-answer-item">
          <div className="print-answer-num">{idx + 1}. {s.text || s.sentence}</div>
          {s.components && (
            <div className="print-answer-correct">
              성분: {(s.components || []).map((c) => `${c.text}(${c.role || ""})`).join(" / ")}
            </div>
          )}
          {s.structure && (
            <div className="print-answer-correct">짜임: {s.structure}</div>
          )}
          {s.explanation && (
            <div className="print-answer-explanation"><strong>해설:</strong> {s.explanation}</div>
          )}
        </li>
      ))}
    </ol>
  );
}

function PrintAnswerKeyMorphemeAnalysis({ payload }) {
  const sentences = payload.sentences || payload.items || [];
  return (
    <ol className="print-answer-list">
      {sentences.map((s, idx) => (
        <li key={s.id || idx} className="print-answer-item">
          <div className="print-answer-num">{idx + 1}. {s.text || s.sentence}</div>
          {s.morphemes && (
            <div className="print-answer-correct">
              {(s.morphemes || []).map((m) => `${m.text}(${m.pos || m.type || ""})`).join(" + ")}
            </div>
          )}
          {s.explanation && (
            <div className="print-answer-explanation"><strong>해설:</strong> {s.explanation}</div>
          )}
        </li>
      ))}
    </ol>
  );
}
