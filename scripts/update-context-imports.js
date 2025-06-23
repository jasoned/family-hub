import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');

// Files to update
const filesToUpdate = [
  'pages/Settings.tsx',
  'pages/ListsPage.tsx',
  'pages/FamilyMembers.tsx',
  'pages/Dashboard.tsx',
  'pages/Chores.tsx',
  'pages/Calendar.tsx',
  'pages/AuthPage.tsx',
];

filesToUpdate.forEach(file => {
  const filePath = path.join(srcDir, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the import statement
    content = content.replace(
      /import\s+\{\s*useAppContext\s*}\s+from\s+['"]\.\.\/context\/AppContext['"]/g,
      'import { useAppContext } from "../context"'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${file}`);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
});

console.log('All context imports have been updated!');
