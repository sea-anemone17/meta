// js/prompt-builder.js

function safe(value, fallback = "없음") {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

function getSubjectStats(report, subject) {
  if (!report?.subjectStats || !subject) return null;
  return report.subjectStats[subject] ?? null;
}

function getTopExperimentLabel(report) {
  const best = report?.experimentSummary?.best;
  if (!Array.isArray(best) || best.length === 0) return "없음";
  return best[0]?.label ?? "없음";
}

function mapCauseLabel(key) {
  const labels = {
    stable: "안정",
    start_barrier: "시작 장벽",
    calibration_gap: "예측 오차",
    low_recall: "회상 부족",
    self_criticism: "자기비난",
    interruption: "방해 많음",
    overload: "과부하",
  };
  return labels[key] ?? safe(key);
}

function mapTypeLabel(key) {
  const labels = {
    stable: "안정형",
    overpredict: "과대예측형",
    underpredict: "과소예측형",
    fragile_start: "시작 취약형",
    shaky_focus: "집중 흔들림형",
    low_recall: "회상 취약형",
    self_blame: "자기비난형",
  };
  return labels[key] ?? safe(key);
}

export function buildPromptContext(session, report) {
  if (!session) return null;

  const subject = safe(session?.context?.subject);
  const taskType = safe(session?.context?.taskType);
  const taskDetail = safe(session?.context?.taskDetail);
  const moodBefore = safe(session?.prediction?.moodBefore);
  const predictedAmount = safe(session?.prediction?.predictedAmount);
  const predictedFocus = safe(session?.prediction?.predictedFocus);
  const predictedUnderstanding = safe(session?.prediction?.predictedUnderstanding);
  const confidenceFocus = safe(session?.prediction?.confidenceFocus);
  const confidenceUnderstanding = safe(session?.prediction?.confidenceUnderstanding);
  const startDifficulty = safe(session?.prediction?.startDifficulty);

  const actualAmount = safe(session?.outcome?.actualAmount);
  const actualFocus = safe(session?.outcome?.actualFocus);
  const actualUnderstanding = safe(session?.outcome?.actualUnderstanding);
  const overallFeeling = safe(session?.outcome?.overallFeeling);
  const interruptions = safe(session?.outcome?.interruptions);
  const mainObstacle = safe(session?.outcome?.mainObstacle);

  const conceptSummary = safe(session?.recall?.conceptSummary);
  const confusionPoint = safe(session?.recall?.confusionPoint);
  const nextStrategy = safe(session?.recall?.nextStrategy);
  const selfTestResult = safe(session?.recall?.selfTestResult);

  const blamedSelfFirst = safe(session?.reflection?.selfCriticism?.blamedSelfFirst);
  const feltIncompetent = safe(session?.reflection?.selfCriticism?.feltIncompetent);
  const distortedOutcome = safe(session?.reflection?.selfCriticism?.distortedOutcome);
  const successFactor = safe(session?.reflection?.successFactor);

  const usedMidCheck = session?.progress?.midCheck?.used ? "예" : "아니오";
  const stuck = session?.progress?.midCheck?.stuck ? "있음" : "없음";
  const focusDrop = session?.progress?.midCheck?.focusDrop ? "있음" : "없음";
  const wandering = session?.progress?.midCheck?.wandering ? "있음" : "없음";
  const trigger = safe(session?.progress?.midCheck?.trigger);
  const responseTaken = safe(session?.progress?.midCheck?.responseTaken);

  const subjectStats = getSubjectStats(report, subject);

  return {
    today: {
      subject,
      taskType,
      taskDetail,
      moodBefore,
      predictedAmount,
      predictedFocus,
      predictedUnderstanding,
      confidenceFocus,
      confidenceUnderstanding,
      startDifficulty,
      actualAmount,
      actualFocus,
      actualUnderstanding,
      overallFeeling,
      interruptions,
      mainObstacle,
    },
    progress: {
      usedMidCheck,
      stuck,
      focusDrop,
      wandering,
      trigger,
      responseTaken,
    },
    recall: {
      conceptSummary,
      confusionPoint,
      nextStrategy,
      selfTestResult,
    },
    reflection: {
      blamedSelfFirst,
      feltIncompetent,
      distortedOutcome,
      successFactor,
    },
    trends: {
      topCause: mapCauseLabel(report?.topCause),
      topType: mapTypeLabel(report?.topType),
      bestExperiment: getTopExperimentLabel(report),
      averageCalibration: report?.averageCalibration ?? null,
      averageBarrier: report?.averageBarrier ?? null,
      averageRecall: report?.averageRecall ?? null,
      averageSelfCriticism: report?.averageSelfCriticism ?? null,
    },
    subjectStats: subjectStats
      ? {
          calibration: subjectStats.calibration ?? null,
          barrier: subjectStats.barrier ?? null,
          selfCriticism: subjectStats.selfCriticism ?? null,
          topType: mapTypeLabel(subjectStats.topType),
        }
      : null,
  };
}

export function buildRoutinePrompt(context) {
  if (!context) return "먼저 세션을 하나 기록해 주세요.";

  const { today, trends, subjectStats } = context;

  return `
나는 고등학생이고, 공부 실행과 자기평가 왜곡을 줄이기 위해 메타인지 기록 앱을 사용하고 있다.

[오늘 상태]
- 과목: ${today.subject}
- 작업 유형: ${today.taskType}
- 할 일: ${today.taskDetail}
- 시작 전 기분: ${today.moodBefore}
- 예상 공부량: ${today.predictedAmount}
- 예상 집중도: ${today.predictedFocus}/5
- 예상 이해도: ${today.predictedUnderstanding}/5
- 집중 예측 확신도: ${today.confidenceFocus}/5
- 이해 예측 확신도: ${today.confidenceUnderstanding}/5
- 시작 난이도: ${today.startDifficulty}/5

[최근 패턴]
- 최근 대표 원인: ${trends.topCause}
- 최근 대표 경향: ${trends.topType}
- 최근 평균 예측 정확도: ${Math.round(trends.averageCalibration ?? 0)}/100
- 최근 평균 시작 장벽: ${Math.round(trends.averageBarrier ?? 0)}/100
- 최근 평균 회상 품질: ${Math.round(trends.averageRecall ?? 0)}/100
- 최근 평균 자기비난 위험: ${Math.round(trends.averageSelfCriticism ?? 0)}/100
- 최근 가장 잘 맞았던 실험: ${trends.bestExperiment}

[현재 과목의 누적 경향]
- 과목별 예측 정확도: ${Math.round(subjectStats?.calibration ?? 0)}/100
- 과목별 시작 장벽: ${Math.round(subjectStats?.barrier ?? 0)}/100
- 과목별 자기비난 위험: ${Math.round(subjectStats?.selfCriticism ?? 0)}/100
- 과목별 대표 경향: ${safe(subjectStats?.topType)}

[요청]
오늘 공부를 실제로 시작하고 유지할 수 있도록 블록형 루틴을 짜 줘.

[조건]
- 선택지를 너무 많이 주지 말 것
- 기본 루틴 1개, 비상 루틴 1개만 제시할 것
- 완벽한 계획보다 실패 확률이 낮은 계획을 우선할 것
- 각 블록은 너무 길지 않게 제안할 것
- 왜 이 루틴이 적절한지도 짧게 설명할 것
- 존댓말로 답할 것
  `.trim();
}

export function buildReflectionPrompt(context) {
  if (!context) return "먼저 세션을 하나 기록해 주세요.";

  const { today, progress, recall, reflection, trends } = context;

  return `
나는 고등학생이고, 공부 후 회고를 구조화하고 싶다. 아래 데이터를 바탕으로 오늘 학습을 분석해 줘.

[오늘 예측]
- 과목: ${today.subject}
- 할 일: ${today.taskDetail}
- 예상 공부량: ${today.predictedAmount}
- 예상 집중도: ${today.predictedFocus}/5
- 예상 이해도: ${today.predictedUnderstanding}/5
- 시작 난이도: ${today.startDifficulty}/5

[오늘 실제]
- 실제 공부량: ${today.actualAmount}
- 실제 집중도: ${today.actualFocus}/5
- 실제 이해도: ${today.actualUnderstanding}/5
- 방해 횟수: ${today.interruptions}
- 주요 장애물: ${today.mainObstacle}
- 전체 체감: ${today.overallFeeling}

[중간 체크]
- 사용 여부: ${progress.usedMidCheck}
- 막힘: ${progress.stuck}
- 집중 저하: ${progress.focusDrop}
- 딴생각: ${progress.wandering}
- 계기: ${progress.trigger}
- 취한 대응: ${progress.responseTaken}

[회상]
- 핵심 개념 요약: ${recall.conceptSummary}
- 헷갈리는 점: ${recall.confusionPoint}
- 다음 전략: ${recall.nextStrategy}
- 자가테스트 결과: ${recall.selfTestResult}

[자기 해석]
- 결과보다 나 자신을 먼저 탓함: ${reflection.blamedSelfFirst}/5
- 능력 부족처럼 느껴짐: ${reflection.feltIncompetent}/5
- 실제보다 더 망했다고 느낌: ${reflection.distortedOutcome}/5
- 오늘 잘된 이유: ${reflection.successFactor}

[최근 패턴]
- 최근 대표 원인: ${trends.topCause}
- 최근 대표 경향: ${trends.topType}

[요청]
오늘 학습을 짧고 구조적으로 회고해 줘.

[조건]
- 사실과 해석을 구분할 것
- 자기비난보다 전략 수정에 초점을 둘 것
- 마지막에 다음 세션 조정점 1개만 제시할 것
- 존댓말로 답할 것
  `.trim();
}

export function buildWeeklyPrompt(context) {
  if (!context) return "먼저 세션을 하나 기록해 주세요.";

  const { today, trends, subjectStats } = context;

  return `
나는 고등학생이고, 최근 공부 패턴을 바탕으로 다음 주 전략을 짜고 싶다.

[최근 전체 경향]
- 최근 대표 원인: ${trends.topCause}
- 최근 대표 경향: ${trends.topType}
- 최근 평균 예측 정확도: ${Math.round(trends.averageCalibration ?? 0)}/100
- 최근 평균 시작 장벽: ${Math.round(trends.averageBarrier ?? 0)}/100
- 최근 평균 회상 품질: ${Math.round(trends.averageRecall ?? 0)}/100
- 최근 평균 자기비난 위험: ${Math.round(trends.averageSelfCriticism ?? 0)}/100
- 최근 가장 잘 맞았던 실험: ${trends.bestExperiment}

[현재 주력 과목 참고]
- 과목: ${today.subject}
- 과목별 예측 정확도: ${Math.round(subjectStats?.calibration ?? 0)}/100
- 과목별 시작 장벽: ${Math.round(subjectStats?.barrier ?? 0)}/100
- 과목별 자기비난 위험: ${Math.round(subjectStats?.selfCriticism ?? 0)}/100
- 과목별 대표 경향: ${safe(subjectStats?.topType)}

[요청]
최근 공부 패턴을 분석하고, 다음 주에 적용할 전략을 제안해 줘.

[조건]
- 문제 진단 3개 이하
- 실행 전략은 우선순위가 높은 것부터
- 현실적인 루틴으로 제안할 것
- 존댓말로 답할 것
  `.trim();
}

export function buildSubjectStrategyPrompt(context) {
  if (!context) return "먼저 세션을 하나 기록해 주세요.";

  const { today, progress, recall, trends, subjectStats } = context;

  return `
나는 고등학생이고, 특정 과목에 맞는 공부 전략이 필요하다.

[현재 과목]
- 과목: ${today.subject}
- 작업 유형: ${today.taskType}
- 할 일: ${today.taskDetail}

[현재 세션 정보]
- 시작 난이도: ${today.startDifficulty}/5
- 예상 집중도: ${today.predictedFocus}/5
- 실제 집중도: ${today.actualFocus}/5
- 예상 이해도: ${today.predictedUnderstanding}/5
- 실제 이해도: ${today.actualUnderstanding}/5
- 주요 장애물: ${today.mainObstacle}

[중간/회상 정보]
- 막힘: ${progress.stuck}
- 집중 저하: ${progress.focusDrop}
- 헷갈리는 점: ${recall.confusionPoint}
- 다음 전략 초안: ${recall.nextStrategy}
- 자가테스트 결과: ${recall.selfTestResult}

[과목별 경향]
- 과목별 예측 정확도: ${Math.round(subjectStats?.calibration ?? 0)}/100
- 과목별 시작 장벽: ${Math.round(subjectStats?.barrier ?? 0)}/100
- 과목별 자기비난 위험: ${Math.round(subjectStats?.selfCriticism ?? 0)}/100
- 과목별 대표 경향: ${safe(subjectStats?.topType)}

[전체 참고]
- 최근 대표 원인: ${trends.topCause}
- 최근 대표 경향: ${trends.topType}

[요청]
${today.subject} 과목에 맞는 공부 전략을 제안해 줘.

[조건]
- 방법을 2~3개만 제시할 것
- 각 방법이 왜 이 과목에 맞는지 설명할 것
- 바로 적용 가능한 예시를 포함할 것
- 존댓말로 답할 것
  `.trim();
}

export function generatePrompt(mode, session, report) {
  const context = buildPromptContext(session, report);

  if (mode === 'routine') return buildRoutinePrompt(context);
  if (mode === 'reflection') return buildReflectionPrompt(context);
  if (mode === 'weekly') return buildWeeklyPrompt(context);
  if (mode === 'subject') return buildSubjectStrategyPrompt(context);

  return buildRoutinePrompt(context); // 기본값
}
