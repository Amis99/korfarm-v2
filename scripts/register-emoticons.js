#!/usr/bin/env node
/**
 * 이모티콘 이미지 배경 제거 + DB 직접 등록 스크립트.
 *
 * 1. 분홍 배경을 투명으로 변환
 * 2. SCP로 서버에 업로드
 * 3. DB에 files + chat_emoticons 레코드 INSERT
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SRC_DIR = path.join(__dirname, "..", "frontend", "public", "emoticons");
const OUT_DIR = path.join(__dirname, "..", "frontend", "public", "emoticons", "transparent");
const SSH_KEY = "~/.ssh/korfarm-ec2.pem";
const EC2 = "ec2-user@43.200.104.102";
const RDS_HOST = "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com";
const RDS_USER = "admin";
const RDS_PASS = "xXoM4Ld7VAIYl9W874md5kic";
const RDS_DB = "korfarm";

// 이모티콘 이름 매핑
const NAMES = {
  "podo_v2_1_goodmorning": "굿모닝이야옹",
  "podo_v2_2_hello": "안녕하세요",
  "podo_v2_3_thankyou": "감사합니다",
  "podo_v2_4_sleepy": "졸려요",
  "podo_v2_5_fun": "재밌다",
  "podo_v2_6_miracle": "기적이야",
  "podo_v2_7_study": "공부중",
  "podo_v2_8_work": "일하는중",
  "joong_v2_1_sleeping": "잠자기",
  "joong_v2_2_eating": "냠냠",
  "joong_v2_3_bowing": "인사",
  "joong_v2_4_going": "출발",
  "joong_v2_5_studying": "열공",
  "joong_v2_6_laughing": "하하하",
  "joong_v2_7_crying": "엉엉",
  "joong_v2_8_angry": "화남",
};

async function removeBackground(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();

  // raw 픽셀 데이터 추출
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 좌상단 픽셀 색상을 배경으로 간주
  const bgR = data[0], bgG = data[1], bgB = data[2];
  const tolerance = 40;

  // 배경색과 비슷한 픽셀을 투명으로
  for (let i = 0; i < data.length; i += 4) {
    const dr = Math.abs(data[i] - bgR);
    const dg = Math.abs(data[i + 1] - bgG);
    const db = Math.abs(data[i + 2] - bgB);
    if (dr < tolerance && dg < tolerance && db < tolerance) {
      data[i + 3] = 0; // alpha = 0
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(outputPath);
}

async function main() {
  // 출력 디렉토리 생성
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith(".png") && !f.includes("transparent"));
  console.log(`이모티콘 ${files.length}개 처리 시작...`);

  const sqlLines = [];
  const fileIds = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(SRC_DIR, file);
    const outputPath = path.join(OUT_DIR, file);

    // 배경 제거
    console.log(`[${i + 1}/${files.length}] 배경 제거: ${file}`);
    await removeBackground(inputPath, outputPath);

    const stat = fs.statSync(outputPath);
    const nameKey = file.replace(/_\d{13}\.png$/, "");
    const emoName = NAMES[nameKey] || nameKey;
    const fileId = `file_emo_${String(i + 1).padStart(3, "0")}`;
    const emoId = `emo_${String(i + 1).padStart(3, "0")}`;

    fileIds.push({ fileId, localPath: outputPath, remotePath: `/opt/korfarm/uploads/${fileId}` });

    // files 테이블 INSERT
    sqlLines.push(`INSERT IGNORE INTO files (id, owner_id, purpose, url, mime, size, status, created_at, updated_at) VALUES ('${fileId}', 'u_ai_podo', 'chat-emoticon', '/v1/files/${fileId}/download', 'image/png', ${stat.size}, 'uploaded', NOW(), NOW());`);

    // chat_emoticons 테이블 INSERT
    sqlLines.push(`INSERT IGNORE INTO chat_emoticons (id, name, file_id, sort_order, status, created_by, created_at) VALUES ('${emoId}', '${emoName}', '${fileId}', ${i + 1}, 'active', 'u_ai_podo', NOW());`);
  }

  // SQL 파일 저장
  const sqlPath = path.join(__dirname, "emoticon_import.sql");
  fs.writeFileSync(sqlPath, sqlLines.join("\n") + "\n");
  console.log(`SQL 생성 완료: ${sqlPath} (${sqlLines.length}줄)`);

  // SCP로 이미지 업로드
  console.log("서버에 이미지 업로드 중...");
  for (const { fileId, localPath, remotePath } of fileIds) {
    try {
      execSync(`scp -i ${SSH_KEY} "${localPath}" ${EC2}:${remotePath}`, { stdio: "pipe" });
      console.log(`  ✓ ${fileId}`);
    } catch (e) {
      console.error(`  ✗ ${fileId}: ${e.message}`);
    }
  }

  // DB에 SQL 실행
  console.log("DB에 등록 중...");
  try {
    execSync(`scp -i ${SSH_KEY} "${sqlPath}" ${EC2}:/tmp/emoticon_import.sql`, { stdio: "pipe" });
    const result = execSync(
      `ssh -i ${SSH_KEY} ${EC2} "mysql -h ${RDS_HOST} -u ${RDS_USER} -p${RDS_PASS} ${RDS_DB} < /tmp/emoticon_import.sql"`,
      { stdio: "pipe" }
    );
    console.log("DB 등록 완료!");
  } catch (e) {
    console.error("DB 등록 실패:", e.stderr?.toString() || e.message);
  }

  console.log(`\n완료: ${files.length}개 이모티콘 등록`);
}

main().catch(console.error);
