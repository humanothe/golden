const fs = require('fs');

let content = fs.readFileSync('components/Layout.tsx', 'utf8');

// Replace hover:text-black dark:text-white with hover:text-black dark:hover:text-white
content = content.replace(/hover:text-black dark:text-white/g, 'hover:text-black dark:hover:text-white');

fs.writeFileSync('components/Layout.tsx', content, 'utf8');
console.log('Processed Layout.tsx');
