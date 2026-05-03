const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'lore-app', 'browser');

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
  console.log('⚠️  Dist folder not found. Run npm run build first.');
  process.exit(0);
}

// Rename Angular's index.html to app.html
const angularIndex = path.join(distPath, 'index.html');
const appHtml = path.join(distPath, 'app.html');

if (fs.existsSync(angularIndex)) {
  fs.renameSync(angularIndex, appHtml);
  console.log('✅ Renamed index.html → app.html');
}

// Copy landing-dark.html to index.html
const landingDark = path.join(distPath, 'landing-dark.html');
const newIndex = path.join(distPath, 'index.html');

if (fs.existsSync(landingDark)) {
  fs.copyFileSync(landingDark, newIndex);
  console.log('✅ Copied landing-dark.html → index.html');
  console.log('');
  console.log('📁 Build structure:');
  console.log('   /index.html          → Landing page (dark theme)');
  console.log('   /landing-dark.html   → Landing page (dark theme)');
  console.log('   /landing-light.html  → Landing page (light theme)');
  console.log('   /app.html            → Angular app entry point');
  console.log('');
  console.log('🌐 URLs:');
  console.log('   /                    → Landing page');
  console.log('   /app                 → Angular app (needs server config)');
} else {
  console.log('⚠️  landing-dark.html not found in dist folder');
}
