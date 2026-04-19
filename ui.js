import { SUBJECT_OPTIONS, TASK_TYPE_OPTIONS, MOOD_OPTIONS, OBSTACLE_OPTIONS, FEELING_OPTIONS, TYPE_LABELS, CAUSE_LABELS } from './data.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function clear(node) {
  node.innerHTML = '';
}

function progressHTML(value) {
  return `
    <div class="progress-bar"><div class="progress-fill" style="width:${value}%"></div></div>
    <div class="subtle">${value}/100</div>
  `;
}

export function initSelectOptions() {
  const subject = document.getElementById('subject');
  const taskType = document.getElementById('task-type');
  const obstacle = document.getElementById('main-obstacle');
  const feeling = document.getElementById('overall-feeling');
  const archiveSubject = document.getElementById('archive-subject-filter');
  const archiveType = document.getElementById('archive-type-filter');

  subject.innerHTML = SUBJECT_OPTIONS.map((item) => `<option value="${item}">${item}</option>`).join('');
  taskType.innerHTML = TASK_TYPE_OPTIONS.map((item) => `<option value="${item}">${item}</option>`).join('');
  obstacle.innerHTML = OBSTACLE_OPTIONS.map((item) => `<option value="${item}">${item}</option>`).join('');
  feeling.innerHTML = FEELING_OPTIONS.map((item) => `<option value="${item}">${item}</option>`).join('');
  archiveSubject.innerHTML = ['전체', ...SUBJECT_OPTIONS].map((item) => `<option value="${item}">${item}</option>`).join('');
  archiveType.innerHTML = ['전체', ...TASK_TYPE_OPTIONS].map((item) => `<option value="${item}">${item}</option>`).join('');
}

export function renderMoodOptions(selectedMood) {
  const container = document.getElementById('mood-options');
  clear(container);
  MOOD_OPTIONS.forEach((item) => {
    const button = el('button', `choice-chip${item === selectedMood ? ' active' : ''}`, item);
    button.type = 'button';
    button.dataset.mood = item;
    container.appendChild(button);
  });
}

export function updateRangeValue(inputId, outputId) {
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);
  if (input && output) {
    output.textContent = input.value;
  }
}

export function renderSidebarStatus(report, latestSession) {
  const container = document.getElementById('sidebar-status');
  clear(container);
  const items = [
    ['보정 정확도', `${report.averageCalibration || 0}/100`],
    ['시작 장벽', `${report.averageBarrier || 0}/100`],
    ['이해 신뢰도', `${report.averageRecall || 0}/100`],
    ['최근 대표 유형', latestSession?.analysis?.typeLabels?.[0] || '없음']
  ];
  items.forEach(([label, value]) => {
    const card = el('div', 'info-strip');
    card.innerHTML = `<strong>${label}</strong><span>${value}</span>`;
    container.appendChild(card);
  });
}

export function renderDashboard(report, warnings, actions, latestSession) {
  const warningList = document.getElementById('warning-list');
  const statusCards = document.getElementById('status-cards');
  const trendSummary = document.getElementById('trend-summary');
  const archetypeSummary = document.getElementById('archetype-summary');
  const recommended = document.getElementById('recommended-actions');

  clear(warningList);
  clear(statusCards);
  clear(trendSummary);
  clear(archetypeSummary);
  clear(recommended);

  warnings.forEach((text) => {
    const item = el('div', 'warning-item');
    item.innerHTML = `<strong>주의</strong><span>${text}</span>`;
    warningList.appendChild(item);
  });

  const cards = [
    ['Calibration Score', report.averageCalibration || 0, '예상과 실제의 맞음 정도'],
    ['Start Barrier', report.averageBarrier || 0, '시작 진입 비용'],
    ['Recall Reliability', report.averageRecall || 0, '설명 가능성'],
    ['Self-Criticism Risk', report.averageSelfCriticism || 0, '자기비난 위험도']
  ];

  cards.forEach(([label, value, desc]) => {
    const card = el('div', 'pill-card');
    card.innerHTML = `<strong>${label}</strong><div class="metric-value">${value}</div><div class="subtle">${desc}</div>`;
    statusCards.appendChild(card);
  });

  const trendItems = [
    `최근 7회 평균 보정 정확도는 ${report.averageCalibration || 0}점입니다.`,
    `최근 대표 원인은 ${CAUSE_LABELS[report.topCause] || '없음'}입니다.`,
    `최근 대표 유형은 ${TYPE_LABELS[report.topType] || '없음'}입니다.`
  ];
  trendItems.forEach((text, index) => {
    const item = el('div', `info-strip ${index === 0 ? 'good' : index === 1 ? 'warn' : ''}`);
    item.textContent = text;
    trendSummary.appendChild(item);
  });

  const archetype = el('div', 'metric-item');
  archetype.innerHTML = `
    <strong>현재 가장 두드러지는 패턴</strong>
    <div class="badge-row">
      <span class="badge warn">${TYPE_LABELS[report.topType] || '없음'}</span>
      <span class="badge">${CAUSE_LABELS[report.topCause] || '없음'}</span>
    </div>
    <p class="subtle">${latestSession?.analysis?.insight?.summary || '아직 인사이트가 없습니다.'}</p>
  `;
  archetypeSummary.appendChild(archetype);

  actions.forEach((text) => {
    const item = el('div', 'info-strip good');
    item.textContent = text;
    recommended.appendChild(item);
  });
}

export function renderCurrentSession(session) {
  const container = document.getElementById('current-session-card');
  clear(container);
  if (!session) {
    container.innerHTML = `<div class="info-strip warn">현재 진행 중인 세션이 없습니다.</div>`;
    return;
  }

  const card = el('div', 'metric-item');
  const startedAt = new Date(session.createdAt).toLocaleString('ko-KR');
  const mood = session.moodBefore || '미선택';
  const midUsed = session.midCheck?.used ? '중간 체크 있음' : '중간 체크 없음';
  card.innerHTML = `
    <strong>${session.subject} · ${session.taskType}</strong>
    <div class="subtle">${session.taskDetail}</div>
    <div class="badge-row">
      <span class="badge">예상 ${session.predictedAmount}분</span>
      <span class="badge warn">시작 난이도 ${session.startDifficulty}</span>
      <span class="badge">${mood}</span>
    </div>
    <p class="subtle">시작 시각: ${startedAt}</p>
    <p class="subtle">${midUsed}</p>
  `;
  container.appendChild(card);
}

export function renderInsight(latestSession) {
  const empty = document.getElementById('insight-empty');
  const content = document.getElementById('insight-content');
  clear(content);

  if (!latestSession) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  content.classList.remove('hidden');

  const { analysis } = latestSession;

  const left = el('article', 'card');
  left.innerHTML = `
    <div class="card-head"><div><p class="eyebrow">오늘의 판정</p><h3>${analysis.typeLabels[0]}</h3></div></div>
    <div class="badge-row">${analysis.typeLabels.map((label) => `<span class="badge warn">${label}</span>`).join('')}</div>
    <div class="insight-card">
      <strong>핵심 요약</strong>
      <p>${analysis.insight.summary}</p>
    </div>
    <div class="insight-card">
      <strong>주요 원인</strong>
      <p>${analysis.primaryCauseLabel}</p>
    </div>
    <div class="insight-card">
      <strong>다음 조정</strong>
      <p>${analysis.insight.nextAdjustment}</p>
    </div>
  `;

  const right = el('article', 'card');
  right.innerHTML = `
    <div class="card-head"><div><p class="eyebrow">핵심 지표</p><h3>세션 진단</h3></div></div>
    <div class="metric-item"><strong>Calibration Score</strong>${progressHTML(analysis.calibrationScore)}</div>
    <div class="metric-item"><strong>Start Barrier Index</strong>${progressHTML(analysis.startBarrierIndex)}</div>
    <div class="metric-item"><strong>Recall Reliability</strong>${progressHTML(analysis.recallReliability)}</div>
    <div class="metric-item"><strong>Self-Criticism Risk</strong>${progressHTML(analysis.selfCriticismRisk)}</div>
  `;

  content.appendChild(left);
  content.appendChild(right);
}

export function renderPattern(report) {
  const overview = document.getElementById('pattern-overview');
  const subjectPatterns = document.getElementById('subject-patterns');
  const causePatterns = document.getElementById('cause-patterns');
  const metricPatterns = document.getElementById('metric-patterns');
  const typePatterns = document.getElementById('type-patterns');

  [overview, subjectPatterns, causePatterns, metricPatterns, typePatterns].forEach(clear);

  if (!report.recent.length) {
    overview.innerHTML = `<div class="info-strip warn">아직 분석할 기록이 없습니다.</div>`;
    return;
  }

  [
    `최근 7회 평균 Calibration Score는 ${report.averageCalibration}입니다.`,
    `최근 시작 장벽 평균은 ${report.averageBarrier}입니다.`,
    `최근 자기비난 위험 평균은 ${report.averageSelfCriticism}입니다.`
  ].forEach((text) => {
    const item = el('div', 'info-strip');
    item.textContent = text;
    overview.appendChild(item);
  });

  Object.entries(report.subjectStats).forEach(([subject, stats]) => {
    const item = el('div', 'subject-item');
    item.innerHTML = `
      <strong>${subject}</strong>
      <div class="subtle">보정 정확도 ${stats.calibration} · 시작 장벽 ${stats.barrier} · 자기비난 ${stats.selfCriticism}</div>
      <div class="badge-row"><span class="badge">${TYPE_LABELS[stats.topType]}</span></div>
    `;
    subjectPatterns.appendChild(item);
  });

  Object.entries(report.causeCount).sort((a, b) => b[1] - a[1]).forEach(([cause, count]) => {
    const item = el('div', 'metric-item');
    item.innerHTML = `<strong>${CAUSE_LABELS[cause]}</strong><div class="metric-value">${count}</div>`;
    causePatterns.appendChild(item);
  });

  [
    ['Calibration Score', report.averageCalibration],
    ['Start Barrier Index', report.averageBarrier],
    ['Recall Reliability', report.averageRecall],
    ['Self-Criticism Risk', report.averageSelfCriticism]
  ].forEach(([label, value]) => {
    const item = el('div', 'metric-item');
    item.innerHTML = `<strong>${label}</strong><div class="metric-value">${value}</div>`;
    metricPatterns.appendChild(item);
  });

  Object.entries(report.typeCount).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    const item = el('div', 'metric-item');
    item.innerHTML = `<strong>${TYPE_LABELS[type]}</strong><div class="metric-value">${count}</div>`;
    typePatterns.appendChild(item);
  });
}

export function renderArchive(sessions, filters) {
  const archiveList = document.getElementById('archive-list');
  clear(archiveList);

  const filtered = sessions
    .filter((session) => filters.subject === '전체' || session.subject === filters.subject)
    .filter((session) => filters.type === '전체' || session.taskType === filters.type)
    .slice()
    .reverse();

  if (!filtered.length) {
    archiveList.innerHTML = `<div class="info-strip warn">조건에 맞는 기록이 없습니다.</div>`;
    return;
  }

  filtered.forEach((session) => {
    const item = el('div', 'archive-item');
    const createdAt = new Date(session.createdAt).toLocaleString('ko-KR');
    item.innerHTML = `
      <strong>${session.subject} · ${session.taskType}</strong>
      <div class="subtle">${session.taskDetail}</div>
      <div class="badge-row">
        <span class="badge">${session.analysis.typeLabels[0]}</span>
        <span class="badge warn">${session.analysis.primaryCauseLabel}</span>
        <span class="badge good">보정 ${session.analysis.calibrationScore}</span>
      </div>
      <p class="subtle">${createdAt}</p>
      <p>${session.analysis.insight.summary}</p>
    `;
    archiveList.appendChild(item);
  });
}

export function setActiveRoute(route) {
  document.querySelectorAll('.nav-link').forEach((button) => {
    button.classList.toggle('active', button.dataset.route === route);
  });

  document.querySelectorAll('.view').forEach((view) => {
    const shouldShow = view.id === `${route}-view`;
    view.classList.toggle('active', shouldShow);
  });

  const pageTitle = document.getElementById('page-title');
  const labels = {
    dashboard: '대시보드',
    session: '세션',
    insight: '인사이트',
    pattern: '패턴',
    archive: '아카이브'
  };
  pageTitle.textContent = labels[route] || 'Meta';
}
