const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Clean up messy classes
  content = content.replace(/hover:bg-black dark:hover:bg-white dark:bg-black/g, 'hover:bg-black dark:hover:bg-white');
  content = content.replace(/hover:text-black dark:hover:text-white dark:hover:text-black dark:hover:text-white dark:hover:text-black/g, 'hover:text-black dark:hover:text-white');
  content = content.replace(/hover:text-black dark:hover:text-white dark:hover:bg-black dark:hover:bg-white dark:hover:text-black/g, 'hover:text-black dark:hover:text-white hover:bg-black dark:hover:bg-white');
  content = content.replace(/text-black dark:text-black dark:text-white/g, 'text-black dark:text-white');
  content = content.replace(/group-hover:bg-black dark:hover:bg-white dark:bg-black/g, 'group-hover:bg-black dark:group-hover:bg-white');
  content = content.replace(/group-hover:text-black dark:hover:text-white/g, 'group-hover:text-black dark:group-hover:text-white');
  content = content.replace(/hover:bg-white dark:bg-black/g, 'hover:bg-white dark:hover:bg-black');
  
  // Also clean up any other weird combinations
  content = content.replace(/dark:hover:bg-white dark:hover:bg-black/g, 'dark:hover:bg-white');
  content = content.replace(/dark:hover:text-white dark:hover:text-black/g, 'dark:hover:text-white');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      cleanFile(fullPath);
    }
  }
}

walkDir('pages');
walkDir('components');
console.log('Cleaned up messy classes');
