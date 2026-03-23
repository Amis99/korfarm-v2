/**
 * 표준국어대사전 XML에서 단어를 검색하는 유틸리티
 * 사용법: node dict-lookup.js 감각 시각 청각
 */
const fs = require('fs');
const path = require('path');

const DICT_DIR = path.join(__dirname, '../../표준국어대사전xml/korean-dict-nikl-stdict-master');

function getAllXmlFiles() {
  return fs.readdirSync(DICT_DIR).filter(f => f.endsWith('.xml')).map(f => path.join(DICT_DIR, f));
}

function extractWordFromFile(filepath, targetWord) {
  const xml = fs.readFileSync(filepath, 'utf-8');
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  const results = [];
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const wordMatch = item.match(/<word><!\[CDATA\[([^\]]+)\]\]><\/word>/);
    if (!wordMatch) continue;
    const cleanWord = wordMatch[1].replace(/\d+$/, '').replace(/-/g, '');
    if (cleanWord !== targetWord) continue;

    const codeMatch = item.match(/<target_code>(\d+)<\/target_code>/);
    const posMatch = item.match(/<pos>([^<]+)<\/pos>/);
    const origMatches = [...item.matchAll(/<original_language><!\[CDATA\[([^\]]+)\]\]><\/original_language>/g)];
    const hanja = origMatches.length > 0 ? origMatches[0][1] : '';

    const senseRegex = /<sense_info>([\s\S]*?)<\/sense_info>/g;
    let senseMatch;
    const senses = [];
    while ((senseMatch = senseRegex.exec(item)) !== null) {
      const sense = senseMatch[1];
      const defMatch = sense.match(/<definition><!\[CDATA\[([^\]]+)\]\]><\/definition>/);
      const exampleRegex = /<example><!\[CDATA\[([^\]]+)\]\]><\/example>/g;
      let exMatch;
      const examples = [];
      while ((exMatch = exampleRegex.exec(sense)) !== null) {
        examples.push(exMatch[1]);
      }
      const catMatch = sense.match(/<cat>([^<]+)<\/cat>/);
      senses.push({
        definition: defMatch ? defMatch[1] : '',
        examples,
        category: catMatch ? catMatch[1] : ''
      });
    }
    results.push({
      code: codeMatch ? codeMatch[1] : '',
      rawWord: wordMatch[1],
      word: cleanWord,
      pos: posMatch ? posMatch[1] : '',
      hanja,
      senses
    });
  }
  return results;
}

function lookupWord(targetWord) {
  const files = getAllXmlFiles();
  let allResults = [];
  for (const f of files) {
    const results = extractWordFromFile(f, targetWord);
    allResults = allResults.concat(results);
  }
  return allResults;
}

function lookupWords(wordList) {
  const files = getAllXmlFiles();
  const resultMap = {};
  for (const w of wordList) resultMap[w] = [];

  for (const f of files) {
    const xml = fs.readFileSync(f, 'utf-8');
    for (const targetWord of wordList) {
      if (xml.includes(targetWord)) {
        const results = extractWordFromFile(f, targetWord);
        resultMap[targetWord] = resultMap[targetWord].concat(results);
      }
    }
  }
  return resultMap;
}

// CLI 모드
if (require.main === module) {
  const words = process.argv.slice(2);
  if (words.length === 0) {
    console.log('사용법: node dict-lookup.js 단어1 단어2 ...');
    process.exit(1);
  }
  const results = lookupWords(words);
  console.log(JSON.stringify(results, null, 2));
}

module.exports = { lookupWord, lookupWords };
