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
    console.log('=== ai_gen_jobs 최근 5건 ===');
    const [j] = await conn.execute(`SELECT id, kind, status, error_message, created_at, started_at, completed_at, TIMESTAMPDIFF(SECOND, started_at, completed_at) duration_sec FROM ai_gen_jobs ORDER BY created_at DESC LIMIT 5`);
    for (const r of j) console.log(' ', r);

    console.log('\n=== ai_gen_logs 최근 5건 ===');
    const [l] = await conn.execute(`SELECT id, kind, model, input_tokens, output_tokens, duration_ms, status, error_message, created_at FROM ai_gen_logs ORDER BY created_at DESC LIMIT 5`);
    for (const r of l) console.log(' ', r);
  } finally {
    await conn.end();
    await new Promise(r=>t.server.close(r));
    t.ssh.end();
  }
})().catch(e=>{console.error(e);process.exit(1);});
