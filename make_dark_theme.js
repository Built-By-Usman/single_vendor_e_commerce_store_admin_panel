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
    
    // Replace hardcoded light theme Tailwind classes with dark theme ones
    content = content.replace(/bg-white/g, 'bg-slate-800');
    content = content.replace(/bg-slate-50\/50/g, 'bg-slate-800/50');
    content = content.replace(/bg-slate-50/g, 'bg-slate-900');
    content = content.replace(/bg-slate-100/g, 'bg-slate-800');
    content = content.replace(/bg-slate-200/g, 'bg-slate-700');
    
    content = content.replace(/text-slate-900/g, 'text-slate-50');
    content = content.replace(/text-slate-800/g, 'text-slate-200');
    content = content.replace(/text-slate-700/g, 'text-slate-300');
    content = content.replace(/text-slate-600/g, 'text-slate-400');
    content = content.replace(/text-slate-500/g, 'text-slate-400');
    
    content = content.replace(/border-slate-100/g, 'border-slate-700');
    content = content.replace(/border-slate-200/g, 'border-slate-700');
    
    fs.writeFileSync(file, content);
});
console.log('Admin panel converted to dark theme.');
