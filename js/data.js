export const SUBJECT_OPTIONS = [
  '수학',
  '영어',
  '국어',
  '사회탐구',
  '과학탐구',
  '기타'
];

export const TASK_TYPE_OPTIONS = [
  '문제 풀이',
  '개념 정리',
  '암기',
  '복습',
  '오답 정리',
  '읽기/분석',
  '서술/작성'
];

export const MOOD_OPTIONS = ['안정', '불안', '무기력', '회피', '압박감', '산만'];

export const LOCATION_OPTIONS = ['집', '학교', '독서실', '카페', '이동 중', '기타'];

export const MID_RESPONSE_OPTIONS = [
  '그대로 진행',
  '쉬운 문제로 전환',
  '설명형 복습으로 전환',
  '5분 휴식',
  '환경 정리',
  '타이머 재설정'
];

export const MAIN_OBSTACLE_OPTIONS = [
  '개념 부족',
  '전략 부적합',
  '문제 해석',
  '휴대폰',
  '소음/환경',
  '피로',
  '감정',
  '딴생각',
  '없음'
];

export const OVERALL_FEELING_OPTIONS = [
  '예상보다 잘됨',
  '대체로 무난함',
  '생각보다 힘듦',
  '거의 무너짐'
];

export const SELF_TEST_OPTIONS = [
  { value: '0', label: '설명하지 못했다' },
  { value: '1', label: '대충 설명 가능하다' },
  { value: '2', label: '예시까지 만들 수 있다' }
];

export const EXPERIMENT_EFFECT_OPTIONS = [
  { value: '', label: '해당 없음 / 아직 평가 안 함' },
  { value: 'very_helpful', label: '매우 도움' },
  { value: 'helpful', label: '약간 도움' },
  { value: 'neutral', label: '무효' },
  { value: 'harmful', label: '오히려 악화' }
];

export const CAUSE_LABELS = {
  start_barrier: '시작 저항',
  fatigue: '피로/에너지 저하',
  environment: '환경/이탈',
  emotional_interference: '감정 간섭',
  understanding: '이해 검증 부족',
  strategy: '전략 부적합',
  self_criticism: '자기비난 해석',
  stable: '큰 붕괴 없음'
};

export const TYPE_LABELS = {
  optimistic_planning: '예상 과대 경향',
  shaky_entry: '초반 진입 불안정',
  shallow_understanding: '이해 확인 약함',
  harsh_interpretation: '결과 해석이 가혹함',
  distraction_prone: '환경 이탈 경향',
  recovering: '복구 중',
  stable: '비교적 안정적'
};

export const CAUSE_DESCRIPTIONS = {
  start_barrier: '예상은 있었지만 실제 시작까지의 저항이나 초반 이탈이 강했을 수 있습니다.',
  fatigue: '피로, 집중력 저하, 중간 붕괴가 함께 나타난 세션일 가능성이 높습니다.',
  environment: '휴대폰, 소음, 딴생각 같은 외부/내부 이탈 요인이 강하게 개입했을 수 있습니다.',
  emotional_interference: '불안, 압박감, 회피 감정이 실제 수행에 영향을 주었을 수 있습니다.',
  understanding: '이해도 체감에 비해 설명/예시/자가 테스트 근거가 부족할 수 있습니다.',
  strategy: '목표량, 접근 방식, 문제 진입 순서가 과제와 맞지 않았을 가능성이 있습니다.',
  self_criticism: '실제 성과보다 자기해석이 더 부정적으로 기울었을 가능성이 있습니다.',
  stable: '이번 세션은 큰 붕괴보다 비교적 안정적인 흐름에 가까웠습니다.'
};

export const EXPERIMENT_OPTIONS = [
  {
    key: 'reduce_goal',
    label: '목표량 30% 축소',
    description: '양을 줄여 진입 부담과 실패 체감을 낮춥니다.',
    appliesTo: ['start_barrier', 'fatigue', 'strategy']
  },
  {
    key: 'easy_entry',
    label: '처음 10분은 쉬운 문제로 진입',
    description: '초반 마찰을 줄여 시작 장벽을 낮춥니다.',
    appliesTo: ['start_barrier', 'emotional_interference', 'strategy']
  },
  {
    key: 'retrieval_first',
    label: '읽기 전에 인출 먼저 하기',
    description: '이해 착각을 줄이고 실제 기억 상태를 확인합니다.',
    appliesTo: ['understanding', 'strategy']
  },
  {
    key: 'explain_out_loud',
    label: '소리 내 설명 1회',
    description: '설명 가능성을 통해 이해를 검증합니다.',
    appliesTo: ['understanding', 'self_criticism']
  },
  {
    key: 'phone_block',
    label: '휴대폰 차단 후 시작',
    description: '환경 이탈 요인을 먼저 잘라 냅니다.',
    appliesTo: ['environment', 'start_barrier']
  },
  {
    key: 'micro_break',
    label: '25분 세션 + 5분 휴식',
    description: '피로 누적과 집중 붕괴를 완화합니다.',
    appliesTo: ['fatigue', 'environment']
  }
];

export const SUBJECT_REFLECTION_FIELDS = {
  수학: [
    {
      id: 'math-block-type',
      label: '막힌 이유',
      type: 'select',
      options: ['개념 부족', '식 전개/절차', '문제 해석', '발상 전환', '해당 없음']
    },
    {
      id: 'math-can-retry',
      label: '비슷한 문제를 혼자 다시 풀 수 있나요?',
      type: 'select',
      options: ['아니오', '부분적으로 가능', '대체로 가능']
    }
  ],
  영어: [
    {
      id: 'english-block-type',
      label: '막힌 이유',
      type: 'select',
      options: ['단어', '구문', '문맥', '인출 실패', '해당 없음']
    },
    {
      id: 'english-context-recall',
      label: '문맥에서 다시 떠올릴 수 있나요?',
      type: 'select',
      options: ['아니오', '부분적으로 가능', '대체로 가능']
    }
  ],
  국어: [
    {
      id: 'korean-block-type',
      label: '막힌 이유',
      type: 'select',
      options: ['개념 혼동', '근거 찾기', '비교/대조', '서술 정리', '해당 없음']
    },
    {
      id: 'korean-can-explain',
      label: '근거를 붙여 설명할 수 있나요?',
      type: 'select',
      options: ['아니오', '부분적으로 가능', '대체로 가능']
    }
  ],
  사회탐구: [
    {
      id: 'social-block-type',
      label: '막힌 이유',
      type: 'select',
      options: ['개념 혼동', '사례 적용', '암기 부족', '논리 연결', '해당 없음']
    },
    {
      id: 'social-can-compare',
      label: '비교/사례 연결이 가능한가요?',
      type: 'select',
      options: ['아니오', '부분적으로 가능', '대체로 가능']
    }
  ],
  과학탐구: [
    {
      id: 'science-block-type',
      label: '막힌 이유',
      type: 'select',
      options: ['개념 이해', '공식 적용', '자료 해석', '실수/계산', '해당 없음']
    },
    {
      id: 'science-can-transfer',
      label: '비슷한 상황에 적용할 수 있나요?',
      type: 'select',
      options: ['아니오', '부분적으로 가능', '대체로 가능']
    }
  ],
  기타: [
    {
      id: 'other-block-type',
      label: '막힌 이유',
      type: 'select',
      options: ['내용 이해', '암기/인출', '전략 문제', '환경 문제', '해당 없음']
    },
    {
      id: 'other-can-reuse',
      label: '다음에 다시 써먹을 수 있나요?',
      type: 'select',
      options: ['아니오', '부분적으로 가능', '대체로 가능']
    }
  ]
};

export const DEMO_SESSIONS = [
  {
    context: { subject: '수학', taskType: '문제 풀이', taskDetail: '수열 3점 기출 8문제', environment: { location: '집', phoneBlocked: false, noiseLevel: 2 } },
    prediction: { predictedAmount: 90, predictedFocus: 4, predictedUnderstanding: 4, startDifficulty: 4, confidenceFocus: 4, confidenceUnderstanding: 4, moodBefore: '불안' },
    timestamps: { plannedStartAt: '', actualStartAt: '', midCheckedAt: '', endedAt: '' },
    progress: { midCheck: { used: true, stuck: true, focusDrop: true, wandering: false, trigger: '3번 문제에서 막힘', responseTaken: '쉬운 문제로 전환' } },
    outcome: { actualAmount: 55, actualFocus: 2, actualUnderstanding: 3, interruptions: 3, mainObstacle: '전략 부적합', overallFeeling: '생각보다 힘듦' },
    recall: { conceptSummary: '점화식 구조는 보였지만 일반항 전환이 흔들렸다.', confusionPoint: '계차를 잡는 기준', nextStrategy: '처음 두 문제는 풀이 이유를 말로 설명하기', selfTestResult: 1, subjectReflection: { 'math-block-type': '발상 전환', 'math-can-retry': '부분적으로 가능' } },
    reflection: { selfCriticism: { blamedSelfFirst: 3, feltIncompetent: 3, distortedOutcome: 2 }, successFactor: '쉬운 문제로 옮기니 완전히 멈추지는 않았다' },
    experiment: { planned: { key: 'easy_entry', label: '처음 10분은 쉬운 문제로 진입' }, result: { helpful: 'helpful', note: '진입은 조금 편했다' } }
  },
  {
    context: { subject: '영어', taskType: '암기', taskDetail: '영단어 40개 회상', environment: { location: '이동 중', phoneBlocked: true, noiseLevel: 3 } },
    prediction: { predictedAmount: 40, predictedFocus: 3, predictedUnderstanding: 3, startDifficulty: 2, confidenceFocus: 3, confidenceUnderstanding: 2, moodBefore: '안정' },
    timestamps: { plannedStartAt: '', actualStartAt: '', midCheckedAt: '', endedAt: '' },
    progress: { midCheck: { used: true, stuck: false, focusDrop: false, wandering: true, trigger: '앉을 자리가 불편했음', responseTaken: '타이머 재설정' } },
    outcome: { actualAmount: 35, actualFocus: 3, actualUnderstanding: 2, interruptions: 4, mainObstacle: '딴생각', overallFeeling: '대체로 무난함' },
    recall: { conceptSummary: '뜻은 아는데 예문 문맥으로는 잘 안 떠오르는 단어가 있었다.', confusionPoint: '문맥에서 단어를 꺼내는 단계', nextStrategy: '뜻 회상 전에 예문 한 줄로 먼저 떠올리기', selfTestResult: 1, subjectReflection: { 'english-block-type': '인출 실패', 'english-context-recall': '부분적으로 가능' } },
    reflection: { selfCriticism: { blamedSelfFirst: 2, feltIncompetent: 2, distortedOutcome: 2 }, successFactor: '짧게 여러 번 본 단어는 잘 붙었다' },
    experiment: { planned: { key: 'retrieval_first', label: '읽기 전에 인출 먼저 하기' }, result: { helpful: 'very_helpful', note: '외운 것과 모르는 것이 빨리 갈렸다' } }
  }
];
