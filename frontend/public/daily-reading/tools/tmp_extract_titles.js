const fs = require('fs');
const path = require('path');
const targetDir = '../saussure2';
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.json')).sort();
let out = '';
files.forEach(f => {
  try {
    const c = fs.readFileSync(path.join(targetDir, f), 'utf8');
    const m = c.match(/"title"\s*:\s*"([^"]+)"/);
    if (m) {
      out += f + ' - ' + m[1] + '\n';
    } else {
      out += f + ' - (No title found)\n';
    }
  } catch(e) {
    out += f + ' - (Error: ' + e.message + ')\n';
  }
});
fs.writeFileSync('../saussure2_titles_utf8.txt', out, 'utf8');
console.log('Done mapping titles.');
