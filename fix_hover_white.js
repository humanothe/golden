const fs = require('fs');

function fixHoverWhite(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace hover:bg-white with hover:bg-black dark:hover:bg-white
  // But be careful not to replace hover:bg-white/10 etc.
  content = content.replace(/hover:bg-white(?![\/\w\-])/g, 'hover:bg-black dark:hover:bg-white');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed ' + filePath);
}

fixHoverWhite('pages/Portfolio.tsx');
fixHoverWhite('pages/Profile.tsx');
