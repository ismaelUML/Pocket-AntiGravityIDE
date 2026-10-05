// Ejecutor del binario Git con aislamiento de procesos y windowsHide: true.
const { execFile } = require('child_process');
const { GitCommandRunnerPort } = require('./git-runner.port');
const { GIT_BIN } = require('./git-binary-locator');

function sanitizeArg(arg) {
  return String(arg).replace(/\0/g, '');
}

function runGit(args, cwd, stdinContent = null) {
  return new Promise((resolve, reject) => {
    const safeArgs = args.map(sanitizeArg);
    const options = { cwd, maxBuffer: 10 * 1024 * 1024, windowsHide: true };
    const child = execFile(GIT_BIN, safeArgs, options, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      resolve(stdout.trim());
    });
    if (stdinContent && child.stdin) {
      child.stdin.write(stdinContent);
      child.stdin.end();
    }
  });
}

module.exports = {
  runGit,
  GIT_BIN,
  GitCommandRunnerPort
};
