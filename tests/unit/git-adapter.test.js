const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {
  GitAdapter,
  isTestOnly,
  isDocsOnly,
  isUiOnly,
  isApiOnly,
  isVcsOnly,
  countDiffLines,
  buildUntrackedFileDiff
} = require('../../src/infrastructure/vcs/git.adapter');

test('GitAdapter Micro-Predicates & Diff Utilities', async (t) => {
  await t.test('file classifier micro-predicates', () => {
    assert.strictEqual(isTestOnly([]), false);
    assert.strictEqual(isTestOnly(['tests/unit/foo.test.js']), true);
    assert.strictEqual(isTestOnly(['tests/foo.js', 'src/bar.js']), false);

    assert.strictEqual(isDocsOnly([]), false);
    assert.strictEqual(isDocsOnly(['README.md', 'docs/architecture.md']), true);
    assert.strictEqual(isDocsOnly(['README.md', 'src/server.js']), false);

    assert.strictEqual(isUiOnly([]), false);
    assert.strictEqual(isUiOnly(['public/index.html', 'public/style.css']), true);
    assert.strictEqual(isUiOnly(['src/server.js']), false);

    assert.strictEqual(isApiOnly([]), false);
    assert.strictEqual(isApiOnly(['src/interfaces/http/routes/system.routes.js']), true);
    assert.strictEqual(isApiOnly(['src/interfaces/http/routes.js', 'src/other.js']), false);

    assert.strictEqual(isVcsOnly([]), false);
    assert.strictEqual(isVcsOnly(['src/infrastructure/vcs/git.adapter.js']), true);
    assert.strictEqual(isVcsOnly(['src/core/ports/vcs.port.js']), true);
    assert.strictEqual(isVcsOnly(['src/server.js']), false);
  });

  await t.test('countDiffLines counts additions and deletions without headers', () => {
    const lines = [
      '+++ b/file.js',
      '--- a/file.js',
      '+added line 1',
      '+added line 2',
      '-deleted line',
      ' unchanged line'
    ];
    const { additions, deletions } = countDiffLines(lines);
    assert.strictEqual(additions, 2);
    assert.strictEqual(deletions, 1);
  });

  await t.test('buildUntrackedFileDiff handles real and missing files safely', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-untracked-test-'));
    try {
      const filePath = 'hello.txt';
      fs.writeFileSync(path.join(tmpDir, filePath), 'line1\nline2\nline3');
      const diffEntity = buildUntrackedFileDiff(tmpDir, filePath);
      assert.strictEqual(diffEntity.file, filePath);
      assert.strictEqual(diffEntity.additions, 3);
      assert.strictEqual(diffEntity.status, 'untracked');
      assert.ok(diffEntity.diff.includes('+line1'));

      const missing = buildUntrackedFileDiff(tmpDir, 'non-existent.txt');
      assert.strictEqual(missing.additions, 0);
      assert.strictEqual(missing.diff, '');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

test('GitAdapter Commit Suggestions and Operations', async (t) => {
  const adapter = new GitAdapter();

  await t.test('generateSuggestedCommitMessage produces appropriate conventional commits', () => {
    assert.strictEqual(adapter.generateSuggestedCommitMessage([]), 'chore: update workspace files');
    assert.strictEqual(adapter.generateSuggestedCommitMessage(null), 'chore: update workspace files');
    assert.strictEqual(adapter.generateSuggestedCommitMessage(['tests/app.test.js']), 'test: add and update test suites');
    assert.strictEqual(adapter.generateSuggestedCommitMessage(['docs/readme.md']), 'docs: update project documentation and guides');
    assert.strictEqual(adapter.generateSuggestedCommitMessage(['public/app.css']), 'feat(ui): update app.css');
    assert.strictEqual(adapter.generateSuggestedCommitMessage(['public/a.css', 'public/b.html']), 'feat(ui): update mobile interface and components');
    assert.strictEqual(adapter.generateSuggestedCommitMessage(['src/interfaces/http/changes.routes.js']), 'feat(api): update HTTP routes and endpoints');
    assert.strictEqual(adapter.generateSuggestedCommitMessage(['src/infrastructure/vcs/git.adapter.js']), 'feat(vcs): enhance version control system capabilities');
    assert.strictEqual(adapter.generateSuggestedCommitMessage(['src/custom-module.js']), 'feat(custom-module): update custom-module.js');
    assert.strictEqual(adapter.generateSuggestedCommitMessage(['a.js', 'b.js', 'c.js']), 'feat: update 3 project files');
  });

  await t.test('runGit executes system git commands and handles stdin and errors', async () => {
    const version = await adapter.runGit(['--version'], process.cwd());
    assert.ok(version.includes('git version'));

    const hash = await adapter.runGit(['hash-object', '--stdin'], process.cwd(), 'hello-pocket');
    assert.strictEqual(typeof hash, 'string');
    assert.ok(hash.length >= 7);

    await assert.rejects(
      async () => adapter.runGit(['invalid-command-xyz'], process.cwd()),
      /not a git command|is not a git command/i
    );
  });

  await t.test('acceptFile validates path and calls runGit', async () => {
    const invalidRes = await adapter.acceptFile('/fake', '');
    assert.strictEqual(invalidRes.success, false);
    assert.strictEqual(invalidRes.error, 'Invalid file path');

    // Mock runGit
    const mock = new GitAdapter();
    let runGitCalled = null;
    mock.runGit = async (args, cwd) => {
      runGitCalled = { args, cwd };
      return '';
    };

    const validRes = await mock.acceptFile('/workspace', 'src/file.js');
    assert.strictEqual(validRes.success, true);
    assert.deepStrictEqual(runGitCalled.args, ['add', '--', 'src/file.js']);

    mock.runGit = async () => { throw new Error('git add failed'); };
    const errRes = await mock.acceptFile('/workspace', 'src/file.js');
    assert.strictEqual(errRes.success, false);
    assert.strictEqual(errRes.error, 'git add failed');
  });

  await t.test('acceptAll stages all changes', async () => {
    const mock = new GitAdapter();
    mock.runGit = async (args) => {
      assert.deepStrictEqual(args, ['add', '.']);
      return '';
    };
    const res = await mock.acceptAll('/workspace');
    assert.strictEqual(res.success, true);

    mock.runGit = async () => { throw new Error('staging failed'); };
    const errRes = await mock.acceptAll('/workspace');
    assert.strictEqual(errRes.success, false);
  });

  await t.test('rejectFile and rejectAll handle revert workflows', async () => {
    const mock = new GitAdapter();
    let commands = [];
    mock.runGit = async (args) => {
      commands.push(args[0]);
      return '';
    };

    const emptyReject = await mock.rejectFile('/workspace', '');
    assert.strictEqual(emptyReject.success, false);

    const fileRes = await mock.rejectFile('/workspace', 'src/file.js');
    assert.strictEqual(fileRes.success, true);
    assert.ok(commands.includes('restore'));

    commands = [];
    const allRes = await mock.rejectAll('/workspace');
    assert.strictEqual(allRes.success, true);
    assert.ok(commands.includes('stash'));
  });

  await t.test('getBranchInfo resolves branch and remotes', async () => {
    const mock = new GitAdapter();
    mock.runGit = async (args) => {
      if (args[0] === 'rev-parse') return 'feature/awesome';
      if (args[0] === 'remote') return 'origin\nupstream';
      return '';
    };
    const info = await mock.getBranchInfo('/workspace');
    assert.strictEqual(info.branch, 'feature/awesome');
    assert.strictEqual(info.remote, 'origin');
    assert.strictEqual(info.hasRemote, true);

    mock.runGit = async () => { throw new Error('not a git repo'); };
    const fallback = await mock.getBranchInfo('/workspace');
    assert.strictEqual(fallback.branch, 'main');
    assert.strictEqual(fallback.hasRemote, false);
  });

  await t.test('commit validates message and staged changes', async () => {
    const mock = new GitAdapter();
    const emptyMsgRes = await mock.commit('/workspace', '   ');
    assert.strictEqual(emptyMsgRes.success, false);
    assert.ok(emptyMsgRes.error.includes('empty'));

    mock.getStagedChanges = async () => ({ hasChanges: false, files: [] });
    const noChangesRes = await mock.commit('/workspace', 'feat: initial');
    assert.strictEqual(noChangesRes.success, false);
    assert.ok(noChangesRes.error.includes('No staged changes'));

    mock.getStagedChanges = async () => ({ hasChanges: true, files: [{ file: 'foo.js' }] });
    mock.runGit = async (args) => {
      if (args[0] === 'commit') return '[main abc1234] feat: initial';
      if (args[0] === 'rev-parse') return 'abc1234';
      return '';
    };
    mock.getBranchInfo = async () => ({ branch: 'main', remote: 'origin', hasRemote: true });

    const commitRes = await mock.commit('/workspace', 'feat: initial');
    assert.strictEqual(commitRes.success, true);
    assert.strictEqual(commitRes.commitHash, 'abc1234');
    assert.strictEqual(commitRes.branch, 'main');
  });

  await t.test('push executes git push safely', async () => {
    const mock = new GitAdapter();
    mock.getBranchInfo = async () => ({ branch: 'main', remote: 'origin' });
    mock.runGit = async (args) => {
      assert.deepStrictEqual(args, ['push', '--', 'origin', 'main']);
      return 'Everything up-to-date';
    };

    const res = await mock.push('/workspace');
    assert.strictEqual(res.success, true);

    mock.runGit = async () => { throw new Error('remote rejected'); };
    const errRes = await mock.push('/workspace');
    assert.strictEqual(errRes.success, false);
    assert.strictEqual(errRes.error, 'remote rejected');
  });

  await t.test('getChanges parses porcelain status and diffs', async () => {
    const mock = new GitAdapter();
    mock.runGit = async (args) => {
      if (args[0] === 'status') return '?? new-file.txt\n M modified.js';
      if (args[0] === 'diff') {
        return `diff --git a/modified.js b/modified.js
--- a/modified.js
+++ b/modified.js
@@ -1 +1 @@
-old
+new`;
      }
      return '';
    };

    const changes = await mock.getChanges('/workspace');
    assert.strictEqual(changes.files.length, 2);

    // Empty porcelain status
    mock.runGit = async () => '';
    const emptyChanges = await mock.getChanges('/workspace');
    assert.strictEqual(emptyChanges.files.length, 0);

    // On git command error
    mock.runGit = async () => { throw new Error('git fail'); };
    const errChanges = await mock.getChanges('/workspace');
    assert.strictEqual(errChanges.files.length, 0);
  });

  await t.test('getStagedChanges parses staged diffs and added files', async () => {
    const mock = new GitAdapter();
    mock.runGit = async (args) => {
      if (args[0] === 'status') return 'A  added-staged.txt';
      if (args[0] === 'diff') return '';
      return '';
    };

    const staged = await mock.getStagedChanges('/workspace');
    assert.strictEqual(staged.files.length, 1);
    assert.strictEqual(staged.files[0].file, 'added-staged.txt');

    // Empty status
    mock.runGit = async () => '';
    const emptyStaged = await mock.getStagedChanges('/workspace');
    assert.strictEqual(emptyStaged.files.length, 0);

    // On git error
    mock.runGit = async () => { throw new Error('git fail'); };
    const errStaged = await mock.getStagedChanges('/workspace');
    assert.strictEqual(errStaged.files.length, 0);
  });
});
