const STORAGE_KEY = 'meta_v2_sessions';
const CURRENT_SESSION_KEY = 'meta_v2_current_session';

export function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function appendSession(session) {
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);
  return sessions;
}

export function loadCurrentSession() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveCurrentSession(session) {
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
}

export function clearCurrentSession() {
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CURRENT_SESSION_KEY);
}
