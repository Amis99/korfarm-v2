const fs = require('fs');
const file = 'c:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지-daily-reading/frontend/public/daily-reading/saussure2/059.json';
let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

let out = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"correctDeltaSec":')) {
    out.push('              "correctDeltaSec": 20,');
    out.push('              "wrongDeltaSec": -40,');
    out.push('              "eliminateWrongChoice": true');
    out.push('            }');
    out.push('          }');
    out.push('        }');
    out.push('      ]');
    out.push('    },');
    out.push('    "recall": { "cards": [], "correctOrder": [], "seedPenalty": 1 },');
    out.push('    "confirm": { "questions": [] }');
    out.push('  }');
    out.push('}');
    break; // Cut off anything after
  } else {
    out.push(lines[i]);
  }
}

fs.writeFileSync(file, out.join('\n'), 'utf8');
console.log('Fixed file');
