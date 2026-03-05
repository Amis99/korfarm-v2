function ErrorPathChart({ paths = [] }) {
  if (paths.length === 0) return null;

  const maxVal = Math.max(...paths.map(p => p.contribution), 1);

  return (
    <ul className="bottleneck-paths">
      {paths.map((p, i) => (
        <li key={i}>
          <span>{p.path}</span>
          <span className="path-val">
            <span
              style={{
                display: "inline-block",
                width: `${Math.round((p.contribution / maxVal) * 60)}px`,
                height: 8,
                background: "#ef5350",
                borderRadius: 4,
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
            {p.contribution.toFixed(1)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default ErrorPathChart;
