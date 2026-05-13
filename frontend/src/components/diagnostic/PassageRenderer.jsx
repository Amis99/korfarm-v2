import Markdown from "react-markdown";
import { mdImgRenderer } from "../FileImage";

function PassageRenderer({ text }) {
  if (!text) return null;

  return (
    <div className="diag-test-passage">
      <Markdown components={{ img: mdImgRenderer }}>{text}</Markdown>
    </div>
  );
}

export default PassageRenderer;
