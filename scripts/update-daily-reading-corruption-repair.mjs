import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DAILY_DIR = path.join(ROOT, 'frontend', 'public', 'daily-reading');
const BAD = /\?{2,}|�/;

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

function readAffectedFiles() {
  const output = execFileSync('git', ['diff', '--name-only', '--', 'frontend/public/daily-reading'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return output
    .trim()
    .split(/\r?\n/)
    .filter((rel) => /frontend\/public\/daily-reading\/[^/]+\/\d{3}\.json$/.test(rel));
}

function readLocalDocs(files) {
  return files.map((rel) => {
    const doc = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    if (!doc.contentId) throw new Error(`Missing contentId: ${rel}`);
    if (doc.contentType !== 'DAILY_READING') throw new Error(`Not DAILY_READING: ${rel}`);
    return { rel, doc };
  });
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
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function main() {
  const affectedFiles = readAffectedFiles();
  const localItems = readLocalDocs(affectedFiles);
  const ids = localItems.map((item) => item.doc.contentId);
  if (!ids.length) throw new Error('No affected daily-reading JSON files found in git diff.');

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

    const [beforeRows] = await conn.query(
      `SELECT c.id, c.title, cv.id AS version_id, cv.schema_version, cv.content_json
       FROM contents c
       JOIN content_versions cv ON cv.content_id = c.id
       WHERE c.id IN (?)`,
      [ids],
    );
    const found = new Set(beforeRows.map((row) => row.id));
    const missing = ids.filter((id) => !found.has(id));
    if (missing.length) throw new Error(`Missing DB contents: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);

    fs.mkdirSync(path.join(ROOT, 'tmp'), { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(ROOT, 'tmp', `daily-reading-db-backup-${stamp}.json`);
    fs.writeFileSync(
      backupPath,
      `${JSON.stringify(beforeRows.map((row) => ({
        ...row,
        content_json: parseMaybeJson(row.content_json),
      })), null, 2)}\n`,
      'utf8',
    );

    await conn.beginTransaction();
    for (const { doc } of localItems) {
      const json = JSON.stringify(doc);
      await conn.execute(
        'UPDATE content_versions SET content_json = ?, updated_at = NOW() WHERE content_id = ?',
        [json, doc.contentId],
      );
      await conn.execute(
        'UPDATE contents SET title = ?, updated_at = NOW() WHERE id = ?',
        [doc.title, doc.contentId],
      );
    }
    await conn.commit();

    const [afterRows] = await conn.query(
      `SELECT c.id, c.title, cv.content_json
       FROM contents c
       JOIN content_versions cv ON cv.content_id = c.id
       WHERE c.id IN (?)`,
      [ids],
    );
    const targetedBroken = afterRows.filter((row) => BAD.test(row.title || '') || BAD.test(typeof row.content_json === 'string' ? row.content_json : JSON.stringify(row.content_json)));

    const [allDailyRows] = await conn.query(
      `SELECT c.id, c.title, cv.content_json
       FROM contents c
       JOIN content_versions cv ON cv.content_id = c.id
       WHERE c.content_type = 'DAILY_READING'`,
    );
    const allBroken = allDailyRows.filter((row) => BAD.test(row.title || '') || BAD.test(typeof row.content_json === 'string' ? row.content_json : JSON.stringify(row.content_json)));

    const report = {
      affectedFiles: affectedFiles.length,
      updatedContents: localItems.length,
      backupPath,
      targetedBroken: targetedBroken.length,
      dailyReadingRows: allDailyRows.length,
      dailyReadingBroken: allBroken.length,
      brokenSamples: allBroken.slice(0, 10).map((row) => row.id),
    };
    const reportPath = path.join(ROOT, 'tmp', `daily-reading-db-update-report-${stamp}.json`);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({ ...report, reportPath }, null, 2));
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch {
        // Ignore rollback failures during error handling.
      }
    }
    throw error;
  } finally {
    if (conn) await conn.end();
    await closeTunnel(tunnel);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
