// Localizador defensivo del binario ejecutable de Git según plataforma operativa.
const fs = require('fs');

function findWindowsGit() {
  const candidates = [
    'C:\\Program Files\\Git\\cmd\\git.exe',
    'C:\\Program Files\\Git\\bin\\git.exe',
    'C:\\Program Files (x86)\\Git\\cmd\\git.exe'
  ];
  for (const cp of candidates) {
    if (fs.existsSync(cp)) return cp;
  }
  return 'git.exe';
}

function resolveGitBin() {
  if (process.platform === 'win32') {
    return findWindowsGit();
  }
  return fs.existsSync('/usr/bin/git') ? '/usr/bin/git' : 'git';
}

const GIT_BIN = resolveGitBin();

module.exports = {
  GIT_BIN,
  resolveGitBin
};
