const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Find all matches of: import Name from "lucide-react/dist/esm/icons/name";
  // And replace with: import { Name } from "lucide-react";
  const regex = /import\s+([A-Za-z0-9_]+)\s+from\s+['"]lucide-react\/dist\/esm\/icons\/[^'"]+['"];?/g;
  
  content = content.replace(regex, (match, p1) => {
    changed = true;
    return `import { ${p1} } from "lucide-react";`;
  });
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
