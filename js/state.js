const state = {
  route: 'dashboard',
  sessions: [],
  currentSession: null,
  selectedMood: '안정',
  latestAnalysis: null,
  latestReport: null
};

export function getState() {
  return state;
}

export function setRoute(route) {
  state.route = route;
}

export function setSessions(sessions) {
  state.sessions = sessions;
}

export function setCurrentSession(session) {
  state.currentSession = session;
}

export function setSelectedMood(mood) {
  state.selectedMood = mood;
}

export function setLatestAnalysis(analysis) {
  state.latestAnalysis = analysis;
}

export function setLatestReport(report) {
  state.latestReport = report;
}
