export const SUBJECT_OPTIONS = [
  '수학',
  '영어',
  '국어',
  '사회탐구',
  '과학탐구',
  '한국사',
  '제2외국어',
  '기타'
];

export const TASK_TYPE_OPTIONS = [
  '문제 풀이',
  '개념 정리',
  '오답 복습',
  '암기',
  '서술형 정리',
  '기타'
];

export const MOOD_OPTIONS = [
  '안정',
  '불안',
  '무기력',
  '회피',
  '피곤',
  '약간 몰입'
];

export const OBSTACLE_OPTIONS = [
  '피로',
  '휴대폰',
  '소음',
  '감정',
  '전략',
  '딴생각',
  '환경',
  '기타'
];

export const FEELING_OPTIONS = [
  '생각보다 괜찮음',
  '예상보다 힘듦',
  '망한 느낌',
  '무난함'
];

export const TYPE_LABELS = {
  overestimate: '과대평가형',
  underestimate: '과소평가형',
  start_barrier: '시작 장벽형',
  illusion_of_understanding: '이해 착각형',
  emotional_interference: '감정 간섭형',
  strategy_mismatch: '전략 부적합형',
  fatigue_stack: '피로 누적형',
  self_criticism: '자기비난 과잉형',
  stable: '비교적 안정형'
};

export const CAUSE_LABELS = {
  start_barrier: '시작 저항',
  emotional_interference: '감정 간섭',
  environment: '환경 간섭',
  fatigue: '피로',
  strategy: '전략 부적합',
  understanding: '이해 문제',
  self_criticism: '자기비난',
  stable: '뚜렷한 원인 없음'
};

export const DEMO_SESSIONS = [
  {
    id: 'demo_1',
    createdAt: '2026-04-15T09:10:00+09:00',
    subject: '수학',
    taskType: '문제 풀이',
    taskDetail: '수열 3점 기출 8문제',
    predictedAmount: 90,
    predictedFocus: 4,
    predictedUnderstanding: 4,
    startDifficulty: 5,
    moodBefore: '회피',
    midCheck: { used: true, focusDrop: true, stuck: true, wandering: true },
    actualAmount: 55,
    actualFocus: 2,
    actualUnderstanding: 2,
    interruptions: 4,
    mainObstacle: '피로',
    recallSummary: '점화식 유형은 보였지만 일반항으로 넘기는 기준이 헷갈렸다.',
    stuckPoint: '점화식 -> 일반항 변환',
    overallFeeling: '망한 느낌'
  },
  {
    id: 'demo_2',
    createdAt: '2026-04-16T20:00:00+09:00',
    subject: '국어',
    taskType: '개념 정리',
    taskDetail: '현대시 표현법 정리',
    predictedAmount: 50,
    predictedFocus: 2,
    predictedUnderstanding: 3,
    startDifficulty: 2,
    moodBefore: '무기력',
    midCheck: { used: false, focusDrop: false, stuck: false, wandering: false },
    actualAmount: 70,
    actualFocus: 4,
    actualUnderstanding: 4,
    interruptions: 1,
    mainObstacle: '기타',
    recallSummary: '역설과 반어의 구분 기준을 예시와 함께 설명할 수 있다.',
    stuckPoint: '없음',
    overallFeeling: '생각보다 괜찮음'
  },
  {
    id: 'demo_3',
    createdAt: '2026-04-17T18:30:00+09:00',
    subject: '영어',
    taskType: '암기',
    taskDetail: '단어 40개 복습',
    predictedAmount: 45,
    predictedFocus: 3,
    predictedUnderstanding: 5,
    startDifficulty: 3,
    moodBefore: '안정',
    midCheck: { used: true, focusDrop: false, stuck: false, wandering: true },
    actualAmount: 40,
    actualFocus: 3,
    actualUnderstanding: 4,
    interruptions: 2,
    mainObstacle: '딴생각',
    recallSummary: '뜻은 기억났지만 예문 없이 떠올리는 건 불안정했다.',
    stuckPoint: '동의어 구분',
    overallFeeling: '무난함'
  }
];
