const fs = require('fs');

let content = fs.readFileSync('pages/Auth.tsx', 'utf8');

// Revert bg-white dark:bg-black to bg-black
content = content.replace(/bg-white dark:bg-black/g, 'bg-black');

// Revert text-black dark:text-white to text-white
content = content.replace(/text-black dark:text-white/g, 'text-white');

// Revert bg-white dark:bg-[#0a0a0a] to bg-[#0a0a0a]
content = content.replace(/bg-white dark:bg-\[#0a0a0a\]/g, 'bg-[#0a0a0a]');

// Revert border-black/10 dark:border-white/10 to border-white/10
content = content.replace(/border-black\/10 dark:border-white\/10/g, 'border-white/10');

// Revert bg-black/5 dark:bg-white/5 to bg-white/5
content = content.replace(/bg-black\/5 dark:bg-white\/5/g, 'bg-white/5');

// Revert text-black/40 dark:text-white/40 to text-white/40
content = content.replace(/text-black\/40 dark:text-white\/40/g, 'text-white/40');

// Revert text-black/50 dark:text-white/50 to text-white/50
content = content.replace(/text-black\/50 dark:text-white\/50/g, 'text-white/50');

// Revert bg-black/10 dark:bg-white/10 to bg-white/10
content = content.replace(/bg-black\/10 dark:bg-white\/10/g, 'bg-white/10');

// Revert bg-black/20 dark:bg-white/20 to bg-white/20
content = content.replace(/bg-black\/20 dark:bg-white\/20/g, 'bg-white/20');

// Revert text-black/20 dark:text-white/20 to text-white/20
content = content.replace(/text-black\/20 dark:text-white\/20/g, 'text-white/20');

// Revert bg-black/[0.02] dark:bg-white/[0.02] to bg-white/[0.02]
content = content.replace(/bg-black\/\[0\.02\] dark:bg-white\/\[0\.02\]/g, 'bg-white/[0.02]');

// Revert bg-black/[0.05] dark:bg-white/[0.05] to bg-white/[0.05]
content = content.replace(/bg-black\/\[0\.05\] dark:bg-white\/\[0\.05\]/g, 'bg-white/[0.05]');

// Revert text-black/60 dark:text-white/60 to text-white/60
content = content.replace(/text-black\/60 dark:text-white\/60/g, 'text-white/60');

// Revert text-black/30 dark:text-white/30 to text-white/30
content = content.replace(/text-black\/30 dark:text-white\/30/g, 'text-white/30');

fs.writeFileSync('pages/Auth.tsx', content, 'utf8');
console.log('Reverted Auth.tsx');
