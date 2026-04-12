const fs = require('fs');
const code = fs.readFileSync('gen176_180.js', 'utf8');

// evaluate the code to get data array
let data = [];
const script = code.replace(/const fs = require\('fs'\);/, '').replace(/data\.forEach\(d => \{[\s\S]*/, 'module.exports = data;');
fs.writeFileSync('temp_eval.js', script);
data = require('./temp_eval.js');

data.forEach(item => {
  let expectedQs = 0;
  item.passages.forEach((p, i) => {
    let sentences = [];
    if (item.tags.includes("동시")) {
      sentences = p.split('\n').filter(s => s.trim().length > 0);
    } else {
      sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
    }
    expectedQs += sentences.length + 1; // 1 for summary
    console.log(`ID: ${item.id}, P${i+1}: ${sentences.length} sentences`);
  });
  console.log(`ID: ${item.id} - Expected Qs: ${expectedQs}, Actual Qs: ${item.qs.length}`);
});
