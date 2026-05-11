const fs = require('fs');
const path = './src/features/pos/POS.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace CustomDropdown import
content = content.replace("import ConfirmationModal from '../../components/ConfirmationModal';", "import ConfirmationModal from '../../components/ConfirmationModal';\nimport CustomDropdown from '../../components/CustomDropdown';");

// Replace select with CustomDropdown (Regex to match the select block)
const selectRegex = /<select[\s\S]*?<\/select>/;
const dropdownReplacement = `<CustomDropdown
                       options={categories || []}
                       value={selectedCategory || ''}
                       onChange={(val) => setSelectedCategory(val ? Number(val) : null)}
                       placeholder="All Categories"
                     />`;
content = content.replace(selectRegex, dropdownReplacement);

// Fix UI styling (remove AI generated feel)
content = content.replace(/rounded-\[3rem\]/g, 'rounded-2xl');
content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-2xl');
content = content.replace(/rounded-\[2rem\]/g, 'rounded-2xl');
content = content.replace(/rounded-\[1\.5rem\]/g, 'rounded-xl');
content = content.replace(/font-black/g, 'font-bold');
content = content.replace(/uppercase tracking-widest/g, 'tracking-wide text-slate-500');
content = content.replace(/indigo-600/g, 'slate-900');
content = content.replace(/indigo-500/g, 'slate-800');
content = content.replace(/indigo-400/g, 'slate-700');
content = content.replace(/indigo-100/g, 'slate-200');
content = content.replace(/indigo-50/g, 'slate-100');
content = content.replace(/bg-indigo-900\/0/g, 'bg-slate-900/0');
content = content.replace(/bg-indigo-900\/5/g, 'bg-slate-900/5');

fs.writeFileSync(path, content);
console.log('POS.tsx fixed');
