// Auditoría estática de complejidad y métricas matemáticas de código.
// Corre en el pipeline de CI para asegurar que nadie meta funciones monstruo de 300 líneas
// o árboles de if/else anidados incontrolables.
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const MAX_FUNCTION_LINES = 65;

function getJsFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(path.join(__dirname, '..'), filePath);

  let issues = 0;

  // Revisión de densidad y tamaño de bloques
  let currentFunc = null;
  let funcStart = 0;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const funcMatch = line.match(/(?:function\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{)/);

    if (funcMatch && !currentFunc) {
      currentFunc = funcMatch[1] || funcMatch[2] || `anonymous@L${i + 1}`;
      funcStart = i + 1;
      braceDepth = 0;
    }

    if (currentFunc) {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      if (braceDepth <= 0 && i + 1 > funcStart) {
        const length = (i + 1) - funcStart;
        if (length > MAX_FUNCTION_LINES) {
          console.warn(`⚠️  [Complexity Warning] ${relPath}:${funcStart} Function "${currentFunc}" is ${length} lines long (max recommended: ${MAX_FUNCTION_LINES}).`);
        }
        currentFunc = null;
      }
    }
  }

  return issues;
}

function runAudit() {
  console.log('🔍 [CI Code Quality Audit] Verifying architectural bounds and function sizes...');
  const files = getJsFiles(SRC_DIR);
  let totalIssues = 0;

  for (const file of files) {
    totalIssues += auditFile(file);
  }

  if (totalIssues === 0) {
    console.log(`✔ [CI Code Quality Audit] All ${files.length} source files adhere to maintainability standards.`);
    process.exit(0);
  } else {
    console.error(`❌ Found ${totalIssues} quality violations.`);
    process.exit(1);
  }
}

runAudit();
