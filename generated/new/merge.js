const fs = require('fs');
const path = require('path');
const dir = __dirname;
const c1 = JSON.parse(fs.readFileSync(path.join(dir, 'broken-saussure1-partB-fixed.json'), 'utf8'));
const c2 = JSON.parse(fs.readFileSync(path.join(dir, 'chunk2.json'), 'utf8'));
const c3 = JSON.parse(fs.readFileSync(path.join(dir, 'chunk3.json'), 'utf8'));
const c4 = JSON.parse(fs.readFileSync(path.join(dir, 'chunk4.json'), 'utf8'));
const c5 = JSON.parse(fs.readFileSync(path.join(dir, 'chunk5.json'), 'utf8'));
const all = [...c1, ...c2, ...c3, ...c4, ...c5];
console.log('Total items:', all.length);
const empty = all.filter(x => !x.fix || x.fix.trim() === '');
console.log('Empty fix count:', empty.length);
if (empty.length > 0) {
  empty.forEach(e => console.log('  EMPTY:', e.dayIndex, e.stepId, e.choiceId));
}
// Check for duplicates within same step
const stepGroups = {};
all.forEach(item => {
  const key = `${item.dayIndex}-${item.stepId}`;
  if (!stepGroups[key]) stepGroups[key] = [];
  stepGroups[key].push(item);
});
let dupCount = 0;
for (const [key, items] of Object.entries(stepGroups)) {
  const fixes = items.map(i => i.fix);
  const uniqueFixes = new Set(fixes);
  if (fixes.length !== uniqueFixes.size) {
    console.log('  DUPLICATE in', key, ':', fixes);
    dupCount++;
  }
}
console.log('Steps with duplicate fixes:', dupCount);
// Write merged file
fs.writeFileSync(path.join(dir, 'broken-saussure1-partB-fixed.json'), JSON.stringify(all, null, 2), 'utf8');
console.log('Merged file written successfully.');
// Clean up chunk files
['chunk2.json', 'chunk3.json', 'chunk4.json', 'chunk5.json'].forEach(f => {
  try { fs.unlinkSync(path.join(dir, f)); console.log('Deleted', f); } catch(e) {}
});
