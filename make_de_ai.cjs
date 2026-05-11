const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // De-AI the CSS
    content = content.replace(/rounded-2xl/g, 'rounded-xl');
    content = content.replace(/rounded-3xl/g, 'rounded-xl');
    content = content.replace(/uppercase tracking-widest/g, 'font-medium text-slate-500');
    content = content.replace(/font-black/g, 'font-bold');
    
    fs.writeFileSync(file, content);
});
console.log('Global de-bubbly applied.');
