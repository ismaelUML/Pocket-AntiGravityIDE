// Mapeo y resolución de roles de actores para eventos de transcripción.

const ROLE_LOOKUP = {
  USER_INPUT: 'user',
  USER_EXPLICIT: 'user',
  PLANNER_RESPONSE: 'assistant',
  MODEL: 'assistant'
};

function resolveTranscriptRole(parsed) {
  const directRole = ROLE_LOOKUP[parsed.type];
  if (directRole) return directRole;
  return ROLE_LOOKUP[parsed.source] || 'system';
}

module.exports = {
  ROLE_LOOKUP,
  resolveTranscriptRole
};
