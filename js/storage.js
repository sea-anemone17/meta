const STORAGE_KEY = 'meta_experiment_store';
const CURRENT_SESSION_KEY = 'meta_experiment_current_session';
export const SCHEMA_VERSION = 3;

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function createStore(sessions = []) {
  return {
    schemaVersion: SCHEMA_VERSION,
    sessions
  };
}

function ensureSessionShape(session) {
  return {
    id: session.id || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    schemaVersion: SCHEMA_VERSION,
    timestamps: {
      createdAt: session.timestamps?.createdAt || session.createdAt || new Date().toISOString(),
      plannedStartAt: session.timestamps?.plannedStartAt || session.plannedStartAt || '',
      actualStartAt: session.timestamps?.actualStartAt || session.createdAt || new Date().toISOString(),
      midCheckedAt: session.timestamps?.midCheckedAt || '',
      endedAt: session.timestamps?.endedAt || ''
    },
    context: {
      subject: session.context?.subject || session.subject || '기타',
      taskType: session.context?.taskType || session.taskType || '복습',
      taskDetail: session.context?.taskDetail || session.taskDetail || '',
      environment: {
        location: session.context?.environment?.location || session.location || '기타',
        phoneBlocked: Boolean(session.context?.environment?.phoneBlocked ?? session.phoneBlocked),
        noiseLevel: Number(session.context?.environment?.noiseLevel ?? session.noiseLevel ?? 2)
      }
    },
    prediction: {
      predictedAmount: Number(session.prediction?.predictedAmount ?? session.predictedAmount ?? 0),
      predictedFocus: Number(session.prediction?.predictedFocus ?? session.predictedFocus ?? 3),
      predictedUnderstanding: Number(session.prediction?.predictedUnderstanding ?? session.predictedUnderstanding ?? 3),
      startDifficulty: Number(session.prediction?.startDifficulty ?? session.startDifficulty ?? 3),
      confidenceFocus: Number(session.prediction?.confidenceFocus ?? 3),
      confidenceUnderstanding: Number(session.prediction?.confidenceUnderstanding ?? 3),
      moodBefore: session.prediction?.moodBefore || session.moodBefore || '안정'
    },
    progress: {
      midCheck: {
        used: Boolean(session.progress?.midCheck?.used || session.midCheck?.used),
        stuck: Boolean(session.progress?.midCheck?.stuck || session.midCheck?.stuck),
        focusDrop: Boolean(session.progress?.midCheck?.focusDrop || session.midCheck?.focusDrop),
        wandering: Boolean(session.progress?.midCheck?.wandering || session.midCheck?.wandering),
        trigger: session.progress?.midCheck?.trigger || '',
        responseTaken: session.progress?.midCheck?.responseTaken || '그대로 진행'
      }
    },
    outcome: {
      actualAmount: Number(session.outcome?.actualAmount ?? session.actualAmount ?? 0),
      actualFocus: Number(session.outcome?.actualFocus ?? session.actualFocus ?? 3),
      actualUnderstanding: Number(session.outcome?.actualUnderstanding ?? session.actualUnderstanding ?? 3),
      interruptions: Number(session.outcome?.interruptions ?? session.interruptions ?? 0),
      mainObstacle: session.outcome?.mainObstacle || session.mainObstacle || '없음',
      overallFeeling: session.outcome?.overallFeeling || session.overallFeeling || '대체로 무난함'
    },
    recall: {
      conceptSummary: session.recall?.conceptSummary || session.recallSummary || '',
      confusionPoint: session.recall?.confusionPoint || session.stuckPoint || '',
      nextStrategy: session.recall?.nextStrategy || '',
      selfTestResult: Number(session.recall?.selfTestResult ?? 0),
      subjectReflection: session.recall?.subjectReflection || {}
    },
    reflection: {
      selfCriticism: {
        blamedSelfFirst: Number(session.reflection?.selfCriticism?.blamedSelfFirst ?? 2),
        feltIncompetent: Number(session.reflection?.selfCriticism?.feltIncompetent ?? 2),
        distortedOutcome: Number(session.reflection?.selfCriticism?.distortedOutcome ?? 2)
      },
      successFactor: session.reflection?.successFactor || ''
    },
    experiment: {
      planned: session.experiment?.planned || null,
      result: {
        helpful: session.experiment?.result?.helpful || '',
        note: session.experiment?.result?.note || ''
      }
    },
    analysis: session.analysis || null
  };
}

function migrateStore(raw) {
  if (!raw || typeof raw !== 'object') return createStore();
  const sessions = Array.isArray(raw.sessions) ? raw.sessions.map(ensureSessionShape) : [];
  return createStore(sessions);
}

export function loadStore() {
  const raw = safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
  const store = migrateStore(raw);
  saveStore(store);
  return store;
}

export function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(createStore(store.sessions || [])));
}

export function loadSessions() {
  return loadStore().sessions;
}

export function saveSessions(sessions) {
  saveStore(createStore(sessions.map(ensureSessionShape)));
}

export function loadCurrentSession() {
  const raw = safeJsonParse(localStorage.getItem(CURRENT_SESSION_KEY), null);
  if (!raw) return null;
  return ensureSessionShape(raw);
}

export function saveCurrentSession(session) {
  if (!session) {
    localStorage.removeItem(CURRENT_SESSION_KEY);
    return;
  }
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(ensureSessionShape(session)));
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

export function exportStore() {
  return loadStore();
}

export function importStore(data) {
  const migrated = migrateStore(data);
  saveStore(migrated);
  return migrated.sessions;
}
