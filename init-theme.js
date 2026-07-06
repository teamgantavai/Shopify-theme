const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');

const zipUrl = 'https://github.com/Shopify/dawn/archive/refs/heads/main.zip';
const zipPath = path.join(__dirname, 'dawn.zip');
const extractPath = path.join(__dirname, 'dawn-temp');

console.log('Downloading Shopify Dawn theme from GitHub...');

const file = fs.createWriteStream(zipPath);
https.get(zipUrl, (response) => {
  if (response.statusCode === 302 || response.statusCode === 301) {
    // Handle redirect
    https.get(response.headers.location, (redirectResponse) => {
      redirectResponse.pipe(file);
      file.on('finish', () => {
        file.close(extractZip);
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', () => {
      file.close(extractZip);
    });
  }
}).on('error', (err) => {
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  console.error('Error downloading Dawn theme:', err.message);
});

function extractZip() {
  console.log('Extracting zip file...');
  try {
    // Use PowerShell's Expand-Archive
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`);
    console.log('Zip file extracted.');
    
    // Move files from extractPath/dawn-main to __dirname
    const subdirs = fs.readdirSync(extractPath);
    const dawnMainFolder = path.join(extractPath, subdirs[0]);
    const items = fs.readdirSync(dawnMainFolder);
    
    for (const item of items) {
      const src = path.join(dawnMainFolder, item);
      const dest = path.join(__dirname, item);
      if (fs.statSync(src).isDirectory()) {
        if (fs.existsSync(dest)) {
          fs.rmSync(dest, { recursive: true, force: true });
        }
        fs.renameSync(src, dest);
      } else {
        fs.renameSync(src, dest);
      }
    }
    
    // Clean up
    fs.rmSync(extractPath, { recursive: true, force: true });
    fs.unlinkSync(zipPath);
    console.log('Shopify Dawn Theme successfully downloaded and initialized in the workspace!');
  } catch (error) {
    console.error('Error during extraction/moving:', error.message);
  }
}
