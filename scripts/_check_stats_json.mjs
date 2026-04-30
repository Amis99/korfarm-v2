import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
function ext(s, k) { const m=s.match(new RegExp(`${k}:\\s*(?:['"]([^'"]+)['"]|(\\d+))`));return m?(m[1]??m[2]):null;}
function readDbConfig() {
  const src = fs.readFileSync(path.join(ROOT,'scripts','import-pro-content.js'),'utf8');
  const block = src.match(/const DB_CONFIG = \{([\s\S]*?)\};/)[1];
  return { host: ext(block,'host'), port: Number(ext(block,'port'))||3306, user: ext(block,'user'), password: ext(block,'password'), database: ext(block,'database') };
}
function tunnel(cfg) {
  return new Promise((resolve,reject)=>{const ssh=new Client();const keyPath=path.join(process.env.HOME||process.env.USERPROFILE,'.ssh','korfarm-ec2.pem');ssh.on('ready',()=>{const server=net.createServer((sock)=>{ssh.forwardOut('127.0.0.1',0,cfg.host,cfg.port,(err,stream)=>{if(err)return sock.destroy(err);sock.pipe(stream).pipe(sock);});});server.listen(0,'127.0.0.1',()=>resolve({ssh,server,port:server.address().port}));});ssh.on('error',reject);ssh.connect({host:'43.200.104.102',port:22,username:'ec2-user',privateKey:fs.readFileSync(keyPath)});});
}
(async () => {
  const cfg = readDbConfig();
  const t = await tunnel(cfg);
  const conn = await mysql.createConnection({host:'127.0.0.1',port:t.port,user:cfg.user,password:cfg.password,database:cfg.database,charset:'utf8mb4'});
  try {
    // 소쉬르1 1장 테스트의 응시 3건 — answers/stats 확인
    const TEST = 'tp_db4b361efab34fd693f311d943dcdc4a';
    console.log('=== test_submissions for', TEST, '===');
    const [r] = await conn.execute(
      `SELECT id, user_id, score, correct_count, status, answers_json, stats_json FROM test_submissions WHERE test_id=?`,
      [TEST]
    );
    for (const row of r) {
      console.log(`\n--- ${row.id} (user=${row.user_id}, score=${row.score}/cor=${row.correct_count}, status=${row.status}) ---`);
      console.log('answers_json:', String(row.answers_json).slice(0, 400));
      console.log('stats_json  :', String(row.stats_json || '(null)').slice(0, 600));
    }

    // 4번 문항 (서술형) 정보
    console.log('\n=== test_questions 4번 (서술형) for', TEST, '===');
    const [q] = await conn.execute(
      `SELECT id, number, type, points, correct_answer, model_answer, essay_keywords_json FROM test_questions WHERE test_id=? AND number IN (4,8,9)`,
      [TEST]
    );
    for (const row of q) console.log(' ', row);

    // 캐시 상태
    console.log('\n=== test_paper_statistics for', TEST, '===');
    const [c] = await conn.execute(
      `SELECT paper_id, submission_count, updated_at, JSON_LENGTH(question_stats_json) as q_len FROM test_paper_statistics WHERE paper_id=?`,
      [TEST]
    );
    for (const row of c) console.log(' ', row);
    if (c.length > 0) {
      const [c2] = await conn.execute(
        `SELECT JSON_EXTRACT(question_stats_json, '$[3]') as q4_json FROM test_paper_statistics WHERE paper_id=?`,
        [TEST]
      );
      console.log('  4번 캐시:', String(c2[0]?.q4_json || '(없음)').slice(0, 800));
    }
  } finally {
    await conn.end();
    await new Promise(r=>t.server.close(r));
    t.ssh.end();
  }
})().catch(e=>{console.error(e);process.exit(1);});
