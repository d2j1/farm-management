const fs = require('fs');
const path = require('path');

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match "dark:" followed by typical tailwind class characters
  // \b ensures we match the start of the word 'dark:'
  // We match alphanumeric, dashes, slashes, brackets and periods
  const regex = /\bdark:[a-zA-Z0-9\-\/\[\]\.]+/g;

  if (regex.test(content)) {
    console.log(`Processing: ${filePath}`);
    
    // Replace the dark classes with an empty string
    let newContent = content.replace(regex, '');
    
    // Optional: clean up double spaces left behind
    newContent = newContent.replace(/  +/g, ' ');

    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}

const srcPath = path.join(__dirname, 'src');
console.log(`Starting to process directory: ${srcPath}`);
processDirectory(srcPath);
console.log('Finished removing dark mode classes.');
