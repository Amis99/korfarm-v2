// 지문에서 특정 텍스트의 위치를 찾는 도우미
const fs = require('fs');
const file = process.argv[2];
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const paras = data.content.payload.passage.paragraphs;
const searchTerms = process.argv.slice(3);

for (const para of paras) {
  console.log('\n[' + para.id + '] (' + para.text.length + '자)');
  for (const term of searchTerms) {
    let idx = -1;
    while ((idx = para.text.indexOf(term, idx + 1)) !== -1) {
      console.log('  "' + term + '" -> [' + para.id + ':' + idx + '-' + (idx + term.length) + ']');
    }
  }
}
