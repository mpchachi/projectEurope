const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = __dirname;

// Read env vars from the existing start.bat
function parseStartBat() {
  const env = {};
  try {
    const content = fs.readFileSync(path.join(root, 'start.bat'), 'utf-8');
    content.split('\n').forEach(line => {
      const m = line.match(/^set\s+([^=]+)=(.+)/i);
      if (m) env[m[1].trim()] = m[2].trim();
    });
  } catch (e) { /* no start.bat — proceed without extra env */ }
  return env;
}

const backendEnv = { ...process.env, ...parseStartBat() };

const services = [
  {
    name: 'Backend',
    color: '\x1b[36m', // cyan
    cwd: root,
    command: 'uvicorn api:app --reload --port 8000',
    env: backendEnv,
  },
  {
    name: 'App    ',
    color: '\x1b[33m', // yellow
    cwd: path.join(root, 'frontend'),
    command: 'npm run dev',
    env: process.env,
  },
];

const reset = '\x1b[0m';
const procs = [];

services.forEach(({ name, color, cwd, command, env }) => {
  if (!fs.existsSync(cwd)) {
    console.warn(`\x1b[31m[${name}] directory not found: ${cwd} — skipping\x1b[0m`);
    return;
  }

  const proc = spawn('cmd.exe', ['/c', command], { cwd, env, stdio: 'pipe' });
  procs.push(proc);

  const prefix = `${color}[${name}]${reset} `;

  const print = (data) =>
    data.toString().split('\n').filter(l => l.trim()).forEach(l =>
      process.stdout.write(prefix + l + '\n')
    );

  proc.stdout.on('data', print);
  proc.stderr.on('data', print);
  proc.on('error', (err) => console.error(`${prefix}spawn error: ${err.message}`));
  proc.on('close', (code) => console.log(`${prefix}exited (code ${code})`));
});

console.log('\x1b[32m');
console.log('  OPEN  →  http://localhost:3000');
console.log('  API   →  http://localhost:8000');
console.log('\x1b[0m  Ctrl+C to stop all.\n');

process.on('SIGINT', () => { procs.forEach(p => p.kill()); process.exit(0); });
