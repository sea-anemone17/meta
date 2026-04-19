export const state = {
  route: 'dashboard',
  sessions: [],
  currentSession: null,
  latestSession: null,
  latestAnalysis: null,
  selectedMood: '안정',
  archiveFilterSubject: '전체',
  archiveFilterType: '전체'
};

export function setRoute(route) {
  state.route = route;
}

export function setSessions(sessions) {
  state.sessions = sessions;
  state.latestSession = sessions.at(-1) || null;
  state.latestAnalysis = state.latestSession?.analysis || null;
}

export function setCurrentSession(session) {
  state.currentSession = session;
}

export function setSelectedMood(mood) {
  state.selectedMood = mood;
}

export function setArchiveFilterSubject(value) {
  state.archiveFilterSubject = value;
}

export function setArchiveFilterType(value) {
  state.archiveFilterType = value;
}
