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
    
    // Reverse the replacements made previously
    content = content.replace(/bg-slate-800\/50/g, 'bg-slate-50/50');
    content = content.replace(/bg-slate-800/g, 'bg-white');
    content = content.replace(/bg-slate-900/g, 'bg-slate-50');
    content = content.replace(/bg-slate-700/g, 'bg-slate-200'); // Note: we changed slate-200 to slate-700
    
    // Note: Some bg-slate-100 were changed to bg-slate-800. We might convert them back to white or slate-50.
    // The previous script did: bg-slate-100 -> bg-slate-800. So we already changed bg-slate-800 back to bg-white.
    // That means original bg-slate-100 are now bg-white. This is fine.
    
    content = content.replace(/text-slate-50/g, 'text-slate-900');
    content = content.replace(/text-slate-200/g, 'text-slate-800');
    content = content.replace(/text-slate-300/g, 'text-slate-700');
    content = content.replace(/text-slate-400/g, 'text-slate-500'); // Note: we changed 500 and 600 to 400. All will now be 500. This is ok.
    
    content = content.replace(/border-slate-700/g, 'border-slate-200'); // Revert border colors
    
    // Revert shadows
    content = content.replace(/shadow-lg shadow-black\/20/g, 'shadow-sm');
    content = content.replace(/shadow-xl shadow-black\/30/g, 'shadow-md');
    content = content.replace(/shadow-2xl shadow-black\/40/g, 'shadow-lg');
    
    fs.writeFileSync(file, content);
});
console.log('Admin panel reverted to light theme.');
