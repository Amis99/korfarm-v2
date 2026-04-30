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
    console.log('=== diag_questions question_type 분포 ===');
    const [r1] = await conn.execute(`SELECT question_type, COUNT(*) cnt FROM diag_questions GROUP BY question_type`);
    for (const r of r1) console.log(' ',r);

    console.log('\n=== tier × question_type ===');
    const [r2] = await conn.execute(`SELECT tier, question_type, COUNT(*) cnt FROM diag_questions GROUP BY tier, question_type ORDER BY tier, question_type`);
    for (const r of r2) console.log(' ',r);

    // 서술형 후보 — OBJECTIVE 가 아닌 것
    console.log('\n=== 서술형 (또는 OBJECTIVE 가 아닌) 샘플 5건 ===');
    const [r3] = await conn.execute(
      `SELECT id, tier, question_type, model_answer, LEFT(stem,80) stem FROM diag_questions WHERE question_type != 'OBJECTIVE' AND question_type != '객관식' LIMIT 5`
    );
    for (const r of r3) console.log(' ',r);

    console.log('\n=== diag_responses 가 참조하는 question 종류 ===');
    const [r4] = await conn.execute(
      `SELECT q.question_type, COUNT(*) cnt FROM diag_responses r JOIN diag_questions q ON r.question_id = q.id GROUP BY q.question_type`
    );
    for (const r of r4) console.log(' ',r);
  } finally {
    await conn.end();
    await new Promise(r=>t.server.close(r));
    t.ssh.end();
  }
})().catch(e=>{console.error(e);process.exit(1);});
