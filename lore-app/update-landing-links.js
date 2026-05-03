const fs = require('fs');
const path = require('path');

// Read the landing page
const landingPath = path.join(__dirname, 'public', 'landing-dark.html');
let html = fs.readFileSync(landingPath, 'utf8');

// Update "Get Started" button in header
html = html.replace(
  /<button class="nav-link cta">Get Started →<\/button>/g,
  '<a href="/app" class="nav-link cta" style="text-decoration:none;">Get Started →</a>'
);

// Update "Continue with GitHub" buttons
html = html.replace(
  /<button class="auth-btn github">\s*<svg/g,
  '<a href="/app?auth=github" class="auth-btn github" style="text-decoration:none;cursor:pointer;"><svg'
);

html = html.replace(
  /Continue with GitHub\s*<\/button>/g,
  'Continue with GitHub</a>'
);

// Update "Use Locally" buttons
html = html.replace(
  /<button class="auth-btn local">/g,
  '<a href="/app?auth=local" class="auth-btn local" style="text-decoration:none;cursor:pointer;">'
);

html = html.replace(
  /Use Locally — No signup\s*<\/button>/g,
  'Use Locally — No signup</a>'
);

html = html.replace(
  /Use Locally\s*<\/button>/g,
  'Use Locally</a>'
);

// Update CTA buttons at bottom
html = html.replace(
  /<button class="cta-btn primary">/g,
  '<a href="/app?auth=github" class="cta-btn primary" style="text-decoration:none;cursor:pointer;">'
);

html = html.replace(
  /<button class="cta-btn secondary">/g,
  '<a href="/app?auth=local" class="cta-btn secondary" style="text-decoration:none;cursor:pointer;">'
);

// Write back
fs.writeFileSync(landingPath, html, 'utf8');

console.log('✅ Updated landing-dark.html with app links');
console.log('   - Get Started → /app');
console.log('   - Continue with GitHub → /app?auth=github');
console.log('   - Use Locally → /app?auth=local');
