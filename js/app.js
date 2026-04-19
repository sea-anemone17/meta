import { analyzeSession, buildReport } from './analysis.js';
import { DEMO_SESSIONS, EXPERIMENT_OPTIONS } from './data.js';
import { getState, setCurrentSession, setLatestAnalysis, setLatestReport, setRoute, setSelectedMood, setSessions } from './state.js';
import { exportStore, importStore, loadCurrentSession, loadSessions, saveCurrentSession, saveSessions, clearAllData } from './storage.js';
import { createSession, applyMidCheck, completeSession } from './session-model.js';
import {
  bindRangeValue,
  collectSubjectReflection,
  downloadJson,
  initStaticOptions,
  renderArchive,
  renderCurrentSession,
  renderDashboard,
  renderInsight,
  renderMoodOptions,
  renderPattern,
  renderSidebarStatus,
  renderSubjectReflectionFields,
  updateRoute
} from './ui.js';
import { asNumber, requireCurrentSession, validateEndPayload, validateStartPayload } from './validation.js';

const RANGE_BINDINGS = [
  ['start-difficulty', 'start-difficulty-value'],
  ['predicted-focus', 'predicted-focus-value'],
  ['confidence-focus', 'confidence-focus-value'],
  ['predicted-understanding', 'predicted-understanding-value'],
  ['confidence-understanding', 'confidence-understanding-value'],
  ['noise-level', 'noise-level-value'],
  ['actual-focus', 'actual-focus-value'],
  ['actual-understanding', 'actual-understanding-value'],
  ['blamed-self-first', 'blamed-self-first-value'],
  ['felt-incompetent', 'felt-incompetent-value'],
  ['distorted-outcome', 'distorted-outcome-value']
];

function stateRef() {
  return getState();
}

function refreshViews() {
  const state = stateRef();
  const report = buildReport(state.sessions);
  setLatestReport(report);
  const latestSession = state.sessions[state.sessions.length - 1] || null;
  setLatestAnalysis(latestSession?.analysis || null);

  renderSidebarStatus(state.currentSession, report);
  renderDashboard(report, latestSession);
  renderCurrentSession(state.currentSession);
  renderInsight(latestSession);
  renderPattern(report);
  renderArchive(state.sessions);
}

function loadInitialData() {
  setSessions(loadSessions());
  setCurrentSession(loadCurrentSession());
  setSelectedMood(stateRef().currentSession?.prediction?.moodBefore || '안정');
}

function handleRoute(route) {
  setRoute(route);
  updateRoute(route);
}

function getStartPayload() {
  return {
    subject: document.getElementById('subject').value,
    taskType: document.getElementById('task-type').value,
    taskDetail: document.getElementById('task-detail').value.trim(),
    predictedAmount: asNumber(document.getElementById('predicted-amount').value, 0),
    plannedStartAt: document.getElementById('planned-start-at').value,
    startDifficulty: asNumber(document.getElementById('start-difficulty').value, 3),
    predictedFocus: asNumber(document.getElementById('predicted-focus').value, 3),
    confidenceFocus: asNumber(document.getElementById('confidence-focus').value, 3),
    predictedUnderstanding: asNumber(document.getElementById('predicted-understanding').value, 3),
    confidenceUnderstanding: asNumber(document.getElementById('confidence-understanding').value, 3),
    location: document.getElementById('location').value,
    noiseLevel: asNumber(document.getElementById('noise-level').value, 2),
    phoneBlocked: document.getElementById('phone-blocked').checked,
    moodBefore: stateRef().selectedMood
  };
}

function getMidPayload() {
  return {
    stuck: document.getElementById('mid-stuck').checked,
    focusDrop: document.getElementById('mid-focus-drop').checked,
    wandering: document.getElementById('mid-wandering').checked,
    trigger: document.getElementById('mid-trigger').value.trim(),
    responseTaken: document.getElementById('mid-response').value
  };
}

function getEndPayload() {
  const subject = stateRef().currentSession?.context?.subject || document.getElementById('subject').value;
  return {
    actualAmount: asNumber(document.getElementById('actual-amount').value, 0),
    interruptions: asNumber(document.getElementById('interruptions').value, 0),
    actualFocus: asNumber(document.getElementById('actual-focus').value, 3),
    actualUnderstanding: asNumber(document.getElementById('actual-understanding').value, 3),
    mainObstacle: document.getElementById('main-obstacle').value,
    overallFeeling: document.getElementById('overall-feeling').value,
    conceptSummary: document.getElementById('concept-summary').value.trim(),
    confusionPoint: document.getElementById('confusion-point').value.trim(),
    nextStrategy: document.getElementById('next-strategy').value.trim(),
    selfTestResult: asNumber(document.getElementById('self-test-result').value, 0),
    successFactor: document.getElementById('success-factor').value.trim(),
    blamedSelfFirst: asNumber(document.getElementById('blamed-self-first').value, 2),
    feltIncompetent: asNumber(document.getElementById('felt-incompetent').value, 2),
    distortedOutcome: asNumber(document.getElementById('distorted-outcome').value, 2),
    previousExperimentEffect: document.getElementById('previous-experiment-effect').value,
    previousExperimentNote: document.getElementById('previous-experiment-note').value.trim(),
    subjectReflection: collectSubjectReflection(subject)
  };
}

function hydratePreviousExperimentField() {
  const lastSession = stateRef().sessions[stateRef().sessions.length - 1];
  const select = document.getElementById('previous-experiment-effect');
  const note = document.getElementById('previous-experiment-note');
  if (lastSession?.experiment?.planned && !lastSession.experiment.result?.helpful) {
    select.disabled = false;
    note.disabled = false;
  } else {
    select.value = '';
    note.value = '';
  }
}

function chooseExperiment(analysis) {
  const recommended = analysis.recommendedExperiments;
  const picked = recommended[0] || EXPERIMENT_OPTIONS[0];
  return { key: picked.key, label: picked.label };
}

function updatePreviousExperiment(endPayload) {
  const sessions = [...stateRef().sessions];
  const lastIndex = sessions.length - 1;
  if (lastIndex < 0 || !endPayload.previousExperimentEffect) return sessions;
  const last = sessions[lastIndex];
  if (!last.experiment?.planned) return sessions;
  sessions[lastIndex] = {
    ...last,
    experiment: {
      ...last.experiment,
      result: {
        helpful: endPayload.previousExperimentEffect,
        note: endPayload.previousExperimentNote
      }
    }
  };
  return sessions;
}

function resetForms() {
  document.getElementById('start-form').reset();
  document.getElementById('mid-form').reset();
  document.getElementById('end-form').reset();
  setSelectedMood('안정');
  renderMoodOptions('안정');
  renderSubjectReflectionFields(document.getElementById('subject').value || '수학');
  RANGE_BINDINGS.forEach(([inputId, outputId]) => bindRangeValue(inputId, outputId));
}

function bindEvents() {
  document.querySelectorAll('.nav-link').forEach((button) => {
    button.addEventListener('click', () => handleRoute(button.dataset.route));
  });

  document.getElementById('mood-options').addEventListener('click', (event) => {
    const button = event.target.closest('[data-mood]');
    if (!button) return;
    setSelectedMood(button.dataset.mood);
    renderMoodOptions(button.dataset.mood);
  });

  document.getElementById('subject').addEventListener('change', (event) => {
    renderSubjectReflectionFields(event.target.value);
  });

  document.getElementById('start-form').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      if (stateRef().currentSession) {
        const overwrite = window.confirm('진행 중인 세션이 있습니다. 폐기하고 새로 시작할까요?');
        if (!overwrite) return;
      }
      const payload = getStartPayload();
      validateStartPayload(payload);
      const session = createSession(payload);
      setCurrentSession(session);
      saveCurrentSession(session);
      renderCurrentSession(session);
      handleRoute('session');
      window.alert('세션을 시작했습니다.');
      refreshViews();
    } catch (error) {
      window.alert(error.message);
    }
  });

  document.getElementById('mid-form').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      requireCurrentSession(stateRef().currentSession);
      const updated = applyMidCheck(stateRef().currentSession, getMidPayload());
      setCurrentSession(updated);
      saveCurrentSession(updated);
      renderCurrentSession(updated);
      window.alert('중간 체크를 저장했습니다.');
      refreshViews();
    } catch (error) {
      window.alert(error.message);
    }
  });

  document.getElementById('end-form').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      requireCurrentSession(stateRef().currentSession);
      const endPayload = getEndPayload();
      validateEndPayload(endPayload);

      let sessions = updatePreviousExperiment(endPayload);
      const draftCompleted = {
        ...stateRef().currentSession,
        outcome: {
          actualAmount: endPayload.actualAmount,
          actualFocus: endPayload.actualFocus,
          actualUnderstanding: endPayload.actualUnderstanding,
          interruptions: endPayload.interruptions,
          mainObstacle: endPayload.mainObstacle,
          overallFeeling: endPayload.overallFeeling
        },
        recall: {
          conceptSummary: endPayload.conceptSummary,
          confusionPoint: endPayload.confusionPoint,
          nextStrategy: endPayload.nextStrategy,
          selfTestResult: endPayload.selfTestResult,
          subjectReflection: endPayload.subjectReflection
        },
        reflection: {
          selfCriticism: {
            blamedSelfFirst: endPayload.blamedSelfFirst,
            feltIncompetent: endPayload.feltIncompetent,
            distortedOutcome: endPayload.distortedOutcome
          },
          successFactor: endPayload.successFactor
        }
      };
      const analysis = analyzeSession(draftCompleted);
      const plannedExperiment = chooseExperiment(analysis);
      const { completed } = completeSession(stateRef().currentSession, endPayload, analysis, plannedExperiment);

      sessions = [...sessions, completed];
      setSessions(sessions);
      setCurrentSession(null);
      saveSessions(sessions);
      saveCurrentSession(null);
      hydratePreviousExperimentField();
      refreshViews();
      handleRoute('insight');
      window.alert(`세션을 종료했습니다. 다음 실험은 “${plannedExperiment.label}”로 제안되었습니다.`);
      resetForms();
    } catch (error) {
      window.alert(error.message);
    }
  });

  document.getElementById('seed-demo-btn').addEventListener('click', () => {
    const sessions = [...stateRef().sessions];
    DEMO_SESSIONS.forEach((sessionSeed) => {
      const now = new Date().toISOString();
      const session = {
        id: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        schemaVersion: 3,
        ...sessionSeed,
        timestamps: {
          createdAt: now,
          plannedStartAt: now,
          actualStartAt: now,
          midCheckedAt: now,
          endedAt: now
        }
      };
      session.analysis = analyzeSession(session);
      sessions.push(session);
    });
    setSessions(sessions);
    saveSessions(sessions);
    refreshViews();
    window.alert('데모 기록 2개를 추가했습니다.');
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    const ok = window.confirm('모든 기록과 진행 중 세션을 삭제할까요?');
    if (!ok) return;
    clearAllData();
    setSessions([]);
    setCurrentSession(null);
    setLatestAnalysis(null);
    resetForms();
    refreshViews();
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    downloadJson(`meta-backup-${new Date().toISOString().slice(0, 10)}.json`, exportStore());
  });

  document.getElementById('import-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const sessions = importStore(parsed);
      setSessions(sessions);
      refreshViews();
      window.alert('백업을 불러왔습니다.');
    } catch {
      window.alert('백업 파일을 읽지 못했습니다. JSON 형식을 확인해 주세요.');
    } finally {
      event.target.value = '';
    }
  });
}

function init() {
  initStaticOptions();
  RANGE_BINDINGS.forEach(([inputId, outputId]) => bindRangeValue(inputId, outputId));
  loadInitialData();
  renderMoodOptions(stateRef().selectedMood);
  renderSubjectReflectionFields(document.getElementById('subject').value || '수학');
  hydratePreviousExperimentField();
  bindEvents();
  refreshViews();
  updateRoute(stateRef().route);
}

init();
