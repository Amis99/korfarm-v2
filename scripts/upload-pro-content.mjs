/**
 * 프로모드 콘텐츠 업로드 스크립트
 *
 * 생성된 콘텐츠 파일(generated/)을 백엔드 API를 통해 DB에 업로드합니다.
 *
 * 사용법:
 *   node scripts/upload-pro-content.mjs
 *
 * 환경변수:
 *   API_URL  — 백엔드 URL (기본: http://localhost:8080)
 *   ADMIN_ID — 관리자 로그인 ID
 *   ADMIN_PW — 관리자 비밀번호
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const API_URL = process.env.API_URL || 'http://localhost:8080';
const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PW = process.env.ADMIN_PW || 'admin';

const GENERATED_DIR = resolve(import.meta.dirname, '..', 'generated');

// ── camelCase → snake_case 변환 ──
function toSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function keysToSnake(obj) {
  if (Array.isArray(obj)) return obj.map(keysToSnake);
  if (obj !== null && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      // content 내부는 변환하지 않음 (Map<String, Any>로 그대로 저장됨)
      if (k === 'content' || k === 'payload') {
        out[toSnake(k)] = v;
      } else {
        out[toSnake(k)] = keysToSnake(v);
      }
    }
    return out;
  }
  return obj;
}

// ── API 호출 ──
let authToken = '';

async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`API 응답 파싱 실패 (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok || !json.success) {
    throw new Error(`API 에러 (${res.status}): ${json.error || json.message || text.slice(0, 200)}`);
  }

  return json.data;
}

// ── 1. 로그인 ──
async function login() {
  console.log(`[로그인] ${ADMIN_ID}@${API_URL}`);
  const data = await api('POST', '/v1/auth/login', {
    login_id: ADMIN_ID,
    password: ADMIN_PW,
  });
  authToken = data.access_token || data.accessToken || data.token;
  if (!authToken) throw new Error('토큰을 받지 못했습니다: ' + JSON.stringify(data));
  console.log('  → 로그인 성공');
}

// ── 2. 배치 콘텐츠 업로드 ──
const LEVELS = [
  'saussure_1', 'saussure_2', 'saussure_3',
  'frege_1', 'frege_2', 'frege_3',
  'russell_1', 'russell_2', 'russell_3',
];

// generatedId → 실제 contentId 매핑
const contentIdMap = {};

async function uploadBatchContent() {
  const idMapping = JSON.parse(readFileSync(resolve(GENERATED_DIR, 'id-mapping.json'), 'utf-8'));

  let globalOffset = 0;

  for (const level of LEVELS) {
    const fp = resolve(GENERATED_DIR, `batch-import-${level}.json`);
    if (!existsSync(fp)) {
      console.log(`  [${level}] 파일 없음, 건너뜀`);
      continue;
    }

    const batchData = JSON.parse(readFileSync(fp, 'utf-8'));
    const items = batchData.items;
    console.log(`\n[콘텐츠 업로드] ${level} — ${items.length}개`);

    // 큰 배치를 50개씩 분할
    const CHUNK_SIZE = 50;
    for (let start = 0; start < items.length; start += CHUNK_SIZE) {
      const chunk = items.slice(start, start + CHUNK_SIZE);
      const snakeItems = chunk.map(item => keysToSnake(item));

      try {
        const result = await api('POST', '/v1/admin/content/batch-import', { items: snakeItems });
        console.log(`  ${level}[${start}..${start + chunk.length - 1}]: ${result.imported}개 성공, ${result.failed}개 실패`);

        // ID 매핑 구축
        for (const r of result.results) {
          if (r.success && r.content_id) {
            const globalIdx = globalOffset + start + r.index;
            const mapping = idMapping[String(globalIdx)];
            if (mapping) {
              contentIdMap[mapping.generatedId] = r.content_id;
            }
          }
        }
      } catch (err) {
        console.error(`  ${level}[${start}..${start + chunk.length - 1}] 실패:`, err.message);
      }
    }

    globalOffset += items.length;
  }

  console.log(`\n  → 총 ${Object.keys(contentIdMap).length}개 콘텐츠 ID 매핑 완료`);

  // 매핑 저장
  writeFileSync(
    resolve(GENERATED_DIR, 'content-id-map.json'),
    JSON.stringify(contentIdMap, null, 2),
    'utf-8'
  );
}

// ── 3. 챕터 생성 및 아이템 연결 ──
// chapterId(로컬) → 실제 chapter ID 매핑
const chapterIdMap = {};

async function createChaptersAndItems() {
  const chapters = JSON.parse(readFileSync(resolve(GENERATED_DIR, 'chapters-setup.json'), 'utf-8'));
  console.log(`\n[챕터 생성] 총 ${chapters.length}개`);

  for (const ch of chapters) {
    try {
      // 챕터 생성
      const chapterData = await api('POST', '/v1/admin/pro/chapters', {
        level_id: ch.levelId,
        book_number: ch.bookNumber,
        chapter_number: ch.chapterNumber,
        global_chapter_number: ch.globalChapterNumber,
        title: ch.title,
      });

      const realChapterId = chapterData.id;
      chapterIdMap[ch.chapterId] = realChapterId;

      // 아이템 연결 (content ID 매핑 적용)
      const mappedItems = ch.items
        .filter(item => item.type !== 'test') // test는 별도 처리
        .map(item => ({
          type: item.type,
          content_id: contentIdMap[item.contentId] || item.contentId || null,
          order: item.order,
        }));

      // test 타입도 추가 (contentId 없이)
      const testItem = ch.items.find(i => i.type === 'test');
      if (testItem) {
        mappedItems.push({
          type: 'test',
          content_id: null,
          order: testItem.order,
        });
      }

      await api('POST', `/v1/admin/pro/chapters/${realChapterId}/items`, { items: mappedItems });

      process.stdout.write('.');
    } catch (err) {
      console.error(`\n  챕터 생성 실패 [${ch.chapterId}]: ${err.message}`);
    }
  }

  console.log(`\n  → ${Object.keys(chapterIdMap).length}개 챕터 생성 완료`);

  // 매핑 저장
  writeFileSync(
    resolve(GENERATED_DIR, 'chapter-id-map.json'),
    JSON.stringify(chapterIdMap, null, 2),
    'utf-8'
  );
}

// ── 4. 테스트 생성 및 챕터 연결 ──
async function createTests() {
  const tests = JSON.parse(readFileSync(resolve(GENERATED_DIR, 'tests-setup.json'), 'utf-8'));
  console.log(`\n[테스트 생성] 총 ${tests.length}개`);

  let created = 0;
  for (const test of tests) {
    try {
      const realChapterId = chapterIdMap[test.chapterId];
      if (!realChapterId) {
        console.error(`  챕터 매핑 없음: ${test.chapterId}`);
        continue;
      }

      // 시험지 생성
      const testResult = await api('POST', '/v1/admin/test-papers', {
        title: test.title,
        level_id: test.levelId,
        total_questions: test.questions.length,
        total_points: test.questions.reduce((sum, q) => sum + (q.points || 0), 0),
      });

      const testId = testResult.test_id || testResult.testId;
      if (!testId) {
        console.error(`  시험지 ID 없음: ${JSON.stringify(testResult)}`);
        continue;
      }

      // 문항 등록 — stem → passage로 매핑, choices는 choiceExplanations에 통합
      const questionsForApi = test.questions.map(q => {
        const apiQ = {
          number: q.number,
          type: q.type || '객관식',
          domain: q.domain || null,
          passage: q.stem || q.passage || null,
          points: q.points || 3,
          correct_answer: q.correctAnswer || null,
        };

        // 선택지 설명 변환
        if (q.choiceExplanations) {
          apiQ.choice_explanations = q.choiceExplanations;
        }

        // 선택지 텍스트를 passage에 포함 (인쇄용 참조)
        if (q.choices && q.choices.length > 0) {
          const choiceText = q.choices.map(c => `${c.id}. ${c.text}`).join('\n');
          apiQ.passage = (apiQ.passage || '') + '\n\n[보기]\n' + choiceText;
        }

        // 서술형 관련 필드
        if (q.essayKeywords) {
          apiQ.essay_keywords = q.essayKeywords;
        }
        if (q.essayRubric) {
          apiQ.essay_rubric = q.essayRubric;
        }
        if (q.modelAnswer) {
          apiQ.model_answer = q.modelAnswer;
        }

        return apiQ;
      });

      await api('POST', `/v1/admin/test-papers/${testId}/questions`, {
        questions: questionsForApi,
      });

      // 테스트를 챕터에 연결
      await api('POST', `/v1/admin/pro/chapters/${realChapterId}/tests`, {
        version: 1,
        test_paper_id: testId,
      });

      created++;
      process.stdout.write('.');
    } catch (err) {
      console.error(`\n  테스트 생성 실패 [${test.chapterId}]: ${err.message}`);
    }
  }

  console.log(`\n  → ${created}개 테스트 생성 완료`);
}

// ── 메인 실행 ──
async function main() {
  console.log('=== 프로모드 콘텐츠 업로드 시작 ===');
  console.log(`API: ${API_URL}`);
  console.log(`생성 디렉토리: ${GENERATED_DIR}`);

  // 이전 매핑이 있으면 로드 (재시작 지원)
  const contentMapFile = resolve(GENERATED_DIR, 'content-id-map.json');
  const chapterMapFile = resolve(GENERATED_DIR, 'chapter-id-map.json');

  let skipContent = false;
  let skipChapters = false;

  if (existsSync(contentMapFile)) {
    const existing = JSON.parse(readFileSync(contentMapFile, 'utf-8'));
    const count = Object.keys(existing).length;
    if (count > 0) {
      console.log(`\n기존 콘텐츠 매핑 발견 (${count}개). 콘텐츠 업로드를 건너뛰시겠습니까?`);
      Object.assign(contentIdMap, existing);
      skipContent = true;
      console.log('  → 기존 매핑 로드 완료');
    }
  }

  if (existsSync(chapterMapFile)) {
    const existing = JSON.parse(readFileSync(chapterMapFile, 'utf-8'));
    const count = Object.keys(existing).length;
    if (count > 0) {
      console.log(`기존 챕터 매핑 발견 (${count}개). 챕터 생성을 건너뛰시겠습니까?`);
      Object.assign(chapterIdMap, existing);
      skipChapters = true;
      console.log('  → 기존 매핑 로드 완료');
    }
  }

  await login();

  if (!skipContent) {
    await uploadBatchContent();
  }

  if (!skipChapters) {
    await createChaptersAndItems();
  }

  await createTests();

  console.log('\n=== 업로드 완료 ===');
  console.log(`콘텐츠: ${Object.keys(contentIdMap).length}개`);
  console.log(`챕터: ${Object.keys(chapterIdMap).length}개`);
}

main().catch(err => {
  console.error('\n치명적 에러:', err.message);
  process.exit(1);
});
