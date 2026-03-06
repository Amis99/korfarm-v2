// 콘텐츠 생성 설정 — 레벨별 결손 정의 및 유틸리티

// 레벨별 한글명
const LEVEL_KR = {
  SAUSSURE_1: '소쉬르1', SAUSSURE_2: '소쉬르2', SAUSSURE_3: '소쉬르3',
  FREGE_1: '프레게1', FREGE_2: '프레게2', FREGE_3: '프레게3',
  RUSSELL_1: '러셀1', RUSSELL_2: '러셀2', RUSSELL_3: '러셀3',
};

// 레벨별 파일키
const LEVEL_FILE = {
  SAUSSURE_1: 'saussure_1', SAUSSURE_2: 'saussure_2', SAUSSURE_3: 'saussure_3',
  FREGE_1: 'frege_1', FREGE_2: 'frege_2', FREGE_3: 'frege_3',
  RUSSELL_1: 'russell_1', RUSSELL_2: 'russell_2', RUSSELL_3: 'russell_3',
};

// ===== 결손 정의 =====

// A. PRO_READING 누락 (subArea별)
const MISSING_READING = {
  SAUSSURE_3: { subArea: '문법', chapters: [1,2,4,5] },
  FREGE_1:    { subArea: '문법', chapters: [1,9,10,11,12,13,14,15,16,17,18,19,20] },
  FREGE_3:    { subArea: '개념', chapters: [1,3,7,8,13,14,15,16] },
  RUSSELL_1:  { subArea: '개념', chapters: Array.from({length:20},(_,i)=>i+1) },
  RUSSELL_2:  { subArea: '개념', chapters: Array.from({length:20},(_,i)=>i+1) },
  RUSSELL_3:  { subArea: '개념', chapters: Array.from({length:20},(_,i)=>i+1) },
};

// B. PRO_LOGIC 누락
const MISSING_LOGIC = {
  SAUSSURE_3: [5, 6],
  FREGE_1: Array.from({length:20},(_,i)=>i+1),
  FREGE_2: Array.from({length:20},(_,i)=>i+1),
};

// C. PRO_VOCAB 누락
const MISSING_VOCAB = {
  FREGE_3:   Array.from({length:20},(_,i)=>i+1),
  RUSSELL_1: Array.from({length:20},(_,i)=>i+1),
  RUSSELL_2: Array.from({length:20},(_,i)=>i+1),
  RUSSELL_3: Array.from({length:20},(_,i)=>i+1),
};

// D. PRO_BACKGROUND 누락
const MISSING_BACKGROUND = {
  FREGE_2:   Array.from({length:20},(_,i)=>i+1).filter(x=>x!==5), // ch5 이미 존재
  FREGE_3:   Array.from({length:20},(_,i)=>i+1),
  RUSSELL_1: Array.from({length:20},(_,i)=>i+1),
  RUSSELL_2: Array.from({length:20},(_,i)=>i+1),
  RUSSELL_3: Array.from({length:20},(_,i)=>i+1),
};

// E. 테스트 누락
const MISSING_TESTS = {
  SAUSSURE_3: [2],
  FREGE_3:   Array.from({length:20},(_,i)=>i+1),
  RUSSELL_1: Array.from({length:20},(_,i)=>i+1),
  RUSSELL_2: Array.from({length:20},(_,i)=>i+1),
  RUSSELL_3: Array.from({length:20},(_,i)=>i+1),
};

// ===== 레벨별 영역 매핑 (각 챕터에 어떤 reading 영역이 있는지) =====
function getReadingAreas(levelId, ch) {
  switch(levelId) {
    case 'SAUSSURE_1': case 'SAUSSURE_2':
      return ['개념','비문학','문학'];
    case 'SAUSSURE_3':
      return [1,2,4,5].includes(ch) ? ['개념','문법','비문학','문학'] : ['개념','비문학','문학'];
    case 'FREGE_1':
      return [1,...Array.from({length:12},(_,i)=>i+9)].includes(ch) ? ['개념','문법','비문학','문학'] : ['개념','비문학','문학'];
    case 'FREGE_2':
      return ['개념','비문학','문학'];
    case 'FREGE_3':
      return [1,3,7,8,13,14,15,16].includes(ch) ? ['개념','비문학','문학'] : ['문법','비문학','문학'];
    case 'RUSSELL_1': case 'RUSSELL_2': case 'RUSSELL_3':
      return ['개념','문법','비문학','문학'];
    default:
      return ['개념','비문학','문학'];
  }
}

// ===== 유틸리티 =====
function padCh(n) { return String(n).padStart(2,'0'); }

function readingContentId(levelId, ch, subArea) {
  const lf = LEVEL_FILE[levelId];
  return `pro_read_${lf}_ch${ch}_${subArea}`;
}

function vocabContentId(levelId, ch) {
  return `pro_vocab_${LEVEL_FILE[levelId]}_ch${ch}`;
}

function bgContentId(levelId, ch) {
  return `pro_bg_${LEVEL_FILE[levelId]}_ch${ch}`;
}

function logicContentId(levelId, ch) {
  return `pro_logic_${LEVEL_FILE[levelId]}_ch${ch}`;
}

function answerContentId(levelId, ch) {
  return `pro_answer_${LEVEL_FILE[levelId]}_ch${ch}`;
}

function chapterId(levelId, ch) {
  return `pch_${LEVEL_FILE[levelId]}_${padCh(ch)}`;
}

module.exports = {
  LEVEL_KR, LEVEL_FILE,
  MISSING_READING, MISSING_LOGIC, MISSING_VOCAB, MISSING_BACKGROUND, MISSING_TESTS,
  getReadingAreas, padCh,
  readingContentId, vocabContentId, bgContentId, logicContentId, answerContentId, chapterId,
};
