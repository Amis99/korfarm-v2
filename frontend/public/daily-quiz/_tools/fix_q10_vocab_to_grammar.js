// Fix Q10(GRAMMAR) items that are actually vocabulary questions.
//
// Rule of thumb:
// - If Q10 text contains vocabulary cues (뜻/의미/유의어/반대말/비슷한 말/속담/관용/사자성어/낱말 등)
//   and does NOT contain grammar cues (띄어쓰기/맞춤법/어법/문법/문장 부호/조사/어미 등),
//   then replace it with a grade-appropriate grammar question.
//
// Run from repo root:
//   node frontend/public/daily-quiz/_tools/fix_q10_vocab_to_grammar.js
//
// Notes:
// - Keeps the existing scoring for Q10 unchanged.
// - Does not touch Q10 that already looks like a grammar/orthography item.

const fs = require("fs");
const path = require("path");

const dailyQuizDir = path.resolve(__dirname, "..");

const levels = [
  "saussure1",
  "saussure2",
  "saussure3",
  "frege1",
  "frege2",
  "frege3",
  "russell1",
  "russell2",
  "russell3",
  "wittgenstein1",
  "wittgenstein2",
  "wittgenstein3",
];

const vocabRe =
  /뜻|의미|밑줄|어휘|유의어|반의어|반대말|비슷한\s*말|같은\s*뜻|같은\s*말|속담|관용|사자성어|낱말/;

const grammarRe =
  /띄어쓰기|맞춤법|어법|문법|표준어|문장\s*부호|조사|어미|피동|사동|높임|시제|접사|품사|문장\s*성분|주어|서술어|목적어|보어|관형어|부사어/;

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`JSON parse failed: ${filePath}: ${e.message}`);
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function normalizeWs(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function makeChoices(textA, textB, textC, textD) {
  return [
    { id: "A", text: textA },
    { id: "B", text: textB },
    { id: "C", text: textC },
    { id: "D", text: textD },
  ];
}

function bankItem({ stem, prompt, choices, answerId, explanation, passage }) {
  return { stem, prompt, choices, answerId, explanation, passage };
}

// Keep these very easy.
const bankS1 = [
  bankItem({
    stem: "물어보는 문장 끝에는 어떤 문장 부호를 찍나요?",
    prompt: "알맞은 것을 고르세요.",
    choices: makeChoices("마침표", "물음표", "쉼표", "느낌표"),
    answerId: "B",
    explanation: "물어보는 문장 끝에는 물음표를 찍습니다.",
    passage: "문장 부호를 바르게 고르는 문제입니다.",
  }),
  bankItem({
    stem: "말을 마치는 문장 끝에는 어떤 문장 부호를 찍나요?",
    prompt: "알맞은 것을 고르세요.",
    choices: makeChoices("마침표", "물음표", "쉼표", "느낌표"),
    answerId: "A",
    explanation: "말을 마치는 문장 끝에는 마침표를 찍습니다.",
    passage: "문장 부호를 바르게 고르는 문제입니다.",
  }),
  bankItem({
    stem: "기쁜 마음이나 놀란 마음을 나타내는 문장 끝에는 어떤 문장 부호를 찍나요?",
    prompt: "알맞은 것을 고르세요.",
    choices: makeChoices("마침표", "물음표", "쉼표", "느낌표"),
    answerId: "D",
    explanation: "기쁜 마음이나 놀란 마음을 나타낼 때는 느낌표를 찍습니다.",
    passage: "문장 부호를 바르게 고르는 문제입니다.",
  }),
  bankItem({
    stem: "말을 잠깐 끊어 읽을 때 쓰는 문장 부호는 무엇인가요?",
    prompt: "알맞은 것을 고르세요.",
    choices: makeChoices("마침표", "물음표", "쉼표", "느낌표"),
    answerId: "C",
    explanation: "말을 잠깐 끊어 읽을 때는 쉼표를 씁니다.",
    passage: "문장 부호를 바르게 고르는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 바른 것은?",
    prompt: "바르게 쓴 것을 고르세요.",
    choices: makeChoices("파란하늘", "파란 하늘", "파 란 하늘", "파란하 늘"),
    answerId: "B",
    explanation: "서로 다른 말은 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
];

const bankS2 = [
  bankItem({
    stem: "다음 중 띄어쓰기가 바른 것은?",
    prompt: "바르게 쓴 것을 고르세요.",
    // NOTE: validator normalizes whitespace, so "이중 공백" 변형은 중복 보기로 처리된다.
    choices: makeChoices("맛있는밥", "맛있는 밥", "맛 있 는 밥", "맛 있는 밥"),
    answerId: "B",
    explanation: "서로 다른 말은 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "물어보는 문장 끝에는 어떤 문장 부호를 찍나요?",
    prompt: "알맞은 것을 고르세요.",
    choices: makeChoices("마침표", "물음표", "쉼표", "느낌표"),
    answerId: "B",
    explanation: "물어보는 문장 끝에는 물음표를 찍습니다.",
    passage: "문장 부호를 바르게 고르는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 바른 것은?",
    prompt: "바르게 쓴 것을 고르세요.",
    // NOTE: validator normalizes whitespace, so "이중 공백" 변형은 중복 보기로 처리된다.
    choices: makeChoices("우리집", "우리 집", "우 리 집", "우 리집"),
    answerId: "B",
    explanation: "서로 다른 말은 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "말을 마치는 문장 끝에는 어떤 문장 부호를 찍나요?",
    prompt: "알맞은 것을 고르세요.",
    choices: makeChoices("마침표", "물음표", "쉼표", "느낌표"),
    answerId: "A",
    explanation: "말을 마치는 문장 끝에는 마침표를 찍습니다.",
    passage: "문장 부호를 바르게 고르는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 바른 것은?",
    prompt: "바르게 쓴 것을 고르세요.",
    // NOTE: validator normalizes whitespace, so "이중 공백" 변형은 중복 보기로 처리된다.
    choices: makeChoices("큰나무", "큰 나무", "큰나 무", "크 ㄴ 나무"),
    answerId: "B",
    explanation: "서로 다른 말은 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
];

const bankS3 = [
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("나무로만든 의자", "나무로 만든 의자", "나무로만 든의자", "나무 로 만든의자"),
    answerId: "B",
    explanation: "말과 말은 알맞게 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("따뜻한봄", "따뜻한 봄", "따 뜻 한 봄", "따뜻 한 봄"),
    answerId: "B",
    explanation: "서로 다른 말은 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 낱말은 무엇인가요?",
    prompt: "바르게 쓴 낱말을 고르세요.",
    choices: makeChoices("깨끗히", "깨끗이", "깨긋이", "깨끗히이"),
    answerId: "B",
    explanation: "부사형은 '깨끗이'가 맞습니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 낱말은 무엇인가요?",
    prompt: "바르게 쓴 낱말을 고르세요.",
    choices: makeChoices("설겆이", "설거지", "설거지이", "설거찌"),
    answerId: "B",
    explanation: "그릇을 씻는 일은 '설거지'라고 씁니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("즐거운하루", "즐거운 하루", "즐 거운 하루", "즐거 운 하루"),
    answerId: "B",
    explanation: "서로 다른 말은 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 문장은 무엇인가요?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("오늘은 비가 왔어여.", "오늘은 비가 왔어요.", "오늘은 비가 왔어 요.", "오늘은 비가 왔요."),
    answerId: "B",
    explanation: "문장을 바르게 쓰면 '왔어요'처럼 씁니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
];

const bankF1 = [
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("할수있다.", "할 수 있다.", "할 수있다.", "할수 있다."),
    answerId: "B",
    explanation: "의존 명사 '수'는 앞말과 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("그럴것 같다.", "그럴 것 같다.", "그럴 것같다.", "그럴것같다."),
    answerId: "B",
    explanation: "의존 명사 '것'은 앞말과 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 문장은 무엇인가요?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("오늘은 일이 잘 돼면 좋겠다.", "오늘은 일이 잘 되면 좋겠다.", "오늘은 일이 잘 됬으면 좋겠다.", "오늘은 일이 잘 뒈면 좋겠다."),
    answerId: "B",
    explanation: "'되다'는 '되면'처럼 씁니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    // NOTE: validator normalizes whitespace, so "이중 공백" 변형은 중복 보기로 처리된다.
    choices: makeChoices("책을읽었다.", "책을 읽었다.", "책 을 읽었다.", "책을 읽 었다."),
    answerId: "B",
    explanation: "말과 말은 알맞게 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 낱말은 무엇인가요?",
    prompt: "바르게 쓴 낱말을 고르세요.",
    choices: makeChoices("웬지", "왠지", "웬지이", "왠치"),
    answerId: "B",
    explanation: "'왠지'는 '왜인지'가 줄어든 말입니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("친구와같이 갔다.", "친구와 같이 갔다.", "친구와같이갔다.", "친구 와 같이 갔다."),
    answerId: "B",
    explanation: "부사 '같이'는 앞말과 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
];

const bankF2 = [
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("할 수 밖에 없다.", "할 수밖에 없다.", "할수밖에 없다.", "할수 밖에 없다."),
    answerId: "B",
    explanation: "'수밖에'는 앞말과 붙여 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("이것 뿐이다.", "이것뿐이다.", "이것 뿐 이다.", "이것뿐 이다."),
    answerId: "B",
    explanation: "조사 '뿐'은 앞말에 붙여 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 문장은 무엇인가요?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("저는 거짓말을 하지 안습니다.", "저는 거짓말을 하지 않습니다.", "저는 거짓말을 하지 앉습니다.", "저는 거짓말을 하지 않 습니다."),
    answerId: "B",
    explanation: "부정 표현은 '않습니다'처럼 씁니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    // NOTE: validator normalizes whitespace, so "이중 공백" 변형은 중복 보기로 처리된다.
    choices: makeChoices("그 때가 좋았다.", "그때가 좋았다.", "그때 가 좋았다.", "그 때가좋았다."),
    answerId: "B",
    explanation: "'그때'는 붙여 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 문장은 무엇인가요?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("지금 가도 되요.", "지금 가도 돼요.", "지금 가도 돼오.", "지금 가도 돼 요."),
    answerId: "B",
    explanation: "'되어요'가 줄어든 말은 '돼요'입니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("아는 척하지 마.", "아는척하지 마.", "아는 척하지마.", "아는척 하지 마."),
    answerId: "A",
    explanation: "의존 명사 '척'은 앞말과 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
];

const bankR1 = [
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("할 수 밖에 없다.", "할 수밖에 없다.", "할수밖에 없다.", "할수 밖에 없다."),
    answerId: "B",
    explanation: "'수밖에'는 앞말과 붙여 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("그럴것 같다.", "그럴 것 같다.", "그럴 것같다.", "그럴것같다."),
    answerId: "B",
    explanation: "의존 명사 '것'은 앞말과 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 문장은 무엇인가요?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("저는 거짓말을 하지 안습니다.", "저는 거짓말을 하지 않습니다.", "저는 거짓말을 하지 앉습니다.", "저는 거짓말을 하지 않 습니다."),
    answerId: "B",
    explanation: "부정 표현은 '않습니다'처럼 씁니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("이것 뿐이다.", "이것뿐이다.", "이것 뿐 이다.", "이것뿐 이다."),
    answerId: "B",
    explanation: "조사 '뿐'은 앞말에 붙여 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 문장은 무엇인가요?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("오늘은 일이 잘 돼면 좋겠다.", "오늘은 일이 잘 되면 좋겠다.", "오늘은 일이 잘 됬으면 좋겠다.", "오늘은 일이 잘 뒈면 좋겠다."),
    answerId: "B",
    explanation: "'되다'는 '되면'처럼 씁니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("아는척하지 마.", "아는 척하지 마.", "아는 척하지마.", "아는척 하지 마."),
    answerId: "B",
    explanation: "의존 명사 '척'은 앞말과 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
];

const bankR2 = [
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("할 수 밖에 없다.", "할 수밖에 없다.", "할수밖에 없다.", "할수 밖에 없다."),
    answerId: "B",
    explanation: "'수밖에'는 앞말과 붙여 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("그럴것 같다.", "그럴 것 같다.", "그럴 것같다.", "그럴것같다."),
    answerId: "B",
    explanation: "의존 명사 '것'은 앞말과 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 문장은 무엇인가요?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("저는 거짓말을 하지 안습니다.", "저는 거짓말을 하지 않습니다.", "저는 거짓말을 하지 앉습니다.", "저는 거짓말을 하지 않 습니다."),
    answerId: "B",
    explanation: "부정 표현은 '않습니다'처럼 씁니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("이것 뿐이다.", "이것뿐이다.", "이것 뿐 이다.", "이것뿐 이다."),
    answerId: "B",
    explanation: "조사 '뿐'은 앞말에 붙여 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 문장은 무엇인가요?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("지금 가도 되요.", "지금 가도 돼요.", "지금 가도 돼오.", "지금 가도 돼 요."),
    answerId: "B",
    explanation: "'되어요'가 줄어든 말은 '돼요'입니다.",
    passage: "맞춤법을 살펴보는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("할수있다.", "할 수 있다.", "할 수있다.", "할수 있다."),
    answerId: "B",
    explanation: "의존 명사 '수'는 앞말과 띄어 씁니다.",
    passage: "띄어쓰기를 살펴보는 문제입니다.",
  }),
];

const bankW = [
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("할수있다.", "할 수 있다.", "할 수있다.", "할수 있다."),
    answerId: "B",
    explanation: "의존 명사 '수'는 앞말과 띄어 씁니다.",
    passage: "띄어쓰기를 확인하는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("그럴것 같다.", "그럴 것 같다.", "그럴 것같다.", "그럴것같다."),
    answerId: "B",
    explanation: "의존 명사 '것'은 앞말과 띄어 씁니다.",
    passage: "띄어쓰기를 확인하는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("할 수 밖에 없다.", "할 수밖에 없다.", "할수밖에 없다.", "할수 밖에 없다."),
    answerId: "B",
    explanation: "'수밖에'는 앞말과 붙여 씁니다.",
    passage: "띄어쓰기를 확인하는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 띄어쓰기가 올바른 것은?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("이것 뿐이다.", "이것뿐이다.", "이것 뿐 이다.", "이것뿐 이다."),
    answerId: "B",
    explanation: "조사 '뿐'은 앞말에 붙여 씁니다.",
    passage: "띄어쓰기를 확인하는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 문장은 무엇인가요?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("지금 가도 되요.", "지금 가도 돼요.", "지금 가도 돼오.", "지금 가도 돼 요."),
    answerId: "B",
    explanation: "'되어요'가 줄어든 말은 '돼요'입니다.",
    passage: "맞춤법을 확인하는 문제입니다.",
  }),
  bankItem({
    stem: "다음 중 맞춤법이 올바른 문장은 무엇인가요?",
    prompt: "바르게 쓴 문장을 고르세요.",
    choices: makeChoices("저는 거짓말을 하지 안습니다.", "저는 거짓말을 하지 않습니다.", "저는 거짓말을 하지 앉습니다.", "저는 거짓말을 하지 않 습니다."),
    answerId: "B",
    explanation: "부정 표현은 '않습니다'처럼 씁니다.",
    passage: "맞춤법을 확인하는 문제입니다.",
  }),
];

const bankByLevel = {
  saussure1: bankS1,
  saussure2: bankS2,
  saussure3: bankS3,
  frege1: bankF1,
  frege2: bankF2,
  frege3: bankF2,
  russell1: bankR1,
  russell2: bankR2,
  russell3: bankR2,
  wittgenstein1: bankW,
  wittgenstein2: bankW,
  wittgenstein3: bankW,
};

function hasDuplicateChoiceText(choices) {
  if (!Array.isArray(choices) || choices.length === 0) return false;
  const seen = new Set();
  for (const c of choices) {
    // Match dataset validator behavior: collapse whitespace before comparing.
    const t = normalizeWs(typeof c?.text === "string" ? c.text : "");
    if (!t) continue;
    if (seen.has(t)) return true;
    seen.add(t);
  }
  return false;
}

function shouldReplaceQ10(q10) {
  const stem = typeof q10?.stem === "string" ? q10.stem : "";
  const prompt = typeof q10?.prompt === "string" ? q10.prompt : "";
  const passage = typeof q10?.passage === "string" ? q10.passage : "";
  const text = `${stem} ${prompt} ${passage}`;
  if (hasDuplicateChoiceText(q10?.choices)) return true;
  // Fix a previously incorrect bank key item ("왠지" 정답 처리).
  if (
    q10?.answerId === "A" &&
    stem.includes("맞춤법") &&
    Array.isArray(q10?.choices) &&
    q10.choices.some((c) => c?.text === "웬지") &&
    q10.choices.some((c) => c?.text === "왠지")
  ) {
    return true;
  }
  return vocabRe.test(text) && !grammarRe.test(text);
}

function getDayNumberFromPath(filePath) {
  const base = path.basename(filePath, ".json");
  const n = Number(base);
  if (!Number.isInteger(n) || n < 1 || n > 365) {
    throw new Error(`Unexpected day filename: ${filePath}`);
  }
  return n;
}

let total = 0;

for (const lv of levels) {
  const bank = bankByLevel[lv];
  if (!Array.isArray(bank) || bank.length === 0) {
    throw new Error(`Missing bank for level: ${lv}`);
  }

  let lvCount = 0;
  for (let day = 1; day <= 365; day++) {
    const filePath = path.join(dailyQuizDir, lv, `${String(day).padStart(3, "0")}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing file: ${filePath}`);
    }

    const data = readJson(filePath);
    const qs = data?.payload?.questions;
    if (!Array.isArray(qs) || qs.length !== 10) {
      throw new Error(`Unexpected payload.questions in ${filePath}`);
    }

    const q10 = qs.find((q) => q?.questionKind === "GRAMMAR" && q?.id?.endsWith("-10"));
    if (!q10) {
      throw new Error(`Missing GRAMMAR Q10 in ${filePath}`);
    }

    if (!shouldReplaceQ10(q10)) continue;

    const idx = (getDayNumberFromPath(filePath) - 1) % bank.length;
    const item = bank[idx];

    q10.stem = item.stem;
    q10.prompt = item.prompt;
    q10.passage = item.passage;
    q10.choices = item.choices;
    q10.answerId = item.answerId;
    q10.explanation = item.explanation;

    // Remove irrelevant decoration fields if present.
    delete q10.highlight;

    writeJson(filePath, data);
    lvCount++;
    total++;
  }

  // eslint-disable-next-line no-console
  console.log(`${lv}: ${lvCount}`);
}

// eslint-disable-next-line no-console
console.log(`TOTAL: ${total}`);
