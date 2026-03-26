/**
 * 인라인 HTML(<u>, <b>)과 마크다운(**bold**)을 React 엘리먼트로 변환하는 경량 파서.
 * dangerouslySetInnerHTML 없이 안전하게 렌더링.
 */
function RichText({ children }) {
  if (!children || typeof children !== 'string') return children ?? null;
  const text = children.replace(/\\n/g, '\n');
  const pattern = /(<u>[\s\S]*?<\/u>|<b>[\s\S]*?<\/b>|\*\*[\s\S]*?\*\*)/g;
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return <u key={i}>{part.slice(3, -4)}</u>;
    }
    if (part.startsWith('<b>') && part.endsWith('</b>')) {
      return <b key={i}>{part.slice(3, -4)}</b>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // 평문 내 \n을 <br/>로 변환
    if (part.includes('\n')) {
      return part.split('\n').flatMap((seg, j) =>
        j === 0 ? [seg] : [<br key={`${i}-br-${j}`} />, seg]
      );
    }
    return part;
  }).flat();
}

export default RichText;
