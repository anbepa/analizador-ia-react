export const getSessionId = () => {
  let sessionId = sessionStorage.getItem('qa_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('qa_session_id', sessionId);
  }
  return sessionId;
};
