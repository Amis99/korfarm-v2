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
    console.log('=== pro_test_sessions status 분포 ===');
    const [r1] = await conn.execute(`SELECT status, COUNT(*) cnt FROM pro_test_sessions GROUP BY status`);
    for (const r of r1) console.log(' ',r);

    console.log('\n=== pro_test_sessions의 test_id 별 카운트 (top 5) ===');
    const [r2] = await conn.execute(`SELECT test_id, status, COUNT(*) cnt FROM pro_test_sessions GROUP BY test_id, status ORDER BY cnt DESC LIMIT 10`);
    for (const r of r2) console.log(' ',r);

    console.log('\n=== 소쉬르1 1장 테스트(tp_db4b...) 관련 ===');
    const [r3] = await conn.execute(`SELECT id, user_id, status, score, created_at FROM pro_test_sessions WHERE test_id='tp_db4b361efab34fd693f311d943dcdc4a'`);
    for (const r of r3) console.log(' ',r);

    console.log('\n=== test_submissions for tp_db4b... ===');
    const [r4] = await conn.execute(`SELECT id, user_id, status, score, created_at FROM test_submissions WHERE test_id='tp_db4b361efab34fd693f311d943dcdc4a'`);
    for (const r of r4) console.log(' ',r);

    console.log('\n=== u_hq_admin 응시 검색 ===');
    const [r5] = await conn.execute(`SELECT id, test_id, status, score, created_at FROM pro_test_sessions WHERE user_id='u_hq_admin' ORDER BY created_at DESC LIMIT 5`);
    for (const r of r5) console.log(' pro:',r);
    const [r6] = await conn.execute(`SELECT id, test_id, status, score, created_at FROM test_submissions WHERE user_id='u_hq_admin' ORDER BY created_at DESC LIMIT 5`);
    for (const r of r6) console.log(' tsub:',r);
  } finally {
    await conn.end();
    await new Promise(r=>t.server.close(r));
    t.ssh.end();
  }
})().catch(e=>{console.error(e);process.exit(1);});
