#!/usr/bin/env node
/**
 * 이모티콘 배경 제거 (flood fill 방식) + 서버 등록.
 * 가장자리에서 안쪽으로 채워가며 배경만 투명 처리.
 * 캐릭터 내부의 흰색(눈동자, 밥 등)은 건드리지 않음.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SRC_DIR = path.join(__dirname, "..", "frontend", "public", "emoticons");
const OUT_DIR = path.join(SRC_DIR, "transparent");
const SSH_KEY = "~/.ssh/korfarm-ec2.pem";
const EC2 = "ec2-user@43.200.104.102";
const RDS_HOST = "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com";
const RDS_USER = "admin";
const RDS_PASS = "xXoM4Ld7VAIYl9W874md5kic";
const RDS_DB = "korfarm";

const NAMES = {
  "joong_v2_1_sleeping": "잠자기",
  "joong_v2_2_eating": "냠냠",
  "joong_v2_3_bowing": "인사",
  "joong_v2_4_going": "출발",
  "joong_v2_5_studying": "열공",
  "joong_v2_6_laughing": "하하하",
  "joong_v2_7_crying": "엉엉",
  "joong_v2_8_angry": "화남",
  "podo_v2_1_goodmorning": "굿모닝이야옹",
  "podo_v2_2_hello": "안녕하세요",
  "podo_v2_3_thankyou": "감사합니다",
  "podo_v2_4_sleepy": "졸려요",
  "podo_v2_5_fun": "재밌다",
  "podo_v2_6_miracle": "기적이야",
  "podo_v2_7_study": "공부중",
  "podo_v2_8_work": "일하는중",
};

/**
 * Flood fill 방식 배경 제거.
 * 이미지 가장자리 픽셀에서 시작하여 배경색과 비슷한 픽셀을 투명으로 변환.
 * 캐릭터 내부는 연결되지 않으므로 투명 처리 안 됨.
 */
async function removeBackground(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const ch = 4; // RGBA
  const tolerance = 35;

  // 좌상단 픽셀을 배경색으로 간주
  const bgR = data[0], bgG = data[1], bgB = data[2];

  function isBg(idx) {
    if (data[idx + 3] === 0) return false; // 이미 투명
    const dr = Math.abs(data[idx] - bgR);
    const dg = Math.abs(data[idx + 1] - bgG);
    const db = Math.abs(data[idx + 2] - bgB);
    return dr < tolerance && dg < tolerance && db < tolerance;
  }

  function pixelIdx(x, y) {
    return (y * w + x) * ch;
  }

  // BFS flood fill — 가장자리에서 시작
  const visited = new Uint8Array(w * h);
  const queue = [];

  // 상하좌우 가장자리 모든 픽셀을 시드로
  for (let x = 0; x < w; x++) {
    queue.push([x, 0]);
    queue.push([x, h - 1]);
  }
  for (let y = 1; y < h - 1; y++) {
    queue.push([0, y]);
    queue.push([w - 1, y]);
  }

  // 시드 중 배경색인 것만 큐에 남김
  const startQueue = [];
  for (const [x, y] of queue) {
    const flat = y * w + x;
    if (!visited[flat] && isBg(pixelIdx(x, y))) {
      visited[flat] = 1;
      startQueue.push([x, y]);
    }
  }

  // BFS
  let head = 0;
  const bfsQueue = startQueue;
  const dx = [-1, 1, 0, 0];
  const dy = [0, 0, -1, 1];

  while (head < bfsQueue.length) {
    const [cx, cy] = bfsQueue[head++];
    const idx = pixelIdx(cx, cy);
    data[idx + 3] = 0; // 투명 처리

    for (let d = 0; d < 4; d++) {
      const nx = cx + dx[d];
      const ny = cy + dy[d];
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const flat = ny * w + nx;
      if (visited[flat]) continue;
      visited[flat] = 1;
      if (isBg(pixelIdx(nx, ny))) {
        bfsQueue.push([nx, ny]);
      }
    }
  }

  // 투명 영역 가장자리를 1px 더 침식 (깔끔한 엣지)
  // 단, 글자 주변은 건드리지 않기 위해 투명 픽셀 옆의 반투명만 처리
  const alphaClone = Buffer.from(data);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = pixelIdx(x, y);
      if (alphaClone[idx + 3] === 0) continue; // 이미 투명
      // 인접 4방향 중 2개 이상 투명이면 반투명으로
      let transparentNeighbors = 0;
      for (let d = 0; d < 4; d++) {
        const ni = pixelIdx(x + dx[d], y + dy[d]);
        if (alphaClone[ni + 3] === 0) transparentNeighbors++;
      }
      if (transparentNeighbors >= 2 && isBg(idx)) {
        data[idx + 3] = 0;
      }
    }
  }

  await sharp(data, { raw: { width: w, height: h, channels: ch } })
    .png()
    .toFile(outputPath);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith(".png") && !f.startsWith("."));
  console.log(`이모티콘 ${files.length}개 처리 시작...`);

  const sqlLines = [];
  // 기존 레코드 삭제 후 재삽입
  sqlLines.push("DELETE FROM chat_emoticons WHERE id LIKE 'emo_%';");
  sqlLines.push("DELETE FROM files WHERE id LIKE 'file_emo_%';");

  const fileIds = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(SRC_DIR, file);
    const outputPath = path.join(OUT_DIR, file);

    console.log(`[${i + 1}/${files.length}] 배경 제거: ${file}`);
    await removeBackground(inputPath, outputPath);

    const stat = fs.statSync(outputPath);
    const nameKey = file.replace(/_\d{13}\.png$/, "");
    const emoName = NAMES[nameKey] || nameKey;
    const fileId = `file_emo_${String(i + 1).padStart(3, "0")}`;
    const emoId = `emo_${String(i + 1).padStart(3, "0")}`;

    fileIds.push({ fileId, localPath: outputPath, remotePath: `/opt/korfarm/uploads/${fileId}` });

    sqlLines.push(`INSERT INTO files (id, owner_id, purpose, url, mime, size, status, created_at, updated_at) VALUES ('${fileId}', 'u_ai_podo', 'chat-emoticon', '/v1/files/${fileId}/download', 'image/png', ${stat.size}, 'uploaded', NOW(), NOW());`);
    sqlLines.push(`INSERT INTO chat_emoticons (id, name, file_id, sort_order, status, created_by, created_at) VALUES ('${emoId}', '${emoName}', '${fileId}', ${i + 1}, 'active', 'u_ai_podo', NOW());`);
  }

  const sqlPath = path.join(__dirname, "emoticon_import.sql");
  fs.writeFileSync(sqlPath, sqlLines.join("\n") + "\n");
  console.log(`SQL 생성 완료: ${sqlPath}`);

  console.log("서버에 이미지 업로드 중...");
  for (const { fileId, localPath, remotePath } of fileIds) {
    try {
      execSync(`scp -i ${SSH_KEY} "${localPath}" ${EC2}:${remotePath}`, { stdio: "pipe" });
      console.log(`  ✓ ${fileId}`);
    } catch (e) {
      console.error(`  ✗ ${fileId}: ${e.message}`);
    }
  }

  console.log("DB에 등록 중...");
  try {
    execSync(`scp -i ${SSH_KEY} "${sqlPath}" ${EC2}:/tmp/emoticon_import.sql`, { stdio: "pipe" });
    execSync(
      `ssh -i ${SSH_KEY} ${EC2} "mysql -h ${RDS_HOST} -u ${RDS_USER} -p${RDS_PASS} ${RDS_DB} < /tmp/emoticon_import.sql"`,
      { stdio: "pipe" }
    );
    console.log("DB 등록 완료!");
  } catch (e) {
    console.error("DB 등록 실패:", e.stderr?.toString() || e.message);
  }

  console.log(`\n완료: ${files.length}개 이모티콘 재등록`);
}

main().catch(console.error);
