const fs = require('fs');
const path = './src/features/pos/POS.tsx';
let content = fs.readFileSync(path, 'utf8');

// Make it look like a professional, standard POS
content = content.replace(/rounded-xl/g, 'rounded-lg');
content = content.replace(/shadow-lg/g, 'shadow-sm');
content = content.replace(/shadow-2xl/g, 'shadow-md');
content = content.replace(/shadow-xl/g, 'shadow-sm');
content = content.replace(/backdrop-blur-md/g, '');
content = content.replace(/font-bold/g, 'font-medium');
content = content.replace(/text-slate-500/g, 'text-slate-600');
content = content.replace(/shadow-black\/[0-9]+/g, '');

fs.writeFileSync(path, content);
console.log('POS.tsx typography and UI flattened.');
