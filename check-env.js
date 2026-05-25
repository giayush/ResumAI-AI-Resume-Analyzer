const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("Checking Environment...");

// Check Python exists
try {
  execSync('python --version', { stdio: 'ignore' });
  console.log("✅ Python is installed.");
} catch (err) {
  console.error("❌ Python is not found. Please install Python and ensure it is in your PATH.");
  process.exit(1);
}

// Check frontend node_modules exist
const frontendDir = path.join(__dirname, 'frontend');
const nmDir = path.join(frontendDir, 'node_modules');

if (!fs.existsSync(nmDir)) {
  console.log("⚠️ Frontend 'node_modules' missing. Running npm install automatically...");
  try {
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
    console.log("✅ Frontend dependencies installed successfully.");
  } catch (err) {
    console.error("❌ Failed to install frontend dependencies.", err);
    process.exit(1);
  }
} else {
  console.log("✅ Frontend dependencies are already installed.");
}

console.log("Environment check passed! Starting services...\n");
