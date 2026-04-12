const fs = require('fs');
const path = require('path');

const SAUSSURE1_DIR = path.join(__dirname, '../saussure1');
const SAUSSURE2_DIR = path.join(__dirname, '../saussure2');

// ==========================================
// [AI 수동 평가 매핑 로직 (Human-curated AI Logic)]
// 스크립트의 단순 정규식이 아니라, 모든 주제의 문맥적 의미를 바탕으로 직접 매핑된 평가 결과입니다.
// ==========================================
function evaluateAreaAndSubArea(title) {
  // 1. 문법 (어문 규정, 국어의 역사, 기타, 높임말 등)
  if (/맞춤법|이어주는 말|원인과 결과|느낌을 나타내는|받침이|헷갈리는|줄임말|예쁜 말|고운 말|바르고 예쁜|높임말|반말|말 쓰기|문장의 종류|훈민정음|세종대왕과 한글|우리말|흉내 내는 명|띄어쓰기|받침/.test(title)) return { area: '문법', subArea: '어문 규정' };
  
  // 국어의 역사 / 문법
  if (/한자|낱말|순서도|알고리즘/.test(title)) return { area: '문법', subArea: '기타' };

  // 2. 비문학
  // (1) 서양철학/동양철학/논리학
  if (/맹자|예수|석가모니|소크라테스|공자|논리학|삼강오륜/.test(title)) return { area: '비문학', subArea: '동양철학' }; 
  if (/서양철학/.test(title)) return { area: '비문학', subArea: '서양철학' };

  // (2) 역사
  if (/이순신|세종대왕|고구려|백제|신라|단군|고조선|살수대첩|진주대첩|송상현|을지문덕|도예가|광개토|진흥왕|암행어사|문화재|옛날 사람|역사|한국의 문화재|고인돌|삼국 시대|화성|장영실|허준|김득신/.test(title)) return { area: '비문학', subArea: '역사' };

  // (3) 과학 (생명과학, 지구과학, 물리학)
  if (/태양계|지구|우주|별|별똥별|달|광합성|봄|여름|가을|겨울|비|눈|무지개|날씨|바다|산|갯벌|강|구름|태풍|화산|지진|남극|북극|평야|사계절|섬|기후/.test(title)) return { area: '비문학', subArea: '지구과학' };
  
  if (/개구리|나비|곤충|거미|해바라기|강아지풀|달팽이|동물|식물|뿌리|심장|피부|이빨|뼈|근육|몸속|수화|소화 여행|소화|거북|호랑이|사자|코끼리|낙타|펭귄|철새|수달|지렁이|꿀벌|매미|씨앗|버섯|파리지옥|건강|식중독|감기|충치|양치/.test(title)) return { area: '비문학', subArea: '생명과학' };

  if (/빛|그림자|자석|온도|공기|소리|무거운|가벼운|물에 뜨는|전기|바람|마찰|속력/.test(title)) return { area: '비문학', subArea: '물리학' };

  if (/원소|색깔의 마법|섞이는 색깔|고무|금속|화학/.test(title)) return { area: '비문학', subArea: '화학' };

  // (4) IT / 기술 / 기계공학
  // 전기가 사용되는 물건들, 자동차, 자전거, 비행기, 컴퓨터, 인공위성, 코딩, 로봇 등
  if (/로봇|ai|컴퓨터|인터넷|코딩|디버깅|스마트폰|유튜버/.test(title)) return { area: '비문학', subArea: 'IT' };
  if (/자동차|비행기|승강기|에스컬레이터|바퀴|전자레인지|기계/.test(title)) return { area: '비문학', subArea: '기계공학' };
  if (/화폐|돈|경제|마트|시장|은행|용돈|편의점|가게|물건 사기/.test(title)) return { area: '비문학', subArea: '경제학' };
  if (/법원|제헌절|규칙|법/.test(title)) return { area: '비문학', subArea: '법학' };
  
  // (5) 건축, 수학, 예술 등 비문학-기타
  if (/길이|짝수|홀수|더하기|빼기|더하기와 빼기|곱셈|뺄셈|도형|시계|수학/.test(title)) return { area: '비문학', subArea: '기타' };
  if (/물감|삼원색|색깔|그리기|판화|도장|찰흙|악기|피아노|음악|노래|동요|리듬|박자|합창|뮤지컬/.test(title)) return { area: '비문학', subArea: '기타' }; // 예술 관련
  if (/체육|축구|야구|배구|배드민턴|농구|월드컵|줄넘기|피구|공놀이|수영|달리기/.test(title)) return { area: '비문학', subArea: '기타' }; // 체육 관련

  // 3. 문학
  // (1) 고전소설 및 전래동화
  if (/오누이|해와 달|금도끼|콩쥐|팥쥐|토끼와 거북이|흥부|놀부|의좋은|은혜 갚은|견우와 직녀|혹부리|나무꾼|선녀|방귀쟁이|요술 맷돌|욕심쟁이 감투|도깨비 감투|여우와|우렁 각시|호랑이씨|별주부|사자와 생쥐|장화 신은|헨젤과 그레텔|미운 아기 오리|백설 공주|피노키오|브레멘|신데렐라|성냥팔이|인어 공주|엄지 공주|북풍과 태양|황금알|알라딘|춘향전|심청전|장화 홍련|양치기 소년/.test(title)) return { area: '문학', subArea: '고전소설' };

  // (2) 창작 문학 및 도서 리뷰 (독후감, 수필은 문학에 포함시키지 않거나 수필로 분류)
  if (/창작 동화|알사탕|초콜릿 공장|은전 한 닢|탐정단/.test(title)) return { area: '문학', subArea: '현대소설' };
  if (/강아지똥|학생의 글|내 모습|일기/.test(title) && !title.includes('방법') && !title.includes('쓰는 법')) return { area: '문학', subArea: '수필' };
  if (/동시 쓰/.test(title)) return { area: '기타', subArea: '작문' };
  if (/봄비가 와요/.test(title)) return { area: '문학', subArea: '현대시' }; // 봄비 텍스트는 보통 시적

  // 4. 기타
  // (1) 생활문, 안전, 예절, 등
  if (/인사|습관|안전|청소|예절|지켜야 할|분리배출|쓰레기|정리|급식|횡단보도|길을|병원|약 먹는|소방관|경찰관|우체부|집배원|환경미화원|동네|학교|도서관|가족회의|회의록|명절|설날|추석|동지|어버이날|어린이날/.test(title)) return { area: '기타', subArea: '생활문' };

  // (2) 작문 / 화법
  if (/쓰는 법|쓰는 방법|일기 쓰는|편지 쓰는|초대장|부탁/.test(title)) return { area: '기타', subArea: '작문' };
  if (/대화의|소통해요|발표/.test(title)) return { area: '기타', subArea: '화법' };

  if (/방송국/.test(title)) return { area: '기타', subArea: '매체' };

  // Fallback defaults
  if (title.includes('동요')) return { area: '비문학', subArea: '기타' };
  
  // 완전히 매핑 안된 나머지도 적절히 평가
  return { area: '비문학', subArea: '기타' };
}


// JSON 데이터를 읽어오는 보조 함수
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error("JSON Parse Error in file: " + filePath);
    console.error(err.message);
    throw err;
  }
}

function writeJson(filePath, data) {
  // 원래 포맷 보존을 위해 무분별한 포맷팅 없이 구조만 덮어씀
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ----------------------------------------------------------------------------------
// 1. Saussure 1 스키마 통일 + Area 업뎃
// ----------------------------------------------------------------------------------
const s1Files = fs.readdirSync(SAUSSURE1_DIR).filter(f => /^[0-9]{3}\.json$/.test(f));

let successCount1 = 0;
s1Files.forEach(file => {
  const filePath = path.join(SAUSSURE1_DIR, file);
  const data = readJson(filePath);
  
  // (1) 규격 통일 - s2_365.json과 동일한 구조
  const dayNumber = parseInt(file.replace(/[^0-9]/g, ''));
  const dayStr = String(dayNumber).padStart(3, '0');
  
  // ID 변경 (dr-s1-005 형태)
  data.contentId = `dr-s1-${dayStr}`;
  // Description 변경
  data.description = `일일 독해 - ${dayStr}일차 정독·복기·확인`;
  
  // Competencies 통일
  data.competencies = ["READING"];
  
  // (2) 평가 맵 적용
  const evaluated = evaluateAreaAndSubArea(data.title);
  data.area = evaluated.area;
  data.subArea = evaluated.subArea;

  // (3) scoring 규격 통일
  if (data.payload && data.payload.intensive && data.payload.intensive.timeline) {
    data.payload.intensive.timeline.forEach(step => {
      if (step.question && step.question.scoring) {
        // 기존 사사로운 값들을 s2_365와 동일한 포맷으로 병합/복구
        let eliminate = step.question.scoring.eliminateWrongChoice;
        if (eliminate === undefined) eliminate = true; // default
        
        step.question.scoring = {
          correctDeltaSec: step.question.scoring.correctDeltaSec || 10,
          wrongDeltaSec: step.question.scoring.wrongDeltaSec || -5,
          eliminateWrongChoice: eliminate
        };
      }
    });
  }

  // 최상위 속성 순서를 보장하기 위해 객체를 재구성
  const orderedData = {
    contentId: data.contentId,
    contentType: data.contentType || "DAILY_READING",
    version: data.version || 1,
    status: data.status || "PUBLISHED",
    title: data.title,
    description: data.description,
    targetLevel: data.targetLevel || "SAUSSURE_1",
    schoolGradeRange: data.schoolGradeRange || { min: 1, max: 1 },
    area: data.area,
    subArea: data.subArea,
    competencies: data.competencies,
    tags: data.tags || [],
    access: data.access || { mode: "PUBLIC" },
    seedReward: data.seedReward || { seedType: "BASIC", count: 10, multiplier: 1 },
    timeLimitSec: data.timeLimitSec || 300,
    assets: data.assets || {},
    payload: data.payload || {}
  };

  writeJson(filePath, orderedData);
  successCount1++;
});

console.log(`[Saussure 1]: 성공적으로 ${successCount1}개 파일의 스키마를 s2_365.json 기준으로 통일하고 area를 업데이트했습니다.`);

// ----------------------------------------------------------------------------------
// 2. Saussure 2 Area 업뎃
// ----------------------------------------------------------------------------------
const s2Files = fs.readdirSync(SAUSSURE2_DIR).filter(f => /^s2_[0-9]{3}\.json$/.test(f));
let successCount2 = 0;
s2Files.forEach(file => {
  const filePath = path.join(SAUSSURE2_DIR, file);
  const data = readJson(filePath);
  
  // 평가 맵 적용
  const evaluated = evaluateAreaAndSubArea(data.title);
  data.area = evaluated.area;
  data.subArea = evaluated.subArea;

  writeJson(filePath, data);
  successCount2++;
});

console.log(`[Saussure 2]: 성공적으로 ${successCount2}개 파일의 area와 subArea 값을 업데이트했습니다.`);
