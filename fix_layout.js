const fs = require('fs');

let content = fs.readFileSync('components/Layout.tsx', 'utf8');

// Replace bg-[#050505] with bg-white dark:bg-[#050505]
content = content.replace(/bg-\[#050505\]/g, 'bg-white dark:bg-[#050505]');

// Replace text-platinum with text-black dark:text-platinum
content = content.replace(/text-platinum/g, 'text-black dark:text-platinum');

// Replace bg-black/40 with bg-white/40 dark:bg-black/40
content = content.replace(/bg-black\/40/g, 'bg-white/40 dark:bg-black/40');

// Replace border-white/5 with border-black/5 dark:border-white/5
content = content.replace(/border-white\/5/g, 'border-black/5 dark:border-white/5');

// Replace bg-white/5 with bg-black/5 dark:bg-white/5
content = content.replace(/bg-white\/5/g, 'bg-black/5 dark:bg-white/5');

// Replace text-white with text-black dark:text-white
content = content.replace(/text-white/g, 'text-black dark:text-white');

// Replace text-gray-500 with text-black/50 dark:text-gray-500
content = content.replace(/text-gray-500/g, 'text-black/50 dark:text-gray-500');

// Replace bg-black/60 with bg-white/60 dark:bg-black/60
content = content.replace(/bg-black\/60/g, 'bg-white/60 dark:bg-black/60');

// Replace hover:text-white with hover:text-black dark:hover:text-white
content = content.replace(/hover:text-white/g, 'hover:text-black dark:hover:text-white');

fs.writeFileSync('components/Layout.tsx', content, 'utf8');
console.log('Processed Layout.tsx');
