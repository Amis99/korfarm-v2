function groupTokensByParagraph(tokens) {
  return tokens.reduce((acc, token) => {
    const key = token.paragraphId || "p1";
    if (!acc[key]) acc[key] = [];
    acc[key].push(token);
    return acc;
  }, {});
}

function TokenPassage({ passage, highlightTokens = [], onTokenClick, activeTokenIds = [] }) {
  if (!passage) {
    return null;
  }

  const paragraphs = passage.paragraphs || [];
  const tokens = passage.tokens || [];
  const grouped = groupTokensByParagraph(tokens);

  return (
    <div className="token-passage">
      {paragraphs.map((paragraph) => {
        const paragraphTokens = grouped[paragraph.id] || [];
        if (paragraphTokens.length === 0) {
          return <p key={paragraph.id}>{paragraph.text}</p>;
        }
        return (
          <p key={paragraph.id}>
            {paragraphTokens.map((token) => {
              const isHighlight = highlightTokens.includes(token.tokenId);
              const isActive = activeTokenIds.includes(token.tokenId);
              return (
                <span key={token.tokenId}>
                  <button
                    type="button"
                    className={`token-chip ${isHighlight ? "worksheet-highlight" : ""} ${
                      isActive ? "active" : ""
                    }`}
                    onClick={() => onTokenClick?.(token)}
                  >
                    {token.text}
                  </button>{" "}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

export default TokenPassage;
