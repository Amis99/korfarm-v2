const fs = require("fs");
const path = require("path");

const NEW_BASIC = [
  { id:"nb1", text:"토끼가 옹달샘에서 세수를 한다.", boxes:[{id:"b1",text:"토끼가",role:"주어",layer:1},{id:"b2",text:"옹달샘에서",role:"부사어",layer:1},{id:"b3",text:"세수를",role:"목적어",layer:1},{id:"b4",text:"한다",role:"서술어",layer:1}], roleOrder:["b4","b1","b3","b2"], clauses:[] },
  { id:"nb2", text:"민수는 성격이 좋은 학생이다.", boxes:[{id:"b1",text:"민수는",role:"주어",layer:1},{id:"b2",text:"성격이",role:"주어",layer:2},{id:"b3",text:"좋은",role:"서술어",layer:2},{id:"b4",text:"학생이다",role:"서술어",layer:1}], roleOrder:["b4","b1","b3","b2"], clauses:[{range:["b2","b3"],layer:2,parentRole:"관형어",parentLayer:1,clauseType:"관형절"}] },
  { id:"nb3", text:"그가 떠나서 나는 눈물이 났다.", boxes:[{id:"b1",text:"그가",role:"주어",layer:2},{id:"b2",text:"떠나서",role:"서술어",layer:2},{id:"b3",text:"나는",role:"주어",layer:1},{id:"b4",text:"눈물이 났다",role:"서술어",layer:1}], roleOrder:["b4","b3","b2","b1"], clauses:[{range:["b1","b2"],layer:2,parentRole:"이어진 문장",parentLayer:1,clauseType:"종속"}] },
  { id:"nb4", text:"바람이 세차게 불고 비가 내린다.", boxes:[{id:"b1",text:"바람이",role:"주어",layer:2},{id:"b2",text:"세차게",role:"부사어",layer:2},{id:"b3",text:"불고",role:"서술어",layer:2},{id:"b4",text:"비가",role:"주어",layer:1},{id:"b5",text:"내린다",role:"서술어",layer:1}], roleOrder:["b5","b4","b3","b2","b1"], clauses:[{range:["b1","b2","b3"],layer:2,parentRole:"이어진 문장",parentLayer:1,clauseType:"대등"}] },
  { id:"nb5", text:"나는 그가 오기를 기다린다.", boxes:[{id:"b1",text:"나는",role:"주어",layer:1},{id:"b2",text:"그가",role:"주어",layer:2},{id:"b3",text:"오기를",role:"서술어",layer:2},{id:"b4",text:"기다린다",role:"서술어",layer:1}], roleOrder:["b4","b1","b3","b2"], clauses:[{range:["b2","b3"],layer:2,parentRole:"목적어",parentLayer:1,clauseType:"명사절"}] },
  { id:"nb6", text:"토끼는 앞발이 짧다.", boxes:[{id:"b1",text:"토끼는",role:"주어",layer:1},{id:"b2",text:"앞발이",role:"주어",layer:2},{id:"b3",text:"짧다",role:"서술어",layer:2}], roleOrder:["b3","b1","b2"], clauses:[{range:["b2","b3"],layer:2,parentRole:"서술어",parentLayer:1,clauseType:"서술절"}] },
  { id:"nb7", text:"용주가 말도 없이 사라졌다.", boxes:[{id:"b1",text:"용주가",role:"주어",layer:1},{id:"b2",text:"말도",role:"주어",layer:2},{id:"b3",text:"없이",role:"서술어",layer:2},{id:"b4",text:"사라졌다",role:"서술어",layer:1}], roleOrder:["b4","b1","b3","b2"], clauses:[{range:["b2","b3"],layer:2,parentRole:"부사어",parentLayer:1,clauseType:"부사절"}] },
  { id:"nb8", text:"그는 영화 보러 가자고 말했다.", boxes:[{id:"b1",text:"그는",role:"주어",layer:1},{id:"b2",text:"영화 보러 가자고",role:"부사어",layer:2},{id:"b3",text:"말했다",role:"서술어",layer:1}], roleOrder:["b3","b1","b2"], clauses:[{range:["b2"],layer:2,parentRole:"부사어",parentLayer:1,clauseType:"인용절"}] },
  { id:"nb9", text:"우리 집 정원에 장미꽃이 피었다.", boxes:[{id:"b1",text:"우리",role:"관형어",layer:1},{id:"b2",text:"집",role:"관형어",layer:1},{id:"b3",text:"정원에",role:"부사어",layer:1},{id:"b4",text:"장미꽃이",role:"주어",layer:1},{id:"b5",text:"피었다",role:"서술어",layer:1}], roleOrder:["b5","b4","b3","b1","b2"], clauses:[] },
  { id:"nb10", text:"양치기가 거짓말을 했음이 드러났다.", boxes:[{id:"b1",text:"양치기가",role:"주어",layer:2},{id:"b2",text:"거짓말을",role:"목적어",layer:2},{id:"b3",text:"했음이",role:"서술어",layer:2},{id:"b4",text:"드러났다",role:"서술어",layer:1}], roleOrder:["b4","b3","b2","b1"], clauses:[{range:["b1","b2","b3"],layer:2,parentRole:"주어",parentLayer:1,clauseType:"명사절"}] },
  { id:"nb11", text:"농부들은 비가 오기를 기다린다.", boxes:[{id:"b1",text:"농부들은",role:"주어",layer:1},{id:"b2",text:"비가",role:"주어",layer:2},{id:"b3",text:"오기를",role:"서술어",layer:2},{id:"b4",text:"기다린다",role:"서술어",layer:1}], roleOrder:["b4","b1","b3","b2"], clauses:[{range:["b2","b3"],layer:2,parentRole:"목적어",parentLayer:1,clauseType:"명사절"}] },
  { id:"nb12", text:"동생은 키가 크다.", boxes:[{id:"b1",text:"동생은",role:"주어",layer:1},{id:"b2",text:"키가",role:"주어",layer:2},{id:"b3",text:"크다",role:"서술어",layer:2}], roleOrder:["b3","b1","b2"], clauses:[{range:["b2","b3"],layer:2,parentRole:"서술어",parentLayer:1,clauseType:"서술절"}] },
];

const NEW_ADVANCED = [
  { id:"na1", text:"나는 그가 거짓말을 했음을 알고 있었다.", boxes:[{id:"b1",text:"나는",role:"주어",layer:1},{id:"b2",text:"그가",role:"주어",layer:2},{id:"b3",text:"거짓말을",role:"목적어",layer:2},{id:"b4",text:"했음을",role:"서술어",layer:2},{id:"b5",text:"알고 있었다",role:"서술어",layer:1}], roleOrder:["b5","b1","b4","b3","b2"], clauses:[{range:["b2","b3","b4"],layer:2,parentRole:"목적어",parentLayer:1,clauseType:"명사절"}] },
  { id:"na2", text:"꽃이 핀 들판을 우리는 걸었다.", boxes:[{id:"b1",text:"꽃이",role:"주어",layer:2},{id:"b2",text:"핀",role:"서술어",layer:2},{id:"b3",text:"들판을",role:"목적어",layer:1},{id:"b4",text:"우리는",role:"주어",layer:1},{id:"b5",text:"걸었다",role:"서술어",layer:1}], roleOrder:["b5","b4","b3","b2","b1"], clauses:[{range:["b1","b2"],layer:2,parentRole:"관형어",parentLayer:1,clauseType:"관형절"}] },
  { id:"na3", text:"아이가 비가 그치기를 바라며 창밖을 내다보았다.", boxes:[{id:"b1",text:"아이가",role:"주어",layer:1},{id:"b2",text:"비가",role:"주어",layer:3},{id:"b3",text:"그치기를",role:"서술어",layer:3},{id:"b4",text:"바라며",role:"서술어",layer:2},{id:"b5",text:"창밖을",role:"목적어",layer:1},{id:"b6",text:"내다보았다",role:"서술어",layer:1}], roleOrder:["b6","b1","b5","b4","b3","b2"], clauses:[{range:["b2","b3"],layer:3,parentRole:"목적어",parentLayer:2,clauseType:"명사절"},{range:["b2","b3","b4"],layer:2,parentRole:"이어진 문장",parentLayer:1,clauseType:"종속"}] },
  { id:"na4", text:"철수가 읽은 책을 영희도 빌려 보았다.", boxes:[{id:"b1",text:"철수가",role:"주어",layer:2},{id:"b2",text:"읽은",role:"서술어",layer:2},{id:"b3",text:"책을",role:"목적어",layer:1},{id:"b4",text:"영희도",role:"주어",layer:1},{id:"b5",text:"빌려 보았다",role:"서술어",layer:1}], roleOrder:["b5","b4","b3","b2","b1"], clauses:[{range:["b1","b2"],layer:2,parentRole:"관형어",parentLayer:1,clauseType:"관형절"}] },
  { id:"na5", text:"철수는 영희가 예쁘다고 생각한다.", boxes:[{id:"b1",text:"철수는",role:"주어",layer:1},{id:"b2",text:"영희가",role:"주어",layer:2},{id:"b3",text:"예쁘다고",role:"서술어",layer:2},{id:"b4",text:"생각한다",role:"서술어",layer:1}], roleOrder:["b4","b1","b3","b2"], clauses:[{range:["b2","b3"],layer:2,parentRole:"부사어",parentLayer:1,clauseType:"인용절"}] },
  { id:"na6", text:"우리가 살고 있는 세상이 아름답다.", boxes:[{id:"b1",text:"우리가",role:"주어",layer:2},{id:"b2",text:"살고 있는",role:"서술어",layer:2},{id:"b3",text:"세상이",role:"주어",layer:1},{id:"b4",text:"아름답다",role:"서술어",layer:1}], roleOrder:["b4","b3","b2","b1"], clauses:[{range:["b1","b2"],layer:2,parentRole:"관형어",parentLayer:1,clauseType:"관형절"}] },
  { id:"na7", text:"그는 자기가 잘못했다고 말했다.", boxes:[{id:"b1",text:"그는",role:"주어",layer:1},{id:"b2",text:"자기가",role:"주어",layer:2},{id:"b3",text:"잘못했다고",role:"서술어",layer:2},{id:"b4",text:"말했다",role:"서술어",layer:1}], roleOrder:["b4","b1","b3","b2"], clauses:[{range:["b2","b3"],layer:2,parentRole:"부사어",parentLayer:1,clauseType:"인용절"}] },
];

function shuffleArray(arr) {
  const a = [...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
}

const outDir = path.join(__dirname, "../frontend/public/farm/grammar/sentence-structure");

// 기초 10개 추가 (11~20)
for (let i = 0; i < 10; i++) {
  const group = shuffleArray(NEW_BASIC).slice(0, 5);
  const nn = String(i + 11).padStart(2, "0");
  const json = { contentType: "GRAMMAR_SENTENCE_STRUCTURE", title: "문장의 짜임 기초 " + nn, targetLevel: "RUSSELL_1", area: "GRAMMAR", subArea: "SENTENCE_STRUCTURE", timeLimitSec: 300, payload: { sentences: group } };
  fs.writeFileSync(path.join(outDir, "ss_basic_" + nn + ".json"), JSON.stringify(json, null, 2), "utf8");
}
console.log("기초 10개 추가 (11~20)");

// 심화 10개 추가 (06~15)
const advPool = [...NEW_ADVANCED, ...NEW_BASIC.filter(s => s.clauses.length > 0)];
for (let i = 0; i < 10; i++) {
  const group = shuffleArray(advPool).slice(0, 5);
  const nn = String(i + 6).padStart(2, "0");
  const json = { contentType: "GRAMMAR_SENTENCE_STRUCTURE", title: "문장의 짜임 심화 " + nn, targetLevel: "WITTGENSTEIN_1", area: "GRAMMAR", subArea: "SENTENCE_STRUCTURE", timeLimitSec: 420, payload: { sentences: group } };
  fs.writeFileSync(path.join(outDir, "ss_advanced_" + nn + ".json"), JSON.stringify(json, null, 2), "utf8");
}
console.log("심화 10개 추가 (06~15)");
console.log("총 파일:", fs.readdirSync(outDir).filter(f => f.endsWith(".json")).length);
