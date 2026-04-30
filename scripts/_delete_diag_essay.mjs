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
    // 1) 서술형 응답이 정말 0건인지 안전 점검
    const [r0] = await conn.execute(
      `SELECT COUNT(*) cnt FROM diag_responses r JOIN diag_questions q ON r.question_id = q.id WHERE q.question_type='서술형'`
    );
    console.log('서술형 응답 수:', r0[0].cnt);
    if (r0[0].cnt > 0) {
      console.error('서술형 응답이 존재합니다. 안전을 위해 중단.');
      process.exit(1);
    }

    // 2) 삭제 대상 미리 확인
    const [r1] = await conn.execute(`SELECT COUNT(*) cnt FROM diag_questions WHERE question_type='서술형'`);
    console.log('삭제 대상 diag_questions:', r1[0].cnt);

    // 3) 삭제 실행
    const [del] = await conn.execute(`DELETE FROM diag_questions WHERE question_type='서술형'`);
    console.log('삭제 완료:', del.affectedRows, 'rows');

    // 4) 검증 — 종류별 분포
    console.log('\n=== 삭제 후 question_type 분포 ===');
    const [r2] = await conn.execute(`SELECT question_type, COUNT(*) cnt FROM diag_questions GROUP BY question_type`);
    for (const r of r2) console.log(' ',r);

    console.log('\n=== tier 별 문항 수 ===');
    const [r3] = await conn.execute(`SELECT tier, COUNT(*) cnt FROM diag_questions GROUP BY tier`);
    for (const r of r3) console.log(' ',r);
  } finally {
    await conn.end();
    await new Promise(r=>t.server.close(r));
    t.ssh.end();
  }
})().catch(e=>{console.error(e);process.exit(1);});
