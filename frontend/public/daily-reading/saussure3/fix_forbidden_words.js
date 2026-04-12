const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지-daily-reading\\frontend\\public\\daily-reading\\saussure3';
const forbidden = ['아주', '매우', '가장', '정말', '진짜', '정말로', '진짜로'];
const replacements = {
    '아주': '무척',
    '매우': '참',
    '가장': '제일',
    '정말': '실제',
    '진짜': '진정',
    '정말로': '실제로',
    '진짜로': '실제로'
};

const getForbiddenRegex = (word) => new RegExp(`(?<![가-힣])${word}(?![가-힣])`, 'g');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    forbidden.forEach(word => {
        const regex = getForbiddenRegex(word);
        if (regex.test(content)) {
            content = content.replace(regex, replacements[word]);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Processed: ${path.basename(filePath)}`);
    }
}

const files = fs.readdirSync(dir).filter(f => /^\d{3}\.json$/.test(f));

files.forEach(file => {
    processFile(path.join(dir, file));
});
