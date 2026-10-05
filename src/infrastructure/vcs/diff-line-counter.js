// Contador de líneas agregadas y eliminadas en diffs unificados.

function isAddition(line) {
  return line.startsWith('+') && !line.startsWith('+++');
}

function isDeletion(line) {
  return line.startsWith('-') && !line.startsWith('---');
}

function countDiffLines(lines) {
  let additions = 0;
  let deletions = 0;
  for (const line of lines) {
    if (isAddition(line)) additions++;
    else if (isDeletion(line)) deletions++;
  }
  return { additions, deletions };
}

module.exports = {
  isAddition,
  isDeletion,
  countDiffLines
};
