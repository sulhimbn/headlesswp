import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const COVERAGE_FILE = resolve('coverage/lcov.info');
const MIN_COVERAGE = 50;

async function checkPerFileCoverage() {
  const content = await readFile(COVERAGE_FILE, 'utf-8');
  const lines = content.split('\n');
  
  const files = [];
  let currentFile = null;
  let lineHits = 0;
  let lineFound = 0;
  
  for (const line of lines) {
    if (line.startsWith('SF:')) {
      if (currentFile && lineFound > 0) {
        const coverage = (lineHits / lineFound) * 100;
        files.push({ path: currentFile, coverage: coverage.toFixed(2) });
      }
      currentFile = line.slice(3);
      lineHits = 0;
      lineFound = 0;
    } else if (line.startsWith('LH:') && currentFile) {
      lineHits = parseInt(line.slice(3), 10);
    } else if (line.startsWith('LF:') && currentFile) {
      lineFound = parseInt(line.slice(3), 10);
    }
  }
  
  if (currentFile && lineFound > 0) {
    const coverage = (lineHits / lineFound) * 100;
    files.push({ path: currentFile, coverage: coverage.toFixed(2) });
  }
  
  const failures = files.filter(f => parseFloat(f.coverage) < MIN_COVERAGE);
  
  if (failures.length > 0) {
    console.error('\n❌ Per-file coverage check failed!\n');
    console.error(`The following files are below ${MIN_COVERAGE}% line coverage:\n`);
    for (const f of failures) {
      console.error(`  ${f.path}: ${f.coverage}%`);
    }
    console.error('\n');
    process.exit(1);
  }
  
  console.log(`\n✓ Per-file coverage check passed (all files >= ${MIN_COVERAGE}%)\n`);
}

checkPerFileCoverage();
