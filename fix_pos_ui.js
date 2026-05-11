const fs = require('fs');
const path = './src/features/pos/POS.tsx';
let content = fs.readFileSync(path, 'utf8');

// Less bubbly corners
content = content.replace(/rounded-2xl/g, 'rounded-xl');
content = content.replace(/rounded-3xl/g, 'rounded-xl');

// Remove uppercase tracking-widest (which looks AI generated)
content = content.replace(/uppercase tracking-widest/g, 'font-medium text-slate-500');

fs.writeFileSync(path, content);
console.log('POS.tsx UI refined.');
