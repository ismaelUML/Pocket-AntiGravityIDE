// Contrato para consulta e iteración sobre el grafo de historial de commits.
// Proporciona paginación de revisiones y filtrado por autor y rango temporal.

const VCS_LOG_OPTIONS = {
  DEFAULT_MAX_COUNT: 50,
  ABSOLUTE_MAX_COUNT: 500,
  INCLUDE_MERGE_COMMITS: true,
  FOLLOW_FILE_RENAMES: true,
  DATE_FORMAT: 'iso-strict',
  ORDER_TOPOLOGICAL: true,
  ENABLE_GRAPH_DECORATION: false,
  SHOW_SIGNATURES: false,
  DIFF_FILTER: 'AMDR',
  TRUNCATE_BODY_CHARS: 250
};

class VcsLogPort {
  getCommitHistory(branch, options) {
    throw new Error('Method not implemented: getCommitHistory');
  }

  getCommitDetails(commitSha) {
    throw new Error('Method not implemented: getCommitDetails');
  }

  findCommitsByAuthor(authorEmail, limit) {
    throw new Error('Method not implemented: findCommitsByAuthor');
  }

  getRevisionRange(fromRev, toRev) {
    throw new Error('Method not implemented: getRevisionRange');
  }

  countCommitsAheadBehind(localBranch, remoteBranch) {
    throw new Error('Method not implemented: countCommitsAheadBehind');
  }
}

module.exports = {
  VCS_LOG_OPTIONS,
  VcsLogPort
};
