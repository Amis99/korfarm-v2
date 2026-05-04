/**
 * 해설 본문 안의 단독 알파벳(A~E)을 셔플된 표시 번호로 치환.
 *
 * 콘텐츠 DB 의 해설은 원본 선택지 ID(A/B/C/D/E)를 직접 언급하는 경우가 있다.
 *   예) "A는 사실주의 소설, B는 모더니즘 소설…"
 * 학생 화면에서는 선택지가 매번 새 셔플 결과로 1·2·3·4 번호로 보이므로,
 * 해설 표시 직전에 알파벳 → 실제 화면 번호로 변환한다.
 *
 * 치환 규칙: 앞뒤로 영문자가 없는 단독 알파벳(A~E)만 대상. ABC·iPad 같은 일반 단어는
 * 건드리지 않는다.
 */
export function replaceChoiceLetters(text, shuffledChoices) {
  if (!text) return text;
  if (!Array.isArray(shuffledChoices) || shuffledChoices.length === 0) return text;
  const map = new Map();
  shuffledChoices.forEach((c, i) => {
    const id = (c.id || c.choiceId || "").toString().toUpperCase();
    if (id.length === 1 && id >= "A" && id <= "Z") map.set(id, i + 1);
  });
  if (map.size === 0) return text;
  return String(text).replace(/(?<![A-Za-z])([A-E])(?![A-Za-z])/g, (_, letter) => {
    const num = map.get(letter.toUpperCase());
    return num != null ? String(num) : letter;
  });
}
