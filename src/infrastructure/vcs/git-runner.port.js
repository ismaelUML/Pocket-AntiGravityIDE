// Contrato para ejecución nativa de comandos git en el sistema operativo.

class GitCommandRunnerPort {
  runGit(args, cwd, stdinContent) {
    throw new Error('Method not implemented');
  }

  isGitInstalled() {
    throw new Error('Method not implemented');
  }

  getGitVersion() {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  GitCommandRunnerPort
};
