import fs from "node:fs";
import path from "node:path";
import JSZip from "../frontend/node_modules/jszip/lib/index.js";

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error("Usage: node scripts/markdown_to_compact_docx.mjs <source.md> <target.docx>");
  process.exit(1);
}

const FONT = "Malgun Gothic";
const NORMAL_SIZE = 17; // 8.5 pt in half-points
const TABLE_SIZE = 16; // 8 pt
const CODE_SIZE = 15; // 7.5 pt

const xmlEscape = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function cleanInline(text) {
  return String(text ?? "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .trim();
}

function rPr(size = NORMAL_SIZE, bold = false, mono = false) {
  const font = mono ? "Consolas" : FONT;
  return `<w:rPr>${bold ? "<w:b/>" : ""}<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:eastAsia="${font}" w:cs="${font}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>`;
}

function textRuns(text, size = NORMAL_SIZE, bold = false, mono = false) {
  const parts = String(text ?? "").split(/\n/);
  return parts.map((part, idx) => {
    const br = idx > 0 ? "<w:br/>" : "";
    return `${br}<w:r>${rPr(size, bold, mono)}<w:t xml:space="preserve">${xmlEscape(part)}</w:t></w:r>`;
  }).join("");
}

function paragraph(text, opts = {}) {
  const size = opts.size ?? NORMAL_SIZE;
  const bold = opts.bold ?? false;
  const mono = opts.mono ?? false;
  const style = opts.style ? `<w:pStyle w:val="${opts.style}"/>` : "";
  const align = opts.align ? `<w:jc w:val="${opts.align}"/>` : "";
  const before = opts.before ?? 0;
  const after = opts.after ?? 20;
  const indent = opts.indent ? `<w:ind w:left="${opts.indent}"/>` : "";
  return `<w:p><w:pPr>${style}${align}${indent}<w:spacing w:before="${before}" w:after="${after}" w:line="200" w:lineRule="auto"/></w:pPr>${textRuns(text, size, bold, mono)}</w:p>`;
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function splitTableRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  const cells = [];
  let cur = "";
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === "\\" && s[i + 1] === "|") {
      cur += "|";
      i += 1;
      continue;
    }
    if (ch === "|") {
      cells.push(cleanInline(cur));
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cleanInline(cur));
  return cells;
}

function isTableSeparator(line) {
  if (!line.trim().startsWith("|")) return false;
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s/g, "")));
}

function table(rows) {
  if (!rows.length) return "";
  const colCount = Math.max(...rows.map((r) => r.length));
  const grid = Array.from({ length: colCount }, () => '<w:gridCol w:w="1600"/>').join("");
  const body = rows.map((row, rowIdx) => {
    const cells = Array.from({ length: colCount }, (_, i) => row[i] ?? "");
    const cellXml = cells.map((cell) =>
      `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/><w:tcMar><w:top w:w="35" w:type="dxa"/><w:left w:w="35" w:type="dxa"/><w:bottom w:w="35" w:type="dxa"/><w:right w:w="35" w:type="dxa"/></w:tcMar></w:tcPr>${paragraph(cell, { size: TABLE_SIZE, bold: rowIdx === 0, after: 0 })}</w:tc>`
    ).join("");
    const trPr = rowIdx === 0 ? "<w:trPr><w:tblHeader/></w:trPr>" : "";
    return `<w:tr>${trPr}${cellXml}</w:tr>`;
  }).join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblLayout w:type="autofit"/><w:tblBorders><w:top w:val="single" w:sz="2" w:space="0" w:color="BFBFBF"/><w:left w:val="single" w:sz="2" w:space="0" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="2" w:space="0" w:color="BFBFBF"/><w:right w:val="single" w:sz="2" w:space="0" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="2" w:space="0" w:color="D9D9D9"/><w:insideV w:val="single" w:sz="2" w:space="0" w:color="D9D9D9"/></w:tblBorders><w:tblCellMar><w:top w:w="35" w:type="dxa"/><w:left w:w="35" w:type="dxa"/><w:bottom w:w="35" w:type="dxa"/><w:right w:w="35" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${body}</w:tbl>`;
}

function heading(text, level) {
  const sizes = { 1: 28, 2: 22, 3: 20, 4: 18, 5: 17, 6: 17 };
  const before = level === 1 ? 120 : 80;
  const after = level <= 2 ? 60 : 35;
  return paragraph(cleanInline(text), { size: sizes[level] ?? 17, bold: true, before, after });
}

function markdownToBody(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  let inCode = false;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inCode = !inCode;
      i += 1;
      continue;
    }
    if (inCode) {
      out.push(paragraph(line, { size: CODE_SIZE, mono: true, after: 0 }));
      i += 1;
      continue;
    }
    if (/page-break-after:\s*always/i.test(line)) {
      out.push(pageBreak());
      i += 1;
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.trim().startsWith("|") && lines[i + 1] && isTableSeparator(lines[i + 1])) {
      const rows = [splitTableRow(line)];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      out.push(table(rows));
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      out.push(heading(h[2], h[1].length));
      i += 1;
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      out.push(paragraph(`- ${cleanInline(bullet[1])}`, { indent: 240 }));
      i += 1;
      continue;
    }
    const numbered = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (numbered) {
      out.push(paragraph(`${numbered[1]}. ${cleanInline(numbered[2])}`, { indent: 240 }));
      i += 1;
      continue;
    }
    out.push(paragraph(cleanInline(line)));
    i += 1;
  }
  return out.join("");
}

const now = new Date().toISOString();
const body = markdownToBody(fs.readFileSync(src, "utf8"));

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="567" w:right="567" w:bottom="567" w:left="567" w:header="284" w:footer="284" w:gutter="0"/></w:sectPr></w:body>
</w:document>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}" w:cs="${FONT}"/><w:sz w:val="${NORMAL_SIZE}"/><w:szCs w:val="${NORMAL_SIZE}"/></w:rPr><w:pPr><w:spacing w:before="0" w:after="20" w:line="200" w:lineRule="auto"/></w:pPr></w:style>
</w:styles>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="420"/></w:settings>`;

const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>프로젝트 전체 종합 보고서</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;

const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Codex OpenXML converter</Application></Properties>`;

const zip = new JSZip();
zip.file("[Content_Types].xml", contentTypes);
zip.folder("_rels").file(".rels", rootRels);
zip.folder("word").file("document.xml", documentXml);
zip.folder("word").file("styles.xml", stylesXml);
zip.folder("word").file("settings.xml", settingsXml);
zip.folder("word").folder("_rels").file("document.xml.rels", docRels);
zip.folder("docProps").file("core.xml", coreXml);
zip.folder("docProps").file("app.xml", appXml);

fs.mkdirSync(path.dirname(dest), { recursive: true });
const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
fs.writeFileSync(dest, buffer);
console.log(JSON.stringify({ src, dest, bytes: buffer.length }, null, 2));
