export const API_URL = import.meta.env.PROD ? "" : "http://localhost:3000";

export const PYTHON_API_URL = "https://justinyz-career-advisor-api.hf.space";

export const API_ENDPOINTS = {
  BASE_URL: API_URL,
  
  LOGIN: `${API_URL}/api/login`,
  REGISTER: `${API_URL}/api/register`,
  REFRESH: `${API_URL}/api/refresh`,
  LOGOUT: `${API_URL}/api/logout`,
  
  QUESTIONS: `${API_URL}/api/questions`,
  TEST_RESULTS: `${API_URL}/api/test-results`,
  
  CHATBOT: `${API_URL}/api/chatbot/message`,
  
  CAREER_ANALYSIS: `${PYTHON_API_URL}/api/analyze-career`
}