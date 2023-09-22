function calculateGamePlayTime(sessions: { duration: number }[]) {
  return sessions.reduce((memo, x) => memo + x.duration, 0)
}

export default calculateGamePlayTime
