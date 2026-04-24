import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
const TMP_DIR = path.join(ROOT, 'tmp');

const WRITE_LOCAL = process.argv.includes('--write-local');
const APPLY_DB = process.argv.includes('--apply-db');
const SOURCE_ARG = process.argv.find((arg) => arg.startsWith('--source='));
const SOURCE = SOURCE_ARG ? SOURCE_ARG.split('=')[1] : APPLY_DB ? 'db' : 'local';
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split('=')[1]) : null;

const LEVELS = [
  'saussure1',
  'saussure2',
  'saussure3',
  'frege1',
  'frege2',
  'frege3',
  'russell1',
  'russell2',
  'russell3',
  'wittgenstein1',
  'wittgenstein2',
  'wittgenstein3',
];

const CENTER = '\uC911\uC2EC';
const PARAGRAPH = '\uBB38\uB2E8';
const CONTENT = '\uB0B4\uC6A9';

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function extractConfigValue(source, key) {
  const match = source.match(new RegExp(`${key}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));
  if (!match) throw new Error(`DB config key not found: ${key}`);
  return match[1] ?? match[2];
}

function readDbConfig() {
  const source = fs.readFileSync(path.join(ROOT, 'scripts', 'import-pro-content.js'), 'utf8');
  const block = source.match(/const DB_CONFIG = \{([\s\S]*?)\};/);
  if (!block) throw new Error('DB_CONFIG block not found.');
  const configSource = block[1];
  return {
    host: extractConfigValue(configSource, 'host'),
    port: Number(extractConfigValue(configSource, 'port')) || 3306,
    user: extractConfigValue(configSource, 'user'),
    password: extractConfigValue(configSource, 'password'),
    database: extractConfigValue(configSource, 'database'),
  };
}

function createTunnel(dbConfig) {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();
    const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'korfarm-ec2.pem');
    sshClient.on('ready', () => {
      const server = net.createServer((sock) => {
        sshClient.forwardOut('127.0.0.1', 0, dbConfig.host, dbConfig.port, (err, stream) => {
          if (err) {
            sock.destroy(err);
            return;
          }
          sock.pipe(stream).pipe(sock);
        });
      });
      server.listen(0, '127.0.0.1', () => {
        resolve({ sshClient, server, localPort: server.address().port });
      });
    });
    sshClient.on('error', reject);
    sshClient.connect({
      host: '43.200.104.102',
      port: 22,
      username: 'ec2-user',
      privateKey: fs.readFileSync(keyPath),
    });
  });
}

async function closeTunnel(tunnel) {
  await new Promise((resolve) => tunnel.server.close(resolve));
  tunnel.sshClient.end();
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  return JSON.parse(value);
}

function payloadOf(doc) {
  return doc?.payload || doc || {};
}

function timelineOf(doc) {
  const payload = payloadOf(doc);
  return payload.intensive?.timeline || payload.timeline || [];
}

function setTimeline(doc, timeline) {
  const payload = payloadOf(doc);
  if (payload.intensive?.timeline) {
    payload.intensive.timeline = timeline;
    return;
  }
  if (payload.timeline) {
    payload.timeline = timeline;
  }
}

function paragraphsOf(doc) {
  const passage = payloadOf(doc).passage || {};
  return (passage.paragraphs || []).map((para, index) =>
    typeof para === 'string' ? { id: `p${index + 1}`, text: para } : para,
  );
}

function paragraphOrderMap(doc) {
  return new Map(paragraphsOf(doc).map((para, index) => [para.id, index]));
}

function normalizeHighlightRanges(step) {
  const highlight = step?.highlight;
  if (!highlight) return [];
  if (Array.isArray(highlight.ranges)) {
    return highlight.ranges
      .filter(Boolean)
      .map((range) => ({
        paragraphId: range.paragraphId,
        start: Number(range.start),
        end: Number(range.end),
      }));
  }
  if (highlight.paragraphId && highlight.range) {
    return [
      {
        paragraphId: highlight.paragraphId,
        start: Number(highlight.range.start),
        end: Number(highlight.range.end),
      },
    ];
  }
  if (highlight.paragraphId && highlight.mode === 'PARAGRAPH') {
    return [{ paragraphId: highlight.paragraphId, start: 0, end: Number.MAX_SAFE_INTEGER }];
  }
  if (Array.isArray(highlight.paragraphIds) && highlight.paragraphIds.length) {
    return highlight.paragraphIds.map((paragraphId) => ({
      paragraphId,
      start: 0,
      end: Number.MAX_SAFE_INTEGER,
    }));
  }
  return [];
}

function isCenterQuestion(step) {
  const prompt = String(step?.question?.prompt || '');
  return prompt.includes(PARAGRAPH) && prompt.includes(CENTER) && prompt.includes(CONTENT);
}

function stepSortInfo(step, originalIndex, pOrder) {
  const ranges = normalizeHighlightRanges(step);
  const firstRange = ranges[0] || {};
  const paragraphId = firstRange.paragraphId || '';
  const paragraphOrder = pOrder.has(paragraphId) ? pOrder.get(paragraphId) : Number.MAX_SAFE_INTEGER;
  const starts = ranges
    .filter((range) => range.paragraphId === paragraphId && Number.isFinite(range.start))
    .map((range) => range.start);
  const ends = ranges
    .filter((range) => range.paragraphId === paragraphId && Number.isFinite(range.end))
    .map((range) => range.end);
  return {
    originalIndex,
    stepId: step?.stepId || null,
    paragraphId,
    paragraphOrder,
    center: isCenterQuestion(step),
    start: starts.length ? Math.min(...starts) : Number.MAX_SAFE_INTEGER,
    end: ends.length ? Math.max(...ends) : Number.MAX_SAFE_INTEGER,
    prompt: step?.question?.prompt || '',
  };
}

function compareStepInfo(a, b) {
  if (a.paragraphOrder !== b.paragraphOrder) return a.paragraphOrder - b.paragraphOrder;
  if (a.center !== b.center) return a.center ? 1 : -1;
  if (!a.center && a.start !== b.start) return a.start - b.start;
  if (!a.center && a.end !== b.end) return a.end - b.end;
  return a.originalIndex - b.originalIndex;
}

function repairDoc(doc) {
  const timeline = timelineOf(doc);
  if (!Array.isArray(timeline) || timeline.length < 2) {
    return { changed: false, before: [], after: [], timeline };
  }
  const pOrder = paragraphOrderMap(doc);
  const before = timeline.map((step, index) => stepSortInfo(step, index, pOrder));
  const after = [...before].sort(compareStepInfo);
  const changed = after.some((info, idx) => info.originalIndex !== idx);
  if (!changed) return { changed: false, before, after, timeline };
  const nextTimeline = after.map((info) => timeline[info.originalIndex]);
  setTimeline(doc, nextTimeline);
  return { changed: true, before, after, timeline: nextTimeline };
}

function findOrderIssues(doc) {
  const pOrder = paragraphOrderMap(doc);
  const infos = timelineOf(doc).map((step, index) => stepSortInfo(step, index, pOrder));
  const issues = [];
  const centers = infos.filter((info) => info.center);
  for (const center of centers) {
    for (const info of infos) {
      if (info.center) continue;
      if (info.paragraphId !== center.paragraphId) continue;
      if (info.originalIndex > center.originalIndex) {
        issues.push({
          paragraphId: center.paragraphId,
          centerStepId: center.stepId,
          centerIndex: center.originalIndex + 1,
          laterStepId: info.stepId,
          laterIndex: info.originalIndex + 1,
          laterStart: info.start,
        });
      }
    }
  }
  return issues;
}

function loadLocalItems() {
  const items = [];
  for (const level of LEVELS) {
    const dir = path.join(DAILY_DIR, level);
    if (!fs.existsSync(dir)) continue;
    const names = fs.readdirSync(dir).filter((name) => /^\d{3}\.json$/.test(name)).sort();
    for (const fileName of names) {
      const abs = path.join(dir, fileName);
      const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
      const doc = JSON.parse(fs.readFileSync(abs, 'utf8'));
      items.push({
        source: 'local',
        abs,
        rel,
        contentId: doc.contentId,
        title: doc.title,
        levelId: doc.targetLevel,
        dayIndex: Number(fileName.slice(0, 3)),
        doc,
      });
    }
  }
  return items;
}

async function loadDbItems(conn) {
  const [rows] = await conn.query(
    `SELECT c.id, c.title, c.level_id, c.day_index, cv.content_json
     FROM contents c
     JOIN content_versions cv ON cv.content_id = c.id
     WHERE c.content_type = 'DAILY_READING'
     ORDER BY c.level_id, c.day_index, c.id`,
  );
  return rows.map((row) => ({
    source: 'db',
    abs: null,
    rel: null,
    contentId: row.id,
    title: row.title,
    levelId: row.level_id,
    dayIndex: row.day_index,
    originalContentJson: row.content_json,
    doc: parseMaybeJson(row.content_json),
  }));
}

function summarizeOrder(infos) {
  return infos.map((info, index) => ({
    index: index + 1,
    originalIndex: info.originalIndex + 1,
    stepId: info.stepId,
    paragraphId: info.paragraphId,
    center: info.center,
    start: Number.isFinite(info.start) ? info.start : null,
    prompt: info.prompt,
  }));
}

function processItems(items) {
  const changed = [];
  const issuesBefore = [];
  const issuesAfter = [];
  for (const item of items) {
    const beforeIssues = findOrderIssues(item.doc);
    if (beforeIssues.length) {
      issuesBefore.push({
        contentId: item.contentId,
        title: item.title,
        levelId: item.levelId,
        dayIndex: item.dayIndex,
        rel: item.rel,
        issues: beforeIssues,
      });
    }
    const result = repairDoc(item.doc);
    const afterIssues = findOrderIssues(item.doc);
    if (afterIssues.length) {
      issuesAfter.push({
        contentId: item.contentId,
        title: item.title,
        levelId: item.levelId,
        dayIndex: item.dayIndex,
        rel: item.rel,
        issues: afterIssues,
      });
    }
    if (result.changed) {
      changed.push({
        item,
        before: summarizeOrder(result.before),
        after: summarizeOrder(result.after),
      });
    }
    if (LIMIT && changed.length >= LIMIT) break;
  }
  return { changed, issuesBefore, issuesAfter };
}

function writeLocalChanges(changed, runStamp) {
  const backupDir = path.join(TMP_DIR, `daily-reading-intensive-order-backup-${runStamp}`);
  ensureDir(backupDir);
  for (const entry of changed) {
    const { item } = entry;
    const backupPath = path.join(backupDir, item.rel);
    ensureDir(path.dirname(backupPath));
    fs.copyFileSync(item.abs, backupPath);
    fs.writeFileSync(item.abs, `${JSON.stringify(item.doc, null, 2)}\n`, 'utf8');
  }
  return backupDir;
}

async function updateDbChanges(conn, changed, runStamp) {
  const backupPath = path.join(TMP_DIR, `daily-reading-intensive-order-db-backup-${runStamp}.json`);
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(
      changed.map(({ item }) => ({
        contentId: item.contentId,
        title: item.title,
        levelId: item.levelId,
        dayIndex: item.dayIndex,
        content_json: item.originalContentJson,
      })),
      null,
      2,
    )}\n`,
    'utf8',
  );
  await conn.beginTransaction();
  try {
    for (const { item } of changed) {
      await conn.execute(
        'UPDATE content_versions SET content_json = ?, updated_at = NOW() WHERE content_id = ?',
        [JSON.stringify(item.doc), item.contentId],
      );
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  }
  return backupPath;
}

function writeReport(report, runStamp) {
  const reportPath = path.join(TMP_DIR, `daily-reading-intensive-order-report-${report.source}-${runStamp}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

async function main() {
  ensureDir(TMP_DIR);
  const runStamp = stamp();
  let tunnel = null;
  let conn = null;
  try {
    let items;
    if (SOURCE === 'db') {
      const dbConfig = readDbConfig();
      tunnel = await createTunnel(dbConfig);
      conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: tunnel.localPort,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        charset: 'utf8mb4',
      });
      items = await loadDbItems(conn);
    } else if (SOURCE === 'local') {
      items = loadLocalItems();
    } else {
      throw new Error(`Unsupported --source value: ${SOURCE}`);
    }

    const { changed, issuesBefore, issuesAfter } = processItems(items);
    let localBackupDir = null;
    let dbBackupPath = null;
    if (WRITE_LOCAL && SOURCE === 'local' && changed.length) {
      localBackupDir = writeLocalChanges(changed, runStamp);
    }
    if (APPLY_DB && SOURCE === 'db' && changed.length) {
      dbBackupPath = await updateDbChanges(conn, changed, runStamp);
    }

    const report = {
      source: SOURCE,
      generatedAt: new Date().toISOString(),
      writeLocal: WRITE_LOCAL,
      applyDb: APPLY_DB,
      totalItems: items.length,
      changedItems: changed.length,
      issuesBeforeCount: issuesBefore.length,
      issuesAfterCount: issuesAfter.length,
      localBackupDir,
      dbBackupPath,
      changed: changed.map(({ item, before, after }) => ({
        contentId: item.contentId,
        title: item.title,
        levelId: item.levelId,
        dayIndex: item.dayIndex,
        rel: item.rel,
        before,
        after,
      })),
      issuesBefore,
      issuesAfter,
    };
    const reportPath = writeReport(report, runStamp);
    console.log(
      JSON.stringify(
        {
          source: SOURCE,
          totalItems: items.length,
          changedItems: changed.length,
          issuesBeforeCount: issuesBefore.length,
          issuesAfterCount: issuesAfter.length,
          localBackupDir,
          dbBackupPath,
          reportPath: path.relative(ROOT, reportPath).replace(/\\/g, '/'),
        },
        null,
        2,
      ),
    );
  } finally {
    if (conn) await conn.end();
    if (tunnel) await closeTunnel(tunnel);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
