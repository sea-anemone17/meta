import { CAUSE_LABELS, TYPE_LABELS } from './data.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function countRecentByKey(items, key) {
  return items.reduce((acc, item) => {
    const bucket = item[key];
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getRecallReliability(session) {
  const summaryLength = session.recallSummary.trim().length;
  const stuckLength = session.stuckPoint.trim().length;
  const reliability = clamp(
    (summaryLength >= 35 ? 55 : summaryLength >= 20 ? 40 : summaryLength >= 10 ? 25 : 10) +
    (stuckLength >= 8 ? 25 : stuckLength >= 3 ? 15 : 5),
    0,
    100
  );
  return reliability;
}

function detectPrimaryCause(session, metrics) {
  const obstacle = session.mainObstacle;
  if (session.startDifficulty >= 4 && metrics.amountDeltaRatio <= -0.25) {
    return 'start_barrier';
  }
  if (['불안', '회피', '무기력'].includes(session.moodBefore) && session.actualFocus <= 2) {
    return 'emotional_interference';
  }
  if (['휴대폰', '소음', '환경', '딴생각'].includes(obstacle) || session.interruptions >= 4) {
    return 'environment';
  }
  if (obstacle === '피로' || (session.moodBefore === '피곤' && session.actualFocus <= 3)) {
    return 'fatigue';
  }
  if (metrics.recallReliability < 45 && session.actualUnderstanding >= 4) {
    return 'understanding';
  }
  if (session.actualAmount >= session.predictedAmount * 0.8 && session.actualUnderstanding <= 2) {
    return 'strategy';
  }
  if (session.overallFeeling === '망한 느낌' && metrics.selfCriticismRisk >= 70) {
    return 'self_criticism';
  }
  return 'stable';
}

function detectTypes(session, metrics, primaryCause) {
  const types = [];

  if (metrics.amountDeltaRatio <= -0.3 || (session.predictedFocus - session.actualFocus) >= 2) {
    types.push('overestimate');
  }
  if (metrics.amountDeltaRatio >= 0.2 || (session.actualFocus - session.predictedFocus) >= 2) {
    types.push('underestimate');
  }
  if (primaryCause === 'start_barrier') {
    types.push('start_barrier');
  }
  if (session.actualUnderstanding >= 4 && metrics.recallReliability < 50) {
    types.push('illusion_of_understanding');
  }
  if (primaryCause === 'emotional_interference') {
    types.push('emotional_interference');
  }
  if (primaryCause === 'strategy') {
    types.push('strategy_mismatch');
  }
  if (primaryCause === 'fatigue') {
    types.push('fatigue_stack');
  }
  if (metrics.selfCriticismRisk >= 70) {
    types.push('self_criticism');
  }

  if (!types.length) {
    types.push('stable');
  }

  return [...new Set(types)];
}

function buildInsightText(session, analysis) {
  const lines = [];
  if (analysis.types.includes('underestimate')) {
    lines.push('체감보다 실제 수행은 더 나쁘지 않았습니다. 자신을 자동으로 낮게 판단했을 가능성이 큽니다.');
  }
  if (analysis.types.includes('overestimate')) {
    lines.push('시작 전 예상이 실제보다 높았습니다. 목표량보다 진입 비용 조정이 먼저 필요해 보입니다.');
  }
  if (analysis.types.includes('illusion_of_understanding')) {
    lines.push('이해 체감에 비해 설명 가능성이 낮습니다. 읽기보다 말하기/써 보기로 점검하는 편이 좋습니다.');
  }
  if (analysis.types.includes('self_criticism')) {
    lines.push('실제 수행 대비 자기평가가 과도하게 낮습니다. 오늘의 문제는 무능보다 해석의 방향일 수 있습니다.');
  }

  if (!lines.length) {
    lines.push('이번 세션은 비교적 안정적이었습니다. 다음에는 같은 구조를 반복해도 괜찮습니다.');
  }

  const nextAdjustment =
    analysis.primaryCause === 'start_barrier' ? '다음 세션은 목표량을 줄이고 10~15분 진입 세션으로 시작해 보세요.' :
    analysis.primaryCause === 'emotional_interference' ? '세션 전 감정 상태를 먼저 정리하고, 낮은 강도의 과제로 진입해 보세요.' :
    analysis.primaryCause === 'environment' ? '휴대폰/소음 차단 같은 외부 환경 조정을 먼저 하세요.' :
    analysis.primaryCause === 'fatigue' ? '오늘은 강한 밀어붙이기보다 회복과 짧은 집중 블록이 더 적합합니다.' :
    analysis.primaryCause === 'strategy' ? '양을 늘리기보다 설명형 복습이나 예제 비교 같은 전략 변경이 필요합니다.' :
    analysis.primaryCause === 'understanding' ? '이해감을 믿기보다 인출 테스트를 먼저 해 보세요.' :
    analysis.primaryCause === 'self_criticism' ? '결과를 먼저 보고 감정을 해석하는 순서로 바꿔 보세요.' :
    '지금의 리듬을 유지하되, 설명 가능성 점검을 1번씩 넣어 주세요.';

  return {
    summary: lines[0],
    details: lines,
    nextAdjustment
  };
}

export function analyzeSession(session) {
  const amountDelta = session.actualAmount - session.predictedAmount;
  const amountDeltaRatio = session.predictedAmount ? amountDelta / session.predictedAmount : 0;
  const focusDelta = session.actualFocus - session.predictedFocus;
  const understandingDelta = session.actualUnderstanding - session.predictedUnderstanding;
  const recallReliability = getRecallReliability(session);

  const calibrationScore = Math.round(
    clamp(
      100 - (Math.abs(amountDeltaRatio) * 50 + Math.abs(focusDelta) * 10 + Math.abs(understandingDelta) * 10),
      0,
      100
    )
  );

  const startBarrierIndex = Math.round(clamp((session.startDifficulty / 5) * 100, 0, 100));
  const selfCriticismRisk = Math.round(
    clamp(
      (session.overallFeeling === '망한 느낌' ? 45 : session.overallFeeling === '예상보다 힘듦' ? 20 : 0) +
      (amountDeltaRatio >= -0.1 ? 20 : 0) +
      (session.actualFocus >= session.predictedFocus ? 15 : 0) +
      (session.actualUnderstanding >= session.predictedUnderstanding ? 15 : 0),
      0,
      100
    )
  );

  const primaryCause = detectPrimaryCause(session, {
    amountDeltaRatio,
    selfCriticismRisk,
    recallReliability
  });

  const types = detectTypes(session, {
    amountDeltaRatio,
    recallReliability,
    selfCriticismRisk
  }, primaryCause);

  const insight = buildInsightText(session, {
    types,
    primaryCause
  });

  return {
    amountDelta,
    amountDeltaRatio,
    focusDelta,
    understandingDelta,
    recallReliability,
    calibrationScore,
    startBarrierIndex,
    selfCriticismRisk,
    primaryCause,
    primaryCauseLabel: CAUSE_LABELS[primaryCause],
    types,
    typeLabels: types.map((type) => TYPE_LABELS[type]),
    insight
  };
}

export function buildPatternReport(sessions) {
  const recent = sessions.slice(-7);
  if (!recent.length) {
    return {
      recent,
      averageCalibration: 0,
      averageBarrier: 0,
      averageRecall: 0,
      averageSelfCriticism: 0,
      typeCount: {},
      causeCount: {},
      subjectStats: {},
      topType: 'stable',
      topCause: 'stable'
    };
  }

  const averageCalibration = Math.round(average(recent.map((item) => item.analysis.calibrationScore)));
  const averageBarrier = Math.round(average(recent.map((item) => item.analysis.startBarrierIndex)));
  const averageRecall = Math.round(average(recent.map((item) => item.analysis.recallReliability)));
  const averageSelfCriticism = Math.round(average(recent.map((item) => item.analysis.selfCriticismRisk)));

  const expandedTypes = recent.flatMap((item) => item.analysis.types.map((type) => ({ type })));
  const typeCount = countRecentByKey(expandedTypes, 'type');
  const causeCount = countRecentByKey(recent.map((item) => ({ cause: item.analysis.primaryCause })), 'cause');

  const subjectStats = recent.reduce((acc, session) => {
    const bucket = acc[session.subject] || {
      count: 0,
      calibration: 0,
      selfCriticism: 0,
      barrier: 0,
      mainTypes: []
    };
    bucket.count += 1;
    bucket.calibration += session.analysis.calibrationScore;
    bucket.selfCriticism += session.analysis.selfCriticismRisk;
    bucket.barrier += session.analysis.startBarrierIndex;
    bucket.mainTypes.push(...session.analysis.types);
    acc[session.subject] = bucket;
    return acc;
  }, {});

  Object.values(subjectStats).forEach((entry) => {
    entry.calibration = Math.round(entry.calibration / entry.count);
    entry.selfCriticism = Math.round(entry.selfCriticism / entry.count);
    entry.barrier = Math.round(entry.barrier / entry.count);
    const localCount = entry.mainTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    entry.topType = Object.entries(localCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'stable';
  });

  const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'stable';
  const topCause = Object.entries(causeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'stable';

  return {
    recent,
    averageCalibration,
    averageBarrier,
    averageRecall,
    averageSelfCriticism,
    typeCount,
    causeCount,
    subjectStats,
    topType,
    topCause
  };
}

export function getDashboardWarnings(report, latestSession) {
  const warnings = [];
  if (!report.recent.length) {
    return ['아직 기록이 없습니다. 세션을 한 번 완료하면 자기판단의 오차를 읽을 수 있습니다.'];
  }
  if (report.averageSelfCriticism >= 60) {
    warnings.push('최근 실제 수행보다 자기평가가 더 낮은 경향이 있습니다. 감정이 결과 해석을 덮고 있을 수 있습니다.');
  }
  if (report.averageBarrier >= 65) {
    warnings.push('최근 시작 난이도가 높습니다. 양을 늘리기보다 진입 비용을 줄이는 전략이 먼저 필요합니다.');
  }
  if (report.averageRecall < 50) {
    warnings.push('이해 체감에 비해 설명 가능성이 낮습니다. 인출 점검이 부족할 수 있습니다.');
  }
  if (latestSession?.analysis.types.includes('overestimate')) {
    warnings.push('가장 최근 세션은 예상이 실제보다 컸습니다. 목표량 조정이 필요해 보입니다.');
  }
  if (latestSession?.analysis.types.includes('underestimate')) {
    warnings.push('가장 최근 세션은 체감보다 실제 수행이 괜찮았습니다. 자동 자기비판 가능성을 체크해 보세요.');
  }
  return warnings.slice(0, 4);
}

export function getRecommendedActions(report) {
  if (!report.recent.length) return ['첫 기록을 남기고, 예상과 실제를 비교해 보세요.'];
  const actions = [];
  if (report.topCause === 'start_barrier') {
    actions.push('오늘은 큰 목표보다 10~15분 진입 세션으로 시작해 보세요.');
  }
  if (report.topCause === 'self_criticism') {
    actions.push('세션 후에는 먼저 결과 수치를 보고, 그 다음 감정을 해석해 보세요.');
  }
  if (report.averageRecall < 55) {
    actions.push('읽기 대신 설명형 복습 1회를 넣어 이해 착각을 줄여 보세요.');
  }
  if (report.averageCalibration < 55) {
    actions.push('예상 공부량을 보수적으로 잡아 예측 정확도를 먼저 회복하세요.');
  }
  if (!actions.length) {
    actions.push('현재 구조는 비교적 안정적입니다. 같은 리듬을 유지해도 좋습니다.');
  }
  return actions;
}

export { TYPE_LABELS, CAUSE_LABELS };
