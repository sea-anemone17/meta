import { SCHEMA_VERSION } from './storage.js';

function generateId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSession(startPayload) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    schemaVersion: SCHEMA_VERSION,
    timestamps: {
      createdAt: now,
      plannedStartAt: startPayload.plannedStartAt || '',
      actualStartAt: now,
      midCheckedAt: '',
      endedAt: ''
    },
    context: {
      subject: startPayload.subject,
      taskType: startPayload.taskType,
      taskDetail: startPayload.taskDetail,
      environment: {
        location: startPayload.location,
        phoneBlocked: startPayload.phoneBlocked,
        noiseLevel: startPayload.noiseLevel
      }
    },
    prediction: {
      predictedAmount: startPayload.predictedAmount,
      predictedFocus: startPayload.predictedFocus,
      predictedUnderstanding: startPayload.predictedUnderstanding,
      startDifficulty: startPayload.startDifficulty,
      confidenceFocus: startPayload.confidenceFocus,
      confidenceUnderstanding: startPayload.confidenceUnderstanding,
      moodBefore: startPayload.moodBefore
    },
    progress: {
      midCheck: {
        used: false,
        stuck: false,
        focusDrop: false,
        wandering: false,
        trigger: '',
        responseTaken: '그대로 진행'
      }
    },
    outcome: {
      actualAmount: 0,
      actualFocus: 3,
      actualUnderstanding: 3,
      interruptions: 0,
      mainObstacle: '없음',
      overallFeeling: '대체로 무난함'
    },
    recall: {
      conceptSummary: '',
      confusionPoint: '',
      nextStrategy: '',
      selfTestResult: 0,
      subjectReflection: {}
    },
    reflection: {
      selfCriticism: {
        blamedSelfFirst: 2,
        feltIncompetent: 2,
        distortedOutcome: 2
      },
      successFactor: ''
    },
    experiment: {
      planned: null,
      result: {
        helpful: '',
        note: ''
      }
    },
    analysis: null
  };
}

export function applyMidCheck(session, midPayload) {
  return {
    ...session,
    timestamps: {
      ...session.timestamps,
      midCheckedAt: new Date().toISOString()
    },
    progress: {
      ...session.progress,
      midCheck: {
        used: true,
        stuck: midPayload.stuck,
        focusDrop: midPayload.focusDrop,
        wandering: midPayload.wandering,
        trigger: midPayload.trigger,
        responseTaken: midPayload.responseTaken
      }
    }
  };
}

export function completeSession(session, endPayload, analysis, plannedExperiment, previousExperimentUpdate = null) {
  const completed = {
    ...session,
    timestamps: {
      ...session.timestamps,
      endedAt: new Date().toISOString()
    },
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
    },
    experiment: {
      ...session.experiment,
      planned: plannedExperiment || null
    },
    analysis
  };

  return {
    completed,
    previousExperimentUpdate
  };
}
