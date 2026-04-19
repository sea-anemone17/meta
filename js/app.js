import { DEMO_SESSIONS } from './data.js';
import { appendSession, clearCurrentSession, loadCurrentSession, loadSessions, resetAllData, saveCurrentSession } from './storage.js';
import { state, setArchiveFilterSubject, setArchiveFilterType, setCurrentSession, setRoute, setSelectedMood, setSessions } from './state.js';
import { analyzeSession, buildPatternReport, getDashboardWarnings, getRecommendedActions } from './analysis.js';
import {
  initSelectOptions,
  renderArchive,
  renderCurrentSession,
  renderDashboard,
  renderInsight,
  renderMoodOptions,
  renderPattern,
  renderSidebarStatus,
  setActiveRoute,
  updateRangeValue
} from './ui.js';

function createSessionFromForm() {
  return {
    id: `session_${Date.now()}`,
    createdAt: new Date().toISOString(),
    subject: document.getElementById('subject').value,
    taskType: document.getElementById('task-type').value,
    taskDetail: document.getElementById('task-detail').value.trim(),
    predictedAmount: Number(document.getElementById('predicted-amount').value),
    predictedFocus: Number(document.getElementById('predicted-focus').value),
    predictedUnderstanding: Number(document.getElementById('predicted-understanding').value),
    startDifficulty: Number(document.getElementById('start-difficulty').value),
    moodBefore: state.selectedMood,
    midCheck: {
      used: false,
      focusDrop: false,
      stuck: false,
      wandering: false
    }
  };
}

function refreshAllViews() {
  const report = buildPatternReport(state.sessions);
  const warnings = getDashboardWarnings(report, state.latestSession);
  const actions = getRecommendedActions(report);

  renderSidebarStatus(report, state.latestSession);
  renderDashboard(report, warnings, actions, state.latestSession);
  renderCurrentSession(state.currentSession);
  renderInsight(state.latestSession);
  renderPattern(report);
  renderArchive(state.sessions, {
    subject: state.archiveFilterSubject,
    type: state.archiveFilterType
  });
}

function initializeRanges() {
  const pairs = [
    ['start-difficulty', 'start-difficulty-value'],
    ['predicted-focus', 'predicted-focus-value'],
    ['predicted-understanding', 'predicted-understanding-value'],
    ['actual-focus', 'actual-focus-value'],
    ['actual-understanding', 'actual-understanding-value']
  ];

  pairs.forEach(([inputId, outputId]) => {
    const input = document.getElementById(inputId);
    input.addEventListener('input', () => updateRangeValue(inputId, outputId));
    updateRangeValue(inputId, outputId);
  });
}

function bindNavigation() {
  document.querySelectorAll('.nav-link').forEach((button) => {
    button.addEventListener('click', () => {
      const route = button.dataset.route;
      setRoute(route);
      setActiveRoute(route);
    });
  });
}

function bindMoodSelection() {
  const container = document.getElementById('mood-options');
  container.addEventListener('click', (event) => {
    const button = event.target.closest('.choice-chip');
    if (!button) return;
    setSelectedMood(button.dataset.mood);
    renderMoodOptions(state.selectedMood);
  });
}

function bindForms() {
  document.getElementById('start-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const session = createSessionFromForm();
    setCurrentSession(session);
    saveCurrentSession(session);
    renderCurrentSession(session);
  });

  document.getElementById('mid-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!state.currentSession) return;
    state.currentSession.midCheck = {
      used: true,
      stuck: document.getElementById('mid-stuck').checked,
      focusDrop: document.getElementById('mid-focus-drop').checked,
      wandering: document.getElementById('mid-wandering').checked
    };
    saveCurrentSession(state.currentSession);
    renderCurrentSession(state.currentSession);
  });

  document.getElementById('end-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!state.currentSession) {
      alert('먼저 시작 전 체크를 진행해 주세요.');
      return;
    }

    const completed = {
      ...state.currentSession,
      actualAmount: Number(document.getElementById('actual-amount').value),
      actualFocus: Number(document.getElementById('actual-focus').value),
      actualUnderstanding: Number(document.getElementById('actual-understanding').value),
      interruptions: Number(document.getElementById('interruptions').value),
      mainObstacle: document.getElementById('main-obstacle').value,
      recallSummary: document.getElementById('recall-summary').value.trim(),
      stuckPoint: document.getElementById('stuck-point').value.trim(),
      overallFeeling: document.getElementById('overall-feeling').value
    };

    completed.analysis = analyzeSession(completed);

    const sessions = appendSession(completed);
    setSessions(sessions);
    setCurrentSession(null);
    clearCurrentSession();

    document.getElementById('start-form').reset();
    document.getElementById('mid-form').reset();
    document.getElementById('end-form').reset();
    setSelectedMood('안정');
    renderMoodOptions(state.selectedMood);
    initializeRanges();
    refreshAllViews();
    setRoute('insight');
    setActiveRoute('insight');
  });
}

function bindArchiveFilters() {
  document.getElementById('archive-subject-filter').addEventListener('change', (event) => {
    setArchiveFilterSubject(event.target.value);
    refreshAllViews();
  });
  document.getElementById('archive-type-filter').addEventListener('change', (event) => {
    setArchiveFilterType(event.target.value);
    refreshAllViews();
  });
}

function bindUtilityButtons() {
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('정말 모든 기록을 지울까요?')) return;
    resetAllData();
    setSessions([]);
    setCurrentSession(null);
    renderMoodOptions('안정');
    refreshAllViews();
    setRoute('dashboard');
    setActiveRoute('dashboard');
  });

  document.getElementById('seed-demo-btn').addEventListener('click', () => {
    const demoWithAnalysis = DEMO_SESSIONS.map((session) => ({
      ...session,
      analysis: analyzeSession(session)
    }));
    localStorage.setItem('meta_v2_sessions', JSON.stringify(demoWithAnalysis));
    setSessions(loadSessions());
    refreshAllViews();
  });
}

function bootstrap() {
  initSelectOptions();
  renderMoodOptions(state.selectedMood);
  initializeRanges();
  bindNavigation();
  bindMoodSelection();
  bindForms();
  bindArchiveFilters();
  bindUtilityButtons();

  setSessions(loadSessions());
  setCurrentSession(loadCurrentSession());
  renderCurrentSession(state.currentSession);
  refreshAllViews();
  setActiveRoute(state.route);
}

bootstrap();
