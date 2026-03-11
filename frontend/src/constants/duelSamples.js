// 샘플 문제 (정적 시드 데이터)
const SAMPLE_QUESTIONS = [
  // ── 소쉬르 ──
  { id: "sample-s-q1", serverId: "saussure", questionType: "QUIZ", category: "VOCAB",
    stem: "'따뜻하다'의 뜻으로 알맞은 것은?", answerId: "1", timeLimitSec: 15,
    choices: [{ id:"1", text:"춥지 않고 온기가 있다" },{ id:"2", text:"매우 차갑다" },{ id:"3", text:"비가 많이 온다" },{ id:"4", text:"바람이 세게 분다" }] },
  { id: "sample-s-q2", serverId: "saussure", questionType: "QUIZ", category: "CONCEPT",
    stem: "다음 중 받침 'ㄹ'이 들어간 낱말은?", answerId: "3", timeLimitSec: 15,
    choices: [{ id:"1", text:"나비" },{ id:"2", text:"바다" },{ id:"3", text:"달" },{ id:"4", text:"하마" }] },
  { id: "sample-s-q3", serverId: "saussure", questionType: "QUIZ", category: "VOCAB",
    stem: "'기쁘다'와 비슷한 말은?", answerId: "2", timeLimitSec: 15,
    choices: [{ id:"1", text:"슬프다" },{ id:"2", text:"즐겁다" },{ id:"3", text:"무섭다" },{ id:"4", text:"졸리다" }] },
  { id: "sample-s-r1", serverId: "saussure", questionType: "READING", category: "SENTENCE",
    stem: "이 글의 중심 내용으로 알맞은 것은?",
    passage: "봄이 오면 나무에 새 잎이 돋아나고, 꽃이 피어 벌과 나비가 찾아옵니다.",
    answerId: "1", timeLimitSec: 30,
    choices: [{ id:"1", text:"봄에 일어나는 자연의 변화" },{ id:"2", text:"여름 날씨의 특징" },{ id:"3", text:"동물의 겨울잠" },{ id:"4", text:"가을 단풍 이야기" }] },
  { id: "sample-s-r2", serverId: "saussure", questionType: "READING", category: "SENTENCE",
    stem: "글쓴이가 강조하고 싶은 것은?",
    passage: "물을 아끼지 않으면 언젠가 마실 물이 부족해질 수 있습니다. 양치할 때 컵을 사용합시다.",
    answerId: "3", timeLimitSec: 30,
    choices: [{ id:"1", text:"양치의 중요성" },{ id:"2", text:"컵 종류 선택" },{ id:"3", text:"물 절약" },{ id:"4", text:"물의 맛" }] },

  // ── 프레게 ──
  { id: "sample-f-q1", serverId: "frege", questionType: "QUIZ", category: "VOCAB",
    stem: "'사방'이 뜻하는 것은?", answerId: "2", timeLimitSec: 15,
    choices: [{ id:"1", text:"한쪽 방향" },{ id:"2", text:"네 방향, 모든 곳" },{ id:"3", text:"뒤쪽만" },{ id:"4", text:"위와 아래" }] },
  { id: "sample-f-q2", serverId: "frege", questionType: "QUIZ", category: "CONCEPT",
    stem: "다음 중 홑문장은?", answerId: "1", timeLimitSec: 15,
    choices: [{ id:"1", text:"꽃이 핀다." },{ id:"2", text:"비가 오고 바람이 분다." },{ id:"3", text:"내가 좋아하는 노래가 나온다." },{ id:"4", text:"그가 오면 출발하자." }] },
  { id: "sample-f-r1", serverId: "frege", questionType: "READING", category: "SENTENCE",
    stem: "이 글의 주제로 가장 알맞은 것은?",
    passage: "독서는 새로운 세상을 열어 줍니다. 책을 읽으면 지식이 늘어나고 생각하는 힘이 커집니다.",
    answerId: "4", timeLimitSec: 30,
    choices: [{ id:"1", text:"운동의 장점" },{ id:"2", text:"요리 방법" },{ id:"3", text:"여행 계획" },{ id:"4", text:"독서의 중요성" }] },

  // ── 러셀 ──
  { id: "sample-r-q1", serverId: "russell", questionType: "QUIZ", category: "VOCAB",
    stem: "'모순'의 뜻으로 알맞은 것은?", answerId: "3", timeLimitSec: 15,
    choices: [{ id:"1", text:"서로 도움" },{ id:"2", text:"순서대로" },{ id:"3", text:"앞뒤가 맞지 않음" },{ id:"4", text:"매우 빠름" }] },
  { id: "sample-r-q2", serverId: "russell", questionType: "QUIZ", category: "CONCEPT",
    stem: "'먹었다'의 시제는?", answerId: "2", timeLimitSec: 15,
    choices: [{ id:"1", text:"현재" },{ id:"2", text:"과거" },{ id:"3", text:"미래" },{ id:"4", text:"진행" }] },
  { id: "sample-r-r1", serverId: "russell", questionType: "READING", category: "SENTENCE",
    stem: "글쓴이의 주장을 뒷받침하는 근거는?",
    passage: "플라스틱 사용을 줄여야 합니다. 바다에 버려진 플라스틱이 해양 생물을 위협하고 있기 때문입니다.",
    answerId: "1", timeLimitSec: 30,
    choices: [{ id:"1", text:"해양 생물 피해" },{ id:"2", text:"플라스틱의 편리함" },{ id:"3", text:"재활용 비용" },{ id:"4", text:"새로운 소재 개발" }] },

  // ── 비트겐슈타인 ──
  { id: "sample-w-q1", serverId: "wittgenstein", questionType: "QUIZ", category: "VOCAB",
    stem: "'역설(逆說)'의 의미로 알맞은 것은?", answerId: "4", timeLimitSec: 15,
    choices: [{ id:"1", text:"쉽게 풀리는 문제" },{ id:"2", text:"같은 말의 반복" },{ id:"3", text:"사실을 과장" },{ id:"4", text:"겉으로는 모순이나 진리를 담은 말" }] },
  { id: "sample-w-q2", serverId: "wittgenstein", questionType: "QUIZ", category: "CONCEPT",
    stem: "다음 중 피동 표현은?", answerId: "2", timeLimitSec: 15,
    choices: [{ id:"1", text:"아이가 문을 연다." },{ id:"2", text:"문이 열린다." },{ id:"3", text:"아이에게 문을 열게 한다." },{ id:"4", text:"문을 열어라." }] },
  { id: "sample-w-r1", serverId: "wittgenstein", questionType: "READING", category: "SENTENCE",
    stem: "이 글에서 비유적 표현이 쓰인 부분의 효과는?",
    passage: "시간은 화살처럼 빠르게 지나간다. 어제 같던 봄이 어느새 가을이 되었다.",
    answerId: "3", timeLimitSec: 30,
    choices: [{ id:"1", text:"정보를 정확히 전달" },{ id:"2", text:"사건의 순서를 나열" },{ id:"3", text:"시간이 빨리 흐름을 생생하게 표현" },{ id:"4", text:"계절의 특징을 설명" }] },
];

export default SAMPLE_QUESTIONS;
