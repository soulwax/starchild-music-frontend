#!/usr/bin/env node
/**
 * Database Helper Script
 * Usage: node scripts/db-helper.js [command]
 * 
 * Commands:
 *   dev-sync    - Sync schema for development (uses db:push)
 *   prod-migrate - Apply migrations for production (uses db:migrate)
 *   generate    - Generate new migration files
 */

import { spawn } from 'child_process';

const commands = {
  'dev-sync': {
    description: 'Sync schema for development (bypasses migration tracking)',
    steps: [
      { cmd: 'npm', args: ['run', 'db:generate'], description: 'Generating migrations...' },
      { cmd: 'npm', args: ['run', 'db:push'], description: 'Pushing schema to database...' }
    ]
  },
  'prod-migrate': {
    description: 'Apply migrations for production',
    steps: [
      { cmd: 'npm', args: ['run', 'db:migrate'], description: 'Running migrations...' }
    ]
  },
  'generate': {
    description: 'Generate new migration files',
    steps: [
      { cmd: 'npm', args: ['run', 'db:generate'], description: 'Generating migrations...' }
    ]
  }
};

// @ts-ignore
async function runCommand(cmd, args, description) {
  console.log(`\n📦 ${description}`);
  
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { 
      stdio: 'inherit',
      shell: true 
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} - Success`);
        // @ts-ignore
        resolve();
      } else {
        console.error(`❌ ${description} - Failed with code ${code}`);
        reject(new Error(`Command failed: ${cmd} ${args.join(' ')}`));
      }
    });
  });
}

async function main() {
  const command = process.argv[2];
  
  // @ts-ignore
  if (!command || !commands[command]) {
    console.log('🗄️  Database Helper\n');
    console.log('Usage: node scripts/db-helper.js [command]\n');
    console.log('Available commands:\n');
    Object.entries(commands).forEach(([cmd, info]) => {
      console.log(`  ${cmd.padEnd(15)} - ${info.description}`);
    });
    console.log('\n💡 Tips:');
    console.log('  • Use "dev-sync" during development for quick schema changes');
    console.log('  • Use "prod-migrate" for production deployments');
    console.log('  • Always review generated migrations before applying\n');
    process.exit(1);
  }
  
  // @ts-ignore
  const { description, steps } = commands[command];
  console.log(`\n🚀 ${description}\n`);
  
  try {
    for (const step of steps) {
      await runCommand(step.cmd, step.args, step.description);
    }
    console.log('\n✨ All done!\n');
  } catch (error) {
    // @ts-ignore
    console.error('\n❌ Failed:', error.message, '\n');
    process.exit(1);
  }
}

main();

