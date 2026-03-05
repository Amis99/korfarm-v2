function ChoiceSelector({ choices = [], selected, onSelect }) {
  return (
    <div className="diag-test-choices">
      {choices.map(c => (
        <div
          key={c.choiceId}
          className={`diag-test-choice ${selected === c.choiceId ? "selected" : ""}`}
          onClick={() => onSelect(c.choiceId)}
        >
          <span className="diag-test-choice-id">{c.choiceId}</span>
          <span className="diag-test-choice-text">{c.text}</span>
        </div>
      ))}
    </div>
  );
}

export default ChoiceSelector;
