/*
 * 메타인지 스터디 플래너의 주요 로직을 담은 파일입니다.
 * 이 스크립트는 페이지 내비게이션, 폼 처리, 세션 저장,
 * 분석 및 패턴 요약 기능을 담당합니다.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 모든 페이지 요소를 가져옵니다.
  const pages = document.querySelectorAll('.page');

  /**
   * 주어진 페이지 id를 활성화하고 다른 페이지는 숨깁니다.
   * @param {string} id - 표시할 페이지의 id
   */
  function showPage(id) {
    pages.forEach(page => page.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) {
      target.classList.add('active');
    }
  }

  // 네비게이션 링크 클릭 시 페이지 전환
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      showPage(target);
      // 페이지 전환 시 필요한 데이터 갱신
      if (target === 'home') updateHome();
      if (target === 'pattern') updatePattern();
    });
  });

  /**
   * 세션 배열을 로드합니다.
   * @returns {Array<Object>} 세션 목록
   */
  function loadSessions() {
    return JSON.parse(localStorage.getItem('sessions') || '[]');
  }

  /**
   * 세션 배열을 저장합니다.
   * @param {Array<Object>} sessions - 저장할 세션 목록
   */
  function saveSessions(sessions) {
    localStorage.setItem('sessions', JSON.stringify(sessions));
  }

  /**
   * 현재 진행 중인 세션을 저장합니다.
   * @param {Object} session - 진행 중인 세션
   */
  function saveCurrentSession(session) {
    localStorage.setItem('currentSession', JSON.stringify(session));
  }

  /**
   * 현재 진행 중인 세션을 로드합니다.
   * @returns {Object|null} 현재 세션 또는 null
   */
  function loadCurrentSession() {
    return JSON.parse(localStorage.getItem('currentSession') || 'null');
  }

  /**
   * 현재 진행 중인 세션을 초기화합니다.
   */
  function clearCurrentSession() {
    localStorage.removeItem('currentSession');
  }

  // 시작 폼 처리
  const startForm = document.getElementById('start-form');
  startForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // 폼 값 추출
    const session = {
      id: 'session_' + Date.now(),
      date: new Date().toISOString(),
      subject: document.getElementById('subject').value.trim(),
      taskDetail: document.getElementById('taskDetail').value.trim(),
      predictedAmount: Number(document.getElementById('predictedAmount').value),
      startDifficulty: Number(document.getElementById('startDifficulty').value),
      predictedFocus: Number(document.getElementById('predictedFocus').value),
      predictedUnderstanding: Number(document.getElementById('predictedUnderstanding').value),
      moodBefore: document.getElementById('moodBefore').value
    };
    // 현재 세션 저장
    saveCurrentSession(session);
    document.getElementById('start-message').textContent = '세션이 시작되었습니다. 공부를 마친 후 종료 체크를 해 주세요.';
    // 종료 페이지로 이동
    showPage('end');
  });

  // 종료 폼 처리
  const endForm = document.getElementById('end-form');
  endForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const current = loadCurrentSession();
    if (!current) {
      // 진행 중인 세션이 없다면 메시지를 표시
      document.getElementById('end-message').textContent = '시작된 세션이 없습니다. 먼저 시작 전 체크를 진행하세요.';
      return;
    }
    // 실제 수행 정보 추출
    const session = Object.assign({}, current, {
      actualAmount: Number(document.getElementById('actualAmount').value),
      actualFocus: Number(document.getElementById('actualFocus').value),
      actualUnderstanding: Number(document.getElementById('actualUnderstanding').value),
      interruptions: Number(document.getElementById('interruptions').value),
      mainObstacle: document.getElementById('mainObstacle').value,
      recallSummary: document.getElementById('recallSummary').value.trim(),
      stuckPoint: document.getElementById('stuckPoint').value.trim(),
      overallFeeling: document.getElementById('overallFeeling').value
    });
    // 분석 계산
    const analysis = computeAnalysis(session);
    session.analysis = analysis;
    // 세션 목록에 추가 후 저장
    const sessions = loadSessions();
    sessions.push(session);
    saveSessions(sessions);
    // 현재 세션 초기화
    clearCurrentSession();
    // 분석 페이지 업데이트 및 표시
    updateAnalysis(analysis, session);
    showPage('analysis');
    // 폼 리셋
    endForm.reset();
    startForm.reset();
  });

  /**
   * 세션 분석을 수행합니다.
   * @param {Object} session - 세션 객체
   * @returns {Object} 분석 결과
   */
  function computeAnalysis(session) {
    const amountGap = session.actualAmount - session.predictedAmount;
    const focusGap = session.actualFocus - session.predictedFocus;
    const understandingGap = session.actualUnderstanding - session.predictedUnderstanding;
    // 회상 품질은 한 줄 요약과 막힌 지점 길이를 통해 간단 평가합니다.
    let recallQuality = 0;
    if (session.recallSummary && session.recallSummary.length >= 20 && session.stuckPoint && session.stuckPoint.length >= 5) {
      recallQuality = 1;
    }
    // 자기평가 경향 판정
    let miscalibrationType = '정확';
    if (amountGap < -0.2 * session.predictedAmount || focusGap <= -2 || understandingGap <= -2) {
      miscalibrationType = '과대평가';
    } else if (amountGap > 0.2 * session.predictedAmount || focusGap >= 2 || understandingGap >= 2) {
      miscalibrationType = '과소평가';
    }
    // 주 원인 판정
    let primaryCause = '';
    if (session.startDifficulty >= 4 && session.actualAmount < 0.5 * session.predictedAmount) {
      primaryCause = '시작 장벽';
    } else if (session.interruptions >= 3) {
      primaryCause = '환경 간섭';
    } else if (['불안', '무기력', '회피', '피곤'].includes(session.moodBefore)) {
      primaryCause = '감정 문제';
    } else if (session.actualUnderstanding <= 2) {
      primaryCause = '전략 부적합';
    } else if (session.actualFocus <= 2) {
      primaryCause = '피로 또는 집중 문제';
    } else {
      primaryCause = '미확인';
    }
    return {
      amountGap,
      focusGap,
      understandingGap,
      recallQuality,
      miscalibrationType,
      primaryCause
    };
  }

  /**
   * 분석 페이지를 업데이트합니다.
   * @param {Object} analysis - 분석 결과
   * @param {Object} session - 전체 세션 객체
   */
  function updateAnalysis(analysis, session) {
    const container = document.getElementById('analysis-content');
    container.innerHTML = '';
    const list = document.createElement('ul');
    // 예상 대비 실제값 표시
    const li1 = document.createElement('li');
    li1.textContent = `예상 공부시간 대비 실제: ${session.actualAmount}분 / ${session.predictedAmount}분 (차이 ${analysis.amountGap}분)`;
    const li2 = document.createElement('li');
    li2.textContent = `예상 집중도 대비 실제: ${session.actualFocus} / ${session.predictedFocus} (차이 ${analysis.focusGap})`;
    const li3 = document.createElement('li');
    li3.textContent = `예상 이해도 대비 실제: ${session.actualUnderstanding} / ${session.predictedUnderstanding} (차이 ${analysis.understandingGap})`;
    const li4 = document.createElement('li');
    li4.textContent = `회상 품질: ${analysis.recallQuality ? '양호' : '불충분'}`;
    const li5 = document.createElement('li');
    li5.textContent = `자기 평가 경향: ${analysis.miscalibrationType}`;
    const li6 = document.createElement('li');
    li6.textContent = `주요 원인: ${analysis.primaryCause}`;
    list.append(li1, li2, li3, li4, li5, li6);
    container.appendChild(list);
    // 해석 및 제안
    const suggestion = document.createElement('p');
    suggestion.textContent = suggestMessage(analysis.primaryCause, analysis.miscalibrationType);
    container.appendChild(suggestion);
  }

  /**
   * 주 원인과 자기평가 경향을 기반으로 사용자에게 제안 메시지를 생성합니다.
   * @param {string} cause - 주 원인
   * @param {string} miscalibration - 자기평가 경향
   * @returns {string} 제안 메시지
   */
  function suggestMessage(cause, miscalibration) {
    let msg = '';
    if (miscalibration === '과대평가') {
      msg += '예상보다 수행이 낮았습니다. ';
    } else if (miscalibration === '과소평가') {
      msg += '예상보다 수행이 좋았습니다. ';
    } else {
      msg += '예상과 실제가 비슷했습니다. ';
    }
    switch (cause) {
      case '시작 장벽':
        msg += '시작하기 어려웠던 것 같습니다. 진입 장벽을 낮추는 방법을 찾아보세요.';
        break;
      case '환경 간섭':
        msg += '환경적 방해가 컸습니다. 방해 요인을 줄일 수 있는 환경을 만들어 보세요.';
        break;
      case '감정 문제':
        msg += '감정 상태가 영향을 미쳤습니다. 감정 조절을 위한 루틴을 시도해 보세요.';
        break;
      case '전략 부적합':
        msg += '공부 방법이 잘 맞지 않은 것 같습니다. 다른 전략을 시도해 보세요.';
        break;
      case '피로 또는 집중 문제':
        msg += '피로가 있거나 집중이 어려웠습니다. 휴식을 취하거나 집중 시간을 줄여 보세요.';
        break;
      default:
        msg += '데이터가 충분하지 않아 원인을 알기 어렵습니다.';
        break;
    }
    return msg;
  }

  /**
   * 홈 대시보드 내용을 업데이트합니다. 마지막 세션 요약을 보여줍니다.
   */
  function updateHome() {
    const sessions = loadSessions();
    const homeSummary = document.getElementById('home-summary');
    homeSummary.innerHTML = '';
    if (sessions.length === 0) {
      homeSummary.textContent = '기록된 세션이 없습니다.';
      return;
    }
    const last = sessions[sessions.length - 1];
    const p = document.createElement('p');
    p.innerHTML = `<strong>마지막 세션 요약:</strong> ${last.subject} - ${last.taskDetail}<br>` +
      `수행 시간: ${last.actualAmount}분 / ${last.predictedAmount}분, 집중도 ${last.actualFocus}/${last.predictedFocus}, 이해도 ${last.actualUnderstanding}/${last.predictedUnderstanding}<br>` +
      `자기 평가 경향: ${last.analysis.miscalibrationType}, 주요 원인: ${last.analysis.primaryCause}`;
    homeSummary.appendChild(p);
  }

  /**
   * 패턴 페이지를 업데이트합니다. 최근 7개 세션을 요약합니다.
   */
  function updatePattern() {
    const sessions = loadSessions();
    const container = document.getElementById('pattern-content');
    container.innerHTML = '';
    if (sessions.length === 0) {
      container.textContent = '아직 세션 기록이 없습니다.';
      return;
    }
    const recent = sessions.slice(-7);
    let totalPredAmount = 0, totalActAmount = 0;
    let startSum = 0;
    let miscalCount = { '과대평가': 0, '과소평가': 0, '정확': 0 };
    let causeCount = {};
    recent.forEach(s => {
      totalPredAmount += s.predictedAmount;
      totalActAmount += s.actualAmount;
      startSum += s.startDifficulty;
      miscalCount[s.analysis.miscalibrationType] = (miscalCount[s.analysis.miscalibrationType] || 0) + 1;
      const cause = s.analysis.primaryCause;
      causeCount[cause] = (causeCount[cause] || 0) + 1;
    });
    const avgPred = (totalPredAmount / recent.length).toFixed(1);
    const avgAct = (totalActAmount / recent.length).toFixed(1);
    const avgStart = (startSum / recent.length).toFixed(1);
    const summary = document.createElement('p');
    summary.innerHTML = `<strong>최근 ${recent.length}개 세션 평균:</strong><br>` +
      `예상 공부시간: ${avgPred}분, 실제 공부시간: ${avgAct}분<br>` +
      `평균 시작 난이도: ${avgStart}`;
    container.appendChild(summary);
    const miscal = document.createElement('p');
    miscal.innerHTML = `<strong>자기 평가 경향:</strong> 과대평가 ${miscalCount['과대평가'] || 0}회, 과소평가 ${miscalCount['과소평가'] || 0}회, 정확 ${miscalCount['정확'] || 0}회`;
    container.appendChild(miscal);
    const causeList = document.createElement('p');
    const causeStr = Object.entries(causeCount).map(([cause, count]) => `${cause} ${count}회`).join(', ');
    causeList.innerHTML = `<strong>자주 등장하는 원인:</strong> ${causeStr}`;
    container.appendChild(causeList);
  }

  // 초기 표시 설정
  showPage('home');
  updateHome();
});
