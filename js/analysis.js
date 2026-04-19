import { CAUSE_DESCRIPTIONS, CAUSE_LABELS, EXPERIMENT_OPTIONS, TYPE_LABELS } from './data.js';
import { clamp } from './validation.js';

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value) {
  return Math.round(value);
}

function normalizeScaleFive(value) {
  return clamp(((value - 1) / 4) * 100, 0, 100);
}

function getStartDelayMinutes(session) {
  const planned = session.timestamps.plannedStartAt;
  const actual = session.timestamps.actualStartAt;
  if (!planned || !actual) return 0;
  const diff = (new Date(actual).getTime() - new Date(planned).getTime()) / 60000;
  return Math.max(0, round(diff));
}

function getPredictionMetrics(session) {
  const amountDelta = session.outcome.actualAmount - session.prediction.predictedAmount;
  const amountRatio = session.prediction.predictedAmount > 0 ? amountDelta / session.prediction.predictedAmount : 0;
  const focusDelta = session.outcome.actualFocus - session.prediction.predictedFocus;
  const understandingDelta = session.outcome.actualUnderstanding - session.prediction.predictedUnderstanding;

  const amountAccuracy = 100 - clamp(Math.abs(amountRatio) * 100, 0, 100);
  const focusAccuracy = 100 - clamp(Math.abs(focusDelta) * 25, 0, 100);
  const understandingAccuracy = 100 - clamp(Math.abs(understandingDelta) * 25, 0, 100);

  return {
    amountDelta,
    amountRatio,
    focusDelta,
    understandingDelta,
    amountAccuracy: round(amountAccuracy),
    focusAccuracy: round(focusAccuracy),
    understandingAccuracy: round(understandingAccuracy),
    calibrationScore: round((amountAccuracy + focusAccuracy + understandingAccuracy) / 3)
  };
}

function getRecallMetrics(session) {
  const summaryLength = session.recall.conceptSummary.trim().length;
  const confusionLength = session.recall.confusionPoint.trim().length;
  const strategyLength = session.recall.nextStrategy.trim().length;
  const selfTest = session.recall.selfTestResult;
  const subjectValues = Object.values(session.recall.subjectReflection || {});
  const subjectEvidence = subjectValues.filter(Boolean).length;

  const summarySpecificity = summaryLength >= 35 ? 90 : summaryLength >= 22 ? 72 : summaryLength >= 10 ? 48 : 18;
  const confusionClarity = confusionLength >= 18 ? 88 : confusionLength >= 8 ? 65 : confusionLength >= 3 ? 40 : 15;
  const strategyClarity = strategyLength >= 18 ? 88 : strategyLength >= 8 ? 64 : strategyLength >= 3 ? 40 : 15;
  const retrievalEvidence = clamp(selfTest * 35 + subjectEvidence * 10, 0, 100);

  return {
    summarySpecificity,
    confusionClarity,
    strategyClarity,
    retrievalEvidence,
    recallQuality: round((summarySpecificity + confusionClarity + strategyClarity + retrievalEvidence) / 4)
  };
}

function getSelfCriticismRisk(session, predictionMetrics) {
  const values = session.reflection.selfCriticism;
  let score = round(average([
    normalizeScaleFive(values.blamedSelfFirst),
    normalizeScaleFive(values.feltIncompetent),
    normalizeScaleFive(values.distortedOutcome)
  ]));

  if (session.outcome.overallFeeling === '거의 무너짐' && predictionMetrics.amountAccuracy >= 55) {
    score = clamp(score + 8, 0, 100);
  }
  return score;
}

function getStartBarrierIndex(session) {
  const delay = getStartDelayMinutes(session);
  const base = normalizeScaleFive(session.prediction.startDifficulty);
  const delayScore = clamp(delay * 3, 0, 100);
  const mid = session.progress.midCheck;
  const earlyDropBonus = mid.used && (mid.focusDrop || mid.wandering) ? 15 : 0;
  const wanderingBonus = mid.wandering ? 12 : 0;
  return round(clamp(base * 0.55 + delayScore * 0.25 + earlyDropBonus + wanderingBonus, 0, 100));
}

function scoreCauses(session, metrics) {
  const causes = {
    start_barrier: 0,
    fatigue: 0,
    environment: 0,
    emotional_interference: 0,
    understanding: 0,
    strategy: 0,
    self_criticism: 0,
    stable: 0
  };

  const mood = session.prediction.moodBefore;
  const obstacle = session.outcome.mainObstacle;
  const mid = session.progress.midCheck;

  causes.start_barrier += session.prediction.startDifficulty >= 4 ? 32 : session.prediction.startDifficulty === 3 ? 15 : 4;
  causes.start_barrier += getStartDelayMinutes(session) >= 10 ? 25 : getStartDelayMinutes(session) >= 5 ? 12 : 0;
  causes.start_barrier += metrics.amountRatio <= -0.25 ? 18 : 0;

  causes.fatigue += obstacle === '피로' ? 35 : 0;
  causes.fatigue += session.outcome.actualFocus <= 2 ? 18 : 0;
  causes.fatigue += mid.focusDrop ? 18 : 0;
  causes.fatigue += session.outcome.interruptions >= 4 ? 8 : 0;

  causes.environment += ['휴대폰', '소음/환경', '딴생각'].includes(obstacle) ? 35 : 0;
  causes.environment += !session.context.environment.phoneBlocked ? 10 : 0;
  causes.environment += session.context.environment.noiseLevel >= 4 ? 10 : 0;
  causes.environment += mid.wandering ? 18 : 0;

  causes.emotional_interference += ['불안', '무기력', '회피', '압박감'].includes(mood) ? 24 : 0;
  causes.emotional_interference += obstacle === '감정' ? 35 : 0;
  causes.emotional_interference += session.outcome.actualFocus <= 2 && ['불안', '회피'].includes(mood) ? 16 : 0;

  causes.understanding += metrics.understandingDelta <= -1 ? 18 : 0;
  causes.understanding += metrics.recall.recallQuality <= 45 ? 30 : metrics.recall.recallQuality <= 65 ? 16 : 0;
  causes.understanding += session.recall.selfTestResult === 0 ? 18 : 0;
  causes.understanding += obstacle === '개념 부족' ? 22 : 0;

  causes.strategy += obstacle === '전략 부적합' ? 35 : 0;
  causes.strategy += metrics.amountRatio <= -0.3 ? 16 : 0;
  causes.strategy += mid.used && mid.stuck ? 12 : 0;
  causes.strategy += session.outcome.actualUnderstanding >= 3 && session.outcome.actualAmount < session.prediction.predictedAmount * 0.7 ? 12 : 0;

  causes.self_criticism += metrics.selfCriticismRisk >= 65 ? 35 : metrics.selfCriticismRisk >= 45 ? 18 : 0;
  causes.self_criticism += session.outcome.overallFeeling === '거의 무너짐' && metrics.calibrationScore >= 55 ? 16 : 0;

  if (metrics.calibrationScore >= 70 && metrics.recall.recallQuality >= 65 && metrics.selfCriticismRisk < 40) {
    causes.stable = 55;
  }

  return Object.entries(causes)
    .map(([key, score]) => ({ key, score: clamp(round(score), 0, 100), label: CAUSE_LABELS[key] }))
    .sort((a, b) => b.score - a.score);
}

function detectTypes(session, metrics, causes) {
  const types = [];
  if (metrics.amountRatio <= -0.2 || metrics.focusDelta <= -1) types.push('optimistic_planning');
  if (metrics.startBarrierIndex >= 55) types.push('shaky_entry');
  if (metrics.recall.recallQuality <= 55) types.push('shallow_understanding');
  if (metrics.selfCriticismRisk >= 55) types.push('harsh_interpretation');
  if (causes.some((cause) => cause.key === 'environment' && cause.score >= 30)) types.push('distraction_prone');
  if (!types.length && metrics.calibrationScore >= 70) types.push('stable');
  if (!types.length) types.push('recovering');
  return types.slice(0, 3);
}

function buildInsight(session, metrics, causes, types) {
  const topCause = causes[0];
  const summary = `${CAUSE_DESCRIPTIONS[topCause.key]} 최근 세션에서는 ${topCause.label}이(가) 가장 크게 보였고, ${types.map((type) => TYPE_LABELS[type]).join(', ')} 경향이 함께 나타났습니다.`;

  let nextAdjustment = '다음 세션에서는 목표량보다 시작 구조를 먼저 조정해 보세요.';
  if (topCause.key === 'understanding') nextAdjustment = '다음 세션에서는 읽기보다 먼저 인출하거나, 풀이 이유를 소리 내 설명해 보세요.';
  if (topCause.key === 'environment') nextAdjustment = '다음 세션에서는 휴대폰 차단과 소음 통제를 먼저 하고 들어가 보세요.';
  if (topCause.key === 'strategy') nextAdjustment = '다음 세션에서는 같은 양을 밀기보다 쉬운 진입 + 작은 목표로 실험해 보세요.';
  if (topCause.key === 'self_criticism') nextAdjustment = '결과 해석과 자기평가를 분리해서 기록해 보세요. 먼저 사실, 그다음 해석 순서로 적는 편이 좋습니다.';

  return {
    summary,
    nextAdjustment,
    causesText: causes.slice(0, 3).map((cause) => `${cause.label} ${cause.score}`).join(' · ')
  };
}

function recommendExperiments(causes) {
  const topCauseKeys = causes.slice(0, 2).map((cause) => cause.key);
  const recommended = EXPERIMENT_OPTIONS.filter((experiment) =>
    experiment.appliesTo.some((causeKey) => topCauseKeys.includes(causeKey))
  );
  const unique = [];
  const seen = new Set();
  for (const item of recommended) {
    if (!seen.has(item.key)) {
      seen.add(item.key);
      unique.push(item);
    }
  }
  return unique.slice(0, 3);
}

export function analyzeSession(session) {
  const predictionMetrics = getPredictionMetrics(session);
  const recall = getRecallMetrics(session);
  const selfCriticismRisk = getSelfCriticismRisk(session, predictionMetrics);
  const startBarrierIndex = getStartBarrierIndex(session);

  const metrics = {
    ...predictionMetrics,
    recall,
    selfCriticismRisk,
    startBarrierIndex
  };

  const causes = scoreCauses(session, metrics);
  const types = detectTypes(session, metrics, causes);
  const insight = buildInsight(session, metrics, causes, types);
  const recommendedExperiments = recommendExperiments(causes);

  return {
    metrics: {
      calibrationScore: metrics.calibrationScore,
      amountAccuracy: metrics.amountAccuracy,
      focusAccuracy: metrics.focusAccuracy,
      understandingAccuracy: metrics.understandingAccuracy,
      startBarrierIndex,
      recallQuality: recall.recallQuality,
      recallBreakdown: recall,
      selfCriticismRisk,
      delayMinutes: getStartDelayMinutes(session)
    },
    causes,
    types,
    typeLabels: types.map((type) => TYPE_LABELS[type]),
    insight,
    recommendedExperiments,
    generatedAt: new Date().toISOString()
  };
}

function countByKey(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

export function buildReport(sessions) {
  const recent = sessions.slice(-7);
  if (!recent.length) {
    return {
      recent: [],
      averageCalibration: 0,
      averageBarrier: 0,
      averageRecall: 0,
      averageSelfCriticism: 0,
      topCause: 'stable',
      topType: 'stable',
      causeCount: {},
      typeCount: {},
      subjectStats: {},
      experimentSummary: { best: [], recentEvaluated: 0 }
    };
  }

  const analyses = recent.map((session) => session.analysis).filter(Boolean);
  const averageCalibration = round(average(analyses.map((a) => a.metrics.calibrationScore)));
  const averageBarrier = round(average(analyses.map((a) => a.metrics.startBarrierIndex)));
  const averageRecall = round(average(analyses.map((a) => a.metrics.recallQuality)));
  const averageSelfCriticism = round(average(analyses.map((a) => a.metrics.selfCriticismRisk)));

  const topCause = Object.entries(countByKey(analyses.map((a) => a.causes[0]?.key || 'stable'), 'length') && analyses.reduce((acc, analysis) => {
    const key = analysis.causes[0]?.key || 'stable';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || 'stable';

  const topType = Object.entries(analyses.reduce((acc, analysis) => {
    const key = analysis.types[0] || 'stable';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || 'stable';

  const causeCount = analyses.reduce((acc, analysis) => {
    const key = analysis.causes[0]?.key || 'stable';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const typeCount = analyses.reduce((acc, analysis) => {
    const key = analysis.types[0] || 'stable';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const subjectStats = recent.reduce((acc, session) => {
    const subject = session.context.subject;
    acc[subject] ||= { rows: [] };
    acc[subject].rows.push(session.analysis);
    return acc;
  }, {});

  Object.keys(subjectStats).forEach((subject) => {
    const rows = subjectStats[subject].rows;
    subjectStats[subject] = {
      calibration: round(average(rows.map((row) => row.metrics.calibrationScore))),
      barrier: round(average(rows.map((row) => row.metrics.startBarrierIndex))),
      selfCriticism: round(average(rows.map((row) => row.metrics.selfCriticismRisk))),
      topType: rows[0]?.types?.[0] || 'stable'
    };
  });

  const experimentEvaluated = sessions
    .filter((session) => session.experiment?.result?.helpful)
    .map((session) => ({
      label: session.experiment?.planned?.label || '미지정',
      helpful: session.experiment.result.helpful
    }));

  const scoredExperiments = experimentEvaluated.reduce((acc, item) => {
    const value = item.helpful === 'very_helpful' ? 2 : item.helpful === 'helpful' ? 1 : item.helpful === 'neutral' ? 0 : -1;
    acc[item.label] ||= { score: 0, count: 0 };
    acc[item.label].score += value;
    acc[item.label].count += 1;
    return acc;
  }, {});

  const best = Object.entries(scoredExperiments)
    .map(([label, data]) => ({ label, avg: round((data.score / data.count) * 10) / 10, count: data.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);

  return {
    recent,
    averageCalibration,
    averageBarrier,
    averageRecall,
    averageSelfCriticism,
    topCause,
    topType,
    causeCount,
    typeCount,
    subjectStats,
    experimentSummary: {
      best,
      recentEvaluated: experimentEvaluated.length
    }
  };
}
