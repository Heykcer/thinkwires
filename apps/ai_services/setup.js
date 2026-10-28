const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const venvDir = path.join(__dirname, 'venv');
const requirementsFile = path.join(__dirname, 'requirements.txt');

console.log('====================================================');
console.log('🤖 ThinkWires AI Microservice - Cross-Platform Setup');
console.log('====================================================');
console.log(`Detected Platform: ${process.platform} (${process.arch})`);

// 1. Detect base Python binary
function detectPython() {
  const candidates = isWin ? ['python', 'py'] : ['python3', 'python'];

  for (const cmd of candidates) {
    const test = spawnSync(cmd, ['--version'], {
      encoding: 'utf8',
      shell: isWin,
    });
    if (!test.error && test.status === 0) {
      console.log(
        `✔ Found host Python executable: '${cmd}' (${(test.stdout || test.stderr).trim()})`
      );
      return cmd;
    }
  }
  return null;
}

const basePy = detectPython();
if (!basePy) {
  console.error('\n❌ Error: Python was not found in your system PATH.');
  console.error('Please install Python 3.10+ and re-run this setup script:');
  console.error(
    '  Windows:       winget install Python.Python.3.11  (or https://python.org)'
  );
  console.error(
    '  Ubuntu/Debian: sudo apt update && sudo apt install python3 python3-venv python3-pip'
  );
  console.error('  Fedora/RHEL:   sudo dnf install python3 python3-pip');
  console.error('  macOS:         brew install python3\n');
  process.exit(1);
}

// 2. Create virtual environment if not present
const venvPy = isWin
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : fs.existsSync(path.join(venvDir, 'bin', 'python'))
    ? path.join(venvDir, 'bin', 'python')
    : path.join(venvDir, 'bin', 'python3');

const venvPip = isWin
  ? path.join(venvDir, 'Scripts', 'pip.exe')
  : path.join(venvDir, 'bin', 'pip');

if (!fs.existsSync(venvDir) || !fs.existsSync(venvPy)) {
  console.log(`\n📦 Creating Python virtual environment in '${venvDir}'...`);
  const createResult = spawnSync(basePy, ['-m', 'venv', 'venv'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: false,
  });

  if (createResult.status !== 0) {
    console.error('\n❌ Failed to create virtual environment.');
    if (!isWin) {
      console.error(
        'On Debian/Ubuntu you may need: sudo apt install python3-venv'
      );
    }
    process.exit(1);
  }
  console.log('✔ Virtual environment initialized successfully.');
} else {
  console.log(`✔ Existing virtual environment detected at: ${venvDir}`);
}

// 3. Upgrade pip and install dependencies
if (fs.existsSync(requirementsFile)) {
  console.log('\n📥 Installing requirements from requirements.txt...');
  const pyRunner = fs.existsSync(venvPy) ? venvPy : basePy;
  const pipArgs = ['-m', 'pip', 'install', '-r', requirementsFile];

  const installResult = spawnSync(pyRunner, pipArgs, {
    cwd: __dirname,
    stdio: 'inherit',
    shell: false,
  });

  if (installResult.status !== 0) {
    console.error('\n❌ Failed to install Python dependencies.');
    process.exit(1);
  }
  console.log('✔ Python dependencies installed successfully.');
}

console.log('\n====================================================');
console.log('✅ AI Microservice is ready!');
console.log('   Run tests:  npm test');
console.log('   Run dev:    npm run dev');
console.log('====================================================\n');
