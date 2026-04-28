import PassageEditor from "./PassageEditor";
import IntensiveEditor from "./IntensiveEditor";
import RecallEditor from "./RecallEditor";
import ConfirmEditor from "./ConfirmEditor";

/**
 * 일일독해 워드 프로세서형 비주얼 에디터.
 * 4개 섹션: passage / intensive / recall / confirm
 * 학생 모듈(ReadingTrainingModule)이 그대로 이 4섹션을 순서대로 진행한다.
 */
export default function DailyReadingDocEditor({ editor }) {
  const { content } = editor;
  const passage = content?.passage || { paragraphs: [] };
  const intensive = content?.intensive || { timeline: [] };
  const recall = content?.recall || { cards: [], correctOrder: [], seedPenalty: 1 };
  const confirm = content?.confirm || { questions: [] };

  return (
    <div className="dq-doc-root">
      <div className="dq-doc-meta">
        <div className="dq-doc-meta-row">
          <label>
            제한 시간 (초)
            <input
              type="number"
              value={content?.timeLimitSec ?? 600}
              onChange={(e) => editor.updateField("timeLimitSec", Number(e.target.value))}
              style={{ width: 90 }}
            />
          </label>
          <label>
            씨앗 보상 개수
            <input
              type="number"
              value={content?.seedReward?.count ?? 3}
              onChange={(e) => editor.updateField("seedReward.count", Number(e.target.value))}
              style={{ width: 70 }}
            />
          </label>
          <span style={{ flex: 1 }} />
          <span className="dq-doc-meta-stat">
            정독 {intensive?.timeline?.length || 0} step · 복기 {recall?.cards?.length || 0} 카드 · 확인 {confirm?.questions?.length || 0} 질문
          </span>
        </div>
      </div>

      <div className="dq-doc-paper">
        <PassageEditor passage={passage} editor={editor} />
        <IntensiveEditor intensive={intensive} passage={passage} editor={editor} />
        <RecallEditor recall={recall} editor={editor} />
        <ConfirmEditor confirm={confirm} passage={passage} editor={editor} />
      </div>
    </div>
  );
}
