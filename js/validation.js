export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function requireCurrentSession(currentSession) {
  if (!currentSession) {
    throw new Error('진행 중인 세션이 없습니다. 먼저 세션을 시작해 주세요.');
  }
}

export function validateStartPayload(payload) {
  if (!payload.taskDetail.trim()) {
    throw new Error('오늘 할 내용을 입력해 주세요.');
  }
  if (payload.predictedAmount < 5) {
    throw new Error('예상 공부량은 5분 이상으로 입력해 주세요.');
  }
}

export function validateEndPayload(payload) {
  if (payload.actualAmount < 0) {
    throw new Error('실제 공부량은 0 이상이어야 합니다.');
  }
  if (!payload.mainObstacle) {
    throw new Error('주요 방해 요인을 선택해 주세요.');
  }
  if (!payload.overallFeeling) {
    throw new Error('오늘의 체감을 선택해 주세요.');
  }
}
