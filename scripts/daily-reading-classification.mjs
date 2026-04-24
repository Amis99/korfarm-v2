import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
const TMP_DIR = path.join(ROOT, 'tmp');
const TAXONOMY_PATH = path.join(TMP_DIR, 'daily-reading-classification-workpacks', 'taxonomy.json');

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

const TARGET_BY_LEVEL = {
  saussure1: 'SAUSSURE_1',
  saussure2: 'SAUSSURE_2',
  saussure3: 'SAUSSURE_3',
  frege1: 'FREGE_1',
  frege2: 'FREGE_2',
  frege3: 'FREGE_3',
  russell1: 'RUSSELL_1',
  russell2: 'RUSSELL_2',
  russell3: 'RUSSELL_3',
  wittgenstein1: 'WITTGENSTEIN_1',
  wittgenstein2: 'WITTGENSTEIN_2',
  wittgenstein3: 'WITTGENSTEIN_3',
};

function ensureTmp() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function loadTaxonomy() {
  if (!fs.existsSync(TAXONOMY_PATH)) {
    throw new Error(
      `Missing taxonomy file: ${TAXONOMY_PATH}. Run \`node scripts/daily-reading-classification.mjs workpack --levels=frege2,frege3\` first.`,
    );
  }
  return JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf8'));
}

function taxonomyKeys() {
  return loadTaxonomy();
}

function selectedLevels() {
  const arg = process.argv.find((value) => value.startsWith('--levels='));
  if (!arg) return LEVELS;
  const levels = arg
    .slice('--levels='.length)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const unknown = levels.filter((level) => !LEVELS.includes(level));
  if (unknown.length > 0) {
    throw new Error(`Unknown levels: ${unknown.join(', ')}`);
  }
  return levels;
}

function isValidClassification(area, subArea) {
  const taxonomy = taxonomyKeys();
  return Object.hasOwn(taxonomy, area) && taxonomy[area].includes(subArea);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  return JSON.parse(value);
}

function numericFiles(level) {
  const dir = path.join(DAILY_DIR, level);
  return fs
    .readdirSync(dir)
    .filter((name) => /^\d{3}\.json$/.test(name))
    .sort()
    .map((name) => path.join(dir, name));
}

function passageText(doc) {
  const paragraphs = doc?.payload?.passage?.paragraphs;
  if (!Array.isArray(paragraphs)) return '';
  return paragraphs.map((p) => String(p.text || '')).join('\n\n');
}

function loadLocalItems(levels = LEVELS) {
  const items = [];
  for (const level of levels) {
    for (const filePath of numericFiles(level)) {
      const doc = readJson(filePath);
      const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
      items.push({
        source: 'local',
        level,
        targetLevel: doc.targetLevel || TARGET_BY_LEVEL[level],
        dayIndex: Number(path.basename(filePath, '.json')),
        rel,
        filePath,
        contentId: doc.contentId,
        title: doc.title,
        area: doc.area,
        subArea: doc.subArea,
        doc,
      });
    }
  }
  return items;
}

function collectLocalIssues(items) {
  const issues = [];
  const byAreaSubArea = new Map();
  const byLevel = {};
  for (const item of items) {
    byLevel[item.level] ??= { total: 0, invalid: 0 };
    byLevel[item.level].total += 1;
    const key = `${item.area ?? '<missing>'}\t${item.subArea ?? '<missing>'}`;
    byAreaSubArea.set(key, (byAreaSubArea.get(key) || 0) + 1);
    if (!item.contentId) {
      issues.push({ type: 'missingContentId', rel: item.rel });
    }
    if (!isValidClassification(item.area, item.subArea)) {
      byLevel[item.level].invalid += 1;
      issues.push({
        type: 'invalidClassification',
        rel: item.rel,
        contentId: item.contentId,
        title: item.title,
        area: item.area ?? null,
        subArea: item.subArea ?? null,
      });
    }
  }
  return {
    issues,
    byLevel,
    byAreaSubArea: [...byAreaSubArea.entries()]
      .map(([key, count]) => {
        const [area, subArea] = key.split('\t');
        return { area, subArea, count };
      })
      .sort((a, b) => a.area.localeCompare(b.area, 'ko') || a.subArea.localeCompare(b.subArea, 'ko')),
  };
}

function levelKey(targetLevel, dayIndex) {
  return `${targetLevel}\t${dayIndex}`;
}

function buildLocalIndex(items) {
  const index = new Map();
  for (const item of items) {
    const key = levelKey(item.targetLevel, item.dayIndex);
    if (index.has(key)) {
      throw new Error(`Duplicate local key detected: ${key}`);
    }
    index.set(key, item);
  }
  return index;
}

function writeWorkpacks() {
  ensureTmp();
  const outDir = path.join(TMP_DIR, 'daily-reading-classification-workpacks');
  fs.mkdirSync(outDir, { recursive: true });
  const levels = selectedLevels();
  const items = loadLocalItems(levels);
  const taxonomy = taxonomyKeys();
  for (const level of levels) {
    const lines = items
      .filter((item) => item.level === level)
      .map((item) =>
        JSON.stringify({
          rel: item.rel,
          contentId: item.contentId,
          targetLevel: item.targetLevel,
          dayIndex: item.dayIndex,
          title: item.title,
          currentArea: item.area ?? null,
          currentSubArea: item.subArea ?? null,
          description: item.doc.description ?? null,
          tags: item.doc.tags ?? [],
          passageText: passageText(item.doc),
        }),
      );
    fs.writeFileSync(path.join(outDir, `${level}.jsonl`), lines.join('\n') + '\n', 'utf8');
  }
  fs.writeFileSync(path.join(outDir, 'taxonomy.json'), JSON.stringify(taxonomy, null, 2) + '\n', 'utf8');
  return { outDir, totalItems: items.length };
}

function validateLocal() {
  ensureTmp();
  const levels = selectedLevels();
  const items = loadLocalItems(levels);
  const collected = collectLocalIssues(items);
  const report = {
    generatedAt: new Date().toISOString(),
    source: 'local',
    taxonomy: taxonomyKeys(),
    levels,
    totalContents: items.length,
    issueCount: collected.issues.length,
    byLevel: collected.byLevel,
    byAreaSubArea: collected.byAreaSubArea,
    issues: collected.issues,
  };
  const reportPath = path.join(TMP_DIR, `daily-reading-classification-local-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return { reportPath, report };
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

async function withDbConnection(run) {
  const dbConfig = readDbConfig();
  const tunnel = await createTunnel(dbConfig);
  let conn;
  try {
    conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: tunnel.localPort,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      charset: 'utf8mb4',
      multipleStatements: false,
    });
    return await run(conn);
  } finally {
    if (conn) await conn.end();
    await closeTunnel(tunnel);
  }
}

async function loadDbRows(conn, levels = LEVELS) {
  const targetLevels = levels.map((level) => TARGET_BY_LEVEL[level]);
  const placeholders = targetLevels.map(() => '?').join(', ');
  const [rows] = await conn.query(
    `SELECT c.id, c.title, c.level_id, c.day_index, c.area, c.sub_area, cv.content_json
     FROM contents c
     JOIN content_versions cv ON cv.content_id = c.id
     WHERE c.content_type = 'DAILY_READING'
       AND c.level_id IN (${placeholders})
     ORDER BY c.level_id, c.day_index, c.id`,
    targetLevels,
  );
  return rows.map((row) => ({
    ...row,
    doc: parseMaybeJson(row.content_json),
  }));
}

function collectDbIssues(rows, localIndex) {
  const issues = [];
  const byLevel = {};
  const byAreaSubArea = new Map();
  for (const row of rows) {
    const level = String(row.level_id || '').toLowerCase().replace(/_/g, '');
    byLevel[level] ??= { total: 0, invalid: 0, mismatch: 0 };
    byLevel[level].total += 1;

    const local = localIndex.get(levelKey(row.level_id, Number(row.day_index)));
    const jsonArea = row.doc?.area ?? null;
    const jsonSubArea = row.doc?.subArea ?? null;
    const distKey = `${row.area ?? '<missing>'}\t${row.sub_area ?? '<missing>'}`;
    byAreaSubArea.set(distKey, (byAreaSubArea.get(distKey) || 0) + 1);

    if (!local) {
      byLevel[level].mismatch += 1;
      issues.push({
        type: 'missingLocalMatch',
        id: row.id,
        levelId: row.level_id,
        dayIndex: row.day_index,
        title: row.title,
      });
      continue;
    }

    if (row.doc?.contentId && local.contentId && row.doc.contentId !== local.contentId) {
      byLevel[level].mismatch += 1;
      issues.push({
        type: 'contentIdMismatch',
        id: row.id,
        rel: local.rel,
        levelId: row.level_id,
        dayIndex: row.day_index,
        dbContentId: row.doc.contentId,
        localContentId: local.contentId,
      });
    }

    if (!isValidClassification(row.area, row.sub_area)) {
      byLevel[level].invalid += 1;
      issues.push({
        type: 'invalidDbColumns',
        id: row.id,
        rel: local.rel,
        levelId: row.level_id,
        dayIndex: row.day_index,
        area: row.area ?? null,
        subArea: row.sub_area ?? null,
      });
    }

    if (!isValidClassification(jsonArea, jsonSubArea)) {
      byLevel[level].invalid += 1;
      issues.push({
        type: 'invalidDbJson',
        id: row.id,
        rel: local.rel,
        levelId: row.level_id,
        dayIndex: row.day_index,
        area: jsonArea,
        subArea: jsonSubArea,
      });
    }

    if (row.area !== local.area || row.sub_area !== local.subArea) {
      byLevel[level].mismatch += 1;
      issues.push({
        type: 'columnMismatch',
        id: row.id,
        rel: local.rel,
        levelId: row.level_id,
        dayIndex: row.day_index,
        dbArea: row.area ?? null,
        dbSubArea: row.sub_area ?? null,
        localArea: local.area ?? null,
        localSubArea: local.subArea ?? null,
      });
    }

    if (jsonArea !== local.area || jsonSubArea !== local.subArea) {
      byLevel[level].mismatch += 1;
      issues.push({
        type: 'jsonMismatch',
        id: row.id,
        rel: local.rel,
        levelId: row.level_id,
        dayIndex: row.day_index,
        dbArea: jsonArea,
        dbSubArea: jsonSubArea,
        localArea: local.area ?? null,
        localSubArea: local.subArea ?? null,
      });
    }
  }
  return {
    issues,
    byLevel,
    byAreaSubArea: [...byAreaSubArea.entries()]
      .map(([key, count]) => {
        const [area, subArea] = key.split('\t');
        return { area, subArea, count };
      })
      .sort((a, b) => a.area.localeCompare(b.area, 'ko') || a.subArea.localeCompare(b.subArea, 'ko')),
  };
}

async function validateDb() {
  ensureTmp();
  const levels = selectedLevels();
  const localItems = loadLocalItems(levels);
  const localIndex = buildLocalIndex(localItems);
  const report = await withDbConnection(async (conn) => {
    const rows = await loadDbRows(conn, levels);
    const collected = collectDbIssues(rows, localIndex);
    return {
      generatedAt: new Date().toISOString(),
      source: 'db',
      taxonomy: taxonomyKeys(),
      levels,
      totalContents: rows.length,
      issueCount: collected.issues.length,
      byLevel: collected.byLevel,
      byAreaSubArea: collected.byAreaSubArea,
      issues: collected.issues,
    };
  });
  const reportPath = path.join(TMP_DIR, `daily-reading-classification-db-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return { reportPath, report };
}

function prepareDbUpdates(rows, localIndex) {
  const changed = [];
  const missingLocal = [];
  for (const row of rows) {
    const local = localIndex.get(levelKey(row.level_id, Number(row.day_index)));
    if (!local) {
      missingLocal.push({
        id: row.id,
        levelId: row.level_id,
        dayIndex: row.day_index,
        title: row.title,
      });
      continue;
    }
    const fixed = structuredClone(row.doc);
    fixed.area = local.area;
    fixed.subArea = local.subArea;
    const changedColumns = row.area !== local.area || row.sub_area !== local.subArea;
    const changedJson = row.doc?.area !== local.area || row.doc?.subArea !== local.subArea;
    if (changedColumns || changedJson) {
      changed.push({
        row,
        local,
        fixed,
        changedColumns,
        changedJson,
      });
    }
  }
  if (missingLocal.length) {
    throw new Error(`Missing local matches for ${missingLocal.length} DB rows.`);
  }
  return changed;
}

async function writeDbUpdates(conn, changed) {
  const retriableCodes = new Set(['ER_LOCK_WAIT_TIMEOUT', 'ER_LOCK_DEADLOCK']);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (const item of changed) {
    let attempt = 0;
    while (true) {
      attempt += 1;
      await conn.beginTransaction();
      try {
        await conn.execute(
          'UPDATE contents SET area = ?, sub_area = ?, updated_at = NOW() WHERE id = ?',
          [item.local.area, item.local.subArea, item.row.id],
        );
        await conn.execute(
          'UPDATE content_versions SET content_json = ?, updated_at = NOW() WHERE content_id = ?',
          [JSON.stringify(item.fixed), item.row.id],
        );
        await conn.commit();
        break;
      } catch (error) {
        await conn.rollback();
        if (retriableCodes.has(error.code) && attempt < 5) {
          await sleep(500 * attempt);
          continue;
        }
        throw error;
      }
    }
  }
}

async function syncDb(applyChanges) {
  ensureTmp();
  const levels = selectedLevels();
  const localItems = loadLocalItems(levels);
  const localIndex = buildLocalIndex(localItems);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return withDbConnection(async (conn) => {
    const rows = await loadDbRows(conn, levels);
    const backupPath = path.join(TMP_DIR, `daily-reading-classification-db-backup-${stamp}.json`);
    fs.writeFileSync(
      backupPath,
      JSON.stringify(
        rows.map((row) => ({
          id: row.id,
          title: row.title,
          level_id: row.level_id,
          day_index: row.day_index,
          area: row.area,
          sub_area: row.sub_area,
          content_json: row.doc,
        })),
        null,
        2,
      ) + '\n',
      'utf8',
    );

    const changed = prepareDbUpdates(rows, localIndex);
    if (applyChanges && changed.length) {
      await writeDbUpdates(conn, changed);
    }

    const report = {
      generatedAt: new Date().toISOString(),
      mode: applyChanges ? 'apply' : 'dry-run',
      levels,
      totalContents: rows.length,
      changedCount: changed.length,
      backupPath,
      changedSamples: changed.slice(0, 50).map((item) => ({
        id: item.row.id,
        rel: item.local.rel,
        levelId: item.row.level_id,
        dayIndex: item.row.day_index,
        before: {
          area: item.row.area ?? null,
          subArea: item.row.sub_area ?? null,
          jsonArea: item.row.doc?.area ?? null,
          jsonSubArea: item.row.doc?.subArea ?? null,
        },
        after: {
          area: item.local.area ?? null,
          subArea: item.local.subArea ?? null,
        },
      })),
    };
    const reportPath = path.join(
      TMP_DIR,
      `daily-reading-classification-db-${applyChanges ? 'upload' : 'dry-run'}-${stamp}.json`,
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
    return { reportPath, report };
  });
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

async function main() {
  const command = process.argv[2];
  if (command === 'workpack') {
    printJson(writeWorkpacks());
    return;
  }
  if (command === 'validate-local') {
    const { reportPath, report } = validateLocal();
    printJson({ reportPath, totalContents: report.totalContents, issueCount: report.issueCount, byAreaSubArea: report.byAreaSubArea });
    process.exitCode = report.issueCount === 0 ? 0 : 1;
    return;
  }
  if (command === 'validate-db') {
    const { reportPath, report } = await validateDb();
    printJson({ reportPath, totalContents: report.totalContents, issueCount: report.issueCount, byAreaSubArea: report.byAreaSubArea });
    process.exitCode = report.issueCount === 0 ? 0 : 1;
    return;
  }
  if (command === 'dry-run-upload-db') {
    const { reportPath, report } = await syncDb(false);
    printJson({ reportPath, totalContents: report.totalContents, changedCount: report.changedCount });
    return;
  }
  if (command === 'upload-db') {
    const { reportPath, report } = await syncDb(true);
    printJson({ reportPath, totalContents: report.totalContents, changedCount: report.changedCount });
    return;
  }
  printJson({
    usage: [
      'node scripts/daily-reading-classification.mjs workpack',
      'node scripts/daily-reading-classification.mjs validate-local',
      'node scripts/daily-reading-classification.mjs validate-db',
      'node scripts/daily-reading-classification.mjs dry-run-upload-db',
      'node scripts/daily-reading-classification.mjs upload-db',
    ],
  });
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
