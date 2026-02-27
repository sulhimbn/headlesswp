import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const BUNDLE_DIR = '.next/static';
const CHUNK_LIMIT_KB = 250;
const TOTAL_LIMIT_KB = 850;

function getDirSize(dir, files = []) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        getDirSize(fullPath, files);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const stats = statSync(fullPath);
        files.push({ path: fullPath, size: stats.size });
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${dir}:`, e.message);
  }
  return files;
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function parseLimit(limitStr) {
  return parseFloat(limitStr) * 1024;
}

const chunksDir = join(process.cwd(), BUNDLE_DIR, 'chunks');
const files = getDirSize(chunksDir);

const totalSize = files.reduce((sum, f) => sum + f.size, 0);
const largestChunk = files.length > 0 
  ? Math.max(...files.map(f => f.size)) 
  : 0;

console.log('\n📦 Bundle Size Report');
console.log('======================');
console.log(`Total chunks: ${files.length}`);
console.log(`Total size: ${formatSize(totalSize)}`);
console.log(`Largest chunk: ${formatSize(largestChunk)}`);

let hasError = false;

if (largestChunk > parseLimit(CHUNK_LIMIT_KB)) {
  console.error(`\n❌ Largest chunk (${formatSize(largestChunk)}) exceeds limit (${CHUNK_LIMIT_KB} KB)`);
  hasError = true;
}

if (totalSize > parseLimit(TOTAL_LIMIT_KB)) {
  console.error(`\n❌ Total size (${formatSize(totalSize)}) exceeds limit (${TOTAL_LIMIT_KB} KB)`);
  hasError = true;
}

if (hasError) {
  console.error('\n⚠️ Bundle size check FAILED');
  process.exit(1);
} else {
  console.log('\n✅ Bundle size check PASSED');
  process.exit(0);
}
