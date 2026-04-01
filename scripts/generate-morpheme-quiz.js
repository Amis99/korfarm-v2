/**
 * 형태소 분석 학습 콘텐츠 생성 스크립트
 * 기초 10개 + 심화 10개 (각 5문장)
 *
 * 사용법: node scripts/generate-morpheme-quiz.js
 */
const fs = require("fs");
const path = require("path");

// ─── 형태소 분석 데이터 (수동 검수 완료) ───

// 기초 문장 (짧고 단순, 5~8어절)
const BASIC_SENTENCES = [
  {
    text: "나는 학교에 간다.",
    morphemes: [
      { form: "나", name: "대명사", nameDetail: "1인칭 대명사", type: "실질 자립" },
      { form: "는", name: "조사", nameDetail: "보조사", type: "형식 의존" },
      { form: "학교", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "에", name: "조사", nameDetail: "부사격 조사", type: "형식 의존" },
      { form: "가-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-ㄴ-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "꽃이 아름답게 피었다.",
    morphemes: [
      { form: "꽃", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "이", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "아름답-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존" },
      { form: "-게", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "피-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-었-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "하늘이 매우 높다.",
    morphemes: [
      { form: "하늘", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "이", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "매우", name: "부사", nameDetail: "성분 부사", type: "실질 자립" },
      { form: "높-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "아이가 빨리 뛰었다.",
    morphemes: [
      { form: "아이", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "가", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "빨리", name: "부사", nameDetail: "성분 부사", type: "실질 자립" },
      { form: "뛰-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-었-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "우리는 밥을 먹는다.",
    morphemes: [
      { form: "우리", name: "대명사", nameDetail: "1인칭 대명사", type: "실질 자립" },
      { form: "는", name: "조사", nameDetail: "보조사", type: "형식 의존" },
      { form: "밥", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "을", name: "조사", nameDetail: "목적격 조사", type: "형식 의존" },
      { form: "먹-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-는-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "새가 하늘을 날았다.",
    morphemes: [
      { form: "새", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "가", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "하늘", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "을", name: "조사", nameDetail: "목적격 조사", type: "형식 의존" },
      { form: "날-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-았-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "이 길은 참 좁다.",
    morphemes: [
      { form: "이", name: "관형사", nameDetail: "지시 관형사", type: "실질 자립" },
      { form: "길", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "은", name: "조사", nameDetail: "보조사", type: "형식 의존" },
      { form: "참", name: "부사", nameDetail: "성분 부사", type: "실질 자립" },
      { form: "좁-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "선생님이 책을 읽으셨다.",
    morphemes: [
      { form: "선생님", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "이", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "책", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "을", name: "조사", nameDetail: "목적격 조사", type: "형식 의존" },
      { form: "읽-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-으시-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-었-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "바람이 세게 분다.",
    morphemes: [
      { form: "바람", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "이", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "세-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존" },
      { form: "-게", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "불-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-ㄴ-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "그는 착한 사람이다.",
    morphemes: [
      { form: "그", name: "대명사", nameDetail: "3인칭 대명사", type: "실질 자립" },
      { form: "는", name: "조사", nameDetail: "보조사", type: "형식 의존" },
      { form: "착하-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존" },
      { form: "-ㄴ", name: "어미", nameDetail: "전성 어미", type: "형식 의존" },
      { form: "사람", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "이-", name: "조사", nameDetail: "서술격 조사", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "저 산이 참 크다.",
    morphemes: [
      { form: "저", name: "관형사", nameDetail: "지시 관형사", type: "실질 자립" },
      { form: "산", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "이", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "참", name: "부사", nameDetail: "성분 부사", type: "실질 자립" },
      { form: "크-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "동생이 노래를 불렀다.",
    morphemes: [
      { form: "동생", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "이", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "노래", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "를", name: "조사", nameDetail: "목적격 조사", type: "형식 의존" },
      { form: "부르-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-었-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "어머니가 시장에 가셨다.",
    morphemes: [
      { form: "어머니", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "가", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "시장", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "에", name: "조사", nameDetail: "부사격 조사", type: "형식 의존" },
      { form: "가-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-시-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-었-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "물이 매우 차갑다.",
    morphemes: [
      { form: "물", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "이", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "매우", name: "부사", nameDetail: "성분 부사", type: "실질 자립" },
      { form: "차갑-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "친구와 함께 놀았다.",
    morphemes: [
      { form: "친구", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "와", name: "조사", nameDetail: "접속 조사", type: "형식 의존" },
      { form: "함께", name: "부사", nameDetail: "성분 부사", type: "실질 자립" },
      { form: "놀-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-았-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
];

// 심화 문장 (길고 복잡, 파생어/합성어/보조용언/준말 포함)
const ADVANCED_SENTENCES = [
  {
    text: "그는 집에 서둘러 왔다.",
    morphemes: [
      { form: "그", name: "대명사", nameDetail: "3인칭 대명사", type: "실질 자립" },
      { form: "는", name: "조사", nameDetail: "보조사", type: "형식 의존" },
      { form: "집", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "에", name: "조사", nameDetail: "부사격 조사", type: "형식 의존" },
      { form: "서두르-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-어", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "오-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-았-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "깨끗한 방에서 공부하고 있었다.",
    morphemes: [
      { form: "깨끗-", name: "어근", nameDetail: "비자립성 어근", type: "실질 의존" },
      { form: "-하-", name: "접사", nameDetail: "파생 접미사", type: "형식 의존" },
      { form: "-ㄴ", name: "어미", nameDetail: "전성 어미", type: "형식 의존" },
      { form: "방", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "에서", name: "조사", nameDetail: "부사격 조사", type: "형식 의존" },
      { form: "공부", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "-하-", name: "접사", nameDetail: "파생 접미사", type: "형식 의존" },
      { form: "-고", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "있-", name: "어간", nameDetail: "보조 동사 어간", type: "실질 의존" },
      { form: "-었-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "새로운 사실이 밝혀졌다.",
    morphemes: [
      { form: "새롭-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존" },
      { form: "-ㄴ", name: "어미", nameDetail: "전성 어미", type: "형식 의존" },
      { form: "사실", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "이", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "밝-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-히-", name: "접사", nameDetail: "사동 접미사", type: "형식 의존" },
      { form: "-어", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "지-", name: "어간", nameDetail: "보조 동사 어간", type: "실질 의존" },
      { form: "-었-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "아버지께서 신문을 읽고 계시다.",
    morphemes: [
      { form: "아버지", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "께서", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "신문", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "을", name: "조사", nameDetail: "목적격 조사", type: "형식 의존" },
      { form: "읽-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-고", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "계시-", name: "어간", nameDetail: "보조 동사 어간", type: "실질 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "그 일은 해 볼 만하다.",
    morphemes: [
      { form: "그", name: "관형사", nameDetail: "지시 관형사", type: "실질 자립" },
      { form: "일", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "은", name: "조사", nameDetail: "보조사", type: "형식 의존" },
      { form: "하-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-어", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "보-", name: "어간", nameDetail: "보조 동사 어간", type: "실질 의존" },
      { form: "-ㄹ", name: "어미", nameDetail: "전성 어미", type: "형식 의존" },
      { form: "만", name: "명사", nameDetail: "의존 명사", type: "실질 자립" },
      { form: "-하-", name: "접사", nameDetail: "파생 접미사", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "높푸른 하늘 아래에서 뛰놀았다.",
    morphemes: [
      { form: "높-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존" },
      { form: "푸르-", name: "어간", nameDetail: "형용사 어간", type: "실질 의존" },
      { form: "-ㄴ", name: "어미", nameDetail: "전성 어미", type: "형식 의존" },
      { form: "하늘", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "아래", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "에서", name: "조사", nameDetail: "부사격 조사", type: "형식 의존" },
      { form: "뛰-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "놀-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-았-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "선생님만이 나의 마음을 아신다.",
    morphemes: [
      { form: "선생님", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "만", name: "조사", nameDetail: "보조사", type: "형식 의존" },
      { form: "이", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "나", name: "대명사", nameDetail: "1인칭 대명사", type: "실질 자립" },
      { form: "의", name: "조사", nameDetail: "관형격 조사", type: "형식 의존" },
      { form: "마음", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "을", name: "조사", nameDetail: "목적격 조사", type: "형식 의존" },
      { form: "알-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-시-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-ㄴ-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "지나가던 사람이 갑자기 넘어졌다.",
    morphemes: [
      { form: "지나가-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-더-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-ㄴ", name: "어미", nameDetail: "전성 어미", type: "형식 의존" },
      { form: "사람", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "이", name: "조사", nameDetail: "주격 조사", type: "형식 의존" },
      { form: "갑자기", name: "부사", nameDetail: "성분 부사", type: "실질 자립" },
      { form: "넘어지-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-었-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "무엇이든 열심히 하면 잘된다.",
    morphemes: [
      { form: "무엇", name: "대명사", nameDetail: "부정칭 대명사", type: "실질 자립" },
      { form: "이든", name: "조사", nameDetail: "보조사", type: "형식 의존" },
      { form: "열심히", name: "부사", nameDetail: "성분 부사", type: "실질 자립" },
      { form: "하-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-면", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "잘", name: "부사", nameDetail: "성분 부사", type: "실질 자립" },
      { form: "되-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-ㄴ-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "어린이날에는 풍선을 날려 보내었다.",
    morphemes: [
      { form: "어린이", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "날", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "에", name: "조사", nameDetail: "부사격 조사", type: "형식 의존" },
      { form: "는", name: "조사", nameDetail: "보조사", type: "형식 의존" },
      { form: "풍선", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "을", name: "조사", nameDetail: "목적격 조사", type: "형식 의존" },
      { form: "날리-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-어", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "보내-", name: "어간", nameDetail: "동사 어간", type: "실질 의존" },
      { form: "-었-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
  {
    text: "슬기롭게 판단하여 행동하였다.",
    morphemes: [
      { form: "슬기", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "-롭-", name: "접사", nameDetail: "파생 접미사", type: "형식 의존" },
      { form: "-게", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "판단", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "-하-", name: "접사", nameDetail: "파생 접미사", type: "형식 의존" },
      { form: "-여", name: "어미", nameDetail: "연결 어미", type: "형식 의존" },
      { form: "행동", name: "명사", nameDetail: "보통 명사", type: "실질 자립" },
      { form: "-하-", name: "접사", nameDetail: "파생 접미사", type: "형식 의존" },
      { form: "-였-", name: "어미", nameDetail: "선어말 어미", type: "형식 의존" },
      { form: "-다", name: "어미", nameDetail: "종결 어미", type: "형식 의존" },
    ],
  },
];

// ─── 오답 선택지 생성 ───
function generateWrongSplits(morphemes, correctText) {
  const wrongs = [];
  // 1. 어절 단위 분리 (형태소 분석 안 함)
  wrongs.push(morphemes.map(m => m.form).join("").replace(/[-]/g, "").split(/(?<=.)(?=[^-])/).join(", "));
  // 2. 과분리
  const over = morphemes.map(m => {
    if (m.form.length > 2) return m.form.slice(0, 1) + ", " + m.form.slice(1);
    return m.form;
  }).join(", ");
  wrongs.push(over);
  // 3. 미분리 (어간+어미 합침)
  const under = [];
  for (let i = 0; i < morphemes.length; i++) {
    if (morphemes[i].name === "어미" && under.length > 0 && morphemes[i-1]?.name === "어간") {
      under[under.length - 1] += morphemes[i].form.replace(/^-/, "");
    } else {
      under.push(morphemes[i].form);
    }
  }
  wrongs.push(under.join(", "));

  // 정답과 다른 것만
  return wrongs.filter(w => w !== correctText).slice(0, 3);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSentence(sent, idx) {
  const count = sent.morphemes.length;
  const correctSplit = sent.morphemes.map(m => m.form).join(", ");

  // 개수 선택지: 정답 ± 1~2
  const countSet = new Set([count]);
  [count - 2, count - 1, count + 1, count + 2].forEach(n => { if (n > 0) countSet.add(n); });
  const countChoices = shuffleArray([...countSet]).slice(0, 4);
  if (!countChoices.includes(count)) countChoices[0] = count;

  // 구분 선택지
  const wrongSplits = generateWrongSplits(sent.morphemes, correctSplit);
  while (wrongSplits.length < 3) wrongSplits.push(correctSplit.split(", ").reverse().join(", "));
  const splitAll = shuffleArray([
    { id: "A", text: correctSplit },
    { id: "B", text: wrongSplits[0] },
    { id: "C", text: wrongSplits[1] },
    { id: "D", text: wrongSplits[2] },
  ]);
  const splitAnswer = splitAll.find(c => c.text === correctSplit)?.id || "A";
  // id 재배정
  const splitChoices = splitAll.map((c, i) => ({ id: ["A","B","C","D"][i], text: c.text }));
  const finalSplitAnswer = splitChoices.find(c => c.text === correctSplit)?.id || "A";

  return {
    id: `s${idx + 1}`,
    text: sent.text,
    morphemes: sent.morphemes,
    countChoices: shuffleArray(countChoices),
    countAnswer: count,
    splitChoices,
    splitAnswer: finalSplitAnswer,
  };
}

function createQuizJson(sentenceGroup, quizIdx, prefix, level) {
  const nn = String(quizIdx).padStart(2, "0");
  const isBasic = prefix === "basic";
  return {
    contentType: "MORPHEME_ANALYSIS",
    title: isBasic ? `형태소 기초 학습 ${nn}` : `형태소 심화 학습 ${nn}`,
    description: isBasic ? "짧은 문장의 형태소를 분석하는 연습" : "복잡한 문장의 형태소를 분석하는 심화 연습",
    targetLevel: level,
    area: "GRAMMAR",
    subArea: "MORPHEME",
    competencies: ["GRAMMAR"],
    tags: [isBasic ? "morpheme-basic" : "morpheme-advanced"],
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: isBasic ? 300 : 420,
    payload: {
      sentences: sentenceGroup.map((s, i) => buildSentence(s, i)),
    },
  };
}

// ─── 메인 ───
function main() {
  const outDir = path.join(__dirname, "../frontend/public/farm/grammar/morpheme");
  fs.mkdirSync(outDir, { recursive: true });

  // 기초 10개 (5문장씩)
  for (let i = 0; i < 10; i++) {
    const group = [];
    for (let j = 0; j < 5; j++) {
      group.push(BASIC_SENTENCES[(i * 5 + j) % BASIC_SENTENCES.length]);
    }
    const level = "RUSSELL_1";
    const json = createQuizJson(group, i + 1, "basic", level);
    fs.writeFileSync(path.join(outDir, `morpheme_basic_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(json, null, 2), "utf8");
  }
  console.log("기초 10개 생성 완료");

  // 심화 10개 (5문장씩)
  for (let i = 0; i < 10; i++) {
    const group = [];
    for (let j = 0; j < 5; j++) {
      group.push(ADVANCED_SENTENCES[(i * 5 + j) % ADVANCED_SENTENCES.length]);
    }
    const level = "WITTGENSTEIN_1";
    const json = createQuizJson(group, i + 1, "advanced", level);
    fs.writeFileSync(path.join(outDir, `morpheme_advanced_${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(json, null, 2), "utf8");
  }
  console.log("심화 10개 생성 완료");
  console.log("출력:", outDir);
}

main();
