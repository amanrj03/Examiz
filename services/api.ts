import axios, { type AxiosProgressEvent } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Request timed out. Please check your connection and try again.';
    } else if (error.code === 'ERR_NETWORK') {
      error.userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.response?.status === 503) {
      error.userMessage = error.response.data?.message || 'Service temporarily unavailable.';
    } else if (error.response?.status >= 500) {
      error.userMessage = error.response.data?.error || error.response.data?.message || 'Server error. Please try again later.';
    } else if (error.response?.status === 404) {
      error.userMessage = 'Resource not found.';
    } else if (error.response?.status >= 400) {
      error.userMessage = error.response.data?.error || error.response.data?.message || `Request failed (${error.response.status}).`;
    } else {
      error.userMessage = 'An unexpected error occurred.';
    }
    return Promise.reject(error);
  }
);

export const testAPI = {
  createTest: (formData: FormData, onUploadProgress?: (e: AxiosProgressEvent) => void) =>
    api.post('/tests', formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress }),
  saveDraft: (formData: FormData, onUploadProgress?: (e: AxiosProgressEvent) => void) =>
    api.post('/tests', formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress }),
  getAllTests: () => api.get('/tests'),
  getLiveTests: () => api.get('/tests/live'),
  getTestById: (id: string) => api.get(`/tests/${id}`),
  updateTest: (id: string, formData: FormData, onUploadProgress?: (e: AxiosProgressEvent) => void) =>
    api.put(`/tests/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress }),
  toggleTestLive: (id: string, isLive: boolean) => api.patch(`/tests/${id}/toggle-live`, { isLive }),
  deleteTest: (id: string) => api.delete(`/tests/${id}`),
};

export const attemptAPI = {
  startTest: (data: object) => api.post('/attempts/start', data),
  syncAnswers: (data: object) => api.post('/attempts/sync', data),
  submitTest: (data: object) => api.post('/attempts/submit', data),
  updateWarning: (data: object) => api.post('/attempts/warning', data),
  getAttempt: (id: string) => api.get(`/attempts/${id}`),
  getUserAttempts: (candidateName: string) =>
    api.get(`/attempts/user/${encodeURIComponent(candidateName)}`),
  requestResume: (data: object) => api.post('/attempts/request-resume', data),
  allowResume: (data: object) => api.post('/attempts/allow-resume', data),
  getResumeRequests: () => api.get('/attempts/resume-requests'),
  syncTimeData: (attemptId: string, data: object) =>
    api.put(`/attempts/${attemptId}/sync-times`, data),
  recalculateMarks: (attemptId: string) => api.post(`/attempts/${attemptId}/recalculate`),
  deleteAttempt: (attemptId: string) => api.delete(`/attempts/${attemptId}`),
};

export default api;
