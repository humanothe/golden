const fs = require('fs');

let content = fs.readFileSync('pages/Portfolio.tsx', 'utf8');

// Replace bg-white text-black with bg-black dark:bg-white text-white dark:text-black
content = content.replace(/bg-white text-black/g, 'bg-black dark:bg-white text-white dark:text-black');

fs.writeFileSync('pages/Portfolio.tsx', content, 'utf8');
console.log('Processed Portfolio.tsx');
