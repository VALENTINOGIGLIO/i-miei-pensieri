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
  
  // Find all matches of: import { A, B as C } from 'lucide-react';
  const regex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;
  
  content = content.replace(regex, (match, p1) => {
    changed = true;
    const imports = p1.split(',').map(s => s.trim()).filter(s => s);
    return imports.map(imp => {
      let imported = imp;
      let local = imp;
      if (imp.includes(' as ')) {
        const parts = imp.split(' as ');
        imported = parts[0].trim();
        local = parts[1].trim();
      }
      
      // Kebab case the imported name
      const kebab = imported.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '\$1-\$2').toLowerCase().replace(/^-/, '');
      return `import ${local} from "lucide-react/dist/esm/icons/${kebab}";`;
    }).join('\n');
  });
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
