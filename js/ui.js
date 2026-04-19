import {
  CAUSE_LABELS,
  EXPERIMENT_EFFECT_OPTIONS,
  LOCATION_OPTIONS,
  MAIN_OBSTACLE_OPTIONS,
  MID_RESPONSE_OPTIONS,
  MOOD_OPTIONS,
  OVERALL_FEELING_OPTIONS,
  SELF_TEST_OPTIONS,
  SUBJECT_OPTIONS,
  SUBJECT_REFLECTION_FIELDS,
  TASK_TYPE_OPTIONS,
  TYPE_LABELS
} from './data.js';

function clear(node) {
  node.innerHTML = '';
}

function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function appendOptions(select, options) {
  clear(select);
  options.forEach((option) => {
    const element = document.createElement('option');
    if (typeof option === 'string') {
      element.value = option;
      element.textContent = option;
    } else {
      element.value = option.value;
      element.textContent = option.label;
    }
    select.appendChild(element);
  });
}

function progressHTML(value) {
  return `
    <div class="progress-row">
      <div class="progress-track"><div class="progress-fill" style="width:${value}%"></div></div>
      <div class="metric-value small">${value}</div>
    </div>
  `;
}

function makeInfoStrip(text, tone = '') {
  const item = el('div', `info-strip ${tone}`.trim());
  item.textContent = text;
  return item;
}

export function initStaticOptions() {
  appendOptions(document.getElementById('subject'), SUBJECT_OPTIONS);
  appendOptions(document.getElementById('task-type'), TASK_TYPE_OPTIONS);
  appendOptions(document.getElementById('location'), LOCATION_OPTIONS);
  appendOptions(document.getElementById('mid-response'), MID_RESPONSE_OPTIONS);
  appendOptions(document.getElementById('main-obstacle'), MAIN_OBSTACLE_OPTIONS);
  appendOptions(document.getElementById('overall-feeling'), OVERALL_FEELING_OPTIONS);
  appendOptions(document.getElementById('self-test-result'), SELF_TEST_OPTIONS);
  appendOptions(document.getElementById('previous-experiment-effect'), EXPERIMENT_EFFECT_OPTIONS);
}

export function bindRangeValue(inputId, outputId) {
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);
  if (!input || !output) return;
  const update = () => {
    output.textContent = input.value;
  };
  update();
  input.addEventListener('input', update);
}

export function renderMoodOptions(selectedMood) {
  const container = document.getElementById('mood-options');
  clear(container);
  MOOD_OPTIONS.forEach((mood) => {
    const button = el('button', `choice-chip ${selectedMood === mood ? 'active' : ''}`, mood);
    button.type = 'button';
    button.dataset.mood = mood;
    container.appendChild(button);
  });
}

export function renderSubjectReflectionFields(subject, savedValues = {}) {
  const container = document.getElementById('subject-reflection-fields');
  clear(container);
  const fields = SUBJECT_REFLECTION_FIELDS[subject] || SUBJECT_REFLECTION_FIELDS['기타'];
  fields.forEach((field) => {
    const label = el('label', 'span-2');
    label.textContent = field.label;
    const select = document.createElement('select');
    select.id = field.id;
    field.options.forEach((option) => {
      const element = document.createElement('option');
      element.value = option;
      element.textContent = option;
      if (savedValues[field.id] === option) element.selected = true;
      select.appendChild(element);
    });
    label.appendChild(select);
    container.appendChild(label);
  });
}

export function collectSubjectReflection(subject) {
  const fields = SUBJECT_REFLECTION_FIELDS[subject] || SUBJECT_REFLECTION_FIELDS['기타'];
  return fields.reduce((acc, field) => {
    const element = document.getElementById(field.id);
    if (element) acc[field.id] = element.value;
    return acc;
  }, {});
}

export function renderSidebarStatus(currentSession, report) {
  const container = document.getElementById('sidebar-status');
  clear(container);

  if (currentSession) {
    container.appendChild(makeInfoStrip(`${currentSession.context.subject} · ${currentSession.context.taskType}`, 'warn'));
    container.appendChild(makeInfoStrip(`진행 중: ${currentSession.context.taskDetail}`));
  } else {
    container.appendChild(makeInfoStrip('진행 중인 세션 없음'));
  }

  if (report?.recent?.length) {
    container.appendChild(makeInfoStrip(`최근 보정 정확도 ${report.averageCalibration}`));
    container.appendChild(makeInfoStrip(`최근 시작 장벽 ${report.averageBarrier}`));
  }
}

export function renderDashboard(report, latestSession) {
  const warningList = document.getElementById('warning-list');
  const statusCards = document.getElementById('status-cards');
  const trendSummary = document.getElementById('trend-summary');
  const archetypeSummary = document.getElementById('archetype-summary');
  const recommended = document.getElementById('recommended-actions');

  [warningList, statusCards, trendSummary, archetypeSummary, recommended].forEach(clear);

  if (!report.recent.length) {
    warningList.appendChild(makeInfoStrip('아직 기록이 없습니다. 세션을 시작해 주세요.', 'warn'));
    return;
  }

  const warningTexts = [
    `최근 7회 평균 보정 정확도는 ${report.averageCalibration}점입니다.`,
    `가장 자주 보인 주원인은 ${CAUSE_LABELS[report.topCause] || '없음'}입니다.`,
    `최근 대표 경향은 ${TYPE_LABELS[report.topType] || '없음'}입니다.`
  ];
  warningTexts.forEach((text, index) => {
    warningList.appendChild(makeInfoStrip(text, index === 1 ? 'warn' : ''));
  });

  const cards = [
    ['Calibration', report.averageCalibration, '예상과 실제의 맞음 정도'],
    ['Start Barrier', report.averageBarrier, '시작 진입 비용'],
    ['Recall Quality', report.averageRecall, '설명/인출 근거'],
    ['Self-Criticism', report.averageSelfCriticism, '자기비난 해석 강도']
  ];

  cards.forEach(([label, value, desc]) => {
    const card = el('div', 'pill-card');
    const strong = el('strong', '', label);
    const metric = el('div', 'metric-value', String(value));
    const subtle = el('div', 'subtle', desc);
    card.append(strong, metric, subtle);
    statusCards.appendChild(card);
  });

  if (report.experimentSummary.best.length) {
    report.experimentSummary.best.forEach((item) => {
      trendSummary.appendChild(makeInfoStrip(`${item.label} · 평균 반응 ${item.avg} (${item.count}회)`));
    });
  } else {
    trendSummary.appendChild(makeInfoStrip('아직 평가된 실험이 없습니다.', 'warn'));
  }

  const archetype = el('div', 'metric-item');
  const title = el('strong', '', '최근 대표 병목');
  const badges = el('div', 'badge-row');
  badges.append(
    badge(CAUSE_LABELS[report.topCause] || '없음', 'warn'),
    badge(TYPE_LABELS[report.topType] || '없음')
  );
  archetype.append(title, badges);
  if (latestSession?.analysis?.insight?.summary) {
    archetype.appendChild(el('p', 'subtle', latestSession.analysis.insight.summary));
  }
  archetypeSummary.appendChild(archetype);

  const experiments = latestSession?.analysis?.recommendedExperiments || [];
  if (experiments.length) {
    experiments.forEach((experiment) => {
      recommended.appendChild(makeInfoStrip(`${experiment.label} — ${experiment.description}`, 'good'));
    });
  } else {
    recommended.appendChild(makeInfoStrip('추천할 실험이 아직 없습니다.', 'warn'));
  }
}

function badge(text, tone = '') {
  return el('span', `badge ${tone}`.trim(), text);
}

export function renderCurrentSession(session) {
  const container = document.getElementById('current-session-card');
  clear(container);
  if (!session) {
    container.appendChild(makeInfoStrip('현재 진행 중인 세션이 없습니다.', 'warn'));
    return;
  }

  const card = el('div', 'metric-item');
  card.appendChild(el('strong', '', `${session.context.subject} · ${session.context.taskType}`));
  card.appendChild(el('div', 'subtle', session.context.taskDetail));

  const row = el('div', 'badge-row');
  row.append(
    badge(`예상 ${session.prediction.predictedAmount}분`),
    badge(`시작 난이도 ${session.prediction.startDifficulty}`, 'warn'),
    badge(session.prediction.moodBefore)
  );
  card.appendChild(row);

  if (session.progress.midCheck.used) {
    card.appendChild(el('p', 'subtle', `중간 체크: ${session.progress.midCheck.responseTaken}`));
  } else {
    card.appendChild(el('p', 'subtle', '중간 체크 없음'));
  }
  container.appendChild(card);
}

export function renderInsight(latestSession) {
  const empty = document.getElementById('insight-empty');
  const content = document.getElementById('insight-content');
  clear(content);

  if (!latestSession?.analysis) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  content.classList.remove('hidden');

  const { analysis } = latestSession;

  const left = el('article', 'card');
  left.innerHTML = `
    <div class="card-head"><div><p class="eyebrow">이번 세션 가설</p><h3>${analysis.typeLabels[0] || '세션 분석'}</h3></div></div>
    <div class="badge-row">${analysis.typeLabels.map((label) => `<span class="badge warn">${label}</span>`).join('')}</div>
    <div class="insight-card">
      <strong>핵심 요약</strong>
      <p>${analysis.insight.summary}</p>
    </div>
    <div class="insight-card">
      <strong>주요 원인</strong>
      <p>${analysis.causes.slice(0, 3).map((cause) => `${cause.label} ${cause.score}`).join(' · ')}</p>
    </div>
    <div class="insight-card">
      <strong>다음 조정</strong>
      <p>${analysis.insight.nextAdjustment}</p>
    </div>
  `;

  const right = el('article', 'card');
  right.innerHTML = `
    <div class="card-head"><div><p class="eyebrow">핵심 지표</p><h3>세션 진단</h3></div></div>
    <div class="metric-item"><strong>Calibration Score</strong>${progressHTML(analysis.metrics.calibrationScore)}</div>
    <div class="metric-item"><strong>Start Barrier Index</strong>${progressHTML(analysis.metrics.startBarrierIndex)}</div>
    <div class="metric-item"><strong>Recall Quality</strong>${progressHTML(analysis.metrics.recallQuality)}</div>
    <div class="metric-item"><strong>Self-Criticism Risk</strong>${progressHTML(analysis.metrics.selfCriticismRisk)}</div>
  `;

  const experimentCard = el('div', 'insight-card');
  experimentCard.appendChild(el('strong', '', '추천 실험'));
  const list = el('div', 'stack');
  (analysis.recommendedExperiments || []).forEach((experiment) => {
    list.appendChild(makeInfoStrip(`${experiment.label} — ${experiment.description}`, 'good'));
  });
  experimentCard.appendChild(list);
  right.appendChild(experimentCard);

  content.append(left, right);
}

export function renderPattern(report) {
  const overview = document.getElementById('pattern-overview');
  const subjectPatterns = document.getElementById('subject-patterns');
  const causePatterns = document.getElementById('cause-patterns');
  const metricPatterns = document.getElementById('metric-patterns');
  const typePatterns = document.getElementById('type-patterns');

  [overview, subjectPatterns, causePatterns, metricPatterns, typePatterns].forEach(clear);

  if (!report.recent.length) {
    overview.appendChild(makeInfoStrip('아직 분석할 기록이 없습니다.', 'warn'));
    return;
  }

  [
    `최근 7회 평균 Calibration Score는 ${report.averageCalibration}입니다.`,
    `최근 시작 장벽 평균은 ${report.averageBarrier}입니다.`,
    `최근 자기비난 위험 평균은 ${report.averageSelfCriticism}입니다.`
  ].forEach((text) => overview.appendChild(makeInfoStrip(text)));

  Object.entries(report.subjectStats).forEach(([subject, stats]) => {
    const item = el('div', 'subject-item');
    item.appendChild(el('strong', '', subject));
    item.appendChild(el('div', 'subtle', `보정 ${stats.calibration} · 장벽 ${stats.barrier} · 자기비난 ${stats.selfCriticism}`));
    const badges = el('div', 'badge-row');
    badges.appendChild(badge(TYPE_LABELS[stats.topType] || '없음'));
    item.appendChild(badges);
    subjectPatterns.appendChild(item);
  });

  Object.entries(report.causeCount).sort((a, b) => b[1] - a[1]).forEach(([cause, count]) => {
    causePatterns.appendChild(makeInfoStrip(`${CAUSE_LABELS[cause]} · ${count}회`, 'warn'));
  });

  [
    `보정 정확도 평균 ${report.averageCalibration}`,
    `인출/회상 품질 평균 ${report.averageRecall}`,
    `실험 평가 수 ${report.experimentSummary.recentEvaluated}`
  ].forEach((text) => metricPatterns.appendChild(makeInfoStrip(text)));

  Object.entries(report.typeCount).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    typePatterns.appendChild(makeInfoStrip(`${TYPE_LABELS[type]} · ${count}회`));
  });
}

export function renderArchive(sessions) {
  const container = document.getElementById('archive-list');
  clear(container);

  if (!sessions.length) {
    container.appendChild(makeInfoStrip('저장된 세션이 없습니다.', 'warn'));
    return;
  }

  [...sessions].reverse().forEach((session) => {
    const card = el('div', 'archive-item');
    const title = el('strong', '', `${session.context.subject} · ${session.context.taskType}`);
    const detail = el('div', 'subtle', session.context.taskDetail);
    const badges = el('div', 'badge-row');
    badges.append(
      badge(`예상 ${session.prediction.predictedAmount}분`),
      badge(`실제 ${session.outcome.actualAmount}분`),
      badge(session.analysis?.causes?.[0]?.label || '분석 없음', 'warn')
    );
    const note = el('p', 'subtle', session.analysis?.insight?.summary || '');
    card.append(title, detail, badges, note);
    container.appendChild(card);
  });
}

export function updateRoute(route) {
  document.querySelectorAll('.nav-link').forEach((button) => {
    button.classList.toggle('active', button.dataset.route === route);
  });
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('active', view.id === `${route}-view`);
  });

  const titleMap = {
    dashboard: '대시보드',
    session: '세션',
    insight: '인사이트',
    pattern: '패턴',
    archive: '아카이브'
  };
  document.getElementById('page-title').textContent = titleMap[route] || 'Meta';
}

export function fillExperimentChoices(select, experiments) {
  clear(select);
  experiments.forEach((experiment) => {
    const option = document.createElement('option');
    option.value = experiment.key;
    option.textContent = experiment.label;
    select.appendChild(option);
  });
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
