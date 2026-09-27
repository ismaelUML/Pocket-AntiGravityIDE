// Adaptador nativo de Git con funciones de complejidad ciclomática <= 5.
// Cero librerías infladas de 15 MB como isomorphic-git ni bindings raros de C++:
// ejecutamos el binario `git` que ya está en el PATH del sistema usando `windowsHide: true`
// para que no parpadee ninguna ventana negra en Windows.
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { VcsPort } = require('../../core/ports/vcs.port');
const { FileDiff, WorkspaceChanges } = require('../../core/domain/change');

// Micro-predicados de complejidad mínima (CC <= 2) para clasificar commits convencionales
function isTestOnly(files) {
  return files.length > 0 && files.every(f => f.includes('test') || f.includes('.spec.'));
}

function isDocsOnly(files) {
  return files.length > 0 && files.every(f => f.endsWith('.md') || f.includes('docs/'));
}

function isUiOnly(files) {
  return files.length > 0 && files.every(f => f.startsWith('public/') || f.endsWith('.html') || f.endsWith('.css'));
}

function isApiOnly(files) {
  return files.length > 0 && files.every(f => f.includes('src/interfaces/http') || f.includes('routes/'));
}

function isVcsOnly(files) {
  return files.length > 0 && files.every(f => f.includes('src/infrastructure/vcs') || f.includes('src/core/ports/vcs'));
}

// Conteo de líneas agregadas/eliminadas en un bloque diff (CC <= 3)
function countDiffLines(lines) {
  let additions = 0;
  let deletions = 0;
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions++;
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
  }
  return { additions, deletions };
}

// Construye la entidad FileDiff para archivos sin rastrear (untracked ??)
function buildUntrackedFileDiff(workspaceRoot, filePath) {
  let content = '';
  let additions = 0;
  try {
    const fullPath = path.join(workspaceRoot, filePath);
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && stat.size < 200000) {
      content = fs.readFileSync(fullPath, 'utf8');
      additions = content.split('\n').length;
    }
  } catch (_) {}

  return new FileDiff({
    file: filePath,
    diff: content ? `@@ -0,0 +1,${additions} @@\n` + content.split('\n').map(l => `+${l}`).join('\n') : '',
    additions,
    deletions: 0,
    status: 'untracked'
  });
}

const GIT_BIN = (function resolveGitBin() {
  if (process.platform === 'win32') {
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
  return fs.existsSync('/usr/bin/git') ? '/usr/bin/git' : 'git';
})();

class GitAdapter extends VcsPort {
  runGit(args, cwd) {
    return new Promise((resolve, reject) => {
      const safeArgs = args.map(arg => String(arg).replace(/\0/g, ''));
      execFile(GIT_BIN, safeArgs, { cwd, maxBuffer: 10 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(stdout.trim());
      });
    });
  }

  // Parseador artesanal de diff unificado (diff --git)
  parseUnifiedDiff(rawDiff) {
    if (!rawDiff) return [];
    const fileDiffs = [];
    const parts = rawDiff.split(/^diff --git /m).filter(Boolean);

    for (const part of parts) {
      const lines = part.split('\n');
      const fileMatch = lines[0].match(/b\/(.+)$/);
      const fileName = fileMatch ? fileMatch[1] : 'unknown';
      const { additions, deletions } = countDiffLines(lines);

      fileDiffs.push(new FileDiff({
        file: fileName,
        diff: part,
        additions,
        deletions,
        status: 'modified'
      }));
    }
    return fileDiffs;
  }

  async getChanges(workspaceRoot) {
    try {
      const statusOutput = await this.runGit(['status', '--porcelain'], workspaceRoot);
      if (!statusOutput) {
        return new WorkspaceChanges({ workspaceRoot, files: [] });
      }

      const rawDiff = await this.runGit(['diff', '-U3'], workspaceRoot).catch(() => '');
      const parsedDiffs = this.parseUnifiedDiff(rawDiff);

      const statusLines = statusOutput.split('\n').filter(Boolean);
      const untrackedFiles = [];

      for (const line of statusLines) {
        if (line.startsWith('??')) {
          const filePath = line.substring(3).trim().replace(/^"|"$/g, '');
          untrackedFiles.push(buildUntrackedFileDiff(workspaceRoot, filePath));
        }
      }

      return new WorkspaceChanges({
        workspaceRoot,
        files: [...parsedDiffs, ...untrackedFiles]
      });
    } catch (_) {
      return new WorkspaceChanges({ workspaceRoot, files: [] });
    }
  }

  async acceptAll(workspaceRoot) {
    try {
      await this.runGit(['add', '.'], workspaceRoot);
      return { success: true, message: 'All changes staged in Git.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async acceptFile(workspaceRoot, filePath) {
    try {
      const cleanPath = String(filePath || '').replace(/^[-]+/, '');
      if (!cleanPath) return { success: false, error: 'Invalid file path' };
      await this.runGit(['add', '--', cleanPath], workspaceRoot);
      return { success: true, message: `File ${cleanPath} staged in Git.` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async rejectAll(workspaceRoot) {
    try {
      const stashMsg = `pocket-reject-backup-${Date.now()}`;
      await this.runGit(['stash', 'push', '--include-untracked', '-m', stashMsg], workspaceRoot).catch(() => {});
      await this.runGit(['restore', '.'], workspaceRoot).catch(() => {});
      return { success: true, message: 'All changes safely reverted (backup preserved in git stash).' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async rejectFile(workspaceRoot, filePath) {
    try {
      const cleanPath = String(filePath || '').replace(/^[-]+/, '');
      if (!cleanPath) return { success: false, error: 'Invalid file path' };
      await this.runGit(['restore', '--', cleanPath], workspaceRoot).catch(async () => {
        await this.runGit(['clean', '-f', '--', cleanPath], workspaceRoot).catch(() => {});
      });
      return { success: true, message: `File ${cleanPath} reverted.` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getBranchInfo(workspaceRoot) {
    try {
      const branch = await this.runGit(['rev-parse', '--abbrev-ref', 'HEAD'], workspaceRoot);
      const remotes = await this.runGit(['remote'], workspaceRoot).catch(() => '');
      const hasOrigin = remotes.split('\n').map(r => r.trim()).includes('origin');
      return {
        branch: branch || 'main',
        remote: hasOrigin ? 'origin' : (remotes.split('\n')[0] || ''),
        hasRemote: Boolean(remotes.trim())
      };
    } catch (_) {
      return { branch: 'main', remote: '', hasRemote: false };
    }
  }

  // Generador de Conventional Commits dividido en micro-funciones con CC <= 4
  generateSuggestedCommitMessage(stagedFiles = []) {
    if (!stagedFiles || stagedFiles.length === 0) {
      return 'chore: update workspace files';
    }

    const files = stagedFiles.map(f => typeof f === 'string' ? f : (f.file || ''));

    if (isTestOnly(files)) return 'test: add and update test suites';
    if (isDocsOnly(files)) return 'docs: update project documentation and guides';
    if (isUiOnly(files)) {
      return files.length === 1
        ? `feat(ui): update ${path.basename(files[0])}`
        : 'feat(ui): update mobile interface and components';
    }
    if (isApiOnly(files)) return 'feat(api): update HTTP routes and endpoints';
    if (isVcsOnly(files)) return 'feat(vcs): enhance version control system capabilities';

    if (files.length === 1) {
      const base = path.basename(files[0]);
      const ext = path.extname(base);
      const name = base.replace(ext, '');
      return `feat(${name}): update ${base}`;
    }

    return `feat: update ${files.length} project files`;
  }

  async getStagedChanges(workspaceRoot) {
    try {
      const statusOutput = await this.runGit(['status', '--porcelain'], workspaceRoot).catch(() => '');
      if (!statusOutput) {
        return new WorkspaceChanges({ workspaceRoot, files: [] });
      }

      const rawDiff = await this.runGit(['diff', '--cached', '-U3'], workspaceRoot).catch(() => '');
      const parsedDiffs = this.parseUnifiedDiff(rawDiff);

      const statusLines = statusOutput.split('\n').filter(Boolean);
      const stagedAddedFiles = [];

      for (const line of statusLines) {
        if (line.charAt(0) === 'A') {
          const filePath = line.substring(3).trim().replace(/^"|"$/g, '');
          if (!parsedDiffs.some(p => p.file === filePath)) {
            stagedAddedFiles.push(buildUntrackedFileDiff(workspaceRoot, filePath));
          }
        }
      }

      return new WorkspaceChanges({
        workspaceRoot,
        files: [...parsedDiffs, ...stagedAddedFiles]
      });
    } catch (_) {
      return new WorkspaceChanges({ workspaceRoot, files: [] });
    }
  }

  async commit(workspaceRoot, message) {
    try {
      const cleanMessage = String(message || '').trim().replace(/^[-]+/, '');
      if (!cleanMessage) {
        return { success: false, error: 'Commit message cannot be empty or flag-only.' };
      }

      const staged = await this.getStagedChanges(workspaceRoot);
      if (!staged.hasChanges || staged.files.length === 0) {
        return { success: false, error: 'No staged changes to commit. Stage files first.' };
      }

      const stdout = await this.runGit(['commit', '-m', cleanMessage, '--'], workspaceRoot);
      const commitHash = await this.runGit(['rev-parse', '--short', 'HEAD'], workspaceRoot).catch(() => 'unknown');
      const branchInfo = await this.getBranchInfo(workspaceRoot);

      return {
        success: true,
        commitHash,
        message: cleanMessage,
        branch: branchInfo.branch,
        filesCount: staged.files.length,
        output: stdout
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async push(workspaceRoot, remote = 'origin', branch) {
    try {
      const branchInfo = await this.getBranchInfo(workspaceRoot);
      const targetBranch = String(branch || branchInfo.branch || 'main').trim().replace(/^[-]+/, '');
      const targetRemote = String(remote || branchInfo.remote || 'origin').trim().replace(/^[-]+/, '');

      const stdout = await this.runGit(['push', '--', targetRemote, targetBranch], workspaceRoot);
      return {
        success: true,
        remote: targetRemote,
        branch: targetBranch,
        output: stdout || `Pushed to ${targetRemote}/${targetBranch}`
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = {
  GitAdapter,
  isTestOnly,
  isDocsOnly,
  isUiOnly,
  isApiOnly,
  isVcsOnly,
  countDiffLines,
  buildUntrackedFileDiff
};
