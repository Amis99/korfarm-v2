// Day 16 - 문학 (LITERATURE) - 성장과 자아 발견
const fs = require('fs');

const p1 = "수업이 끝난 교실에는 나 혼자 남아 있었다. 창밖으로 운동장에서 뛰어노는 아이들의 웃음소리가 들려왔지만, 나는 책상 위에 엎드려 그 소리를 먼 나라의 언어처럼 흘려보냈다. 오늘도 발표 시간에 한마디도 하지 못했다. 선생님이 내 이름을 부르셨을 때, 심장이 쿵쿵거리며 입술이 굳어 버렸다. 준비한 내용은 머릿속에 가득 들어 있었는데, 목소리는 끝내 나오지 않았다. 반 아이들의 시선이 일제히 나를 향했고, 그 순간 교실 전체가 나를 삼킬 듯한 거대한 벽으로 느껴졌다. 선생님은 이해한다는 듯 고개를 끄덕이셨지만, 나는 얼굴이 화끈거려 고개를 숙일 수밖에 없었다. 쉬는 시간에 짝꿍 민재가 괜찮냐고 물었지만, 나는 아무렇지 않은 척 웃기만 했다.";

const p2 = "집에 돌아오니 할아버지가 마루에서 나무 조각을 깎고 계셨다. 할아버지는 퇴직 후 나무 조각을 취미로 삼으셨는데, 작은 새나 물고기를 만들어 동네 아이들에게 나누어 주곤 하셨다. 나는 할아버지 옆에 조용히 앉아 나뭇결을 따라 움직이는 칼날을 바라보았다. 할아버지가 먼저 말씀을 꺼내셨다. \"학교에서 무슨 일 있었니?\" 나는 한참을 망설이다가 발표를 못 한 이야기를 꺼냈다. 할아버지는 칼질을 멈추지 않으시면서 \"나무도 처음엔 그래. 칼을 대면 갈라지고 쪼개져. 그런데 천천히 결을 따라 깎으면 어느새 모양이 나온단다.\" 하고 말씀하셨다. 나는 그 말이 무슨 뜻인지 바로 이해하지 못했지만, 할아버지의 손끝에서 동그란 새 한 마리가 서서히 모습을 드러내는 것을 가만히 지켜보았다.";

const p3 = "다음 날, 나는 작은 결심을 하나 했다. 수업 시간에 손을 들지는 못하더라도, 짝꿍 민재에게 먼저 말을 걸어 보기로 한 것이다. 점심시간에 민재가 혼자 급식판을 들고 가는 것을 보고, 나는 \"같이 앉을래?\" 하고 조심스럽게 말을 건넸다. 목소리가 떨렸지만, 민재는 환하게 웃으며 고개를 끄덕였다. 그날 처음으로 민재와 제대로 된 대화를 나누었다. 민재도 초등학교 때 전학을 자주 다녀서 새 환경이 두려웠던 적이 있다고 했다. 나만 그런 것이 아니라는 사실에 가슴이 뜨거워졌다. 급식을 먹으면서 민재와 좋아하는 만화 이야기를 나누자, 식당의 소란스러운 소음이 처음으로 불편하지 않게 느껴졌다. 할아버지 말씀처럼 나도 결을 따라 천천히 깎이고 있는 것일까.";

const p4 = "그로부터 일주일 뒤, 국어 시간에 다시 발표 기회가 돌아왔다. 선생님이 내 이름을 부르셨을 때, 심장은 여전히 빠르게 뛰었다. 하지만 나는 민재를 바라보았고, 민재는 작은 미소를 지으며 주먹을 쥐어 보였다. 나는 천천히 자리에서 일어나 준비한 내용을 읽기 시작했다. 목소리는 작았고 중간에 한 번 멈추기도 했지만, 끝까지 읽어 냈다. 교실에 박수가 퍼졌을 때, 나는 할아버지의 나무 조각을 떠올렸다. 처음에는 투박한 나뭇조각에 불과했지만, 결을 따라 조금씩 깎여 마침내 새의 형상이 된 것처럼, 나도 한 마디씩 용기를 쌓아 올려 비로소 내 목소리를 찾은 것이다. 교실 밖 운동장의 웃음소리가 이제는 더 이상 먼 나라의 언어가 아니라, 내가 걸어 들어갈 수 있는 세계의 소리로 들려왔다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log("총 글자 수:", totalLen);
console.log("p1:", p1.length, "p2:", p2.length, "p3:", p3.length, "p4:", p4.length);

function r(pid, text, searchStr) {
  const start = text.indexOf(searchStr);
  if (start === -1) throw new Error("NOT FOUND in " + pid + ": " + searchStr.substring(0, 30));
  return { paragraphId: pid, start, end: start + searchStr.length };
}

const timeline = [
  { stepId: "s1", highlight: { ranges: [r("p1", p1, "수업이 끝난 교실에는 나 혼자 남아 있었다.")] }, question: {
    prompt: "첫 문장에서 '나'가 처한 상황으로 알맞은 것은?",
    choices: [
      { id: "A", text: "수업이 끝난 교실에 혼자 남아 있다." },
      { id: "B", text: "운동장에서 친구들과 뛰어놀고 있다." },
      { id: "C", text: "집에 돌아와 방에서 쉬고 있다." },
      { id: "D", text: "도서관에서 책을 읽고 있다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s2", highlight: { ranges: [r("p1", p1, "창밖으로 운동장에서 뛰어노는 아이들의 웃음소리가 들려왔지만, 나는 책상 위에 엎드려 그 소리를 먼 나라의 언어처럼 흘려보냈다.")] }, question: {
    prompt: "둘째 문장에서 '나'의 행동으로 알맞은 것은?",
    choices: [
      { id: "A", text: "운동장의 웃음소리를 먼 나라의 언어처럼 흘려보냈다." },
      { id: "B", text: "운동장으로 나가 친구들과 함께 뛰었다." },
      { id: "C", text: "웃음소리에 기분이 좋아져 따라 웃었다." },
      { id: "D", text: "소리를 듣고 창문을 닫았다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s3", highlight: { ranges: [r("p1", p1, "오늘도 발표 시간에 한마디도 하지 못했다. 선생님이 내 이름을 부르셨을 때, 심장이 쿵쿵거리며 입술이 굳어 버렸다.")] }, question: {
    prompt: "셋째·넷째 문장에서 '나'가 발표를 못한 까닭으로 알맞은 것은?",
    choices: [
      { id: "A", text: "심장이 쿵쿵거리며 입술이 굳어 목소리가 나오지 않았다." },
      { id: "B", text: "준비를 전혀 하지 않아서 할 말이 없었다." },
      { id: "C", text: "선생님이 이름을 부르지 않아서 기회가 없었다." },
      { id: "D", text: "교실이 너무 시끄러워 자기 목소리를 들을 수 없었다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s4", highlight: { ranges: [r("p1", p1, "준비한 내용은 머릿속에 가득 들어 있었는데, 목소리는 끝내 나오지 않았다. 반 아이들의 시선이 일제히 나를 향했고, 그 순간 교실 전체가 나를 삼킬 듯한 거대한 벽으로 느껴졌다.")] }, question: {
    prompt: "다섯째·여섯째 문장에서 '나'의 내면 상태로 알맞은 것은?",
    choices: [
      { id: "A", text: "내용은 알고 있었지만 아이들의 시선에 교실이 거대한 벽처럼 느껴졌다." },
      { id: "B", text: "준비한 내용을 잊어버려 당황했다." },
      { id: "C", text: "아이들이 관심을 보이지 않아 실망했다." },
      { id: "D", text: "교실이 너무 좁아서 답답함을 느꼈다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s5", highlight: { ranges: [r("p1", p1, "선생님은 이해한다는 듯 고개를 끄덕이셨지만, 나는 얼굴이 화끈거려 고개를 숙일 수밖에 없었다. 쉬는 시간에 짝꿍 민재가 괜찮냐고 물었지만, 나는 아무렇지 않은 척 웃기만 했다.")] }, question: {
    prompt: "일곱째·여덟째 문장에서 '나'가 민재에게 보인 반응으로 알맞은 것은?",
    choices: [
      { id: "A", text: "속마음을 숨기고 아무렇지 않은 척 웃기만 했다." },
      { id: "B", text: "솔직하게 속상한 마음을 털어놓았다." },
      { id: "C", text: "민재에게 화를 내며 자리를 피했다." },
      { id: "D", text: "선생님께 같이 가서 사정을 설명했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s6", highlight: { ranges: [{ paragraphId: "p1", start: 0, end: p1.length }] }, question: {
    prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "'나'는 발표에 실패한 뒤 위축되어 속마음을 드러내지 못한다." },
      { id: "B", text: "'나'는 친구 민재와의 우정이 깊어져 발표가 즐거워진다." },
      { id: "C", text: "'나'는 선생님의 칭찬에 자신감을 얻어 씩씩하게 행동한다." },
      { id: "D", text: "'나'는 수업 중에 장난을 치다가 혼이 나서 교실에 남아 있다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s7", highlight: { ranges: [r("p2", p2, "집에 돌아오니 할아버지가 마루에서 나무 조각을 깎고 계셨다. 할아버지는 퇴직 후 나무 조각을 취미로 삼으셨는데, 작은 새나 물고기를 만들어 동네 아이들에게 나누어 주곤 하셨다.")] }, question: {
    prompt: "첫째·둘째 문장에서 할아버지의 취미로 알맞은 것은?",
    choices: [
      { id: "A", text: "퇴직 후 나무 조각을 깎아 작은 새나 물고기를 만들어 나눠 준다." },
      { id: "B", text: "퇴직 후 그림을 그려 전시회에 내놓는다." },
      { id: "C", text: "퇴직 후 낚시를 하러 매일 강에 나간다." },
      { id: "D", text: "퇴직 후 정원에서 꽃을 가꾸어 팔고 있다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s8", highlight: { ranges: [r("p2", p2, "나는 할아버지 옆에 조용히 앉아 나뭇결을 따라 움직이는 칼날을 바라보았다. 할아버지가 먼저 말씀을 꺼내셨다. \"학교에서 무슨 일 있었니?\" 나는 한참을 망설이다가 발표를 못 한 이야기를 꺼냈다.")] }, question: {
    prompt: "'나'가 할아버지에게 발표 이야기를 꺼낸 과정으로 알맞은 것은?",
    choices: [
      { id: "A", text: "할아버지가 먼저 물어보셔서 한참 망설이다가 이야기를 꺼냈다." },
      { id: "B", text: "'나'가 먼저 적극적으로 도움을 요청했다." },
      { id: "C", text: "엄마가 할아버지에게 사정을 미리 알려 주셨다." },
      { id: "D", text: "할아버지가 학교에 전화를 하셔서 사정을 알게 되었다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s9", highlight: { ranges: [r("p2", p2, "할아버지는 칼질을 멈추지 않으시면서 \"나무도 처음엔 그래. 칼을 대면 갈라지고 쪼개져. 그런데 천천히 결을 따라 깎으면 어느새 모양이 나온단다.\" 하고 말씀하셨다.")] }, question: {
    prompt: "할아버지가 나무 조각에 빗대어 전하려 한 뜻으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "처음에는 서투르지만 천천히 해 나가면 결국 모양이 갖추어진다." },
      { id: "B", text: "나무는 깎으면 다시 돌아오지 않으니 신중해야 한다." },
      { id: "C", text: "나무 조각은 재능이 있어야만 할 수 있다." },
      { id: "D", text: "칼을 빠르게 써야 좋은 작품이 나온다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s10", highlight: { ranges: [r("p2", p2, "나는 그 말이 무슨 뜻인지 바로 이해하지 못했지만, 할아버지의 손끝에서 동그란 새 한 마리가 서서히 모습을 드러내는 것을 가만히 지켜보았다.")] }, question: {
    prompt: "마지막 문장에서 '나'의 태도로 알맞은 것은?",
    choices: [
      { id: "A", text: "뜻을 바로 이해하진 못했지만 새가 만들어지는 과정을 가만히 지켜보았다." },
      { id: "B", text: "할아버지 말에 감동받아 곧바로 발표 연습을 시작했다." },
      { id: "C", text: "할아버지의 말을 무시하고 자기 방으로 가 버렸다." },
      { id: "D", text: "할아버지에게 나무 조각을 직접 해 보겠다고 부탁했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s11", highlight: { ranges: [{ paragraphId: "p2", start: 0, end: p2.length }] }, question: {
    prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "할아버지가 나무 조각에 빗대어 천천히 성장하면 된다는 위로를 건넨다." },
      { id: "B", text: "할아버지가 나무 조각 대회에 나가기 위해 연습하는 모습을 보여 준다." },
      { id: "C", text: "'나'가 할아버지의 조언을 듣고 곧바로 용기를 얻어 발표에 성공한다." },
      { id: "D", text: "'나'가 할아버지의 말에 반발하여 갈등이 깊어진다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s12", highlight: { ranges: [r("p3", p3, "다음 날, 나는 작은 결심을 하나 했다. 수업 시간에 손을 들지는 못하더라도, 짝꿍 민재에게 먼저 말을 걸어 보기로 한 것이다.")] }, question: {
    prompt: "'나'가 한 '작은 결심'의 내용으로 알맞은 것은?",
    choices: [
      { id: "A", text: "수업 시간에 손을 들지는 못하더라도 민재에게 먼저 말을 걸어 본다." },
      { id: "B", text: "선생님 앞에서 큰 소리로 발표 연습을 한다." },
      { id: "C", text: "반 친구 모두에게 자기 소개를 한다." },
      { id: "D", text: "학교를 그만두고 다른 곳으로 전학을 간다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s13", highlight: { ranges: [r("p3", p3, "점심시간에 민재가 혼자 급식판을 들고 가는 것을 보고, 나는 \"같이 앉을래?\" 하고 조심스럽게 말을 건넸다. 목소리가 떨렸지만, 민재는 환하게 웃으며 고개를 끄덕였다. 그날 처음으로 민재와 제대로 된 대화를 나누었다.")] }, question: {
    prompt: "'나'가 민재에게 말을 건넨 결과로 알맞은 것은?",
    choices: [
      { id: "A", text: "목소리가 떨렸지만 민재가 웃으며 수락해 처음으로 제대로 대화를 나눴다." },
      { id: "B", text: "민재가 거절하여 더 움츠러들었다." },
      { id: "C", text: "다른 친구들이 합류해 큰 모임이 되었다." },
      { id: "D", text: "선생님이 나서서 둘을 소개시켜 주었다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s14", highlight: { ranges: [r("p3", p3, "민재도 초등학교 때 전학을 자주 다녀서 새 환경이 두려웠던 적이 있다고 했다. 나만 그런 것이 아니라는 사실에 가슴이 뜨거워졌다. 급식을 먹으면서 민재와 좋아하는 만화 이야기를 나누자, 식당의 소란스러운 소음이 처음으로 불편하지 않게 느껴졌다.")] }, question: {
    prompt: "민재와의 대화에서 '나'가 깨달은 것으로 알맞은 것은?",
    choices: [
      { id: "A", text: "민재도 비슷한 경험이 있어 나만 그런 것이 아니라는 사실에 위로받았다." },
      { id: "B", text: "민재가 항상 자신감이 넘치는 사람이라는 것을 알았다." },
      { id: "C", text: "학교생활이 아무 의미가 없다는 결론에 도달했다." },
      { id: "D", text: "만화를 많이 읽으면 발표를 잘할 수 있다는 것을 알았다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s15", highlight: { ranges: [r("p3", p3, "할아버지 말씀처럼 나도 결을 따라 천천히 깎이고 있는 것일까.")] }, question: {
    prompt: "마지막 문장 '결을 따라 천천히 깎이고 있는 것일까'가 뜻하는 바로 알맞은 것은?",
    choices: [
      { id: "A", text: "할아버지의 비유처럼 자신도 조금씩 변화하고 있다는 것을 느끼고 있다." },
      { id: "B", text: "나무 조각 기술을 직접 배우고 싶다는 뜻이다." },
      { id: "C", text: "자신이 점점 약해지고 있다는 불안감을 표현한 것이다." },
      { id: "D", text: "민재와의 대화가 고통스러웠음을 나타낸 것이다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s16", highlight: { ranges: [{ paragraphId: "p3", start: 0, end: p3.length }] }, question: {
    prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "'나'가 민재에게 먼저 다가가 대화하며 할아버지의 비유를 체감한다." },
      { id: "B", text: "'나'가 발표에 완벽하게 성공하여 자신감을 되찾는다." },
      { id: "C", text: "민재가 '나'의 고민을 선생님께 알려 문제가 해결된다." },
      { id: "D", text: "'나'가 급식 시간에 급식이 맛없다고 불평한다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s17", highlight: { ranges: [r("p4", p4, "그로부터 일주일 뒤, 국어 시간에 다시 발표 기회가 돌아왔다. 선생님이 내 이름을 부르셨을 때, 심장은 여전히 빠르게 뛰었다.")] }, question: {
    prompt: "다시 발표 기회가 왔을 때 '나'의 상태로 알맞은 것은?",
    choices: [
      { id: "A", text: "심장은 여전히 빠르게 뛰었지만 민재의 응원을 받았다." },
      { id: "B", text: "전혀 긴장하지 않고 자신만만하게 나섰다." },
      { id: "C", text: "다시 한마디도 하지 못하고 주저앉았다." },
      { id: "D", text: "선생님이 발표를 면제해 주셔서 안심했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s18", highlight: { ranges: [r("p4", p4, "하지만 나는 민재를 바라보았고, 민재는 작은 미소를 지으며 주먹을 쥐어 보였다. 나는 천천히 자리에서 일어나 준비한 내용을 읽기 시작했다. 목소리는 작았고 중간에 한 번 멈추기도 했지만, 끝까지 읽어 냈다.")] }, question: {
    prompt: "'나'의 발표 과정으로 알맞은 것은?",
    choices: [
      { id: "A", text: "민재의 미소에 힘을 얻어 천천히 읽기 시작했고 중간에 멈추기도 했지만 끝까지 읽어 냈다." },
      { id: "B", text: "매끄럽고 유창하게 발표하여 모든 친구가 감탄했다." },
      { id: "C", text: "발표 도중 울음을 터뜨려 선생님이 중단시켰다." },
      { id: "D", text: "민재가 대신 발표해 주었다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s19", highlight: { ranges: [r("p4", p4, "교실에 박수가 퍼졌을 때, 나는 할아버지의 나무 조각을 떠올렸다. 처음에는 투박한 나뭇조각에 불과했지만, 결을 따라 조금씩 깎여 마침내 새의 형상이 된 것처럼, 나도 한 마디씩 용기를 쌓아 올려 비로소 내 목소리를 찾은 것이다.")] }, question: {
    prompt: "박수를 받으며 '나'가 떠올린 것과 그 의미로 알맞은 것은?",
    choices: [
      { id: "A", text: "나무 조각처럼 결을 따라 조금씩 깎여 비로소 자기 목소리를 찾았다." },
      { id: "B", text: "할아버지가 나무를 부수는 모습을 떠올리며 두려움을 느꼈다." },
      { id: "C", text: "선생님의 칭찬이 자기에게 주는 상이라고 생각했다." },
      { id: "D", text: "민재에게 감사 편지를 써야겠다고 결심했다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s20", highlight: { ranges: [r("p4", p4, "교실 밖 운동장의 웃음소리가 이제는 더 이상 먼 나라의 언어가 아니라, 내가 걸어 들어갈 수 있는 세계의 소리로 들려왔다.")] }, question: {
    prompt: "마지막 문장에서 운동장 웃음소리의 의미 변화로 알맞은 것은?",
    choices: [
      { id: "A", text: "먼 나라의 언어가 아니라 자신이 걸어 들어갈 수 있는 세계의 소리로 바뀌었다." },
      { id: "B", text: "여전히 먼 나라의 언어처럼 들려 아무것도 변하지 않았다." },
      { id: "C", text: "웃음소리가 너무 시끄러워 교실에서 들을 수 없게 되었다." },
      { id: "D", text: "운동장에 나가서 뛰어놀기 시작했다는 것을 뜻한다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }},
  { stepId: "s21", highlight: { ranges: [{ paragraphId: "p4", start: 0, end: p4.length }] }, question: {
    prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "'나'가 마침내 발표에 성공하며 자기 목소리를 찾고 세상과 이어지는 성장을 이룬다." },
      { id: "B", text: "'나'가 발표에 또 실패하여 좌절감이 더욱 깊어진다." },
      { id: "C", text: "할아버지가 학교에 오셔서 '나'를 도와준다." },
      { id: "D", text: "'나'가 전학을 가기로 결정한다." }
    ], answerId: "A", scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }}
];

const recall = {
  cards: [
    { id: "c1", text: "'나'는 발표 시간에 한마디도 못 하고 교실에서 위축된 채 혼자 남는다." },
    { id: "c2", text: "짝꿍 민재의 걱정에도 속마음을 숨기고 아무렇지 않은 척한다." },
    { id: "c3", text: "할아버지가 나무 조각에 빗대어 천천히 결을 따르면 모양이 나온다고 위로한다." },
    { id: "c4", text: "'나'는 뜻을 바로 이해하지 못하지만 새가 만들어지는 과정을 지켜본다." },
    { id: "c5", text: "다음 날 민재에게 먼저 말을 걸어 처음으로 제대로 대화를 나눈다." },
    { id: "c6", text: "민재도 비슷한 경험이 있다는 것을 알고 나만 그런 것이 아님을 깨닫는다." },
    { id: "c7", text: "일주일 뒤 발표 기회에 목소리는 작았지만 끝까지 읽어 낸다." },
    { id: "c8", text: "나무 조각처럼 조금씩 깎여 자기 목소리를 찾으며 세상과 연결된다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

const confirm = {
  questions: [
    { id: "q1",
      prompt: "수업이 끝난 뒤 '나'가 교실에서 들은 소리를 무엇에 비유했나요?",
      answerText: "먼 나라의 언어",
      answerMatchMode: "ANY",
      answerRanges: [r("p1", p1, "먼 나라의 언어")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true },
    { id: "q2",
      prompt: "발표 시간에 선생님이 이름을 부르자 '나'의 몸에서 어떤 반응이 일어났나요?",
      answerText: "심장이 쿵쿵거리며 입술이 굳어 버렸다",
      answerMatchMode: "ANY",
      answerRanges: [r("p1", p1, "심장이 쿵쿵거리며 입술이 굳어 버렸다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true },
    { id: "q3",
      prompt: "할아버지가 나무 조각에 빗대어 '나'에게 전하려 한 핵심 말씀은 무엇인가요?",
      answerText: "천천히 결을 따라 깎으면 어느새 모양이 나온단다",
      answerMatchMode: "ANY",
      answerRanges: [r("p2", p2, "천천히 결을 따라 깎으면 어느새 모양이 나온단다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true },
    { id: "q4",
      prompt: "'나'가 민재에게 처음 건넨 말은 무엇인가요?",
      answerText: "같이 앉을래?",
      answerMatchMode: "ANY",
      answerRanges: [r("p3", p3, "같이 앉을래?")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true },
    { id: "q5",
      prompt: "민재가 새 환경을 두려워했던 이유는 무엇인가요?",
      answerText: "초등학교 때 전학을 자주 다녀서",
      answerMatchMode: "ANY",
      answerRanges: [r("p3", p3, "초등학교 때 전학을 자주 다녀서")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true },
    { id: "q6",
      prompt: "다시 발표 기회가 왔을 때 민재가 '나'에게 보여 준 행동은 무엇인가요?",
      answerText: "작은 미소를 지으며 주먹을 쥐어 보였다",
      answerMatchMode: "ANY",
      answerRanges: [r("p4", p4, "작은 미소를 지으며 주먹을 쥐어 보였다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true },
    { id: "q7",
      prompt: "'나'의 발표가 완벽하지 않았음을 보여 주는 표현은 무엇인가요?",
      answerText: "목소리는 작았고 중간에 한 번 멈추기도 했지만",
      answerMatchMode: "ANY",
      answerRanges: [r("p4", p4, "목소리는 작았고 중간에 한 번 멈추기도 했지만")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true },
    { id: "q8",
      prompt: "마지막 문장에서 운동장 웃음소리가 이제 '나'에게 어떤 소리로 변했나요?",
      answerText: "내가 걸어 들어갈 수 있는 세계의 소리",
      answerMatchMode: "ANY",
      answerRanges: [r("p4", p4, "내가 걸어 들어갈 수 있는 세계의 소리")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true }
  ]
};

const content = {
  contentId: "dr-r2-016",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 16 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_2",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 480,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall,
    confirm
  }
};

const batch = {
  content_type: "DAILY_READING",
  level_id: "RUSSELL_2",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 16,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};

const staticPath = "C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/frontend/public/daily-reading/russell2/016.json";
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log("016.json 저장 완료");

const batchPath = "C:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/generated/day16-batch.json";
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("day16-batch.json 저장 완료");
