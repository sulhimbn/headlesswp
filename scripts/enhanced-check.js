#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function colorize(text, color) {
  return `${color}${text}${COLORS.reset}`;
}

const args = process.argv.slice(2);
const pretty = args.includes('--pretty') || !args.includes('--no-pretty');
const watchMode = args.includes('--watch');

const CHECKS = [
  { name: 'lint', command: 'npm', args: ['run', 'lint'], label: 'ESLint' },
  { name: 'typecheck', command: 'npm', args: ['run', 'typecheck'], label: 'TypeScript' },
  { name: 'test', command: 'npm', args: watchMode ? ['run', 'test:watch'] : ['run', 'test'], label: 'Jest' }
];

function log(message, color = COLORS.reset) {
  if (pretty) {
    console.log(colorize(message, color));
  }
}

async function runCheck(check) {
  return new Promise((resolve) => {
    const child = spawn(check.command, check.args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  if (pretty) {
    console.log();
    console.log(colorize('  ╔═══════════════════════════════════════╗', COLORS.cyan));
    console.log(colorize('  ║     Running Quality Checks            ║', COLORS.cyan));
    console.log(colorize('  ╚═══════════════════════════════════════╝', COLORS.cyan));
    console.log();
  }

  const startTime = Date.now();
  const results = [];

  for (const check of CHECKS) {
    if (pretty) {
      log(`  ▶ Running ${check.label}...`, COLORS.blue);
    }

    const success = await runCheck(check);
    results.push({ name: check.name, label: check.label, success });

    if (!success) {
      if (pretty) {
        console.log();
        log(`  ✗ ${check.label} FAILED`, COLORS.red);
        console.log();
        log('  ╔═══════════════════════════════════════╗', COLORS.red);
        log('  ║  Check failed - stopping here          ║', COLORS.red);
        log('  ╚═══════════════════════════════════════╝', COLORS.red);
        console.log();
      }
      process.exit(1);
    }

    if (pretty) {
      log(`  ✓ ${check.label} passed`, COLORS.green);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  if (pretty) {
    console.log();
    log('  ╔═══════════════════════════════════════╗', COLORS.green);
    log('  ║  ✓ All checks passed!                 ║', COLORS.green);
    log(`  ║  Time: ${elapsed}s                        ║`, COLORS.green);
    log('  ╚═══════════════════════════════════════╝', COLORS.green);
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});