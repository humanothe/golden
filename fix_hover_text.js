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
  'pages/Wallet.tsx',
  'pages/Portfolio.tsx',
  'pages/Profile.tsx',
  'pages/Dashboard.tsx'
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix hover:text-black dark:text-white
  content = content.replace(/hover:text-black dark:text-white/g, 'hover:text-black dark:hover:text-white');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed ' + filePath);
}

filesToProcess.forEach(processFile);
