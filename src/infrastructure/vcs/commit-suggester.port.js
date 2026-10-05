// Contrato para generación heurística de mensajes convencionales de commit.

class CommitSuggesterPort {
  generateSuggestedCommitMessage(stagedFiles) {
    throw new Error('Method not implemented');
  }

  classifyFiles(files) {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  CommitSuggesterPort
};
