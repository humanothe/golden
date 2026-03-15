const fs = require('fs');

const filesToProcess = [
  'pages/AdminDashboard.tsx',
  'pages/ApplicationStatus.tsx',
  'pages/BenefitsView.tsx',
  'pages/BusinessAdmin.tsx',
  'pages/BusinessDashboard.tsx',
  'pages/BusinessProfile.tsx',
  'pages/Cart.tsx',
  'pages/DeliveryDashboard.tsx',
  'pages/History.tsx',
  'pages/Market.tsx',
  'pages/Membership.tsx',
  'pages/Notifications.tsx',
  'pages/OrderTracking.tsx',
  'pages/PartnerProfile.tsx',
  'pages/Partners.tsx',
  'pages/Points.tsx',
  'pages/ProductDetails.tsx',
  'pages/Savings.tsx',
  'pages/Wallet.tsx'
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File not found: ' + filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace bg-black with bg-white dark:bg-black
  content = content.replace(/bg-black(?![\w\-\/])/g, 'bg-white dark:bg-black');
  
  // Replace text-white with text-black dark:text-white
  content = content.replace(/text-white(?![\w\-\/])/g, 'text-black dark:text-white');
  
  // Replace bg-[#050505] with bg-white dark:bg-[#050505]
  content = content.replace(/bg-\[#050505\]/g, 'bg-white dark:bg-[#050505]');
  
  // Replace bg-[#0a0a0a] with bg-white dark:bg-[#0a0a0a]
  content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-white dark:bg-[#0a0a0a]');
  
  // Replace bg-[#0e0e0e] with bg-white dark:bg-[#0e0e0e]
  content = content.replace(/bg-\[#0e0e0e\]/g, 'bg-white dark:bg-[#0e0e0e]');
  
  // Replace border-white/10 with border-black/10 dark:border-white/10
  content = content.replace(/border-white\/10/g, 'border-black/10 dark:border-white/10');
  
  // Replace border-white/5 with border-black/5 dark:border-white/5
  content = content.replace(/border-white\/5/g, 'border-black/5 dark:border-white/5');
  
  // Replace bg-white/5 with bg-black/5 dark:bg-white/5
  content = content.replace(/bg-white\/5/g, 'bg-black/5 dark:bg-white/5');
  
  // Replace bg-white/10 with bg-black/10 dark:bg-white/10
  content = content.replace(/bg-white\/10/g, 'bg-black/10 dark:bg-white/10');
  
  // Replace bg-white/20 with bg-black/20 dark:bg-white/20
  content = content.replace(/bg-white\/20/g, 'bg-black/20 dark:bg-white/20');
  
  // Replace bg-white/\[0.02\] with bg-black/[0.02] dark:bg-white/[0.02]
  content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-black/[0.02] dark:bg-white/[0.02]');
  
  // Replace bg-white/\[0.05\] with bg-black/[0.05] dark:bg-white/[0.05]
  content = content.replace(/bg-white\/\[0\.05\]/g, 'bg-black/[0.05] dark:bg-white/[0.05]');
  
  // Replace text-white/40 with text-black/40 dark:text-white/40
  content = content.replace(/text-white\/40/g, 'text-black/40 dark:text-white/40');
  
  // Replace text-white/50 with text-black/50 dark:text-white/50
  content = content.replace(/text-white\/50/g, 'text-black/50 dark:text-white/50');
  
  // Replace text-white/60 with text-black/60 dark:text-white/60
  content = content.replace(/text-white\/60/g, 'text-black/60 dark:text-white/60');
  
  // Replace text-white/30 with text-black/30 dark:text-white/30
  content = content.replace(/text-white\/30/g, 'text-black/30 dark:text-white/30');
  
  // Replace text-white/20 with text-black/20 dark:text-white/20
  content = content.replace(/text-white\/20/g, 'text-black/20 dark:text-white/20');

  // Replace hover:text-white with hover:text-black dark:hover:text-white
  content = content.replace(/hover:text-white(?![\/\w\-])/g, 'hover:text-black dark:hover:text-white');

  // Replace hover:bg-white with hover:bg-black dark:hover:bg-white
  content = content.replace(/hover:bg-white(?![\/\w\-])/g, 'hover:bg-black dark:hover:bg-white');

  // Replace bg-white text-black with bg-black dark:bg-white text-white dark:text-black
  content = content.replace(/bg-white text-black/g, 'bg-black dark:bg-white text-white dark:text-black');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed ' + filePath);
}

filesToProcess.forEach(processFile);
