import Markdown from "react-markdown";

function PassageRenderer({ text }) {
  if (!text) return null;

  return (
    <div className="diag-test-passage">
      <Markdown>{text}</Markdown>
    </div>
  );
}

export default PassageRenderer;
